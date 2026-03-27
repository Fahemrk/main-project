import pytest
import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from backend.app import app
from backend.models import db, User

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

def test_register_success(client):
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'User registered successfully'
    assert data['user']['username'] == 'testuser'

def test_register_missing_data(client):
    response = client.post('/auth/register', json={
        'username': 'testuser'
    })
    assert response.status_code == 400

def test_register_invalid_email(client):
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'invalidemail',
        'password': 'Password123'
    })
    assert response.status_code == 400
    assert response.get_json()['error'] == 'Invalid email format'

def test_register_invalid_password(client):
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'short' # too short, no number, no uppercase
    })
    assert response.status_code == 400

def test_register_duplicate_username(client):
    client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test1@example.com',
        'password': 'Password123'
    })
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test2@example.com',
        'password': 'Password123'
    })
    assert response.status_code == 409
    assert response.get_json()['error'] == 'Username already exists'

def test_login_success(client):
    client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    
    response = client.post('/auth/login', json={
        'username': 'testuser',
        'password': 'Password123'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data

def test_login_failure(client):
    client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    
    response = client.post('/auth/login', json={
        'username': 'testuser',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401

def test_protected_route_me(client):
    # Try without token
    response = client.get('/auth/me')
    assert response.status_code == 401
    
    # Register and login
    client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    login_response = client.post('/auth/login', json={
        'username': 'testuser',
        'password': 'Password123'
    })
    token = login_response.get_json()['access_token']
    
    # Access with token
    response = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert response.get_json()['user']['username'] == 'testuser'

def test_logout(client):
    client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    login_response = client.post('/auth/login', json={
        'username': 'testuser',
        'password': 'Password123'
    })
    token = login_response.get_json()['access_token']
    
    response = client.post('/auth/logout', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200

def test_history(client):
    client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Password123'
    })
    login_response = client.post('/auth/login', json={
        'username': 'testuser',
        'password': 'Password123'
    })
    token = login_response.get_json()['access_token']
    
    response = client.get('/auth/history', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert 'predictions' in response.get_json()
