# AURA Yoga — Project Notes

Learned project conventions and operational procedures. Append-only.

## Tech stack (actual)

- Frontend: React + TypeScript + TailwindCSS + Heroicons + react-hook-form
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma ORM (provider in `backend/prisma/schema.prisma`)
- Auth: Supabase Auth (JWT verified in `backend/src/middleware/auth.ts`); tokens cached in-memory for 60s
- File uploads: Multer (memory storage) → Supabase Storage buckets (`products`, `shop-receipts`)
- Email: `backend/src/services/emailService.ts` (nodemailer)

Frontend API helper: `src/lib/api.ts` (`api.get/post/put/patch/delete/postForm`).
Always use `api.*` (or `api.postForm` for multipart) — never bare `fetch('/api/...')`,
so `REACT_APP_API_URL` is respected when the backend runs on a separate host.

## Shop module

Models live in `backend/prisma/schema.prisma` under the "SHOP MODULE" section
(`ProductCategory`, `Product`, `ProductVariant`, `ProductImage`, `ShopOrder`,
`ShopOrderItem`, `ShippingAddress`, `ShopOrderStatusHistory`, `Wishlist`).

Routes:
- Public catalog + orders: `backend/src/routes/shop.ts` → mounted at `/api/shop`
- Admin: `backend/src/routes/adminShop.ts` → mounted at `/api/admin/shop`

Frontend: `src/components/Shop/*` + `src/contexts/ShopCartContext.tsx`
(cart persisted to `localStorage` under `aura-shop-cart`).

### Inventory model

- `Product.stock` (nullable INTEGER): product-level stock for simple products
  with no variants. `null` = unlimited / not tracked at the product level.
- `ProductVariant.stock` (non-null INTEGER): per-variant stock.
- At checkout, stock is decremented inside a transaction with a `stock >= qty`
  guard (atomic, no negative stock). Restock happens on admin cancellation /
  refund when the order is leaving an active state.

### Guest orders

- `ShopOrder.guestToken` is NOT unique. A single device may place multiple
  guest orders; each gets a freshly minted server-side UUID.
- The server ignores any client-supplied guest token and returns the new one
  in the order-creation response. The frontend appends it to the confirmation
  URL as `?guestToken=...`.
- Order lookup (`GET /api/shop/orders/:id`) authorizes via owner, admin, or
  matching guest token.

### Auth on shop routes

- `POST /api/shop/orders` and `GET /api/shop/orders/:id` use `optionalAuth`
  (populates `req.user` when a valid Bearer token is present, otherwise
  continues as guest). This is required so logged-in users get `userId`
  recorded on their orders and can see them in `GET /api/shop/orders/mine`.
- `GET /api/shop/orders/mine` and `POST /api/shop/orders/:id/receipt` use
  `authenticateToken` (strict).

## Database migrations — IMPORTANT

The shop tables were originally created via a raw SQL script
(`backend/prisma/shop_tables.sql`, run by `backend/src/createShopTables.ts`)
rather than a Prisma migration. The `20260627134059_baseline` migration is
empty. As a result, Prisma's migration history does NOT reflect the actual
DB schema for shop tables.

### First-time setup on a fresh DB

1. `npx prisma migrate deploy` — applies the empty baseline (no-op) plus any
   delta migrations (e.g. `20260824000001_shop_baseline_delta`).
2. Run the raw SQL to create the shop tables:
   `npx ts-node src/createShopTables.ts`
   (or `psql $DATABASE_URL -f prisma/shop_tables.sql`).

### Existing DB with shop tables already created

The delta migration `20260824000001_shop_baseline_delta` is idempotent and
brings an already-shop-enabled DB into alignment with the current schema
(adds `Product.stock`, `ShopOrder.paidAt`, drops the unique `guestToken`
index, adds missing indexes). Just run:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

If `prisma migrate deploy` complains that the baseline migration is not
recorded as applied on the target DB, baseline it first:

```bash
npx prisma migrate resolve --applied 20260627134059_baseline
npx prisma migrate deploy
```

### Going forward

Prefer `npx prisma migrate dev --name <descriptive>` for new schema changes
so the migration history stays in sync. Do not edit `shop_tables.sql` for
new changes — only keep it in sync with the current schema as the
"fresh-install" bootstrap. New schema changes go in versioned migration
folders under `backend/prisma/migrations/`.

## Build / dev commands

- Frontend dev: `npm start` (from repo root)
- Backend dev: `cd backend && npm run dev`
- Backend build: `cd backend && npm run build`
- Prisma generate: `cd backend && npm run generate`
- Seed (core): `cd backend && npm run seed`
- Seed (shop): `cd backend && npm run seed:shop`

## Known gaps (post-P0)

Still to address (see shop audit, P1+):
- Order-number generation races / collides (`generateOrderNumber` uses count+1)
- No rate limiting on shop routes
- No idempotency key on checkout
- Money stored as Float (should be Decimal)
- Category rename regenerates slug (breaks URLs)
- No order emails (confirmation, payment-verified, shipped)
- Shipping cost hardcoded to 0; no zone/rate model
- No coupon/discount system (column exists, never written)
- Wishlist model exists with no routes
- No product URLs in sitemap; no per-product SEO/JSON-LD
- No tests
