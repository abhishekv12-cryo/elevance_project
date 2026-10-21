import crypto from 'node:crypto';

export const PLANS = { // limit = questions/day (null = unlimited)
  free: { name: 'Free', price: 0, limit: 1 },
  bronze: { name: 'Bronze', price: 100, limit: 5 },
  silver: { name: 'Silver', price: 300, limit: 10 },
  gold: { name: 'Gold', price: 1000, limit: null },
};
export const POINTS_PER_ANSWER = 5;
export const UPVOTE_TARGET = 5;
export const UPVOTE_BONUS = 5;
export const TRANSFER_MIN_BALANCE = 10; // must have MORE than this
export const LANGS = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];

/** 0 friends -> blocked (0); 1..10 -> that many posts/day; >10 -> unlimited (null) */
export const postLimit = (friends) => (friends === 0 ? 0 : friends > 10 ? null : friends);

export const effectivePlan = (u, now = new Date()) =>
  u.plan !== 'free' && u.planExpires && new Date(u.planExpires) > now ? u.plan : 'free';

/** Random password containing ONLY upper/lowercase letters (at least one of each). */
export function generatePassword(n = 12) {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (;;) {
    const pw = Array.from({ length: n }, () => letters[crypto.randomInt(letters.length)]).join('');
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) return pw;
  }
}
