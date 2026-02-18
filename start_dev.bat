@echo off
echo Starting ClassPlay Environment...

echo 1. Starting Database (Docker)...
docker compose up -d
if %errorlevel% neq 0 (
    echo Docker failed to start! Make sure Docker Desktop is running.
    pause
    exit /b
)

echo 2. Installing Backend Dependencies (if needed)...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt > nul 2>&1

echo 3. Seeding Database...
python seed.py

echo 4. Starting Backend Server (New Window)...
start "ClassPlay Backend" cmd /k "venv\Scripts\activate && uvicorn main:app --reload"

echo 5. Starting Frontend (New Window)...
cd ..\front
start "ClassPlay Frontend" cmd /k "npm run dev"

echo.
echo All services started! 
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this launcher (servers will keep running)...
pause
