import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import json
import os

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "price_data.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
# UPDATED: v4 (60-day) model artifacts
MODEL_PATH = os.path.join(MODEL_DIR, "crop_price_model_v4.pkl")
FEATURE_PATH = os.path.join(MODEL_DIR, "feature_columns_v4.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "training_metrics_price_v4.json")

# Ensure models directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def load_and_preprocess_data(filepath):
    print(f"Loading data from {filepath}...")
    df = pd.read_csv(filepath)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    
    # Fill missing values:
    df = df.ffill().bfill()
    
    # --- Feature Engineering ---
    print("Engineering features...")
    
    # 1. Time Features
    df["month"] = df["date"].dt.month
    df["day_of_year"] = df["date"].dt.dayofyear
    
    # 2. Lag Features (Autoregression)
    lags = [1, 7, 30, 60] 
    for lag in lags:
        df[f"price_lag_{lag}"] = df["modal_price"].shift(lag)
        
    # 3. Rolling Statistics (Trends & Volatility)
    windows = [7, 30, 60]
    for window in windows:
        # Trend
        df[f"price_roll_mean_{window}"] = df["modal_price"].rolling(window=window).mean()
        # Volatility (Standard Deviation)
        df[f"price_roll_std_{window}"] = df["modal_price"].rolling(window=window).std()
        
    # 4. Momentum (Rate of Change)
    # Price change over the last 7, 30, 60 days
    for lag in [7, 30, 60]:
        df[f"price_roc_{lag}"] = df["modal_price"].pct_change(periods=lag)

    # Clean NaNs
    df = df.fillna(0)
    df = df.iloc[60:].reset_index(drop=True) # Drop initial 60 days for accurate lags
    
    return df

def train_model():
    df = load_and_preprocess_data(DATA_PATH)
    target = "modal_price"
    
    # Define features to use (Extended Set with 60-day features)
    features = [
        # Autoregressive
        "price_lag_1", "price_lag_7", "price_lag_30", "price_lag_60",
        
        # Trend & Volatility
        "price_roll_mean_7", "price_roll_mean_30", "price_roll_mean_60",
        "price_roll_std_7", "price_roll_std_30", "price_roll_std_60",
        
        # Momentum
        "price_roc_7", "price_roc_30", "price_roc_60",
        
        # Time
        "month", "day_of_year",
        
        # Exogenous - Weather
        "rainfall_mm", "avg_temp_c",
        
        # Exogenous - Economic/Policy
        "MSP", "diesel_price", "export_ban"
    ]
    
    # Verify features
    existing_features = [f for f in features if f in df.columns]
    print(f"Training with {len(existing_features)} features: {existing_features}")
    
    X = df[existing_features]
    y = df[target]
    
    # Time Series Split
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")
    
    # --- Hyperparameter Tuning ---
    print("Starting Hyperparameter Tuning (RandomizedSearchCV)...")
    
    xgb_reg = xgb.XGBRegressor(objective='reg:squarederror', random_state=42, n_jobs=-1)
    
    param_dist = {
        'n_estimators': [500, 1000, 2000],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [3, 5, 7, 9],
        'min_child_weight': [1, 3, 5],
        'subsample': [0.7, 0.8, 0.9, 1.0],
        'colsample_bytree': [0.7, 0.8, 0.9, 1.0],
        'gamma': [0, 0.1, 0.2]
    }
    
    # TimeSeriesSplit for CV to prevent data leakage (training on future)
    tscv = TimeSeriesSplit(n_splits=3)
    
    random_search = RandomizedSearchCV(
        estimator=xgb_reg,
        param_distributions=param_dist,
        n_iter=20, # Try 20 random combinations
        scoring='neg_mean_absolute_error',
        cv=tscv,
        verbose=1,
        n_jobs=-1,
        random_state=42
    )
    
    random_search.fit(X_train, y_train)
    
    best_model = random_search.best_estimator_
    print(f"Best Parameters: {random_search.best_params_}")
    
    # --- Final Evaluation ---
    predictions = best_model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"\n--- Model Evaluation (v4 with 60-day features) ---")
    print(f"RMSE: {rmse:.2f}")
    print(f"MAE:  {mae:.2f}")
    print(f"R²:   {r2:.4f}")
    
    # Save artifacts
    print(f"\nSaving model to {MODEL_PATH}...")
    joblib.dump(best_model, MODEL_PATH)
    joblib.dump(existing_features, FEATURE_PATH)
    
    # Save metrics
    metrics = {
        "test_rmse": rmse,
        "test_mae": mae,
        "test_r2": r2,
        "features": existing_features,
        "best_params": random_search.best_params_
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=4)
        
    print("✓ Tuning & Training complete.")

if __name__ == "__main__":
    train_model()
