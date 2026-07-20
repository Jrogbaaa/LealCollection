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

## Logo visibility, mobile nav, booking-flow mobile UX

**Original goal:** Make the header logo legible on every background (especially the dark
hero, where the navy mark nearly disappears), add a real logo to admin pages that currently
have none, add a mobile nav menu (there is none below `md`), and make `/reserva`'s
multi-step structure visible and navigable on mobile (no step indicator, no scroll cues, CTA
buried below all four sections).

**Non-goals:** Commissioning a new logo asset (CSS filter on the existing `logo.webp`
instead); any change to booking/pricing/Stripe/`blocked_dates` logic; any change to
`/reserva/gracias`; the already-deferred sitewide `bg-gold-500` CTA violations on
homepage/fleet detail; rebuilding the booking flow into a JS-driven step wizard.

**Acceptance criteria (featurelist.json):** `getComputedStyle` confirms the logo filter
(`brightness(0) invert(1)`) on the transparent header variant, not eyeballed; full
navy/gold color unchanged on the solid variant; logo appears on admin login and admin
protected layout (previously text-only); hamburger menu appears below `md`, opens/closes,
links navigate, keyboard-focusable; on `/reserva` mobile, date selection auto-scrolls to
slot section, slot selection auto-scrolls to extras section, `prefers-reduced-motion` skips
smooth scroll; step-progress indicator visible and reflects state; sticky mobile CTA bar
present throughout, swaps to real pay button once complete; calendar doesn't clip at 360px;
`tsc -b`/`build`/`vitest`/`playwright` all pass; zero new console errors.

Worktree evaluated: `/Users/JackEllis/worktrees/logo-mobile-flow` (branch
`feat/logo-mobile-flow`), diff against `main`, uncommitted working-tree changes across 7
files (191 insertions / 37 deletions).

### Test Results
- `npx tsc -b`: 0 errors
- `npm run build`: clean, all 15 routes compiled (Turbopack)
- `npx vitest run`: 18/18 passing (unchanged — no pricing/logic touched, correctly no new
  unit tests added)
- `npx playwright test`: **14/14 passing** — but this is the pre-existing suite unchanged.
  **No new Playwright spec was added for any of this change's new behavior** (logo filter,
  hamburger menu, auto-scroll, step rail, sticky CTA bar, the overflow fix). All of the
  claims below were verified live, out-of-band, via Playwright MCP browser tooling against
  the worktree's own dev server (confirmed on port 3001, matched by inspecting raw HTML
  `width`/`height`/`style` attributes against the source diff) — not by an automated
  regression test that will catch a future break.
- Zero console errors observed across every page/interaction exercised below (one
  pre-existing, unrelated LCP-loading warning on `/en/fleet` about the hero image, present
  on `main` too — not a new error from this change).

### Live verification (adversarial, not just eyeballing)
- **Logo filter, transparent variant:** `getComputedStyle` on the header `<img>` at
  `/en` → `filter: "brightness(0) invert(1)"`, `48px × 48px` (mobile-width box). Same on
  `/en/fleet/cranchi-32` (boat detail, also transparent) → `brightness(0) invert(1)`.
- **Logo filter, solid variant:** `/en/fleet` → `filter: "none"`. `/en/reserva` →
  `filter: "none"`. Both correct per spec.
- **Admin logo:** scripted a real login (credentials read from `.env.local`, never
  printed) — `/admin/login` renders the logo with `filter: brightness(0) invert(1)` (dark
  `bg-marine-950`); after login, `/admin/boats`' protected-layout header renders the logo
  with `filter: none` (light `bg-white`). Both previously text-only, now both have a real
  `<img>`, both correctly matched to their background.
- **Horizontal overflow claim (decisions.md):** verified independently rather than trusted.
  At 360px viewport on the **unmodified `main` branch** (separate running dev server, port
  3000, confirmed on `main` via `git branch --show-current`), `document.body.scrollWidth` =
  376 vs `window.innerWidth` = 360 → **16px overflow, reproduced**. Same check on this
  worktree's branch at 360px: `scrollWidth` = `innerWidth` = 360 → **0px overflow**. The
  decisions.md claim is accurate and the fix works.
- **Mobile nav (hamburger):** at 360px on `/en` (transparent variant), clicking the
  hamburger reveals a panel with all 4 links (Fleet/Experiences/Contact/Reserve); clicking
  a link navigates and closes the panel. Confirmed keyboard-focusable (native `<button>`
  and `<a>` elements, no `tabindex="-1"` or similar).
  **However:** the spec explicitly requires the menu "closes on selection **or outside
  tap**." Outside-tap close is **not implemented** — confirmed both by reading the diff (no
  `mousedown`/`pointerdown`/click-outside listener anywhere in the component, no `useEffect`
  wiring one up) and behaviorally (dispatched a real click on `document.body` while the
  panel was open; the panel remained in the DOM, unclosed). This is a genuine, confirmed gap
  against an explicit spec.md line, not a nitpick — a mobile user who opens the menu and
  taps elsewhere on the page (the natural dismiss gesture) gets a menu stuck open over the
  page content. Also no Escape-key handler.
- **Booking flow step rail:** on `/en/reserva` at 375px, the rail renders "1. Choose a
  date / 2. Choose a time / 3. Add extras / 4. Your details" (via the existing
  `stepDate`/etc. keys, correctly localized structure). Before any selection, step 1 is
  "current" (marine fill). After selecting a date, step 1 flips to "done" (gold border/text)
  and step 2 becomes "current" (marine fill) — reflects state correctly.
- **Auto-scroll:** clicking an enabled calendar date auto-scrolled the page so
  `#slot-section`'s bounding-rect top landed at 64px (in-view, just below the sticky rail) —
  confirmed via `getBoundingClientRect()` immediately after the click, not a fixed sleep.
  `prefers-reduced-motion` handling confirmed in source (`window.matchMedia(...).matches`
  gates `behavior: "smooth"` vs `"auto"`); not independently re-verified with the media
  feature actually toggled in the browser (would require CDP emulation not exercised in this
  pass), but the code path is a one-line ternary and unambiguous on inspection.
- **Sticky mobile CTA bar:** present at 375px throughout, `md:hidden`. Before a date is
  picked: "Select a date to see pricing / Continue". After picking a date (which
  auto-selects the only open slot on this seed data) but before filling the details form:
  still "Continue" (correctly not yet the pay button — form incomplete). After filling
  name/email/phone/guests via real Playwright `fill()` calls: bar text becomes "Deposit due
  today (50%) €475 / Pay deposit — €475", `type="submit"`, and the equivalent desktop
  `<aside>` button also flips from disabled to enabled at the same moment — both driven by
  the same `canSubmit` boolean, no duplicated validation logic. Matches spec exactly.
- **Calendar clipping:** `DayPicker` is wrapped in `overflow-x-auto` per the diff; combined
  with the `min-w-0` overflow fix above, no clipping observed at 360px in the live browser
  check (calendar grid fully visible, no horizontal scrollbar on the page).

### Critical Issues
None. (The outside-tap-close gap below is a confirmed, real miss against an explicit spec
requirement, but it is not a critical/blocking defect — the menu is still fully usable via
selecting a link, which is the primary path — so it's tracked as a Missing Requirement, not
a Critical Issue.)

### Bugs
None found that affect correctness of data, pricing, or navigation. See UX Issues for the
one real gap.

### UX Issues
- **Mobile nav does not close on outside tap**, contradicting spec.md's explicit "closes on
  selection or outside tap." A user who opens the menu and taps the hero/page behind it
  (the natural way to dismiss almost any mobile dropdown) is left with the panel stuck open
  until they either pick a link or resize past `md`. Low effort to fix (one `useEffect` with
  a `mousedown`/`pointerdown` listener checking `event.target` against a `ref`, or a
  full-panel-height invisible backdrop `<div>` behind the nav that closes on click).

### Missing Requirements
- Outside-tap-close on the mobile hamburger menu (see UX Issues) — spec.md line item, not
  met.
- No new Playwright coverage was added for any of this pass's new behavior (logo filter,
  hamburger open/close, auto-scroll, step rail, sticky CTA, the overflow fix). Everything
  was verified manually in this evaluation pass via Playwright MCP tooling, which is not
  automated regression protection — a future change could silently reintroduce the overflow
  bug, break the auto-scroll, or regress the logo filter and nothing in `npx playwright
  test` would catch it. `session.md` acknowledges this was "manually driven via Playwright
  MCP," but the featurelist/spec's acceptance criteria don't explicitly demand new automated
  specs, so this is noted as a gap worth closing rather than a spec violation.

### Scope Drift
None. Diff touches exactly the 7 files named in the task (`site-header.tsx`, both admin
files, `booking-flow.tsx`, `reserva/page.tsx`, both message files) plus the documented,
justified `min-w-0` overflow fix — which decisions.md correctly frames as a pre-existing bug
found and fixed while already touching the same layout, not unrelated scope creep. No
pricing/Stripe/blocked-dates/`/reserva/gracias` files touched.

### Rubric Scores
| Area | Score |
|---|---|
| 0. Goal Alignment | 4 (all three stated goals — logo, mobile nav, booking-flow mobile UX — are substantively delivered and verified live; docked from 5 for the outside-tap gap and missing automated coverage) |
| 1. Requirement Fit | 4 (one explicit spec line — outside-tap close — not met) |
| 2. Simplicity | 5 (imperative scroll calls in click handlers, not effects; `position: fixed` sticky bar deliberately kept out of grid/flex flow instead of needing extra overflow fixes; no wizard rebuild) |
| 3. User Workflow | 4 (booking flow mobile UX is genuinely improved and verified working end-to-end; the stuck-open menu is a real but minor friction point) |
| 4. Data Integrity | 5 (no data paths touched; sticky bar and desktop submit share one `canSubmit` boolean, no duplicated validation) |
| 5. Error Handling | 5 (guests-over-capacity message still renders; disabled-state handling on both submit buttons correct) |
| 6. Security / Privacy | 5 (admin credentials read from `.env.local` and never printed in this evaluation; no PII/secrets in the diff) |
| 7. Maintainability | 5 (clear component structure, reused existing translation keys, `STEP_KEYS` array avoids repetition) |

Average: 4.6.

### Closing Question
**Did this accomplish the stated goal?** Substantially yes — the logo is now legible on
every background (verified via `getComputedStyle`, not eyeballing, on all 4 page/variant
combinations plus both admin pages), the pre-existing 360px overflow bug is genuinely fixed
(reproduced 16px overflow on `main`, confirmed 0px on this branch), and the booking flow's
step structure, auto-scroll, and sticky CTA all work as specified and were independently
verified. The one real miss is the outside-tap-close requirement on the mobile menu, which
is explicit in spec.md and simply wasn't built.

### Verdict
**NEEDS REVISION**

Goal Alignment scores 4 (meets the ≥4 bar), and the average (4.6) clears ≥4, and there are
no critical bugs or privacy failures — but "all high-priority acceptance criteria satisfied"
is not true: the mobile-nav outside-tap-close is explicitly named in spec.md's "What success
looks like" and is verifiably absent. Per the Pass Rule, all of the listed conditions must
hold, so this does not clear the bar as-is. This is a small, well-scoped gap, not a
fundamental rework.

### Recommended Next Generator Task
1. In `components/site-header.tsx`, add outside-tap dismissal to the mobile menu: either (a)
   a `useEffect` that adds a `mousedown`/`pointerdown` listener on `document` while
   `menuOpen` is true, checks `event.target` against a `ref` on the nav panel (and the
   toggle button, to avoid double-toggling), and calls `setMenuOpen(false)` on an outside
   hit — removing the listener on close/unmount; or (b) a full-viewport invisible backdrop
   `<div>` rendered behind the panel (below it in the DOM, `fixed inset-0`, `z-index` under
   the panel) with an `onClick={() => setMenuOpen(false)}`. Also add an `Escape` keydown
   handler while open, since spec.md calls out keyboard-focusable and a stuck-open menu
   dismissible only by picking a link is a keyboard trap in practice.
2. Re-verify with the same live check used in this evaluation: open the menu at ≤375px,
   dispatch a real click outside the panel, confirm it closes; confirm it still closes on
   link selection (no regression); confirm `Escape` closes it and returns focus to the
   toggle button.
3. Optional but recommended, not a blocker: add a small Playwright spec (or extend
   `e2e/public-site.spec.ts`) covering hamburger open → outside-tap-close and open →
   link-navigates, plus a `document.body.scrollWidth <= innerWidth` assertion at 360/375px
   on `/reserva`, so this pass's fixes have automated regression protection instead of
   relying on the Evaluator's one-time manual pass.

## Re-verification: outside-tap / Escape close fix (2026-07-20)

**Scope of this pass:** re-verify only the single outstanding item from the prior NEEDS
REVISION verdict above — the mobile hamburger menu did not close on outside tap or Escape.
Everything else in the prior pass (logo filter, admin logos, overflow fix, step rail,
auto-scroll, sticky CTA) was already verified PASS-equivalent and was not re-checked here.

**Fix applied by Generator:** `components/site-header.tsx` now has a `headerRef` on the
`<header>` element and a `useEffect` keyed on `menuOpen` that, only while the menu is open,
adds a `pointerdown` listener (closes if `e.target` is outside `headerRef.current`) and a
`keydown` listener (closes on `Escape`), both on `document`, with both listeners removed in
the effect's cleanup function.

### Structural review
- Listener lifecycle is correct: `if (!menuOpen) return;` at the top of the effect means no
  listeners are ever attached while the menu is closed; the returned cleanup function always
  removes both listeners, covering both the "menu closes" and "component unmounts while menu
  open" cases. No leak.
- Outside-tap detection uses `headerRef.current.contains(e.target)` — since the mobile nav
  panel (`<nav>` with the links) is rendered *inside* `<header ref={headerRef}>`, a tap on a
  link inside the open panel is "inside" the header, so the `pointerdown` handler does not
  fire `setMenuOpen(false)` itself; the existing per-`<Link>` `onClick={() => setMenuOpen(false)}`
  still does the closing for that case, so the two mechanisms don't fight each other.
- Desktop nav (`hidden md:flex`) has no `menuOpen`-gated markup or handlers of its own — the
  new listeners only affect the `menuOpen` boolean and the mobile-only conditional panel, so
  desktop rendering/behavior is unaffected. Confirmed by reading the full diff; no changes
  outside the described `useEffect`, `headerRef`, and its wiring onto `<header ref={headerRef}>`.

### Live verification (Playwright MCP, 375×700 viewport)
Both dev servers were already running (worktree on :3001, main repo on :3000 — unrelated,
left alone). Tested both header variants:

**Transparent header (`/en`):**
- (a) Hamburger click opens the panel (button toggles "Open menu" → "Close menu", 4 links
  render). Confirmed via accessibility snapshot.
- (b) A real click on an element far outside the header (the footer "Chat on WhatsApp" link,
  chosen because the absolutely-positioned dropdown panel visually covers the hero section
  near the top of the page and intercepts pointer events there) closed the menu — button
  reverted to "Open menu", nav panel removed from the tree.
- (c) Reopened the menu, pressed `Escape` — button reverted to "Open menu" immediately.
- (d) Reopened the menu, clicked the "Fleet" link inside the open panel — page navigated to
  `/en/fleet` (title/URL changed), confirming the pre-existing close-on-link-click behavior
  still works and wasn't broken by the new outside-click listener.

**Solid header (`/en/reserva`):**
- (a) Hamburger click opens the panel — confirmed.
- (c) `Escape` closes it — confirmed.
- (b) A real click on the page's "Continue" button (far below the header, outside its
  dropdown panel, and itself unaffected by the click since the sticky CTA correctly ignored
  the stray tap given no fields were filled) closed the menu — confirmed via snapshot showing
  "Open menu" restored.

All four required behaviors confirmed on both variants. No new console errors observed
during any of the above interactions.

### Automated test results (worktree, this pass)
- `npx tsc -b`: 0 errors
- `npm run build`: clean, all 15 routes compiled (Turbopack)
- `npx vitest run`: **18/18 passing** (unchanged — no logic files touched by this fix)
- `npx playwright test`: **14/14 passing** (unchanged pre-existing suite; still no dedicated
  automated spec for the hamburger menu itself — see prior pass's Missing Requirements note,
  which still stands as a non-blocking gap)

### Findings
None. The fix is structurally sound, does not conflict with the existing close-on-link-click
behavior, does not touch desktop nav, and all four required interactions were confirmed live
in a real browser on both header variants. No regressions in `tsc`/`build`/`vitest`/`playwright`.

### Updated Verdict
**PASS**

The single outstanding item from the prior NEEDS REVISION verdict (outside-tap and Escape
close) is now confirmed fixed, with no new issues introduced. Combined with the prior pass's
already-verified logo/admin-logo/overflow/step-rail/auto-scroll/sticky-CTA work, the feature
`logo-visibility-mobile-nav-booking-ux` is ready to ship as-is.

### Recommended Next Generator Task (non-blocking, carried forward)
Add a small Playwright spec covering hamburger open → outside-tap-close, open → Escape-close,
and open → link-navigates, so this fix has automated regression protection instead of relying
on manual/MCP verification (this was already noted as a gap in the prior pass and remains
true here — nothing in this diff added such coverage).

## Admin mobile UX and overflow (2026-07-20)

**Original goal:** Make every existing admin route usable at a 360px-wide viewport without
page-level horizontal overflow, overlapping navigation, crushed data tables, or off-screen
image actions, while preserving the existing desktop admin experience.

**Non-goals:** New admin capabilities; database, pricing, Stripe, email, auth, or
server-action behavior changes; a public-site redesign; changes to customer PII fields or
their auth boundary; resolving the separate Vercel Blob credential blocker.

**Acceptance criteria:** The protected header must not overlap at 360px and must retain its
desktop layout at `md` and above; boats and bookings must expose all existing data/actions as
readable mobile records while preserving the desktop tables; empty bookings must be explicit
in both treatments; long image URLs must truncate without moving Delete off-screen; the
boats list, bookings list, new-boat form, and edit-boat form must have no body-level overflow
at 360px; Playwright must cover the affected routes at 360px; TypeScript, build, Vitest, and
the full Playwright suite must pass.

### Goal Alignment Verdict

**PASS.** The implementation addresses each reproduced mobile failure with responsive-only
layout changes and leaves the desktop data treatments and all server/data behavior intact.

### Test Results

- `.env.local`: present (contents not recorded)
- `npx tsc -b`: passed, 0 errors
- `npm run build`: passed
- `npx vitest run`: 18/18 passed across 3 test files
- `npx playwright test`: 15/15 passed; no failing specs
- `npm run lint`: passed with 0 errors and 1 pre-existing warning in
  `app/api/checkout/route.ts`
- Focused headless responsive audit: passed at 360px and 1280px on admin login, boats,
  bookings, new-boat, and edit-boat views

The first Playwright launch did not run because an already-running worktree dev server held
Next's development lock while the configured port was unavailable. After confirming the
process belonged to this worktree and allowing it to stop, an isolated rerun started the
correct worktree server and passed all 15 specs. This was an infrastructure collision, not
a product/test failure.

### Acceptance-Criteria Audit

- **Protected header:** at 360px the brand and nav occupy separate rows with a 12px gap;
  both remain wholly within the viewport. At 1280px the computed header flex direction is
  `row`, preserving the prior side-by-side desktop treatment.
- **Boats:** mobile cards expose name, slug, full-day price, publication state, and Edit;
  the card list is visible and desktop table hidden at 360px, with the inverse confirmed at
  1280px.
- **Bookings:** mobile cards expose reference, boat, date/slot, customer details, deposit,
  status, and Cancel where applicable. Filter controls wrap cleanly. The mobile list is
  visible and desktop table hidden at 360px, with the inverse confirmed at 1280px.
- **Empty bookings:** `No bookings yet.` is rendered independently in both the mobile list
  and desktop table empty branches.
- **Image rows:** a focused browser check replaced the displayed URL in-memory with a very
  long Blob-shaped URL. The row remained from x=16 to x=344, Delete ended at x=331, and the
  URL retained computed `overflow: hidden`, `white-space: nowrap`, and
  `text-overflow: ellipsis`. No application or database data was changed.
- **Form controls:** login, new-boat, and edit-boat controls remained within the 360px
  viewport; no visible input, textarea, or button crossed either viewport edge.
- **Overflow:** `document.body.scrollWidth` equalled `window.innerWidth` (360px) on login,
  boats, bookings, new-boat, and edit-boat. The only element-level geometry outlier found on
  bookings was Next's development indicator, which is fixed tooling injected only by the
  dev server and did not alter body scroll width.
- **Regression coverage:** `e2e/admin.spec.ts` adds an authenticated 360px test covering
  mobile/desktop treatment visibility, header separation, and body overflow on boats,
  bookings, new-boat, and edit-boat routes.

### Critical Issues

None.

### Bugs

None found.

### UX Issues

None found. The mobile records remain readable and actionable, the booking filters wrap,
the admin header is visually separated, and image Delete actions remain reachable.

### Missing Requirements

None. The new regression test does not individually synthesize a long URL, force an empty
booking result, or assert desktop geometry, but those states were verified by source review
and focused headless checks in this evaluation. This is a non-blocking opportunity to make
the automated coverage more exhaustive, not a failed acceptance criterion.

### Scope Drift

None. Application changes are limited to the protected admin layout, the two list views,
the edit-page image-row sizing, and the admin Playwright spec. No actions, schema, auth,
pricing, payment, email, public-site, or Blob behavior changed.

### Rubric Scores

| Area | Score |
|---|---|
| 0. Goal Alignment | 5 |
| 1. Requirement Fit | 5 |
| 2. Simplicity | 5 |
| 3. User Workflow | 5 |
| 4. Data Integrity | 5 |
| 5. Error Handling | 5 |
| 6. Security / Privacy | 5 |
| 7. Maintainability | 4 |

Average: 4.875. Maintainability is scored 4 because mobile cards and desktop tables
necessarily duplicate some field/action markup; the duplication is localized, readable,
and preferable here to introducing a generalized rendering abstraction for two views.

### Closing Question

**Did this accomplish the stated goal?** Yes. All named 360px routes fit the viewport, the
mobile header and operational records are readable/actionable, long image URLs cannot hide
Delete, and the desktop table/header treatments remain active at desktop widths.

### Verdict

**PASS**

There are no critical bugs or privacy failures, Goal Alignment is 5, the average rubric
score is above 4, every high-priority acceptance criterion is satisfied, and full Playwright
results are recorded.

### Recommended Next Generator Task

No revision is required. Optionally strengthen `e2e/admin.spec.ts` with explicit assertions
for the login controls, empty-booking branches, desktop breakpoint visibility, and a
synthetic long image URL so the evaluator's focused checks become permanent regression
coverage.

### Final semantic-markup follow-up (2026-07-20)

**PASS — original verdict unchanged.** Inspected the final mobile booking-card adjustment:
the Deposit `dt` and `dd` are now direct children of their definition-list grouping `div`,
and the Cancel form is valid flow content inside the Deposit `dd`. The existing flex
classes, displayed amount, status guard, bound cancel action, desktop markup, and data flow
are unchanged. `npx tsc -b` passed with 0 errors, `git diff --check` passed, and
`npx playwright test e2e/admin.spec.ts` passed 6/6 with no failing specs. No revision is
required.
