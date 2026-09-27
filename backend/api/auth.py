import time
import hashlib
import jwt
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from config import settings
from backend.utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    """Generate SHA-256 hash for secure credential storage."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Strictly verify plain password against stored hash."""
    computed = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return computed == hashed_password

def create_access_token(user_id: str, email: str, role: str, full_name: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "full_name": full_name,
        "exp": int(time.time()) + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Expected 'Bearer <token>'")
    
    token = parts[1]
    return decode_access_token(token)

def require_candidate(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "candidate":
        raise HTTPException(status_code=403, detail="Forbidden. Candidate access only.")
    return user

def require_hr(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "hr":
        raise HTTPException(status_code=403, detail="Forbidden. HR access only.")
    return user


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "candidate" # 'candidate' or 'hr'
    company_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None # Optional role check

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]
    role_profile: Optional[Dict[str, Any]] = None


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    supabase = get_supabase()
    clean_email = req.email.strip().lower()
    
    try:
        # Check if user exists
        existing = supabase.table("users").select("*").eq("email", clean_email).execute()
        if existing.data and len(existing.data) > 0:
            raise HTTPException(status_code=400, detail="An account with this email already exists")

        hashed = hash_password(req.password)
        user_payload = {
            "email": clean_email,
            "password_hash": hashed,
            "role": req.role,
            "full_name": req.full_name,
            "avatar_url": None
        }

        user_res = supabase.table("users").insert(user_payload).execute()
        new_user = user_res.data[0] if user_res.data else user_payload

        # Create associated profile
        role_profile = None
        if req.role == "candidate":
            cand_payload = {
                "user_id": new_user["id"],
                "phone": "",
                "location": "",
                "current_title": "",
                "years_of_experience": 0.0,
                "education": "",
                "resume_status": "unprocessed",
                "parsed_skills": []
            }
            cand_res = supabase.table("candidates").insert(cand_payload).execute()
            role_profile = cand_res.data[0] if cand_res.data else cand_payload
        else:
            hr_payload = {
                "user_id": new_user["id"],
                "company_name": req.company_name or "TechCorp Solutions",
                "department": "Talent Acquisition"
            }
            hr_res = supabase.table("hr_users").insert(hr_payload).execute()
            role_profile = hr_res.data[0] if hr_res.data else hr_payload

        token = create_access_token(new_user["id"], new_user["email"], new_user["role"], new_user["full_name"])

        return {
            "token": token,
            "user": {
                "id": str(new_user["id"]),
                "email": new_user["email"],
                "role": new_user["role"],
                "full_name": new_user["full_name"],
                "avatar_url": None
            },
            "role_profile": role_profile
        }
    except Exception as e:
        err_msg = str(e)
        logger.error("Registration error: %s", err_msg)
        if "PGRST205" in err_msg or "schema cache" in err_msg or "relation" in err_msg:
            raise HTTPException(
                status_code=500,
                detail="Supabase tables not found. Please run database/schema.sql in your Supabase SQL Editor to create the tables."
            )
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {err_msg}")


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    supabase = get_supabase()
    clean_email = req.email.strip().lower()
    
    try:
        users_res = supabase.table("users").select("*").eq("email", clean_email).execute()
        
        if not users_res.data or len(users_res.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password. Please register an account first.")
        
        user = users_res.data[0]

        if not verify_password(req.password, user.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if req.role and user.get("role") != req.role:
            raise HTTPException(status_code=403, detail=f"Account is registered as {user.get('role')}, cannot login as {req.role}")

        # Fetch role profile
        role_profile = None
        if user.get("role") == "candidate":
            cand_res = supabase.table("candidates").select("*").eq("user_id", user["id"]).execute()
            if cand_res.data and len(cand_res.data) > 0:
                role_profile = cand_res.data[0]
        elif user.get("role") == "hr":
            hr_res = supabase.table("hr_users").select("*").eq("user_id", user["id"]).execute()
            if hr_res.data and len(hr_res.data) > 0:
                role_profile = hr_res.data[0]

        token = create_access_token(user["id"], user["email"], user["role"], user["full_name"])

        return {
            "token": token,
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "role": user["role"],
                "full_name": user["full_name"],
                "avatar_url": None
            },
            "role_profile": role_profile
        }
    except Exception as e:
        err_msg = str(e)
        logger.error("Login error: %s", err_msg)
        if "PGRST205" in err_msg or "schema cache" in err_msg or "relation" in err_msg:
            raise HTTPException(
                status_code=500,
                detail="Supabase tables not found. Please run database/schema.sql in your Supabase SQL Editor to create the tables."
            )
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {err_msg}")


@router.get("/me")
def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    supabase = get_supabase()
    user_res = supabase.table("users").select("*").eq("id", user["sub"]).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    u = user_res.data[0]
    role_profile = None
    if u.get("role") == "candidate":
        cand_res = supabase.table("candidates").select("*").eq("user_id", u["id"]).execute()
        if cand_res.data:
            role_profile = cand_res.data[0]
    elif u.get("role") == "hr":
        hr_res = supabase.table("hr_users").select("*").eq("user_id", u["id"]).execute()
        if hr_res.data:
            role_profile = hr_res.data[0]

    return {
        "user": {
            "id": str(u["id"]),
            "email": u["email"],
            "role": u["role"],
            "full_name": u["full_name"],
            "avatar_url": None
        },
        "role_profile": role_profile
    }


@router.post("/logout")
def logout():
    return {"message": "Successfully logged out"}
