from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
import requests
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_GOV_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"

CATEGORICAL_FEATURES = ["Commodity", "District", "Grade", "Market", "State", "Variety"]
NUMERICAL_FEATURES = ["Year", "Month", "Day", "DayOfWeek", "WeekOfYear"]
LAG_FEATURES = ["Modal_Price_Lag_1", "Modal_Price_Lag_2", "Modal_Price_Lag_7"]
NON_LAG_MODEL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
MODEL_FEATURES = NON_LAG_MODEL_FEATURES + LAG_FEATURES
HISTORY_COLUMNS = ["Arrival_Date", *CATEGORICAL_FEATURES, "Modal_Price"]
GROUP_COLUMNS = ["Commodity", "State", "District", "Market"]


def fetch_mandai_data(
    *,
    url: str,
    api_key: str,
    state: str,
    district: str,
    commodity: str,
    market: str | None = None,
    limit: int = 5000,
) -> pd.DataFrame:
    if not api_key:
        raise ValueError("DATA_GOV_API_KEY is required to fetch mandi records.")

    params = {
        "api-key": api_key,
        "format": "json",
        "filters[State]": state,
        "filters[District]": district,
        "filters[Commodity]": commodity,
        "limit": limit,
    }
    if market:
        params["filters[Market]"] = market

    response = requests.get(url, params=params, headers={"User-Agent": "FairTrade-ML/1.0"}, timeout=30)
    response.raise_for_status()
    payload = response.json()
    return pd.DataFrame(payload.get("records", []))


def normalize_price_data(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=[*HISTORY_COLUMNS, *NUMERICAL_FEATURES])

    normalized = df.copy()
    for column in CATEGORICAL_FEATURES:
        if column not in normalized:
            normalized[column] = "Unknown"
        normalized[column] = normalized[column].fillna("Unknown").astype(str).replace("", "Unknown")

    if "Arrival_Date" not in normalized:
        raise ValueError("Arrival_Date is required in training data.")

    normalized["Arrival_Date"] = pd.to_datetime(normalized["Arrival_Date"], format="mixed", dayfirst=True, errors="coerce")
    normalized["Modal_Price"] = pd.to_numeric(normalized.get("Modal_Price"), errors="coerce")
    normalized["Min_Price"] = pd.to_numeric(normalized.get("Min_Price", normalized["Modal_Price"]), errors="coerce")
    normalized["Max_Price"] = pd.to_numeric(normalized.get("Max_Price", normalized["Modal_Price"]), errors="coerce")
    normalized.dropna(subset=["Arrival_Date", "Modal_Price"], inplace=True)
    normalized["Min_Price"] = normalized["Min_Price"].fillna(normalized["Modal_Price"])
    normalized["Max_Price"] = normalized["Max_Price"].fillna(normalized["Modal_Price"])
    add_date_features(normalized)
    return normalized.sort_values("Arrival_Date")


def add_date_features(df: pd.DataFrame) -> None:
    df["Year"] = df["Arrival_Date"].dt.year
    df["Month"] = df["Arrival_Date"].dt.month
    df["Day"] = df["Arrival_Date"].dt.day
    df["DayOfWeek"] = df["Arrival_Date"].dt.dayofweek
    df["WeekOfYear"] = df["Arrival_Date"].dt.isocalendar().week.astype(int)


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    normalized = normalize_price_data(df)
    if normalized.empty:
        return normalized

    lagged = normalized.sort_values([*GROUP_COLUMNS, "Arrival_Date"]).copy()
    group = lagged.groupby(GROUP_COLUMNS, dropna=False)["Modal_Price"]
    lagged["Modal_Price_Lag_1"] = group.shift(1)
    lagged["Modal_Price_Lag_2"] = group.shift(2)
    lagged["Modal_Price_Lag_7"] = group.shift(7)
    lagged.dropna(subset=LAG_FEATURES, inplace=True)
    return lagged


def has_genuine_lag_history(df: pd.DataFrame) -> bool:
    if df.empty:
        return False

    date_counts = df.groupby(GROUP_COLUMNS, dropna=False)["Arrival_Date"].nunique()
    return bool((date_counts >= 8).any())


def create_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES)],
        remainder="passthrough",
    )


def train_random_forest_model(df: pd.DataFrame, *, min_training_rows: int = 20):
    normalized = normalize_price_data(df)
    if len(normalized) < min_training_rows:
        raise ValueError("Not enough usable price records to train the RandomForest model.")

    model_features = NON_LAG_MODEL_FEATURES
    model_name = "tanmay-random-forest-non-lag-fallback"
    prepared = normalized

    if has_genuine_lag_history(normalized):
        lagged = add_lag_features(normalized)
        if len(lagged) >= min_training_rows:
            prepared = lagged
            model_features = MODEL_FEATURES
            model_name = "tanmay-random-forest-lag-features"

    if len(prepared) < min_training_rows:
        raise ValueError("Not enough price records to train the RandomForest model.")

    pipeline = Pipeline(
        steps=[
            ("preprocessor", create_preprocessor()),
            ("regressor", RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)),
        ]
    )
    pipeline.fit(prepared[model_features], prepared["Modal_Price"])
    pipeline.fairtrade_features = model_features
    pipeline.fairtrade_model_name = model_name
    return pipeline, prepared


def build_model_artifact(model: Pipeline, prepared_df: pd.DataFrame) -> dict[str, Any]:
    history = normalize_price_data(prepared_df).sort_values("Arrival_Date").tail(30000)
    features = getattr(model, "fairtrade_features", MODEL_FEATURES)
    return {
        "model": model,
        "history": history[HISTORY_COLUMNS],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": features,
        "model_name": getattr(model, "fairtrade_model_name", "tanmay-random-forest-lag-features"),
    }


def save_model_artifact(model: Pipeline, prepared_df: pd.DataFrame, model_path: Path) -> Path:
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(build_model_artifact(model, prepared_df), model_path)
    return model_path


def load_model_artifact(model_path: Path):
    if not model_path.exists():
        raise FileNotFoundError(f"Trained Tanmay model not found at {model_path}. Run ml_service/train_model.py first.")
    return joblib.load(model_path)


def merge_prediction_history(artifact_history: pd.DataFrame, fairtrade_history: pd.DataFrame) -> pd.DataFrame:
    frames = [artifact_history]
    if fairtrade_history is not None and not fairtrade_history.empty:
        frames.append(fairtrade_history)
    return normalize_price_data(pd.concat(frames, ignore_index=True))


def select_history(df: pd.DataFrame, crop: str, state: str, district: str, market: str) -> pd.DataFrame:
    if df.empty:
        return df

    exact = df[
        (df["Commodity"].str.lower() == crop.lower())
        & (df["State"].str.lower() == state.lower())
        & (df["District"].str.lower() == district.lower())
        & (df["Market"].str.lower() == market.lower())
    ]
    if len(exact) >= 7:
        return exact

    district_level = df[
        (df["Commodity"].str.lower() == crop.lower())
        & (df["State"].str.lower() == state.lower())
        & (df["District"].str.lower() == district.lower())
    ]
    if len(district_level) >= 7:
        return district_level

    crop_level = df[df["Commodity"].str.lower() == crop.lower()]
    return crop_level if len(crop_level) >= 7 else exact


def select_latest_price_history(df: pd.DataFrame, crop: str, state: str, district: str, market: str) -> pd.DataFrame:
    if df.empty:
        return df

    exact = df[
        (df["Commodity"].str.lower() == crop.lower())
        & (df["State"].str.lower() == state.lower())
        & (df["District"].str.lower() == district.lower())
        & (df["Market"].str.lower() == market.lower())
    ]
    if not exact.empty:
        return exact

    crop_state = df[(df["Commodity"].str.lower() == crop.lower()) & (df["State"].str.lower() == state.lower())]
    if not crop_state.empty:
        return crop_state

    crop_level = df[df["Commodity"].str.lower() == crop.lower()]
    return crop_level if not crop_level.empty else exact


def predict_future_prices(
    *,
    artifact,
    crop: str,
    state: str,
    district: str,
    market: str,
    prediction_days: int,
    fairtrade_history: pd.DataFrame | None = None,
    prediction_date=None,
) -> dict[str, Any]:
    model = artifact["model"]
    model_features = artifact.get("features", MODEL_FEATURES)
    history = merge_prediction_history(artifact["history"], fairtrade_history if fairtrade_history is not None else pd.DataFrame())
    if prediction_date is not None:
        cutoff = pd.to_datetime(prediction_date, errors="coerce")
        if pd.isna(cutoff):
            raise ValueError("prediction_date must be a valid date.")
        history = history[history["Arrival_Date"] <= cutoff]
    selected = select_history(history, crop, state, district, market).sort_values("Arrival_Date")
    if any(feature in model_features for feature in LAG_FEATURES) and len(selected) < 7:
        raise ValueError("Not enough historical data for this crop/market. Train the model with more records.")

    latest_selected = select_latest_price_history(history, crop, state, district, market).sort_values("Arrival_Date")
    if latest_selected.empty:
        raise ValueError("Not enough historical data for this crop/market. Train the model with more records.")

    last_row = (selected if not selected.empty else latest_selected).iloc[-1]
    lag_buffer = selected["Modal_Price"].tail(7).astype(float).tolist() if not selected.empty else []
    current_date = latest_selected["Arrival_Date"].max()
    predictions: list[dict[str, Any]] = []

    for _ in range(prediction_days):
        next_date = current_date + pd.Timedelta(days=1)
        row_data = {
            "Commodity": crop,
            "District": district,
            "Grade": last_row.get("Grade", "Fair Trade"),
            "Market": market,
            "State": state,
            "Variety": last_row.get("Variety", "Fair Trade"),
            "Year": next_date.year,
            "Month": next_date.month,
            "Day": next_date.day,
            "DayOfWeek": next_date.dayofweek,
            "WeekOfYear": int(next_date.isocalendar().week),
        }
        if any(feature in model_features for feature in LAG_FEATURES):
            row_data["Modal_Price_Lag_1"] = lag_buffer[-1]
            row_data["Modal_Price_Lag_2"] = lag_buffer[-2]
            row_data["Modal_Price_Lag_7"] = lag_buffer[-7]

        row = pd.DataFrame([row_data])
        predicted = float(model.predict(row[model_features])[0])
        predictions.append(
            {
                "date": next_date.date().isoformat(),
                "predicted_price": round(predicted, 2),
                "low": round(predicted * 0.96, 2),
                "high": round(predicted * 1.04, 2),
                "confidence": 82,
            }
        )
        if any(feature in model_features for feature in LAG_FEATURES):
            lag_buffer.append(predicted)
            lag_buffer = lag_buffer[-7:]
        current_date = next_date

    current_price = float(latest_selected["Modal_Price"].iloc[-1])
    return {
        "current_price": round(current_price, 2),
        "predictions": predictions,
        "trained_at": artifact.get("trained_at"),
    }
