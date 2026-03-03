#!/usr/bin/env bash
# deploy.sh — Deploy Strapi CMS to VPS
# Usage: ./deploy.sh
# chmod +x deploy.sh

set -e

VPS_HOST="187.124.97.27"   # Change this to your VPS IP or domain
VPS_USER="root"
APP_DIR="/opt/app/osd_strapi_cms"

echo "Connecting to VPS and deploying..."

ssh ${VPS_USER}@${VPS_HOST} bash <<EOF
  cd ${APP_DIR}
  git pull origin main
  docker compose up -d --build
  docker compose ps
  echo "Deploy done!"
EOF
