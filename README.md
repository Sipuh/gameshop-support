# 🎮 GameShop Support

Сайт поддержки и базы знаний для GameShop Wiki. Категории игр, статьи с решениями ошибок, гайды.

---

## 🚀 Быстрый старт (локальная разработка)

```bash
# 1. Установка зависимостей
npm install

# 2. Настройка .env (скопируйте и отредактируйте)
cp .env.example .env

# 3. Инициализация БД (PostgreSQL должен быть запущен)
npx prisma db push

# 4. Заполнение тестовыми данными
npx tsx prisma/seed.ts

# 5. Запуск в режиме разработки
npm run dev
```

---

## 🖥️ Развертывание на VDS (FirstVDS / любой Ubuntu сервер)

### Шаг 1: Купить VDS

Рекомендуемые тарифы на **FirstVDS**:
| Тариф | Цена | Для чего |
|-------|------|----------|
| **Минимальный** (1 vCPU, 2GB RAM) | ~400 ₽/мес | Для одного проекта |
| **Комфортный** (2 vCPU, 4GB RAM) | ~800 ₽/мес | Для нескольких проектов |

**ОС:** Ubuntu 22.04 LTS

### Шаг 2: Подключиться к серверу

```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
```

### Шаг 3: Запустить скрипт установки

```bash
# Скачать скрипт
curl -O https://raw.githubusercontent.com/Sipuh/gameshop-support/main/deploy.sh

# Сделать исполняемым
chmod +x deploy.sh

# Запустить
bash deploy.sh
```

Скрипт сам установит:
- ✅ Node.js 18
- ✅ PostgreSQL
- ✅ Nginx + SSL (Let's Encrypt)
- ✅ PM2 (автозапуск)
- ✅ Клонирует репозиторий
- ✅ Настроит БД и заполнит данными
- ✅ Соберет и запустит проект

### Шаг 4: Настроить домен

После установки пропишите DNS-запись A для вашего домена на IP сервера.

---

## 🔄 Автоматический деплой (CI/CD)

При пуше в ветку `main` GitHub автоматически обновит сайт на сервере.

### Настройка GitHub Secrets

В репозитории → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Значение |
|--------|----------|
| `SSH_PRIVATE_KEY` | Приватный SSH-ключ для подключения к серверу |
| `SERVER_IP` | IP-адрес вашего VDS |
| `SERVER_DOMAIN` | Домен сайта (например, support.gameshop.ru) |

### Как создать SSH-ключ для деплоя:

```bash
# На сервере
ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys

# Показать приватный ключ (скопировать в GitHub Secrets)
cat ~/.ssh/deploy_key
```

---

## 📂 Структура проекта

```
gameshop-support/
├── app/                    # Next.js App Router
│   ├── admin/             # Админ-панель
│   ├── api/               # API роуты
│   │   ├── articles/      # CRUD статей
│   │   ├── auth/          # Авторизация
│   │   ├── categories/    # CRUD категорий
│   │   └── upload/        # Загрузка файлов
│   ├── layout.tsx         # Основной layout
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
├── lib/                   # Утилиты (Prisma client)
├── prisma/                # Prisma schema + seed
├── public/                # Статические файлы
├── .github/workflows/     # GitHub Actions
├── deploy.sh              # Скрипт установки на сервер
└── package.json
```

---

## 🛠️ Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка проекта |
| `npm start` | Запуск в production |
| `npx prisma db push` | Применить миграции БД |
| `npx tsx prisma/seed.ts` | Заполнить БД данными |
| `pm2 logs gameshop-support` | Логи приложения на сервере |
| `pm2 restart gameshop-support` | Перезапуск на сервере |

---

## 🔑 Данные для входа (после seed)

- **Email:** admin@gameshop.ru
- **Пароль:** admin123
- **Админка:** https://ваш-домен/admin

> ⚠️ Обязательно смените пароль после первого входа!