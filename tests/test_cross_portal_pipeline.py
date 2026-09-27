import pytest
from fastapi.testclient import TestClient
from app import app
from backend.api.auth import create_access_token

client = TestClient(app)

def test_rbac_access_controls():
    """
    Verify strict role-based access control (RBAC):
    1. Unauthenticated requests must return 401 Unauthorized.
    2. Candidates CANNOT access HR endpoints (returns 403 Forbidden).
    3. HR CANNOT access Candidate action endpoints (returns 403 Forbidden).
    """
    # 1. Unauthenticated checks
    res_hr = client.get("/api/hr/dashboard")
    assert res_hr.status_code == 401

    res_candidate = client.get("/api/candidate/applications")
    assert res_candidate.status_code == 401

    # 2. Candidate attempting HR route
    candidate_token = create_access_token("test-cand-id", "candidate@hireai.com", "candidate", "Test Candidate")
    cand_headers = {"Authorization": f"Bearer {candidate_token}"}
    
    res_forbidden = client.get("/api/hr/dashboard", headers=cand_headers)
    assert res_forbidden.status_code == 403
    assert "hr" in res_forbidden.json().get("detail", "").lower()

    # 3. HR attempting Candidate apply route
    hr_token = create_access_token("test-hr-id", "hr@hireai.com", "hr", "Test HR")
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    
    res_forbidden_hr = client.post("/api/candidate/apply", json={"job_id": "any-job"}, headers=hr_headers)
    assert res_forbidden_hr.status_code == 403
    assert "candidate" in res_forbidden_hr.json().get("detail", "").lower()

def test_hr_to_candidate_shortlisting_pipeline():
    """
    Verify that when HR updates a candidate status to 'shortlisted',
    the status is recorded and accessible to the pipeline.
    """
    hr_token = create_access_token("c1a1a1a1-1111-4111-a111-111111111111", "hr@hireai.com", "hr", "TechCorp HR")
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    # Test candidate status update endpoint
    cand_id = "c3a3a3a3-3333-4333-a333-333333333333"
    job_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    
    res = client.post(
        f"/api/hr/candidates/{cand_id}/status",
        json={"job_id": job_id, "status": "shortlisted"},
        headers=hr_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data.get("application", {}).get("status") == "shortlisted"
