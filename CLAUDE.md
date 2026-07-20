# Leal Collection — Ibiza Yacht Charter

Public marketing + online booking site for Leal Collection, an Ibiza luxury yacht charter
business, plus an admin portal for managing the fleet and reservations. Next.js (App
Router) + TypeScript + Tailwind, deployed to Vercel.

> **§1–4 (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution)
> live in the global Karpathy rule and are not repeated here.** Below are the
> project-specific guidelines that extend them.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript, Tailwind |
| Database | Neon Postgres + Drizzle ORM — schema in `db/schema.ts`, apply with `npx drizzle-kit push`. **Never use a SQL console for schema changes.** |
| Images | Vercel Blob (admin-uploaded boat photos) |
| Payments | Stripe Checkout — 50% deposit, balance before boarding |
| Email | Resend (booking confirmations) |
| Auth | Auth.js, credentials provider, single admin user |
| i18n | next-intl — English + Spanish, localized routes |
| Calendar | `react-day-picker` |

See `/Users/JackEllis/.claude/plans/i-want-to-make-piped-truffle.md` for the original build
plan and rationale.

## Deferred Work

See [TODOS.md](./TODOS.md) for everything not yet built (fleet pages, booking flow, Stripe,
admin portal, emails, SEO) and every item still blocked on owner input (real pricing,
WhatsApp number, domain). Keep it current: close items as they ship, add items as scope
grows. Don't let `agent-harness/session.md`'s "next action" drift out of sync with it.

## Coding Guidelines

### 1. Money and Pricing

- Prices are **always integer cents**. Never store or compare floats for money.
- `lib/pricing.ts` is the **single source of truth** for any total — the booking UI, the
  Stripe checkout route, and the confirmation email all import it. Never duplicate pricing
  logic inline.
- The server **always recomputes the total from the database** before creating a Stripe
  session. Never trust a total posted from the client.
- `unit_price_at_booking` on `booking_extras` freezes historical pricing — changing an
  extra's current price must never rewrite past bookings.

### 2. Security Checklist

Before committing any change, verify:
- **No credentials logged** — never `console.log` the Neon connection string, Stripe secret
  key, Stripe webhook secret, Resend API key, or Vercel Blob token.
- **Secrets live in `.env.local`** (gitignored) and Vercel env vars, never in source.
- **Stripe webhook signatures are verified** — never trust an unsigned webhook payload.
- **Customer PII** (name, email, phone, notes) is read server-side only; one customer's
  session must never expose another customer's booking.
- **`/admin` is auth-gated** on every route and API handler under it — never rely on the UI
  alone to hide admin actions.

### 3. Availability Model

Supply is currently unlimited (one boat type, effectively unlimited capacity) — the
calendar does not track remaining inventory. The only availability constraint is the
`blocked_dates` table, which the admin uses to take a date off the calendar (maintenance,
private use). Do not build inventory/capacity logic beyond this without a stated reason —
it isn't needed yet, and the schema is deliberately shaped so it can be added later without
a migration.

### 4. Design Tokens

Deep marine blue, warm gold, off-white, ink — sampled from the logo, defined in
`app/globals.css` / Tailwind theme. Serif display headings, grotesque body text. Gold is an
accent (hairline rules, dividers) — **never a button fill**. Avoid template-y "book your
rental" tourism-site defaults; load the `frontend-design` skill before building any new page.

### 5. Worktrees for Parallel Work

For any task that modifies 3+ files, introduces a new feature, or is likely to run in
parallel with another agent session: create a git worktree so work stays isolated.

```bash
git worktree add /Users/JackEllis/worktrees/<branch-name> -b feat/<branch-name>
cd /Users/JackEllis/worktrees/<branch-name>
# copy .env.local into the worktree — it's gitignored and won't come along automatically
git worktree remove /Users/JackEllis/worktrees/<branch-name>
```

One-liner fixes directly on the current branch are fine without a worktree.

---

## Agent Harness

**STOP — before editing the FIRST file of any feature or multi-file task, run `/agent-harness`.**
This is the first action, not a wrapper you add afterward. If you find yourself writing
`spec.md` or `findings.md` *after* the code, the process already failed — you skipped the gate.

**Trigger test (run this before touching any code):** Does the task modify 3+ files, add a
feature, or change user-facing behavior? → **Yes: invoke `/agent-harness` now.** Only skip for
genuinely trivial changes (one-liners, typos, renames, dep bumps, comment/doc edits). When in
doubt, it qualifies — run it.

`/agent-harness` runs the flow as a checklist: **Planner → (worktree) → Generator → Evaluator → decide.**
- **Planner** writes `spec.md` / `featurelist.json` *before* any code.
- **Generator** quotes goal + non-goals before editing; builds the smallest version that fits.
- **Evaluator** runs as a **separate subagent**, runs Vitest + Playwright, writes `findings.md`.
- Don't ship if the stated goal wasn't met.

Before meaningful work, read: `agent-harness/spec.md`, `contract.md`, `featurelist.json`,
`progress.json`, `findings.md` (if present), `open-questions.md`, `decisions.md`.

---

## Post-Task Checklist

After completing any code changes, always:
1. Remove unused imports, variables, and functions
2. Ensure no TypeScript errors (`tsc -b` should pass)
3. Verify the build succeeds (`npm run build`)
4. Run unit tests: `npx vitest run` (pricing logic especially)
5. Run E2E tests for the affected flow: `npx playwright test`
6. If you added or modified a hook or utility function, add or update a Vitest unit test

---

## Development

```bash
npm run dev       # http://localhost:3000
npm run build
npx vitest run
npx playwright test
npx drizzle-kit push     # apply schema.ts changes to Neon — no SQL editor
```

## SEO / AI Search — Deferred

Flagged by the owner as needing dedicated keyword and LLM-visibility research before
implementation. See `agent-harness/decisions.md` and the build plan for the research scope
(keyword research, destination landing pages, `llms.txt`, schema.org markup, hreflang).
Baseline hygiene (metadata, sitemap, robots, hreflang, image alt text) ships regardless as
part of normal feature work — it is not gated on the research.
