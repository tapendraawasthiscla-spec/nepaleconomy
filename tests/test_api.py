import pytest
from fastapi.testclient import TestClient
from app.main import app
import io

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "languages" in data

def test_extract_invalid_extension():
    file_content = b"fake file content"
    response = client.post(
        "/api/extract",
        files={"file": ("test.txt", file_content, "text/plain")},
        data={"lang": "auto"}
    )
    assert response.status_code == 400
    assert "File type .txt not allowed" in response.json()["detail"]

def test_extract_invalid_lang():
    # Use a valid image extension to bypass extension check
    file_content = b"fake image"
    response = client.post(
        "/api/extract",
        files={"file": ("test.png", file_content, "image/png")},
        data={"lang": "invalid_lang"}
    )
    assert response.status_code == 400
    assert "Invalid language" in response.json()["detail"]
