import 'dotenv/config';

// Node uses "mysql://", Python had "mysql+asyncmy://"
const databaseUrl = (process.env.DATABASE_URL || 'sqlite://./bots_site.db')
  .replace(/^mysql\+asyncmy:\/\//, 'mysql://');

export const config = {
  databaseUrl,
  secretKey: process.env.SECRET_KEY || 'dev-secret-change-in-production',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'change_me',
  leadRateLimitPerDay: parseInt(process.env.LEAD_RATE_LIMIT_PER_DAY || '10', 10),
  loginAttemptsLimit: parseInt(process.env.LOGIN_ATTEMPTS_LIMIT || '5', 10),
  loginAttemptsWindowMinutes: parseInt(process.env.LOGIN_ATTEMPTS_WINDOW_MINUTES || '15', 10),
};
