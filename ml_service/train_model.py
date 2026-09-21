import argparse

import pandas as pd

from model import (
    fetch_data_gov_records,
    fetch_fairtrade_records,
    save_model_artifact,
    train_random_forest_model,
)
from prediction_model import normalize_price_data


def usable_record_count(df: pd.DataFrame) -> int:
    try:
        return len(normalize_price_data(df))
    except ValueError:
        return 0


def main():
    parser = argparse.ArgumentParser(description="Train the FairTrade RandomForest price prediction model.")
    parser.add_argument("--crop", default="Wheat")
    parser.add_argument("--state", default="Rajasthan")
    parser.add_argument("--district", default="Jaipur")
    parser.add_argument("--market", default=None)
    parser.add_argument("--limit", type=int, default=50000)
    args = parser.parse_args()

    data_gov_df = pd.DataFrame()
    try:
        data_gov_df = fetch_data_gov_records(
            state=args.state,
            district=args.district,
            commodity=args.crop,
            market=args.market,
            limit=args.limit,
        )
    except Exception as error:
        print(f"data.gov fetch failed: {error}")

    data_gov_usable = usable_record_count(data_gov_df)
    print(f"data.gov records found: {len(data_gov_df)} usable: {data_gov_usable}")

    frames = []
    if data_gov_usable:
        frames.append(data_gov_df)

    fairtrade_df = pd.DataFrame()
    if not data_gov_usable:
        fairtrade_df = fetch_fairtrade_records(crop=args.crop, state=args.state, district=args.district, market=args.market)
    fairtrade_usable = usable_record_count(fairtrade_df)
    print(f"FairTrade records found: {len(fairtrade_df)} usable: {fairtrade_usable}")
    if fairtrade_usable:
        frames.append(fairtrade_df)

    if not frames:
        raise SystemExit("No records found from data.gov.in or FairTrade PostgreSQL.")

    training_df = pd.concat(frames, ignore_index=True)
    print(f"total training records: {len(training_df)} usable: {usable_record_count(training_df)}")
    model, prepared = train_random_forest_model(training_df)
    print(f"selected training mode: {'lagged' if getattr(model, 'fairtrade_model_name', '').endswith('lag-features') else 'non-lagged fallback'}")
    model_path = save_model_artifact(model, prepared)
    print(f"final training rows: {len(prepared)}")
    print(f"artifact path: {model_path}")


if __name__ == "__main__":
    main()
