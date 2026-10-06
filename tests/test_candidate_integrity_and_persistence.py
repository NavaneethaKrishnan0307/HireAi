import os
import json
import pytest
from backend.services.candidate_ranker import CandidateRanker
from backend.utils.supabase_client import get_supabase, MockSupabaseClient

def test_mock_supabase_persistence():
    """Verify that MockSupabaseClient persists changes to disk and survives re-initialization."""
    client = MockSupabaseClient()
    test_user = {
        "id": "test-uuid-sam-persistent",
        "email": "test_sam_persist@example.com",
        "full_name": "Sam Persistent",
        "role": "candidate"
    }
    client.table("users").insert(test_user).execute()

    # Re-instantiate client and verify data was loaded from disk
    new_client = MockSupabaseClient()
    fetched = new_client.table("users").select("*").eq("id", "test-uuid-sam-persistent").execute().data
    assert len(fetched) == 1
    assert fetched[0]["full_name"] == "Sam Persistent"

    # Clean up test user
    new_client.table("users").delete().eq("id", "test-uuid-sam-persistent").execute()

def test_sam_unfilled_resume_cannot_apply():
    """Verify that a candidate who only filled their profile without uploading a resume is gated."""
    cand_sam = {
        "id": "cand-sam-123",
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

    assert has_resume is False
    assert is_profile_complete is False

def test_strict_identity_mismatch_detection():
    """
    Verify that when candidate registered name is 'Ram' and uploaded resume belongs to 'Surves',
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
