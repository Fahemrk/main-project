import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, log_loss
import warnings

warnings.filterwarnings('ignore')

np.random.seed(42)

def load_crop_data(csv_path="Crop_recommendation.csv"):
    df = pd.read_csv(csv_path)
    X = df.drop("label", axis=1).values
    y = df["label"].values
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    return X, y_encoded, le

print("Loading data...")
X, y, le = load_crop_data("Crop_recommendation.csv")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("=" * 70)
print("PROBABILITY CALIBRATION FOR RANDOMFOREST")
print("=" * 70)

print("\nLoading optimized model...")
base_model = joblib.load("crop_model.joblib")

base_accuracy = base_model.score(X_test, y_test)
base_probs = base_model.predict_proba(X_test)
base_log_loss = log_loss(y_test, base_probs)

print(f"Base model accuracy: {base_accuracy:.4f}")
print(f"Base model log loss: {base_log_loss:.4f} (lower is better)")

print("\nCalibrating probabilities using isotonic regression...")
calibrated_model = CalibratedClassifierCV(base_model, method='isotonic', cv=5)
calibrated_model.fit(X_train, y_train)

calibrated_accuracy = calibrated_model.score(X_test, y_test)
calibrated_probs = calibrated_model.predict_proba(X_test)
calibrated_log_loss = log_loss(y_test, calibrated_probs)

print("=" * 70)
print("CALIBRATION RESULTS")
print("=" * 70)

print(f"\nAccuracy (unchanged):")
print(f"  Before: {base_accuracy:.4f} ({base_accuracy*100:.2f}%)")
print(f"  After:  {calibrated_accuracy:.4f} ({calibrated_accuracy*100:.2f}%)")

print(f"\nLog Loss (lower is better):")
print(f"  Before: {base_log_loss:.4f}")
print(f"  After:  {calibrated_log_loss:.4f}")

improvement = base_log_loss - calibrated_log_loss
improvement_percent = (improvement / base_log_loss) * 100 if base_log_loss > 0 else 0
print(f"  Improvement: {improvement:+.4f} ({improvement_percent:+.2f}%)")

print("\n" + "-" * 70)
print("Confidence Score Comparison (First 10 predictions):")
print("-" * 70)

predictions = calibrated_model.predict(X_test[:10])
base_confidences = np.max(base_probs[:10], axis=1)
calibrated_confidences = np.max(calibrated_probs[:10], axis=1)

print(f"\n{'Crop':<15} {'Before':<12} {'After':<12} {'Change':<10}")
print("-" * 70)

for i, (pred_idx, base_conf, cal_conf) in enumerate(zip(predictions, base_confidences, calibrated_confidences)):
    crop_name = le.classes_[pred_idx]
    change = cal_conf - base_conf
    print(f"{crop_name:<15} {base_conf:.2%}     {cal_conf:.2%}     {change:+.2%}")

print("\n" + "=" * 70)
print("Saving calibrated model...")

joblib.dump(calibrated_model, "crop_model_calibrated.joblib")
print("[OK] Saved crop_model_calibrated.joblib")

print("\nReplacing original model with calibrated version...")
import shutil
shutil.copy("crop_model_calibrated.joblib", "crop_model.joblib")
print("[OK] crop_model.joblib updated with calibrated model")

print("\n" + "=" * 70)
print("Calibration complete! Restart backend to use new model.")
print("=" * 70)
