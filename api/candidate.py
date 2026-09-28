import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from backend.api.auth import require_candidate
from backend.utils.supabase_client import get_supabase
from backend.utils.file_handler import process_and_upload_resume
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
    
    # 1. Update user account details (full_name, email) if provided
    user_update = {}
    if req.full_name is not None and req.full_name.strip():
        user_update["full_name"] = req.full_name.strip()
    if req.email is not None and req.email.strip():
        user_update["email"] = req.email.strip().lower()
        
    if user_update:
        supabase.table("users").update(user_update).eq("id", user_id).execute()

    # 2. Update candidate professional profile
    cand_fields = ["phone", "location", "current_title", "years_of_experience", "education", "parsed_skills"]
    cand_update = {k: getattr(req, k) for k in cand_fields if getattr(req, k) is not None}
    
    cand_res = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    if cand_res.data and len(cand_res.data) > 0:
        if cand_update:
            res = supabase.table("candidates").update(cand_update).eq("user_id", user_id).execute()
            updated = res.data[0] if res.data else cand_res.data[0]
        else:
            updated = cand_res.data[0]
    else:
        cand_update["user_id"] = user_id
        cand_update.setdefault("resume_status", "unprocessed")
        cand_update.setdefault("parsed_skills", [])
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
def upload_resume(file: UploadFile = File(...), user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]

    # 1. Process directly in-memory and upload directly to Supabase cloud storage (0 disk storage)
    file_bytes, unique_name, original_name, cloud_resume_url = process_and_upload_resume(file)

    # 2. In-Memory Deterministic Rule-Based Parsing (0 local files created)
    parsed_info = ResumeParser.parse_bytes(file_bytes, filename=original_name)

    # 3. Update or create candidate database record with cloud storage pointer
    update_payload = {
        "resume_filename": original_name,
        "resume_url": cloud_resume_url,
        "resume_status": "processed",
        "parsed_skills": parsed_info["skills"],
        "education": parsed_info["education"] or "Graduate",
        "years_of_experience": parsed_info["years_of_experience"],
        "parsed_data": parsed_info
    }

    if parsed_info.get("phone"):
        update_payload["phone"] = parsed_info["phone"]

    cand_check = supabase.table("candidates").select("*").eq("user_id", user_id).execute()
    if cand_check.data and len(cand_check.data) > 0:
        cand_res = supabase.table("candidates").update(update_payload).eq("user_id", user_id).execute()
        saved_cand = cand_res.data[0] if cand_res.data else update_payload
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
        if cand_data.get("parsed_skills") and len(cand_data.get("parsed_skills", [])) > 0:
            match_res = CandidateRanker.calculate_candidate_match(cand_data, j)
            j["match_score"] = match_res["overall_score"]
            j["matched_skills"] = match_res["matched_skills"]
            j["missing_skills"] = match_res["missing_skills"]
            j["skill_gap_advice"] = match_res.get("skill_gap_advice", [])
            j["match_details"] = match_res
        else:
            j["match_score"] = 0
            j["matched_skills"] = []
            req_skills = j.get("required_skills", [])
            j["missing_skills"] = req_skills
            # Generate constructive advice for required skills
            j["skill_gap_advice"] = CandidateRanker.generate_skill_gap_advice(
                missing_skills=req_skills,
                total_req_skills=len(req_skills),
                skill_weight=0.50
            )

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

class TransformBulletRequest(BaseModel):
    raw_bullet: str


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


@router.post("/transform-bullet")
def transform_resume_bullet(
    req: TransformBulletRequest,
    user: Dict[str, Any] = Depends(require_candidate)
):
    """
    Pure Classical FOAI: Context-Free Grammar (CFG) STAR Bullet Transformer.
    Converts weak/passive phrases into deterministic STAR power templates.
    """
    try:
        from backend.services.rule_engine import RuleEngine
    except ImportError:
        from services.rule_engine import RuleEngine
    result = RuleEngine.transform_to_star_bullets(req.raw_bullet)
    return result
