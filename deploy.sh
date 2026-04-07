#!/bin/bash
echo '🚀 Начинаем деплой OnlineGame_v3 (Modular Monolith)'

PROJECT_DIR="/home/temp/OnlineGame_v3"

if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    echo "❌ Ошибка: Папка $PROJECT_DIR не найдена!"
    exit 1
fi

# 2. Принудительное обновление кода
echo '🔄 Принудительная загрузка кода из GitHub...'
git fetch origin main
git reset --hard origin/main

# 3. Определяем команду docker compose
if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
else
    echo "❌ Ошибка: Docker Compose не найден!"
    exit 1
fi
echo "🛠️ Используем команду: $DOCKER_CMD"

# 4. Остановка и УДАЛЕНИЕ старых контейнеров
echo '🧹 Очистка старых контейнеров...'
$DOCKER_CMD -f docker-compose.prod.yml down --remove-orphans

# Принудительное удаление, если down не справился
docker rm -f online_games_db_prod online_games_backend_prod online_games_frontend_prod 2>/dev/null

# 5. Сборка и запуск новых
echo '🔨 Пересборка и запуск контейнеров...'
$DOCKER_CMD -f docker-compose.prod.yml up -d --build --force-recreate

# 6. Ожидание готовности БД
echo '⏳ Ожидание инициализации базы данных...'
sleep 5

# 7. Миграция схемы (добавление новых колонок)
echo '⚙️ Синхронизация схемы базы данных...'
docker exec -t online_games_backend_prod python fix_db.py

# 8. Запуск сидов
echo '🌱 Наполнение базы данных (Seeding)...'
docker exec -t online_games_backend_prod python seed_users.py
docker exec -t online_games_backend_prod python seed.py
docker exec -t online_games_backend_prod python seed_gamification.py

echo '✅ Деплой успешно завершен!'
echo '🌐 Проект доступен по адресу: https://classplay.uz!'
