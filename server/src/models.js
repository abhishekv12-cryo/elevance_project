import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name, required: true });
const make = (name, def, indexes = []) => {
  const s = new Schema(def, { timestamps: { createdAt: true, updatedAt: false } });
  indexes.forEach(([f, o]) => s.index(f, o));
  return model(name, s);
};

export const User = make('User', {
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  points: { type: Number, default: 0, min: 0 },
  plan: { type: String, enum: ['free', 'bronze', 'silver', 'gold'], default: 'free' },
  planExpires: Date,
  lang: { type: String, enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr'], default: 'en' },
});
export const LoginHistory = make('LoginHistory', {
  user: ref('User'), browser: String, os: String, device: String, ip: String, status: String,
});
export const Otp = make('Otp', {
  user: ref('User'), purpose: { type: String, enum: ['login', 'language'], required: true },
  codeHash: { type: String, required: true }, payload: Schema.Types.Mixed,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0 }, used: { type: Boolean, default: false },
});
export const ForgotRequest = make('ForgotRequest', { user: ref('User'), day: { type: String, required: true } },
  [[{ user: 1, day: 1 }, { unique: true }]]);
export const Question = make('Question', {
  user: ref('User'), title: { type: String, required: true }, body: { type: String, required: true }, day: String });
export const Answer = make('Answer', {
  question: ref('Question'), user: ref('User'), body: { type: String, required: true },
  upvotes: { type: Number, default: 0 }, downvotes: { type: Number, default: 0 },
  bonusAwarded: { type: Boolean, default: false },
});
export const Vote = make('Vote', { answer: ref('Answer'), user: ref('User'), value: { type: Number, enum: [1, -1] } },
  [[{ answer: 1, user: 1 }, { unique: true }]]);
export const PointTransfer = make('PointTransfer', { from: ref('User'), to: ref('User'), amount: Number });
export const Friendship = make('Friendship', {
  from: ref('User'), to: ref('User'), status: { type: String, enum: ['pending', 'accepted'], default: 'pending' } },
  [[{ from: 1, to: 1 }, { unique: true }]]);
export const Post = make('Post', {
  user: ref('User'), body: { type: String, default: '' }, mediaPath: String,
  mediaType: { type: String, enum: ['image', 'video'] }, sharedFrom: { type: Schema.Types.ObjectId, ref: 'Post' }, day: String });
export const PostLike = make('PostLike', { post: ref('Post'), user: ref('User') }, [[{ post: 1, user: 1 }, { unique: true }]]);
export const PostComment = make('PostComment', { post: ref('Post'), user: ref('User'), body: { type: String, required: true } });
export const Payment = make('Payment', {
  user: ref('User'), plan: String, amount: Number, orderId: { type: String, unique: true },
  paymentId: String, status: { type: String, enum: ['created', 'paid'], default: 'created' },
});
