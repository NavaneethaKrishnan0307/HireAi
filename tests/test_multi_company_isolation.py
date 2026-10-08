import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app import app
from backend.api.auth import create_access_token
from backend.services.company_vault import company_vault_manager, get_company_slug

client = TestClient(app)

def test_multi_company_profiles_and_job_scoping():
    """
    Verify each HR account is bound to their company tenant and only sees their own jobs.
    """
    # 1. Azenture HR Token
    az_token = create_access_token("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", "azhr@gmail.com", "hr", "TOM")
    az_headers = {"Authorization": f"Bearer {az_token}"}

    # 2. TechCorp HR Token
    tc_token = create_access_token("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "hr@techcorp.com", "hr", "Sarah Jenkins")
    tc_headers = {"Authorization": f"Bearer {tc_token}"}

    # 3. Google HR Token
    gh_token = create_access_token("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88", "ghr@gmail.com", "hr", "Tim")
    gh_headers = {"Authorization": f"Bearer {gh_token}"}

    # Check Azenture jobs
    res_az = client.get("/api/hr/jobs", headers=az_headers)
    assert res_az.status_code == 200
    az_jobs = res_az.json()
    assert len(az_jobs) > 0
    for j in az_jobs:
        assert j["company"].lower() == "azenture"

    # Check TechCorp jobs
    res_tc = client.get("/api/hr/jobs", headers=tc_headers)
    assert res_tc.status_code == 200
    tc_jobs = res_tc.json()
    assert len(tc_jobs) > 0
    for j in tc_jobs:
        assert j["company"].lower() == "techcorp solutions"

    # Check Google jobs
    res_gh = client.get("/api/hr/jobs", headers=gh_headers)
    assert res_gh.status_code == 200
    gh_jobs = res_gh.json()
    assert len(gh_jobs) > 0
    for j in gh_jobs:
        assert j["company"].lower() == "google"


def test_cross_tenant_access_blocked_with_403():
    """
    Verify strict 403 Forbidden defense:
    An HR cannot view, update, delete, or modify applicants of another company's job.
    """
    az_token = create_access_token("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", "azhr@gmail.com", "hr", "TOM")
    az_headers = {"Authorization": f"Bearer {az_token}"}

    tc_job_id = "55555555-5555-5555-5555-555555555551" # TechCorp job

    # 1. Azenture HR attempts to view TechCorp applicants -> 403 Forbidden
    res_applicants = client.get(f"/api/hr/jobs/{tc_job_id}/applicants", headers=az_headers)
    assert res_applicants.status_code == 403
    assert "tenant isolation policy" in res_applicants.json().get("detail", "").lower()

    # 2. Azenture HR attempts to update TechCorp job -> 403 Forbidden
    res_update = client.put(f"/api/hr/jobs/{tc_job_id}", json={"title": "Hacked Title"}, headers=az_headers)
    assert res_update.status_code == 403
    assert "tenant isolation policy" in res_update.json().get("detail", "").lower()

    # 3. Azenture HR attempts to delete TechCorp job -> 403 Forbidden
    res_delete = client.delete(f"/api/hr/jobs/{tc_job_id}", headers=az_headers)
    assert res_delete.status_code == 403
    assert "tenant isolation policy" in res_delete.json().get("detail", "").lower()


def test_company_vault_physical_isolation():
    """
    Verify physical directory isolation under database/companies/{slug}/.
    """
    az_token = create_access_token("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", "azhr@gmail.com", "hr", "TOM")
    az_headers = {"Authorization": f"Bearer {az_token}"}

    res_vault = client.get("/api/hr/company-vault", headers=az_headers)
    assert res_vault.status_code == 200
    vault_info = res_vault.json()
    assert vault_info["company_name"] == "AZENTURE"
    assert vault_info["status"] == "isolated_secure"
    assert "azenture" in vault_info["vault_directory"]

    # Verify physical file existence
    vault_dir = Path("database/companies/azenture")
    assert vault_dir.exists()
    assert (vault_dir / "company_profile.json").exists()
    assert (vault_dir / "jobs.json").exists()
    assert (vault_dir / "pipeline_state.json").exists()


def test_candidate_sees_all_mnc_jobs():
    """
    The Golden Rule:
    Candidate portal remains unchanged.
    Candidates view jobs from ALL companies (TechCorp, AZENTURE, Google) with clear company branding.
    """
    cand_token = create_access_token("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", "rahul.sharma@email.com", "candidate", "Rahul Sharma")
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    res_jobs = client.get("/api/candidate/jobs", headers=cand_headers)
    assert res_jobs.status_code == 200
    all_jobs = res_jobs.json()
    companies = {j.get("company") for j in all_jobs}

    assert "TechCorp Solutions" in companies
    assert "AZENTURE" in companies
    assert "Google" in companies
