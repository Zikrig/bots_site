import { Admin } from '../models/index.js';
import { decodeAccessToken } from '../services/auth.js';

const COOKIE_NAME = 'access_token';

export async function getCurrentAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ detail: 'Требуется авторизация' });
  }
  const payload = decodeAccessToken(token);
  if (!payload?.sub) {
    return res.status(401).json({ detail: 'Недействительная сессия' });
  }
  const admin = await Admin.findOne({ where: { username: payload.sub } });
  if (!admin) {
    return res.status(401).json({ detail: 'Пользователь не найден' });
  }
  req.admin = admin;
  next();
}
