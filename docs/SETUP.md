# OSD Infrastructure — Setup Guide

## Step 1 — DNS Records

In your domain registrar (Namecheap / Cloudflare) → DNS → add **1 A record**:

| Type | Host  | Value         |
| ---- | ----- | ------------- |
| A    | `cms` | `YOUR_VPS_IP` |

Verify propagation (can take 5–30 min):

```bash
nslookup cms.opensourceweekend.org
```

---

## Step 2 — Provision VPS

```bash
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | bash
docker --version
docker compose version

# Add 4 GB swap (prevents OOM crashes on small VPS)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h    # should show 4G swap

# Firewall — only SSH + HTTP + HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
ufw status

# ⚠️  Do NOT open 5432 in the firewall.
# PostgreSQL is internal-only (Docker network). Access via SSH tunnel if needed:
#   ssh -L 5433:localhost:5432 root@YOUR_VPS_IP
#   Then connect to localhost:5433 from your local DB client
```

---

## Step 3 — Clone & Configure

```bash
mkdir -p /opt/app && cd /opt/app
git clone https://github.com/YOUR_ORG/osd-strapi-cms.git .

cp .env.example .env
nano .env       # Fill in all values (see below)
chmod 600 .env
```

### Required `.env` values

| Variable              | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `APP_KEYS`            | 4 random base64 strings: `openssl rand -base64 16` (×4, comma-separated) |
| `API_TOKEN_SALT`      | `openssl rand -base64 16`                                                |
| `ADMIN_JWT_SECRET`    | `openssl rand -base64 16`                                                |
| `TRANSFER_TOKEN_SALT` | `openssl rand -base64 16`                                                |
| `JWT_SECRET`          | `openssl rand -base64 16`                                                |
| `ENCRYPTION_KEY`      | `openssl rand -base64 16`                                                |
| `DATABASE_NAME`       | e.g. `strapi_db`                                                         |
| `DATABASE_USERNAME`   | e.g. `strapi`                                                            |
| `DATABASE_PASSWORD`   | Strong password                                                          |

---

## Step 4 — Start Containers

```bash
cd /opt/app
docker compose up -d --build

# Watch logs
docker compose logs -f strapi

# Verify both containers are running
docker compose ps
```

Strapi will be available at `http://YOUR_VPS_IP:1337` after ~60s first build.

---

## Step 5 — Nginx Reverse Proxy

Install Nginx:

```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

The repo includes a ready-to-use config at `nginx/cms.conf`. Copy it to the Nginx sites directory:

```bash
cp /opt/app/nginx/cms.conf /etc/nginx/sites-available/cms
ln -s /etc/nginx/sites-available/cms /etc/nginx/sites-enabled/
```

> **Before enabling SSL**, comment out the `listen 443 ssl` server block  
> (or remove the SSL block temporarily) — certbot will add the SSL lines in Step 6.

Test and reload:

```bash
nginx -t
systemctl reload nginx
```

Strapi admin should now be reachable at `http://cms.opensourceweekend.org`.

### What the config does

| Feature               | Detail                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| HTTP → HTTPS redirect | All port 80 traffic redirects to HTTPS                                  |
| WebSocket support     | `Upgrade` + `Connection` headers for Strapi admin live reload           |
| Real IP forwarding    | `X-Real-IP` + `X-Forwarded-For` so Strapi logs actual client IPs        |
| Upload limit          | `client_max_body_size 100M`                                             |
| Static asset caching  | JS/CSS/images served with 30-day `Cache-Control`                        |
| Security headers      | `X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`, `HSTS` |
| Server version hidden | Add `server_tokens off;` in `/etc/nginx/nginx.conf` → `http {}` block   |

### Hide Nginx version (optional but recommended)

```bash
nano /etc/nginx/nginx.conf
# Inside http { } block, add:
#   server_tokens off;
nginx -t && systemctl reload nginx
```

---

## Step 6 — SSL with Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y

# Issue certificate and auto-configure Nginx
certbot --nginx -d cms.opensourceweekend.org

# Test auto-renewal (runs every 90 days via systemd timer)
certbot renew --dry-run
```

After certbot runs, it will automatically:

- Fill in `ssl_certificate` and `ssl_certificate_key` lines in `cms.conf`
- Add HTTPS-redirect update to the HTTP block
- Set up a systemd timer for auto-renewal

---

## Step 7 — Verify

```bash
# Check containers are healthy
docker compose ps

# Check Strapi logs
docker compose logs strapi --tail=50

# Test the public URL
curl -I https://cms.opensourceweekend.org
# Expected: HTTP/2 200

# Test Strapi health endpoint
curl https://cms.opensourceweekend.org/_health
# Expected: {}
```

---

## Troubleshooting

| Issue                 | Command                                                  |
| --------------------- | -------------------------------------------------------- |
| Strapi won't start    | `docker compose logs strapi`                             |
| DB not ready          | `docker compose logs postgres`                           |
| Nginx 502 Bad Gateway | Check `docker compose ps` — is strapi container running? |
| Port conflict         | `ss -tlnp \| grep 1337`                                  |
| SSL cert not renewing | `certbot renew --dry-run`                                |
| Disk full             | `df -h && docker system prune -f`                        |
