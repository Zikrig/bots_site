import { Router } from 'express';
import { Admin } from '../models/index.js';
import { getCurrentAdmin } from '../middleware/auth.js';
import { verifyPassword, getPasswordHash, createAccessToken } from '../services/auth.js';
import { checkLoginRateLimit } from '../middleware/rateLimit.js';

const router = Router();
const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

// Login
router.post('/admin/login', checkLoginRateLimit, async (req, res) => {
  const { username, password } = req.body;
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

// Logout
router.post('/admin/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// Me
router.get('/admin/me', getCurrentAdmin, (req, res) => {
  res.json({ id: req.admin.id, username: req.admin.username });
});

export { router };
