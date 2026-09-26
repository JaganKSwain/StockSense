@echo off
title StockSense — Automated QA & Database Verification Suite
color 0B

echo ==============================================================================
echo                      StockSense - ODOO x GCET Hackathon
echo           Full System QA & Real-Time Supabase Verification Suite
echo ==============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on your system PATH!
    echo.
    pause
    exit /b 1
)

echo [*] Executing 46-point QA testing suite against localhost:3000 and Supabase...
echo.
call npm run test:qa

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [FAIL] One or more QA tests failed! Check output above.
) else (
    color 0A
    echo.
    echo [SUCCESS] 100%% of QA tests PASSED! System is fully verified.
)

echo.
pause
