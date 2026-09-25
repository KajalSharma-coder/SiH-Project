import os
import sys
from datetime import date
import logging
from time import perf_counter

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from .model import MODEL_PATH, fetch_fairtrade_records, load_model_artifact, predict_future_prices
except ImportError:
    from model import MODEL_PATH, fetch_fairtrade_records, load_model_artifact, predict_future_prices

app = FastAPI(title="FairTrade ML Price Prediction Service")
_artifact = None

logging.basicConfig(level=os.getenv("ML_LOG_LEVEL", "INFO"))
logger = logging.getLogger("fairtrade.ml")


class PredictionRequest(BaseModel):
    crop: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    district: str = Field(..., min_length=1)
    market: str = Field(..., min_length=1)
    prediction_days: int = Field(7, ge=1, le=30)
    prediction_date: date | None = None


def get_artifact():
    global _artifact
    if _artifact is None:
        started_at = perf_counter()
        _artifact = load_model_artifact()
        logger.info(
            "ML model artifact loaded model_path=%s duration_ms=%.2f",
            str(MODEL_PATH),
            (perf_counter() - started_at) * 1000,
        )
    return _artifact


@app.on_event("startup")
def startup():
    try:
        get_artifact()
    except Exception as error:
        message = (
            "FairTrade ML service failed to start. "
            f"Could not load RandomForest model artifact at {MODEL_PATH}. "
            "Set ML_MODEL_PATH or run ml_service/train_model.py to create the artifact."
        )
        print(message, file=sys.stderr)
        logger.exception("ML startup failed: model artifact could not be loaded")
        raise RuntimeError(message) from error

    if not os.getenv("DATABASE_URL"):
        logger.warning("DATABASE_URL is not set. Predictions will use packaged model history only.")
    else:
        logger.info("ML service startup complete; model loaded and DATABASE_URL configured")


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _artifact is not None}


@app.post("/predict")
def predict(payload: PredictionRequest):
    request_started_at = perf_counter()
    request_log = {
        "crop": payload.crop,
        "state": payload.state,
        "district": payload.district,
        "market": payload.market,
        "prediction_days": payload.prediction_days,
    }
    logger.info("ML prediction request received %s", request_log)

    try:
        artifact = get_artifact()
    except FileNotFoundError as error:
        logger.exception("ML prediction failed: model artifact unavailable", extra=request_log)
        raise HTTPException(status_code=503, detail=str(error))

    fairtrade_history = None
    database_warning = None
    try:
        db_started_at = perf_counter()
        fairtrade_history = fetch_fairtrade_records(
            crop=payload.crop,
            state=payload.state,
            district=payload.district,
            market=payload.market,
        )
        logger.info(
            "ML database lookup completed duration_ms=%.2f records=%s request=%s",
            (perf_counter() - db_started_at) * 1000,
            int(len(fairtrade_history)),
            request_log,
        )
    except Exception as error:
        database_warning = f"FairTrade database lookup skipped: {error}"
        logger.warning(
            "ML database lookup failed; using packaged model history duration_ms=%.2f error=%s request=%s",
            (perf_counter() - db_started_at) * 1000,
            str(error),
            request_log,
        )

    try:
        prediction_started_at = perf_counter()
        result = predict_future_prices(
            artifact=artifact,
            crop=payload.crop,
            state=payload.state,
            district=payload.district,
            market=payload.market,
            prediction_days=payload.prediction_days,
            prediction_date=payload.prediction_date,
            fairtrade_history=fairtrade_history,
        )
        if database_warning:
            result["database_warning"] = database_warning
        logger.info(
            "ML prediction succeeded prediction_duration_ms=%.2f total_duration_ms=%.2f used_database_history=%s request=%s",
            (perf_counter() - prediction_started_at) * 1000,
            (perf_counter() - request_started_at) * 1000,
            fairtrade_history is not None and not fairtrade_history.empty,
            request_log,
        )
    except ValueError as error:
        logger.warning(
            "ML prediction validation/model data failure total_duration_ms=%.2f error=%s request=%s",
            (perf_counter() - request_started_at) * 1000,
            str(error),
            request_log,
        )
        raise HTTPException(status_code=422, detail=str(error))
    except Exception as error:
        logger.exception(
            "ML prediction failed unexpectedly total_duration_ms=%.2f error=%s request=%s",
            (perf_counter() - request_started_at) * 1000,
            str(error),
            request_log,
        )
        raise HTTPException(status_code=500, detail=str(error))

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8001")))
