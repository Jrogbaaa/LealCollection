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

## Admin image upload follow-up

- **[ADMIN-IMAGE-UPLOAD] P1 — complete, shipped via PR #5.** The desktop/mobile Boats list
  now exposes `Manage photos`, which deep-links to a labelled uploader above the existing
  gallery. The valid public-store Blob token is configured outside Git in Vercel Production
  + Preview. TypeScript/build pass, Vitest is 25/25, Playwright is 18/18, and a separate
  Evaluator passed the real upload lifecycle. After Vercel deployed `main`, the same flow
  passed on the live URL: authenticated upload, public Blob URL, admin render, public fleet
  render, UI delete, zero matching database rows, and an empty Blob store after cleanup.

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
- **[DOMAIN] P0** — Email side resolved; website domain deferred by owner. Resend already
  has a **verified** sending domain (`hakaglobal.com`), and `RESEND_FROM_EMAIL` is now set in
  Vercel Production to `Leal Collection <no-reply@hakaglobal.com>`, so confirmation emails
  deliver to arbitrary customer inboxes (verified live: a test send from that domain to a
  non-owner Gmail returned 200). Remaining, non-blocking: (1) the site runs on the default
  `leal-collection.vercel.app` domain — attach a custom domain later; (2) sender shows
  `hakaglobal.com`, not a Leal-branded domain — verify a `lealcollection.com` domain in Resend
  when brand alignment matters.
- **[STRIPE-BANK] P2** — Unchanged, not urgent. Gates live charges/payouts only, not test-mode.
- **[FUEL] P3** — Unchanged.
- **[ADMIN-CREDENTIALS-ROTATION]** — The admin password was set via chat during this
  session. Consider rotating it once the owner has a password manager entry for it.

## Not yet built (deferred to a follow-up pass)

- **[ADMIN-EXTRAS] P2** — Extras pricing editor (champagne / caviar / skipper / towel
  toggle) — currently only editable via direct DB access.
- **[ADMIN-IMAGE-SORT-ORDER] P3** — The boat image add form never renders a `sortOrder`
  input (the server action reads it but nothing sets it), so every image lands at `0` with
  no way to reorder. Pre-existing gap, noticed while building `[ADMIN-IMAGE-UPLOAD]` but
  deliberately left out of that change as unrelated scope.
- **[LEGAL-PAGES] P2** — `/legal/*` (privacy policy, terms) — needed before taking real
  payments in production.
- **[LIGHTHOUSE-PASS] P2** — No performance/SEO audit run yet (Lighthouse ≥95 target from
  the original spec). Functional E2E coverage exists; performance doesn't yet. The mobile
  review also reproduced Next's LCP warning for the fleet-detail hero image, which should be
  included in this pass.
- **[DEPLOY] P2** — Mostly done. Vercel project `ja-ck/leal-collection` is live at
  `leal-collection.vercel.app`, GitHub push-to-deploy is connected, and all env vars are
  mirrored into Production (incl. `RESEND_FROM_EMAIL`). Public routes, admin auth-gating, and
  image optimization verified 200 on the live site. **Still outstanding:** (1)
  `STRIPE_WEBHOOK_SECRET` in prod is still the local `stripe listen` secret — create a
  production webhook endpoint at `https://leal-collection.vercel.app/api/webhooks/stripe` and
  paste its `whsec_…` (works in test mode now, no bank needed), so the booking→email chain
  actually fires; (2) custom domain deferred (see `[DOMAIN]`).
## Shipped via PR #4 (`feat/top-fixes-batch`)

- **[ADMIN-BLOCKED-DATES]** — `/admin/blocked-dates` admin UI (list / add / remove whole-day
  blocks) over `blocked_dates`; nav link added; verified end-to-end (a blocked date makes
  `/api/checkout` return 409 `date_unavailable`). Per-slot authoring still deferred.
- **[EXPERIENCIAS-PAGE] / [CONTACTO-PAGE]** — `/experiencias` and `/contacto` built as
  localized (EN/ES) on-brand stub pages; the header links no longer 404.
- **[CTA-GOLD-FILL]** — all five remaining `bg-gold-500` button fills removed (homepage hero,
  fleet detail reserve, admin new/edit/login) → navy `bg-marine-950` (login uses `bg-sand-50`
  on its dark bg). Zero `bg-gold-500` button fills remain repo-wide.
- **[CHECKOUT-SLOT-PRICE]** — checkout now gates on the *selected slot's* price
  (`slotPrice(boat, slot) <= 0`), closing the morning/afternoon under-charge; plus real-date
  and integer-guests validation return 400 instead of 500.
- **[WEBHOOK-ATOMIC]** — Stripe webhook confirm is a single conditional
  `UPDATE … WHERE status='pending' RETURNING`, so duplicate deliveries can't double-send email.
- **[EMAIL-ESCAPE]** — customer name/email/phone (and boat name) are HTML-escaped in the
  confirmation emails.

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
