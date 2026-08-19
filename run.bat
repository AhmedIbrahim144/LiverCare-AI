@echo off
echo ========================================
echo   LiverCare AI - Starting Application
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
echo.

REM Run ingestion if vector DB doesn't exist
if not exist "vector_db\chroma" (
    echo Running initial data ingestion...
    python scripts\ingest_all.py
    echo.
)

REM Start the backend server
echo Starting LiverCare AI server...
echo Open http://localhost:8000 in your browser
echo.
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
