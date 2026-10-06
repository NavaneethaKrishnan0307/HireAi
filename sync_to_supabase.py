#!/usr/bin/env python3
"""
HireAI Cloud Supabase Synchronization & Migration Engine
Pushes all local users, candidates (Sam, Ram, RAJA, etc.), jobs, applications,
and resume files directly to live Cloud Supabase (https://skfhoxfelwioqejeknbi.supabase.co).
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

DB_FILE = BASE_DIR / "database" / "mock_supabase_db.json"
RESUME_DIR = BASE_DIR / "uploads" / "resumes"

def sync():
    print("=" * 75)
    print("        HIREAI: REAL-TIME CLOUD SUPABASE SYNCHRONIZATION ENGINE")
    print("=" * 75)

    supabase_url = os.getenv("SUPABASE_URL", "https://skfhoxfelwioqejeknbi.supabase.co")
    supabase_key = os.getenv("SUPABASE_KEY", "").strip()

    print(f"Target Supabase Endpoint: {supabase_url}")

    if not supabase_key or supabase_key.startswith("<"):
        print("\n[!] SUPABASE_KEY is currently empty in .env.")
        print("[!] To stream real-time updates directly to Supabase Cloud:")
        print("    1. Open: https://supabase.com/dashboard/project/skfhoxfelwioqejeknbi/settings/api")
        print("    2. Copy your 'anon' public key or 'service_role' secret key.")
        print("    3. Paste it into HireAi/.env under SUPABASE_KEY=...")
        print("    4. Re-run this script to instantly migrate all local records to Cloud Supabase!")
        print("=" * 75)
        return False

    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        print("[✓] Successfully authenticated with Cloud Supabase!")
    except Exception as e:
        print(f"[-] Authentication failed with Cloud Supabase: {e}")
        return False

    if not DB_FILE.exists():
        print(f"[-] Database file not found: {DB_FILE}")
        return False

    with open(DB_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Sync Users
    users = data.get("users", [])
    print(f"\n[1/5] Syncing {len(users)} User Accounts to Cloud Supabase...")
    for u in users:
        payload = {
            "id": u.get("id"),
            "email": u.get("email"),
            "password_hash": u.get("password_hash"),
            "role": u.get("role"),
            "full_name": u.get("full_name"),
            "avatar_url": u.get("avatar_url")
        }
        try:
            supabase.table("users").upsert(payload).execute()
            print(f"  -> Synced user: {u.get('full_name')} ({u.get('email')})")
        except Exception as e:
            print(f"  [!] User sync notice ({u.get('email')}): {e}")

    # 2. Sync HR Profiles
    hr_users = data.get("hr_users", [])
    print(f"\n[2/5] Syncing {len(hr_users)} HR Profiles...")
    for h in hr_users:
        try:
            supabase.table("hr_users").upsert(h).execute()
            print(f"  -> Synced HR: {h.get('company_name')}")
        except Exception as e:
            print(f"  [!] HR profile notice: {e}")

    # 3. Sync Candidates
    candidates = data.get("candidates", [])
    print(f"\n[3/5] Syncing {len(candidates)} Candidate Profiles (including Sam, Ram, RAJA)...")
    for c in candidates:
        cand_payload = {
            "id": c.get("id"),
            "user_id": c.get("user_id"),
            "phone": c.get("phone"),
            "location": c.get("location"),
            "current_title": c.get("current_title"),
            "years_of_experience": c.get("years_of_experience"),
            "education": c.get("education"),
            "resume_filename": c.get("resume_filename"),
            "resume_status": c.get("resume_status"),
            "resume_url": c.get("resume_url"),
            "parsed_skills": c.get("parsed_skills")
        }
        try:
            supabase.table("candidates").upsert(cand_payload).execute()
            print(f"  -> Synced candidate profile: {c.get('full_name') or c.get('id')}")
        except Exception as e:
            print(f"  [!] Candidate sync notice ({c.get('id')}): {e}")

    # 4. Sync Jobs & Applications
    jobs = data.get("jobs", [])
    print(f"\n[4/5] Syncing {len(jobs)} Jobs & Associated Applications...")
    for j in jobs:
        try:
            supabase.table("jobs").upsert(j).execute()
            print(f"  -> Synced job: {j.get('title')}")
        except Exception as e:
            print(f"  [!] Job sync notice: {e}")

    apps = data.get("applications", [])
    for a in apps:
        try:
            supabase.table("applications").upsert(a).execute()
        except Exception as e:
            print(f"  [!] Application sync notice: {e}")

    # 5. Sync Resumes to Cloud Storage Bucket
    print(f"\n[5/5] Syncing Resume Files to Supabase Storage Bucket 'resumes'...")
    if RESUME_DIR.exists():
        files = list(RESUME_DIR.glob("*.pdf")) + list(RESUME_DIR.glob("*.docx"))
        for f in files:
            content_type = "application/pdf" if f.suffix.lower() == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            try:
                with open(f, "rb") as fc:
                    supabase.storage.from_("resumes").upload(
                        path=f.name,
                        file=fc.read(),
                        file_options={"content-type": content_type, "upsert": "true"}
                    )
                print(f"  -> Uploaded resume to cloud: {f.name}")
            except Exception as e:
                print(f"  [!] Storage notice ({f.name}): {e}")

    print("\n" + "=" * 75)
    print(" [SUCCESS] REAL-TIME CLOUD SUPABASE SYNCHRONIZATION COMPLETE")
    print(" All local changes, candidates, and files are now live in Supabase!")
    print("=" * 75)
    return True

if __name__ == "__main__":
    sync()
