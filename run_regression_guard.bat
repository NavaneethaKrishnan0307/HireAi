@echo off
title HireAI - Continuous Integrity & Regression Prevention Guard
echo ============================================================================
echo        Running HireAI Automated Regression Prevention Engine...
echo ============================================================================
echo.
python verify_all_patches.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Regression Guard detected failures! Do not proceed until fixed.
    echo.
    pause
    exit /b 1
)
echo.
echo [OK] All system components and previous fixes verified intact.
echo.
pause
