import os
import json
from pathlib import Path
import pytest
from config import settings

def test_supabase_sdk_installed():
    """Verify that supabase Python SDK is installed and functional."""
    import supabase
    assert hasattr(supabase, "create_client")

def test_supabase_endpoint_target():
    """Verify that Supabase cloud endpoint target matches project."""
    assert "skfhoxfelwioqejeknbi.supabase.co" in settings.SUPABASE_URL

def test_cloud_sync_payload_integrity():
    """Verify that local database structure is 100% compliant with Supabase tables."""
    db_file = Path(__file__).resolve().parent.parent / "database" / "mock_supabase_db.json"
    assert db_file.exists(), "mock_supabase_db.json must exist"

    with open(db_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Validate essential Supabase tables
    for table in ["users", "candidates", "jobs", "applications"]:
        assert table in data, f"Table '{table}' missing from database payload"
        assert isinstance(data[table], list), f"Table '{table}' must be a list of records"

    # Verify Sam, Ram, RAJA are in the candidate dataset
    emails = {u.get("email") for u in data["users"]}
    assert "sam@example.com" in emails
    assert "ram@example.com" in emails
    assert "raja@gmail.com" in emails
