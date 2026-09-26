@echo off
title StockSense - Production Mode (Instant Sub-Second Loads)
color 0A

cd /d "%~dp0"

echo ==============================================================================
echo                 StockSense - High Performance Production Server
echo                  Zero Compilation Latency • Instant Page Loads
echo ==============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on your system PATH!
    pause
    exit /b 1
)

:: 1. Free port 3000 if occupied
node scripts/free-port.mjs

:: 2. Check if build exists, build if needed
if not exist ".next\" (
    echo [*] Generating optimized production build (one-time setup)...
    call npm run build
)

echo.
echo ==============================================================================
echo  Server URL : http://localhost:3000
echo  Mode       : Production Build (0s on-demand compile, instant 20ms page loads)
echo ==============================================================================
echo.
echo [*] Launching production server...
echo [*] Opening browser in 2 seconds...
echo.

:: Launch browser in background after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000/dashboard"

:: Start Next.js production server
call npm run start

echo.
pause
