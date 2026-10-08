import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent

# Load .env file from root directory
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "HiringAI - AI-Based Recruitment System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Supabase credentials (ONLY read here, NEVER exposed to frontends)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://skfhoxfelwioqejeknbi.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # JWT Auth settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-jwt-key-for-hiringai-session-signing-change-in-prod")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    
    # Upload settings
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads/resumes")
    CANDIDATE_DOCS_DIR: Path = BASE_DIR / os.getenv("CANDIDATE_DOCS_DIR", "uploads/candidate_documents")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", 10))
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".doc"}
    ALLOWED_DOC_EXTENSIONS: set = {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"}

    @classmethod
    def is_supabase_configured(cls) -> bool:
        """Check if real Supabase credentials are provided."""
        return bool(cls.SUPABASE_KEY and cls.SUPABASE_KEY != "<MY_SUPABASE_SECRET_KEY>" and not cls.SUPABASE_KEY.startswith("<"))

settings = Settings()

# Ensure upload directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.CANDIDATE_DOCS_DIR.mkdir(parents=True, exist_ok=True)
for sub in ["certifications", "referrals", "other"]:
    (settings.CANDIDATE_DOCS_DIR / sub).mkdir(parents=True, exist_ok=True)
