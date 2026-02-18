@echo off
echo Seeding database with initial users...
docker-compose -f docker-compose.prod.yml exec backend python seed_users.py
echo Seeding complete!
pause
