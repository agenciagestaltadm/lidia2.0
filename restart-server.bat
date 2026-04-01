@echo off
echo Reiniciando servidor Next.js...
cd /d "%~dp0"
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
npm run dev
