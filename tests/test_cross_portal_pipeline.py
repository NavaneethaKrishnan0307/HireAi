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

def test_resume_analyzer_and_report_generator():
    """
    Verify that candidate and HR can retrieve comprehensive AI Resume Audit Reports
    including ATS scores, skill taxonomy, strengths, weaknesses, and platform job fit matrix.
    """
    # 1. Candidate report
    cand_token = create_access_token("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", "rahul.sharma@email.com", "candidate", "Rahul Sharma")
    cand_headers = {"Authorization": f"Bearer {cand_token}"}
    
    res_cand = client.get("/api/candidate/resume-report", headers=cand_headers)
    assert res_cand.status_code == 200
    cand_report = res_cand.json()
    assert "ats_health_score" in cand_report
    assert "skill_taxonomy" in cand_report
    assert "strengths" in cand_report
    assert "weaknesses" in cand_report
    assert "job_matrix" in cand_report

    # 2. HR candidate report
    hr_token = create_access_token("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "hr@techcorp.com", "hr", "Sarah Jenkins")
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    
    cand_id = "11111111-1111-1111-1111-111111111111"
    res_hr = client.get(f"/api/hr/candidates/{cand_id}/report", headers=hr_headers)
    assert res_hr.status_code == 200
    hr_report = res_hr.json()
    assert hr_report["candidate_name"] == "Rahul Sharma"
    assert hr_report["ats_health_score"] >= 40


def test_hr_pipeline_and_stage_scheduling_flow():
    """
    Verify full HR recruitment pipeline:
    1. HR fetches Kanban pipeline.
    2. HR moves candidate to technical_assessment with test link and date.
    3. HR moves candidate to interview_scheduled with meet link and time.
    4. HR extends job offer with compensation, role, joining date, and rules URL.
    5. Candidate retrieves their applications and verifies all stage details and offer reflect.
    """
    hr_token = create_access_token("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "hr@techcorp.com", "hr", "Sarah Jenkins")
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    cand_id = "11111111-1111-1111-1111-111111111111"
    job_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"

    # 1. Fetch HR Kanban pipeline
    res_pipeline = client.get("/api/hr/pipeline", headers=hr_headers)
    assert res_pipeline.status_code == 200
    pipeline_data = res_pipeline.json()
    assert "pipeline_stages" in pipeline_data
    assert "applied" in pipeline_data["pipeline_stages"]

    # 2. Move to technical assessment with scheduling info
    tech_details = {
        "mode": "online",
        "scheduled_date": "2026-10-01",
        "scheduled_time": "10:00 AM IST",
        "link": "https://hackerrank.com/test/hireai-eval",
        "instructions": "Complete 2 coding challenges within 60 minutes."
    }
    res_move_tech = client.post(
        "/api/hr/pipeline/move",
        json={
            "candidate_id": cand_id,
            "job_id": job_id,
            "target_stage": "technical_assessment",
            "stage_details": {"technical_assessment": tech_details}
        },
        headers=hr_headers
    )
    assert res_move_tech.status_code == 200
    app_id = res_move_tech.json()["application"]["id"]

    # 3. Schedule Interview with meeting link
    interview_details = {
        "mode": "online",
        "scheduled_date": "2026-10-05",
        "scheduled_time": "02:30 PM IST",
        "link": "https://meet.google.com/hireai-interview",
        "interviewer_name": "Sarah Jenkins (Lead Architect)",
        "instructions": "System design and deep-dive technical architecture discussion."
    }
    res_move_interview = client.post(
        f"/api/hr/applications/{app_id}/stage-details",
        json={
            "target_stage": "interview_scheduled",
            "stage_details": {"interview_scheduled": interview_details}
        },
        headers=hr_headers
    )
    assert res_move_interview.status_code == 200

    # 4. Extend official Job Offer
    offer_details = {
        "role_title": "Senior Python Backend Engineer",
        "compensation": "₹22,00,000 / annum + ESOPs",
        "joining_date": "2026-11-01",
        "venue_location": "Bangalore Campus / Hybrid",
        "company_rules_url": "https://techcorp.com/careers/employee-handbook-policy",
        "notes": "Delighted to offer you this role! Please review and confirm acceptance."
    }
    res_offer = client.post(
        "/api/hr/pipeline/move",
        json={
            "application_id": app_id,
            "target_stage": "offer_extended",
            "stage_details": {"offer_extended": offer_details}
        },
        headers=hr_headers
    )
    assert res_offer.status_code == 200

    # 5. Candidate checks applications
    cand_token = create_access_token("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", "rahul.sharma@email.com", "candidate", "Rahul Sharma")
    cand_headers = {"Authorization": f"Bearer {cand_token}"}
    res_cand_apps = client.get("/api/candidate/applications", headers=cand_headers)
    assert res_cand_apps.status_code == 200
    cand_apps = res_cand_apps.json()
    assert len(cand_apps) > 0
    target_app = next((a for a in cand_apps if a.get("id") == app_id), cand_apps[0])
    assert target_app["status"] == "offer_extended"
    stage_d = target_app.get("stage_details", {})
    assert "offer_extended" in stage_d
    assert stage_d["offer_extended"]["role_title"] == "Senior Python Backend Engineer"
    assert stage_d["offer_extended"]["compensation"] == "₹22,00,000 / annum + ESOPs"
    assert "interview_scheduled" in stage_d
    assert stage_d["interview_scheduled"]["link"] == "https://meet.google.com/hireai-interview"
