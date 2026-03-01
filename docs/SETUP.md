# OSD Strapi CMS — Production Deployment Guide

> **Stack:** Strapi 5 · PostgreSQL 17 · Docker · Nginx · Let's Encrypt (Certbot)  
> **Target OS:** Ubuntu 24.04 LTS

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [DNS Configuration](#2-dns-configuration)
3. [Server Provisioning](#3-server-provisioning)
4. [Install Docker](#4-install-docker)
5. [Configure Swap](#5-configure-swap)
6. [Configure Firewall](#6-configure-firewall)
7. [Clone the Repository](#7-clone-the-repository)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Start Docker Containers](#9-start-docker-containers)
10. [Install and Configure Nginx](#10-install-and-configure-nginx)
11. [Issue SSL Certificate](#11-issue-ssl-certificate)
12. [Verify Deployment](#12-verify-deployment)
13. [Post-Deployment](#13-post-deployment)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

Before you begin, ensure you have the following:

- **VPS** running Ubuntu 24.04 LTS (minimum: 1 vCPU / 2 GB RAM, recommended: 2 vCPU / 4 GB RAM)
- **SSH access** as `root` to the VPS
- **Domain name** with access to DNS management (Namecheap, Cloudflare, etc.)
- **Git repository** access to clone the project

---

## 2. DNS Configuration

Add an **A record** in your domain registrar or DNS provider:

| Type | Host  | Value         | TTL  |
| ---- | ----- | ------------- | ---- |
| A    | `cms` | `YOUR_VPS_IP` | Auto |

> [!IMPORTANT] > **Cloudflare users:** Set the record to **grey cloud (DNS only)** — not the orange cloud (proxied). The Cloudflare proxy causes a **Error 522** during SSL setup because it tries to connect on HTTPS before the certificate exists. You can re-enable the orange cloud after Step 11.

Verify DNS propagation (may take up to 30 minutes):

```bash
nslookup cms.opensourceweekend.org
# Output should show your VPS IP
```

---

## 3. Server Provisioning

SSH into your VPS and update the system:

```bash
ssh root@YOUR_VPS_IP

apt update && apt upgrade -y
```

---

## 4. Install Docker

Install Docker Engine and the Compose plugin using the official script:

```bash
curl -fsSL https://get.docker.com | bash
```

Verify the installation:

```bash
docker --version
docker compose version
```

---

## 5. Configure Swap

Swap prevents out-of-memory crashes during the Docker build on small VPS instances:

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make swap persistent across reboots
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Confirm
free -h
```

Expected output: `Swap: 4.0G`.

---

## 6. Configure Firewall

Allow only the required ports:

```bash
ufw allow 22     # SSH
ufw allow 80     # HTTP
ufw allow 443    # HTTPS
ufw --force enable

ufw status
```

> [!WARNING]
> Do **not** open port `5432` (PostgreSQL). The database is only accessible inside the Docker network, never publicly. Use an SSH tunnel if you need local DB access: `ssh -L 5433:localhost:5432 root@YOUR_VPS_IP`

---

## 7. Clone the Repository

```bash
mkdir -p /opt/app && cd /opt/app
git clone https://github.com/YOUR_ORG/osd-strapi-cms.git .
```

---

## 8. Configure Environment Variables

Copy the example file and fill in all values:

```bash
cp .env.example .env
nano .env
chmod 600 .env   # restrict read access to root only
```

### Generating secrets

Run the following command once per secret variable:

```bash
openssl rand -base64 16
```

For `APP_KEYS`, generate 4 values comma-separated:

```bash
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"
```

### Required variables

| Variable              | Description                              |
| --------------------- | ---------------------------------------- |
| `APP_KEYS`            | 4 random base64 secrets, comma-separated |
| `API_TOKEN_SALT`      | `openssl rand -base64 16`                |
| `ADMIN_JWT_SECRET`    | `openssl rand -base64 16`                |
| `TRANSFER_TOKEN_SALT` | `openssl rand -base64 16`                |
| `JWT_SECRET`          | `openssl rand -base64 16`                |
| `ENCRYPTION_KEY`      | `openssl rand -base64 16`                |
| `DATABASE_NAME`       | e.g. `strapi_db`                         |
| `DATABASE_USERNAME`   | e.g. `strapi`                            |
| `DATABASE_PASSWORD`   | A strong, unique password                |

---

## 9. Start Docker Containers

Build the Strapi image and start all containers:

```bash
cd /opt/app
docker compose up -d --build
```

Monitor startup logs:

```bash
docker compose logs -f strapi
```

Wait until you see:

```
Strapi is listening on: http://0.0.0.0:1337
```

Verify both containers are running and healthy:

```bash
docker compose ps
```

---

## 10. Install and Configure Nginx

### Install Nginx

```bash
apt install nginx -y

# Stop Apache if it's pre-installed (common on fresh Ubuntu VPS)
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

systemctl enable nginx
systemctl start nginx
```

### Deploy the Nginx config

The repository includes a production-ready Nginx config at `nginx/cms.conf`.

```bash
# Copy config
cp /opt/app/nginx/cms.conf /etc/nginx/sites-available/cms

# Enable the site
ln -s /etc/nginx/sites-available/cms /etc/nginx/sites-enabled/cms

# Disable the default Nginx welcome page
rm -f /etc/nginx/sites-enabled/default

# Test and apply
nginx -t
systemctl reload nginx
```

### Confirm Nginx is proxying to Strapi

```bash
curl -I http://YOUR_VPS_IP
# Expected: HTTP/1.1 200 OK (from Strapi, not the Nginx welcome page)
```

---

## 11. Issue SSL Certificate

Install Certbot and issue a free SSL certificate via Let's Encrypt:

```bash
apt install certbot python3-certbot-nginx -y

certbot --nginx -d cms.opensourceweekend.org
```

Certbot will:

- Verify domain ownership via the HTTP challenge
- Issue the SSL certificate
- Automatically update the Nginx config with the HTTPS block and redirect
- Register auto-renewal via systemd timer

Test that auto-renewal works:

```bash
certbot renew --dry-run
```

---

## 12. Verify Deployment

Run the following checks to confirm everything is working:

```bash
# 1. All containers healthy
docker compose ps

# 2. HTTPS responds correctly
curl -I https://cms.opensourceweekend.org
# Expected: HTTP/2 200

# 3. Strapi health endpoint
curl https://cms.opensourceweekend.org/_health
# Expected: {}
```

Open the admin panel in your browser:

```
https://cms.opensourceweekend.org/admin
```

Create your first administrator account to complete the setup.

---

## 13. Post-Deployment

### Re-enable Cloudflare Proxy (optional)

If you disabled the Cloudflare orange cloud in Step 2, you can now re-enable it safely:

1. Cloudflare Dashboard → **SSL/TLS** → **Overview** → Set mode to **Full (Strict)**
2. DNS → `cms` A record → click the grey cloud → enable **orange cloud** (proxied)

### Hide Nginx version (recommended)

```bash
nano /etc/nginx/nginx.conf
# Inside the http { } block, ensure:
#   server_tokens off;

nginx -t && systemctl reload nginx
```

### Subsequent deploys

After the first setup, deploying new code is a single command from your local machine:

```bash
./deploy.sh
```
