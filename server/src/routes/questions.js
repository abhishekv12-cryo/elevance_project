import express from 'express';
import { Question, Answer, Vote } from '../models.js';
import { ah } from '../utils/ah.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { istDay } from '../utils/time.js';
import { addPoints } from '../utils/points.js';
import { PLANS, effectivePlan, POINTS_PER_ANSWER, UPVOTE_TARGET, UPVOTE_BONUS } from '../utils/rules.js';

const r = express.Router();

r.get('/questions', optionalAuth, ah(async (req, res) => {
  const questions = await Question.find().sort({ _id: -1 }).limit(50).populate('user', 'username').lean();
  let quota = null;
  if (req.user) {
    const plan = PLANS[effectivePlan(req.user)];
    quota = { plan: plan.name, limit: plan.limit, used: await Question.countDocuments({ user: req.user._id, day: istDay() }) };
  }
  res.json({ questions, quota });
}));

// Daily question limit depends on the active subscription plan
r.post('/questions', auth, ah(async (req, res) => {
  const title = String(req.body.title || '').trim(), body = String(req.body.body || '').trim();
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required.' });
  const limit = PLANS[effectivePlan(req.user)].limit;
  const used = await Question.countDocuments({ user: req.user._id, day: istDay() });
  if (limit !== null && used >= limit)
    return res.status(403).json({ error: `Daily limit of ${limit} question(s) reached. Upgrade your plan to ask more.` });
  res.status(201).json(await Question.create({ user: req.user._id, title, body, day: istDay() }));
}));

r.get('/questions/:id', ah(async (req, res) => {
  const q = await Question.findById(req.params.id).populate('user', 'username').lean().catch(() => null);
  if (!q) return res.status(404).json({ error: 'Question not found.' });
  const answers = (await Answer.find({ question: q._id }).populate('user', 'username').lean())
    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  res.json({ question: q, answers });
}));

// +5 points per answer
r.post('/questions/:id/answers', auth, ah(async (req, res) => {
  const body = String(req.body.body || '').trim();
  if (!body || !(await Question.exists({ _id: req.params.id }))) return res.status(400).json({ error: 'Invalid answer.' });
  const a = await Answer.create({ question: req.params.id, user: req.user._id, body });
  await addPoints(req.user._id, POINTS_PER_ANSWER);
  res.status(201).json(a);
}));

r.post('/answers/:id/vote', auth, ah(async (req, res) => {
  const value = req.body.value === 'up' ? 1 : -1;
  const a = await Answer.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Answer not found.' });
  if (a.user.equals(req.user._id)) return res.status(400).json({ error: 'You cannot vote on your own answer.' });
  const old = await Vote.findOneAndDelete({ answer: a._id, user: req.user._id }); // undo previous vote (same button toggles off)
  if (old) {
    if (old.value === 1) await Answer.updateOne({ _id: a._id }, { $inc: { upvotes: -1 } });
    else { await Answer.updateOne({ _id: a._id }, { $inc: { downvotes: -1 } }); await addPoints(a.user, 1); }
  }
  if (!old || old.value !== value) {
    await Vote.create({ answer: a._id, user: req.user._id, value });
    if (value === 1) {
      await Answer.updateOne({ _id: a._id }, { $inc: { upvotes: 1 } });
      // atomic flip => the +5 bonus is awarded exactly once, when upvotes reach 5
      const flipped = await Answer.findOneAndUpdate(
        { _id: a._id, upvotes: { $gte: UPVOTE_TARGET }, bonusAwarded: false }, { bonusAwarded: true });
      if (flipped) await addPoints(a.user, UPVOTE_BONUS);
    } else {
      await Answer.updateOne({ _id: a._id }, { $inc: { downvotes: 1 } });
      await addPoints(a.user, -1); // -1 per downvote
    }
  }
  res.json(await Answer.findById(a._id));
}));

// Removing an answer deducts its points (5, +5 if the upvote bonus was awarded)
r.delete('/answers/:id', auth, ah(async (req, res) => {
  const a = await Answer.findById(req.params.id);
  if (!a || !a.user.equals(req.user._id)) return res.status(403).json({ error: 'Not allowed.' });
  await addPoints(req.user._id, -(POINTS_PER_ANSWER + (a.bonusAwarded ? UPVOTE_BONUS : 0)));
  await Vote.deleteMany({ answer: a._id });
  await a.deleteOne();
  res.json({ ok: true });
}));

export default r;
