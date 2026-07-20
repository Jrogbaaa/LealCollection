# Spec: Booking page design/copy cleanup (/reserva)

## Goal

Fix three concrete, verified defects on the booking page (`components/booking-flow.tsx`)
found via a live design review: a real color-rendering bug, a broken-looking copy/layout
block, and a brand-token violation on the primary CTA button.

## Why it matters

Trust and conversion. `/reserva` is the last page before a customer hands over payment
details — stray-looking text ("ask us about this one" sitting under an unrelated "TOWEL
SERVICE" caption) and off-brand blue calendar accents read as unfinished/buggy, which
undermines confidence at the highest-stakes point in the funnel.

## Intended user

Site visitor / booking customer, on `/[locale]/reserva`.

## What success looks like

1. **Calendar color bug (real, confirmed via `getComputedStyle`)**: `.rdp-root`'s
   `--rdp-accent-color` currently resolves to `blue` (rgb(0,0,255)), not `var(--color-marine-700)`,
   because `react-day-picker/style.css` is imported unlayered while the Tailwind arbitrary-value
   utility that sets the override lives in `@layer utilities` — unlayered CSS always beats
   layered CSS regardless of specificity. Fix so nav chevrons and the "today" marker render
   in brand marine-700 / gold-600, verified via `getComputedStyle` in the browser, not just
   visual inspection.
2. **"Add extras" section layout**: the `includedExtras` line ("TOWEL SERVICE", all-caps
   caption styling) and `askUsExtras` line ("Luxury caviar snack (ask us about this one)")
   currently render as two disconnected, caption-sized paragraphs below the priced checkbox
   grid — reads as leftover/broken text. Give both a real visual home inside the same card
   grid (e.g. non-interactive rows matching the priced checkbox rows, labeled "Included" /
   "Available on request" instead of dumping plain captions below). Reword `askUsExtra` in
   `messages/en.json` + `messages/es.json` away from dev-note phrasing ("ask us about this
   one") toward brand voice (e.g. "Available on request").
3. **CTA button token violation**: `bg-gold-500` solid fill on the primary submit button
   (`components/booking-flow.tsx` ~line 390) violates CLAUDE.md §4 ("gold is an accent —
   never a button fill"). Replace with the marine/ink treatment already used for the
   correctly-styled CTA on the homepage's second button (`bg-marine-950` / `hover:bg-marine-900`
   / `text-sand-50`).

## Non-goals / out of scope

- The same `bg-gold-500` CTA violation on the homepage hero and fleet detail page —
  explicitly deferred by owner decision (see `decisions.md`); log as a TODOS.md item instead.
- Pricing the caviar extra — still an open question blocked on owner input
  (`open-questions.md`), unaffected by this pass. The "price on request" *pattern* stays;
  only its presentation and copy change.
- Any change to booking logic, pricing calculation, Stripe checkout, or the calendar's
  blocked-dates behavior.
- Any change to `/reserva/gracias`, fleet pages, or admin.

## Approach

All three fixes live in `components/booking-flow.tsx` plus `messages/en.json` /
`messages/es.json` for the reworded copy. The calendar color fix may also need a small
addition to `app/globals.css` (e.g. a layered override block that loads after
react-day-picker's unlayered stylesheet, or wrapping the import in an explicit `@layer`)
depending on what the Generator finds is the most durable fix.

## Open questions

None outstanding for this pass — sitewide CTA scope resolved via AskUserQuestion (booking
page only). Caviar pricing remains a pre-existing open question, unaffected here.
