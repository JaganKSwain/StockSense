@echo off
title StockSense — Reset Demo Dataset
color 0E

:: Ensure correct working directory
cd /d "%~dp0"

echo ==============================================================================
echo                 StockSense - Reset Database to Pitch Baseline
echo ==============================================================================
echo.
echo [*] Resetting products, locations, and movements to initial pitch baseline...
echo.

call npm run db:seed

echo.
echo ==============================================================================
echo [OK] Database reset complete! Ready for next judging round.
echo ==============================================================================
echo.
pause
