# Agent Harness — Planner → Generator → Evaluator

Run a feature or multi-file change through the disciplined harness flow. This is the
**first step**, not the last — invoke it *before* editing any code, not to backfill
spec/findings after the fact.

## When to run this

Run the harness when a task **modifies 3+ files**, **introduces a new feature**, or
**changes user-facing behavior**. If you are unsure whether a task qualifies, it does.

Skip the harness ONLY for genuinely trivial changes: one-liners, typos, renames,
dependency bumps, comment/doc edits. When in doubt, run it.

## How to run it

Create one todo per phase below, then work them in order. Do not collapse phases or
run them out of order. Each phase has a prompt file — read it and act as that role.

### Todo checklist

1. **Planner** — read `agent-harness/prompts/planner.md` and follow it.
   - Restate goal, why, intended user, success criteria, non-goals, open questions.
   - Write/update `agent-harness/spec.md`, `featurelist.json`, `open-questions.md`,
     `decisions.md`.
   - **Verify:** `spec.md` has concrete success criteria and an explicit "what this is not".
     If anything needs human judgment, surface it (AskUserQuestion) before continuing.

2. **Worktree** (if 3+ files) — per CLAUDE.md §3, create a git worktree under
   `/Users/JackEllis/worktrees/` so work stays isolated, and copy the gitignored
   `.env.local` from `/Users/JackEllis/Leal Collection` (worktrees boot blank without it).
   - **Verify:** `.env.local` present in the worktree; dev server boots.

3. **Generator** — read `agent-harness/prompts/generator.md` and follow it.
   - Quote Goal / Why / Non-goals / files-to-change / risk areas BEFORE editing.
   - Build the smallest version that satisfies the spec. No scope creep.
   - Update `progress.json`, `session.md`, `trace.jsonl`.
   - **Verify:** `tsc -b` passes, `npm run build` succeeds, design tokens check passes.

4. **Evaluator** — dispatch a **separate subagent** (its own context, adversarial
   judgment — NOT a role switch in this session). Give it `agent-harness/prompts/evaluator.md`.
   - It runs Vitest + the relevant Playwright suite and writes `agent-harness/findings.md`.
   - **Verify:** `findings.md` has a Goal Alignment verdict and a per-criterion audit.

5. **Decide** — read `findings.md`.
   - PASS → proceed to ship.
   - PARTIAL / NEEDS REVISION → loop back to Generator with the Evaluator's recommended
     task. **Do not ship if the stated goal wasn't met.**

## Arguments: $ARGUMENTS

If a feature description is provided, use it as the Planner's input. Otherwise infer the
goal from the conversation and confirm it in the Planner step.

## Reminders

- The Generator builds; the Evaluator judges. Never let the same context do both.
- `spec.md` and `findings.md` are written **as you go**, never reconstructed afterward.
