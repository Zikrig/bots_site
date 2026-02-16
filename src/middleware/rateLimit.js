import { config } from '../config.js';

const leadIps = new Map(); // ip -> [timestamps]
const loginAttempts = new Map();

const DAY_MS = 24 * 60 * 60 * 1000;

function cleanOld(entries, windowMs) {
  const cutoff = Date.now() - windowMs;
  while (entries.length && entries[0] < cutoff) entries.shift();
}

export function getClientIp(req) {
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

export function checkLeadRateLimit(req, res, next) {
  const ip = getClientIp(req);
  if (!leadIps.has(ip)) leadIps.set(ip, []);
  const entries = leadIps.get(ip);
  cleanOld(entries, DAY_MS);
  if (entries.length >= config.leadRateLimitPerDay) {
    return res.status(429).json({ detail: 'Превышен лимит заявок. Попробуйте завтра.' });
  }
  entries.push(Date.now());
  next();
}

export function checkLoginRateLimit(req, res, next) {
  const ip = getClientIp(req);
  if (!loginAttempts.has(ip)) loginAttempts.set(ip, []);
  const entries = loginAttempts.get(ip);
  const windowMs = config.loginAttemptsWindowMinutes * 60 * 1000;
  cleanOld(entries, windowMs);
  if (entries.length >= config.loginAttemptsLimit) {
    return res.status(429).json({ detail: 'Слишком много попыток входа. Подождите 15 минут.' });
  }
  entries.push(Date.now());
  next();
}
