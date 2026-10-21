# MERN Q&A Platform (Elevance Skills internship tasks)

**M**ongoDB + **E**xpress + **R**eact (Vite) + **N**ode.js. JWT in an httpOnly cookie. All time windows/days use **IST**.

```
server/  Express API (src/routes, models.js, utils/…, test/)
client/  React SPA (src/pages, AppContext, i18n.js)
```

Client code style: ES7+ (arrow-function components in `rafce` style, destructuring, async/await, optional chaining, named + default exports).

## Quick start (no configuration needed)
Requires Node 18+ and internet on first run (downloads packages and an embedded MongoDB).
```bash
npm run setup     # installs root, server and client dependencies
npm start         # API on :5000 + UI on http://localhost:5173
```
- No MongoDB install: if `MONGO_URI` is empty, an embedded MongoDB starts and stores data in `server/.data`.
- OTPs, emails and SMS are printed in the **terminal** (look for `[DEV EMAIL]` / `[DEV SMS]`); payments use a **mock gateway**.
- `server/.env.example` is used automatically. Copy it to `server/.env` to override anything (own MongoDB/Atlas, SMTP, Razorpay, `BYPASS_TIME_WINDOWS=0` for the strict time rules).
- Tests: `npm test`.

## Features → code
| # | Requirement | Implementation |
|---|---|---|
| 1 | Login history (browser, OS, device, IP) shown on profile. Chrome → email OTP; Microsoft Edge → no extra auth; mobile → only 10:00 AM–1:00 PM | `utils/ua.js`, `routes/auth.js` (`/login`, `/verify-otp`), `pages/Profile.jsx` |
| 2 | +5 per answer, +5 at 5 upvotes, points on profile, transfer (needs >10 pts), deduct on removal/downvote | `routes/questions.js`, `routes/users.js` (`/:username/transfer`), `utils/points.js` |
| 3 | 6 languages; French → email OTP, others → mobile (SMS) OTP | `client/src/i18n.js`, `routes/users.js` (`/language`), `pages/Verify.jsx` |
| 4 | Public space: photo/video, like/comment/share; limits by friends (0 none, 1 → 1/day, 2 → 2/day, >10 unlimited) | `routes/posts.js`, `utils/rules.js` (`postLimit`) |
| 5 | Forgot password (email/phone), once per day with warning, letters-only random password | `routes/auth.js` (`/forgot-password`), `utils/rules.js` (`generatePassword`) |
| 6 | Free/Bronze ₹100/Silver ₹300/Gold ₹1000 (1/5/10/∞ questions per day), Razorpay, invoice email, payments only 10–11 AM IST | `routes/payments.js`, `pages/Plans.jsx` |

## API (all under `/api`)
`POST auth/register|login|verify-otp|logout|forgot-password`, `GET auth/me` · `GET users?q=`, `GET users/:u`, `POST users/language`, `POST users/:u/transfer|friend|friend/accept` ·
`GET questions`, `POST questions`, `GET questions/:id`, `POST questions/:id/answers`, `POST answers/:id/vote`, `DELETE answers/:id` ·
`GET posts`, `POST posts` (multipart `media`), `POST posts/:id/like|comment|share` · `GET plans`, `POST payments/order`, `POST payments/verify`

## Assumptions (spec gaps)
- Browsers other than Chrome/Edge (Firefox, Safari…) are treated like Chrome → email OTP. Tablets count as mobile.
- A user-agent can't tell desktop from laptop; the login page sends a hint (Battery API present ⇒ "Laptop").
- Friends 3–10: posts/day = number of friends. A share counts as a post. Friendships need request + accept.
- Each downvote = −1 point for the author (toggling it off refunds). Deleting an answer removes its 5 points (+5 if the bonus was awarded). Points never drop below 0.
- Transfer requires balance **> 10** and amount ≤ balance. Phone numbers are unique (needed for phone-based reset).
- A subscription lasts 30 days, then reverts to Free. The payment window is enforced when the order is created.
- UI labels are translated; server messages are English (add keys in `client/src/i18n.js` to translate more).

## Security notes
The spec requires emailing a generated letters-only password; implemented as specified, but production should prefer reset links. Also add CSRF tokens (cookie is `SameSite=Lax`), rate limiting, helmet and HTTPS; use a strong `JWT_SECRET`; plug a real SMS provider into `server/src/utils/mailer.js`. Without a MongoDB replica set, multi-document transactions aren't available, so counters use atomic updates instead.

## Push to Git
```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main && git push -u origin main
```
