# Let It Power Life 💻

A laptop donation platform for NGOs and NPOs — migrated from Glide. Refurbished laptops
are listed publicly; organisations verify their email with an OTP code, submit a request
(with the final recipient organisation), and track fulfilment from Processing to
Delivered. Arisa manages inventory and approvals from a simple admin panel, and every
decision automatically emails the requestor.

## Stack

Next.js (App Router) · Postgres (Neon) · Prisma · Tailwind CSS · Nodemailer (Gmail SMTP) · Vercel Blob

## Setup

1. **Clone & install**
   ```bash
   npm install
   ```
2. **Environment** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — Postgres connection string (Vercel → Storage → Neon adds this automatically)
   - `SMTP_USER` / `SMTP_APP_PASSWORD` — the Gmail account that sends emails.
     Create an App Password at myaccount.google.com → Security → 2-Step Verification → App passwords.
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — login for `/admin`
   - `SESSION_SECRET` — any long random string
   - `BLOB_READ_WRITE_TOKEN` — Vercel → Storage → Blob (for photo uploads)
3. **Database schema**
   ```bash
   npx prisma db push
   ```
4. **Import the Glide data** (CSVs live in `data/glide-export/`)
   ```bash
   npm run import-glide
   ```
   The script imports laptops, requests and country codes, re-hosts laptop photos to
   Vercel Blob (when the token is set), and prints a stock check that should match the
   Glide export.
5. **Run**
   ```bash
   npm run dev
   ```

## Deploying on Vercel

1. Import the GitHub repo into Vercel (team: co-spark).
2. Attach **Neon Postgres** (Storage → Create Database) — adds `DATABASE_URL`.
3. Attach **Blob storage** — adds `BLOB_READ_WRITE_TOKEN`.
4. Add the remaining env vars (Settings → Environment Variables): `SMTP_USER`,
   `SMTP_APP_PASSWORD`, `EMAIL_FROM_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.
5. Deploy. The build runs `prisma db push` automatically, so the schema is created on
   first deploy.
6. Run the import once against the production database:
   ```bash
   DATABASE_URL="<neon url>" BLOB_READ_WRITE_TOKEN="<token>" npm run import-glide
   ```

## Admin guide (for Arisa)

- Sign in at **/admin** with your admin email and password.
- **Laptops** → *Add laptop*: fill in the model and specs, set the number of units, and
  upload a photo. The public site updates immediately.
- **Requests**: pending requests appear at the top. Open one to see the organisation's
  details and what they asked for. Set the quantity you can give for each model (partial
  approvals are fine), add an optional note, and click **Approve** — the requestor is
  emailed automatically. Or **Reject** with a note.
- After approving, use the **Advance** button as things progress: Processing → Preparing
  → Out for Delivery → Delivered. The requestor is emailed at "Out for Delivery" and
  "Delivered".
- Marking **Delivered** automatically adds the donation to the public **Our Impact**
  page — edit the story and photo under **Showcase**.

## OTP security

Requestors must verify their email with a 6-digit code before submitting or tracking a
request: codes expire after 10 minutes, allow 5 attempts, and each email is limited to
3 codes per 15 minutes.
