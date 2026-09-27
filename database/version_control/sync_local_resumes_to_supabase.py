#!/usr/bin/env python3
"""
HireAI: Upload Pre-Existing Local Resumes to Supabase Storage Bucket
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "resumes"

load_dotenv(dotenv_path=BASE_DIR / ".env")

def sync_resumes():
    print("=" * 60)
    print("     HireAI: Syncing Local Resumes to Cloud Supabase")
    print("=" * 60)
    
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase_url = os.getenv("SUPABASE_URL", "https://skfhoxfelwioqejeknbi.supabase.co")

    if not supabase_key or supabase_key.startswith("<"):
        print("[!] Live SUPABASE_KEY is not yet configured in .env.")
        print("[*] Local files remain safely preserved on your computer in uploads/resumes/.")
        print("[*] Add your Supabase key to .env whenever you are ready to sync to the cloud.")
        return

    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        
        # Discover all local resume files
        files = list(UPLOAD_DIR.glob("*.pdf")) + list(UPLOAD_DIR.glob("*.docx"))
        print(f"[+] Found {len(files)} local resume file(s) in {UPLOAD_DIR}:")
        
        for f in files:
            print(f"  -> Uploading: {f.name}...", end=" ")
            with open(f, "rb") as file_content:
                content = file_content.read()
                content_type = "application/pdf" if f.suffix.lower() == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                supabase.storage.from_("resumes").upload(
                    file=content,
                    path=f.name,
                    file_options={"content-type": content_type, "upsert": "true"}
                )
            print("[✓ Done]")
            
        print("\n[✓] All existing resumes successfully synchronized to private Supabase storage!")
        
    except Exception as e:
        print(f"\n[-] Error syncing to Supabase Storage: {e}")

if __name__ == "__main__":
    sync_resumes()
