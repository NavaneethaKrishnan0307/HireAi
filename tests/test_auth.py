import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_candidate_registration_and_login():
    import uuid
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    # 1. Register candidate
    reg_payload = {
        "email": test_email,
        "password": "securepassword123",
        "full_name": "Test Candidate User",
        "role": "candidate"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "token" in reg_data
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["role"] == "candidate"

    # 2. Login candidate
    login_payload = {
        "email": test_email,
        "password": "securepassword123"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "token" in login_data

    # Clean up test user from database
    from backend.utils.supabase_client import get_supabase
    sb = get_supabase()
    user_id = reg_data["user"]["id"]
    sb.table("candidates").delete().eq("user_id", user_id).execute()
    sb.table("users").delete().eq("id", user_id).execute()

def test_invalid_login():
    res = client.post("/api/auth/login", json={
        "email": "nonexistent_user@example.com",
        "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_unauthorized_access():
    # Candidate trying to access HR dashboard without token
    res = client.get("/api/hr/dashboard")
    assert res.status_code == 401
