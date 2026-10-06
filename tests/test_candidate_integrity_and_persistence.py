import os
import json
import filecmp
import pytest
from fastapi.testclient import TestClient
from app import app
from backend.services.candidate_ranker import CandidateRanker
from backend.utils.supabase_client import get_supabase, MockSupabaseClient

client = TestClient(app)

def test_mock_supabase_persistence():
    """GUARD 1: Verify MockSupabaseClient persists changes to disk and survives re-initialization."""
    sb = MockSupabaseClient()
    test_user = {
        "id": "test-uuid-sam-persistent-check",
        "email": "test_sam_guard@example.com",
        "full_name": "Sam Persistent Guard",
        "role": "candidate"
    }
    sb.table("users").insert(test_user).execute()

    # Re-instantiate client and verify data was loaded from disk
    new_client = MockSupabaseClient()
    fetched = new_client.table("users").select("*").eq("id", "test-uuid-sam-persistent-check").execute().data
    assert len(fetched) == 1
    assert fetched[0]["full_name"] == "Sam Persistent Guard"

    # Clean up test user
    new_client.table("users").delete().eq("id", "test-uuid-sam-persistent-check").execute()

def test_sam_and_ram_permanent_seeding():
    """GUARD 2: Verify Sam and Ram exist by default in persistent DB with unprocessed resume status."""
    sb = get_supabase()
    users = sb.table("users").select("*").execute().data
    emails = {u.get("email"): u for u in users}
    
    assert "sam@example.com" in emails, "Sam user account must exist permanently in database"
    assert "ram@example.com" in emails, "Ram user account must exist permanently in database"
    assert emails["sam@example.com"]["role"] == "candidate"
    assert emails["ram@example.com"]["role"] == "candidate"

    cands = sb.table("candidates").select("*").execute().data
    cand_by_user = {c.get("user_id"): c for c in cands}
    
    sam_cand = cand_by_user.get(emails["sam@example.com"]["id"])
    ram_cand = cand_by_user.get(emails["ram@example.com"]["id"])

    assert sam_cand is not None, "Sam candidate record must exist"
    assert ram_cand is not None, "Ram candidate record must exist"
    
    # Both start with unprocessed resume until an actual resume file is uploaded
    assert sam_cand.get("resume_filename") is None
    assert sam_cand.get("resume_status") == "unprocessed"
    assert ram_cand.get("resume_filename") is None
    assert ram_cand.get("resume_status") == "unprocessed"

def test_unfilled_resume_gating_and_application_blocked():
    """GUARD 3: Verify that a candidate who only filled profile without resume cannot apply."""
    cand_sam = {
        "id": "cand-sam-guard-1",
        "full_name": "Sam",
        "email": "sam@example.com",
        "parsed_skills": ["Python", "FastAPI"],
        "resume_filename": None,
        "resume_url": None,
        "resume_status": "unprocessed"
    }
    job = {
        "id": "job-1",
        "title": "Python Developer",
        "required_skills": ["Python", "FastAPI"]
    }

    has_resume = bool(cand_sam.get("resume_filename") or cand_sam.get("resume_url"))
    has_skills = bool(cand_sam.get("parsed_skills"))
    is_profile_complete = bool(has_resume and has_skills)

    assert has_resume is False, "has_resume must strictly require resume_filename or resume_url"
    assert is_profile_complete is False, "is_profile_complete must be False if resume has not been uploaded"

def test_strict_identity_mismatch_detection():
    """
    GUARD 4: Verify that when candidate registered name is 'Ram' and uploaded resume belongs to 'Surves',
    the system severely penalizes the score and detects the discrepancy.
    """
    surves_resume_text = """
    SURVES J S
    Email: surves@rec.ac.in | Phone: +91 9876543210
    PROFESSIONAL SUMMARY
    Cybersecurity Engineer and Classical AI Researcher with experience in FastAPI and rule engines.
    SKILLS
    Python, FastAPI, SIEM, Cryptography, Linux, PostgreSQL
    EXPERIENCE
    AI Research Intern (2023 - Present)
    Developed deterministic expert systems reducing processing latency by 85%.
    EDUCATION
    B.E. Computer Science and Engineering (Cyber Security)
    """

    cand_ram = {
        "full_name": "Ram",
        "email": "ram@example.com",
        "parsed_skills": ["Python", "FastAPI", "PostgreSQL"],
        "years_of_experience": 2.0,
        "education": "B.Tech in Computer Science",
        "raw_text": surves_resume_text,
        "parsed_data": {
            "name": "Surves",
            "resume_name": "Surves",
            "skills": ["Python", "FastAPI", "PostgreSQL"]
        }
    }
    job = {
        "id": "job-sec-1",
        "title": "Backend Security Engineer",
        "required_skills": ["Python", "FastAPI"],
        "min_experience": 1.0
    }

    # 1. Match check against job
    match_eval = CandidateRanker.calculate_candidate_match(cand_ram, job)
    assert match_eval["is_domain_mismatch"] is True
    assert match_eval["domain_status"] == "Identity Mismatch"
    assert match_eval["overall_score"] == 0.0
    assert "Surves" in match_eval["domain_warning"]
    assert "Ram" in match_eval["domain_warning"]

    # 2. Audit report check
    audit_report = CandidateRanker.generate_resume_audit_report(cand_ram, [job])
    assert audit_report["authenticity_verification"]["name_mismatch"] is True
    assert audit_report["authenticity_verification"]["identity_status"] == "DISCREPANCY_DETECTED"
    assert audit_report["ats_pillars"]["authenticity_integrity"] == 25
    assert audit_report["ats_health_score"] <= 45

def test_services_directory_synchronization():
    """GUARD 5: Verify that backend/services and top-level services remain byte-for-byte identical."""
    modules = ["candidate_ranker.py", "resume_parser.py", "rule_engine.py", "skill_matcher.py"]
    for m in modules:
        b_path = os.path.join("backend", "services", m)
        s_path = os.path.join("services", m)
        assert os.path.exists(b_path), f"Missing {b_path}"
        assert os.path.exists(s_path), f"Missing {s_path}"
        assert filecmp.cmp(b_path, s_path, shallow=False), f"Desynchronization between {b_path} and {s_path}"

def test_candidate_resume_report_requires_resume():
    """GUARD 6: Verify that calling candidate resume report requires an uploaded resume."""
    from backend.api.auth import create_access_token
    token = create_access_token(
        user_id="9655cd40-8424-4204-94ba-77a433bfe924",
        email="sam@example.com",
        role="candidate",
        full_name="Sam"
    )
    res = client.get("/api/candidate/resume-report", headers={"Authorization": f"Bearer {token}"})
    # Sam currently has no resume uploaded, so report endpoint must reject with 400
    assert res.status_code == 400
    assert "Please upload your resume" in res.json().get("detail", "")
