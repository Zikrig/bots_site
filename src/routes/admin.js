const { Router } = require('express');
const { Admin } = require('../models');
const { getCurrentAdmin } = require('../middleware/auth');
const { verifyPassword, createAccessToken } = require('../services/auth');
const { checkLoginRateLimit } = require('../middleware/rateLimit');

const router = Router();
const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

router.post('/admin/login', checkLoginRateLimit, async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    return res.status(401).json({ detail: 'Неверный логин или пароль' });
  }
  const admin = await Admin.findOne({ where: { username: String(username).trim() } });
  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return res.status(401).json({ detail: 'Неверный логин или пароль' });
  }
  const token = createAccessToken({ sub: admin.username });
  res.cookie(COOKIE_NAME, token, {
    maxAge: COOKIE_MAX_AGE * 1000,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  res.json({ id: admin.id, username: admin.username });
});

router.post('/admin/logout', function (req, res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

router.get('/admin/me', getCurrentAdmin, function (req, res) {
  res.json({ id: req.admin.id, username: req.admin.username });
});

exports.router = router;
