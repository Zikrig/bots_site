const { Sequelize } = require('sequelize');
const path = require('path');
const { config } = require('./config');

const isSqlite = config.databaseUrl.startsWith('sqlite');
let sequelize;

if (isSqlite) {
  const storage = path.resolve(__dirname, '..', config.databaseUrl.replace(/^sqlite:\/\//, '').replace(/^\.\//, ''));
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storage,
    logging: false,
  });
} else {
  const s = config.databaseUrl.replace(/^mysql:\/\//, '');
  const atIdx = s.lastIndexOf('@');
  const creds = s.slice(0, atIdx);
  const hostDb = s.slice(atIdx + 1);
  const colonIdx = creds.indexOf(':');
  const user = colonIdx >= 0 ? creds.slice(0, colonIdx) : creds;
  const password = colonIdx >= 0 ? creds.slice(colonIdx + 1) : '';
  const hostPortDb = hostDb.split('/');
  const database = hostPortDb[1] || '';
  const hostPort = hostPortDb[0] || '';
  const hostPortParts = hostPort.includes(':') ? hostPort.split(':') : [hostPort, '3306'];
  const host = hostPortParts[0];
  const port = parseInt(hostPortParts[1], 10) || 3306;
  sequelize = new Sequelize(database, decodeURIComponent(user), decodeURIComponent(password), {
    host: host,
    port: port,
    dialect: 'mysql',
    logging: false,
    dialectOptions: config.databaseUrl.indexOf('ssl') !== -1 ? { ssl: { require: true } } : {},
  });
}

exports.sequelize = sequelize;
module.exports = sequelize;
