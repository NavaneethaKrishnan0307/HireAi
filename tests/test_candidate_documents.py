import io
import pytest
from fastapi import UploadFile, HTTPException
from backend.api.candidate import (
    upload_candidate_document,
    get_candidate_documents,
    delete_candidate_document,
    get_candidate_document_file,
    get_resume_file
)
from backend.utils.supabase_client import get_supabase

def test_upload_and_preview_candidate_document():
    user = {"sub": "9655cd40-8424-4204-94ba-77a433bfe924", "role": "candidate"}
    
    # Create fake valid PDF
    pdf_content = b"%PDF-1.4 Mock Certificate Content for Testing"
    upload = UploadFile(filename="aws_cert.pdf", file=io.BytesIO(pdf_content))
    
    # 1. Upload
    res = upload_candidate_document(
        file=upload,
        document_type="certification",
        title="AWS Solutions Architect",
        issuer_or_referee="Amazon Web Services",
        issue_date="2024",
        user=user
    )
    assert res["message"] == "Document uploaded and saved successfully"
    doc = res["document"]
    doc_id = doc["id"]
    assert doc["document_type"] == "certification"
    assert doc["title"] == "AWS Solutions Architect"
    assert doc["issuer_or_referee"] == "Amazon Web Services"

    # 2. List
    list_res = get_candidate_documents(doc_type="certification", user=user)
    docs = list_res["documents"]
    assert any(d["id"] == doc_id for d in docs)

    # 3. Preview file stream
    file_res = get_candidate_document_file(doc_id=doc_id, user=user)
    assert file_res.media_type == "application/pdf"

    # 4. Delete
    del_res = delete_candidate_document(doc_id=doc_id, user=user)
    assert del_res["message"] == "Document deleted successfully"

def test_document_security_blocks_invalid_magic_bytes():
    user = {"sub": "9655cd40-8424-4204-94ba-77a433bfe924", "role": "candidate"}
    # Disguised executable as PDF
    fake_exe = UploadFile(filename="malware.pdf", file=io.BytesIO(b"MZ\x90\x00disguised-exe"))
    with pytest.raises(HTTPException) as exc:
        upload_candidate_document(
            file=fake_exe,
            document_type="referral",
            title="Fake Referral",
            issuer_or_referee="Attacker",
            issue_date="",
            user=user
        )
    assert exc.value.status_code == 400
    assert "Security Verification Failed" in exc.value.detail


def test_hr_view_candidate_uploads_and_stream():
    from backend.api.hr import get_candidate_uploads_for_hr, get_candidate_document_file_for_hr, get_candidate_resume_file_for_hr
    hr_user = {"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "hr", "company_name": "TechCorp Solutions"}

    # 1. View candidate uploads for Rahul Sharma
    uploads = get_candidate_uploads_for_hr("11111111-1111-1111-1111-111111111111", user=hr_user)
    assert uploads["candidate"]["full_name"] == "Rahul Sharma"
    assert uploads["stats"]["total_documents"] >= 2
    assert uploads["stats"]["has_resume"] is True
    assert len(uploads["documents"]) >= 2

    # 2. Stream resume file
    resume_file_resp = get_candidate_resume_file_for_hr("11111111-1111-1111-1111-111111111111", user=hr_user)
    assert resume_file_resp.media_type == "application/pdf"
    assert "Rahul_Sharma_Resume.pdf" in resume_file_resp.filename

    # 3. Stream document file
    doc_id = uploads["documents"][0]["id"]
    doc_file_resp = get_candidate_document_file_for_hr("11111111-1111-1111-1111-111111111111", doc_id=doc_id, user=hr_user)
    assert doc_file_resp.media_type in ["application/pdf", "image/png", "image/jpeg"]

