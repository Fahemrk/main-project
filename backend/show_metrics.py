import json
import os
import sys

def show_metrics():
    # Get the directory where the script is located
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Paths
    rf_yield_metrics_path = os.path.join(base_dir, "models", "training_metrics.json")
    xgb_yield_metrics_path = os.path.join(base_dir, "models", "training_metrics_xgboost.json")
    # New: Price metrics
    price_metrics_path = os.path.join(base_dir, "models", "training_metrics_price_v4.json")
    # Crop Classification
    crop_params_path = os.path.join(base_dir, "models", "optimal_hyperparameters.json")

    print("\n" + "=" * 60)
    print("      SMART CROP GUIDANCE SYSTEM - MODEL PERFORMANCE")
    print("=" * 60)

    # 1. CROP RECOMMENDATION
    print("\n[1] CROP RECOMMENDATION (Classification)")
    if os.path.exists(crop_params_path):
        try:
            with open(crop_params_path, "r") as f:
                crop_data = json.load(f)
            acc = crop_data.get('best_cv_accuracy', 0)
            print(f"  • Model: Random Forest")
            print(f"  • Accuracy: {acc*100:.2f}% (Cross-Validation)")
        except:
            print("  • Error reading metrics file.")
    else:
        print("  • Metrics not found.")

    # 2. YIELD PREDICTION
    print("\n[2] YIELD PREDICTION (Regression)")
    
    # XGBoost
    if os.path.exists(xgb_yield_metrics_path):
        try:
            with open(xgb_yield_metrics_path, "r") as f:
                xgb_metrics = json.load(f)
            print(f"  • Model: {xgb_metrics.get('algorithm', 'XGBoost')} (Active)")
            print(f"    - R² Score: {xgb_metrics.get('test_r2_score', 0):.4f}")
            print(f"    - RMSE:     {xgb_metrics.get('test_rmse', 0):.4f}")
            print(f"    - MAE:      {xgb_metrics.get('test_mae', 0):.4f}")
        except:
            print("  • XGBoost metrics error.")
    else:
        print("  • XGBoost Model not trained yet.")

    # 3. PRICE PREDICTION
    print("\n[3] PRICE PREDICTION (Time-Series Regression) - NEW")
    if os.path.exists(price_metrics_path):
        try:
            with open(price_metrics_path, "r") as f:
                price_metrics = json.load(f)
            
            print(f"  • Model: Multivariate XGBoost (v4 - 60 Day Horizon)")
            print(f"    - R² Score: {price_metrics.get('test_r2', 0):.4f}")
            print(f"    - RMSE:     {price_metrics.get('test_rmse', 0):.4f}")
            print(f"    - MAE:      {price_metrics.get('test_mae', 0):.4f}")
            print(f"    - Features: {len(price_metrics.get('features', []))} (Inc. Lag-60, ROC-60)")
        except Exception as e:
            print(f"  • Error reading price metrics: {e}")
    else:
        print(f"  • Price Metrics file not found at: {price_metrics_path}")

    print("\n" + "=" * 60 + "\n")

if __name__ == "__main__":
    show_metrics()
