import express from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { config } from '../config.js';
import { Payment, User } from '../models.js';
import { ah } from '../utils/ah.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { inWindow } from '../utils/time.js';
import { PLANS, effectivePlan } from '../utils/rules.js';
import { sendEmail } from '../utils/mailer.js';
import { publicUser } from './auth.js';

const r = express.Router();
const live = () => !!(config.razorpay.keyId && config.razorpay.keySecret);
const sign = (orderId, paymentId) =>
  crypto.createHmac('sha256', config.razorpay.keySecret || config.jwtSecret).update(`${orderId}|${paymentId}`).digest('hex');
const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const paymentsOpen = () => inWindow(10, 11, new Date(), config.bypassWindows);

r.get('/plans', optionalAuth, (req, res) =>
  res.json({ plans: PLANS, active: req.user ? effectivePlan(req.user) : null, openNow: paymentsOpen() }));

r.post('/payments/order', auth, ah(async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan] || plan === 'free') return res.status(404).json({ error: 'Unknown plan.' });
  if (!paymentsOpen()) return res.status(403).json({ error: 'Payments are accepted only between 10:00 AM and 11:00 AM IST.' });
  const price = PLANS[plan].price;
  let orderId;
  if (live()) {
    const rz = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
    orderId = (await rz.orders.create({ amount: price * 100, currency: 'INR', receipt: `u${req.user._id}`.slice(0, 40) })).id;
  } else orderId = 'order_mock_' + crypto.randomBytes(6).toString('hex');
  await Payment.create({ user: req.user._id, plan, amount: price, orderId });
  let mock = null;
  if (!live()) { const paymentId = 'pay_mock_' + crypto.randomBytes(6).toString('hex'); mock = { paymentId, signature: sign(orderId, paymentId) }; }
  res.json({ orderId, amount: price * 100, keyId: config.razorpay.keyId || null, mock });
}));

r.post('/payments/verify', auth, ah(async (req, res) => {
  const { orderId = '', paymentId = '', signature = '' } = req.body;
  const pay = await Payment.findOne({ orderId, user: req.user._id, status: 'created' });
  if (!pay || !safeEq(sign(orderId, paymentId), String(signature)))
    return res.status(400).json({ error: 'Payment verification failed.' });
  if (!(await Payment.findOneAndUpdate({ _id: pay._id, status: 'created' }, { status: 'paid', paymentId })))
    return res.status(409).json({ error: 'Payment already processed.' });
  const expires = new Date(Date.now() + 30 * 864e5);
  const user = await User.findByIdAndUpdate(req.user._id, { plan: pay.plan, planExpires: expires }, { new: true });
  const p = PLANS[pay.plan];
  await sendEmail(user.email, `Invoice - ${p.name} plan`, [
    'INVOICE', `Invoice no: INV-${String(pay._id).slice(-6).toUpperCase()}`, `Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
    `Billed to: ${user.username} <${user.email}>`, `Plan: ${p.name}`, `Questions per day: ${p.limit ?? 'Unlimited'}`,
    `Amount paid: INR ${p.price}`, `Order id: ${orderId}`, `Payment id: ${paymentId}`, `Valid until: ${expires.toISOString().slice(0, 10)}`].join('\n'));
  res.json({ user: publicUser(user), message: `${p.name} plan activated. Invoice emailed to ${user.email}.` });
}));

export default r;
