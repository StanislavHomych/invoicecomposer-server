# Змінні оточення (.env) - Повний список

## ✅ ОБОВ'ЯЗКОВІ змінні:

### 1. DATABASE_URL (обов'язково!)
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### 2. JWT_SECRET (обов'язково для безпеки!)
```env
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
```
**Важливо:** Використовуйте довгий випадковий рядок (мінімум 32 символи). Для генерації:
```bash
openssl rand -base64 32
```

### 3. JWT_REFRESH_SECRET (обов'язково для безпеки!)
```env
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-characters-long"
```
**Важливо:** Має бути інший, ніж JWT_SECRET!

---

## ⚙️ ОПЦІОНАЛЬНІ змінні (мають значення за замовчуванням):

### JWT налаштування (опціонально):
```env
JWT_EXPIRES_IN="15m"                    # Термін дії access token (за замовчуванням: 15m)
JWT_REFRESH_EXPIRES_IN="7d"             # Термін дії refresh token (за замовчуванням: 7d)
```

### Server налаштування (опціонально):
```env
PORT=5000                                # Порт сервера (за замовчуванням: 5000)
NODE_ENV=development                     # Режим: development/production
```

### CORS налаштування (опціонально):
```env
CORS_ORIGIN="http://localhost:5173"     # URL фронтенду (за замовчуванням: http://localhost:5173)
```

### Storage налаштування (опціонально):
```env
STORAGE_TYPE="local"                    # Тип сховища: local або s3 (за замовчуванням: local)
STORAGE_PATH="./uploads"                # Шлях для локального сховища (за замовчуванням: ./uploads)
```

---

## 📝 Мінімальний .env файл (щоб працювало):

```env
# Обов'язкові
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
```

Все інше має значення за замовчуванням і працюватиме без додавання.

---

## 🔒 Безпека JWT секретів:

**НЕ використовуйте значення за замовчуванням в production!**

Для генерації безпечних секретів:
```bash
# Генерація JWT_SECRET
openssl rand -base64 32

# Генерація JWT_REFRESH_SECRET (інший!)
openssl rand -base64 32
```

Або використайте онлайн генератор: https://randomkeygen.com/

---

## ✅ Приклад повного .env файлу:

```env
# Database - Neon Serverless Postgres
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# JWT (ОБОВ'ЯЗКОВО змінити в production!)
JWT_SECRET="invoice-builder-jwt-secret-min-32-chars-long-random-string"
JWT_REFRESH_SECRET="invoice-builder-refresh-secret-min-32-chars-long-random-string"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"

# Storage
STORAGE_TYPE="local"
STORAGE_PATH="./uploads"
```

---

## 🚨 Що буде якщо не вказати JWT секрети?

Код використає значення за замовчуванням:
- `JWT_SECRET="secret"`
- `JWT_REFRESH_SECRET="refresh-secret"`

**Це НЕБЕЗПЕЧНО для production!** Але для розробки/тестування працюватиме.
