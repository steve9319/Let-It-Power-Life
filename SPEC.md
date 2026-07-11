# Build "Let It Power Life" — Laptop Donation Platform for NGOs/NPOs

## Context
Migrate Arisa's Glide app ("Laptop Reconnect") to a self-hosted web app. Code lives in
the GitHub repo `steve9319/Let-It-Power-Life`, deployed on Vercel under the `co-spark`
team. The Glide data has been exported to CSVs in `/data/glide-export/`:
`Laptops.csv`, `NGO Requests.csv`, `Country Codes.csv`. Treat these as the source of
truth for fields and existing records.

## Tech stack
- Next.js 15 (App Router, TypeScript), Tailwind CSS
- Postgres via Vercel-integrated Neon, Prisma ORM
- Vercel Blob for laptop photos
- Email via Gmail SMTP (Nodemailer) from **arisatan9319@gmail.com** using a Google App
  Password. Env vars: `SMTP_USER`, `SMTP_APP_PASSWORD`, `EMAIL_FROM_NAME="Let It Power Life"`

## Design language (professional non-profit)
- Palette: deep navy (#1B2A4A) primary, warm teal (#0E7C7B) accent, soft off-white
  (#F7F7F5) background, generous whitespace. Amber for "low stock", green for
  "delivered", red only for rejection.
- Typography: Inter (or system stack); large friendly headings, 15–16px body.
- Cards with soft shadows and rounded corners; consistent 8px spacing grid.
- Every page mobile-first responsive; the audience includes NGO staff on phones.
- Header with project name/logo placeholder + nav: Laptops · Request · Track Request ·
  Our Impact. Footer with contact email.
- No clutter: one primary action per screen, clear empty states, loading skeletons.

## Data model
Normalize Glide's wide/computed columns into proper relations. Preserve every
meaningful field; drop only Glide's internal workaround columns (Adopted 1–4,
"Model with Stock", Avail 1/2 — these become computed values).

1. **Laptop**
   - `laptop_id` (e.g. L001, human-readable, unique), `model` ("Model / Brand"),
     `cpu`, `ram`, `storage`, `spec_summary`, `adaptor` (e.g. "UK", "LENOVO 45W"),
     `os`, `office_installed` (bool), `original_units` (int), `status`
     (Available/Retired), `photo_url` (Vercel Blob), `created_at`
   - **Available quantity is computed**: `original_units` − sum of approved
     quantities on non-rejected requests. Show it everywhere stock is displayed.
2. **DonationRequest**
   - `request_id` — human-readable code (e.g. R-2026-001), shown in all emails
   - Requesting NGO details: `organisation_name`, `uen` (Unique Entity Number),
     `contact_person`, `email` (OTP-verified), `country` (dropdown from CountryCode),
     `country_code` (auto from country), `phone_number`
   - Purpose: `laptop_uses` (required), `notes`
   - **`final_recipient_org`** (required) — the organisation that will ultimately
     receive/use the laptops (may differ from the requesting NGO, e.g. a church
     requesting for a school in Laos); plus optional `final_recipient_country`
   - `decision`: Pending / Approved / Rejected (+ `decision_note`, `decided_at`)
   - `fulfilment_status`: Processing / Preparing / Out for Delivery / Delivered
     (+ timestamp per stage), `submitted_at`
3. **RequestItem** (child of DonationRequest, 1–4+ per request)
   - `laptop` FK, `quantity_requested`, `quantity_approved` (nullable until decided)
4. **PastDonation** — public showcase: `recipient_org`, `country`, laptop model(s) +
   quantities, `delivered_date`, `photo`, `story` (short testimonial). Can be
   auto-created when a request is marked Delivered, then edited.
5. **CountryCode** — seeded from Country Codes.csv (Singapore +65, Cambodia +855,
   Laos +856, Vietnam +84, Thailand +66, Malaysia +60, Indonesia +62,
   Philippines +63, Myanmar +95, Bangladesh +880); admin can add more.
6. **Admin** — Arisa's account, seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars.

## Data import (`scripts/import-glide.ts`)
- Parse the three CSVs from `/data/glide-export/`.
- Laptops: trim whitespace ("Available " → "Available"), normalize L003's
  `OS: "YES"` → "Windows 11 Home" equivalent unknown → import as-is but flag in a
  console warning for Arisa to fix in admin. **Download each Glide photo URL and
  re-upload to Vercel Blob** (Glide URLs will eventually break).
- NGO Requests: map wide columns (1.–4. Laptop Model / Quantity, Approved Qty 1–4)
  into DonationRequest + RequestItem rows. "Approved" status → decision Approved
  with fulfilment Processing; blank status → Pending. Import the "test" row too
  (Arisa can delete it in admin). Generate proper request_ids.
- Verify after import: computed available quantities must match the CSV
  ("HP Elitebook 0 left, ProBook 0 left, Lenovo X13 10 left"); print a summary table.

## Public pages (requestors)

### 1. Laptops (home)
Grid of laptop cards: photo, Laptop ID, model, spec line (CPU / RAM / Storage),
badges for adaptor, OS, Office. **Prominent stock badge**: "10 available" (teal),
"Low stock" (amber, ≤2), "Out of stock" (grey, card dimmed but visible with a
"notify me is not needed — check back soon" hint). CTA on each card: "Request this
laptop" → prefills the request form.

### 2. Request form — multi-step wizard (professional, not one long scroll)
Step indicator across the top (1 Verify · 2 Organisation · 3 Laptops · 4 Purpose ·
5 Review). State preserved across steps; back navigation allowed.

- **Step 1 — Verify email**: enter work email → 6-digit OTP sent (10-min expiry,
  max 5 attempts, rate limit 3 codes / 15 min per email/IP) → verified badge.
- **Step 2 — Organisation details**: Organisation Name, UEN, Contact Person,
  Country (dropdown), Phone (country code auto-prefixed from selection),
  inline validation.
- **Step 3 — Select laptops**: instead of Glide's four dropdown pairs, show the
  available models as selectable cards with a quantity stepper (max = available
  stock, disabled at 0). Running summary sidebar: "You are requesting: 6 × ProBook,
  2 × Elitebook".
- **Step 4 — Purpose & recipient**: Laptop Uses (required textarea, helper text
  "How will these laptops be used?"), **Final Recipient Organisation** (required —
  "Which organisation will ultimately receive these laptops? If it's your own,
  enter the same name"), optional recipient country, Notes.
- **Step 5 — Review & submit**: read-only summary of everything, edit links per
  section, submit → success screen with the Request ID and "we'll email you at
  each step" message + confirmation email.

### 3. Track request
Email + OTP → list of that email's requests. Each shows Request ID, submitted date,
line items, decision status, and once approved a **horizontal progress tracker**:
Processing → Preparing → Out for Delivery → Delivered (completed steps in teal with
check icons, current step pulsing, timestamps under each). Rejected shows the note
politely with an invitation to reapply.

### 4. Our Impact (public showcase)
Headline stats (laptops donated, organisations helped, countries reached) +
story cards: photo, recipient organisation, country, models & quantities, date,
short story. Optional simple map pins of recipient countries.

## Admin panel (`/admin`) — built for one non-technical user (Arisa)
Email + password login (bcrypt, httpOnly session, middleware-protected).
Simple sidebar: Dashboard · Laptops · Requests · Showcase.

- **Dashboard**: counts (pending requests, in-fulfilment, stock left per model).
- **Laptops**: table + "Add laptop" button opening a simple form — Laptop ID
  (auto-suggested next number), model, CPU, RAM, storage, spec summary auto-composed
  but editable, adaptor, OS, Office toggle, original units, **drag-and-drop photo
  upload with preview** (Vercel Blob). Edit and retire in place. Show computed
  available quantity per model.
- **Requests**: queue sorted Pending first. Detail view shows all NGO details,
  purpose, final recipient, and per-line-item stock context ("requested 10,
  8 available"). Arisa sets an **approved quantity per line item** (defaults to
  requested, capped at stock, can be partial), then Approve — or Reject with an
  optional note. Both trigger the automated emails. Approving reserves stock.
- **Fulfilment**: on each approved request, one-click advance through Processing →
  Preparing → Out for Delivery → Delivered. Delivered prompts "Publish to Impact
  page?" pre-filled from the request (recipient org = final_recipient_org).
- **Showcase**: edit/add impact stories and photos.

## Automated emails (from arisatan9319@gmail.com, warm professional HTML)
1. OTP code (request form + tracking)
2. Request received — includes Request ID and summary of models/quantities
3. **Approved** — congratulations, approved models & quantities (incl. partial),
   what happens next
4. **Rejected** — polite decline with Arisa's note, invite to reapply
5. Status updates at Out for Delivery and Delivered
All templates include the project name header and the Request ID.

## Deployment
- Repo `steve9319/Let-It-Power-Life`, main = production, Vercel team `co-spark`.
- `.env.example`: DATABASE_URL, SMTP_USER, SMTP_APP_PASSWORD, ADMIN_EMAIL,
  ADMIN_PASSWORD, SESSION_SECRET, BLOB_READ_WRITE_TOKEN.
- README: setup, import instructions, and a plain-English admin guide for Arisa.

## Acceptance checklist
- [ ] All CSV rows imported; photos re-hosted on Vercel Blob; stock math matches
      the export (L001: 0, L002: 0, L003: 10 available)
- [ ] Requestor cannot submit or track without passing email OTP; rate limits work
- [ ] Wizard collects: NGO details, laptop selections with live stock caps,
      laptop uses, final recipient organisation
- [ ] Partial per-line approval works and decrements stock; rejection restores none
- [ ] Approve/reject/status changes each send the correct email automatically
- [ ] Tracker shows Processing / Preparing / Out for Delivery / Delivered
- [ ] Impact page shows delivered donations with stats
- [ ] Admin can add a laptop with photo upload in under a minute
- [ ] Live on Vercel (co-spark) with all env vars documented
