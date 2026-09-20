import os

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn

from model import fetch_fairtrade_records, load_model_artifact, predict_future_prices

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


@app.get("/health")
def health():
    try:
        get_artifact()
        return {"status": "ok", "model_loaded": True}
    except FileNotFoundError:
        return {"status": "ok", "model_loaded": False}


@app.post("/predict")
def predict(payload: PredictionRequest):
    try:
        artifact = get_artifact()
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error))

    fairtrade_history = None
    db_error = None
    try:
        fairtrade_history = fetch_fairtrade_records(
            crop=payload.crop,
            state=payload.state,
            district=payload.district,
            market=payload.market,
        )
    except Exception as error:
        db_error = str(error)

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

    return {
        "crop": payload.crop,
        "state": payload.state,
        "district": payload.district,
        "market": payload.market,
        "prediction_days": payload.prediction_days,
        "database_warning": db_error,
        **result,
    }


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.getenv("PORT", "8001")))
