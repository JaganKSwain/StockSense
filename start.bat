@echo off
setlocal enabledelayedexpansion
title StockSense — Real-Time Warehouse Stock Ledger
color 0B

:: 1. Always ensure working directory is the script folder
cd /d "%~dp0"

echo ==============================================================================
echo                      StockSense - ODOO x GCET Hackathon
echo                 Real-Time Stock Ledger with Predictive Alerts
echo ==============================================================================
echo.

:: 2. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on your system PATH!
    echo Please install Node.js from https://nodejs.org/ to proceed.
    echo.
    pause
    exit /b 1
)

:: 3. Kill any lingering process holding port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo [*] Freeing port 3000 (Closing previous instance PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

:: 4. Check node_modules
if not exist "node_modules\" (
    echo [*] Installing project dependencies (first time setup)...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
)

:: 5. Check .env.local
if not exist ".env.local" (
    if exist ".env.example" (
        echo [*] Creating .env.local from .env.example...
        copy .env.example .env.local >nul
    )
)

echo.
echo ==============================================================================
echo  Server URL : http://localhost:3000
echo  Dashboard  : http://localhost:3000/dashboard
echo  Ledger     : http://localhost:3000/ledger
echo  Receipts   : http://localhost:3000/receipts/new
echo  Deliveries : http://localhost:3000/deliveries/new
echo  Transfers  : http://localhost:3000/transfers/new
echo  Adjustments: http://localhost:3000/adjustments/new
echo ==============================================================================
echo.
echo [*] Waiting for Next.js to start before launching browser...

:: Launch browser in background only after server responds on port 3000
start /b powershell -NoProfile -Command ^
  "for ($i=0; $i -lt 30; $i++) { ^
     try { ^
       $res = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue; ^
       if ($res.StatusCode -eq 200) { break } ^
     } catch {} ^
     Start-Sleep -Seconds 1; ^
   }; ^
   Start-Process 'http://localhost:3000/dashboard'"

:: Start Next.js development server
call npm run dev

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Next.js server encountered an error and stopped.
    pause
)
