const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { config } = require('../config');

const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 24 hours

function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

function getPasswordHash(password) {
  return bcrypt.hash(password, 10);
}

function createAccessToken(data) {
  const payload = Object.assign({}, data, {
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRE_MINUTES * 60,
  });
  return jwt.sign(payload, config.secretKey, { algorithm: ALGORITHM });
}

function decodeAccessToken(token) {
  try {
    return jwt.verify(token, config.secretKey, { algorithms: [ALGORITHM] });
  } catch (err) {
    return null;
  }
}

exports.verifyPassword = verifyPassword;
exports.getPasswordHash = getPasswordHash;
exports.createAccessToken = createAccessToken;
exports.decodeAccessToken = decodeAccessToken;
