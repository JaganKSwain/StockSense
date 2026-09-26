@echo off
title StockSense - Real-Time Warehouse Stock Ledger
color 0B

cd /d "%~dp0"

echo ==============================================================================
echo                      StockSense - ODOO x GCET Hackathon
echo                 Real-Time Stock Ledger with Predictive Alerts
echo ==============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on your system PATH!
    echo Please install Node.js from https://nodejs.org/ to proceed.
    echo.
    pause
    exit /b 1
)

:: 1. Free port 3000 if occupied
node scripts/free-port.mjs

:: 2. Check node_modules
if not exist "node_modules\" (
    echo [*] Installing dependencies...
    call npm install
)

:: 3. Check .env.local
if not exist ".env.local" (
    if exist ".env.example" (
        echo [*] Initializing .env.local...
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
echo [*] Starting Next.js development server...
echo [*] Opening browser in 3 seconds...
echo.

:: Launch browser in background after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000/dashboard"

:: Start Next.js
call npm run dev

echo.
pause
