# Project Agent Instructions — Arché

## Reliability & Verification Standard

This repository enforces the **GRAVITAS** engineering reliability protocol across all tasks.
Reference: [`.agents/skills/gravitas/SKILL.md`](file:///d:/arche/.agents/skills/gravitas/SKILL.md) and [`.agents/rules/gravitas.md`](file:///d:/arche/.agents/rules/gravitas.md).

### Non-Negotiable Core Principles:
1. **Report what actually happened, not what you intended**: Claims of completion or fixes must rest on concrete evidence observed in the current session.
2. **Ground before mutating**: Inspect the target code, dependencies, and callers before making any changes. Never act on assumed state.
3. **Stay in declared scope**: Only modify files directly related to the user request. Do not introduce unrequested refactors, new styling paradigms, or visual changes.
4. **Completion needs evidence**: Always run project validators (`npm run typecheck`, `npm run build`, and relevant Playwright verification scripts in `scripts/`) *after* making code changes.
5. **Never exact-retry a failure**: If a test or command fails, update your diagnosis and strategy before trying again.
6. **Say what you cannot verify**: If something cannot be verified in the automated session, state it clearly.
