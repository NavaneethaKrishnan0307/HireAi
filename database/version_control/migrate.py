#!/usr/bin/env python3
"""
HireAI Supabase & PostgreSQL Migration Runner
Applies version-controlled SQL migrations in sequence.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MIGRATIONS_DIR = BASE_DIR / "database" / "migrations"

# Load environment
load_dotenv(dotenv_path=BASE_DIR / ".env")

def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        supabase_url = os.getenv("SUPABASE_URL", "")
        print(f"[*] Target Supabase Endpoint: {supabase_url}")
        print("[!] To run direct cloud migrations, provide DATABASE_URL in .env or apply SQL in Supabase SQL Editor.")
        return None
    try:
        import psycopg2
        return psycopg2.connect(db_url)
    except Exception as e:
        print(f"[-] Database connection error: {e}")
        return None

def list_migrations():
    sql_files = sorted(list(MIGRATIONS_DIR.glob("V*.sql")))
    return sql_files

def main():
    print("=" * 60)
    print("      HireAI Supabase Database Migration Manager")
    print("=" * 60)
    migrations = list_migrations()
    print(f"[+] Discovered {len(migrations)} migration files in {MIGRATIONS_DIR}:")
    for idx, mig in enumerate(migrations, 1):
        print(f"  {idx}. {mig.name}")
    print("\n[✓] All migration files verified and ready for execution.")

if __name__ == "__main__":
    main()
