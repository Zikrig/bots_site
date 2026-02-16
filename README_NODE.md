# Боты — витрина Telegram-ботов (Node.js)

Версия проекта на **Node.js** (Express, Sequelize, EJS). API и страницы соответствуют Python-версии.

## Требования

- Node.js 18+
- MySQL (или SQLite для локальной разработки)

## Установка

```bash
npm install
```

## Переменные окружения (.env)

Используется тот же `.env`, что и для Python. URL БД автоматически преобразуется:

- `mysql+asyncmy://...` → для Node используется как `mysql://...`
- Для локальной разработки без MySQL: `DATABASE_URL=sqlite://./bots_site.db` (нужен пакет `sqlite3`: `npm install sqlite3`)

Остальные переменные без изменений:

- `SECRET_KEY` — ключ для JWT
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — логин и пароль первого админа (создаётся при первом запуске)
- `LEAD_RATE_LIMIT_PER_DAY`, `LOGIN_ATTEMPTS_LIMIT`, `LOGIN_ATTEMPTS_WINDOW_MINUTES` — лимиты

## Запуск

```bash
npm start
```

Режим разработки с автоперезагрузкой:

```bash
npm run dev
```

По умолчанию сервер слушает порт 3000 (или `PORT` из .env).

## Если MySQL выдаёт ошибку аутентификации

Ошибка вида `auth_gssapi_client` или `unknown plugin` связана с настройкой пользователя MySQL на сервере. На хостинге нужно сменить метод аутентификации пользователя на `mysql_native_password`, либо использовать локально SQLite:

```env
DATABASE_URL=sqlite://./bots_site.db
```

и установить: `npm install sqlite3`.

## Структура (Node)

- `src/app.js` — точка входа, Express, маршруты страниц и API
- `src/config.js` — настройки из .env
- `src/database.js` — Sequelize (MySQL/SQLite)
- `src/models/` — Admin, Product, Lead
- `src/routes/` — products, leads, admin (API)
- `src/middleware/` — auth (JWT из cookie), rateLimit (лимиты заявок и входа)
- `src/services/auth.js` — bcrypt, JWT
- `src/views/` — EJS-шаблоны (главная, админка)

API совместим с фронтом из Python-версии: те же пути и форматы ответов.
