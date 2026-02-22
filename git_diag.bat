@echo off
git remote -v > git_diag.txt 2>&1
echo --- >> git_diag.txt
git status >> git_diag.txt 2>&1
echo --- >> git_diag.txt
git fetch origin >> git_diag.txt 2>&1
if %errorlevel% neq 0 (
  echo Fetch failed >> git_diag.txt
) else (
  echo Fetch success >> git_diag.txt
  git log -1 origin/main >> git_diag.txt 2>&1
)
git push -u origin main >> git_diag.txt 2>&1
 