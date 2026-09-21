import pandas as pd
import os
import requests
import numpy as np
from dotenv import load_dotenv
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import json
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

print("Imports done!")




load_dotenv()  # reads DATABASE_URL (and any other keys) from your .env file

app = FastAPI()

FAIR_TRADE_DATABASE_URL = os.getenv("Fair_Trade_Data_API") or os.getenv("DATABASE_URL")


def get_connection():
    """Opens a fresh connection to Neon using the pooled connection string."""
    if not FAIR_TRADE_DATABASE_URL:
        raise RuntimeError(
            "Fair_Trade_Data_API is not set — check your .env file"
        )
    return psycopg2.connect(FAIR_TRADE_DATABASE_URL)


@app.get("/deals")
def get_deals():
    """Returns every row in the deals table as JSON."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        # RealDictCursor makes each row come back as {"column_name": value, ...}
        # instead of a plain tuple, so FastAPI can serialize it to proper JSON.
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM deals;")
        rows = cursor.fetchall()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Always close, even if the query above raised an error.
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@app.get("/fair-trade-data")
def get_fair_trade_data():
    """Returns the Fair Trade records from the deals table as JSON."""
    return get_deals()


if __name__ == "__main__":
    records = get_fair_trade_data()








BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

url = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"



def fetch_mandai_data(url, api_key, state, district, commodity, limit=100):
    if not api_key:
        raise ValueError("DATA_GOV_API_KEY is missing. Add it to your .env file.")

    params = {
        "api-key": api_key,
        "format": "json",
        "filters[State]": state,
        "filters[District]": district,
        "filters[Commodity]": commodity,
        "limit": limit
    }

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(url, params=params, headers=headers, timeout=30)

    if response.status_code == 200:
        data = response.json()
        print(f"Total records fetched for {commodity} in {district}, {state}: {data.get('total', 'N/A')}")
        return pd.DataFrame(data["records"])
    else:
        print(f"Error fetching data: {response.status_code} - {response.text}")
        return pd.DataFrame()



selected_state = "Rajasthan"   #generalize these with FairTrade user data as per neede (API queries)
selected_district = "Jaipur"
selected_commodity = "Wheat"
selected_limit = 50000 
df = fetch_mandai_data(
    url=url,
    api_key=os.getenv("DATA_GOV_API_KEY"),
    state=selected_state,
    district=selected_district,
    commodity=selected_commodity,
    limit=selected_limit
)

# Add completed Fair Trade records to the government records using the
# equivalent fields expected by the training pipeline.
fair_trade_records = get_fair_trade_data()
fair_trade_df = pd.DataFrame(fair_trade_records)
if not fair_trade_df.empty:
    fair_trade_df = fair_trade_df.rename(columns={
        'crop': 'Commodity',
        'date': 'Arrival_Date',
        'market_name': 'Market',
        'city': 'District',
        'state': 'State',
        'agreed_price': 'Modal_Price'
    })
    fair_trade_df['Min_Price'] = fair_trade_df['Modal_Price']
    fair_trade_df['Max_Price'] = fair_trade_df['Modal_Price']
    fair_trade_df['Grade'] = fair_trade_df.get('Grade', 'Fair Trade')
    fair_trade_df['Variety'] = fair_trade_df.get('Variety', 'Fair Trade')

    matching_columns = [
        'Arrival_Date', 'Commodity', 'District', 'Grade', 'Market',
        'Max_Price', 'Min_Price', 'Modal_Price', 'State', 'Variety'
    ]
    df = pd.concat([df, fair_trade_df.reindex(columns=matching_columns)], ignore_index=True)

 
df['Arrival_Date'] = pd.to_datetime(df['Arrival_Date'], format='mixed', dayfirst=True)

df['Min_Price'] = pd.to_numeric(df['Min_Price'], errors='coerce')
df['Max_Price'] = pd.to_numeric(df['Max_Price'], errors='coerce')
df['Modal_Price'] = pd.to_numeric(df['Modal_Price'], errors='coerce')
df.dropna(subset=['Min_Price', 'Max_Price', 'Modal_Price'], inplace=True)

df['Year'] = df['Arrival_Date'].dt.year
df['Month'] = df['Arrival_Date'].dt.month
df['Day'] = df['Arrival_Date'].dt.day
df['DayOfWeek'] = df['Arrival_Date'].dt.dayofweek
df['WeekOfYear'] = df['Arrival_Date'].dt.isocalendar().week

categorical_features = ['Commodity', 'District', 'Grade', 'Market', 'State', 'Variety']
for column in categorical_features:
    df[column] = df[column].fillna('Unknown').astype(str)


# Identify categorical and numerical features
# Identify numerical features
numerical_features = ['Year', 'Month', 'Day', 'DayOfWeek', 'WeekOfYear']

# Get all unique categories for each categorical feature from the full dataset
# This ensures the OneHotEncoder learns all possible categories upfront
all_categories = [df[col].unique().tolist() for col in categorical_features]

# Create a OneHotEncoder with the learned categories
# This encoder will then always output the same number of features, even if a specific category
# is missing in a subset of data (due to handle_unknown='ignore').
ohe_fixed = OneHotEncoder(categories=all_categories, handle_unknown='ignore')

# Create a column transformer for one-hot encoding categorical features
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', ohe_fixed, categorical_features) # Use the fixed OHE here
    ],
    remainder='passthrough' # Keep numerical features as they are
)

X = df[categorical_features + numerical_features]
y = df['Modal_Price']



df_sorted = df.sort_values('Arrival_Date')

df_recent_30k = df_sorted.tail(30000)

test_size = 2000

train_df = df_recent_30k.iloc[:-test_size]
test_df = df_recent_30k.iloc[-test_size:]

X_train = train_df[categorical_features + numerical_features]
y_train = train_df['Modal_Price']
X_test = test_df[categorical_features + numerical_features]
y_test = test_df['Modal_Price']


def train_and_evaluate_commodity_model(commodity_name, df_full, categorical_features, numerical_features, preprocessor, test_size=200):
    print(f"\n--- Processing Commodity: {commodity_name} ---")

    # Filter data for the specific commodity and sort by date for correct lagging
    commodity_df = df_full[df_full['Commodity'] == commodity_name].sort_values('Arrival_Date')

    # --- Add Lagged Features ---
    commodity_df['Modal_Price_Lag_1'] = commodity_df['Modal_Price'].shift(1)
    commodity_df['Modal_Price_Lag_2'] = commodity_df['Modal_Price'].shift(2)
    commodity_df['Modal_Price_Lag_7'] = commodity_df['Modal_Price'].shift(7)

    initial_rows = len(commodity_df)
    commodity_df.dropna(subset=['Modal_Price_Lag_1', 'Modal_Price_Lag_2', 'Modal_Price_Lag_7'], inplace=True)
    if len(commodity_df) < initial_rows:
        pass
    if len(commodity_df) < test_size * 2 + 7: # Ensure enough data for a meaningful split AND lags
        return None, None, None, None # Return None for results, model, train_df, test_df if insufficient data

    # Determine train/test split for this commodity
    train_commodity_df = commodity_df.iloc[:-test_size].copy() # Use .copy() to avoid SettingWithCopyWarning
    test_commodity_df = commodity_df.iloc[-test_size:].copy()   # Use .copy() to avoid SettingWithCopyWarning

    X_train_c = train_commodity_df[categorical_features + numerical_features]
    y_train_c = train_commodity_df['Modal_Price']
    X_test_c = test_commodity_df[categorical_features + numerical_features]
    y_test_c = test_commodity_df['Modal_Price']


    # Create a fresh pipeline for each commodity
    model_pipeline_c = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    try:
        # Train the model
        model_pipeline_c.fit(X_train_c, y_train_c)

        # Save the model
        model_filename_c = f'random_forest_model_{commodity_name.replace(" ", "_").replace("/", "_")}.joblib'
        joblib.dump(model_pipeline_c, model_filename_c)

        # Make predictions
        y_pred_c = model_pipeline_c.predict(X_test_c)

        # Evaluate
        mae_c = mean_absolute_error(y_test_c, y_pred_c)
        mse_c = mean_squared_error(y_test_c, y_pred_c)
        rmse_c = np.sqrt(mse_c)
        r2_c = r2_score(y_test_c, y_pred_c)


        results_c = {
            'Commodity': commodity_name,
            'Training_Size': len(X_train_c),
            'Testing_Size': len(X_test_c),
            'MAE': mae_c,
            'RMSE': rmse_c,
            'R2': r2_c
        }
        return results_c, model_pipeline_c, train_commodity_df, test_commodity_df

    except Exception as e:
        return None, None, None, None

unique_commodities = df['Commodity'].unique()

all_commodity_results = []
commodity_models_with_data = {}

for commodity in unique_commodities:
    results_c, model_c, train_df_c, test_df_c = train_and_evaluate_commodity_model(commodity, df, categorical_features, numerical_features, preprocessor, test_size=200)
    if results_c:
        all_commodity_results.append(results_c)
        commodity_models_with_data[commodity] = {
            'model': model_c,
            'train_df': train_df_c,
            'test_df': test_df_c
        }

if all_commodity_results:
    commodity_results_df = pd.DataFrame(all_commodity_results)




def predict_future_prices(model, last_known_data, days_to_predict, categorical_features, numerical_features):
    """
    Predicts future prices for a given number of days using a trained model,
    iteratively generating lagged features.

    Args:
        model: The trained scikit-learn pipeline (including preprocessor and regressor).
        last_known_data (pd.DataFrame): The last few rows of data for the specific commodity/market,
                                        used to infer features and initial lags for future predictions.
        days_to_predict (int): The number of days into the future to predict.
        categorical_features (list): List of categorical feature column names.
        numerical_features (list): List of original numerical features (e.g., 'Year', 'Month').

    Returns:
        pd.DataFrame: A DataFrame containing 'Arrival_Date' and 'Predicted_Modal_Price' for future dates.
    """
    if last_known_data.empty:
        return pd.DataFrame(columns=['Arrival_Date', 'Predicted_Modal_Price'])

    # Ensure last_known_data is sorted by date and contains Modal_Price and lagged features
    last_known_data = last_known_data.sort_values('Arrival_Date').copy()

    # We need a rolling window of Modal_Price to calculate future lags.
    # The last 7 actual Modal_Price values are needed for the first future prediction's lags.
    # Adjust buffer size based on the max lag (which is 7 here).
    # Initialize lag_buffer with the last 7 Modal_Price values from the provided data.
    lag_buffer = last_known_data['Modal_Price'].tail(7).tolist()

    future_predictions_list = []
    current_date = last_known_data['Arrival_Date'].max()

    for i in range(1, days_to_predict + 1):
        next_date = current_date + pd.Timedelta(days=1)

        # Create a DataFrame for the single next day's prediction
        single_day_df = pd.DataFrame({'Arrival_Date': [next_date]})

        # Copy categorical features from the last known data point (assuming they remain constant)
        for feature in categorical_features:
            single_day_df[feature] = last_known_data[feature].iloc[-1]

        # Generate time-based numerical features for the next date
        single_day_df['Year'] = next_date.year
        single_day_df['Month'] = next_date.month
        single_day_df['Day'] = next_date.day
        single_day_df['DayOfWeek'] = next_date.dayofweek
        single_day_df['WeekOfYear'] = next_date.isocalendar().week

        # Generate lagged features using the lag_buffer
        # Ensure we have enough elements in the buffer for each lag
        single_day_df['Modal_Price_Lag_1'] = lag_buffer[-1] if len(lag_buffer) >= 1 else np.nan
        single_day_df['Modal_Price_Lag_2'] = lag_buffer[-2] if len(lag_buffer) >= 2 else np.nan
        single_day_df['Modal_Price_Lag_7'] = lag_buffer[-7] if len(lag_buffer) >= 7 else np.nan

        # The model was trained with specific features including lags.
        # We need to provide all of them to the model for prediction.
        features_for_prediction = categorical_features + numerical_features + ['Modal_Price_Lag_1', 'Modal_Price_Lag_2', 'Modal_Price_Lag_7']

        # Ensure the columns in single_day_df match the expected features_for_prediction
        X_predict_input = single_day_df[features_for_prediction]

        # Predict price for the next day
        predicted_price = model.predict(X_predict_input)[0]

        # Append the prediction to the results list
        future_predictions_list.append({
            'Arrival_Date': next_date,
            'Predicted_Modal_Price': predicted_price
        })

        # Update the lag buffer with the newly predicted price for the next iteration
        lag_buffer.append(predicted_price)
        if len(lag_buffer) > 7: # Keep buffer size fixed to max lag
            lag_buffer.pop(0)

        current_date = next_date

    predictions_df = pd.DataFrame(future_predictions_list)
    return predictions_df


demo_commodity = selected_commodity

if demo_commodity in commodity_models_with_data:
    # Retrieve the model and the test data for the chosen commodity
    model_for_prediction = commodity_models_with_data[demo_commodity]['model']
    last_known_data_for_prediction = commodity_models_with_data[demo_commodity]['test_df']

    # Define the number of days to predict
    days_to_predict = 7

    # Call the prediction function
    future_predictions = predict_future_prices(
        model_for_prediction,
        last_known_data_for_prediction,
        days_to_predict,
        categorical_features,
        numerical_features
    )

    print(f"\n7-Day Price Predictions for {demo_commodity}:")
    print(future_predictions)

    # Optional: Plot actual vs predicted for the test set + future predictions
    # Get actual prices from the test set for comparison
    actual_prices = commodity_models_with_data[demo_commodity]['test_df']\
                        [['Arrival_Date', 'Modal_Price']].rename(columns={'Modal_Price': 'Actual_Modal_Price'})

    # Get predictions for the test set
    X_test_demo = last_known_data_for_prediction[categorical_features + numerical_features]
    y_test_pred_demo = model_for_prediction.predict(X_test_demo)
    test_predictions_df = pd.DataFrame({
        'Arrival_Date': last_known_data_for_prediction['Arrival_Date'],
        'Predicted_Modal_Price': y_test_pred_demo
    })

    import matplotlib.pyplot as plt
    import seaborn as sns

    plt.figure(figsize=(15, 7))
    sns.lineplot(x='Arrival_Date', y='Actual_Modal_Price', data=actual_prices, label='Actual Prices (Test Set)')
    sns.lineplot(x='Arrival_Date', y='Predicted_Modal_Price', data=test_predictions_df, label='Predicted Prices (Test Set)')
    sns.lineplot(x='Arrival_Date', y='Predicted_Modal_Price', data=future_predictions, label='Future Predictions (7 Days)', linestyle='--')

    plt.title(f'Modal Price Prediction for {demo_commodity}')
    plt.xlabel('Date')
    plt.ylabel('Modal Price')
    plt.legend()
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

else:
    print(f"Model for '{demo_commodity}' not found or not trained successfully.")



# Filter the DataFrame for the selected commodity
commodity_specific_df = df[df['Commodity'] == selected_commodity]

# Count the number of records per market for the selected commodity
market_counts = commodity_specific_df['Market'].value_counts()

# Get the top 4 markets
top_n_markets = market_counts.head(4).index.tolist()

print(f"Top 4 markets for '{selected_commodity}' based on record count:\n{top_n_markets}")




def train_and_evaluate_market_model(commodity_name, market_name, df_full, categorical_features, base_numerical_features, preprocessor, test_size=200):
    print(f"\n--- Processing Commodity: {commodity_name}, Market: {market_name} ---")

    # Filter data for the specific commodity and market, and sort by date for correct lagging
    market_df = df_full[(df_full['Commodity'] == commodity_name) & (df_full['Market'] == market_name)].sort_values('Arrival_Date')

    # --- Add Lagged Features ---
    # Lags are calculated on the market-specific dataframe
    market_df['Modal_Price_Lag_1'] = market_df['Modal_Price'].shift(1)
    market_df['Modal_Price_Lag_2'] = market_df['Modal_Price'].shift(2)
    market_df['Modal_Price_Lag_7'] = market_df['Modal_Price'].shift(7)

    # Drop rows with NaN values resulting from creating lagged features
    initial_rows = len(market_df)
    market_df.dropna(subset=['Modal_Price_Lag_1', 'Modal_Price_Lag_2', 'Modal_Price_Lag_7'], inplace=True)
    if len(market_df) < initial_rows:
        print(f"  Dropped {initial_rows - len(market_df)} rows due to NaN values in lagged features.")

    if len(market_df) < test_size * 2 + 7: # Ensure enough data for a meaningful split AND lags
        print(f"Skipping {market_name}: Not enough data points ({len(market_df)}) after adding lags for training and testing.")
        return None, None, None, None

    # Determine train/test split for this market
    train_market_df = market_df.iloc[:-test_size].copy()
    test_market_df = market_df.iloc[-test_size:].copy()

    # Define the full set of features for the model, including base numerical and lagged features
    all_features_for_model = categorical_features + base_numerical_features + ['Modal_Price_Lag_1', 'Modal_Price_Lag_2', 'Modal_Price_Lag_7']

    X_train_m = train_market_df[all_features_for_model]
    y_train_m = train_market_df['Modal_Price']
    X_test_m = test_market_df[all_features_for_model]
    y_test_m = test_market_df['Modal_Price']

    print(f"  Training data shape for {market_name}: {X_train_m.shape}")
    print(f"  Testing data shape for {market_name}: {X_test_m.shape}")

    # Create a fresh pipeline for each market model
    model_pipeline_m = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    try:
        # Train the model
        model_pipeline_m.fit(X_train_m, y_train_m)
        print(f"  Model training complete for {market_name}.")

        # Save the model
        model_filename_m = f'random_forest_model_{commodity_name.replace(" ", "_").replace("/", "_")}_{market_name.replace(" ", "_").replace("/", "_")}.joblib'
        joblib.dump(model_pipeline_m, model_filename_m)
        print(f"  Model for {market_name} saved as {model_filename_m}")

        # Make predictions
        y_pred_m = model_pipeline_m.predict(X_test_m)

        # Evaluate
        mae_m = mean_absolute_error(y_test_m, y_pred_m)
        mse_m = mean_squared_error(y_test_m, y_pred_m)
        rmse_m = np.sqrt(mse_m)
        r2_m = r2_score(y_test_m, y_pred_m)

        print(f"  MAE: {mae_m:.2f}, RMSE: {rmse_m:.2f}, R2: {r2_m:.2f}")

        results_m = {
            'Commodity': commodity_name,
            'Market': market_name,
            'Training_Size': len(X_train_m),
            'Testing_Size': len(X_test_m),
            'MAE': mae_m,
            'RMSE': rmse_m,
            'R2': r2_m
        }
        return results_m, model_pipeline_m, train_market_df, test_market_df

    except Exception as e:
        print(f"  An error occurred for {market_name}: {e}")
        return None, None, None, None

all_market_results = []
market_models_with_data = {}

for market in top_n_markets:
    results_m, model_m, train_df_m, test_df_m = train_and_evaluate_market_model(selected_commodity, market, df, categorical_features, numerical_features, preprocessor, test_size=200)
    if results_m:
        all_market_results.append(results_m)
        market_models_with_data[market] = {
            'model': model_m,
            'train_df': train_df_m,
            'test_df': test_df_m
        }

# Display overall summary of per-market models
if all_market_results:
    market_results_df = pd.DataFrame(all_market_results)
    print("\n--- Summary of Per-Market Model Performance for Top Markets ---")
    print(market_results_df.sort_values(by='R2', ascending=False))
else:
    print("No market models were trained successfully.")







for market in top_n_markets:
    if market in market_models_with_data:
        model_for_prediction = market_models_with_data[market]['model']
        last_known_data_for_prediction = market_models_with_data[market]['test_df']

        days_to_predict = 7

        future_predictions = predict_future_prices(
            model_for_prediction,
            last_known_data_for_prediction,
            days_to_predict,
            categorical_features,
            numerical_features
        )

        print(f"\n--- 7-Day Price Predictions for {selected_commodity} in {market} ---")
        print(future_predictions)

        # Plotting
        actual_prices = market_models_with_data[market]['test_df']\
                            [['Arrival_Date', 'Modal_Price']].rename(columns={'Modal_Price': 'Actual_Modal_Price'})

        # Features for test set prediction (includes lags generated within train function)
        all_features_for_model = categorical_features + numerical_features + ['Modal_Price_Lag_1', 'Modal_Price_Lag_2', 'Modal_Price_Lag_7']
        X_test_demo = last_known_data_for_prediction[all_features_for_model]
        y_test_pred_demo = model_for_prediction.predict(X_test_demo)
        test_predictions_df = pd.DataFrame({
            'Arrival_Date': last_known_data_for_prediction['Arrival_Date'],
            'Predicted_Modal_Price': y_test_pred_demo
        })

        plt.figure(figsize=(15, 7))
        sns.lineplot(x='Arrival_Date', y='Actual_Modal_Price', data=actual_prices, label='Actual Prices (Test Set)')
        sns.lineplot(x='Arrival_Date', y='Predicted_Modal_Price', data=test_predictions_df, label='Predicted Prices (Test Set)')
        sns.lineplot(x='Arrival_Date', y='Predicted_Modal_Price', data=future_predictions, label='Future Predictions (7 Days)', linestyle='--')

        plt.title(f'Modal Price Prediction for {selected_commodity} in {market}')
        plt.xlabel('Date')
        plt.ylabel('Modal Price')
        plt.legend()
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()
    else:
        print(f"Model for '{market}' in '{selected_commodity}' not found or not trained successfully.")
