const { Admin } = require('../models');
const { decodeAccessToken } = require('../services/auth');

const COOKIE_NAME = 'access_token';

async function getCurrentAdmin(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ detail: 'Требуется авторизация' });
  }
  const payload = decodeAccessToken(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ detail: 'Недействительная сессия' });
  }
  const admin = await Admin.findOne({ where: { username: payload.sub } });
  if (!admin) {
    return res.status(401).json({ detail: 'Пользователь не найден' });
  }
  req.admin = admin;
  next();
}

exports.getCurrentAdmin = getCurrentAdmin;
