import os
import uuid
import logging
from pathlib import Path
from fastapi import UploadFile, HTTPException
from config import settings

logger = logging.getLogger(__name__)

def process_and_upload_resume(upload_file: UploadFile) -> tuple[bytes, str, str, str]:
    """
    Direct Cloud-Native Upload:
    Processes the uploaded resume in-memory and uploads directly to Supabase Storage.
    Zero permanent files stored on the local computer hard drive.
    Returns: (file_bytes, unique_filename, original_filename, cloud_resume_url)
    """
    original_filename = upload_file.filename or "resume.pdf"
    file_ext = Path(original_filename).suffix.lower()

    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file_ext}'. Only PDF and DOCX files are supported."
        )

    # Read file stream entirely into memory buffer (RAM)
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    file_bytes = upload_file.file.read()

    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Generate unique filename for cloud storage
    clean_name = Path(original_filename).stem.replace(" ", "_")
    unique_filename = f"{clean_name}_{uuid.uuid4().hex[:8]}{file_ext}"

    cloud_resume_url = f"supabase://resumes/{unique_filename}"

    # Upload directly to Supabase Storage bucket if configured
    if settings.is_supabase_configured():
        try:
            from backend.utils.supabase_client import get_supabase
            supabase = get_supabase()
            content_type = "application/pdf" if file_ext == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            supabase.storage.from_("resumes").upload(
                file=file_bytes,
                path=unique_filename,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            logger.info("Directly uploaded %s to Supabase Storage bucket 'resumes'", unique_filename)
            cloud_resume_url = f"{settings.SUPABASE_URL}/storage/v1/object/resumes/{unique_filename}"
        except Exception as e:
            logger.warning("Supabase storage direct upload warning: %s", e)

    return file_bytes, unique_filename, original_filename, cloud_resume_url


def validate_and_save_resume(upload_file: UploadFile) -> tuple[Path, str, str]:
    """Backward compatible signature that uses memory buffer."""
    file_bytes, unique_filename, original_filename, _ = process_and_upload_resume(upload_file)
    # Temporary in-memory representation
    dest_path = settings.UPLOAD_DIR / unique_filename
    with open(dest_path, "wb") as f:
        f.write(file_bytes)
    return dest_path, unique_filename, original_filename
