import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from backend.api.auth import require_candidate
from backend.utils.supabase_client import get_supabase
from backend.utils.file_handler import validate_and_save_resume
from backend.services.resume_parser import ResumeParser
from backend.services.candidate_ranker import CandidateRanker
from backend.models.candidate import CandidateProfileUpdate, ParsedResumeResponse
from backend.models.application import ApplicationCreate

router = APIRouter(prefix="/candidate", tags=["Candidate"])

@router.get("/profile")
def get_profile(user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]
    
    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    if not cand_res.data or len(cand_res.data) == 0:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    
    cand = cand_res.data[0]
    cand["full_name"] = user.get("full_name", "")
    cand["email"] = user.get("email", "")
    return cand


@router.put("/profile")
def update_profile(req: CandidateProfileUpdate, user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]
    
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    
    cand_res = supabase.table("candidates").update(update_data).eq("user_id", user_id).execute()
    if not cand_res.data:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    
    updated = cand_res.data[0]
    updated["full_name"] = user.get("full_name", "")
    updated["email"] = user.get("email", "")
    return updated


@router.post("/resume")
def upload_resume(file: UploadFile = File(...), user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]

    # 1. Validate and save resume file
    saved_path, unique_name, original_name = validate_and_save_resume(file)

    # 2. Deterministic Rule-Based Parsing
    parsed_info = ResumeParser.parse_file(saved_path)

    # 3. Update candidate database record
    update_payload = {
        "resume_filename": original_name,
        "resume_url": f"/uploads/resumes/{unique_name}",
        "resume_status": "processed",
        "parsed_skills": parsed_info["skills"],
        "education": parsed_info["education"] or "Graduate",
        "years_of_experience": parsed_info["years_of_experience"],
        "parsed_data": parsed_info
    }

    if parsed_info.get("phone"):
        update_payload["phone"] = parsed_info["phone"]

    cand_res = supabase.table("candidates").update(update_payload).eq("user_id", user_id).execute()
    
    return {
        "message": "Resume uploaded and parsed successfully",
        "parsed_info": parsed_info,
        "profile": cand_res.data[0] if cand_res.data else update_payload
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
        
        # Calculate matching score and explainable gap advice
        if cand_data.get("parsed_skills"):
            match_res = CandidateRanker.calculate_candidate_match(cand_data, j)
            j["match_score"] = match_res["overall_score"]
            j["matched_skills"] = match_res["matched_skills"]
            j["missing_skills"] = match_res["missing_skills"]
            j["skill_gap_advice"] = match_res.get("skill_gap_advice", [])
            j["match_details"] = match_res
        else:
            j["match_score"] = 0
            j["matched_skills"] = []
            j["missing_skills"] = j.get("required_skills", [])
            j["skill_gap_advice"] = []

        results.append(j)

    # Sort by match score descending
    results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
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

    cand_id = cand_data.get("id")
    has_applied = False
    if cand_id:
        app_res = supabase.table("applications").select("*").eq("job_id", job_id).eq("candidate_id", cand_id).execute()
        has_applied = bool(app_res.data)

    match_details = CandidateRanker.calculate_candidate_match(cand_data, job) if cand_data else None

    return {
        "job": job,
        "has_applied": has_applied,
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

    # Check if job exists
    job_res = supabase.table("jobs").select("*").eq("id", req.job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job opening not found")
    
    job = job_res.data[0]

    # Check if already applied
    existing_app = supabase.table("applications").select("*").eq("job_id", req.job_id).eq("candidate_id", candidate_id).execute()
    if existing_app.data and len(existing_app.data) > 0:
        raise HTTPException(status_code=400, detail="You have already applied to this position")

    # Insert application
    app_payload = {
        "job_id": req.job_id,
        "candidate_id": candidate_id,
        "status": "applied"
    }
    new_app_res = supabase.table("applications").insert(app_payload).execute()
    created_app = new_app_res.data[0] if new_app_res.data else app_payload

    # Compute and save explainable AI matching result
    match_eval = CandidateRanker.calculate_candidate_match(candidate, job)
    match_payload = {
        "application_id": created_app.get("id"),
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


@router.get("/applications")
def get_my_applications(user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]

    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    if not cand_res.data:
        return []

    candidate_id = cand_res.data[0]["id"]
    apps_res = supabase.table("applications").select("*").eq("candidate_id", candidate_id).execute()
    apps = apps_res.data or []

    jobs_res = supabase.table("jobs").select("*").execute()
    jobs_map = {j["id"]: j for j in (jobs_res.data or [])}

    results = []
    for app in apps:
        job = jobs_map.get(app.get("job_id"), {})
        results.append({
            "id": app.get("id"),
            "job_id": app.get("job_id"),
            "job_title": job.get("title", "Software Developer"),
            "company": job.get("company", "TechCorp Solutions"),
            "location": job.get("location", "Bangalore"),
            "status": app.get("status", "applied"),
            "applied_at": app.get("applied_at", "2025-07-20T10:00:00Z"),
            "min_salary": job.get("min_salary", 0),
            "max_salary": job.get("max_salary", 0)
        })

    return results
