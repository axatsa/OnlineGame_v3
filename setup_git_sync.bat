@echo off
git remote add origin https://github.com/axatsa/OnlineGame_v3.git || git remote set-url origin https://github.com/axatsa/OnlineGame_v3.git
git branch -M main
git add task.md implementation_plan.md
git commit -m "Docs: Setup project synchronization files"
git push -u origin main
