@echo off
title StockSense — Dual-Window Live Demo Launcher
color 0A

:: Ensure correct working directory
cd /d "%~dp0"

echo ==============================================================================
echo             Launching StockSense Dual-Window Live Judging Setup
echo ==============================================================================
echo.
echo Window A: Dashboard (Real-time KPI & Ledger Observer)
echo Window B: Operator Intake / Operations Form
echo.

start "" "http://localhost:3000/dashboard"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/receipts/new"

echo [OK] Both demo windows launched!
echo Arrange them side-by-side to showcase zero-refresh real-time sync.
echo.
timeout /t 5
