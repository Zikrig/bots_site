import { Sequelize } from 'sequelize';
import { config } from './config.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isSqlite = config.databaseUrl.startsWith('sqlite');
let sequelize;

if (isSqlite) {
  const storage = path.resolve(__dirname, '..', config.databaseUrl.replace(/^sqlite:\/\//, '').replace(/^\.\//, ''));
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
  });
} else {
  // Parse mysql://user:password@host:port/database (password may contain : and @)
  const s = config.databaseUrl.replace(/^mysql:\/\//, '');
  const atIdx = s.lastIndexOf('@');
  const creds = s.slice(0, atIdx);
  const hostDb = s.slice(atIdx + 1);
  const colonIdx = creds.indexOf(':');
  const user = colonIdx >= 0 ? creds.slice(0, colonIdx) : creds;
  const password = colonIdx >= 0 ? creds.slice(colonIdx + 1) : '';
  const [hostPort, database] = hostDb.split('/');
  const [host, port] = hostPort.includes(':') ? hostPort.split(':') : [hostPort, '3306'];
  sequelize = new Sequelize(database, decodeURIComponent(user), decodeURIComponent(password), {
    host,
    port: parseInt(port, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: config.databaseUrl.includes('ssl') ? { ssl: { require: true } } : {},
  });
}

export { sequelize };
export default sequelize;
