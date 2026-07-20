# Contract

## Goal Discipline

Every change must preserve the stated goal.

Before changing code, the Generator must:

1. Quote the goal + non-goals from `spec.md` / `featurelist.json` into its own output
2. Identify what problem this change solves
3. Identify who the change is for
4. Identify what should remain unchanged
5. Identify what would count as unnecessary scope expansion

If the implementation does not serve the goal, it should not be built.

## Non-Negotiables

- Do not break existing routes.
- Do not invent unsupported data fields — check `db/schema.ts` first.
- Do not add unnecessary complexity.
- Prefer simple, durable implementation.
- Public site and `/admin` stay separate (auth-gated); never expose admin mutations on public routes.
- Money is always integer cents. A displayed price and a charged price must come from the
  same function (`lib/pricing.ts`) — never duplicate pricing logic.
- Any total sent to Stripe is recomputed server-side from the database. Never trust a total
  posted from the client.
- One active harness session at a time (`spec.md`/`progress.json`/`session.md` describe the single in-flight change).

## Design Constraints

Deep marine blue, warm gold, off-white, ink — see brand tokens in `app/globals.css` /
Tailwind config once established. Serif display headings, grotesque body. Avoid template-y
"book your rental" tourism-site defaults — full-bleed photography, restrained motion, gold
used only as accent, never as a button fill.

## Security Constraints

- Never commit `.env.local` or log its contents (Neon connection string, Stripe secret key,
  Stripe webhook secret, Resend API key, Vercel Blob token).
- Verify Stripe webhook signatures — never trust an unsigned webhook payload.
- Customer PII (name, email, phone) is only ever read server-side; never expose another
  customer's booking to a different session.

Harness-specific: **never** write raw test output, API keys, connection strings, or
customer PII into harness files. Record only pass/fail counts and test names.

## Data Constraints

See `db/schema.ts` (Drizzle) for the source of truth. Respect current schema; do not create
duplicate sources of truth; every new persisted field needs a reason.

## Testing Requirements

- The Evaluator runs Vitest (`lib/pricing.ts`) and Playwright as a **separate subagent**
  with its own context.
- Before trusting results, the Evaluator must verify `.env.local` is present and the dev
  server is running where needed. Infra failures are recorded as **"not run,"** never as bugs.
- Only pass/fail counts and spec names go into `findings.md`. No raw output or secrets.

## Triviality Threshold

One-line fixes, typo/doc edits, and simple renames skip the full harness flow. The harness
applies to features, multi-file changes, and behavioral changes.
