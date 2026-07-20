# TODOs

Tracked deferred work. See `agent-harness/decisions.md` for why things were built the way
they were, and `agent-harness/open-questions.md` for items that need the owner's input
before they can be closed.

## Shipped this pass (core P1 path)

Fleet pages, booking flow, Stripe checkout + webhook (test mode), admin auth + boat CRUD +
bookings list, Resend email confirmations, and a Vitest/Playwright test suite. All verified
live: a real Stripe test-mode payment through to a `confirmed` booking in Neon, a real
confirmation email delivered via Resend, admin login/CRUD exercised in the browser, and
`npx tsc -b` / `npm run build` / `npx vitest run` (18 tests) / `npx playwright test`
(14 tests) all green.

## Shipped mobile admin follow-up

- **[ADMIN-MOBILE-UX] P1 — complete.** The protected admin header no longer overlaps at
  360px, boats/bookings use readable mobile records while preserving desktop tables,
  editor image rows stay contained, and a 360px Playwright regression covers all existing
  admin routes. Separate Evaluator verdict: PASS (`tsc` and build clean, Vitest 18/18,
  Playwright 15/15, focused 360px/1280px checks green).

## Code-complete, blocked on a credential

- **[ADMIN-IMAGE-UPLOAD] P1** — Boat image upload to Vercel Blob is fully built on
  `feat/admin-boat-image-upload` (not yet merged): `app/api/admin/upload/route.ts`
  (auth-gated token route), a client `ImageUpload` component, `deleteImage` now scoped to
  `boatId` and deleting the underlying Blob file. `tsc -b` / `npm run build` /
  `npx vitest run` (21/21) all pass; `npx playwright test` is 14/15 — the one failure is
  **not a code bug**, it's `BLOB_READ_WRITE_TOKEN` in `.env.local` being a literal empty
  string (`BLOB_READ_WRITE_TOKEN=""`), confirmed via a direct `curl` reproduction of
  Vercel Blob's "no read-write token found" error. **Needs a real token** from the
  project's Vercel dashboard → Storage tab → Blob store → `.env.local` tab, pasted into
  both the worktree's and the main repo's `.env.local`. Once set, rerun
  `npx playwright test` to confirm 15/15 and merge the branch. See
  `agent-harness/findings.md` "Follow-up" section for the full trace.

## Owner input required (blocking)

- **[PRICING] P0** — `boats.priceFullDay` / `priceMorning` / `priceAfternoon` are now set to
  an **estimate**, not a real quote: €950 full day / €600 half day, based on the closest
  public comparable (Windrose Ibiza's own Cranchi Zaffiro 32, €968/day peak season). No
  seasonal split exists in the schema (deliberately — see `agent-harness/decisions.md`).
  Needs the owner's real number, ideally with a July/August vs shoulder-season view even if
  the schema stays flat for now.
- **[CAVIAR-PRICE] P0** — Still unpriced at `0` in `extras`, per the owner's explicit
  instruction not to price it this pass. The booking flow shows it as "ask us about this
  one" rather than a free checkbox. Champagne is correctly priced at €90.
- **[WHATSAPP-NUMBER] P0** — Still the intentional placeholder (`34600000000`) in
  `lib/contact.ts`.
- **[DOMAIN] P0** — Still open. Blocks Resend sending-domain verification — customer
  confirmation emails currently only deliver reliably to the account owner's own Resend
  address, not arbitrary customer inboxes. The integration itself is built and verified.
- **[STRIPE-BANK] P2** — Unchanged, not urgent.
- **[FUEL] P3** — Unchanged.
- **[ADMIN-CREDENTIALS-ROTATION]** — The admin password was set via chat during this
  session. Consider rotating it once the owner has a password manager entry for it.

## Not yet built (deferred to a follow-up pass)

- **[ADMIN-EXTRAS] P2** — Extras pricing editor (champagne / caviar / skipper / towel
  toggle) — currently only editable via direct DB access.
- **[ADMIN-BLOCKED-DATES] P2** — Calendar UI over the `blocked_dates` table. The booking
  flow already reads and respects `blocked_dates` (both whole-day and per-slot blocks); only
  the admin authoring UI is missing.
- **[ADMIN-IMAGE-SORT-ORDER] P3** — The boat image add form never renders a `sortOrder`
  input (the server action reads it but nothing sets it), so every image lands at `0` with
  no way to reorder. Pre-existing gap, noticed while building `[ADMIN-IMAGE-UPLOAD]` but
  deliberately left out of that change as unrelated scope.
- **[EXPERIENCIAS-PAGE] P2** — `/experiencias` page (linked in nav, doesn't exist yet).
- **[CONTACTO-PAGE] P2** — `/contacto` page (linked in nav, doesn't exist yet).
- **[LEGAL-PAGES] P2** — `/legal/*` (privacy policy, terms) — needed before taking real
  payments in production.
- **[LIGHTHOUSE-PASS] P2** — No performance/SEO audit run yet (Lighthouse ≥95 target from
  the original spec). Functional E2E coverage exists; performance doesn't yet. The mobile
  review also reproduced Next's LCP warning for the fleet-detail hero image, which should be
  included in this pass.
- **[DEPLOY] P2** — Vercel project setup, env vars mirrored from `.env.local` (including the
  now-generated `AUTH_SECRET`, `STRIPE_WEBHOOK_SECRET` from the *production* Stripe webhook
  endpoint — the current one is a local `stripe listen` secret and won't work in prod),
  domain attached once `[DOMAIN]` is resolved.
- **[CTA-GOLD-FILL] P3** — `bg-gold-500` solid-fill CTA buttons on the homepage hero
  (`app/[locale]/page.tsx`) and fleet detail page (`app/[locale]/fleet/[slug]/page.tsx`)
  violate CLAUDE.md's "gold is an accent only, never a button fill" rule. Same defect was
  fixed on `/reserva` in the `booking-page-design-cleanup` pass; owner deferred fixing the
  other two instances to a follow-up (scope decision recorded in `agent-harness/decisions.md`).

## Newly identified review follow-ups

- **[RATE-LIMITING] P1** — Add rate limits/abuse controls to credential sign-in and the
  public checkout endpoint before production. Today an automated client can repeatedly
  attempt admin passwords or create pending booking rows and Stripe Checkout sessions.
- **[CHECKOUT-FAILURE-CLEANUP] P1** — Checkout inserts the pending booking and extras before
  calling Stripe. If Stripe session creation fails, that pending record is left without a
  `stripe_session_id`. Add a compensating cleanup path or an explicit failed/expired booking
  lifecycle, plus a regression test.
- **[SEO-BASELINE] P1** — Generic metadata exists, but the baseline launch hygiene promised
  below is incomplete: no sitemap, robots route, EN/ES hreflang alternates, or locale-specific
  title/description are present. This does not require the deferred keyword/AI-search research.
- **[DEPENDENCY-AUDIT] P2** — `npm audit` reports 6 moderate advisories (no high/critical),
  currently through the Next/PostCSS and Drizzle/esbuild toolchains. The suggested automatic
  fixes are incompatible downgrades, so triage supported upstream upgrades instead of running
  `npm audit fix --force`.
- **[ADMIN-LOGIN-A11Y] P2** — Admin login inputs are placeholder-only and have no associated
  labels. Add visible or screen-reader labels and keep the current mobile sizing.
- **[LINT-WARNING] P3** — Remove the pre-existing unused `extras` import from
  `app/api/checkout/route.ts`; ESLint is otherwise clean.

## SEO / AI search — deferred, needs dedicated research pass

Flagged by the owner as out of scope for now. Full list in the original build plan
(`/Users/JackEllis/.claude/plans/i-want-to-make-piped-truffle.md`) and
`agent-harness/decisions.md`:
- Keyword research (`alquiler de barcos Ibiza`, `boat rental Ibiza`, long-tail intent)
- Destination landing pages (Formentera, Es Vedrà, Cala Salada, sunset cruise)
- AI search / LLM visibility (`llms.txt`, structured Q&A content, how ChatGPT/Perplexity/
  Google AI Overviews currently source Ibiza charter recommendations)
- Schema.org markup (`LocalBusiness`, `Product`, `Offer`, `AggregateRating`, `FAQPage`)
- hreflang EN/ES pairs, per-locale sitemap, per-boat OG images
- Google Business Profile, Ibiza charter directory citations

Baseline SEO hygiene (metadata, sitemap, robots, hreflang, image alt text — already present
on the seeded boat images) ships as part of normal feature work regardless, not gated on
this research.
