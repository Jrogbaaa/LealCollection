# Session

**State (current):** Generator phase complete for `admin-boat-image-upload` in worktree
`/Users/JackEllis/worktrees/admin-boat-image-upload` (branch `feat/admin-boat-image-upload`).
Replaced the admin's paste-a-URL image input with a real Vercel Blob file upload:
- `app/api/admin/upload/route.ts` — token-issuing route, `requireAdmin()`-gated (it sits
  outside `(protected)`, so this is the only gate)
- `app/admin/(protected)/boats/image-upload.tsx` — new client component, file input +
  alt text, uploads via `@vercel/blob/client` then calls the existing `addImage` action
- `app/admin/(protected)/boats/actions.ts` — `deleteImage` now scoped to `boatId` (was
  previously id-only) and deletes the underlying Blob file via `lib/blob.ts`'s `isBlobUrl`
  guard (skips seeded local `/images/*` paths), non-fatal on Blob delete failure
- `lib/blob.ts` + `lib/blob.test.ts` — new, 3 tests
- `e2e/admin.spec.ts` — new upload test case with a fixture PNG at `e2e/fixtures/test-image.png`,
  cleans up the uploaded image at the end
- `.env.local.example` — `BLOB_READ_WRITE_TOKEN` uncommented (blocker resolved, key present
  in the real `.env.local`)

Verified in the worktree: `npx tsc -b` clean, `npm run build` clean (`/api/admin/upload`
registered), `npx vitest run` 21/21 (18 existing + 3 new). Playwright E2E **not yet run** —
next step is the Evaluator pass, which will run `npx playwright test` against a real dev
server and a real Blob upload.

**Next action (resolved):** Evaluator subagent ran, found a real regression (`e2e/admin.spec.ts`
used `fileURLToPath(import.meta.url)`, which crashes under Playwright's CommonJS transform
and took the whole e2e suite from 14/14 to 0/14). Fixed by switching to plain `__dirname`.
Also found and killed (with owner confirmation) a stray `next dev` process on port 3000
left running against the *main repo*, which had been causing every Playwright run —
including the Evaluator's — to silently test stale code via `reuseExistingServer: true`.

After both fixes: `npx playwright test` → **14/15 passing**. The one remaining failure is
not a code defect — `BLOB_READ_WRITE_TOKEN` in `.env.local` (both the worktree's and the
main repo's) is a literal empty string (`BLOB_READ_WRITE_TOKEN=""`), confirmed via a direct
`curl` reproduction of the exact server-side "no read-write token found" error. The owner
was asked (AskUserQuestion) whether to pause for a real token or ship code-complete and
document the blocker — chose to ship and document.

**Final state:** Code complete and reviewed clean (auth gate, Blob-hostname delete guard,
full upload→DB data-flow trace, no secrets logged). `tsc -b` clean, `npm run build` clean,
`npx vitest run` 21/21, `npx playwright test` 14/15 (1 failure attributable solely to the
missing real credential). See `findings.md` "Follow-up" section for full detail.

**Next action:** Owner needs to supply a real `BLOB_READ_WRITE_TOKEN` from their Vercel
project's Storage tab in `.env.local` (both this worktree and the main repo) before the
upload path and its Playwright test can be verified end-to-end and this feature closed out.
Tracked as a new blocking item in `TODOS.md`. Branch `feat/admin-boat-image-upload` is
ready to merge once that verification happens — not yet merged.

---

**State (prior):** Core P1 path shipped and verified — fleet pages, booking flow, Stripe checkout +
webhook (test mode), admin auth + boat CRUD + bookings list, Resend email confirmations,
and a full Vitest + Playwright test suite. This is the first real Evaluator pass;
`findings.md` is no longer the empty template.

**Next action:** P2 backlog in `TODOS.md` — extras pricing editor, blocked-dates admin UI,
`/experiencias`, `/contacto`, `/legal/*`, a Lighthouse pass, and Vercel deploy. Four items
still need the owner: real pricing confirmation, caviar price, WhatsApp number, domain.

**Verified this session (live, not just "tests pass"):**
- `npx tsc -b` — 0 errors
- `npm run build` — clean
- `npx vitest run` — 18/18 passing (pricing, booking-reference, webhook idempotency against
  the real Neon DB with a synthetically-signed Stripe event)
- `npx playwright test` — 14/14 passing, run twice back-to-back to confirm no flakiness
  (fleet EN/ES, booking flow to the Stripe redirect, admin auth gate, admin boat edit
  round-tripped against the live DB, bookings list)
- A real Stripe test-mode payment (card `4242...`) walked end-to-end through
  `/api/checkout` → hosted Checkout → `/api/webhooks/stripe` (via `stripe listen`) →
  booking flipped `pending` → `confirmed` in Neon → confirmation email delivered via Resend,
  confirmed received by the owner
- Admin login exercised in a real browser session with the owner's actual credentials;
  boat edit, image add/delete, and bookings filter all clicked through
- Found and fixed two real bugs live rather than assuming success: `/admin` rendering with
  no auth check when `AUTH_SECRET` was unset (see `decisions.md`), and `/admin` routes
  missing a root `<html>/<body>` entirely (Next.js requires exactly one per route tree;
  `[locale]/layout.tsx` was providing it but `/admin` isn't under `[locale]`)
