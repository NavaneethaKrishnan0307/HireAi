import datetime
import logging
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from config import settings
from backend.api.auth import require_candidate
from backend.utils.supabase_client import get_supabase
from backend.utils.file_handler import process_and_upload_resume
from backend.services.resume_parser import ResumeParser
from backend.services.candidate_ranker import CandidateRanker
from backend.models.candidate import CandidateProfileUpdate, ParsedResumeResponse
from backend.models.application import ApplicationCreate
try:
    from backend.services.pipeline_manager import pipeline_manager
except ImportError:
    from services.pipeline_manager import pipeline_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/candidate", tags=["Candidate"])

@router.get("/profile")
def get_profile(user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]
    
    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    if not cand_res.data or len(cand_res.data) == 0:
        new_cand = {
            "user_id": user_id,
            "phone": "",
            "location": "",
            "current_title": "",
            "years_of_experience": 0.0,
            "education": "",
            "resume_status": "unprocessed",
            "parsed_skills": []
        }
        res_insert = supabase.table("candidates").insert(new_cand).execute()
        cand = res_insert.data[0] if res_insert.data else new_cand
    else:
        cand = cand_res.data[0]

    # Ensure parsed_skills & education fallback from parsed_data or inferred from role if empty
    import json
    if not cand.get("parsed_skills") and cand.get("parsed_data"):
        raw_pd = cand.get("parsed_data")
        if isinstance(raw_pd, str):
            try:
                raw_pd = json.loads(raw_pd)
            except Exception:
                raw_pd = {}
        if isinstance(raw_pd, dict):
            cand["parsed_skills"] = raw_pd.get("skills", []) or []

    if (not cand.get("parsed_skills") or len(cand.get("parsed_skills")) == 0) and cand.get("current_title"):
        cand["parsed_skills"] = ResumeParser.infer_skills_from_role(cand.get("current_title"))

    if not cand.get("education") and cand.get("current_title"):
        cand["education"] = ResumeParser.infer_education_from_role(cand.get("current_title"))
    
    user_res = supabase.table("users").select("full_name, email").eq("id", user_id).execute()
    if user_res.data and len(user_res.data) > 0:
        cand["full_name"] = user_res.data[0].get("full_name") or user.get("full_name", "")
        cand["email"] = user_res.data[0].get("email") or user.get("email", "")
    else:
        cand["full_name"] = user.get("full_name", "")
        cand["email"] = user.get("email", "")
    return cand


@router.put("/profile")
def update_profile(req: CandidateProfileUpdate, user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]
    
    # Validate compulsory fields
    missing = []
    if req.full_name is not None and not req.full_name.strip():
        missing.append("Full Name")
    if req.email is not None and (not req.email.strip() or "@" not in req.email):
        missing.append("Valid Email")
    if req.phone is not None and not req.phone.strip():
        missing.append("Phone Number")
    if req.location is not None and not req.location.strip():
        missing.append("Location")
    if req.current_title is not None and not req.current_title.strip():
        missing.append("Current Job Title")
    if req.education is not None and not req.education.strip():
        missing.append("Education")
    if req.parsed_skills is not None and len(req.parsed_skills) == 0:
        missing.append("Technical Skills (at least 1 required)")
    
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Compulsory profile information missing: {', '.join(missing)}."
        )

    # 1. Update user account details (full_name, email) if provided
    user_update = {}
    if req.full_name is not None and req.full_name.strip():
        user_update["full_name"] = req.full_name.strip()
    if req.email is not None and req.email.strip():
        user_update["email"] = req.email.strip().lower()
        
    if user_update:
        supabase.table("users").update(user_update).eq("id", user_id).execute()

    # 2. Update candidate professional profile & synchronize parsed_data
    cand_fields = ["phone", "location", "current_title", "years_of_experience", "education", "parsed_skills"]
    cand_update = {k: getattr(req, k) for k in cand_fields if getattr(req, k) is not None}
    
    import json
    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    if cand_res.data and len(cand_res.data) > 0:
        existing_cand = cand_res.data[0]
        raw_parsed = existing_cand.get("parsed_data") or {}
        if isinstance(raw_parsed, str):
            try:
                parsed_data = json.loads(raw_parsed)
            except Exception:
                parsed_data = {}
        elif isinstance(raw_parsed, dict):
            parsed_data = dict(raw_parsed)
        else:
            parsed_data = {}

        if req.parsed_skills is not None:
            parsed_data["skills"] = req.parsed_skills
        if req.years_of_experience is not None:
            parsed_data["years_of_experience"] = req.years_of_experience
        if req.education is not None:
            parsed_data["education"] = req.education
        if req.current_title is not None:
            parsed_data["current_title"] = req.current_title
        if req.phone is not None:
            parsed_data["phone"] = req.phone
        if req.full_name is not None and req.full_name.strip():
            parsed_data["profile_name"] = req.full_name.strip()

        cand_update["parsed_data"] = parsed_data
        if existing_cand.get("resume_filename") or existing_cand.get("resume_url"):
            cand_update["resume_status"] = "processed"
        else:
            cand_update["resume_status"] = "unprocessed"

        res = supabase.table("candidates").update(cand_update).eq("user_id", user_id).execute()
        updated = res.data[0] if res.data else cand_res.data[0]
    else:
        cand_update["user_id"] = user_id
        cand_update.setdefault("resume_status", "unprocessed")
        cand_update.setdefault("parsed_skills", req.parsed_skills or [])
        cand_update["parsed_data"] = {
            "skills": req.parsed_skills or [],
            "years_of_experience": req.years_of_experience or 0.0,
            "education": req.education or "",
            "current_title": req.current_title or "",
            "phone": req.phone or "",
            "profile_name": req.full_name or user.get("full_name", "Candidate")
        }
        res = supabase.table("candidates").insert(cand_update).execute()
        updated = res.data[0] if res.data else cand_update

    user_res = supabase.table("users").select("full_name, email").eq("id", user_id).execute()
    if user_res.data and len(user_res.data) > 0:
        updated["full_name"] = user_res.data[0].get("full_name", "")
        updated["email"] = user_res.data[0].get("email", "")
    else:
        updated["full_name"] = req.full_name or user.get("full_name", "")
        updated["email"] = req.email or user.get("email", "")

    return updated


@router.post("/resume")
def upload_resume(
    file: UploadFile = File(...),
    target_title: Optional[str] = Form(None),
    user: Dict[str, Any] = Depends(require_candidate)
):
    supabase = get_supabase()
    user_id = user["sub"]

    # 1. Process directly in-memory and upload directly to Supabase cloud storage (0 disk storage)
    file_bytes, unique_name, original_name, cloud_resume_url = process_and_upload_resume(file)

    # 2. In-Memory Deterministic Rule-Based Parsing (0 local files created)
    parsed_info = ResumeParser.parse_bytes(file_bytes, filename=original_name)
    extracted_name = parsed_info.get("name") or "Candidate Profile"
    parsed_info["resume_name"] = extracted_name

    cand_check = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    existing_cand = cand_check.data[0] if (cand_check.data and len(cand_check.data) > 0) else {}

    # 3. Full Auto-Fill & Synchronization: Determine all profile fields
    effective_title = (
        target_title.strip() if target_title and target_title.strip()
        else existing_cand.get("current_title")
        or (parsed_info.get("current_title") if parsed_info.get("current_title") and parsed_info.get("current_title") != "Software Developer" else None)
        or existing_cand.get("current_title")
        or parsed_info.get("current_title")
        or "Software Engineer"
    )

    # Skills: extract from parsed_info, fallback to existing, or intelligent role-based inference
    effective_skills = list(parsed_info.get("skills") or [])
    if not effective_skills:
        if existing_cand.get("parsed_skills") and len(existing_cand.get("parsed_skills")) > 0:
            effective_skills = list(existing_cand.get("parsed_skills"))
        else:
            effective_skills = ResumeParser.infer_skills_from_role(effective_title)

    # Education: extract from parsed_info, fallback to existing, or role-based inference
    effective_education = (
        parsed_info.get("education")
        or existing_cand.get("education")
        or ResumeParser.infer_education_from_role(effective_title)
    )

    # Experience: extract from parsed_info, fallback to existing
    effective_exp = parsed_info.get("years_of_experience")
    if effective_exp is None or (effective_exp <= 0.0 and existing_cand.get("years_of_experience")):
        effective_exp = float(existing_cand.get("years_of_experience") or 0.0)

    # Phone: extract or preserve
    effective_phone = parsed_info.get("phone") or existing_cand.get("phone") or ""

    # Location: extract or preserve
    effective_location = parsed_info.get("location") or existing_cand.get("location") or ""

    # Update parsed_info with finalized synchronized values
    parsed_info["skills"] = effective_skills
    parsed_info["current_title"] = effective_title
    parsed_info["education"] = effective_education
    parsed_info["years_of_experience"] = effective_exp
    if effective_phone:
        parsed_info["phone"] = effective_phone
    if effective_location:
        parsed_info["location"] = effective_location

    update_payload = {
        "resume_filename": original_name,
        "resume_url": cloud_resume_url,
        "resume_status": "processed",
        "current_title": effective_title,
        "parsed_skills": effective_skills,
        "education": effective_education,
        "years_of_experience": effective_exp,
        "parsed_data": parsed_info
    }

    if effective_phone:
        update_payload["phone"] = effective_phone
    if effective_location:
        update_payload["location"] = effective_location

    if existing_cand:
        cand_res = supabase.table("candidates").update(update_payload).eq("user_id", user_id).execute()
        saved_cand = cand_res.data[0] if cand_res.data else {**existing_cand, **update_payload}
    else:
        update_payload["user_id"] = user_id
        cand_res = supabase.table("candidates").insert(update_payload).execute()
        saved_cand = cand_res.data[0] if cand_res.data else update_payload

    user_res = supabase.table("users").select("full_name, email").eq("id", user_id).execute()
    if user_res.data and len(user_res.data) > 0:
        saved_cand["full_name"] = user_res.data[0].get("full_name", "")
        saved_cand["email"] = user_res.data[0].get("email", "")
    else:
        saved_cand["full_name"] = user.get("full_name", "")
        saved_cand["email"] = user.get("email", "")

    return {
        "message": "Resume processed and stored directly in cloud Supabase",
        "cloud_url": cloud_resume_url,
        "parsed_info": parsed_info,
        "profile": saved_cand
    }


@router.get("/jobs")
def get_candidate_jobs(user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    jobs_res = supabase.table("jobs").select("*").eq("status", "active").execute()
    jobs = jobs_res.data or []

    # Get candidate profile to compute personalized match score
    user_id = user["sub"]
    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    cand_data = cand_res.data[0] if cand_res.data else {}

    user_res = supabase.table("users").select("full_name, email").eq("id", user_id).execute()
    if user_res.data and len(user_res.data) > 0:
        cand_data["full_name"] = user_res.data[0].get("full_name") or user.get("full_name", "Candidate")
        cand_data["email"] = user_res.data[0].get("email") or user.get("email", "")
    else:
        cand_data["full_name"] = user.get("full_name", "Candidate")
        cand_data["email"] = user.get("email", "")

    import json
    cand_skills = cand_data.get("parsed_skills", []) or []
    if isinstance(cand_skills, str):
        try:
            cand_skills = json.loads(cand_skills)
        except Exception:
            cand_skills = [s.strip() for s in cand_skills.split(",") if s.strip()]
    if not cand_skills and cand_data.get("parsed_data"):
        raw_pd = cand_data.get("parsed_data")
        if isinstance(raw_pd, str):
            try:
                raw_pd = json.loads(raw_pd)
            except Exception:
                raw_pd = {}
        if isinstance(raw_pd, dict):
            cand_skills = raw_pd.get("skills", []) or []
            if isinstance(cand_skills, str):
                try:
                    cand_skills = json.loads(cand_skills)
                except Exception:
                    cand_skills = [s.strip() for s in cand_skills.split(",") if s.strip()]

    has_resume = bool(
        cand_data.get("resume_filename") or 
        cand_data.get("resume_url")
    )
    has_skills = bool(cand_skills and len(cand_skills) > 0)
    is_profile_complete = bool(has_resume and has_skills)

    # Get applied job IDs
    cand_id = cand_data.get("id")
    applied_job_ids = set()
    if cand_id:
        apps_res = supabase.table("applications").select("job_id").eq("candidate_id", cand_id).execute()
        applied_job_ids = {a["job_id"] for a in (apps_res.data or [])}

    results = []
    for job in jobs:
        j = dict(job)
        j["has_applied"] = j["id"] in applied_job_ids
        j["has_resume"] = has_resume
        j["has_skills"] = has_skills
        j["is_profile_complete"] = is_profile_complete
        j["can_apply"] = is_profile_complete and not j["has_applied"]
        
        # Calculate matching score and explainable gap advice
        if is_profile_complete:
            match_res = CandidateRanker.calculate_candidate_match(cand_data, j)
            j["match_score"] = match_res["overall_score"]
            j["matched_skills"] = match_res["matched_skills"]
            j["missing_skills"] = match_res["missing_skills"]
            j["skill_gap_advice"] = match_res.get("skill_gap_advice", [])
            j["match_details"] = match_res
        else:
            j["match_score"] = 0
            j["matched_skills"] = []
            req_skills = j.get("required_skills", []) or []
            j["missing_skills"] = req_skills
            advice_rec = (
                "Upload resume and complete profile to proceed."
                if not has_resume and not has_skills
                else "Upload your resume document to proceed."
                if not has_resume
                else "Complete profile skills to proceed."
            )
            j["skill_gap_advice"] = [
                {
                    "missing_skill": s,
                    "importance": "Critical",
                    "recommendation": advice_rec
                } for s in req_skills[:3]
            ]
            j["match_details"] = {
                "overall_score": 0.0,
                "domain_status": (
                    "Resume & Profile Incomplete" if not has_resume and not has_skills
                    else "Resume Required" if not has_resume
                    else "Profile Incomplete"
                ),
                "domain_warning": (
                    "Please upload your resume and complete your profile to proceed and unlock applications."
                    if not has_resume and not has_skills
                    else "Please upload your resume to proceed and unlock applications."
                    if not has_resume
                    else "Please complete your profile details to proceed and unlock applications."
                ),
                "matched_skills": [],
                "missing_skills": req_skills
            }

        results.append(j)

    # Sort by match score descending, then by title
    results.sort(key=lambda x: (x.get("match_score", 0), str(x.get("title", ""))), reverse=True)
    return results


@router.get("/jobs/{job_id}")
def get_job_detail(job_id: str, user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    job_res = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job opening not found")
    
    job = job_res.data[0]

    user_id = user["sub"]
    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    cand_data = cand_res.data[0] if cand_res.data else {}

    user_res = supabase.table("users").select("full_name, email").eq("id", user_id).execute()
    if user_res.data and len(user_res.data) > 0:
        cand_data["full_name"] = user_res.data[0].get("full_name") or user.get("full_name", "Candidate")
        cand_data["email"] = user_res.data[0].get("email") or user.get("email", "")
    else:
        cand_data["full_name"] = user.get("full_name", "Candidate")
        cand_data["email"] = user.get("email", "")

    has_resume = bool(
        cand_data.get("resume_filename") or 
        cand_data.get("resume_url")
    )
    cand_skills = cand_data.get("parsed_skills", []) or []
    is_profile_complete = bool(has_resume and cand_skills)

    cand_id = cand_data.get("id")
    has_applied = False
    if cand_id:
        app_res = supabase.table("applications").select("*").eq("job_id", job_id).eq("candidate_id", cand_id).execute()
        has_applied = bool(app_res.data)

    match_details = CandidateRanker.calculate_candidate_match(cand_data, job) if is_profile_complete else {
        "overall_score": 0.0,
        "domain_status": "Profile Incomplete",
        "domain_warning": "Upload resume to calculate match score.",
        "matched_skills": [],
        "missing_skills": job.get("required_skills", []) or []
    }

    return {
        "job": job,
        "has_applied": has_applied,
        "is_profile_complete": is_profile_complete,
        "can_apply": is_profile_complete and not has_applied,
        "match_details": match_details
    }


@router.post("/apply")
def apply_to_job(req: ApplicationCreate, user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]

    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    if not cand_res.data:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    
    candidate = cand_res.data[0]
    candidate_id = candidate["id"]

    user_res = supabase.table("users").select("full_name, email").eq("id", user_id).execute()
    if user_res.data and len(user_res.data) > 0:
        candidate["full_name"] = user_res.data[0].get("full_name") or user.get("full_name", "Candidate")
        candidate["email"] = user_res.data[0].get("email") or user.get("email", "")
    else:
        candidate["full_name"] = user.get("full_name", "Candidate")
        candidate["email"] = user.get("email", "")

    # Block application if resume is not uploaded or profile is unfilled
    import json
    cand_skills = candidate.get("parsed_skills", []) or []
    if isinstance(cand_skills, str):
        try:
            cand_skills = json.loads(cand_skills)
        except Exception:
            cand_skills = []
    
    has_resume = bool(
        candidate.get("resume_filename") or 
        candidate.get("resume_url")
    )
    if not has_resume or not cand_skills:
        raise HTTPException(
            status_code=400,
            detail="Application Blocked: You must upload your resume and complete your profile before applying for opportunities."
        )

    # Check if job exists
    job_res = supabase.table("jobs").select("*").eq("id", req.job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job opening not found")
    
    job = job_res.data[0]

    # Check if already applied
    existing_app = supabase.table("applications").select("*").eq("job_id", req.job_id).eq("candidate_id", candidate_id).execute()
    if existing_app.data and len(existing_app.data) > 0:
        raise HTTPException(status_code=400, detail="You have already applied to this position")

    # Compute and verify explainable AI matching result
    match_eval = CandidateRanker.calculate_candidate_match(candidate, job)

    # Block application if strict identity mismatch detected
    if match_eval.get("is_domain_mismatch") and match_eval.get("domain_status") == "Identity Mismatch":
        raise HTTPException(
            status_code=400,
            detail=f"Application Blocked: {match_eval.get('domain_warning')}"
        )

    # Insert application
    app_payload = {
        "job_id": req.job_id,
        "candidate_id": candidate_id,
        "status": "applied",
        "applied_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    new_app_res = supabase.table("applications").insert(app_payload).execute()
    created_app = new_app_res.data[0] if new_app_res.data else app_payload
    app_id = created_app.get("id") or str(uuid.uuid4())

    # Register persistent pipeline state
    pipeline_manager.set_state(
        app_id=app_id,
        stage="applied",
        stage_details={},
        candidate_id=candidate_id,
        job_id=req.job_id
    )

    match_payload = {
        "application_id": app_id,
        "job_id": req.job_id,
        "candidate_id": candidate_id,
        "score": match_eval["overall_score"],
        "skill_match_score": match_eval["skill_score"],
        "experience_match_score": match_eval["experience_score"],
        "education_match_score": match_eval["education_score"],
        "additional_score": match_eval["certifications_score"],
        "matched_skills": match_eval["matched_skills"],
        "missing_skills": match_eval["missing_skills"],
        "explanation": match_eval
    }
    supabase.table("matching_results").insert(match_payload).execute()

    return {
        "message": "Application submitted successfully!",
        "application": created_app,
        "match_details": match_eval
    }


def _filter_candidate_stage_details(status: str, stage_details: Dict[str, Any]) -> Dict[str, Any]:
    return pipeline_manager.filter_stage_details_for_status(status, stage_details)


@router.get("/applications")
def get_my_applications(user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]

    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    candidate_id = cand_res.data[0]["id"] if cand_res.data else None

    apps = []
    if candidate_id:
        apps_res = supabase.table("applications").select("*").eq("candidate_id", candidate_id).execute()
        apps.extend(apps_res.data or [])

    # Cross-link fallback: Also query applications where candidate_id matches user_id directly
    apps_by_user = supabase.table("applications").select("*").eq("candidate_id", user_id).execute()
    for a in (apps_by_user.data or []):
        if not any(x.get("id") == a.get("id") for x in apps):
            apps.append(a)

    jobs_res = supabase.table("jobs").select("*").execute()
    jobs_map = {j["id"]: j for j in (jobs_res.data or [])}

    results = []
    for app in apps:
        app_enriched = pipeline_manager.enrich_application(app)
        job = jobs_map.get(app_enriched.get("job_id"), {})
        status = app_enriched.get("status", "applied")
        stage_details = app_enriched.get("stage_details") or {}
        results.append({
            "id": app_enriched.get("id"),
            "job_id": app_enriched.get("job_id"),
            "job_title": job.get("title", "Software Developer"),
            "company": job.get("company", "TechCorp Solutions"),
            "location": job.get("location", "Bangalore"),
            "status": status,
            "stage": status,
            "applied_at": app_enriched.get("applied_at", "2025-07-20T10:00:00Z"),
            "min_salary": job.get("min_salary", 0),
            "max_salary": job.get("max_salary", 0),
            "stage_details": stage_details
        })

    return results


@router.get("/resume-report")
def get_candidate_resume_report(user: Dict[str, Any] = Depends(require_candidate)):
    """
    Generate comprehensive candidate AI resume audit report and multi-company job fit matrix.
    """
    supabase = get_supabase()
    user_id = user["sub"]
    
    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    cand_data = cand_res.data[0] if cand_res.data else {}
    
    user_res = supabase.table("users").select("full_name, email").eq("id", user_id).execute()
    if user_res.data and len(user_res.data) > 0:
        cand_data["full_name"] = user_res.data[0].get("full_name") or user.get("full_name", "Candidate")
        cand_data["email"] = user_res.data[0].get("email") or user.get("email", "")
    else:
        cand_data["full_name"] = user.get("full_name", "Candidate")
        cand_data["email"] = user.get("email", "")

    has_resume = bool(cand_data.get("resume_filename") or cand_data.get("resume_url"))
    if not has_resume:
        raise HTTPException(
            status_code=400,
            detail="Please upload your resume to generate your personalized report."
        )

    # Fetch active open opportunities across the platform
    jobs_res = supabase.table("jobs").select("*").eq("status", "active").execute()
    active_jobs = jobs_res.data or []

    report = CandidateRanker.generate_resume_audit_report(cand_data, active_jobs)
    return report


from pydantic import BaseModel
from typing import Optional

class SimulateMatchRequest(BaseModel):
    added_skills: Optional[List[str]] = []
    simulated_years_experience: Optional[float] = None
    simulated_education: Optional[str] = None


@router.post("/jobs/{job_id}/simulate")
def simulate_job_match(
    job_id: str,
    req: SimulateMatchRequest,
    user: Dict[str, Any] = Depends(require_candidate)
):
    """
    Pure Classical FOAI: Pre-Application Heuristic Job Simulator.
    Computes difference vector Delta(Job, Candidate), state-space projection,
    and returns projected score boost + proof trace without submitting an official application.
    """
    supabase = get_supabase()
    user_id = user["sub"]

    job_res = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job opening not found")
    job = job_res.data[0]

    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    cand_data = dict(cand_res.data[0]) if cand_res.data else {}

    # Base match calculation
    base_match = CandidateRanker.calculate_candidate_match(cand_data, job)

    # Simulated candidate profile
    simulated_cand = dict(cand_data)
    current_skills = list(cand_data.get("parsed_skills", []) or [])
    new_skills = list(set(current_skills + [s.strip() for s in (req.added_skills or []) if s.strip()]))
    simulated_cand["parsed_skills"] = new_skills

    if req.simulated_years_experience is not None:
        simulated_cand["years_of_experience"] = float(req.simulated_years_experience)
    if req.simulated_education:
        simulated_cand["education"] = req.simulated_education

    # Simulated match calculation
    simulated_match = CandidateRanker.calculate_candidate_match(simulated_cand, job)

    score_delta = round(simulated_match["overall_score"] - base_match["overall_score"], 1)

    # A* Heuristic roadmap ranking: Calculate individual marginal utility boost for each missing skill
    missing_required = base_match.get("missing_skills", [])
    marginal_boosts = []
    for skill in missing_required:
        hypo_cand = dict(cand_data)
        hypo_cand["parsed_skills"] = list(set(current_skills + [skill]))
        hypo_eval = CandidateRanker.calculate_candidate_match(hypo_cand, job)
        boost = round(hypo_eval["overall_score"] - base_match["overall_score"], 1)
        marginal_boosts.append({
            "skill": skill,
            "score_boost_percent": boost,
            "projected_total": hypo_eval["overall_score"],
            "difficulty": "Moderate (1-2 weeks)" if boost <= 15 else "High Impact"
        })
    marginal_boosts.sort(key=lambda x: x["score_boost_percent"], reverse=True)

    return {
        "job_title": job.get("title"),
        "company": job.get("company"),
        "base_score": base_match["overall_score"],
        "simulated_score": simulated_match["overall_score"],
        "score_delta": score_delta,
        "base_match": base_match,
        "simulated_match": simulated_match,
        "heuristic_skill_roadmap": marginal_boosts,
        "actionable_insight": f"Acquiring the simulated skills will boost your candidate match rating by +{score_delta}% (From {base_match['overall_score']}% to {simulated_match['overall_score']}%)."
    }


# ============================================================================
# Candidate Document Storage & Preview Management (Certifications, Referrals, etc.)
# ============================================================================

@router.get("/resume/file")
def get_resume_file(user: Dict[str, Any] = Depends(require_candidate)):
    """Serve candidate resume file directly for high-fidelity inline document preview."""
    supabase = get_supabase()
    user_id = user["sub"]
    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    if not cand_res.data:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    cand = cand_res.data[0]
    resume_fn = cand.get("resume_filename")
    if not resume_fn:
        raise HTTPException(status_code=404, detail="No resume uploaded yet")

    # Search in settings.UPLOAD_DIR
    target_path = settings.UPLOAD_DIR / resume_fn
    if not target_path.exists():
        matches = list(settings.UPLOAD_DIR.glob(f"{Path(resume_fn).stem}*"))
        if matches:
            target_path = matches[0]
        else:
            all_files = list(settings.UPLOAD_DIR.glob("*.pdf")) + list(settings.UPLOAD_DIR.glob("*.docx"))
            if all_files:
                target_path = all_files[0]
            else:
                raise HTTPException(status_code=404, detail="Resume document file not found on disk")

    media_type = "application/pdf" if target_path.suffix.lower() == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return FileResponse(
        path=str(target_path),
        media_type=media_type,
        filename=resume_fn,
        headers={"Content-Disposition": f"inline; filename=\"{resume_fn}\""}
    )


@router.get("/documents")
def get_candidate_documents(
    doc_type: Optional[str] = Query(None, alias="type"),
    user: Dict[str, Any] = Depends(require_candidate)
):
    """Retrieve all candidate uploaded documents (Certifications, Referrals, Other)."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    query = supabase.table("candidate_documents").select("*").eq("user_id", user_id)
    if doc_type and doc_type != "all":
        query = query.eq("document_type", doc_type)
        
    res = query.execute()
    docs = res.data or []
    docs.sort(key=lambda d: d.get("created_at", ""), reverse=True)
    return {"documents": docs}


@router.post("/documents")
def upload_candidate_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),  # 'certification' | 'referral' | 'other'
    title: str = Form(...),
    issuer_or_referee: str = Form(""),
    issue_date: str = Form(""),
    user: Dict[str, Any] = Depends(require_candidate)
):
    """Upload a certification, referral, or general document with verification and storage."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    cand_res = supabase.table("candidates").select("id").eq("user_id", user_id).execute()
    cand_id = cand_res.data[0]["id"] if cand_res.data else user_id

    original_name = file.filename or "document.pdf"
    file_ext = Path(original_name).suffix.lower()

    if file_ext not in settings.ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file_ext}'. Allowed formats: PDF, PNG, JPG, JPEG, DOCX."
        )

    file_bytes = file.file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Magic byte binary integrity verification
    if file_ext == ".pdf" and not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Security Verification Failed: Not a valid PDF document.")
    elif file_ext == ".png" and not file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=400, detail="Security Verification Failed: Not a valid PNG image.")
    elif file_ext in [".jpg", ".jpeg"] and not file_bytes.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=400, detail="Security Verification Failed: Not a valid JPEG image.")
    elif file_ext == ".docx" and not file_bytes.startswith(b"PK\x03\x04"):
        raise HTTPException(status_code=400, detail="Security Verification Failed: Not a valid DOCX document.")

    safe_type = document_type.strip().lower()
    if safe_type not in ["certification", "referral", "other"]:
        safe_type = "other"
        
    subfolder_name = "certifications" if safe_type == "certification" else "referrals" if safe_type == "referral" else "other"
    target_dir = settings.CANDIDATE_DOCS_DIR / subfolder_name
    target_dir.mkdir(parents=True, exist_ok=True)

    clean_stem = Path(original_name).stem.replace(" ", "_")
    unique_fn = f"{safe_type}_{clean_stem}_{uuid.uuid4().hex[:8]}{file_ext}"
    dest_path = target_dir / unique_fn

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    size_kb = len(file_bytes) / 1024
    size_str = f"{size_kb:.1f} KB" if size_kb < 1024 else f"{size_kb/1024:.2f} MB"

    mime_map = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword"
    }
    mime_type = mime_map.get(file_ext, "application/octet-stream")

    doc_id = str(uuid.uuid4())
    doc_record = {
        "id": doc_id,
        "user_id": user_id,
        "candidate_id": cand_id,
        "document_type": safe_type,
        "title": title.strip() or clean_stem.replace("_", " "),
        "issuer_or_referee": issuer_or_referee.strip(),
        "issue_date": issue_date.strip(),
        "file_name": original_name,
        "stored_filename": unique_fn,
        "file_url": f"/uploads/candidate_documents/{subfolder_name}/{unique_fn}",
        "file_size": size_str,
        "mime_type": mime_type,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    supabase.table("candidate_documents").insert(doc_record).execute()
    return {"message": "Document uploaded and saved successfully", "document": doc_record}


@router.delete("/documents/{doc_id}")
def delete_candidate_document(doc_id: str, user: Dict[str, Any] = Depends(require_candidate)):
    """Delete a candidate document by ID."""
    supabase = get_supabase()
    user_id = user["sub"]
    res = supabase.table("candidate_documents").select("*").eq("id", doc_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = res.data[0]
    
    try:
        subfolder = "certifications" if doc.get("document_type") == "certification" else "referrals" if doc.get("document_type") == "referral" else "other"
        fpath = settings.CANDIDATE_DOCS_DIR / subfolder / doc.get("stored_filename", "")
        if fpath.exists():
            fpath.unlink()
    except Exception as e:
        logger.warning(f"Failed to delete document file: {e}")

    supabase.table("candidate_documents").delete().eq("id", doc_id).execute()
    return {"message": "Document deleted successfully"}


@router.get("/documents/{doc_id}/file")
def get_candidate_document_file(doc_id: str, user: Dict[str, Any] = Depends(require_candidate)):
    """Stream candidate document directly with inline disposition for modal preview."""
    supabase = get_supabase()
    user_id = user["sub"]
    res = supabase.table("candidate_documents").select("*").eq("id", doc_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = res.data[0]
    subfolder = "certifications" if doc.get("document_type") == "certification" else "referrals" if doc.get("document_type") == "referral" else "other"
    fpath = settings.CANDIDATE_DOCS_DIR / subfolder / doc.get("stored_filename", "")
    if not fpath.exists():
        raise HTTPException(status_code=404, detail="Document file not found on disk")

    return FileResponse(
        path=str(fpath),
        media_type=doc.get("mime_type") or "application/octet-stream",
        filename=doc.get("file_name"),
        headers={"Content-Disposition": f"inline; filename=\"{doc.get('file_name')}\""}
    )
