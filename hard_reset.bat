@echo off
echo WARNING: This will DELETE ALL DATA in the database and recreate it.
echo Press Ctrl+C to cancel or wait 5 seconds to proceed...
timeout /t 5

echo Copying reset script to container...
(
echo from database import Base, engine
echo from models import User, TokenUsage
echo print("Dropping all tables...")
echo Base.metadata.drop_all(bind=engine)
echo print("Tables dropped.")
) > reset_db.py

docker cp reset_db.py online_games_backend_prod:/app/reset_db.py
docker cp backend/seed_users.py online_games_backend_prod:/app/seed_users.py

echo Executing reset...
docker-compose -f docker-compose.prod.yml exec backend python reset_db.py

echo Executing seed...
docker-compose -f docker-compose.prod.yml exec backend python seed_users.py

echo Done!
pause
