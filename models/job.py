from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class JobCreate(BaseModel):
    title: str
    company: Optional[str] = "TechCorp Inc."
    location: str
    min_experience: float = 0.0
    max_experience: Optional[float] = None
    min_salary: Optional[float] = 0.0
    max_salary: Optional[float] = 0.0
    education_required: Optional[str] = "Any Graduate"
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: Optional[List[str]] = Field(default_factory=list)
    certifications_preferred: Optional[List[str]] = Field(default_factory=list)
    description: Optional[str] = ""
    status: Optional[str] = "active"
    scoring_weights: Optional[Dict[str, float]] = Field(
        default_factory=lambda: {"skills": 0.50, "experience": 0.25, "education": 0.15, "additional": 0.10}
    )

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    education_required: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    certifications_preferred: Optional[List[str]] = None
    description: Optional[str] = None
    status: Optional[str] = None
    scoring_weights: Optional[Dict[str, float]] = None

class JobResponse(BaseModel):
    id: str
    hr_id: Optional[str] = None
    title: str
    company: str
    location: str
    min_experience: float
    max_experience: Optional[float] = None
    min_salary: Optional[float] = 0.0
    max_salary: Optional[float] = 0.0
    education_required: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    certifications_preferred: List[str] = Field(default_factory=list)
    description: Optional[str] = ""
    status: str = "active"
    applicant_count: Optional[int] = 0
    scoring_weights: Optional[Dict[str, float]] = None

class JobSearchQuery(BaseModel):
    skills: Optional[str] = ""
    location: Optional[str] = ""
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    education: Optional[str] = ""
    title: Optional[str] = ""
    certifications: Optional[str] = ""
    weight_skills: Optional[float] = 0.50
    weight_experience: Optional[float] = 0.25
    weight_education: Optional[float] = 0.15
    weight_additional: Optional[float] = 0.10
