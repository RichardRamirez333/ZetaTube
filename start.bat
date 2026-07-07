@echo off
title ZETAtube
cd /d "%~dp0"

:: Add Node.js to PATH (in case not in system PATH)
set "NODE_DIR=C:\Users\thomas shelby\Desktop\Open Code\nodejs\node-v20.19.0-win-x64"
set "PATH=%NODE_DIR%;%PATH%"

:: Start Server
start "ZETAtube Server" cmd /c "title ZETAtube Server && cd /d server && npx.cmd tsx watch src/index.ts"

:: Wait for server to start
timeout /t 4 /nobreak >nul

:: Start Client
start "ZETAtube Client" cmd /c "title ZETAtube Client && cd /d client && npx.cmd vite --host"

cls
echo.
echo  ====================================
echo    ZETAtube is starting up!
echo  ====================================
echo.
echo    Server: http://localhost:5000
echo    Client: http://localhost:3000
echo.
echo    Close the terminal windows to stop.
echo  ====================================
echo.
pause
