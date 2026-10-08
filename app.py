import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from backend.api.auth import router as auth_router
from backend.api.candidate import router as candidate_router
from backend.api.hr import router as hr_router
from backend.api.jobs import router as jobs_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("HiringAI")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable Rule-Based AI Recruitment and Candidate Matching System"
)

# Configure CORS for Candidate React UI & HR React UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enterprise Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Mount uploaded resume files as static assets
app.mount("/uploads/resumes", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="resumes")
app.mount("/uploads/candidate_documents", StaticFiles(directory=str(settings.CANDIDATE_DOCS_DIR)), name="candidate_documents")

# Register API Routers under /api prefix
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(candidate_router, prefix=settings.API_PREFIX)
app.include_router(hr_router, prefix=settings.API_PREFIX)
app.include_router(jobs_router, prefix=settings.API_PREFIX)

@app.get("/api/health", tags=["Health Check"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "supabase_configured": settings.is_supabase_configured()
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to HiringAI Backend API. Access API docs at /docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.HOST, port=settings.PORT, reload=True)
