# VPS Deployment Guide — Strapi CMS + PostgreSQL

> Quick-reference cheatsheet for deploying to a fresh VPS.
> For full step-by-step setup, see [SETUP.md](./SETUP.md).

## Prerequisites

- VPS with Ubuntu 22.04+ (minimum 1 vCPU / 1 GB RAM — 2 GB recommended)
- Domain: `cms.opensourceweekend.org` → A record pointing to VPS IP
- SSH access as root

## Stack

| Service    | Image                         | Port                      |
| ---------- | ----------------------------- | ------------------------- |
| Strapi CMS | Custom Docker build (Node 20) | `1337` (internal → Nginx) |
| PostgreSQL | `postgres:17-alpine`          | Internal only             |

## Quick Deploy

```bash
# 1. SSH into VPS
ssh root@YOUR_VPS_IP

# 2. Install Docker
curl -fsSL https://get.docker.com | bash

# 3. Clone repo
git clone https://github.com/YOUR_ORG/osd-strapi-cms.git /opt/app
cd /opt/app

# 4. Configure environment
cp .env.example .env && nano .env

# 5. Start
docker compose up -d --build
docker compose logs -f strapi
```

## Generate Strapi Secrets

Run these commands to generate each secret value:

```bash
# Run once per variable
openssl rand -base64 16

# APP_KEYS needs 4 values comma-separated:
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"
```

## Useful Commands

```bash
# View logs
docker compose logs -f strapi
docker compose logs -f postgres

# Restart a service
docker compose restart strapi

# Rebuild after code update
git pull && docker compose up -d --build

# Access PostgreSQL directly
docker compose exec postgres psql -U ${DATABASE_USERNAME} -d ${DATABASE_NAME}

# SSH tunnel to access DB locally (from your machine)
ssh -L 5433:localhost:5432 root@YOUR_VPS_IP
# Then connect: psql -h localhost -p 5433 -U strapi -d strapi_db

# Check disk and clean Docker artifacts
df -h
docker system prune -f
```

## File Locations on VPS

| Path                             | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `/opt/app/`                      | Application root                    |
| `/opt/app/.env`                  | Secrets (chmod 600)                 |
| `/opt/app/uploads/`              | Media uploads (Docker volume mount) |
| `/etc/nginx/sites-available/cms` | Nginx vhost config                  |
