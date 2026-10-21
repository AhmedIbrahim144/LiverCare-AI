@echo off
REM LiverCare AI - start the backend web server (FastAPI + frontend)
cd /d "%~dp0"
echo ========================================
echo   LiverCare AI - Starting Server
echo   Open http://localhost:8000
echo ========================================
python run_backend.py 0.0.0.0 8000
pause
