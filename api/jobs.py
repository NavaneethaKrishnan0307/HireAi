from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.utils.supabase_client import get_supabase
from backend.models.job import JobResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobResponse])
def list_jobs(
    skills: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    experience: Optional[float] = Query(None)
):
    supabase = get_supabase()
    res = supabase.table("jobs").select("*").eq("status", "active").execute()
    jobs = res.data or []

    # Filter dynamically
    filtered = []
    for job in jobs:
        if location and location.lower() not in job.get("location", "").lower():
            continue
        if experience is not None and job.get("min_experience", 0) > experience:
            continue
        if skills:
            req_skills = [s.lower() for s in job.get("required_skills", [])]
            query_skills = [s.strip().lower() for s in skills.split(",") if s.strip()]
            if query_skills and not any(qs in req_skills or any(qs in s for s in req_skills) for qs in query_skills):
                continue
        filtered.append(job)

    return filtered

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    supabase = get_supabase()
    res = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Job opening not found")
    return res.data[0]
