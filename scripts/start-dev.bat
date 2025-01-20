@echo off
echo Starting ShopSyncAI Development Environment...

REM Create necessary directories
mkdir "%~dp0..\ml_models" 2>nul

REM Start Backend Server
cd "%~dp0..\backend"
start cmd /k "python app/preview.py"

REM Start Frontend Server (if available)
cd "%~dp0..\frontend"
if exist package.json (
    start cmd /k "npm install && npm start"
) else (
    echo Frontend not yet configured. Using backend preview only.
)

echo.
echo ShopSyncAI is starting...
echo.
echo Backend endpoints:
echo   - http://localhost:5000/api/recommendations/1
echo   - http://localhost:5000/api/pricing/1
echo   - http://localhost:5000/api/products
echo   - http://localhost:5000/api/users
echo   - http://localhost:5000/health
echo.
echo Press any key to stop all servers...
pause >nul

REM Kill all python and node processes started by this script
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
