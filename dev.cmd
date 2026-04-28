@echo off
title Account Creator - Dev Mode
pushd %~dp0

set ROOT_DIR=%~dp0..

echo ========================================
echo  Account Creator - Docker Services + UI
echo ========================================

echo.
echo [1/3] Stopping running containers...
docker-compose -f "%ROOT_DIR%\docker-compose.yml" down >nul 2>&1

echo [2/3] Starting all services via docker-compose...
docker-compose -f "%ROOT_DIR%\docker-compose.yml" up -d --build

echo.
echo Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo.
echo [3/3] Starting Desktop UI...
cd /d "%~dp0"
call npm run dev

pause
