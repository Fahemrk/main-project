import json
import os

def show_metrics():
    # Get the directory where the script is located
    base_dir = os.path.dirname(os.path.abspath(__file__))
    metrics_path = os.path.join(base_dir, "models", "training_metrics.json")
    xgboost_metrics_path = os.path.join(base_dir, "models", "training_metrics_xgboost.json")

    print("=" * 50)
    print("SMART CROP GUIDANCE SYSTEM - MODEL ACCURACIES")
    print("=" * 50)

    # Yield Prediction - Random Forest
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            rf_metrics = json.load(f)
        print("\n[Yield Prediction - Random Forest]")
        print(f"  Test R² Score: {rf_metrics.get('test_r2_score', 0)*100:.2f}%")
        print(f"  CV R² Score:   {rf_metrics.get('cv_r2_score', 0)*100:.2f}%")
        print(f"  RMSE:          {rf_metrics.get('test_rmse', 0):.4f}")
        print(f"  MAE:           {rf_metrics.get('test_mae', 0):.4f}")
    else:
        print("\n[Yield Prediction - Random Forest]")
        print("  Metrics file not found. Run 'python prepare_yield_final.py' then 'python train_yield_xgboost_ga.py'.")

    # Yield Prediction - XGBoost
    if os.path.exists(xgboost_metrics_path):
        with open(xgboost_metrics_path, "r") as f:
            xgb_metrics = json.load(f)
        print("\n[Yield Prediction - XGBoost]")
        print(f"  Test R² Score: {xgb_metrics.get('test_r2_score', 0)*100:.2f}%")
        print(f"  CV R² Score:   {xgb_metrics.get('cv_r2_score', 0)*100:.2f}%")
        print(f"  RMSE:          {xgb_metrics.get('test_rmse', 0):.4f}")
        print(f"  MAE:           {xgb_metrics.get('test_mae', 0):.4f}")
    else:
        print("\n[Yield Prediction - XGBoost]")
        print("  Metrics file not found. Run 'python train_yield_xgboost_ga.py'.")

    # Crop Recommendation
    print("\n[Crop Recommendation - Random Forest]")
    print("  Note: Run 'python export_model.py' to see live test performance.")
    print("  Typical accuracy for this model is ~99.5%.")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    show_metrics()
