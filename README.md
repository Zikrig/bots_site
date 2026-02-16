# Сайт-витрина Telegram-ботов

Сайт для демонстрации типов Telegram-ботов и приёма заявок на обратный звонок. Реализовано по [DESIGN.md](DESIGN.md).

## Стек

- **Backend:** FastAPI, SQLAlchemy 2.0 (async), MySQL (asyncmy)
- **Фронтенд:** Jinja2 + Tailwind CSS + HTMX
- **Аутентификация админов:** JWT в httpOnly cookie

## Быстрый старт

### 1. Окружение

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
```

### 2. Конфигурация

Скопируйте `.env.example` в `.env`. Для быстрого старта можно оставить SQLite по умолчанию (файл `bots_site.db` в корне проекта). Для продакшена укажите MySQL:

```env
# Локально (по умолчанию):
DATABASE_URL=sqlite+aiosqlite:///./bots_site.db

# Или MySQL:
# DATABASE_URL=mysql+asyncmy://user:password@localhost:3306/bots_site
SECRET_KEY=ваш-секретный-ключ
ADMIN_USERNAME=admin
ADMIN_PASSWORD=смените_пароль
```

При первом запуске таблицы создаются автоматически, создаётся админ с логином и паролем из `.env`.

### 3. Запуск

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Сайт: http://localhost:8000  
- Админка: http://localhost:8000/admin (логин/пароль из `.env`)

## API

- `GET /api/v1/products` — список видимых товаров
- `POST /api/v1/leads` — создать заявку (телефон обязателен)
- `POST /api/v1/admin/login` / `POST /api/v1/admin/logout` — вход/выход
- Админские эндпоинты: `/api/v1/admin/products`, `/api/v1/admin/leads` (требуется cookie после логина)

Документация API: http://localhost:8000/docs
