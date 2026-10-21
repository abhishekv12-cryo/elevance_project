import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from '../config.js';
import { Post, PostLike, PostComment } from '../models.js';
import { ah } from '../utils/ah.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { istDay } from '../utils/time.js';
import { postLimit } from '../utils/rules.js';
import { friendCount } from './users.js';

const r = express.Router();
const MEDIA = { jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', mp4: 'video', webm: 'video', mov: 'video' };
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_q, f, cb) => cb(null, crypto.randomBytes(8).toString('hex') + path.extname(f.originalname).toLowerCase()),
  }),
  fileFilter: (_q, f, cb) => cb(MEDIA[path.extname(f.originalname).slice(1).toLowerCase()] ? null : new Error('Only photos (jpg, png, gif, webp) and videos (mp4, webm, mov) are allowed.'), true),
});

/** Returns an error string or null. Limit depends on friend count; shares count as posts. */
async function createPost(user, { body = '', file, sharedFrom }) {
  const limit = postLimit(await friendCount(user._id));
  if (limit === 0) return 'You need at least one friend before you can post on the public page.';
  const used = await Post.countDocuments({ user: user._id, day: istDay() });
  if (limit !== null && used >= limit) return `Daily post limit reached (${limit}). Add more friends to post more.`;
  await Post.create({ user: user._id, body, sharedFrom, day: istDay(),
    mediaPath: file?.filename, mediaType: file ? MEDIA[path.extname(file.filename).slice(1)] : undefined });
  return null;
}

r.get('/', optionalAuth, ah(async (req, res) => {
  const posts = await Post.find().sort({ _id: -1 }).limit(50).populate('user', 'username').populate('sharedFrom', 'body').lean();
  const ids = posts.map((p) => p._id);
  const [likes, shares, comments, mine] = await Promise.all([
    PostLike.aggregate([{ $match: { post: { $in: ids } } }, { $group: { _id: '$post', n: { $sum: 1 } } }]),
    Post.aggregate([{ $match: { sharedFrom: { $in: ids } } }, { $group: { _id: '$sharedFrom', n: { $sum: 1 } } }]),
    PostComment.find({ post: { $in: ids } }).sort({ _id: 1 }).populate('user', 'username').lean(),
    req.user ? PostLike.find({ post: { $in: ids }, user: req.user._id }).lean() : [],
  ]);
  const count = (arr, id) => arr.find((x) => x._id.equals(id))?.n || 0;
  const liked = new Set(mine.map((l) => String(l.post)));
  const out = posts.map((p) => ({ ...p, likes: count(likes, p._id), shares: count(shares, p._id),
    liked: liked.has(String(p._id)), comments: comments.filter((c) => c.post.equals(p._id)) }));
  let info = null;
  if (req.user) { const friends = await friendCount(req.user._id); info = { friends, limit: postLimit(friends) }; }
  res.json({ posts: out, info });
}));

r.post('/', auth, upload.single('media'), ah(async (req, res) => {
  const body = String(req.body.body || '').trim();
  if (!body && !req.file) return res.status(400).json({ error: 'Write something or attach a photo/video.' });
  const err = await createPost(req.user, { body, file: req.file });
  if (err) { if (req.file) await fs.unlink(req.file.path).catch(() => {}); return res.status(403).json({ error: err }); }
  res.status(201).json({ ok: true });
}));

r.post('/:id/like', auth, ah(async (req, res) => {
  const del = await PostLike.deleteOne({ post: req.params.id, user: req.user._id });
  if (!del.deletedCount) await PostLike.create({ post: req.params.id, user: req.user._id }).catch(() => {});
  res.json({ ok: true });
}));

r.post('/:id/comment', auth, ah(async (req, res) => {
  const body = String(req.body.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Comment is empty.' });
  await PostComment.create({ post: req.params.id, user: req.user._id, body });
  res.status(201).json({ ok: true });
}));

r.post('/:id/share', auth, ah(async (req, res) => {
  if (!(await Post.exists({ _id: req.params.id }))) return res.status(404).json({ error: 'Post not found.' });
  const err = await createPost(req.user, { sharedFrom: req.params.id });
  if (err) return res.status(403).json({ error: err });
  res.status(201).json({ ok: true });
}));

export default r;
