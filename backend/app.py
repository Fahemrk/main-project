from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

try:
    model = joblib.load('crop_model.joblib')
    le = joblib.load('label_encoder.joblib')
    MODEL_LOADED = True
except:
    MODEL_LOADED = False
    print("Warning: Model files not found. Run 'python export_model.py' first.")


@app.route('/predict', methods=['POST'])
def predict():
    if not MODEL_LOADED:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.json
        
        features = np.array([[
            data['N'],
            data['P'],
            data['K'],
            data['temperature'],
            data['humidity'],
            data['ph'],
            data['rainfall']
        ]])
        
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        crop_name = le.inverse_transform([prediction])[0]
        
        crop_probs = [
            {'name': le.classes_[i], 'value': float(p)}
            for i, p in enumerate(probabilities)
        ]
        crop_probs.sort(key=lambda x: x['value'], reverse=True)
        
        response = {
            'crop': crop_name,
            'confidence': float(probabilities[prediction]),
            'probabilities': crop_probs
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': MODEL_LOADED}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
