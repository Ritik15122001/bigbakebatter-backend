# BigBakeBatter API

Express + MongoDB (Mongoose) REST API for the BigBakeBatter storefront and admin panel.

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # nodemon, http://localhost:5050/api
npm start              # production
```

Health check: `GET /api/health` (returns 503 if the database is down).

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no | default 5050 |
| `NODE_ENV` | yes in prod | set to `production` on the server (hides stack traces, strict CORS, enforces secrets) |
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | 64+ random chars: `openssl rand -hex 64`. Changing it signs everyone out. |
| `JWT_EXPIRES_IN` | no | default `7d` |
| `CORS_ORIGINS` | yes in prod | comma-separated storefront and admin URLs, e.g. `https://bigbakebatter.com,https://admin.bigbakebatter.com` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | yes | use **live** keys in production |
| `RAZORPAY_WEBHOOK_SECRET` | yes in prod | Razorpay Dashboard → Settings → Webhooks → `<api-url>/api/payments/webhook` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | seed only | |

## Database scripts

- `npm run migrate` — **safe** additive upgrade for an existing database: adds default announcements,
  add-on categories and the FIRST20 coupon if missing, marks box categories, builds indexes. Run after every deploy.
- `npm run seed` — **wipes every collection** and loads demo data. It refuses to run against a hosted
  (`mongodb+srv://`) or production database unless you pass `--force`. Never run it on the live database.

## Deploying

Any Node 20+ host (Render, Railway, a VPS with PM2…). Start command `npm start`.

- The app sets `trust proxy`, so rate limits work behind the host's load balancer.
- **Uploads** are written to `./uploads` on local disk. On hosts with an ephemeral filesystem (Render free
  tier, Railway without a volume, Heroku) uploaded images are lost on every redeploy — attach a persistent
  disk/volume mounted at `uploads/`, or move uploads to Cloudinary/S3 before going live.
- Uploaded image URLs are stored relative (`/uploads/…`); the frontends prefix the API origin when displaying them.

## Payments and pricing

Prices are always computed on the server (`src/utils/pricing.js`) from the products, add-ons, coupon and
delivery settings in the database. The client only sends item ids, weights and quantities. `POST /orders`
verifies the Razorpay signature, checks the Razorpay order amount equals the server-computed total, and is
idempotent per payment id.

Refunds marked in the admin panel are **records only** — issue the actual refund in the Razorpay dashboard
(the `refund.processed` webhook also marks the transaction refunded automatically).

## Editable website content

Every storefront section that the admin can edit is registered in `src/content/sections.js` (field schema +
default content). `GET /api/content` returns defaults overlaid with saved overrides; the admin's
"Website content" screen edits them.
