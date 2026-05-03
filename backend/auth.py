from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models import db, User, PredictionHistory
import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    if not any(c.isupper() for c in password):
        return False, 'Password must contain at least one uppercase letter'
    if not any(c.isdigit() for c in password):
        return False, 'Password must contain at least one digit'
    return True, ''


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')

        if not all([username, email, password]):
            return jsonify({'error': 'Username, email, and password are required'}), 400

        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters long'}), 400

        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 409

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        logger.info(f"User registered: {username}")

        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': 'Registration failed. Please try again.'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        username_or_email = data.get('username', '').strip()
        password = data.get('password', '')

        if not all([username_or_email, password]):
            return jsonify({'error': 'Username/email and password are required'}), 400

        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()

        if not user or not user.check_password(password):
            logger.warning(f"Failed login attempt for: {username_or_email}")
            return jsonify({'error': 'Invalid username, email, or password'}), 401

        access_token = create_access_token(identity=str(user.id))

        logger.info(f"User logged in: {user.username}")

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Login failed. Please try again.'}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    logger.info(f"User logged out: {user_id}")
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user.to_dict()}), 200

    except Exception as e:
        logger.error(f"Error fetching current user: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to fetch user'}), 500


@auth_bp.route('/history', methods=['GET'])
@jwt_required()
def get_prediction_history():
    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        limit = request.args.get('limit', default=20, type=int)
        offset = request.args.get('offset', default=0, type=int)

        predictions = PredictionHistory.query.filter_by(user_id=user.id).order_by(
            PredictionHistory.created_at.desc()
        ).limit(limit).offset(offset).all()

        return jsonify({
            'predictions': [p.to_dict() for p in predictions],
            'total': len(user.predictions)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching prediction history: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to fetch history'}), 500
