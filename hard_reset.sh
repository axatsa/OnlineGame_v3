#!/bin/bash
echo "Starting Hard Reset..."

# 1. Copy the reset script to the container
echo "Copying reset_db.py to container..."
docker cp backend/reset_db.py online_games_backend_prod:/app/reset_db.py

# 2. Copy the seed script (ensure it's the latest version)
echo "Copying seed_users.py to container..."
docker cp backend/seed_users.py online_games_backend_prod:/app/seed_users.py

# 3. Execute reset (Drop all tables)
echo "Executing reset_db.py..."
docker-compose -f docker-compose.prod.yml exec -T backend python reset_db.py

# 4. Execute seed (Create tables + Add users)
echo "Executing seed_users.py..."
docker-compose -f docker-compose.prod.yml exec -T backend python seed_users.py

echo "Hard Reset Complete."
