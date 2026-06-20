#!/bin/bash

# ==================================================
# 🚀 Скрипт автоматического развертывания gameshop-support
# Использование: bash deploy.sh
# Запускать от root на свежем сервере Ubuntu 22.04
# ==================================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  🚀 Установка gameshop-support на сервер${NC}"
echo -e "${BLUE}====================================================${NC}"

# ==================================================
# 1. Ввод данных от пользователя
# ==================================================
read -p "$(echo -e ${YELLOW}"Введите ваш домен (например, support.gameshop.ru): "${NC})" DOMAIN
read -p "$(echo -e ${YELLOW}"Введите пароль для PostgreSQL пользователя gameshop_admin: "${NC})" DB_PASSWORD
read -p "$(echo -e ${YELLOW}"Введите JWT_SECRET (любая строка, минимум 32 символа): "${NC})" JWT_SECRET
read -p "$(echo -e ${YELLOW}"Введите пароль для админ-панели: "${NC})" ADMIN_PASSWORD
read -p "$(echo -e ${YELLOW}"Email для SSL сертификата (Let's Encrypt): "${NC})" SSL_EMAIL

echo ""
echo -e "${GREEN}Начинаем установку...${NC}"
sleep 2

# ==================================================
# 2. Обновление системы
# ==================================================
echo -e "${YELLOW}[1/12] Обновление системы...${NC}"
apt update && apt upgrade -y

# ==================================================
# 3. Установка Node.js 18.x
# ==================================================
echo -e "${YELLOW}[2/12] Установка Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs git nginx

# ==================================================
# 4. Установка PostgreSQL
# ==================================================
echo -e "${YELLOW}[3/12] Установка PostgreSQL...${NC}"
apt install -y postgresql postgresql-client
systemctl start postgresql
systemctl enable postgresql

# ==================================================
# 5. Настройка PostgreSQL
# ==================================================
echo -e "${YELLOW}[4/12] Настройка PostgreSQL...${NC}"
sudo -u postgres psql <<EOF
CREATE DATABASE gameshop_support;
CREATE USER gameshop_admin WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE gameshop_support TO gameshop_admin;
ALTER DATABASE gameshop_support OWNER TO gameshop_admin;
\c gameshop_support
GRANT ALL ON SCHEMA public TO gameshop_admin;
EOF

# Разрешаем подключение локально по паролю
sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql

# ==================================================
# 6. Установка PM2
# ==================================================
echo -e "${YELLOW}[5/12] Установка PM2...${NC}"
npm install -g pm2

# ==================================================
# 7. Клонирование репозитория
# ==================================================
echo -e "${YELLOW}[6/12] Клонирование репозитория...${NC}"
cd /var/www
rm -rf gameshop-support
git clone https://github.com/Sipuh/gameshop-support.git
cd gameshop-support

# ==================================================
# 8. Настройка .env
# ==================================================
echo -e "${YELLOW}[7/12] Создание .env...${NC}"
cat > .env <<EOF
# База данных PostgreSQL (локальная)
DATABASE_URL="postgresql://gameshop_admin:${DB_PASSWORD}@localhost:5432/gameshop_support"

# JWT Secret для авторизации
JWT_SECRET="${JWT_SECRET}"

# Пароль для входа в админ-панель
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
EOF

# ==================================================
# 9. Установка зависимостей и сборка
# ==================================================
echo -e "${YELLOW}[8/12] Установка npm зависимостей...${NC}"
npm install

echo -e "${YELLOW}[9/12] Инициализация базы данных...${NC}"
npx prisma generate
npx prisma db push --force-reset || npx prisma db push

echo -e "${YELLOW}[10/12] Заполнение базы начальными данными...${NC}"
npx tsx prisma/seed.ts

echo -e "${YELLOW}[11/12] Сборка проекта...${NC}"
npm run build

# ==================================================
# 10. Запуск через PM2
# ==================================================
echo -e "${YELLOW}[12/12] Запуск через PM2...${NC}"
pm2 delete gameshop-support 2>/dev/null || true
pm2 start npm --name "gameshop-support" -- start
pm2 save
pm2 startup systemd -u root --hp /root
pm2 save

echo ""
echo -e "${GREEN}✅ Приложение запущено на порту 3000!${NC}"

# ==================================================
# 11. Настройка Nginx
# ==================================================
echo -e "${YELLOW}Настройка Nginx для домена ${DOMAIN}...${NC}"

cat > /etc/nginx/sites-available/gameshop-support <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    client_max_body_size 50M;
}
EOF

ln -sf /etc/nginx/sites-available/gameshop-support /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo -e "${GREEN}✅ Nginx настроен!${NC}"

# ==================================================
# 12. SSL сертификат
# ==================================================
echo -e "${YELLOW}Получение SSL сертификата от Let's Encrypt...${NC}"
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${SSL_EMAIL}

# Настраиваем автоматическое обновление SSL
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✅ Установка завершена!${NC}"
echo -e "${GREEN}  🌐 Сайт: https://${DOMAIN}${NC}"
echo -e "${GREEN}  🔑 Админка: https://${DOMAIN}/admin${NC}"
echo -e "${GREEN}  📧 Admin email: admin@gameshop.ru${NC}"
echo -e "${GREEN}  🔑 Admin пароль: admin123${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  Важно: Смените пароль администратора после первого входа!${NC}"
echo -e "${YELLOW}   Для этого выполните: npx tsx prisma/change-password.ts${NC}"