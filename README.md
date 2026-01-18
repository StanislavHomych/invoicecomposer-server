# Invoice Composer - Server

Backend API для Invoice Composer.

## 🚀 Швидкий старт

### Встановлення

```bash
npm install
```

### Налаштування бази даних

1. Створіть `.env` файл:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=your_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
NODE_ENV=development
```

2. Застосуйте міграції:

```bash
npx prisma migrate dev
```

3. (Опціонально) Заповніть тестові дані:

```bash
npm run prisma:seed
```

### Розробка

```bash
npm run dev
```

Сервер буде доступний на `http://localhost:5000`

### Білд

```bash
npm run build
```

### Запуск production

```bash
npm start
```

## 📦 Деплой на Vercel

Детальні інструкції дивіться в [DEPLOYMENT_STEPS.md](../DEPLOYMENT_STEPS.md) або [SERVER_DEPLOY.md](../SERVER_DEPLOY.md)

### Швидкий деплой

1. Пуште код в GitHub репозиторій
2. Імпортуйте проект в Vercel
3. Додайте environment variables (дивіться нижче)
4. Застосуйте міграції бази даних
5. Deploy!

## 🔧 Environment Variables

### Обов'язкові

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=your_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
NODE_ENV=production
```

### Для окремого деплою (клієнт на іншому домені)

```
CORS_ORIGIN=https://your-client-app.vercel.app
```

### Опціональні

```
BASE_URL=https://your-server-app.vercel.app
STORAGE_TYPE=local
STORAGE_PATH=./uploads
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## 📁 Структура проекту

```
server/
├── api/
│   └── index.ts      # Vercel serverless handler
├── src/
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Express middleware
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── utils/        # Утиліти
│   ├── validators/   # Request validation
│   └── app.ts        # Express app
├── prisma/
│   ├── schema.prisma # Database schema
│   └── migrations/   # Database migrations
└── vercel.json       # Vercel конфігурація
```

## 🛠️ Технології

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

## 📝 API Endpoints

- `POST /api/auth/register` - Реєстрація
- `POST /api/auth/login` - Вхід
- `GET /api/company` - Отримати компанію
- `PUT /api/company` - Оновити компанію
- `GET /api/clients` - Список клієнтів
- `POST /api/clients` - Створити клієнта
- `GET /api/invoices` - Список інвойсів
- `POST /api/invoices` - Створити інвойс
- `GET /health` - Health check
- `GET /sitemap.xml` - Sitemap
- `GET /rss.xml` - RSS feed
