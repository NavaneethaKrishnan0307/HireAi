from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

class CandidateProfileUpdate(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    years_of_experience: Optional[float] = None
    education: Optional[str] = None
    parsed_skills: Optional[List[str]] = None

class CandidateSkillItem(BaseModel):
    skill_name: str
    proficiency: Optional[str] = "Intermediate"
    verified: Optional[bool] = False

class ParsedResumeResponse(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    education: Optional[str] = None
    years_of_experience: float = 0.0
    extracted_text_preview: Optional[str] = None
    filename: Optional[str] = None
    status: str = "processed"

class CandidateResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    years_of_experience: float = 0.0
    education: Optional[str] = None
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_status: Optional[str] = "unprocessed"
    parsed_skills: List[str] = Field(default_factory=list)
