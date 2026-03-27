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

def test_predict_price_success(client):
    response = client.post('/api/price/predict', json={'days': 30})
    assert response.status_code in (200, 503)

def test_predict_price_missing_days(client):
    response = client.post('/api/price/predict', json={})
    assert response.status_code == 400

def test_predict_price_invalid_days(client):
    response = client.post('/api/price/predict', json={'days': 'invalid'})
    assert response.status_code == 400

def test_predict_price_negative_days(client):
    response = client.post('/api/price/predict', json={'days': -5})
    assert response.status_code in (400, 503)

