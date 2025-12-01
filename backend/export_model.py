import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

np.random.seed(42)

def load_crop_data(csv_path="Crop_recommendation.csv"):
    df = pd.read_csv(csv_path)
    X = df.drop("label", axis=1).values
    y = df["label"].values
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    return X, y_encoded, le

if __name__ == "__main__":
    X, y, le = load_crop_data("Crop_recommendation.csv")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    best_params = {
        "n_estimators": 150,
        "max_depth": 20,
        "min_samples_split": 3,
        "min_samples_leaf": 2,
        "max_features": "log2",
        "bootstrap": True,
        "random_state": 42,
        "n_jobs": -1,
    }

    print("Training Random Forest with optimized hyperparameters...")
    print(f"Parameters: {best_params}\n")

    best_model = RandomForestClassifier(**best_params)
    best_model.fit(X_train, y_train)

    y_pred = best_model.predict(X_test)
    test_acc = (y_pred == y_test).mean()

    print(f"=== Final Test Performance ===")
    print(f"Test set accuracy: {test_acc:.4f}\n")

    joblib.dump(best_model, "crop_model.joblib")
    joblib.dump(le, "label_encoder.joblib")
    print("Model and label encoder saved!")
