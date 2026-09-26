@echo off
title StockSense — Real-Time Warehouse Stock Ledger
color 0B

echo ==============================================================================
echo                      StockSense - ODOO x GCET Hackathon
echo                 Real-Time Stock Ledger with Predictive Alerts
echo ==============================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on your system PATH!
    echo Please install Node.js from https://nodejs.org/ to proceed.
    echo.
    pause
    exit /b 1
)

:: 2. Check node_modules
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

:: 3. Check .env.local
if not exist ".env.local" (
    if exist ".env.example" (
        echo [*] Creating .env.local from .env.example...
        copy .env.example .env.local >nul
    )
)

echo [*] Starting Next.js development server...
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
echo [*] Launching demo browser windows in 3 seconds...

:: Open browser automatically
start "" "http://localhost:3000/dashboard"

:: Start Next.js development server
call npm run dev

pause
