import { serverRoot } from './env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import questionRoutes from './routes/questions.js';
import postRoutes from './routes/posts.js';
import paymentRoutes from './routes/payments.js';

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === '1');
fs.mkdirSync(config.uploadDir, { recursive: true });
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(config.uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', questionRoutes);
app.use('/api', paymentRoutes);

const dist = path.resolve(serverRoot, '../client/dist');
if (fs.existsSync(dist)) { // production: serve the built React app from the same port
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('/', (_req, res) => res.type('html').send('API is running. Open the app at <a href="http://localhost:5173">http://localhost:5173</a>'));
}

app.use((err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ error: 'Duplicate request.' });
  if (err instanceof multer.MulterError || /Only photos/.test(err.message)) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

let embedded = null;
const connectDb = async () => {
  if (config.mongoUri) return mongoose.connect(config.mongoUri);
  try { // 1) a MongoDB already running on this machine
    await mongoose.connect('mongodb://127.0.0.1:27017/qa_platform', { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to local MongoDB (127.0.0.1:27017).');
  } catch { // 2) otherwise start an embedded one (data kept in server/.data)
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.join(serverRoot, '.data');
    fs.mkdirSync(dbPath, { recursive: true });
    console.log('Starting embedded MongoDB (first run downloads it, please wait)...');
    embedded = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } });
    await mongoose.connect(embedded.getUri('qa_platform'));
    console.log('Using embedded MongoDB. Set MONGO_URI in server/.env to use your own.');
  }
};
await connectDb();
const shutdown = async () => {
  await mongoose.disconnect().catch(() => {});
  await embedded?.stop().catch(() => {});
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
app.listen(config.port, () => console.log(`API on http://localhost:${config.port}`));
