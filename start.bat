@echo off
title Risse Application Launcher
echo ========================================================
echo   Starting Risse Application (Laravel Backend + Vue 3)
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0

:: Locate PHP binary
set PHP_BIN=D:\Websites\php82\php.exe
if not exist "%PHP_BIN%" (
    where php.exe >nul 2>&1
    if %errorlevel% equ 0 (
        set PHP_BIN=php.exe
    ) else (
        echo [ERROR] PHP binary not found at D:\Websites\php82\php.exe or in PATH.
        pause
        exit /b 1
    )
)

:: Clear backend configuration cache
echo [1/3] Clearing Laravel config cache...
cd /d "%SCRIPT_DIR%backend"
"%PHP_BIN%" artisan config:clear
if exist "%SCRIPT_DIR%backend\public\hot" del /f /q "%SCRIPT_DIR%backend\public\hot"

:: Launch Laravel Backend on Port 8000
echo [2/3] Launching Laravel backend on http://127.0.0.1:8000...
start "Risse Backend (Laravel)" "%PHP_BIN%" artisan serve --port=8000

:: Launch Vite Frontend Dev Server
echo [3/3] Launching Vite frontend dev server on http://127.0.0.1:5173...
cd /d "%SCRIPT_DIR%frontend"
start "Risse Frontend (Vite)" cmd /k "npm run dev"

cd /d "%SCRIPT_DIR%"

echo.
echo ========================================================
echo   Risse Servers are Running!
echo   - Open: http://127.0.0.1:8000 in your browser
echo ========================================================
echo.
pause
