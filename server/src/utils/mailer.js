import nodemailer from 'nodemailer';
import { config } from '../config.js';

export const outbox = []; // last messages (handy in dev)
const push = (m) => { outbox.push(m); if (outbox.length > 100) outbox.shift(); };
const transport = config.smtp.host
  ? nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined })
  : null;

export async function sendEmail(to, subject, text) {
  push({ kind: 'email', to, subject, text });
  if (transport) await transport.sendMail({ from: config.smtp.from, to, subject, text });
  else console.warn(`[DEV EMAIL] to=${to} subject=${subject}\n${text}\n`);
}

export async function sendSms(to, text) {
  // Plug in Twilio / MSG91 / AWS SNS here for production.
  push({ kind: 'sms', to, text });
  console.warn(`[DEV SMS] to=${to} ${text}`);
}
