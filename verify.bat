@echo off
title ZETAtube - Build Verification
echo ========================================
echo  ZETAtube Build Verification
echo ========================================
echo.

echo [1/3] Checking Server TypeScript...
cd /d "%~dp0server"
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo FAILED - Server has TypeScript errors
    pause
    exit /b %errorlevel%
)
echo PASSED
echo.

echo [2/3] Checking Client TypeScript...
cd /d "%~dp0client"
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo FAILED - Client has TypeScript errors
    pause
    exit /b %errorlevel%
)
echo PASSED
echo.

echo [3/3] Building Client...
call npx vite build
if %errorlevel% neq 0 (
    echo FAILED - Client build failed
    pause
    exit /b %errorlevel%
)
echo PASSED
echo.

echo ========================================
echo  All checks passed!
echo ========================================
pause
