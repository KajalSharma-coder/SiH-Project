import argparse

import pandas as pd

from model import (
    fetch_data_gov_records,
    fetch_fairtrade_records,
    save_model_artifact,
    train_random_forest_model,
)


def main():
    parser = argparse.ArgumentParser(description="Train the FairTrade RandomForest price prediction model.")
    parser.add_argument("--crop", default="Wheat")
    parser.add_argument("--state", default="Rajasthan")
    parser.add_argument("--district", default="Jaipur")
    parser.add_argument("--market", default=None)
    parser.add_argument("--limit", type=int, default=50000)
    args = parser.parse_args()

    frames = []
    data_gov_df = fetch_data_gov_records(
        state=args.state,
        district=args.district,
        commodity=args.crop,
        market=args.market,
        limit=args.limit,
    )
    if not data_gov_df.empty:
        frames.append(data_gov_df)

    fairtrade_df = fetch_fairtrade_records(crop=args.crop, state=args.state, district=args.district, market=args.market)
    if not fairtrade_df.empty:
        frames.append(fairtrade_df)

    if not frames:
        raise SystemExit("No records found from data.gov.in or FairTrade PostgreSQL.")

    training_df = pd.concat(frames, ignore_index=True)
    model, prepared = train_random_forest_model(training_df)
    model_path = save_model_artifact(model, prepared)
    print(f"Trained RandomForest model saved to {model_path}")
    print(f"Training rows used after feature engineering: {len(prepared)}")


if __name__ == "__main__":
    main()
