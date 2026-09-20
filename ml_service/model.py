import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras
import requests
from dotenv import load_dotenv
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / "server" / ".env")
load_dotenv(ROOT_DIR / ".env")

DATA_GOV_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"
MODEL_PATH = Path(os.getenv("ML_MODEL_PATH", BASE_DIR / "artifacts" / "price_model.joblib"))

CATEGORICAL_FEATURES = ["Commodity", "District", "Grade", "Market", "State", "Variety"]
NUMERICAL_FEATURES = ["Year", "Month", "Day", "DayOfWeek", "WeekOfYear"]
LAG_FEATURES = ["Modal_Price_Lag_1", "Modal_Price_Lag_2", "Modal_Price_Lag_7"]
MODEL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES + LAG_FEATURES


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required for FairTrade ML data access.")
    return database_url


def get_connection():
    return psycopg2.connect(get_database_url())


def fetch_data_gov_records(state: str, district: str, commodity: str, market: str | None = None, limit: int = 5000) -> pd.DataFrame:
    api_key = os.getenv("DATA_GOV_API_KEY")
    if not api_key:
        raise RuntimeError("DATA_GOV_API_KEY is required to train from data.gov.in records.")

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

    response = requests.get(DATA_GOV_URL, params=params, headers={"User-Agent": "FairTrade-ML/1.0"}, timeout=30)
    response.raise_for_status()
    payload = response.json()
    return pd.DataFrame(payload.get("records", []))


def fetch_fairtrade_records(crop: str | None = None, state: str | None = None, district: str | None = None, market: str | None = None) -> pd.DataFrame:
    clauses = []
    params: list[str] = []

    if crop:
        params.append(crop)
        clauses.append(f"LOWER(d.crop) = LOWER(%s)")
    if state:
        params.append(state)
        clauses.append(f"LOWER(COALESCE(m.state, 'Rajasthan')) = LOWER(%s)")
    if district:
        params.append(district)
        clauses.append(f"LOWER(COALESCE(m.city, l.city, '')) = LOWER(%s)")
    if market:
        params.append(market)
        clauses.append(f"LOWER(COALESCE(m.name, l.mandi, 'FairTrade')) = LOWER(%s)")

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT
          d.crop AS "Commodity",
          d.date AS "Arrival_Date",
          COALESCE(m.name, l.mandi, 'FairTrade') AS "Market",
          COALESCE(m.city, l.city, '') AS "District",
          COALESCE(m.state, 'Rajasthan') AS "State",
          COALESCE(d.grade, l.grade, 'Fair Trade') AS "Grade",
          COALESCE(NULLIF(d.agreed_price, 0), NULLIF(d.offer, 0), NULLIF(d.counter_offer, 0), l.expected_price) AS "Modal_Price",
          COALESCE(NULLIF(d.agreed_price, 0), NULLIF(d.offer, 0), NULLIF(d.counter_offer, 0), l.expected_price) AS "Min_Price",
          COALESCE(NULLIF(d.agreed_price, 0), NULLIF(d.offer, 0), NULLIF(d.counter_offer, 0), l.expected_price) AS "Max_Price",
          'Fair Trade' AS "Variety"
        FROM deals d
        LEFT JOIN lots l ON l.id = d.lot_id
        LEFT JOIN markets m ON m.id = COALESCE(d.market_id, l.market_id)
        {where_sql}
    """

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute(sql, params)
            return pd.DataFrame(cursor.fetchall())


def normalize_price_data(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    normalized = df.copy()
    for column in CATEGORICAL_FEATURES:
        if column not in normalized:
            normalized[column] = "Unknown"
        normalized[column] = normalized[column].fillna("Unknown").astype(str).replace("", "Unknown")

    if "Arrival_Date" not in normalized:
        raise ValueError("Arrival_Date is required in training data.")

    normalized["Arrival_Date"] = pd.to_datetime(normalized["Arrival_Date"], format="mixed", dayfirst=True, errors="coerce")
    for column in ["Min_Price", "Max_Price", "Modal_Price"]:
        normalized[column] = pd.to_numeric(normalized.get(column), errors="coerce")

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
    lagged = df.sort_values(["Commodity", "State", "District", "Market", "Arrival_Date"]).copy()
    group = lagged.groupby(["Commodity", "State", "District", "Market"], dropna=False)["Modal_Price"]
    lagged["Modal_Price_Lag_1"] = group.shift(1)
    lagged["Modal_Price_Lag_2"] = group.shift(2)
    lagged["Modal_Price_Lag_7"] = group.shift(7)
    lagged.dropna(subset=LAG_FEATURES, inplace=True)
    return lagged


def train_random_forest_model(df: pd.DataFrame):
    prepared = add_lag_features(normalize_price_data(df))
    if len(prepared) < 20:
        raise ValueError("Not enough price records to train the RandomForest model.")

    preprocessor = ColumnTransformer(
        transformers=[("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES)],
        remainder="passthrough",
    )
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)),
        ]
    )
    pipeline.fit(prepared[MODEL_FEATURES], prepared["Modal_Price"])
    return pipeline, prepared


def save_model_artifact(model, prepared_df: pd.DataFrame, model_path: Path = MODEL_PATH) -> Path:
    model_path.parent.mkdir(parents=True, exist_ok=True)
    history = prepared_df.sort_values("Arrival_Date").tail(1000)
    artifact = {
        "model": model,
        "history": history[
            ["Arrival_Date", "Commodity", "District", "Grade", "Market", "State", "Variety", "Modal_Price"]
        ],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": MODEL_FEATURES,
    }
    joblib.dump(artifact, model_path)
    return model_path


def load_model_artifact(model_path: Path = MODEL_PATH):
    if not model_path.exists():
        raise FileNotFoundError(f"Trained model not found at {model_path}. Run ml_service/train_model.py first.")
    return joblib.load(model_path)


def merge_prediction_history(artifact_history: pd.DataFrame, fairtrade_history: pd.DataFrame) -> pd.DataFrame:
    frames = [artifact_history]
    if not fairtrade_history.empty:
        frames.append(fairtrade_history)
    return normalize_price_data(pd.concat(frames, ignore_index=True))


def select_history(df: pd.DataFrame, crop: str, state: str, district: str, market: str) -> pd.DataFrame:
    exact = df[
        (df["Commodity"].str.lower() == crop.lower())
        & (df["State"].str.lower() == state.lower())
        & (df["District"].str.lower() == district.lower())
        & (df["Market"].str.lower() == market.lower())
    ]
    if len(exact) >= 7:
        return exact

    crop_level = df[df["Commodity"].str.lower() == crop.lower()]
    return crop_level if len(crop_level) >= 7 else exact


def predict_future_prices(artifact, crop: str, state: str, district: str, market: str, prediction_days: int, fairtrade_history: pd.DataFrame | None = None):
    model = artifact["model"]
    history = merge_prediction_history(artifact["history"], fairtrade_history if fairtrade_history is not None else pd.DataFrame())
    selected = select_history(history, crop, state, district, market).sort_values("Arrival_Date")
    if len(selected) < 7:
        raise ValueError("Not enough historical data for this crop/market. Train the model with more records.")

    last_row = selected.iloc[-1]
    lag_buffer = selected["Modal_Price"].tail(7).astype(float).tolist()
    current_date = selected["Arrival_Date"].max()
    predictions = []

    for _ in range(prediction_days):
        next_date = current_date + pd.Timedelta(days=1)
        row = pd.DataFrame(
            [
                {
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
                    "Modal_Price_Lag_1": lag_buffer[-1],
                    "Modal_Price_Lag_2": lag_buffer[-2],
                    "Modal_Price_Lag_7": lag_buffer[-7],
                }
            ]
        )
        predicted = float(model.predict(row[MODEL_FEATURES])[0])
        predictions.append(
            {
                "date": next_date.date().isoformat(),
                "predicted_price": round(predicted, 2),
                "low": round(predicted * 0.96, 2),
                "high": round(predicted * 1.04, 2),
                "confidence": 82,
            }
        )
        lag_buffer.append(predicted)
        lag_buffer = lag_buffer[-7:]
        current_date = next_date

    current_price = float(selected["Modal_Price"].iloc[-1])
    return {
        "current_price": round(current_price, 2),
        "predictions": predictions,
        "trained_at": artifact.get("trained_at"),
    }
