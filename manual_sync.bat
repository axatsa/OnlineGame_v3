@echo off
echo Setting up Git synchronization...
git remote add origin https://github.com/axatsa/OnlineGame_v3.git 2>nul
if %errorlevel% neq 0 echo Remote origin already exists or failed to add.
git remote set-url origin https://github.com/axatsa/OnlineGame_v3.git

echo.
echo Adding files...
git add task.md implementation_plan.md
git commit -m "Docs: Initialize synchronization files"

echo.
echo Pushing to remote...
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo Push failed! Please check the error message above.
    echo Common issues:
    echo 1. You may need to sign in (check for a popup window).
    echo 2. The remote repository might not be empty (try git pull).
) else (
    echo.
    echo Push successful!
)
pause
