# 🚀 Швидкий старт для сервера

## ✅ Що налаштовано

- `.gitignore` для node_modules, dist, .env, uploads
- `.env.example` з усіма змінними
- `vercel.json` для Vercel
- Документація: `README.md`, `DEPLOY.md`, `ENV_VARIABLES.md`

## 🧪 Локальний запуск

```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Сервер буде доступний на `http://localhost:5000`.

## 🚀 Деплой

Дивіться [DEPLOY.md](./DEPLOY.md)
