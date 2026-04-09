@echo off
title Account Creator - Stop All Services
pushd %~dp0

echo ========================================
echo  Account Creator - Stop All Services
echo ========================================

echo.
echo Kill tat ca process tren cac port...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8709 ^| findstr LISTENING') do (
    echo Killing Registrar PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8700 ^| findstr LISTENING') do (
    echo Killing TTS-Proxy PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8701 ^| findstr LISTENING') do (
    echo Killing Mail-Service PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8702 ^| findstr LISTENING') do (
    echo Killing AA-Proxy PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8708 ^| findstr LISTENING') do (
    echo Killing AAR PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8703 ^| findstr LISTENING') do (
    echo Killing Turnstile Solver PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :1421 ^| findstr LISTENING') do (
    echo Killing UI PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Done. Tat ca services da duoc stop.
popd
