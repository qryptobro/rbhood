#!/usr/bin/env bash
# Подготовка Ubuntu 22.04 (Oracle Always Free ARM) под rbhood-ai.
# Ставит: Node 20, git, PostgreSQL, PM2, Caddy. Создаёт БД. Открывает порты 80/443.
# Запуск:  bash deploy/setup-ubuntu.sh
set -euo pipefail

echo ">> Обновление системы"
sudo apt-get update && sudo apt-get upgrade -y

echo ">> Node.js 20 + git"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

echo ">> PM2 (менеджер процессов)"
sudo npm install -g pm2

echo ">> PostgreSQL"
sudo apt-get install -y postgresql
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='rbhood'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER rbhood WITH PASSWORD 'rbhood_pass';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='rbhood'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE rbhood OWNER rbhood;"
echo "   DATABASE_URL=postgresql://rbhood:rbhood_pass@localhost:5432/rbhood"

echo ">> Caddy (обратный прокси + авто-HTTPS)"
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
sudo apt-get update && sudo apt-get install -y caddy

echo ">> Открываю порты 80/443 в iptables (Oracle по умолчанию всё блокирует)"
sudo iptables -I INPUT -p tcp --dport 80  -j ACCEPT || true
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT || true
sudo apt-get install -y iptables-persistent >/dev/null 2>&1 || true
sudo netfilter-persistent save || true

echo ">> Готово. Дальше — по deploy/DEPLOY-linux.md (клон, .env, prisma, build, pm2, caddy)."
