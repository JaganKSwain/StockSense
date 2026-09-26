@echo off
title StockSense - Stop All Servers
color 0E

cd /d "%~dp0"

echo ==============================================================================
echo                  StockSense Server Termination Utility
echo               Terminating all background servers on port 3000
echo ==============================================================================
echo.

node scripts/free-port.mjs

:: Secondary fallback to ensure any remaining processes on port 3000 are killed
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo [*] Terminating remaining PID %%a...
    taskkill /F /T /PID %%a >nul 2>&1
)

echo.
color 0A
echo ==============================================================================
echo  [SUCCESS] All StockSense server processes have been stopped.
echo  Port 3000 is clean and ready for reuse.
echo ==============================================================================
echo.
pause
