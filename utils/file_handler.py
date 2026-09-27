import os
import uuid
import shutil
import logging
from pathlib import Path
from fastapi import UploadFile, HTTPException
from config import settings

logger = logging.getLogger(__name__)

def validate_and_save_resume(upload_file: UploadFile) -> tuple[Path, str, str]:
    """
    Validate uploaded resume file size and extension, save locally and sync to Supabase Storage if configured.
    Returns: (file_path, unique_filename, original_filename)
    """
    original_filename = upload_file.filename or "resume.pdf"
    file_ext = Path(original_filename).suffix.lower()

    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file_ext}'. Only PDF and DOCX files are supported."
        )

    # Generate unique filename to prevent collisions
    clean_name = Path(original_filename).stem.replace(" ", "_")
    unique_filename = f"{clean_name}_{uuid.uuid4().hex[:8]}{file_ext}"
    destination_path = settings.UPLOAD_DIR / unique_filename

    # Save file locally and verify size
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    total_bytes = 0

    with open(destination_path, "wb") as buffer:
        while True:
            chunk = upload_file.file.read(1024 * 64)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                buffer.close()
                if destination_path.exists():
                    destination_path.unlink()
                raise HTTPException(
                    status_code=400,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
                )
            buffer.write(chunk)

    # If Supabase is configured, upload to 'resumes' storage bucket
    if settings.is_supabase_configured():
        try:
            from backend.utils.supabase_client import get_supabase
            supabase = get_supabase()
            with open(destination_path, "rb") as f:
                content = f.read()
                content_type = "application/pdf" if file_ext == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                supabase.storage.from_("resumes").upload(
                    file=content,
                    path=unique_filename,
                    file_options={"content-type": content_type, "upsert": "true"}
                )
            logger.info("Uploaded %s to Supabase Storage bucket 'resumes'", unique_filename)
        except Exception as e:
            logger.warning("Supabase storage sync optional warning: %s", e)

    return destination_path, unique_filename, original_filename
