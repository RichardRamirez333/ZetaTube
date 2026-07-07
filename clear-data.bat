@echo off
title ZETAtube - Clear All Data
echo.
echo  WARNING: This will delete ALL users, videos, comments,
echo  notifications, and everything else from the database.
echo.
set /p "confirm=Type YES to confirm: "
if not "%confirm%"=="YES" (
    echo Cancelled.
    pause
    exit /b
)
echo.
echo Clearing data...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/videos/admin/clear-all' -Method POST -UseBasicParsing; Write-Host $r.Content } catch { Write-Host 'ERROR: Server not running on port 5000' }"
echo.
pause
