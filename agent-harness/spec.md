# Spec: Top fixes + admin image upload (drag-and-drop) + blocked-dates UI

## Goal

Ship the batch of prioritized fixes surfaced by the platform evaluation, plus finish the
admin boat-image upload as a real drag-and-drop / file-picker uploader (from computer or
phone), plus add the missing blocked-dates admin UI, and verify admin login works
end-to-end. One reviewed batch, built in an isolated worktree.

## Why it matters

- **Revenue correctness:** the checkout route can currently under-charge for morning/
  afternoon bookings whose slot price is 0 while `priceFullDay > 0` — a boat could be sold
  for the price of its extras only, or 500 on a €0 Stripe session.
- **Trust / brand:** gold-as-button-fill on the top public CTAs violates the one brand rule
  CLAUDE.md emphasizes most; unescaped customer input in confirmation email HTML is an
  injection sink; duplicate Stripe webhook deliveries can double-send confirmation emails.
- **Admin efficiency:** a non-technical owner cannot upload a photo from their phone (must
  paste a pre-hosted URL) and cannot take a date off the calendar without a SQL console.
- **No dead ends:** two primary nav links 404.

## Intended user

Booking customers (correct charges, on-brand CTAs), the Leal admin (photo upload, blocked
dates), and site visitors (working nav).

## Success criteria

**Fixes**
1. Checkout rejects a booking when the *selected slot's* price is `<= 0` (not just
   `priceFullDay`), returning a clean 400 with an existing/typed error code — never a €0
   Stripe session. Unit test covers morning-slot-price-zero.
2. All 5 gold-filled buttons (homepage hero CTA, boat-detail Reserve CTA, admin login
   Sign in, admin Create boat, admin Save changes) use the existing navy button system
   (`bg-marine-950 … text-sand-50 hover:bg-marine-900`). Zero `bg-gold-500` on a button
   remains. Gold may still appear as a hairline accent.
3. Webhook confirmation is atomic: a single conditional
   `UPDATE … WHERE id=? AND status='pending' RETURNING id`; the confirmation emails fire
   only when a row was actually transitioned. Existing webhook tests still pass; a new test
   asserts a second delivery of the same event does not re-send.
4. Customer-supplied fields (name, email, phone) are HTML-escaped before interpolation into
   confirmation email HTML. Unit test covers an injection-y name.
5. Checkout validates the booking date is a real calendar date and `guests` is an integer,
   returning 400 rather than a 500 on bad input.

**Features**
6. Admin boat-image upload: drag-and-drop a file onto a dropzone **or** click to pick a
   file (works on desktop and mobile), uploads directly to Vercel Blob via the client
   `upload()` flow through the auth-gated `/api/admin/upload` route, then records the row.
   The uploaded image renders in the admin list and on `/fleet`. Deleting an image removes
   the Blob file too (skipping non-Blob seeded URLs) and is scoped to `boatId`.
7. Blocked-dates admin UI at a new protected route: the admin can see currently blocked
   dates and add/remove a whole-day block (writing to the existing `blocked_dates` table),
   and the public booking calendar reflects it. Auth-gated server-side like every other
   admin mutation.
8. `/experiencias` and `/contacto` exist as minimal on-brand pages (built with the
   frontend-design guidance), so the header links resolve instead of 404ing.

**Verification**
9. Admin login verified working end-to-end in a real browser (no code change expected).
10. `tsc -b`, `npm run build`, `npx vitest run` all pass; the relevant Playwright suites
    (admin, booking-flow, public-site) pass; a real Blob upload is exercised once against
    the configured `BLOB_READ_WRITE_TOKEN` (or the token is flagged as invalid).

## Non-goals / out of scope

- Image reordering / `sortOrder` UI (`[ADMIN-IMAGE-SORT-ORDER]`, still deferred).
- Multi-file / batch upload — one file per add is fine; drag-and-drop of a single file.
- Image cropping / resizing / client compression.
- Per-slot (morning/afternoon) blocked-dates authoring in the admin UI — whole-day blocks
  only for now (the booking flow already reads per-slot blocks; authoring them is deferred).
- Extras pricing editor (`[ADMIN-EXTRAS]`, deferred).
- Any DB schema change (all tables already exist).
- Reworking auth; login is verify-only.
- Real page content/design for experiencias/contacto beyond a minimal branded stub.
- Abandoned-checkout reaper, rate limiting, admin-cancel-vs-late-payment reconciliation
  (noted by the functionality eval as minor; out of this batch).

## Open questions

None blocking — scope confirmed with the owner: include blocked-dates UI, build stub
pages, login is verify-only. The only runtime risk is whether the configured
`BLOB_READ_WRITE_TOKEN` is a valid Vercel token (non-standard prefix) — validated by an
actual upload during the build; if invalid, the upload code still ships and the token is
flagged for the owner to replace.
