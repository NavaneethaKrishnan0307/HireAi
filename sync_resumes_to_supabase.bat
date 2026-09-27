@echo off
title HireAI - Sync Local Resumes to Cloud Supabase
echo ======================================================
echo    HireAI: Uploading Local Resumes to Private Storage
echo ======================================================
echo.

cd /d %~dp0
python database/version_control/sync_local_resumes_to_supabase.py

echo.
echo ======================================================
echo Process finished.
echo ======================================================
pause
