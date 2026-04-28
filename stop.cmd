@echo off
title Account Creator - Stop All Services
pushd %~dp0

set ROOT_DIR=%~dp0..

echo ========================================
echo  Account Creator - Stop All Services
echo ========================================

echo.
echo Stopping docker containers...
docker-compose -f "%ROOT_DIR%\docker-compose.yml" down >nul 2>&1

echo.
echo Stopping Docker Compose services...
docker-compose -f "%ROOT_DIR%\docker-compose.yml" down

echo.
echo Done.
popd
