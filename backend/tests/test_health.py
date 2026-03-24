
import os
import pytest

os.environ["DATABASE_URL"] = "sqlite:///test.db"

from backend.app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_route(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_invalid_route(client):
    response = client.get("/invalid")
    assert response.status_code == 404
def test_input_constraints(client):
    response = client.get("/input-constraints")
    assert response.status_code == 200