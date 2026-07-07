@echo off
cd /d "%~dp0server"
npx tsx watch src/index.ts
pause
