@echo off
title HireAI - All-in-One Launcher
echo ======================================================
echo          Starting HireAI Full Stack Services
echo ======================================================
echo.

echo 1. Starting FastAPI Backend (Port 8000)...
start "HireAI Backend API" cmd /k "cd /d %~dp0 && python -m uvicorn app:app --reload --port 8000"

timeout /t 2 >nul

echo 2. Starting Candidate Portal (Port 5173)...
start "HireAI Candidate UI" cmd /k "cd /d %~dp0frontend\candidate && npm.cmd run dev -- --port 5173"

timeout /t 2 >nul

echo 3. Starting HR Recruiter Portal (Port 5174)...
start "HireAI HR UI" cmd /k "cd /d %~dp0frontend\hr && npm.cmd run dev -- --port 5174"

echo.
echo ======================================================
echo All services launched!
echo - Backend API Docs : http://127.0.0.1:8000/docs
echo - Candidate Portal : http://127.0.0.1:5173
echo - HR Portal        : http://127.0.0.1:5174
echo ======================================================
pause
