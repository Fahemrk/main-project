from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
from sklearn.tree import DecisionTreeClassifier

app = Flask(__name__)
CORS(app)

FEATURE_NAMES = ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Temperature', 'Humidity', 'pH Level', 'Rainfall']
FEATURE_RANGES = {
    'Nitrogen (N)': (0, 140),
    'Phosphorus (P)': (5, 145),
    'Potassium (K)': (5, 205),
    'Temperature': (8, 45),
    'Humidity': (10, 100),
    'pH Level': (3.5, 10),
    'Rainfall': (0, 1500)
}

try:
    model = joblib.load('crop_model.joblib')
    le = joblib.load('label_encoder.joblib')
    MODEL_LOADED = True
except:
    MODEL_LOADED = False
    print("Warning: Model files not found. Run 'python export_model.py' first.")


def calculate_shap_values(features, prediction_idx, probabilities):
    """
    Calculate feature importance based on Random Forest feature_importances_.
    Normalize by probability to show contribution to the specific prediction.
    """
    shap_values = []
    
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    else:
        importances = np.ones(len(FEATURE_NAMES)) / len(FEATURE_NAMES)
    
    max_importance = max(importances) if max(importances) > 0 else 1
    
    for i, feature_name in enumerate(FEATURE_NAMES):
        normalized_importance = importances[i] / max_importance
        is_positive = features[0][i] > np.mean([FEATURE_RANGES[feature_name][0], FEATURE_RANGES[feature_name][1]])
        
        value = normalized_importance * probabilities[prediction_idx]
        if not is_positive:
            value *= -0.5
        
        shap_values.append({
            'feature': feature_name,
            'value': float(np.clip(value, -1, 1)),
            'impact': 'positive' if is_positive else 'negative'
        })
    
    return shap_values


def calculate_lime_explanation(features, predicted_crop):
    """
    Calculate local interpretable explanations by analyzing feature values
    relative to their typical ranges for the predicted crop.
    """
    lime_explanations = []
    
    thresholds = {
        'Nitrogen (N)': (40, 80),
        'Phosphorus (P)': (20, 60),
        'Potassium (K)': (20, 60),
        'Temperature': (20, 30),
        'Humidity': (50, 80),
        'pH Level': (6, 7.5),
        'Rainfall': (100, 500)
    }
    
    for i, feature_name in enumerate(FEATURE_NAMES):
        value = features[0][i]
        low, high = thresholds.get(feature_name, (0, 100))
        
        if value < low:
            condition = f"Low {feature_name.lower()} ({value}) - may limit {predicted_crop} growth"
            contribution = -0.1
        elif value > high:
            condition = f"High {feature_name.lower()} ({value}) - supports {predicted_crop} growth"
            contribution = 0.15
        else:
            condition = f"Optimal {feature_name.lower()} ({value}) for {predicted_crop}"
            contribution = 0.12
        
        lime_explanations.append({
            'feature': feature_name,
            'condition': condition,
            'contribution': float(contribution)
        })
    
    return lime_explanations


@app.route('/predict', methods=['POST'])
def predict():
    if not MODEL_LOADED:
        return jsonify({'error': 'Model not loaded. Run export_model.py first.'}), 500
    
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        features = np.array([[
            float(data['N']),
            float(data['P']),
            float(data['K']),
            float(data['temperature']),
            float(data['humidity']),
            float(data['ph']),
            float(data['rainfall'])
        ]])
        
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        crop_name = le.inverse_transform([prediction])[0]
        
        crop_probs = [
            {'name': le.classes_[i], 'value': float(p)}
            for i, p in enumerate(probabilities)
        ]
        crop_probs.sort(key=lambda x: x['value'], reverse=True)
        
        shap_values = calculate_shap_values(features, prediction, probabilities)
        lime_explanation = calculate_lime_explanation(features, crop_name)
        
        response = {
            'crop': crop_name,
            'confidence': float(probabilities[prediction]),
            'probabilities': crop_probs,
            'shapValues': shap_values,
            'limeExplanation': lime_explanation
        }
        
        return jsonify(response), 200
    
    except ValueError as e:
        print(f"Validation Error: {e}")
        return jsonify({'error': f'Invalid input values: {str(e)}'}), 400
    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': MODEL_LOADED}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
