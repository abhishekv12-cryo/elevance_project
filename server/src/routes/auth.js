import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User, LoginHistory, ForgotRequest } from '../models.js';
import { ah } from '../utils/ah.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { parseClient } from '../utils/ua.js';
import { inWindow, istDay } from '../utils/time.js';
import { effectivePlan, generatePassword } from '../utils/rules.js';
import { issueOtp, checkOtp } from '../utils/otp.js';
import { sendEmail, sendSms } from '../utils/mailer.js';

const r = express.Router();
const normPhone = (p = '') => String(p).replace(/[\s-]/g, '');
export const publicUser = (u) => ({ id: u._id, username: u.username, email: u.email, points: u.points,
  plan: effectivePlan(u), planExpires: u.planExpires, lang: u.lang });

async function finishLogin(res, user, info) {
  await LoginHistory.create({ user: user._id, ...info, status: 'success' });
  res.cookie('token', jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '7d' }),
    { httpOnly: true, sameSite: 'lax', secure: config.isProd, maxAge: 7 * 864e5 });
  res.json({ user: publicUser(user) });
}

r.post('/register', ah(async (req, res) => {
  const { username = '', email = '', password = '' } = req.body;
  const phone = normPhone(req.body.phone);
  if (!/^\w{3,30}$/.test(username.trim()) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
      || !/^\+?\d{10,15}$/.test(phone) || String(password).length < 8)
    return res.status(400).json({ error: 'Invalid input (username 3-30 chars, valid email, phone 10-15 digits, password 8+).' });
  try {
    await User.create({ username: username.trim(), email: email.trim(), phone, passwordHash: await bcrypt.hash(password, 10) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Username, email or phone already exists.' });
    throw e;
  }
  res.status(201).json({ ok: true });
}));

r.post('/login', ah(async (req, res) => {
  const ident = String(req.body.username || '').trim();
  const user = await User.findOne({ $or: [{ username: ident }, { email: ident.toLowerCase() }] });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash)))
    return res.status(401).json({ error: 'Invalid credentials.' });
  const info = { ...parseClient(req.get('user-agent'), req.body.deviceHint), ip: req.ip };
  // Rule: mobile devices may only log in between 10:00 AM and 1:00 PM IST
  if (info.device === 'Mobile' && !inWindow(10, 13, new Date(), config.bypassWindows)) {
    await LoginHistory.create({ user: user._id, ...info, status: 'denied: outside mobile window' });
    return res.status(403).json({ error: 'Mobile login is allowed only between 10:00 AM and 1:00 PM IST.' });
  }
  // Rule: Microsoft browser -> no extra auth; Chrome (and other browsers) -> email OTP
  if (info.browser === 'Microsoft Edge') return finishLogin(res, user, info);
  const challengeId = await issueOtp(user, 'login', 'email', { info });
  res.json({ otpRequired: true, challengeId, channel: 'email' });
}));

r.post('/verify-otp', optionalAuth, ah(async (req, res) => {
  const { otp, error } = await checkOtp(req.body.challengeId, req.body.code);
  if (error) return res.status(400).json({ error });
  if (otp.purpose === 'login') {
    const user = await User.findById(otp.user);
    return finishLogin(res, user, otp.payload.info);
  }
  if (!req.user || !req.user._id.equals(otp.user)) return res.status(401).json({ error: 'Please log in first.' });
  req.user.lang = otp.payload.lang;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}));

r.post('/logout', (_req, res) => res.clearCookie('token').json({ ok: true }));
r.get('/me', optionalAuth, (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));

r.post('/forgot-password', ah(async (req, res) => {
  const ident = String(req.body.identifier || '').trim();
  const byEmail = ident.includes('@');
  const user = await User.findOne(byEmail ? { email: ident.toLowerCase() } : { phone: normPhone(ident) });
  if (user) {
    try { await ForgotRequest.create({ user: user._id, day: istDay() }); } // unique (user, day) => once per day
    catch (e) {
      if (e.code === 11000) return res.status(429).json({ error: 'You can use this option only one time per day.' });
      throw e;
    }
    const pw = generatePassword();
    await User.updateOne({ _id: user._id }, { passwordHash: await bcrypt.hash(pw, 10) });
    const text = `Your new password is: ${pw}\nPlease log in and change it.`;
    if (byEmail) await sendEmail(user.email, 'Your new password', text); else await sendSms(user.phone, text);
  }
  res.json({ message: 'If the account exists, a new password has been sent.' });
}));

export default r;
