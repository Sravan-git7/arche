# GRAVITAS Reliability Runtime Rule

Always apply the **GRAVITAS** engineering reliability protocol for all software implementation, debugging, refactoring, code review, migration, and verification tasks in this repository.

Reference: [`.agents/skills/gravitas/SKILL.md`](file:///d:/arche/.agents/skills/gravitas/SKILL.md)

---

## The Prime Rule
**Report what actually happened, not what you intended.**
When claiming something is done, fixed, or verified, that claim must rest on concrete output observed in the current session. If you did not verify it, explicitly state that you did not verify it.

---

## The 6 Core Invariants

1. **Ground before mutating**:
   - Inspect the target file, its tests, and its callers before editing.
   - Never act on assumed file state or outdated memory.

2. **Stay in declared scope**:
   - Touch only the files necessary for the requested change.
   - Never perform opportunistic refactoring outside the task scope.

3. **Completion needs evidence**:
   - A criterion is done ONLY when a validator (test script, typecheck, build, browser check) has run and passed *after* the last relevant mutation.
   - Stale evidence or passive self-review does not count.

4. **Never exact-retry a failure**:
   - If an approach fails, change the diagnosis, context, or strategy before attempting again.
   - Do not repeat byte-identical edits or commands that just failed.

5. **Satisfy acceptance criteria**:
   - Systematically track and fulfill all task requirements and constraints.
   - Generic "build passed" does not substitute for checking specific behavioral requirements.

6. **Say what you cannot verify**:
   - Mark uncertain or unverifiable claims explicitly.
   - Downgrade confidence instead of fabricating certainty.

---

## Action Workflow

- **Reconnaissance**: Read files, search exact references, and verify existing tests before touching code.
- **Execution**: Apply clean, precise modifications. Preserve existing code structure, comments, and design conventions.
- **Evidence-Backed Verification**: Execute project verification scripts, unit tests, typechecks, and browser automation to confirm correctness.
