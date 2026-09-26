@echo off
title StockSense - Production Server
color 0A

cd /d "%~dp0"

echo ==============================================================================
echo                 StockSense - High Performance Production Server
echo                  Zero Compilation Latency - Instant Page Loads
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
    echo [*] Generating optimized production build...
    call npm run build
)

echo.
echo ==============================================================================
echo  Server URL : http://localhost:3000
echo  Portal/Auth: http://localhost:3000/login
echo  Dashboard  : http://localhost:3000/dashboard
echo  Ledger     : http://localhost:3000/ledger
echo  Receipts   : http://localhost:3000/receipts/new
echo  Deliveries : http://localhost:3000/deliveries/new
echo  Transfers  : http://localhost:3000/transfers/new
echo  Adjustments: http://localhost:3000/adjustments/new
echo  Mode       : Production Build - Instant Sub-Second Loads
echo ==============================================================================
echo.
echo [*] Launching production server...
echo [*] Opening browser in 3 seconds...
echo.

:: Launch browser in background after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000/dashboard"

:: Start Next.js production server with Ctrl+C capture for termination cleanup
call npm run start <nul

:: ==============================================================================
:: Server Termination Cleanup
:: ==============================================================================
echo.
echo ==============================================================================
echo [*] Terminating StockSense servers and freeing port 3000...
echo ==============================================================================
node scripts/free-port.mjs
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /T /PID %%a >nul 2>&1
)
echo [*] All server processes stopped successfully. Port 3000 is clean.
echo ==============================================================================
echo.
pause
