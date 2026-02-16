require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const { config } = require('./config');
const { sequelize } = require('./database');
const { Admin } = require('./models');
const { getPasswordHash } = require('./services/auth');
const { router: productsRouter, routerAdmin: productsAdminRouter } = require('./routes/products');
const { router: leadsRouter, routerAdmin: leadsAdminRouter } = require('./routes/leads');
const { router: adminRouter } = require('./routes/admin');

const app = express();
const publicDir = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('trust proxy', 1);

// API
app.use('/api/v1', productsRouter);
app.use('/api/v1', productsAdminRouter);
app.use('/api/v1', leadsRouter);
app.use('/api/v1', leadsAdminRouter);
app.use('/api/v1', adminRouter);

// Статика: главная и файлы из public
app.use(express.static(publicDir));

// Чистые URL админки — отдаём статические HTML
app.get('/admin', function (req, res) {
  res.redirect(302, '/admin/login');
});
app.get('/admin/login', function (req, res) {
  res.sendFile(path.join(publicDir, 'admin', 'login.html'));
});
app.get('/admin/dashboard', function (req, res) {
  res.sendFile(path.join(publicDir, 'admin', 'dashboard.html'));
});
app.get('/admin/products', function (req, res) {
  res.sendFile(path.join(publicDir, 'admin', 'products.html'));
});
app.get('/admin/leads', function (req, res) {
  res.sendFile(path.join(publicDir, 'admin', 'leads.html'));
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
      console.log('Фронт: статика из public/');
    });
  } catch (err) {
    console.error('Ошибка запуска:', err);
    process.exit(1);
  }
}

start();
