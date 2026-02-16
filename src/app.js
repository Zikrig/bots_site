import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import expressEjsLayouts from 'express-ejs-layouts';

import { config } from './config.js';
import { sequelize } from './database.js';
import { Admin, Product } from './models/index.js';
import { getPasswordHash } from './services/auth.js';
import { router as productsRouter, routerAdmin as productsAdminRouter } from './routes/products.js';
import { router as leadsRouter, routerAdmin as leadsAdminRouter } from './routes/leads.js';
import { router as adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressEjsLayouts);
app.set('layout', 'layouts/base');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);

// API v1
app.use('/api/v1', productsRouter);
app.use('/api/v1', productsAdminRouter);
app.use('/api/v1', leadsRouter);
app.use('/api/v1', leadsAdminRouter);
app.use('/api/v1', adminRouter);

// Pages
app.get('/', async (req, res) => {
  const products = await Product.findAll({
    where: { is_visible: true },
    order: [
      ['sort_order', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  res.render('index', { products: products.map(p => p.toJSON()), title: 'Telegram-боты под заказ — каталог и заявка' });
});

app.get('/admin', (req, res) => res.redirect(302, '/admin/login'));
app.get('/admin/login', (req, res) => res.render('admin/login', { layout: 'layouts/admin-login', title: 'Вход — Админка' }));
app.get('/admin/dashboard', (req, res) => res.render('admin/dashboard', { layout: 'layouts/admin-base', title: 'Дашборд — Админка' }));
app.get('/admin/products', (req, res) => res.render('admin/products', { layout: 'layouts/admin-base', title: 'Товары — Админка' }));
app.get('/admin/leads', (req, res) => res.render('admin/leads', { layout: 'layouts/admin-base', title: 'Заявки — Админка' }));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    const count = await Admin.count();
    if (count === 0) {
      const hash = await getPasswordHash(config.adminPassword);
      await Admin.create({ username: config.adminUsername, password_hash: hash });
      console.log('Создан администратор по умолчанию:', config.adminUsername);
    }
    app.listen(PORT, () => {
      console.log(`Сервер: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Ошибка запуска:', err);
    process.exit(1);
  }
}

start();
