import pandas as pd
import joblib
import os
from flask import Blueprint, request, jsonify
import json
import logging
import numpy as np

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint
price_bp = Blueprint('price_prediction', __name__, url_prefix='/api/price')

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

CROPS_CONFIG = {
    "rice": "price_data.csv",
    "watermelon": "watermelon_dataset.xlsx",
    "coconut": "kerala_coconut_dataset.xlsx",
}

# In-memory stores
models = {}
feature_columns = {}
dataframes = {}

# Constants
TARGET = "modal_price"
LAGS = [1, 7, 30, 60]
ROLL_WINDOWS = [7, 30, 60]
ROC_LAGS = [7, 30, 60]

# Pre-load Models & Data
for crop, filename in CROPS_CONFIG.items():
    try:
        model_path = os.path.join(MODEL_DIR, f"crop_price_model_v4_{crop}.pkl")
        feature_path = os.path.join(MODEL_DIR, f"feature_columns_v4_{crop}.pkl")
        data_path = os.path.join(DATA_DIR, filename)

        if os.path.exists(model_path) and os.path.exists(feature_path):
            models[crop] = joblib.load(model_path)
            feature_columns[crop] = joblib.load(feature_path)
            logger.info(f"✓ {crop.upper()} model loaded successfully (Features: {len(feature_columns[crop])})")
        else:
            logger.warning(f"{crop.upper()} model files not found at {model_path} or {feature_path}")

        if os.path.exists(data_path):
            if filename.endswith('.csv'):
                df_temp = pd.read_csv(data_path)
            else:
                df_temp = pd.read_excel(data_path)
            
            df_temp["date"] = pd.to_datetime(df_temp["date"])
            
            # Numeric conversion safety
            if "modal_price" in df_temp.columns:
                df_temp["modal_price"] = pd.to_numeric(df_temp["modal_price"], errors='coerce')
            for col in feature_columns.get(crop, []):
                if col in df_temp.columns and col not in ["date"]:
                    df_temp[col] = pd.to_numeric(df_temp[col], errors='coerce')
                    
            df_temp = df_temp.sort_values("date").reset_index(drop=True)
            df_temp = df_temp.ffill().bfill() # Handle missing values same as training
            
            dataframes[crop] = df_temp
            logger.info(f"✓ {crop.upper()} data loaded: {len(df_temp)} records")
        else:
            logger.warning(f"{crop.upper()} data file not found at {data_path}")

    except Exception as e:
        logger.error(f"Error loading assets for crop '{crop}': {e}")


def _predict_future_price(n_days: int, crop: str) -> float:
    """
    Predicts the price n_days into the future using recursive multi-step forecasting
    with a multivariate XGBoost model.
    """
    if crop not in models or crop not in dataframes:
        raise ValueError(f"Model or data not available for crop '{crop}'. Has it been trained?")
        
    model = models[crop]
    df = dataframes[crop]
    crop_features = feature_columns[crop]
        
    if n_days <= 0:
        raise ValueError("Days must be greater than 0")

    # 1. Prepare Historical Context
    max_lookback = max(max(LAGS), max(ROLL_WINDOWS), max(ROC_LAGS))
    
    # Get the necessary history
    history_df = df.tail(max_lookback + 1).copy() 
    price_history = history_df[TARGET].tolist()
    
    # Get the last row to serve as the baseline for static/exogenous features
    last_known_row = df.iloc[-1]
    
    current_date = last_known_row["date"]
    predicted_price = 0.0
    
    # Identify strictly exogenous columns from the feature list
    time_feats = ["month", "day_of_year"]
    lag_feats = [f"price_lag_{l}" for l in LAGS]
    roll_feats = [f"price_roll_mean_{w}" for w in ROLL_WINDOWS] + [f"price_roll_std_{w}" for w in ROLL_WINDOWS]
    roc_feats = [f"price_roc_{l}" for l in ROC_LAGS]
    non_exo = set(time_feats + lag_feats + roll_feats + roc_feats)
    
    exo_cols = [f for f in crop_features if f not in non_exo]

    # 2. Recursive Prediction Loop
    for i in range(1, n_days + 1):
        next_date = current_date + pd.Timedelta(days=i)
        
        row_dict = {}
        
        # --- A. Time Features ---
        row_dict["month"] = next_date.month
        row_dict["day_of_year"] = next_date.dayofyear
        
        # --- B. Lag Features ---
        for lag in LAGS:
            if lag <= len(price_history):
                row_dict[f"price_lag_{lag}"] = price_history[-lag]
            else:
                row_dict[f"price_lag_{lag}"] = price_history[0]

        # --- C. Rolling Stats (Mean & Std Dev) ---
        for window in ROLL_WINDOWS:
            if len(price_history) >= window:
                window_data = price_history[-window:]
                row_dict[f"price_roll_mean_{window}"] = sum(window_data) / window
                row_dict[f"price_roll_std_{window}"] = pd.Series(window_data).std() if window > 1 else 0
            else:
                row_dict[f"price_roll_mean_{window}"] = sum(price_history) / len(price_history)
                row_dict[f"price_roll_std_{window}"] = 0

        # --- D. Momentum (Rate of Change) ---
        for lag in ROC_LAGS:
            if len(price_history) > lag: 
                old_val = price_history[-(lag + 1)] 
                current_val_lagged = price_history[-1]
                
                if pd.notna(old_val) and old_val != 0:
                    row_dict[f"price_roc_{lag}"] = (current_val_lagged - old_val) / old_val
                else:
                    row_dict[f"price_roc_{lag}"] = 0
            else:
                row_dict[f"price_roc_{lag}"] = 0

        # --- Exogenous Features (Forward Fill) ---
        for col in exo_cols:
            if col in last_known_row and pd.notna(last_known_row[col]):
                row_dict[col] = float(last_known_row[col])
            else:
                row_dict[col] = 0.0

        # --- E. Assemble & Predict ---
        X_next = pd.DataFrame([row_dict])
        X_next = X_next.reindex(columns=crop_features, fill_value=0)
        
        pred = float(model.predict(X_next)[0])
        
        price_history.append(pred)
        predicted_price = pred

    return round(predicted_price, 2)

@price_bp.route('/predict', methods=['POST'])
def predict_price():
    """
    Endpoint to predict crop price.
    Payload: {"days": int, "crop": "rice" | "watermelon" | "coconut"}
    """
    try:
        data = request.get_json(force=True)
        days = data.get('days')
        crop = data.get('crop', 'rice') # Default to rice if not provided
        
        if not days:
            return jsonify({'error': 'Parameter "days" is required'}), 400
            
        try:
            days = int(days)
        except ValueError:
            return jsonify({'error': 'Parameter "days" must be an integer'}), 400

        if crop not in models or crop not in dataframes:
            return jsonify({'error': f'Price prediction service unavailable for crop "{crop}" (model/data missing)'}), 503

        predicted_price = _predict_future_price(days, crop)
        
        # Normalize prices to 'per kg' based on dataset patterns
        if crop == 'watermelon' or predicted_price > 500:
            # Watermelon dataset prices are ~1000+, indicating Quintal
            predicted_price = predicted_price / 100.0
            
        return jsonify({
            'crop': crop,
            'days_ahead': days,
            'predicted_price': round(predicted_price, 2),
            'currency': 'INR',
            'unit': 'kg',
            'model_version': 'v4_60day_xgboost_multicrop'
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Price prediction error: {e}", exc_info=True)
        return jsonify({'error': f"Prediction failed: {str(e)}"}), 500

if __name__ == "__main__":
    print("\n" + "="*50)
    print("      Price Prediction Models Status (v4)")
    print("="*50)
    
    for crop in CROPS_CONFIG.keys():
        print(f"\n[{crop.upper()}]")
        if crop in models:
            print(f"  Model Status:  [✓] Loaded")
        else:
            print(f"  Model Status:  [✗] Failed to Load")
            
        if crop in dataframes:
            print(f"  Data Status:   [✓] Loaded ({len(dataframes[crop])} records)")
        else:
            print(f"  Data Status:   [✗] Failed to Load")
        
        metrics_file = os.path.join(MODEL_DIR, f"training_metrics_price_v4_{crop}.json")
        if os.path.exists(metrics_file):
            try:
                with open(metrics_file, 'r') as f:
                    metrics = json.load(f)
                
                print("  Model Performance Metrics:")
                print(f"    • R² Score (Test): {metrics.get('test_r2', 'N/A'):.4f}")
                print(f"    • RMSE     (Test): {metrics.get('test_rmse', 'N/A'):.4f}")
                print(f"    • MAE      (Test): {metrics.get('test_mae', 'N/A'):.4f}")
            except Exception as e:
                print(f"  Error reading metrics: {e}")
        else:
            print(f"  Metrics file not found for {crop}")

    print("="*50 + "\n")
