# Decisions

- **Stack**: Next.js (App Router) + TypeScript + Tailwind, deployed to Vercel.
- **Database**: Neon Postgres (owner-provisioned) + Drizzle ORM — schema in code, `drizzle-kit push` to apply, no SQL editor.
- **Payments**: Stripe Checkout (hosted), 50% deposit, server-side price recomputation. Test-mode keys until bank details are added for live payout activation.
- **Images**: Vercel Blob for admin-uploaded boat photos.
- **Email**: Resend for booking confirmations (owner-supplied API key). Sending domain verification required before customer-facing sends work.
- **Auth**: Auth.js credentials provider, single admin user — no multi-user admin system, matches current scale.
- **Calendar**: Supply treated as unlimited (one boat type today); `blocked_dates` table is the only availability constraint, so real capacity limits can be added later without a schema change.
- **i18n**: next-intl, English + Spanish at launch, localized routes.
- **SEO / AI search**: deferred — flagged by owner as needing dedicated keyword/LLM-visibility research before implementation. Baseline hygiene (metadata, sitemap, schema.org, hreflang) ships anyway.

## Core P1 build-out (fleet/booking/Stripe/admin/email)

- **Pricing is an estimate, not a quote**: no real Cranchi 32 pricing existed. Owner directed
  estimating from the closest public comparable — Windrose Ibiza's own Cranchi Zaffiro 32,
  €968/day peak season — and gave the champagne price (€90) directly. Set full day = €950,
  half day = €600 flat (no seasonal split; schema deliberately has none). Recorded as
  pending-confirmation in `TODOS.md`, not treated as final.
- **Caviar stays unpriced by instruction**: owner said not to price it this pass. The
  booking UI treats price-0 non-included extras as "ask us" text, not a free checkbox — a
  zero price would otherwise let a customer add a real add-on for nothing.
- **Root layout split**: `app/[locale]/layout.tsx` originally rendered `<html>/<body>`
  itself, which only works when every route is under `[locale]`. Adding `/admin` (outside
  that tree) surfaced a "missing root layout tags" failure. Fixed by moving `<html>/<body>`
  and the Google fonts to a real `app/layout.tsx`, with `app/[locale]/layout.tsx` reduced to
  the `NextIntlClientProvider` + WhatsApp bubble. `app/globals.css` moved from
  `app/[locale]/` to `app/` to match.
- **Admin fails closed, not just redirects**: found live that an unset `AUTH_SECRET` let
  `/admin` render with zero session check — next-auth logged a `MissingSecret` error but the
  route still returned 200 with real boat data. Fixed two ways: (1) `requireAdmin()` in
  `lib/auth.ts` explicitly checks `AUTH_SECRET`/`ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` are set
  before ever calling `auth()`, used by every admin server action; (2) the `(protected)`
  layout does the same check and renders a "not configured" message instead of children if
  any are missing. Never rely on `auth()` alone to fail safe.
- **bcrypt hashes need escaping in `.env.local`**: Next.js's env loader does
  dotenv-expand-style `$VAR` substitution, which silently ate the `$2b$10$...` prefix off
  `ADMIN_PASSWORD_HASH` (interpreting `$2b`, `$10` etc. as empty variable references) and
  broke login with no visible error beyond a generic `CredentialsSignin`. Fixed by escaping
  every `$` as `\$` in the stored value.
- **Image upload fallback (superseded, see below)**: `BLOB_READ_WRITE_TOKEN` was never
  supplied, so admin boat image management takes a plain URL + delete rather than a
  `@vercel/blob` file upload widget. Swapping in real upload later shouldn't require a
  schema change.
- **Next's image optimizer flattened a transparent PNG's alpha channel** when re-encoding
  the logo (`sharp`/squoosh re-encode dropped alpha, corner pixel went from `(0,0,0,0)` to
  opaque). Fixed with `unoptimized` on that one `<Image>` — it's a small, already-optimized
  fixed-size asset, optimization wasn't buying anything.
- **Webhook idempotency test uses `stripe.webhooks.generateTestHeaderString`** to post a
  synthetically-signed `checkout.session.completed` event straight at the route handler,
  rather than a live Stripe round-trip — deterministic, no network dependency on Stripe's
  test clock. E2E booking-flow tests stop at the redirect to `checkout.stripe.com` for the
  same reason (Stripe's hosted page is third-party and out of scope to automate).
- **E2E admin test flakiness**: a server action submitted via `<form action={fn}>` doesn't
  trigger a classic full-page navigation, so `.click()` can resolve before the round trip
  finishes — an early version of the boat-edit test raced this and left the seeded boat's
  English description corrupted with a leftover test marker (caught and fixed via
  `db/scripts/restore-description.ts`, one-off, since deleted). Fixed by waiting for the
  actual POST response before reading the field back, and by hardcoding the known-good
  description as a restore target instead of capturing "whatever's on the page now" (which
  is unsafe to trust if a prior run failed mid-test).

## Admin boat image upload (Vercel Blob)

- **Blocker resolved**: `BLOB_READ_WRITE_TOKEN` is now present in `.env.local`. The
  earlier "image upload fallback" decision above no longer applies.
- **Client-side direct upload, not a server action with multipart body**: chosen over
  posting the file through `<form action={addImage}>` because Next's server-action body
  limit (default 1MB) would need raising for marine photography, and the file would still
  stream through the server unnecessarily. The browser PUTs directly to Blob via
  `@vercel/blob/client`; only the resulting URL touches the server action.
- **Do not use Blob's `onUploadCompleted` webhook to persist the row**: it never fires
  against `localhost`, since Vercel can't reach a local dev server — that would silently
  break both local dev and the Playwright suite. The client calls the existing `addImage`
  server action directly with the returned URL instead.
- **Delete the Blob file on image delete, but guard by hostname**: seeded boat images are
  local `/images/*` paths, not Blob URLs — `del()` must only run for
  `*.public.blob.vercel-storage.com` URLs, and a Blob delete failure must not block the DB
  row delete (an unremovable remote file shouldn't wedge the admin UI).
- **`deleteImage` scoped to `boatId`**: pre-existing gap — the action already accepted
  `boatId` but never used it in the `where` clause. Fixed as part of this change since the
  same action is being touched anyway, not as a separate task.
- **Not fixing the `sortOrder` gap**: the add-image form never rendered a `sortOrder`
  input, so every image lands at 0 with no reorder UI. Real but pre-existing and unrelated
  to the upload mechanism — left in `TODOS.md` rather than folded into this change.
