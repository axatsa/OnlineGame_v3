# 🔒 Задача 01: Безопасность и надёжность

**Приоритет:** 🔴 Критический (Sprint 1)  
**Оценка:** ~3–5 дней  
**Исполнитель:** Backend + DevOps

---

## Контекст

Перед запуском продаж необходимо базовое усиление безопасности. Один пользователь может выжечь весь AI-бюджет, нет SSL в prod, нет бэкапов.

---

## Подзадачи

### 1.1 Rate Limiting на AI-эндпоинтах

**Файл:** `backend/app/main.py` или отдельный `middleware/rate_limit.py`

**Что делать:**
- Установить `slowapi` → `pip install slowapi`
- Добавить лимитер: например, **30 запросов к `/generate/*` в час на пользователя**
- Вернуть 429 с понятным сообщением: `"Too many requests. Try again in X minutes."`

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/generate/quiz")
@limiter.limit("30/hour")
async def generate_quiz(request: Request, ...):
    ...
```

**Проверка:** Отправить 31 запрос подряд → должен вернуть 429.

---

### 1.2 Квоты токенов в БД

**Файлы:** `backend/app/models.py`, `backend/app/services/quota.py`

**Что делать:**
- Добавить поле в модель пользователя или отдельную таблицу:
  ```python
  tokens_used_this_month: int = 0
  tokens_limit: int = 50000  # -1 = unlimited
  ```
- Написать `check_token_quota(user_id)` — вызывать перед каждым AI-запросом
- Обновлять `tokens_used` после каждого ответа OpenAI/Gemini (из `usage.total_tokens`)
- Сбрасывать в 0 каждый месяц (cron или при входе, если прошло >30 дней)

**Проверка:** Выставить лимит 100 токенов вручную → убедиться, что следующий запрос возвращает 402.

---

### 1.3 HTTPS в Nginx (prod)

**Файл:** `nginx/nginx.prod.conf` (или аналог)

**Что делать:**
- Добавить SSL через Let's Encrypt (Certbot) или подключить уже имеющийся сертификат
- Redirect HTTP → HTTPS

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ...
}
```

- В `docker-compose.prod.yml` добавить volume для `/etc/letsencrypt`

**Проверка:** `curl -I https://yourdomain.com` → 200 OK.

---

### 1.4 Secrets Management

**Файл:** `.env`, `docker-compose.prod.yml`

**Что делать:**
- Убрать секреты из `docker-compose.prod.yml` в файл `.env.prod` (не коммитить в git)
- Добавить `.env.prod` в `.gitignore`
- На сервере использовать `--env-file .env.prod` при запуске compose
- Опционально: изучить Railway Secrets или Doppler для управления через UI

**Проверка:** `git log --all --full-history -- .env.prod` → файл не должен попасть в историю.

---

### 1.5 Автоматический бэкап PostgreSQL

**Файл:** `backup/backup.sh` + cron на сервере

**Что делать:**
- Написать bash-скрипт:
  ```bash
  #!/bin/bash
  DATE=$(date +%Y%m%d_%H%M%S)
  docker exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > /backups/db_$DATE.sql
  # Удалить файлы старше 7 дней
  find /backups -name "*.sql" -mtime +7 -delete
  ```
- Добавить в crontab: `0 3 * * * /path/to/backup.sh`
- Убедиться, что папка `/backups` смонтирована как volume или настроен rsync на S3/Backblaze

**Проверка:** Запустить скрипт вручную → проверить наличие файла бэкапа и корректность восстановления через `psql`.

---

## Definition of Done

- [ ] Rate limit 429 работает при превышении лимита
- [ ] Квоты токенов хранятся в БД, проверяются перед AI-запросом
- [ ] prod-сайт открывается по HTTPS
- [ ] Секреты не в docker-compose.prod.yml и не в git
- [ ] Бэкап БД работает по расписанию
