# Findings

## Core P1 path (fleet, booking, Stripe, admin, email)

**Original goal:** Ship the core booking journey — browse the fleet, book a date/slot,
pay a deposit via Stripe, get a confirmation email — plus the minimum admin (auth, boat
CRUD, bookings list) needed to run the business day to day.

**Non-goals (this pass):** Extras pricing editor, blocked-dates admin UI, `/experiencias`,
`/contacto`, `/legal/*`, Lighthouse/performance pass, production deploy, real pricing
(estimated instead, pending owner confirmation), Vercel Blob image upload (no token
supplied — URL-based fallback shipped instead).

**Acceptance criteria:** A customer can go from `/fleet` to a confirmed, paid-deposit
booking with a real-money-shaped Stripe test transaction and receive a confirmation email;
an admin can log in, edit a boat, and see bookings — all server-enforced, not UI-only.

### Test Results
- `npx tsc -b`: 0 errors
- `npm run build`: clean
- `npx vitest run`: 18/18 passing (`lib/pricing.test.ts`, `lib/booking-reference.test.ts`,
  `app/api/webhooks/stripe/route.test.ts` — the last against the real Neon DB with a
  synthetically-signed Stripe event, not a mock)
- `npx playwright test`: 14/14 passing, run twice consecutively to rule out flakiness
- Manual: one real Stripe test-mode payment (`4242...`) end-to-end through `stripe listen`
  → webhook → `confirmed` booking in Neon → Resend email → confirmed received

### Critical Issues (found and fixed during this pass, not shipped)
- `/admin` rendered with **zero auth check** when `AUTH_SECRET` was unset — next-auth
  logged `MissingSecret` but the route still returned the real boats list with a 200. Fixed
  with an explicit env-presence check ahead of every `auth()` call (`requireAdmin()` in
  `lib/auth.ts`, and the same check in the `(protected)` layout) — `auth()` is never trusted
  to fail closed on its own again.
- `/admin` had no `<html>/<body>` ancestor at all — `app/[locale]/layout.tsx` was providing
  it, but `/admin` isn't under `[locale]`. Next.js silently mixed a "missing root tags"
  error page with stale RSC flight data in a way that was easy to misread as working. Fixed
  by splitting into a real `app/layout.tsx` + a slimmer `[locale]` layout.
- `ADMIN_PASSWORD_HASH` in `.env.local` was silently corrupted by Next's dotenv-expand
  variable substitution (`$2b$10$...` read as empty variable references) — login failed
  with a generic `CredentialsSignin` and no indication why. Fixed by escaping `$` as `\$`.
- Logo showed a solid white box instead of a transparent background — Next's image
  optimizer flattened the PNG's alpha channel on re-encode. Fixed with `unoptimized` on
  that `<Image>`.

### Bugs
- None outstanding at time of writing.

### UX Issues
- None outstanding — `SiteHeader` gained a `solid` variant so pages without a dark hero
  (fleet listing, booking flow) don't render illegible white-on-white nav text.

### Missing Requirements
- See `TODOS.md` "Not yet built" — all P2, none block the core booking journey.

### Scope Drift
- None. `@vercel/blob` was deliberately *not* installed since `BLOB_READ_WRITE_TOKEN` was
  never supplied — a URL-input fallback shipped instead rather than building unusable code.

### Rubric Scores
| Area | Score |
|---|---|
| Booking journey works end-to-end (real payment) | Pass |
| Server-side price recomputation (never trusts client) | Pass |
| Admin auth-gated on every route/action | Pass |
| Money always integer cents, single source of truth | Pass |
| i18n (EN/ES) on all new pages | Pass |
| Build/typecheck/test suite green | Pass |

### Verdict
PASS

### Recommended Next Generator Task
P2 backlog in `TODOS.md`, roughly in this order: admin extras pricing editor and
blocked-dates UI (both currently DB-only), `/experiencias` + `/contacto` + `/legal/*`
pages, then a Lighthouse pass and Vercel deploy once `[DOMAIN]` is resolved.
