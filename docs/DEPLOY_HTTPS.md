# Настройка HTTPS (SSL) для ClassPlay на prod-сервере

## Требования
- Ubuntu 20.04+ / Debian
- Docker + Docker Compose
- Домен указывает на IP сервера (A-запись в DNS)

---

## Шаг 1: Установить Certbot

```bash
sudo apt update
sudo apt install -y certbot

# Остановить nginx на время получения сертификата
docker compose -f docker-compose.prod.yml stop nginx
```

## Шаг 2: Получить сертификат

```bash
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email
```

Сертификаты будут в `/etc/letsencrypt/live/yourdomain.com/`.

## Шаг 3: Обновить nginx конфиг

Отредактировать `front/nginx.conf` или создать `nginx.prod.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Шаг 4: Обновить docker-compose.prod.yml

Добавить volume для сертификатов в nginx-сервис:

```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"     # ← добавить
    volumes:
      - ./front/nginx.prod.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro    # ← добавить
    depends_on:
      - backend
```

## Шаг 5: Автообновление сертификата

```bash
# Добавить в crontab:
0 3 1 * * certbot renew --pre-hook "docker compose -f /path/to/docker-compose.prod.yml stop nginx" \
            --post-hook "docker compose -f /path/to/docker-compose.prod.yml start nginx"
```

---

## Проверка

```bash
curl -I https://yourdomain.com
# → HTTP/2 200 ✓

openssl s_client -connect yourdomain.com:443 -showcerts
# → Certificate chain должен показать Let's Encrypt
```
