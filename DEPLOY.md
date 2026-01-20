# Інструкція для деплою сервера на Vercel

## 📋 Передумови

1. Репозиторій сервера є на GitHub
2. Всі зміни закомічені та запушені
3. Є база даних (PostgreSQL) і доступні credentials

## 🚀 Крок 1: Підготовка

Переконайтеся, що в репозиторії є:

```
server/
├── api/
│   └── index.ts
├── src/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── vercel.json
└── .env.example
```

## 🚀 Крок 2: Створіть проект на Vercel

1. Перейдіть на https://vercel.com
2. Імпортуйте GitHub репозиторій
3. Framework Preset: **Other**
4. Root Directory: залиште порожнім
5. Build/Output залиште порожніми (використається `vercel.json`)

## 🔧 Крок 3: Environment Variables

Додайте обов'язкові змінні (див. також `ENV_VARIABLES.md`):

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=your_super_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
NODE_ENV=production
```

Для окремого клієнта:

```
CORS_ORIGIN=https://your-client-app.vercel.app
```

## 🗃️ Крок 4: Міграції бази даних

Запустіть міграції з локального комп'ютера (або CI), використовуючи production DATABASE_URL:

```bash
npx prisma migrate deploy
```

## ✅ Крок 5: Deploy

Натисніть **Deploy** у Vercel. Після деплою перевірте:

- `https://your-server-app.vercel.app/health`
- `https://your-server-app.vercel.app/api/auth/login`

## 📝 Примітки

- `vercel.json` налаштовує роутинг на `/api/index.ts`
- Для `uploads` використовується локальне сховище (`STORAGE_PATH=./uploads`)
- Якщо використовуєте S3, додайте S3 змінні з `ENV_VARIABLES.md`
