import os
import sys

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from model import MODEL_PATH, fetch_fairtrade_records, load_model_artifact, predict_future_prices

app = FastAPI(title="FairTrade ML Price Prediction Service")
_artifact = None


class PredictionRequest(BaseModel):
    crop: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    district: str = Field(..., min_length=1)
    market: str = Field(..., min_length=1)
    prediction_days: int = Field(7, ge=1, le=30)


def get_artifact():
    global _artifact
    if _artifact is None:
        _artifact = load_model_artifact()
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
        raise RuntimeError(message) from error

    if not os.getenv("DATABASE_URL"):
        print(
            "FairTrade ML service warning: DATABASE_URL is not set. "
            "Predictions will use the packaged model history only.",
            file=sys.stderr,
        )


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _artifact is not None}


@app.post("/predict")
def predict(payload: PredictionRequest):
    try:
        artifact = get_artifact()
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error))

    fairtrade_history = None
    try:
        fairtrade_history = fetch_fairtrade_records(
            crop=payload.crop,
            state=payload.state,
            district=payload.district,
            market=payload.market,
        )
    except Exception:
        pass

    try:
        result = predict_future_prices(
            artifact=artifact,
            crop=payload.crop,
            state=payload.state,
            district=payload.district,
            market=payload.market,
            prediction_days=payload.prediction_days,
            fairtrade_history=fairtrade_history,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8001")))
