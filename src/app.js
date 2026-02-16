require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressEjsLayouts = require('express-ejs-layouts');

const { config } = require('./config');
const { sequelize } = require('./database');
const { Admin, Product } = require('./models');
const { getPasswordHash } = require('./services/auth');
const { router: productsRouter, routerAdmin: productsAdminRouter } = require('./routes/products');
const { router: leadsRouter, routerAdmin: leadsAdminRouter } = require('./routes/leads');
const { router: adminRouter } = require('./routes/admin');

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

app.use('/api/v1', productsRouter);
app.use('/api/v1', productsAdminRouter);
app.use('/api/v1', leadsRouter);
app.use('/api/v1', leadsAdminRouter);
app.use('/api/v1', adminRouter);

app.get('/', async function (req, res) {
  const products = await Product.findAll({
    where: { is_visible: true },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
  });
  res.render('index', {
    products: products.map(function (p) { return p.toJSON(); }),
    title: 'Telegram-боты под заказ — каталог и заявка',
  });
});

app.get('/admin', function (req, res) {
  res.redirect(302, '/admin/login');
});
app.get('/admin/login', function (req, res) {
  res.render('admin/login', { layout: 'layouts/admin-login', title: 'Вход — Админка' });
});
app.get('/admin/dashboard', function (req, res) {
  res.render('admin/dashboard', { layout: 'layouts/admin-base', title: 'Дашборд — Админка' });
});
app.get('/admin/products', function (req, res) {
  res.render('admin/products', { layout: 'layouts/admin-base', title: 'Товары — Админка' });
});
app.get('/admin/leads', function (req, res) {
  res.render('admin/leads', { layout: 'layouts/admin-base', title: 'Заявки — Админка' });
});

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
    app.listen(PORT, function () {
      console.log('Сервер: http://localhost:' + PORT);
    });
  } catch (err) {
    console.error('Ошибка запуска:', err);
    process.exit(1);
  }
}

start();
