import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',
  bypassWindows: process.env.BYPASS_TIME_WINDOWS === '1',
  uploadDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads'),
  smtp: { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
          user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD,
          from: process.env.MAIL_FROM || 'no-reply@example.com' },
  razorpay: { keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET },
};
