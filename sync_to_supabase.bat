@echo off
cd /d "%~dp0"
title "HireAI - Cloud Supabase Synchronization Engine"
python sync_to_supabase.py
echo.
pause
