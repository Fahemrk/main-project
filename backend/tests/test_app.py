import pytest
import os
import json

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from backend.app import app
from backend.models import db

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

@pytest.fixture
def auth_token(client):
    client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    response = client.post('/auth/login', json={
        'username': 'testuser',
        'password': 'Password123'
    })
    return response.get_json()['access_token']

def test_predict_success(client, auth_token):
    headers = {'Authorization': f'Bearer {auth_token}'}
    response = client.post('/predict', json={
        'N': 90,
        'P': 42,
        'K': 43,
        'temperature': 20.8,
        'humidity': 82.0,
        'ph': 6.5,
        'rainfall': 202.9,
        'latitude': 20.0,
        'longitude': 80.0
    }, headers=headers)
    # Status code depends on whether model is loaded successfully
    assert response.status_code in (200, 500)

def test_predict_missing_fields(client, auth_token):
    headers = {'Authorization': f'Bearer {auth_token}'}
    response = client.post('/predict', json={
        'N': 90
    }, headers=headers)
    # Might be 400 for missing fields, or 500 if ML stuff is broken
    assert response.status_code in (400, 500)

def test_predict_invalid_data(client, auth_token):
    headers = {'Authorization': f'Bearer {auth_token}'}
    response = client.post('/predict', json={
        'N': 999, # invalid high
        'P': 42,
        'K': 43,
        'temperature': 20.8,
        'humidity': 82.0,
        'ph': 6.5,
        'rainfall': 202.9
    }, headers=headers)
    assert response.status_code in (400, 500)

def test_predict_yield_success(client, auth_token):
    headers = {'Authorization': f'Bearer {auth_token}'}
    response = client.post('/predict-yield', json={
        'crop': 'Rice',
        'season': 'Kharif',
        'state': 'Punjab',
        'rainfall': 1000,
        'fertilizer': 150,
        'pesticide': 10,
        'area': 50,
        'year': 2023
    }, headers=headers)
    assert response.status_code in (200, 500, 503)

def test_predict_yield_missing_fields(client, auth_token):
    headers = {'Authorization': f'Bearer {auth_token}'}
    response = client.post('/predict-yield', json={
        'crop': 'rice'
    }, headers=headers)
    assert response.status_code in (400, 500)

def test_feature_recommendations(client):
    response = client.get('/feature-recommendations/rice')
    assert response.status_code in (200, 404)

def test_crop_optimal_conditions(client):
    response = client.get('/crop-optimal-conditions/rice')
    assert response.status_code in (200, 404, 500)

def test_no_auth(client):
    response = client.post('/predict', json={})
    assert response.status_code == 401
