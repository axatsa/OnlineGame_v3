#!/bin/bash
# =============================================================
# ClassPlay — Автоматический бэкап PostgreSQL
# Запускать через cron: 0 3 * * * /path/to/backup/backup.sh
# =============================================================

set -e

# --- Конфигурация (менять здесь или задавать через env) ---
BACKUP_DIR="${BACKUP_DIR:-/backups/classplay}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-classplay-db}"
DB_NAME="${POSTGRES_DB:-classplay}"
DB_USER="${POSTGRES_USER:-postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# --- Подготовка ---
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="$BACKUP_DIR/classplay_$DATE.sql.gz"

echo "=== ClassPlay Backup: $(date) ==="
echo "Target: $FILENAME"

# --- Дамп базы данных ---
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    docker exec "$CONTAINER_NAME" \
        pg_dump -U "$DB_USER" "$DB_NAME" \
        | gzip > "$FILENAME"
    echo "✓ Backup created: $FILENAME ($(du -sh "$FILENAME" | cut -f1))"
else
    echo "✗ Error: Docker container '$CONTAINER_NAME' not found"
    exit 1
fi

# --- Удаление старых бэкапов ---
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "classplay_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls "$BACKUP_DIR" | wc -l)
echo "✓ Done. Backups remaining: $REMAINING"
echo "=============================="
