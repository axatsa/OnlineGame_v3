# Управление секретами в ClassPlay

## ⚠️ Что НЕЛЬЗЯ коммитить в git

- `.env` — переменные окружения с реальными ключами
- `.env.prod` — production конфиг
- Любые файлы с API-ключами, паролями, токенами

Убедись что в `.gitignore` есть:
```
.env
.env.prod
.env.local
*.pem
*.key
```

---

## Переменные окружения

### Обязательные (backend)

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `DATABASE_URL` | Строка подключения к PostgreSQL | `postgresql://user:pass@db:5432/classplay` |
| `SECRET_KEY` | JWT подпись — сгенерировать через `openssl rand -hex 32` | `a3f8...` |
| `OPENAI_API_KEY` | Ключ OpenAI | `sk-...` |
| `GEMINI_API_KEY` | Ключ Google Gemini | `AIza...` |

### Опциональные (backend)

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `RATE_LIMIT_PER_HOUR` | Запросов к AI в час | `60` |
| `DEFAULT_TOKEN_LIMIT` | Месячный лимит токенов | `100000` |
| `ALGORITHM` | JWT алгоритм | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни токена | `10080` (7 дней) |

---

## На prod-сервере

**Вариант 1 (простой): `.env.prod` файл**

```bash
# На сервере создать файл (НЕ в репозитории):
nano /home/user/classplay/.env.prod

# Запускать compose с ним:
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

**Вариант 2 (рекомендован): Railway / Render Secrets**

В Railway Dashboard → Variables → добавить каждую переменную. Они никогда не попадают в git.

**Вариант 3 (продвинутый): HashiCorp Vault или Doppler**

```bash
# Doppler (бесплатный тир):
doppler setup
doppler run -- docker compose up -d
```

---

## Генерация SECRET_KEY

```bash
openssl rand -hex 32
# → скопировать вывод в .env как SECRET_KEY=...
```

---

## Ротация ключей

При компрометации ключа:
1. Сгенерировать новый `SECRET_KEY`
2. Обновить на сервере
3. Перезапустить backend — все JWT станут невалидны (пользователи перелогинятся)
4. Аналогично для API ключей OpenAI/Gemini — перегенерировать в консоли провайдера
