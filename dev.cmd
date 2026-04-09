@echo off
title Account Creator - All Services
pushd %~dp0

set ROOT_DIR=%~dp0..
if not exist "%~dp0logs" mkdir "%~dp0logs"

echo ========================================
echo  Account Creator - Start All Services
echo ========================================

echo.
echo [0/6] Kill process cu tren tat ca port...
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

timeout /t 1 /nobreak >nul

echo.
echo [1/6] Registrar API (port 8709)...
powershell -WindowStyle Hidden -Command "Start-Process python -ArgumentList 'run_api.py' -WorkingDirectory '%ROOT_DIR%\registrar' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\api.log' -RedirectStandardError '%~dp0logs\api_err.log'"

echo [2/6] TTS Proxy (port 8700)...
powershell -WindowStyle Hidden -Command "Start-Process python -ArgumentList 'main.py' -WorkingDirectory '%ROOT_DIR%\tts-proxy' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\tts.log' -RedirectStandardError '%~dp0logs\tts_err.log'"

echo [3/6] Mail Service (port 8701)...
powershell -WindowStyle Hidden -Command "Start-Process python -ArgumentList 'main.py' -WorkingDirectory '%ROOT_DIR%\mail-service' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\mail.log' -RedirectStandardError '%~dp0logs\mail_err.log'"

echo [4/6] AA Proxy (port 8702)...
powershell -WindowStyle Hidden -Command "Start-Process python -ArgumentList 'main.py' -WorkingDirectory '%ROOT_DIR%\aa-proxy' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\aa_proxy.log' -RedirectStandardError '%~dp0logs\aa_proxy_err.log'"

echo [5/6] Any-Auto-Register (port 8708) + Turnstile Solver (8703)...
powershell -WindowStyle Hidden -Command "$env:PORT='8708'; $env:PYTHONUTF8='1'; Start-Process python -ArgumentList 'main.py' -WorkingDirectory '%ROOT_DIR%\any-auto-register' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\aar.log' -RedirectStandardError '%~dp0logs\aar_err.log'"
powershell -WindowStyle Hidden -Command "$env:PYTHONUTF8='1'; Start-Process python -ArgumentList 'services/turnstile_solver/start.py','--browser_type','camoufox','--port','8703' -WorkingDirectory '%ROOT_DIR%\any-auto-register' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\solver.log' -RedirectStandardError '%~dp0logs\solver_err.log'"

echo.
echo [6/6] Khoi dong Tauri UI...
cd /d "%~dp0"
call npx tauri dev
