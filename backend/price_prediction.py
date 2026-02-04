import pandas as pd
import joblib
import os
from flask import Blueprint, request, jsonify
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint
price_bp = Blueprint('price_prediction', __name__, url_prefix='/api/price')

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "crop_price_model.pkl")
FEATURE_PATH = os.path.join(BASE_DIR, "models", "feature_columns.pkl")
DATA_PATH = os.path.join(BASE_DIR, "data", "price_data.csv")

# Constants
TARGET = "modal_price"
LAGS = [1, 2, 4]
ROLL = 4

# Load Model & Data
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(FEATURE_PATH):
        model = joblib.load(MODEL_PATH)
        feature_columns = joblib.load(FEATURE_PATH)
        logger.info("✓ Price prediction model loaded successfully")
    else:
        logger.error(f"Price prediction model files not found at {MODEL_PATH} or {FEATURE_PATH}")
        model = None
        feature_columns = None

    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)
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
    Predicts the price n_days into the future using rolling window forecasting.
    Adapted from original FastAPI implementation.
    """
    if model is None or df is None:
        raise ValueError("Model or data not loaded")
        
    if n_days <= 0:
        raise ValueError("Days must be greater than 0")

    # Get recent history needed for lag features
    # Max lag needed is max(MAX(LAGS), ROLL) = 4 based on current constants
    # But checking original code: LAGS=[1,2,4,8,12,24,52] in train.py vs [1,2,4] in app.py
    # We should stick to what `app.py` used if we trust it, or robustly handle it.
    # The `app.py` we saw used LAGS = [1, 2, 4] and ROLL = 4. 
    # Let's use the logic from the app.py we analyzed.
    
    needed_history = max(max(LAGS), ROLL)
    price_history = list(df[TARGET].iloc[-needed_history:])
    latest_row = df.iloc[-1].copy()

    # Iterative prediction
    for _ in range(n_days):
        row = latest_row.copy()

        # Create lag features
        for lag in LAGS:
            if lag <= len(price_history):
                row[f"price_lag_{lag}"] = price_history[-lag]
            else:
                # Fallback if not enough history (shouldn't happen with correct needed_history)
                row[f"price_lag_{lag}"] = price_history[0] 

        # Create rolling mean feature
        if len(price_history) >= ROLL:
            row["price_roll_4"] = sum(price_history[-ROLL:]) / ROLL
        else:
            row["price_roll_4"] = sum(price_history) / len(price_history)

        # Prepare input DataFrame
        X = pd.DataFrame([row])
        
        # Ensure only feature columns are present and in correct order
        # We need to drop metadata columns that might be in latest_row
        X = X[feature_columns] # Reorder/Select columns matching training
        X = X.fillna(0)

        # Predict
        pred = float(model.predict(X)[0])
        price_history.append(pred)
        
        # Update latest_row for next iteration if there are other features 
        # (Current implementation assumes other features static/irrelevant for future or handled by row copy)
        # The key driver is the price history updates.

    return round(float(price_history[-1]), 2)

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
            'unit': 'Quintal' # Assuming unit from typical Indian datasets, confirm if possible
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Price prediction error: {e}", exc_info=True)
        return jsonify({'error': f"Prediction failed: {str(e)}"}), 500
