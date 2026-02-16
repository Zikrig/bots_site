import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 24 hours

export function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

export function getPasswordHash(password) {
  return bcrypt.hash(password, 10);
}

export function createAccessToken(data) {
  return jwt.sign(
    { ...data, exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRE_MINUTES * 60 },
    config.secretKey,
    { algorithm: ALGORITHM }
  );
}

export function decodeAccessToken(token) {
  try {
    return jwt.verify(token, config.secretKey, { algorithms: [ALGORITHM] });
  } catch {
    return null;
  }
}
