@echo off
echo Copying updated seed_users.py to backend container...
docker cp backend/seed_users.py online_games_backend_prod:/app/seed_users.py

echo Executing seed script...
docker-compose -f docker-compose.prod.yml exec backend python seed_users.py

echo Done.
pause
