# Налаштування окремого репозиторію для сервера

## 📋 Крок 1: Ініціалізація Git (якщо потрібно)

```bash
cd server
git init
git add .
git commit -m "Initial commit: Invoice Composer Server"
```

## 📋 Крок 2: Підключення до GitHub

```bash
# HTTPS
git remote add origin https://github.com/StanislavHomych/invoicecomposer-server.git

# або SSH
git remote add origin git@github.com:StanislavHomych/invoicecomposer-server.git

git remote -v
```

## 📋 Крок 3: Push

```bash
git branch -M main
git push -u origin main
```
