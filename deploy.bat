@echo off
echo Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

echo Building and starting new containers...
docker-compose -f docker-compose.prod.yml up -d --build

echo Deployment complete!
pause
