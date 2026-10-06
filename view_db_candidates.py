import json
import os
from pathlib import Path

DB_FILE = Path(__file__).resolve().parent / "database" / "mock_supabase_db.json"

def show_candidates():
    if not DB_FILE.exists():
        print(f"Database file not found at: {DB_FILE}")
        return

    with open(DB_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    users = data.get("users", [])
    candidates = data.get("candidates", [])

    candidate_users = [u for u in users if u.get("role") == "candidate"]

    # Map candidate profiles by user_id
    profile_map = {c.get("user_id"): c for c in candidates}

    print("=" * 95)
    print("                     HIREAI DATABASE: REGISTERED CANDIDATES")
    print("=" * 95)
    print(f"{'NAME':<20} | {'EMAIL':<28} | {'RESUME FILE':<22} | {'RESUME STATUS'}")
    print("-" * 95)

    if not candidate_users:
        print(" No candidates registered in the database yet.")
    else:
        for u in candidate_users:
            uid = u.get("id")
            name = u.get("full_name") or "N/A"
            email = u.get("email") or "N/A"
            prof = profile_map.get(uid, {})
            resume_file = prof.get("resume_filename") or "None"
            resume_status = prof.get("resume_status") or "unprocessed"
            
            print(f"{name[:19]:<20} | {email[:27]:<28} | {resume_file[:21]:<22} | {resume_status}")

    print("=" * 95)
    print(f"Total Registered Candidates: {len(candidate_users)}")
    print(f"Database Source: {DB_FILE}")
    print("=" * 95)

if __name__ == "__main__":
    show_candidates()
