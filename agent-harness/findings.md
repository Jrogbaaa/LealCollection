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

## Admin boat image upload (Vercel Blob)

**Original goal:** Replace the admin's paste-a-URL image input with a real file upload to
Vercel Blob, so the admin can add boat photos directly from their machine, in
`/admin/boats/[id]/edit`.

**Non-goals:** Image reordering / `sortOrder` fix, multi-file/drag-and-drop upload, image
cropping/resizing/compression, DB schema changes, changes to public `/fleet` rendering.

**Acceptance criteria:** Upload lands as a `boat_images` row with a
`*.public.blob.vercel-storage.com` URL and renders on admin + `/fleet`; delete removes both
DB row and Blob file (skipping non-Blob seeded paths); `deleteImage` scoped to `boatId`;
`tsc -b` / `npm run build` / `npx vitest run` all pass; `e2e/admin.spec.ts` gets a working,
self-cleaning upload test.

### Test Results
- `npx tsc -b`: 0 errors
- `npm run build`: clean, `/api/admin/upload` registered as a route
- `npx vitest run`: 21/21 passing (18 pre-existing + 3 new `lib/blob.test.ts`)
- `npx playwright test`: **fails to run at all** — exit code 1, zero tests executed.
  `e2e/admin.spec.ts` uses `fileURLToPath(import.meta.url)` for `__dirname`, but this
  project's `package.json` has no `"type": "module"` and Playwright transforms `.ts` test
  files to CommonJS by default, where `import.meta` is a syntax error
  (`SyntaxError: Cannot use 'import.meta' outside a module`). This crashes the whole test
  file load, which takes down the **entire** e2e suite — not just the new upload test.
  Confirmed reproducible: ran twice, same failure both times, Node v26, Playwright 1.61.1.
- `E2E_ADMIN_PASSWORD` is **not set** in `.env.local` — even if the import.meta bug were
  fixed, the entire `admin CRUD` describe block (including the new upload test) would be
  skipped, so this test currently provides zero real coverage regardless.

### Critical Issues
1. **E2E suite regression (blocking):** `e2e/admin.spec.ts` line ~4-6 (`const __dirname =
   path.dirname(fileURLToPath(import.meta.url));`) breaks module loading under this repo's
   CommonJS-mode Playwright config, taking the previously-passing 14/14 suite to 0/14.
   Fix is trivial: plain `__dirname` already works in Playwright's CJS-transformed test
   files — no `import.meta`/`fileURLToPath` needed. This must be fixed before merge; it's
   not a pre-existing issue, it's introduced by this change.
2. **No real coverage of the new feature:** independent of bug #1, `E2E_ADMIN_PASSWORD` is
   absent from `.env.local`, so the admin CRUD block is skipped entirely. The upload path
   has never actually been exercised end-to-end in this worktree. Not a code defect, but
   the spec's claim of "gets a new upload case" is currently aspirational, not verified.

### Bugs
- See Critical Issue #1 above (same bug, blocking).

### Security review (upload route, delete guard)
- `app/api/admin/upload/route.ts`: `requireAdmin()` is called inside `onBeforeGenerateToken`,
  which `handleUpload` (per `@vercel/blob/client`) must resolve before a client token is
  minted; the throw is caught by the route's try/catch and returns 401 with no token issued.
  No path returns a valid token without hitting `requireAdmin()` first. `requireAdmin()`
  itself fails closed if `AUTH_SECRET`/`ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` are unset, matching
  the existing pattern from the auth incident in `decisions.md`. Correctly gated.
- `lib/blob.ts` `isBlobUrl()`: parses with `new URL()` and checks
  `hostname.endsWith(".public.blob.vercel-storage.com")` — robust against string-matching
  bypasses (e.g. `...vercel-storage.com.evil.com` as a *path*, not hostname, wouldn't fool
  this since `.hostname` is the real parsed authority). Correctly excludes seeded
  `/images/*` relative paths (throws in `new URL()`, caught, returns false).
- `lib/blob.test.ts`: 3 tests cover the real Blob URL case, a seeded local path, and an
  unrelated external domain. Reasonable, not superficial, but thin — no test for a malformed
  URL string or a hostname-spoofing attempt (e.g. `https://x.public.blob.vercel-storage.com.attacker.com/`).
  Worth adding but not a blocker given `URL().hostname` semantics already make that class of
  bypass structurally impossible.
- `deleteImage`: now correctly scoped by `and(eq(id), eq(boatId))` on both the select and the
  delete. Blob delete failure is caught and logged as `{ imageId }` only — no secrets, no
  connection strings, no tokens logged anywhere in the diff (checked `route.ts`, `actions.ts`,
  `blob.ts`).
- `addImage` (unmodified): still validates non-empty `blobUrl` before insert. Client
  component (`image-upload.tsx`) correctly threads `blob.url` from `@vercel/blob/client`'s
  `upload()` into `FormData` and calls the bound server action. Data flow traced end-to-end,
  no gaps.

### UX Issues
- None found in the upload form itself (loading state, error display, field reset on
  success all present).

### Missing Requirements
- Working, passing e2e coverage for the upload flow — not currently met (see Critical
  Issues).

### Scope Drift
- None. Changes match spec.md and featurelist.json exactly; `sortOrder` gap correctly left
  alone per non-goals.

### Rubric Scores
| Area | Score |
|---|---|
| 0. Goal Alignment | 3 (implementation is right, but claimed test coverage doesn't exist/run) |
| 1. Requirement Fit | 4 |
| 2. Simplicity | 5 |
| 3. User Workflow | 4 (untested end-to-end via Playwright, but manual trace looks correct) |
| 4. Data Integrity | 5 |
| 5. Error Handling | 4 |
| 6. Security / Privacy | 5 |
| 7. Maintainability | 4 |

Average: 4.25, but Goal Alignment < 4 and a critical bug is present — both independently fail the pass rule.

### Verdict
**NEEDS REVISION**

Did this accomplish the stated goal? Mostly — the upload mechanism, auth gate, and delete
guard are all correctly implemented and pass code review. But the spec's explicit
acceptance criterion "`e2e/admin.spec.ts` has a new upload case that cleans up its own
uploaded file" is not actually true right now: the test file doesn't load, and even if
fixed, it would be skipped for lack of `E2E_ADMIN_PASSWORD`. That's a critical, blocking
regression (0/14 e2e tests run, down from 14/14) — cannot pass as-is.

### Recommended Next Generator Task
1. Fix `e2e/admin.spec.ts`: replace `path.dirname(fileURLToPath(import.meta.url))` with
   plain `__dirname` (already valid in Playwright's CJS-transformed `.ts` test files) —
   remove the now-unused `fileURLToPath`/`node:url` import.
2. Re-run `npx playwright test` and confirm the full suite (14 pre-existing + 1 new = 15)
   passes.
3. Set `E2E_ADMIN_PASSWORD` in `.env.local` (or confirm with the owner it's set) so the
   admin CRUD block — including the new upload test — actually runs instead of being
   skipped, and get one real green run recorded in `session.md` before calling this done.

## Follow-up: revision pass after Evaluator findings above

**Fixed:** `e2e/admin.spec.ts` — removed `fileURLToPath(import.meta.url)`, using plain
`__dirname` instead (Playwright transforms `.ts` tests to CommonJS, where `__dirname` is
natively available; no `import.meta` needed). This was the correct fix per the Evaluator's
recommendation.

**Also found and fixed independently:** a leftover `next dev` process on port 3000, started
outside this session against the *main repo* (not the worktree), meant every prior
Playwright run — including the Evaluator's — was silently testing stale code via
`reuseExistingServer: true` in `playwright.config.ts`. Killed with the user's explicit
confirmation (`AskUserQuestion`), freeing port 3000 for the worktree's own dev server. This
explains why the Evaluator's report characterized `E2E_ADMIN_PASSWORD` as absent from
`.env.local` when it is in fact present — likely a side effect of the same stale-server
confusion or a separate read discrepancy; confirmed present and byte-identical between the
worktree's `.env.local` and the main repo's via `diff`.

**Result after both fixes:** `npx playwright test` — **14/15 passing.** All 14 pre-existing
tests green. The new upload test progresses much further (finds the file input, fills alt
text, submits) but fails at the assertion that the uploaded image becomes visible.

**Root cause of the remaining failure — a real, separate blocker, not a code defect:**
`BLOB_READ_WRITE_TOKEN` in `.env.local` (both the worktree's copy and the main repo's
source file) is set to a literal empty string — `BLOB_READ_WRITE_TOKEN=""` — not a real
Vercel Blob token. Confirmed directly: `curl -X POST /api/admin/upload` with a valid
`generate-client-token` payload returns `{"error":"Vercel Blob: No read-write token
found..."}`. The Playwright test's on-page error text ("Vercel Blob: Failed to retrieve
the client token") is the client-side symptom of this same server-side error. This
contradicts `TODOS.md`'s prior note that the token was "now supplied" — the *key* exists
in `.env.local`, but its *value* was never actually filled in.

**Decision (owner confirmed via AskUserQuestion):** ship the code as complete rather than
block on obtaining a real token right now. `deleteImage`'s Blob-hostname guard, the
upload route's auth gate, and the full data-flow trace were already reviewed clean by the
Evaluator above and are unaffected by this — the only thing not yet verified is a live
round-trip to real Vercel Blob storage.

### Updated Verdict
**PASS, with one documented external blocker.** All code-level acceptance criteria are
met: `tsc -b` clean, `npm run build` clean, `npx vitest run` 21/21, `npx playwright test`
14/15 (the one failure is attributable solely to a missing real credential, not a code
bug — confirmed via direct `curl` reproduction of the exact same server-side error
independent of Playwright/the browser). Recorded in `TODOS.md` as a new blocking item
requiring the owner to supply a real `BLOB_READ_WRITE_TOKEN` from their Vercel project's
Storage tab before the upload path (and its Playwright test) can be verified end-to-end
and closed out.

## Booking page design cleanup (/reserva)

**Original goal:** Fix three concrete, verified defects on `components/booking-flow.tsx`:
(1) react-day-picker calendar accent color rendering as pure blue instead of brand
marine-700/gold-600, (2) the "included"/"ask us" extras rendering as disconnected
caption-sized `<p>` tags below the priced checkbox grid instead of styled rows in the same
grid, (3) the primary CTA using `bg-gold-500` (a solid gold fill), which violates CLAUDE.md
§4 ("gold is an accent, never a button fill").

**Non-goals:** the same `bg-gold-500` violation on the homepage hero / fleet detail page
(explicitly deferred by owner decision); pricing the caviar extra (open, unaffected — the
"price on request" pattern stays, only presentation/copy changed); any change to booking
logic, pricing calculation, Stripe checkout, or blocked-dates behavior; any change to
`/reserva/gracias`, fleet pages, or admin.

**Acceptance criteria:** `getComputedStyle` on `.rdp-root`'s `--rdp-accent-color` resolves
to marine-700 (not blue); today marker/nav chevrons render in brand colors; included/ask-us
extras render as styled rows in the same card grid as priced extras; `askUsExtra` copy
reworded in both `en.json`/`es.json`; CTA uses `bg-marine-950`/`hover:bg-marine-900`/
`text-sand-50` with no `bg-gold-500` remaining on `/reserva`; `tsc -b`, `npm run build`,
`npx vitest run` all pass; relevant Playwright booking-flow spec passes.

### Test Results
- `npx tsc -b`: 0 errors
- `npm run build`: clean (Turbopack, all 15 routes compiled)
- `npx vitest run`: 18/18 passing across 3 test files
- `npx playwright test`: **14/14 passing** — `e2e/admin.spec.ts` (5), `e2e/booking-flow.spec.ts`
  (2, including the golden-path "fills through to a Stripe Checkout redirect with the right
  amount" test and the URL-sharing test), `e2e/public-site.spec.ts` (7). No test referenced
  the old extras `<p>`-tag markup, so none broke from the DOM restructuring.
- Infra note: a stray `next dev` process from the **main repo directory** (not this
  worktree) was found bound to port 3000 before the first run, which would have caused
  Playwright to silently test stale pre-fix code via `reuseExistingServer: true`. Killed it
  (and a leftover port-3001 process from an earlier aborted worktree run) before the run
  reported above; the 14/14 result is against the worktree's own dev server.

### Live verification (adversarial, not just test-suite trust)
- `grep -n "gold-500" components/booking-flow.tsx` → no matches. CTA button classes
  confirmed as `bg-marine-950 ... hover:bg-marine-900 ... text-sand-50`.
- Read the diff directly: `includedExtras`/`askUsExtras` now map to `<div>` rows with the
  same `bg-sand-50 p-5 flex items-center justify-between` treatment as the priced
  `<label>` checkbox rows, and both `.map()` blocks live inside the same
  `<div className="mt-4 grid ... sm:grid-cols-2">` container as the priced extras — not
  separate paragraphs below it, as spec required.
- Loaded `/en/reserva` in a real browser and ran `getComputedStyle(document.querySelector('.rdp-root'))`:
  `--rdp-accent-color` = `#1b6699`, `--rdp-today-color` = `#a8814f`. Cross-checked against
  `app/globals.css`: `--color-marine-700: #1b6699` and `--color-gold-600: #a8814f` — exact
  match, confirmed not blue (`rgb(0,0,255)`/`#0000ff`). The fix (moving the CSS variable
  override onto `DayPicker`'s own `style` prop instead of a wrapper `<div>`) works because
  it sets the variable directly on `.rdp-root` itself as an inline style, which beats
  react-day-picker's own internal `--rdp-accent-color: blue` declaration on that same
  element via specificity/source order — inline styles win regardless of the `@layer`
  unlayered-CSS issue described in spec.md.
- `askUsExtra` reworded in both locales: `en.json` → "Available on request",
  `es.json` → "Disponible a consultar". Neither retains dev-note phrasing.

### Critical Issues
None found.

### Bugs
None found.

### UX Issues
None found. The extras section now reads as a coherent grid of rows (priced, included,
ask-us) rather than a priced grid followed by orphaned captions.

### Missing Requirements
None — all three defects and both locale copy changes are present and verified.

### Scope Drift
None. The homepage/fleet-detail `bg-gold-500` CTA (explicitly out of scope) was left
untouched; only `components/booking-flow.tsx`, `messages/en.json`, and `messages/es.json`
were changed, matching spec.md's stated approach exactly. No changes to pricing, Stripe,
blocked-dates, `/reserva/gracias`, fleet pages, or admin.

### Rubric Scores
| Area | Score |
|---|---|
| Goal Alignment | 5 |
| Requirement Fit | 5 |
| Simplicity | 5 |
| User Workflow | 5 |
| Data Integrity | 5 (no data touched — correctly out of scope) |
| Error Handling | N/A (no new error paths introduced) |
| Security / Privacy | 5 (no PII/secrets touched) |
| Maintainability | 5 |

### Closing Question
**Did this accomplish the stated goal?** Yes. All three verified defects are fixed, the
fix for the calendar color bug is durable (inline style beats react-day-picker's own
unlayered override, verified via live `getComputedStyle`, not just visual inspection), the
extras section reads as intentional design rather than leftover text, and the CTA now
complies with CLAUDE.md's gold-is-accent-only rule. No regressions in the existing 14
Playwright tests, and no scope drift beyond the three approved fixes.

### Verdict
**PASS.**

### Recommended next step (not a blocker for this pass)
Log the deferred homepage-hero / fleet-detail-page `bg-gold-500` CTA violation as a
`TODOS.md` item (per spec.md's non-goals note) if not already tracked there, so it isn't
lost as a follow-up design-cleanup pass.
