import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from backend.api.auth import require_candidate
from backend.utils.supabase_client import get_supabase
from backend.utils.file_handler import process_and_upload_resume
from backend.services.resume_parser import ResumeParser
from backend.services.candidate_ranker import CandidateRanker
import uuid
from backend.models.candidate import CandidateProfileUpdate, ParsedResumeResponse
from backend.models.application import ApplicationCreate
try:
    from backend.services.pipeline_manager import pipeline_manager
except ImportError:
    from services.pipeline_manager import pipeline_manager

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
def upload_resume(file: UploadFile = File(...), user: Dict[str, Any] = Depends(require_candidate)):
    supabase = get_supabase()
    user_id = user["sub"]

    # 1. Process directly in-memory and upload directly to Supabase cloud storage (0 disk storage)
    file_bytes, unique_name, original_name, cloud_resume_url = process_and_upload_resume(file)

    # 2. In-Memory Deterministic Rule-Based Parsing (0 local files created)
    parsed_info = ResumeParser.parse_bytes(file_bytes, filename=original_name)
    extracted_name = parsed_info.get("name") or "Candidate Profile"
    parsed_info["resume_name"] = extracted_name

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
