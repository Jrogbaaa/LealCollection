# Leal Collection

Public marketing and online booking site for Leal Collection, an Ibiza luxury yacht
charter business, with an authenticated admin portal for managing boats and reservations.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Neon Postgres with Drizzle ORM
- Stripe Checkout for the 50% booking deposit
- Resend for booking confirmation emails
- Auth.js credentials authentication for the single admin account
- next-intl for English and Spanish localized routes
- Vitest and Playwright for automated verification

## Current capabilities

- Localized home, fleet, boat-detail, booking, and confirmation routes
- Blocked-date-aware booking flow with server-recomputed integer-cent pricing
- Stripe Checkout creation and signature-verified, idempotent webhook handling
- Customer and owner confirmation emails
- Auth-gated boat CRUD, image records, booking filters, and booking cancellation
- Responsive public and admin layouts, including 360px admin regression coverage

The remaining launch work, credential blockers, and owner decisions are tracked in
[TODOS.md](./TODOS.md). Important implementation decisions and test evidence live in
[agent-harness](./agent-harness/).

## Local setup

Install dependencies:

```bash
npm ci
```

Create `.env.local` with the required local credentials:

```dotenv
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
AUTH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
E2E_ADMIN_PASSWORD=
```

`E2E_ADMIN_PASSWORD` is only needed for authenticated admin Playwright coverage. Keep all
secrets in `.env.local` and the matching Vercel environment variables; never commit them.
When storing a bcrypt hash locally, escape each `$` as `\$` because Next.js expands dollar
expressions while loading environment files.

Start the development server:

```bash
npm run dev
```

The public site is available at `http://localhost:3000/en` and `/es`; the admin entry point
is `http://localhost:3000/admin`.

## Database

The schema source of truth is [`db/schema.ts`](./db/schema.ts). Apply schema changes only
through Drizzle:

```bash
npm run db:push
npm run db:seed
```

Do not make schema changes through a SQL console. All monetary values are stored as integer
cents, and `lib/pricing.ts` is the single pricing source of truth.

## Verification

```bash
npx tsc -b
npm run lint
npm run build
npx vitest run
npx playwright test
```

The latest admin-mobile pass completed with a clean TypeScript/build result, 18/18 Vitest
tests, and 15/15 Playwright tests. See
[`agent-harness/findings.md`](./agent-harness/findings.md) for the evaluator record.

## Deployment

The intended target is Vercel. Before production, complete the `[DEPLOY]` and owner-input
items in [TODOS.md](./TODOS.md), use a production Stripe webhook secret rather than the
local `stripe listen` secret, configure the sending domain in Resend, and add the legal and
baseline SEO routes.
