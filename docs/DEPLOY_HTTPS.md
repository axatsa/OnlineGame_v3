# HTTPS Setup for ClassPlay (Production)

## Prerequisites

- Ubuntu 20.04+ or Debian
- Docker + Docker Compose installed
- Domain DNS A-record pointing to the server IP

---

## Option 1: Certbot + Nginx (manual)

### Step 1 — Install Certbot

```bash
sudo apt update && sudo apt install -y certbot

# Stop nginx to free port 80
docker compose -f docker-compose.prod.yml stop nginx
```

### Step 2 — Obtain certificate

```bash
sudo certbot certonly --standalone \
  -d classplay.uz \
  -d www.classplay.uz \
  --email admin@classplay.uz \
  --agree-tos \
  --no-eff-email
```

Certificates are saved to `/etc/letsencrypt/live/classplay.uz/`.

### Step 3 — Update nginx config

Create `front/nginx.prod.conf`:

```nginx
server {
    listen 80;
    server_name classplay.uz www.classplay.uz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name classplay.uz www.classplay.uz;

    ssl_certificate /etc/letsencrypt/live/classplay.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/classplay.uz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 4 — Mount certs in docker-compose.prod.yml

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./front/nginx.prod.conf:/etc/nginx/conf.d/default.conf
    - /etc/letsencrypt:/etc/letsencrypt:ro
  depends_on:
    - backend
```

### Step 5 — Auto-renew (crontab)

```bash
0 3 1 * * certbot renew \
  --pre-hook "docker compose -f /home/user/classplay/docker-compose.prod.yml stop nginx" \
  --post-hook "docker compose -f /home/user/classplay/docker-compose.prod.yml start nginx"
```

---

## Option 2: Traefik (current docker-compose.prod.yml)

The production compose file uses Traefik for automatic SSL via Let's Encrypt.
Labels on each service declare the routing rules. Traefik handles certificate issuance automatically on first request.

No manual certbot setup needed — just ensure:
1. Port 80 and 443 are open on the server
2. DNS A-record points to server IP
3. `TRAEFIK_EMAIL` is set in `.env.prod`

---

## Verification

```bash
curl -I https://classplay.uz
# Expected: HTTP/2 200

openssl s_client -connect classplay.uz:443 -showcerts
# Expected: Let's Encrypt certificate chain
```
