# Backend Integration Guide

The frontend is ready for a backend but doesn't include one. This guide explains what to build so the leaderboard, milestones, recent support and community wall show **real, verified** data.

## 0. The key fact about verification

A UPI QR / `upi://pay` link pays a **personal UPI ID directly** through the banking network. Your website gets **no signal** about whether it succeeded, and a browser can never be trusted to say so. To verify payments you have two honest options:

1. **Payment gateway (recommended for automatic verification).** Use a provider that supports UPI in India (e.g. Razorpay, Cashfree, PhonePe PG, Paytm PG, Instamojo). Your server creates an *order*, the visitor pays through the gateway's UPI flow, and the gateway sends a **signed webhook** to your server. Verify the signature, then mark the payment verified. Check the provider's current docs and onboarding/KYC requirements. Note that gateway UPI replaces the personal QR for those payments.
2. **Manual reconciliation.** Keep the personal QR, and have the admin dashboard let you enter/approve a supporter record after checking your own bank/UPI statement. Slower, but honest.

Either way: **only the server may set `status = "verified"`**.

## 1. Endpoints the frontend already calls

Set `api.baseUrl` in `js/config.js` (e.g. `"https://api.hangerplayz.example/api"`). All are public, read-only `GET`s returning JSON. Enable CORS for your site's origin only.

| Endpoint | Response |
|---|---|
| `GET /leaderboard` | `[{ "name": "Alex", "total": 500, "message": "optional" }]` (verified totals per supporter, any order; the site sorts and shows the top 25) |
| `GET /recent` | `[{ "name": "Alex", "amount": 100, "date": "2026-10-30T10:00:00Z", "message": "optional" }]` |
| `GET /wall` | `[{ "name": "Alex", "message": "Love the mods", "date": "2026-10-30T10:00:00Z" }]`, **approved messages only** |
| `GET /milestones` | `{ "verifiedSupporters": 12 }` |
| `GET /updates` | `[{ "tag": "Mod", "title": "...", "body": "...", "date": "2026-10-01" }]` |

If an endpoint fails or returns nothing, the site falls back to its empty state (milestones show 0). Never return unverified rows, private transaction IDs, emails, phone numbers or UPI IDs of supporters.

## 2. Suggested data model

```sql
supporters(id, display_name, email_hash NULL, created_at)
payments(id, supporter_id, provider, provider_payment_id UNIQUE, amount_paise, currency,
         status CHECK (status IN ('created','pending','verified','failed','refunded')),
         verified_at, raw_event_json)                -- raw_event_json is admin-only
messages(id, payment_id, body, status CHECK (status IN ('pending','approved','rejected')),
         reviewed_by, reviewed_at)
milestones(id, goal_count, title)
updates(id, tag, title, body, published_at)
admins(id, email, password_hash, totp_secret, role) -- or use an auth provider
```
Aggregates: leaderboard = `SUM(amount) GROUP BY supporter WHERE status='verified'`; milestone count = `COUNT(DISTINCT supporter_id)` over verified payments.

## 3. Payment flow with a gateway (outline)

1. Frontend asks `POST /api/orders { amount, displayName?, message? }`. Validate on the server: amount within limits, name/message length-limited and sanitised, rate-limited per IP.
2. Server creates a gateway order, stores `payments(status='created')`, returns the order ID. (Keep gateway **secret keys on the server only**.)
3. Visitor completes UPI payment in the gateway checkout.
4. Gateway calls `POST /api/webhooks/<provider>`. The server **verifies the signature with the webhook secret**, checks the amount/currency match the stored order, handles duplicates idempotently (`provider_payment_id UNIQUE`), then sets `status='verified'`.
5. Optionally also re-fetch the payment from the gateway API before marking it verified.
6. New messages start as `pending`; only an admin can set `approved`.

## 4. Moderation (Community Wall)

- Store every message as `pending`. The admin dashboard lists them with Approve / Reject / Hide.
- `/wall` returns only `status='approved'`.
- Add length limits (≈240 chars), strip control characters, optional profanity/URL filter before the queue. The frontend also renders text safely (no HTML), so stored markup can't run.

## 5. Admin dashboard

`admin-preview.html` is only a labelled concept. A real one needs **server-side authentication**: sessions in HttpOnly + Secure + SameSite cookies (or OAuth/SSO), hashed passwords (argon2/bcrypt), 2FA, login rate-limiting, CSRF protection on write endpoints, role checks on every admin route, and an audit log. Never put an admin password or token in browser JavaScript. Features to build: verified payments list, message moderation, milestone editor, announcements CRUD, social-link editor (replaces editing `config.js`), basic stats.

## 6. Minimal Express sketch (read endpoints)

```js
// server.js: illustrative skeleton, not production-ready
import express from "express"; import cors from "cors"; import helmet from "helmet";
import rateLimit from "express-rate-limit";
const app = express();
app.use(helmet()); app.use(cors({ origin: "https://your-site.example" }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.get("/api/leaderboard", async (_req, res) => {
  const rows = await db.query(`SELECT s.display_name AS name, SUM(p.amount_paise)/100.0 AS total
    FROM payments p JOIN supporters s ON s.id=p.supporter_id
    WHERE p.status='verified' GROUP BY s.id ORDER BY total DESC LIMIT 25`);
  res.json(rows);
});
app.get("/api/milestones", async (_req, res) => {
  const [{ n }] = await db.query(`SELECT COUNT(DISTINCT supporter_id) n FROM payments WHERE status='verified'`);
  res.json({ verifiedSupporters: Number(n) });
});
app.get("/api/wall", async (_req, res) => {
  res.json(await db.query(`SELECT s.display_name AS name, m.body AS message, p.verified_at AS date
    FROM messages m JOIN payments p ON p.id=m.payment_id JOIN supporters s ON s.id=p.supporter_id
    WHERE m.status='approved' AND p.status='verified' ORDER BY p.verified_at DESC LIMIT 30`));
});
// webhook: use express.raw() for the body, verify the provider's signature, then update payments.
```

## 7. Security checklist

- [ ] Secrets only in server environment variables; none in the repo or frontend
- [ ] HTTPS everywhere; HSTS; CORS limited to your origin
- [ ] Webhook signatures verified; idempotent processing; amount/currency checked
- [ ] Never trust `status`, `amount` or "success" sent from the browser
- [ ] Input validation + rate limiting on every write endpoint
- [ ] Public endpoints return only verified/approved data, and no private transaction details
- [ ] Admin: server-side auth, 2FA, CSRF protection, audit log
- [ ] Privacy: tell supporters what is shown publicly (name, amount, message) and let them choose "Anonymous"
