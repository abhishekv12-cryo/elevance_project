import express from 'express';
import { User, LoginHistory, Friendship, PointTransfer } from '../models.js';
import { ah } from '../utils/ah.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { issueOtp } from '../utils/otp.js';
import { LANGS, TRANSFER_MIN_BALANCE, effectivePlan } from '../utils/rules.js';

const r = express.Router();
export const friendCount = (id) =>
  Friendship.countDocuments({ status: 'accepted', $or: [{ from: id }, { to: id }] });

// Change language: French -> OTP to email, every other language -> OTP to registered mobile (SMS)
r.post('/language', auth, ah(async (req, res) => {
  const { lang } = req.body;
  if (!LANGS.includes(lang)) return res.status(400).json({ error: 'Unsupported language.' });
  if (lang === req.user.lang) return res.json({ unchanged: true });
  const channel = lang === 'fr' ? 'email' : 'sms';
  const challengeId = await issueOtp(req.user, 'language', channel, { lang });
  res.json({ otpRequired: true, challengeId, channel });
}));

r.get('/', ah(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ users: [] });
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  res.json({ users: await User.find({ username: new RegExp(esc, 'i') }).select('username points').limit(30).lean() });
}));

r.get('/:username', optionalAuth, ah(async (req, res) => {
  const u = await User.findOne({ username: req.params.username }).lean();
  if (!u) return res.status(404).json({ error: 'User not found.' });
  const own = !!req.user && req.user._id.equals(u._id);
  const out = { username: u.username, points: u.points, plan: effectivePlan(u), friends: await friendCount(u._id), own };
  if (own) {
    out.history = await LoginHistory.find({ user: u._id }).sort({ _id: -1 }).limit(50).lean();
    out.requests = (await Friendship.find({ to: u._id, status: 'pending' }).populate('from', 'username').lean())
      .map((f) => f.from.username);
  } else if (req.user) {
    out.relation = (await Friendship.findOne({ $or: [{ from: req.user._id, to: u._id }, { from: u._id, to: req.user._id }] }).lean())?.status || null;
  }
  res.json(out);
}));

r.post('/:username/transfer', auth, ah(async (req, res) => {
  const amount = Number(req.body.amount);
  const target = await User.findOne({ username: req.params.username });
  if (!target || target._id.equals(req.user._id)) return res.status(400).json({ error: 'Invalid recipient.' });
  if (!Number.isInteger(amount) || amount < 1) return res.status(400).json({ error: 'Invalid amount.' });
  // atomic debit: sender must hold MORE than 10 points and at least `amount`
  const debited = await User.findOneAndUpdate(
    { _id: req.user._id, points: { $gt: TRANSFER_MIN_BALANCE, $gte: amount } },
    { $inc: { points: -amount } }, { new: true });
  if (!debited) return res.status(400).json({ error: `You need more than ${TRANSFER_MIN_BALANCE} points (and enough balance) to transfer.` });
  try { await User.updateOne({ _id: target._id }, { $inc: { points: amount } }); }
  catch (e) { await User.updateOne({ _id: req.user._id }, { $inc: { points: amount } }); throw e; }
  await PointTransfer.create({ from: req.user._id, to: target._id, amount });
  res.json({ message: `Transferred ${amount} points to ${target.username}.`, points: debited.points });
}));

r.post('/:username/friend', auth, ah(async (req, res) => {
  const t = await User.findOne({ username: req.params.username });
  if (!t || t._id.equals(req.user._id)) return res.status(400).json({ error: 'Invalid user.' });
  const exists = await Friendship.findOne({ $or: [{ from: req.user._id, to: t._id }, { from: t._id, to: req.user._id }] });
  if (!exists) await Friendship.create({ from: req.user._id, to: t._id });
  res.json({ message: 'Friend request sent.' });
}));

r.post('/:username/friend/accept', auth, ah(async (req, res) => {
  const t = await User.findOne({ username: req.params.username });
  if (!t) return res.status(404).json({ error: 'User not found.' });
  await Friendship.updateOne({ from: t._id, to: req.user._id, status: 'pending' }, { status: 'accepted' });
  res.json({ ok: true });
}));

export default r;
