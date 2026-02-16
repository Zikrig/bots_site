# Боты — версия на PHP (без Node и портов)

Всё работает через веб-сервер (Apache/nginx + PHP): один сайт на 80/443, без отдельного процесса и порта.

## Что есть

- **Статика** в `public/`: главная, форма заявки, админка (логин, дашборд, товары, заявки).
- **API** в `api.php`: тот же JSON-API (`/api/v1/products`, `/api/v1/leads`, `/api/v1/admin/*`), что и в Node-версии.
- **Авторизация админки** через PHP-сессию (cookie `PHPSESSID`).
- **БД**: те же таблицы `admins`, `products`, `leads`. Таблицы создаются при первом запросе к API, админ по умолчанию — из `.env`.

## Требования

- PHP 7.4+ (лучше 8.x) с расширениями: `pdo_mysql`, `json`, `session`
- Apache с `mod_rewrite` или nginx с соответствующими правилами
- MySQL (тот же `DATABASE_URL` из `.env`)

## Установка на хостинге (Рег.ру и др.)

1. **Корень сайта** — каталог проекта (там, где лежат `api.php`, `public/`, `php/`, `.htaccess`).  
   Если хостинг позволяет указать только папку `public/` как корень — используйте её; в `public/` лежит свой `.htaccess` для URL вида `/admin/login` без `.html`.

2. **Файл `.env`** в корне проекта (как и раньше):
   ```env
   DATABASE_URL=mysql+asyncmy://user:password@localhost:3306/dbname
   SECRET_KEY=...
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=...
   ```

3. Для **Apache** достаточно `.htaccess` из репозитория:
   - запросы к `/api/v1/*` уходят в `api.php`;
   - `/` → `public/index.html`;
   - `/admin/login`, `/admin/dashboard` и т.д. → соответствующие HTML из `public/admin/`.

4. Для **nginx** добавьте в конфиг сайта что-то вроде:
   ```nginx
   location /api/v1/ {
       try_files $uri /api.php?path=$uri;
       fastcgi_pass php;  # или unix:/var/run/php/php8.1-fpm.sock;
       include fastcgi_params;
       fastcgi_param SCRIPT_FILENAME $document_root/api.php;
       fastcgi_param QUERY_STRING path=${uri#/api/v1/};
   }
   location / {
       try_files $uri $uri/ /public/index.html;
   }
   location /admin/login { alias /путь/к/проекту/public/admin/login.html; }
   location /admin/dashboard { alias /путь/к/проекту/public/admin/dashboard.html; }
   location /admin/products { alias /путь/к/проекту/public/admin/products.html; }
   location /admin/leads { alias /путь/к/проекту/public/admin/leads.html; }
   location = /admin { return 302 /admin/login; }
   ```
   (пути и параметр `path` можно подстроить под ваш конфиг.)

## Как пользоваться

- Открыть в браузере главную страницу сайта (например `https://ваш-домен.ru/`).
- Админка: `https://ваш-домен.ru/admin/login` (логин/пароль из `ADMIN_USERNAME` / `ADMIN_PASSWORD`).
- Никакого Node, никаких портов — только веб-сервер и PHP.

## Структура (PHP)

- `api.php` — единственная точка входа для API, роутинг по пути и методу.
- `php/config.php` — чтение `.env`, конфиг (БД, секреты, лимиты).
- `php/db.php` — подключение PDO, создание таблиц и админа по умолчанию.
- `.htaccess` — правила для Apache (перевод `/api/v1/*` в `api.php`, раздача статики из `public/`).

Лимиты заявок и попыток входа из `.env` в этой версии не используются (можно добавить при необходимости).
