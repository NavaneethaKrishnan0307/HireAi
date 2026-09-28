from typing import Dict, Any, List, Optional
import io
import csv
import datetime
from fastapi import APIRouter, HTTPException, Depends, Query, Response
from backend.api.auth import require_hr
from backend.utils.supabase_client import get_supabase
from backend.services.candidate_ranker import CandidateRanker
from backend.models.job import JobCreate, JobUpdate, JobSearchQuery
from backend.models.application import ApplicationStatusUpdate, CandidateStatusUpdate

router = APIRouter(prefix="/hr", tags=["HR"])

def _get_hr_profile(user_id: str, supabase) -> Dict[str, Any]:
    hr_res = supabase.table("hr_users").select("*").eq("user_id", user_id).execute()
    if hr_res.data and len(hr_res.data) > 0:
        return hr_res.data[0]
    return {"id": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01", "company_name": "TechCorp Solutions"}


def _enrich_candidate(cand: Dict[str, Any], user_map: Dict[str, Any]) -> Dict[str, Any]:
    c = dict(cand)
    user_id = str(c.get("user_id") or "")
    cand_id = str(c.get("id") or "")
    
    u_info = user_map.get(user_id) or user_map.get(cand_id) or {}
    
    name = (
        u_info.get("full_name")
        or c.get("full_name")
        or c.get("name")
        or (c.get("parsed_data", {}).get("name") if isinstance(c.get("parsed_data"), dict) else None)
        or (u_info.get("email", "").split("@")[0].capitalize() if u_info.get("email") else None)
        or (c.get("email", "").split("@")[0].capitalize() if c.get("email") else None)
        or "Candidate"
    )
    email = u_info.get("email") or c.get("email") or ""
    avatar = u_info.get("avatar_url") or c.get("avatar_url") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    
    c["full_name"] = name
    c["email"] = email
    c["avatar_url"] = avatar
    return c


@router.get("/dashboard")
def get_dashboard(user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    hr_profile = _get_hr_profile(user["sub"], supabase)

    # 1. Fetch Jobs
    jobs_res = supabase.table("jobs").select("*").execute()
    jobs = jobs_res.data or []

    # 2. Fetch Candidates
    cands_res = supabase.table("candidates").select("*").execute()
    candidates = cands_res.data or []

    # 3. Fetch Users for Candidate mapping
    users_res = supabase.table("users").select("*").execute()
    user_map = {str(u["id"]): u for u in (users_res.data or []) if "id" in u}

    # 4. Fetch Applications
    apps_res = supabase.table("applications").select("*").execute()
    applications = apps_res.data or []

    shortlisted_count = sum(1 for a in applications if a.get("status") == "shortlisted")

    # 5. Populate candidate details
    enriched_candidates = [_enrich_candidate(cand, user_map) for cand in candidates]

    # 6. Generate Top Candidate Matches for default job
    default_job = jobs[0] if jobs else {
        "id": "default",
        "title": "Software Engineer",
        "required_skills": ["Python", "SQL", "AWS"],
        "min_experience": 3.0,
        "education_required": "B.Tech/B.E."
    }
    top_matches = CandidateRanker.rank_candidates(enriched_candidates, default_job)

    return {
        "stats": {
            "total_jobs": len(jobs),
            "total_applicants": len(applications),
            "shortlisted_count": shortlisted_count,
            "total_candidates": len(candidates)
        },
        "recent_jobs": jobs[:5],
        "top_matches": top_matches[:5],
        "active_job": default_job
    }


@router.post("/search-candidates")
def search_candidates(query: JobSearchQuery, user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()

    # Fetch candidates & users
    cands_res = supabase.table("candidates").select("*").execute()
    candidates = cands_res.data or []

    users_res = supabase.table("users").select("*").execute()
    user_map = {str(u["id"]): u for u in (users_res.data or []) if "id" in u}

    enriched = []
    for cand in candidates:
        c = _enrich_candidate(cand, user_map)
        
        # Location filter if specified
        if query.location and query.location.strip():
            cand_loc = str(c.get("location", "")).lower()
            query_locs = [l.strip().lower() for l in query.location.split(",") if l.strip()]
            if not any(ql in cand_loc for ql in query_locs):
                continue
        
        enriched.append(c)

    # Formulate pseudo-job from HR search criteria
    search_job_spec = {
        "title": query.title or "Target Role",
        "required_skills": [s.strip() for s in (query.skills or "").split(",") if s.strip()],
        "min_experience": float(query.min_experience or 0.0),
        "education_required": query.education or "Any Graduate",
        "certifications_preferred": [c.strip() for c in (query.certifications or "").split(",") if c.strip()]
    }

    custom_weights = {
        "skills": float(query.weight_skills or 0.50),
        "experience": float(query.weight_experience or 0.25),
        "education": float(query.weight_education or 0.15),
        "additional": float(query.weight_additional or 0.10)
    }

    ranked_results = CandidateRanker.rank_candidates(enriched, search_job_spec, custom_weights=custom_weights)

    return {
        "query": query.model_dump(),
        "applied_weights": custom_weights,
        "total_results": len(ranked_results),
        "results": ranked_results
    }


@router.get("/jobs")
def get_hr_jobs(user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    jobs_res = supabase.table("jobs").select("*").order("created_at", desc=True).execute()
    jobs = jobs_res.data or []

    # Attach applicant counts
    apps_res = supabase.table("applications").select("job_id").execute()
    apps = apps_res.data or []
    counts = {}
    for a in apps:
        jid = a.get("job_id")
        counts[jid] = counts.get(jid, 0) + 1

    for j in jobs:
        j["applicant_count"] = counts.get(j.get("id"), 0)

    return jobs


@router.post("/jobs")
def create_job(req: JobCreate, user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    hr_profile = _get_hr_profile(user["sub"], supabase)

    job_payload = {
        "hr_id": hr_profile.get("id"),
        "title": req.title,
        "company": req.company or hr_profile.get("company_name", "TechCorp Solutions"),
        "location": req.location,
        "min_experience": req.min_experience,
        "max_experience": req.max_experience,
        "min_salary": req.min_salary,
        "max_salary": req.max_salary,
        "education_required": req.education_required,
        "required_skills": req.required_skills,
        "preferred_skills": req.preferred_skills,
        "certifications_preferred": req.certifications_preferred,
        "description": req.description,
        "status": req.status or "active",
        "scoring_weights": req.scoring_weights or {"skills": 0.50, "experience": 0.25, "education": 0.15, "additional": 0.10}
    }

    res = supabase.table("jobs").insert(job_payload).execute()
    created_job = res.data[0] if res.data else job_payload

    # Create job_requirements entry
    req_payload = {
        "job_id": created_job.get("id"),
        "required_skills": req.required_skills,
        "preferred_skills": req.preferred_skills,
        "min_experience_years": req.min_experience,
        "education_level": req.education_required,
        "certification_list": req.certifications_preferred
    }
    supabase.table("job_requirements").insert(req_payload).execute()

    return created_job


@router.put("/jobs/{job_id}")
def update_job(job_id: str, req: JobUpdate, user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    
    res = supabase.table("jobs").update(update_data).eq("id", job_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return res.data[0]


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str, user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    res = supabase.table("jobs").delete().eq("id", job_id).execute()
    return {"message": "Job successfully deleted", "job_id": job_id}


@router.get("/jobs/{job_id}/applicants")
def get_job_applicants(
    job_id: str,
    weight_skills: Optional[float] = None,
    weight_experience: Optional[float] = None,
    weight_education: Optional[float] = None,
    weight_additional: Optional[float] = None,
    user: Dict[str, Any] = Depends(require_hr)
):
    supabase = get_supabase()
    
    job_res = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_res.data[0]

    # Resolve scoring weights (URL override -> job saved weights -> default)
    custom_weights = None
    if any(w is not None for w in [weight_skills, weight_experience, weight_education, weight_additional]):
        custom_weights = {
            "skills": float(weight_skills if weight_skills is not None else 0.50),
            "experience": float(weight_experience if weight_experience is not None else 0.25),
            "education": float(weight_education if weight_education is not None else 0.15),
            "additional": float(weight_additional if weight_additional is not None else 0.10)
        }
    elif job.get("scoring_weights"):
        custom_weights = job.get("scoring_weights")

    apps_res = supabase.table("applications").select("*").eq("job_id", job_id).execute()
    apps = apps_res.data or []

    cands_res = supabase.table("candidates").select("*").execute()
    cands_map = {c["id"]: c for c in (cands_res.data or [])}

    users_res = supabase.table("users").select("*").execute()
    users_map = {str(u["id"]): u for u in (users_res.data or []) if "id" in u}

    applicant_list = []
    for app in apps:
        cid = str(app.get("candidate_id") or "")
        cand = cands_map.get(cid) or next((c for c in (cands_res.data or []) if str(c.get("id")) == cid or str(c.get("user_id")) == cid), {})
        
        cand_with_user = _enrich_candidate(cand, users_map)
        cand_with_user["application_id"] = app.get("id")
        cand_with_user["job_id"] = job_id
        cand_with_user["application_status"] = app.get("status")
        cand_with_user["applied_at"] = app.get("applied_at")

        # Calculate explainable match score with weights
        match_details = CandidateRanker.calculate_candidate_match(cand_with_user, job, custom_weights=custom_weights)
        cand_with_user["match_score"] = match_details["overall_score"]
        cand_with_user["match_details"] = match_details

        applicant_list.append(cand_with_user)

    # Sort applicants by match score descending
    applicant_list.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return applicant_list


@router.get("/jobs/{job_id}/export-csv")
def export_job_applicants_csv(job_id: str, user: Dict[str, Any] = Depends(require_hr)):
    """Export ranked candidate list as a formatted CSV spreadsheet."""
    applicants = get_job_applicants(job_id=job_id, user=user)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rank", "Candidate Name", "Email", "Phone", "Experience (Yrs)", "Education", "Match Score (%)", "Matched Skills", "Missing Skills", "Status"])
    
    for idx, cand in enumerate(applicants, start=1):
        md = cand.get("match_details", {})
        writer.writerow([
            idx,
            cand.get("full_name", "N/A"),
            cand.get("email", "N/A"),
            cand.get("phone", "N/A"),
            cand.get("years_of_experience", 0),
            cand.get("education", "N/A"),
            f"{cand.get('match_score', 0)}%",
            ", ".join(md.get("matched_skills", [])),
            ", ".join(md.get("missing_skills", [])),
            cand.get("application_status", "applied")
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=HireAI_Job_{job_id}_Rankings.csv"}
    )


@router.get("/candidates")
def get_all_candidates(user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    cands_res = supabase.table("candidates").select("*").execute()
    candidates = cands_res.data or []

    users_res = supabase.table("users").select("*").execute()
    users_map = {str(u["id"]): u for u in (users_res.data or []) if "id" in u}

    results = [_enrich_candidate(c, users_map) for c in candidates]
    return results


@router.get("/candidates/{candidate_id}")
def get_candidate_details(candidate_id: str, user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    cand_res = supabase.table("candidates").select("*").eq("id", candidate_id).execute()
    if not cand_res.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    users_res = supabase.table("users").select("*").execute()
    users_map = {str(u["id"]): u for u in (users_res.data or []) if "id" in u}

    return _enrich_candidate(cand_res.data[0], users_map)


@router.post("/match/{application_id}")
def run_match_on_application(application_id: str, user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    app_res = supabase.table("applications").select("*").eq("id", application_id).execute()
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app = app_res.data[0]
    job_res = supabase.table("jobs").select("*").eq("id", app.get("job_id")).execute()
    cand_res = supabase.table("candidates").select("*").eq("id", app.get("candidate_id")).execute()

    if not job_res.data or not cand_res.data:
        raise HTTPException(status_code=400, detail="Associated job or candidate missing")

    match_result = CandidateRanker.calculate_candidate_match(cand_res.data[0], job_res.data[0])
    return {
        "application_id": application_id,
        "match_result": match_result
    }


@router.post("/applications/{application_id}/status")
def update_application_status(
    application_id: str,
    req: ApplicationStatusUpdate,
    user: Dict[str, Any] = Depends(require_hr)
):
    supabase = get_supabase()
    res = supabase.table("applications").update({"status": req.status}).eq("id", application_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return {
        "message": f"Application status updated to {req.status}",
        "application": res.data[0]
    }


@router.post("/candidates/{candidate_id}/status")
def update_candidate_status_by_id(
    candidate_id: str,
    req: CandidateStatusUpdate,
    user: Dict[str, Any] = Depends(require_hr)
):
    """
    Direct Candidate Pipeline Link:
    Allows HR to shortlist, review, or reject a candidate.
    Creates or updates the application link directly in the database.
    """
    supabase = get_supabase()
    
    # 1. Resolve job_id
    job_id = req.job_id
    if not job_id:
        jobs_res = supabase.table("jobs").select("*").eq("status", "active").execute()
        if jobs_res.data and len(jobs_res.data) > 0:
            job_id = jobs_res.data[0]["id"]
        else:
            raise HTTPException(status_code=400, detail="No active job found to attach candidate status to")
    
    # 2. Check if application already exists for this (candidate, job) pair
    app_res = supabase.table("applications").select("*").eq("candidate_id", candidate_id).eq("job_id", job_id).execute()
    
    if app_res.data and len(app_res.data) > 0:
        app_id = app_res.data[0]["id"]
        res = supabase.table("applications").update({"status": req.status}).eq("id", app_id).execute()
        updated_app = res.data[0] if res.data else app_res.data[0]
    else:
        new_app = {
            "job_id": job_id,
            "candidate_id": candidate_id,
            "status": req.status,
            "applied_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        res = supabase.table("applications").insert(new_app).execute()
        updated_app = res.data[0] if res.data else new_app
        
    return {
        "message": f"Candidate status updated to {req.status}",
        "application": updated_app
    }


@router.get("/candidates/{candidate_id}/report")
def get_hr_candidate_report(candidate_id: str, user: Dict[str, Any] = Depends(require_hr)):
    """
    Generate deep AI resume audit report and multi-company platform fit matrix for HR.
    """
    supabase = get_supabase()
    cand_res = supabase.table("candidates").select("*").eq("id", candidate_id).execute()
    if not cand_res.data:
        # Check by user_id
        cand_res = supabase.table("candidates").select("*").eq("user_id", candidate_id).execute()
    
    if not cand_res.data:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    
    cand = cand_res.data[0]
    users_res = supabase.table("users").select("*").execute()
    users_map = {str(u["id"]): u for u in (users_res.data or []) if "id" in u}
    
    enriched = _enrich_candidate(cand, users_map)
    jobs_res = supabase.table("jobs").select("*").eq("status", "active").execute()
    active_jobs = jobs_res.data or []

    report = CandidateRanker.generate_resume_audit_report(enriched, active_jobs)
    return report


from pydantic import BaseModel

class PipelineMoveRequest(BaseModel):
    application_id: Optional[str] = None
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None
    target_stage: str


@router.get("/pipeline")
def get_hr_pipeline(
    job_id: Optional[str] = None,
    user: Dict[str, Any] = Depends(require_hr)
):
    """
    Interactive Kanban Recruitment Pipeline:
    Returns applications grouped by stage with explainable scores, interview questions, and proof trees.
    Stages: applied, shortlisted, technical_assessment, interview_scheduled, offer_extended, rejected
    """
    supabase = get_supabase()
    
    # Fetch jobs
    jobs_res = supabase.table("jobs").select("*").execute()
    jobs = jobs_res.data or []
    jobs_map = {j["id"]: j for j in jobs}
    
    # Default active job if not provided
    active_job = jobs_map.get(job_id) if job_id else (jobs[0] if jobs else None)
    
    # Fetch all applications
    app_query = supabase.table("applications").select("*")
    if job_id and job_id != "all":
        app_query = app_query.eq("job_id", job_id)
    apps_res = app_query.execute()
    apps = apps_res.data or []
    
    # Fetch candidates & users
    cands_res = supabase.table("candidates").select("*").execute()
    cands_map = {c["id"]: c for c in (cands_res.data or [])}
    
    users_res = supabase.table("users").select("*").execute()
    users_map = {str(u["id"]): u for u in (users_res.data or []) if "id" in u}
    
    # Build stage buckets
    stages = {
        "applied": [],
        "shortlisted": [],
        "technical_assessment": [],
        "interview_scheduled": [],
        "offer_extended": [],
        "rejected": []
    }
    
    for app in apps:
        cid = str(app.get("candidate_id") or "")
        cand = cands_map.get(cid) or next((c for c in (cands_res.data or []) if str(c.get("id")) == cid or str(c.get("user_id")) == cid), {})
        
        enriched_cand = _enrich_candidate(cand, users_map)
        target_job = jobs_map.get(app.get("job_id")) or active_job or {
            "title": "Software Engineer",
            "required_skills": ["Python", "SQL"],
            "min_experience": 2.0
        }
        
        match_details = CandidateRanker.calculate_candidate_match(enriched_cand, target_job)
        
        # Raw status normalized to one of the 6 stages
        raw_status = str(app.get("status") or "applied").lower()
        if raw_status in ["applied", "screened", "new"]:
            stage_key = "applied"
        elif raw_status in ["shortlisted", "reviewed"]:
            stage_key = "shortlisted"
        elif raw_status in ["technical_assessment", "assessment", "coding_round"]:
            stage_key = "technical_assessment"
        elif raw_status in ["interview_scheduled", "interview", "interviewing"]:
            stage_key = "interview_scheduled"
        elif raw_status in ["offer_extended", "hired", "offer"]:
            stage_key = "offer_extended"
        elif raw_status in ["rejected", "archived", "declined"]:
            stage_key = "rejected"
        else:
            stage_key = "applied"
            
        stages[stage_key].append({
            "application_id": app.get("id"),
            "candidate_id": cand.get("id") or cid,
            "job_id": app.get("job_id"),
            "job_title": target_job.get("title", "Engineering"),
            "company": target_job.get("company", "TechCorp"),
            "stage": stage_key,
            "status": app.get("status"),
            "stage_details": app.get("stage_details") or {},
            "applied_at": app.get("applied_at"),
            "candidate": enriched_cand,
            "match_score": match_details["overall_score"],
            "match_details": match_details,
            "proof_trace": match_details.get("proof_trace"),
            "interview_questions": match_details.get("interview_questions", [])
        })

    # Sort each bucket by match score descending
    for k in stages:
        stages[k].sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "jobs": jobs,
        "active_job": active_job,
        "pipeline_stages": stages,
        "total_in_pipeline": len(apps)
    }


@router.post("/pipeline/move")
def move_pipeline_stage(
    req: PipelineMoveRequest,
    user: Dict[str, Any] = Depends(require_hr)
):
    """
    Update candidate's recruitment stage in the Kanban board and optionally update stage details.
    """
    supabase = get_supabase()
    
    update_data: Dict[str, Any] = {"status": req.target_stage}
    
    if req.application_id:
        app_res = supabase.table("applications").select("*").eq("id", req.application_id).execute()
        current_app = app_res.data[0] if app_res.data else {}
        if req.stage_details:
            existing_details = current_app.get("stage_details") or {}
            update_data["stage_details"] = {**existing_details, **req.stage_details}
            
        res = supabase.table("applications").update(update_data).eq("id", req.application_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Application not found")
        return {"message": f"Moved to {req.target_stage}", "application": res.data[0]}
    
    if req.candidate_id:
        target_job = req.job_id
        if not target_job:
            jobs_res = supabase.table("jobs").select("id").execute()
            if jobs_res.data:
                target_job = jobs_res.data[0]["id"]
        
        # Check application
        app_res = supabase.table("applications").select("*").eq("candidate_id", req.candidate_id).execute()
        if app_res.data:
            app_id = app_res.data[0]["id"]
            current_app = app_res.data[0]
            if req.stage_details:
                existing_details = current_app.get("stage_details") or {}
                update_data["stage_details"] = {**existing_details, **req.stage_details}
                
            res = supabase.table("applications").update(update_data).eq("id", app_id).execute()
            return {"message": f"Moved to {req.target_stage}", "application": res.data[0]}
        else:
            new_app = {
                "job_id": target_job,
                "candidate_id": req.candidate_id,
                "status": req.target_stage,
                "stage_details": req.stage_details or {},
                "applied_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            res = supabase.table("applications").insert(new_app).execute()
            return {"message": f"Candidate added to {req.target_stage}", "application": res.data[0] if res.data else new_app}

    raise HTTPException(status_code=400, detail="Missing application_id or candidate_id")


@router.post("/applications/{application_id}/stage-details")
def update_application_stage_details(
    application_id: str,
    req: StageDetailsUpdateRequest,
    user: Dict[str, Any] = Depends(require_hr)
):
    """
    Allows HR to schedule Tech Assessment / Interview or record official Job Offer details.
    """
    supabase = get_supabase()
    app_res = supabase.table("applications").select("*").eq("id", application_id).execute()
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")

    current_app = app_res.data[0]
    existing_details = current_app.get("stage_details") or {}
    updated_details = {**existing_details, **req.stage_details}

    update_payload: Dict[str, Any] = {"stage_details": updated_details}
    if req.target_stage:
        update_payload["status"] = req.target_stage

    res = supabase.table("applications").update(update_payload).eq("id", application_id).execute()
    return {
        "message": "Application stage details saved successfully",
        "application": res.data[0] if res.data else current_app
    }
