# Production Environment — Single Source of Truth

All env vars for the AURA Studio Vercel deployment, collected in one place.
There are **two groups**: frontend (build-time) and backend (runtime).

---

## 1. Frontend vars (build-time, `REACT_APP_*`)

These are baked into the JS bundle at build time. They live in the **committed**
root file `.env.production` (safe — the anon key is public and ends up in the
browser anyway). Vercel's `vercel-build` copies it via `cp .env.production .env`.

| Variable | Production value |
|----------|------------------|
| `REACT_APP_API_URL` | *(empty)* — so the app calls relative `/api`, which Vercel rewrites to the backend |
| `REACT_APP_ENV` | `production` |
| `REACT_APP_SUPABASE_URL` | `https://kqjnfpphpstqbmhjqkwc.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | *(public anon key — already in `.env.production`)* |
| `REACT_APP_NAME` | `AURA Studio` |
| `REACT_APP_DESCRIPTION` | `Women-only Pilates Studio` |
| `REACT_APP_VAPID_PUBLIC_KEY` | *(optional — only for web-push notifications)* |

> Do **not** set `REACT_APP_API_URL` in the Vercel dashboard. If you do, set it empty.

---

## 2. Backend vars (runtime — set in Vercel Dashboard)

The backend serverless function reads these via `process.env`. They are **not**
shipped in any committed file. Set them in
**Vercel → Project Settings → Environment Variables (Production)**.
Source of truth: the gitignored `backend/.env.production`.

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | **Transaction pooler, port 6543** + `?pgbouncer=true&connection_limit=1` |
| `SUPABASE_URL` | `https://kqjnfpphpstqbmhjqkwc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | secret — from Supabase dashboard |
| `SUPABASE_ANON_KEY` | public anon key |
| `FRONTEND_URL` | your custom domain, e.g. `https://aurastudio.et` (CORS + reset links) |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` | SMTP for notifications |
| `ADMIN_EMAIL` | receives newsletter/contact notifications |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_ADMIN_CHAT_ID` | admin Telegram alerts |
| `CRON_SECRET` | optional — protects the daily expiry cron endpoint |

> `NODE_ENV` and `VERCEL` are set automatically by Vercel — no action needed.

---

## 3. Outside Vercel — Supabase Dashboard

**Authentication → URL Configuration:**
- **Site URL:** `https://aurastudio.et`
- **Redirect URLs:** add `https://aurastudio.et/**` (needed for password reset & Google OAuth to return to your domain)

---

## 4. Deploy checklist

1. Confirm all **backend** vars above exist in the Vercel dashboard (Production scope).
2. Confirm `DATABASE_URL` uses port **6543** with the pgbouncer params.
3. Set Supabase Site URL + Redirect URLs to the custom domain.
4. Apply the new DB indexes once: `cd backend && npx prisma db push`.
5. `git push` → Vercel auto-redeploys.
6. Smoke test: `/health`, `/api/classes`, log in, book a class, open admin dashboard.
