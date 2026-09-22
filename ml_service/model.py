from __future__ import annotations

import os
import sys
from pathlib import Path

import pandas as pd
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import prediction_model as tanmay_model

load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / "server" / ".env")
load_dotenv(ROOT_DIR / ".env")

_configured_model_path = Path(os.getenv("ML_MODEL_PATH", "artifacts/tanmay_price_model.joblib"))
MODEL_PATH = _configured_model_path if _configured_model_path.is_absolute() else BASE_DIR / _configured_model_path


def get_int_env(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        return default
    return max(value, 1)


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required for FairTrade ML data access.")
    return database_url


def get_connection():
    connect_timeout = get_int_env("ML_DB_CONNECT_TIMEOUT_SECONDS", 3)
    statement_timeout_ms = get_int_env("ML_DB_STATEMENT_TIMEOUT_MS", 2500)
    return psycopg2.connect(
        get_database_url(),
        connect_timeout=connect_timeout,
        options=f"-c statement_timeout={statement_timeout_ms}",
    )


def fetch_data_gov_records(
    state: str,
    district: str,
    commodity: str,
    market: str | None = None,
    limit: int = 5000,
) -> pd.DataFrame:
    api_key = os.getenv("DATA_GOV_API_KEY")
    if not api_key:
        raise RuntimeError("DATA_GOV_API_KEY is required to train from data.gov.in records.")

    return tanmay_model.fetch_mandai_data(
        url=tanmay_model.DATA_GOV_URL,
        api_key=api_key,
        state=state,
        district=district,
        commodity=commodity,
        market=market,
        limit=limit,
    )


def fetch_fairtrade_records(
    crop: str | None = None,
    state: str | None = None,
    district: str | None = None,
    market: str | None = None,
) -> pd.DataFrame:
    clauses = []
    params: list[str] = []

    if crop:
        params.append(crop)
        clauses.append("LOWER(crop) = LOWER(%s)")
    if state:
        params.append(state)
        clauses.append("LOWER(state) = LOWER(%s)")
    if district:
        params.append(district)
        clauses.append("LOWER(city) = LOWER(%s)")
    if market:
        params.append(market)
        clauses.append("LOWER(mandi) = LOWER(%s)")

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT
          crop AS "Commodity",
          updated_at AS "Arrival_Date",
          mandi AS "Market",
          city AS "District",
          state AS "State",
          grade AS "Grade",
          current_price AS "Modal_Price",
          low AS "Min_Price",
          high AS "Max_Price",
          grade AS "Variety"
        FROM market_quotes
        {where_sql}
    """

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute(sql, params)
            return pd.DataFrame(cursor.fetchall())


def train_random_forest_model(df: pd.DataFrame):
    return tanmay_model.train_random_forest_model(df)


def save_model_artifact(model, prepared_df: pd.DataFrame, model_path: Path = MODEL_PATH) -> Path:
    return tanmay_model.save_model_artifact(model, prepared_df, model_path)


def load_model_artifact(model_path: Path = MODEL_PATH):
    return tanmay_model.load_model_artifact(model_path)


def predict_future_prices(
    artifact,
    crop: str,
    state: str,
    district: str,
    market: str,
    prediction_days: int,
    fairtrade_history: pd.DataFrame | None = None,
):
    return tanmay_model.predict_future_prices(
        artifact=artifact,
        crop=crop,
        state=state,
        district=district,
        market=market,
        prediction_days=prediction_days,
        fairtrade_history=fairtrade_history,
    )
