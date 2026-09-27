from typing import Dict, Any, List, Optional
import io
import csv
from fastapi import APIRouter, HTTPException, Depends, Query, Response
from backend.api.auth import require_hr
from backend.utils.supabase_client import get_supabase
from backend.services.candidate_ranker import CandidateRanker
from backend.models.job import JobCreate, JobUpdate, JobSearchQuery
from backend.models.application import ApplicationStatusUpdate

router = APIRouter(prefix="/hr", tags=["HR"])

def _get_hr_profile(user_id: str, supabase) -> Dict[str, Any]:
    hr_res = supabase.table("hr_users").select("*").eq("user_id", user_id).execute()
    if hr_res.data and len(hr_res.data) > 0:
        return hr_res.data[0]
    return {"id": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01", "company_name": "TechCorp Solutions"}


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
    user_map = {u["id"]: u for u in (users_res.data or [])}

    # 4. Fetch Applications
    apps_res = supabase.table("applications").select("*").execute()
    applications = apps_res.data or []

    shortlisted_count = sum(1 for a in applications if a.get("status") == "shortlisted")

    # 5. Populate candidate details
    enriched_candidates = []
    for cand in candidates:
        u_info = user_map.get(cand.get("user_id"), {})
        cand_copy = dict(cand)
        cand_copy["full_name"] = u_info.get("full_name", "Candidate")
        cand_copy["email"] = u_info.get("email", "")
        cand_copy["avatar_url"] = u_info.get("avatar_url", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
        enriched_candidates.append(cand_copy)

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
    user_map = {u["id"]: u for u in (users_res.data or [])}

    enriched = []
    for cand in candidates:
        u_info = user_map.get(cand.get("user_id"), {})
        c = dict(cand)
        c["full_name"] = u_info.get("full_name", "Candidate")
        c["email"] = u_info.get("email", "")
        c["avatar_url"] = u_info.get("avatar_url", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
        
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
    users_map = {u["id"]: u for u in (users_res.data or [])}

    applicant_list = []
    for app in apps:
        cid = app.get("candidate_id")
        cand = cands_map.get(cid, {})
        user_rec = users_map.get(cand.get("user_id"), {})
        
        cand_with_user = dict(cand)
        cand_with_user["full_name"] = user_rec.get("full_name", "Candidate")
        cand_with_user["email"] = user_rec.get("email", "")
        cand_with_user["avatar_url"] = user_rec.get("avatar_url", "")
        cand_with_user["application_id"] = app.get("id")
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
    users_map = {u["id"]: u for u in (users_res.data or [])}

    results = []
    for c in candidates:
        u = users_map.get(c.get("user_id"), {})
        item = dict(c)
        item["full_name"] = u.get("full_name", "Candidate")
        item["email"] = u.get("email", "")
        item["avatar_url"] = u.get("avatar_url", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
        results.append(item)
    return results


@router.get("/candidates/{candidate_id}")
def get_candidate_details(candidate_id: str, user: Dict[str, Any] = Depends(require_hr)):
    supabase = get_supabase()
    cand_res = supabase.table("candidates").select("*").eq("id", candidate_id).execute()
    if not cand_res.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    cand = cand_res.data[0]
    user_res = supabase.table("users").select("*").eq("id", cand.get("user_id")).execute()
    u = user_res.data[0] if user_res.data else {}

    cand["full_name"] = u.get("full_name", "")
    cand["email"] = u.get("email", "")
    cand["avatar_url"] = u.get("avatar_url", "")
    return cand


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
