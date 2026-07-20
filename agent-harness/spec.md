# Spec: Sitewide logo visibility + mobile nav + booking-flow mobile UX

## Goal

1. Make the header logo (`components/site-header.tsx`) larger and legible on
   every background it appears against, including the dark hero it currently
   nearly disappears into, and put a real logo on the admin pages that
   currently have none.
2. Add a mobile navigation menu — currently there is none at all below `md`.
3. Make the `/reserva` booking flow's multi-step structure visible and
   navigable on mobile — currently it's one long form with no step indicator,
   no scroll cues, and the only CTA sits below all four sections.

## Why it matters

Trust and usability, on the pages that carry the most weight: the logo is the
first thing every visitor sees on every page, and right now it's nearly
invisible on the homepage/boat-detail hero (navy mark on navy background).
`/reserva` is the conversion page — a customer who doesn't realize there's
more than one field to fill in may bounce before reaching payment, and mobile
is the primary device for this kind of browsing decision.

## Intended user

Site visitor / booking customer, on every public and admin page, primarily on
mobile viewports for the booking-flow work.

## What success looks like

- Logo renders visibly (white silhouette via CSS filter, verified with
  `getComputedStyle`, not eyeballing) on the `transparent` header variant used
  on the homepage and boat-detail hero; full navy/gold color unchanged on the
  `solid` variant (fleet listing, `/reserva`, admin).
- Logo size increased from the current fixed 44×44px to a responsive
  48px→56px box with a matching wordmark bump; `unoptimized` stays on the
  `<Image>` (Next's optimizer previously flattened this PNG's alpha channel —
  see `decisions.md`).
- Admin (`app/admin/(protected)/layout.tsx`, `app/admin/login/page.tsx`), which
  currently has a plain-text wordmark and no image at all, gets the same logo.
- A hamburger menu appears below `md`, opens a panel with the four existing nav
  links, closes on selection or outside tap, is keyboard-focusable.
- On `/reserva` at mobile widths: completing the date step auto-scrolls to the
  time-slot step, completing the slot step auto-scrolls to extras
  (`prefers-reduced-motion` respected — no smooth scroll, instant jump
  instead). A persistent step-progress indicator (reusing the existing
  `stepDate`/`stepSlot`/`stepExtras`/`stepDetails` translation keys) sits below
  the page heading. A sticky bottom bar on mobile keeps the primary CTA
  reachable at all times instead of buried below all four sections.
- The calendar (`DayPicker`) doesn't clip at ≤360px viewport width.
- `tsc -b`, `npm run build`, `npx vitest run`, `npx playwright test` all pass;
  zero new console errors in Playwright runs.

## Non-goals / out of scope

- Commissioning a new logo asset — the fix is CSS-only (filter) on the
  existing `logo.webp`.
- Any change to booking/pricing logic, `lib/pricing.ts`, Stripe checkout, or
  `blocked_dates` behavior.
- Any change to `/reserva/gracias`.
- The already-deferred sitewide `bg-gold-500` CTA violations on the homepage
  hero / fleet detail (tracked in `TODOS.md` from the prior pass) — unrelated
  to this change, not touched here.
- Redesigning the booking flow's information architecture into discrete
  JS-driven step screens (tabs/wizard) — this stays a single scrollable page
  with better navigational affordances, not a rebuild.

## Open questions

None outstanding — logo treatment (white silhouette via CSS, not a new asset)
and the requirement to run the full harness were both confirmed with the owner
via AskUserQuestion before this spec was written.
