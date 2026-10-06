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

def test_forgot_and_reset_password_flow():
    import uuid
    test_email = f"reset_{uuid.uuid4().hex[:8]}@example.com"
    old_pw = "initialpassword123"
    new_pw = "newsupersecretpass456"

    # 1. Register candidate
    reg_payload = {
        "email": test_email,
        "password": old_pw,
        "full_name": "Reset Password Test User",
        "role": "candidate"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200

    # 2. Forgot password verification for registered user
    forgot_res = client.post("/api/auth/forgot-password", json={"email": test_email})
    assert forgot_res.status_code == 200
    forgot_data = forgot_res.json()
    assert forgot_data["status"] == "ok"
    assert forgot_data["email"] == test_email

    # 3. Forgot password verification for non-existent user
    non_existent = client.post("/api/auth/forgot-password", json={"email": "nobody_exists_here@test.com"})
    assert non_existent.status_code == 404

    # 4. Reset password
    reset_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "new_password": new_pw
    })
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "ok"

    # 5. Old password must now fail
    old_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": old_pw
    })
    assert old_login.status_code == 401

    # 6. New password must succeed
    new_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": new_pw
    })
    assert new_login.status_code == 200
    assert "token" in new_login.json()

    # Clean up test user
    from backend.utils.supabase_client import get_supabase
    sb = get_supabase()
    user_id = reg_res.json()["user"]["id"]
    sb.table("candidates").delete().eq("user_id", user_id).execute()
    sb.table("users").delete().eq("id", user_id).execute()

