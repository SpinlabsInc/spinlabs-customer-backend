import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from ..src.main import app  # Use relative import


# Add the absolute path to the `src` directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../src')))


client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Laundry Service API"}

@patch('src.main.table.put_item')
def test_create_user(mock_put_item):
    mock_put_item.return_value = {}
    response = client.post(
        "/users/",
        json={"id": "1", "name": "Test User", "email": "test@example.com"}
    )
    assert response.status_code == 200
    assert response.json() == {"message": "User created successfully"}

@patch('src.main.table.query')
def test_get_user(mock_query):
    mock_query.return_value = {
        'Items': [{"id": "1", "name": "Test User", "email": "test@example.com"}]
    }
    response = client.get("/users/1")
    assert response.status_code == 200
    assert response.json() == {"id": "1", "name": "Test User", "email": "test@example.com"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
