from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ApplicationCreate(BaseModel):
    job_id: str

class ApplicationStatusUpdate(BaseModel):
    status: str # 'applied', 'shortlisted', 'technical_assessment', 'interview_scheduled', 'offer_extended', 'rejected'
    stage_details: Optional[Dict[str, Any]] = None

class CandidateStatusUpdate(BaseModel):
    status: str
    job_id: Optional[str] = None
    stage_details: Optional[Dict[str, Any]] = None

class StageDetailsUpdateRequest(BaseModel):
    target_stage: Optional[str] = None
    stage_details: Dict[str, Any]

class PipelineMoveRequest(BaseModel):
    application_id: Optional[str] = None
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None
    target_stage: str
    stage_details: Optional[Dict[str, Any]] = None

class MatchScoreBreakdown(BaseModel):
    overall_score: float
    skill_score: float
    experience_score: float
    education_score: float
    certifications_score: float
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    preferred_matches: List[str] = Field(default_factory=list)
    explanations: List[str] = Field(default_factory=list)
    rule_results: Dict[str, Any] = Field(default_factory=dict)

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    status: str
    applied_at: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_avatar: Optional[str] = None
    candidate_phone: Optional[str] = None
    candidate_skills: List[str] = Field(default_factory=list)
    candidate_experience: float = 0.0
    candidate_education: Optional[str] = None
    match_score: Optional[float] = None
    match_details: Optional[MatchScoreBreakdown] = None
