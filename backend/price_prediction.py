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
# UPDATED: v4 (60-day) model artifacts
MODEL_PATH = os.path.join(BASE_DIR, "models", "crop_price_model_v4.pkl")
FEATURE_PATH = os.path.join(BASE_DIR, "models", "feature_columns_v4.pkl")
DATA_PATH = os.path.join(BASE_DIR, "data", "price_data.csv")
METRICS_PATH = os.path.join(BASE_DIR, "models", "training_metrics_price_v4.json")

# Constants
TARGET = "modal_price"
LAGS = [1, 7, 30, 60]
ROLL_WINDOWS = [7, 30, 60]
ROC_LAGS = [7, 30, 60]

# Load Model & Data
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(FEATURE_PATH):
        model = joblib.load(MODEL_PATH)
        feature_columns = joblib.load(FEATURE_PATH)
        logger.info(f"✓ Price prediction model loaded successfully (Features: {len(feature_columns)})")
    else:
        logger.error(f"Price prediction model files not found at {MODEL_PATH} or {FEATURE_PATH}")
        model = None
        feature_columns = None

    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)
        # Handle missing values same as training (Forward Fill)
        df = df.ffill().bfill()
        logger.info(f"✓ Price data loaded: {len(df)} records")
    else:
        logger.error(f"Price data file not found at {DATA_PATH}")
        df = None

except Exception as e:
    logger.error(f"Error loading price prediction assets: {e}")
    model = None
    feature_columns = None
    df = None

def _predict_future_price(n_days: int) -> float:
    """
    Predicts the price n_days into the future using recursive multi-step forecasting
    with a multivariate XGBoost model (v4 with 60-day features).
    """
    if model is None or df is None:
        raise ValueError("Model or data not loaded")
        
    if n_days <= 0:
        raise ValueError("Days must be greater than 0")

    # 1. Prepare Historical Context
    # We need enough history to calculate the largest lag/rolling window
    max_lookback = max(max(LAGS), max(ROLL_WINDOWS), max(ROC_LAGS))
    
    # Get the necessary history. We interact with a list for speed in the loop.
    history_df = df.tail(max_lookback + 1).copy() 
    price_history = history_df[TARGET].tolist()
    
    # Get the last row to serve as the baseline for static/exogenous features
    # (We forward-fill 'Rain', 'Diesel', 'MSP' etc. from the last known day)
    last_known_row = df.iloc[-1]
    
    current_date = last_known_row["date"]
    predicted_price = 0.0

    # 2. Recursive Prediction Loop
    for i in range(1, n_days + 1):
        next_date = current_date + pd.Timedelta(days=i)
        
        # Start with a dictionary for the new row features
        row_dict = {}
        
        # --- A. Time Features ---
        row_dict["month"] = next_date.month
        row_dict["day_of_year"] = next_date.dayofyear
        
        # --- B. Lag Features ---
        # lag_1 is the last item in price_history (t-1)
        # lag_60 is the 60th item from the end
        for lag in LAGS:
            if lag <= len(price_history):
                row_dict[f"price_lag_{lag}"] = price_history[-lag]
            else:
                row_dict[f"price_lag_{lag}"] = price_history[0]

        # --- C. Rolling Stats (Mean & Std Dev) ---
        for window in ROLL_WINDOWS:
            if len(price_history) >= window:
                window_data = price_history[-window:]
                # Mean
                row_dict[f"price_roll_mean_{window}"] = sum(window_data) / window
                # Std Dev (Volatility)
                row_dict[f"price_roll_std_{window}"] = pd.Series(window_data).std() if window > 1 else 0
            else:
                # Fallback for very start of recursion if history is tiny (unlikely)
                row_dict[f"price_roll_mean_{window}"] = sum(price_history) / len(price_history)
                row_dict[f"price_roll_std_{window}"] = 0

        # --- D. Momentum (Rate of Change) ---
        for lag in ROC_LAGS:
            if len(price_history) > lag: 
                old_val = price_history[-(lag + 1)] 
                current_val_lagged = price_history[-1] # P(T-1)
                
                # Approximate ROC using available lagged data
                if old_val != 0:
                    row_dict[f"price_roc_{lag}"] = (current_val_lagged - old_val) / old_val
                else:
                    row_dict[f"price_roc_{lag}"] = 0
            else:
                row_dict[f"price_roc_{lag}"] = 0

        # --- Exogenous Features (Forward Fill) ---
        exo_cols = ["rainfall_mm", "avg_temp_c", "MSP", "diesel_price", "export_ban"]
        for col in exo_cols:
            if col in last_known_row:
                row_dict[col] = last_known_row[col]
            else:
                row_dict[col] = 0

        # --- E. Assemble & Predict ---
        X_next = pd.DataFrame([row_dict])
        X_next = X_next.reindex(columns=feature_columns, fill_value=0)
        
        pred = float(model.predict(X_next)[0])
        
        price_history.append(pred)
        predicted_price = pred

    return round(predicted_price, 2)

@price_bp.route('/predict', methods=['POST'])
def predict_price():
    """
    Endpoint to predict crop price.
    Payload: {"days": int}
    """
    try:
        data = request.get_json(force=True)
        days = data.get('days')
        
        if not days:
            return jsonify({'error': 'Parameter "days" is required'}), 400
            
        try:
            days = int(days)
        except ValueError:
            return jsonify({'error': 'Parameter "days" must be an integer'}), 400

        if model is None or df is None:
            return jsonify({'error': 'Price prediction service unavailable (model/data missing)'}), 503

        predicted_price = _predict_future_price(days)
        
        return jsonify({
            'days_ahead': days,
            'predicted_price': predicted_price,
            'currency': 'INR',
            'unit': 'Quintal',
            'model_version': 'v4_60day_xgboost'
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Price prediction error: {e}", exc_info=True)
        return jsonify({'error': f"Prediction failed: {str(e)}"}), 500

if __name__ == "__main__":
    print("\n" + "="*50)
    print("      Price Prediction Model Status (v4)")
    print("="*50)
    
    if model is not None:
        print(f"Model Status:  [✓] Loaded")
    else:
        print(f"Model Status:  [✗] Failed to Load")
        
    if df is not None:
        print(f"Data Status:   [✓] Loaded ({len(df)} records)")
    else:
        print(f"Data Status:   [✗] Failed to Load")

    print("-" * 50)
    
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, 'r') as f:
                metrics = json.load(f)
            
            print("Model Performance Metrics:")
            print(f"  • R² Score (Test): {metrics.get('test_r2', 'N/A'):.4f}")
            print(f"  • RMSE     (Test): {metrics.get('test_rmse', 'N/A'):.4f}")
            print(f"  • MAE      (Test): {metrics.get('test_mae', 'N/A'):.4f}")
            
        except Exception as e:
            print(f"Error reading metrics: {e}")
    else:
        print(f"Metrics file not found at: {METRICS_PATH}")
        
    print("="*50 + "\n")
