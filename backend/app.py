from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from dotenv import load_dotenv
import joblib
import os
import logging
import json
from models import db, User, PredictionHistory
from auth import auth_bp

try:
    import numpy as np
    from sklearn.tree import DecisionTreeClassifier
    ML_BASIC_AVAILABLE = True
except ImportError:
    ML_BASIC_AVAILABLE = False
    np = None
    DecisionTreeClassifier = None

try:
    import shap
    import lime
    import lime.lime_tabular
    ML_ADVANCED_AVAILABLE = True
except ImportError:
    ML_ADVANCED_AVAILABLE = False
    shap = None
    lime = None

ML_PACKAGES_AVAILABLE = ML_BASIC_AVAILABLE

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///crop_guidance.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

jwt_secret = os.getenv('JWT_SECRET_KEY')
if not jwt_secret:
    if os.getenv('FLASK_ENV') == 'production':
        raise ValueError('JWT_SECRET_KEY environment variable is required in production')
    jwt_secret = 'dev-secret-key-change-in-production'

app.config['JWT_SECRET_KEY'] = jwt_secret

db.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(auth_bp)

@app.before_request
def log_request():
    logger.info(f"Request: {request.method} {request.path}")
    logger.info(f"Content-Type: {request.content_type}")
    if request.method == 'POST':
        try:
            logger.info(f"Body: {request.get_data(as_text=True)[:200]}")
            if request.content_type and 'application/json' in request.content_type:
                data = request.get_json(force=True, silent=True)
                logger.info(f"JSON parsed: {data}")
        except Exception as e:
            logger.error(f"Error parsing request: {str(e)}", exc_info=True)

@app.errorhandler(422)
def handle_unprocessable(e):
    logger.error(f"422 Error: {e}")
    return jsonify({'error': f'Unprocessable request: {str(e)}'}), 422

@jwt.invalid_token_loader
def invalid_token_callback(e):
    logger.error(f"Invalid JWT token: {str(e)}")
    return jsonify({'error': f'Invalid token: {str(e)}'}), 401

@jwt.unauthorized_loader
def missing_token_callback(e):
    logger.error(f"Missing JWT token: {str(e)}")
    return jsonify({'error': f'Missing token: {str(e)}'}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    logger.error(f"Expired JWT token")
    return jsonify({'error': 'Token has expired'}), 401

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

MODEL_LOADED = False
shap_explainer = None
lime_explainer = None
training_data = None
model = None
le = None
ga_features = {}

if not ML_PACKAGES_AVAILABLE:
    logger.warning("⚠ ML packages not installed. Prediction will not work.")
    logger.warning("  Install with: pip install numpy scikit-learn shap lime joblib")
else:
    try:
        model = joblib.load('crop_model.joblib')
        logger.info("✓ Model loaded successfully: crop_model.joblib")
    except FileNotFoundError:
        logger.error("✗ Model file not found: crop_model.joblib")
        logger.error("   Run 'python export_model.py' first to generate the model file.")
    except Exception as e:
        logger.error(f"✗ Failed to load model: {type(e).__name__}: {str(e)}")

    try:
        le = joblib.load('label_encoder.joblib')
        logger.info("✓ Label encoder loaded successfully: label_encoder.joblib")
        MODEL_LOADED = True
    except FileNotFoundError:
        logger.error("✗ Label encoder file not found: label_encoder.joblib")
        logger.error("   Run 'python export_model.py' first to generate the label encoder file.")
        MODEL_LOADED = False
    except Exception as e:
        logger.error(f"✗ Failed to load label encoder: {type(e).__name__}: {str(e)}")
        MODEL_LOADED = False

    if MODEL_LOADED:
        logger.info("✓ All required model files loaded. Ready to accept predictions.")
        try:
            import pandas as pd
            df = pd.read_csv('Crop_recommendation.csv')
            training_data = df.drop("label", axis=1).values
            shap_explainer = shap.TreeExplainer(model)
            logger.info("✓ SHAP TreeExplainer initialized successfully")
            
            lime_explainer = lime.lime_tabular.LimeTabularExplainer(
                training_data=training_data,
                feature_names=FEATURE_NAMES,
                class_names=le.classes_.tolist(),
                mode='classification',
                random_state=42,
                verbose=False
            )
            logger.info("✓ LIME TabularExplainer initialized successfully")
        except Exception as e:
            logger.error(f"✗ Failed to initialize explainers: {type(e).__name__}: {str(e)}")
            logger.warning("  Falling back to approximation methods if explainers unavailable")
        
        try:
            with open('ga_features.json', 'r') as f:
                ga_data = json.load(f)
                ga_features = {item['crop']: item for item in ga_data}
                logger.info(f"✓ GA feature selection loaded for {len(ga_features)} crops")
        except FileNotFoundError:
            logger.warning("⚠ GA features file not found: ga_features.json")
            logger.warning("   Run 'python ga_feature_selection.py' to generate it")
        except Exception as e:
            logger.warning(f"⚠ Failed to load GA features: {str(e)}")


def calculate_feature_importance(features, prediction_idx, probabilities):
    """
    Calculate SHAP values using TreeExplainer for actual Shapley-based feature importance.
    Falls back to approximation if SHAP explainer is not available.
    """
    importance_values = []
    
    if shap_explainer is not None:
        try:
            shap_values = shap_explainer.shap_values(features)
            
            if isinstance(shap_values, list):
                shap_values_for_class = shap_values[prediction_idx][0]
            else:
                shap_values_for_class = shap_values[0, :, prediction_idx]
            
            base_value = shap_explainer.expected_value
            if isinstance(base_value, list):
                base_value = base_value[prediction_idx]
            
            for i, feature_name in enumerate(FEATURE_NAMES):
                shap_value = float(shap_values_for_class[i])
                importance_values.append({
                    'feature': feature_name,
                    'value': float(np.clip(shap_value, -1, 1)),
                    'impact': 'positive' if shap_value > 0 else 'negative'
                })
            
            return importance_values
        except Exception as e:
            logger.warning(f"SHAP calculation failed: {str(e)}. Using fallback approximation.")
    
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
        
        importance_values.append({
            'feature': feature_name,
            'value': float(np.clip(value, -1, 1)),
            'impact': 'positive' if is_positive else 'negative'
        })
    
    return importance_values


def calculate_feature_explanation(features, predicted_crop, prediction_idx):
    """
    Calculate LIME explanations using local linear model approximations.
    Falls back to threshold-based approximation if LIME explainer is not available.
    """
    explanations = []
    
    if lime_explainer is not None:
        try:
            exp = lime_explainer.explain_instance(
                features[0],
                model.predict_proba,
                num_features=len(FEATURE_NAMES),
                top_labels=1
            )
            
            lime_weights = dict(exp.as_list(label=prediction_idx))
            
            for feature_name in FEATURE_NAMES:
                weight = 0.0
                condition = f"{feature_name} = {features[0][FEATURE_NAMES.index(feature_name)]:.2f}"
                
                for lime_feature, lime_weight in lime_weights.items():
                    if feature_name.lower() in lime_feature.lower():
                        weight = lime_weight
                        condition = lime_feature
                        break
                
                explanations.append({
                    'feature': feature_name,
                    'condition': condition,
                    'contribution': float(weight)
                })
            
            return explanations
        except Exception as e:
            logger.warning(f"LIME calculation failed: {str(e)}. Using fallback approximation.")
    
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
        
        explanations.append({
            'feature': feature_name,
            'condition': condition,
            'contribution': float(contribution)
        })
    
    return explanations


def validate_input_ranges(data):
    """
    Validate all numeric inputs are within acceptable ranges.
    Returns (is_valid, error_message)
    """
    field_mapping = {
        'N': ('Nitrogen (N)', [0, 140]),
        'P': ('Phosphorus (P)', [5, 145]),
        'K': ('Potassium (K)', [5, 205]),
        'temperature': ('Temperature', [8, 45]),
        'humidity': ('Humidity', [10, 100]),
        'ph': ('pH Level', [3.5, 10]),
        'rainfall': ('Rainfall', [0, 1500])
    }
    
    for field, (name, (min_val, max_val)) in field_mapping.items():
        if field in data:
            value = float(data[field])
            if value < min_val or value > max_val:
                return False, f"{name} must be between {min_val} and {max_val}, got {value}"
    
    return True, None


@app.route('/predict', methods=['POST'])
@jwt_required()
def predict():
    logger.info(f"Predict endpoint hit. Content-Type: {request.content_type}")
    logger.info(f"Request data: {request.data[:500]}")
    
    if not ML_PACKAGES_AVAILABLE:
        return jsonify({'error': 'ML packages not installed. Install with: pip install numpy scikit-learn joblib pandas'}), 500
    
    if not MODEL_LOADED:
        logger.error("Prediction requested but model not loaded")
        return jsonify({'error': 'Model not loaded. Run export_model.py first.'}), 500
    
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json(force=True)
        logger.info(f"Request JSON parsed: {data}")
        
        if not data:
            logger.warning("Prediction request with no data")
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        missing = [f for f in required_fields if f not in data]
        if missing:
            logger.warning(f"Missing fields in prediction request: {missing}")
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        is_valid, error_msg = validate_input_ranges(data)
        if not is_valid:
            logger.warning(f"Input validation failed: {error_msg}")
            return jsonify({'error': error_msg}), 400
        
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
        
        feature_importance = calculate_feature_importance(features, prediction, probabilities)
        feature_explanation = calculate_feature_explanation(features, crop_name, prediction)
        
        confidence = float(probabilities[prediction])
        
        prediction_record = PredictionHistory(
            user_id=user_id,
            crop=crop_name,
            confidence=confidence,
            N=float(data['N']),
            P=float(data['P']),
            K=float(data['K']),
            temperature=float(data['temperature']),
            humidity=float(data['humidity']),
            ph=float(data['ph']),
            rainfall=float(data['rainfall']),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        db.session.add(prediction_record)
        db.session.commit()
        
        response = {
            'crop': crop_name,
            'confidence': confidence,
            'probabilities': crop_probs,
            'shapValues': feature_importance,
            'limeExplanation': feature_explanation
        }
        
        logger.info(f"Prediction successful for user {user_id}: {crop_name} (confidence: {confidence:.2%})")
        return jsonify(response), 200
    
    except ValueError as e:
        logger.error(f"Validation Error: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': f'Invalid input values: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Prediction Error: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    logger.info("Health check requested")
    return jsonify({
        'status': 'ok',
        'model_loaded': MODEL_LOADED,
        'ml_packages_available': ML_PACKAGES_AVAILABLE
    }), 200


@app.route('/input-constraints', methods=['GET'])
def get_input_constraints():
    constraints = {
        'N': {'min': 0, 'max': 140, 'unit': 'kg/ha', 'name': 'Nitrogen'},
        'P': {'min': 5, 'max': 145, 'unit': 'kg/ha', 'name': 'Phosphorus'},
        'K': {'min': 5, 'max': 205, 'unit': 'kg/ha', 'name': 'Potassium'},
        'temperature': {'min': 8, 'max': 45, 'unit': '°C', 'name': 'Temperature'},
        'humidity': {'min': 10, 'max': 100, 'unit': '%', 'name': 'Humidity'},
        'ph': {'min': 3.5, 'max': 10, 'unit': 'pH', 'name': 'pH Level'},
        'rainfall': {'min': 0, 'max': 1500, 'unit': 'mm', 'name': 'Rainfall'},
        'latitude': {'min': -90, 'max': 90, 'unit': 'degrees', 'name': 'Latitude'},
        'longitude': {'min': -180, 'max': 180, 'unit': 'degrees', 'name': 'Longitude'}
    }
    return jsonify(constraints), 200


@app.route('/feature-recommendations/<crop>', methods=['GET'])
def get_feature_recommendations(crop):
    if crop not in ga_features:
        return jsonify({'error': f'No GA data for crop: {crop}'}), 404
    
    return jsonify(ga_features[crop]), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        logger.info("✓ Database initialized")
    
    logger.info("=" * 60)
    logger.info("Smart Crop Guidance System - Backend Server")
    logger.info("=" * 60)
    ml_status = "✓ Basic (numpy, sklearn)" if ML_BASIC_AVAILABLE else "✗ Not Installed"
    if ML_ADVANCED_AVAILABLE:
        ml_status += " + Advanced (SHAP/LIME)"
    logger.info(f"ML Packages: {ml_status}")
    logger.info(f"Model Status: {'✓ Ready' if MODEL_LOADED else '✗ Not Loaded'}")
    logger.info("Authentication: ✓ Enabled")
    logger.info("Starting Flask server on http://0.0.0.0:5000")
    logger.info("=" * 60)
    app.run(debug=False, port=5000, host='0.0.0.0')
