# Spec: Admin mobile UX and overflow

## Goal

Make every existing admin route usable at a 360px-wide mobile viewport without page-level
horizontal overflow, overlapping navigation, crushed data tables, or off-screen image
actions, while preserving the existing desktop admin experience.

## Why it matters

The Leal admin needs to manage boats and bookings reliably from a phone. The current
protected header overlaps itself, the bookings table extends 127px beyond a 360px viewport,
and the boat editor's image rows extend 47px beyond it. These defects hide actions and make
booking data difficult to read at the moment it needs operational attention.

## Intended user

The authenticated Leal Collection admin using a phone or other narrow viewport.

## What success looks like

- The protected admin header has a clear, non-overlapping mobile layout with the brand and
  navigation both fully visible; desktop layout remains unchanged from the current design.
- `/admin/boats` presents readable mobile records with name, slug, full-day price,
  publication state, and edit action. Its existing desktop table remains available at the
  desktop breakpoint.
- `/admin/bookings` presents readable mobile records with reference, boat, date/slot,
  customer details, deposit, status, and cancel action. Its existing desktop table remains
  available at the desktop breakpoint.
- Empty booking results remain explicit on both mobile and desktop.
- `/admin/boats/[id]/edit` image rows stay inside the viewport; long URLs truncate without
  pushing the delete action off-screen.
- `/admin/boats/new`, `/admin/boats/[id]/edit`, and `/admin/login` retain usable full-width
  controls at 360px.
- At 360px, `document.body.scrollWidth` does not exceed the viewport on the boats list,
  bookings list, new-boat form, or boat editor.
- The responsive behavior has Playwright regression coverage; TypeScript, build, Vitest,
  and the relevant/full Playwright suite pass.

## Non-goals / out of scope

- New admin capabilities such as blocked-date management, extras editing, image sorting,
  search, pagination, or booking detail pages.
- Any database, pricing, Stripe, email, auth, or server-action behavior change.
- A visual rebrand or broad redesign of the public site.
- Changing customer PII fields or exposing them outside the existing auth-gated admin.
- Solving the separately blocked Vercel Blob credential issue.

## Open questions

None. The live review established the failing states and the smallest durable responsive
treatment without requiring owner judgment.
