import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from config import settings

def validate_and_save_resume(upload_file: UploadFile) -> tuple[Path, str, str]:
    """
    Validate uploaded resume file size and extension, then save to uploads directory.
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

    # Save file and verify size
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

    return destination_path, unique_filename, original_filename
