import crypto from 'node:crypto';
import { config } from '../config.js';
import { Otp } from '../models.js';
import { sendEmail, sendSms } from './mailer.js';

export const OTP_TTL_MIN = 10;
export const OTP_MAX_ATTEMPTS = 5;
const hash = (code) => crypto.createHash('sha256').update(code + config.jwtSecret).digest('hex');

/** Creates an OTP, sends it via email/sms, returns the challenge id. */
export async function issueOtp(user, purpose, channel, payload = {}) {
  const code = String(crypto.randomInt(1_000_000)).padStart(6, '0');
  await Otp.updateMany({ user: user._id, purpose, used: false }, { used: true });
  const otp = await Otp.create({ user: user._id, purpose, codeHash: hash(code), payload,
    expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000) });
  const msg = `Your verification code is ${code}. It expires in ${OTP_TTL_MIN} minutes.`;
  if (channel === 'email') await sendEmail(user.email, 'Your verification code', msg);
  else await sendSms(user.phone, msg);
  return otp._id;
}

/** Returns the Otp doc on success, or {error}. */
export async function checkOtp(challengeId, code) {
  const otp = await Otp.findById(challengeId).catch(() => null);
  if (!otp || otp.used || otp.expiresAt < new Date() || otp.attempts >= OTP_MAX_ATTEMPTS)
    return { error: 'Code expired or too many attempts. Please start again.' };
  await Otp.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
  const a = Buffer.from(hash(String(code || '').trim())), b = Buffer.from(otp.codeHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { error: 'Incorrect code.' };
  await Otp.updateOne({ _id: otp._id }, { used: true });
  return { otp };
}
