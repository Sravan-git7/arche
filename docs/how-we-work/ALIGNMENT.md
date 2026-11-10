# How We Work — finished implementation and verification

The original **ARCHE: Design + Motion Playbook** is the design authority. The repository is the implementation authority. The latest user message, **IMPLEMENTATION: HOW WE WORK — PROCESS + APPROACH**, supplies the explicit requirements for this completion pass. No commit, push or publication was performed.

## Delivered

- One continuously mounted SVG in a prominent desktop sticky split; smaller native-sticky diagram above stacking phone cards. No ScrollTrigger pin, scroll snapping, extra scroll handler or animation framework.
- Discover: hub. Design: spokes draw. Build: outer nodes land. Connect: shared perimeter draws and nodes energize. Launch: the hub releases a wave toward a drawn horizon while the chapter dips to ink. Evolve: the operating halo comes alive.
- Four principles overlay the same completed geometry: shared connections, a selected route, aligned design/engineering frames, and a monitoring orbit. Overlays contain no text or claims.
- A continuous scroll-driven dissolve returns to paper before Ask Arche.
- The construction, signal release, theme transitions and overlays are sampled from a single paused GSAP timeline by one scoped ScrollTrigger. Fractional stroke values do not round to whole pixels. There are no stage timers or delayed CSS scene transitions; scrolling backward restores the exact same geometry and palette.
- Scroll transforms/strokes use the existing `easing.scrub` token. Feedback is 180ms. The only ambient animation is a restrained 5s breathing halo, paused outside the chapter.
- During theme transitions, surfaces interpolate while text switches at the contrast crossover, avoiding foreground/background fading through the same gray.
- CSS small-viewport units, minimum 48px control height, visible keyboard focus, real headings and buttons, unchanged step/principle copy, and native touch scrolling. Keyboard jumps use the existing Lenis instance when available; no second conductor is created.
- Reduced motion shows the complete geometry and final principle overlay, with all six steps and four principles as real static text; no sticky cards, pins, parallax, loops or scrub trigger.
- `#process` and `#approach` remain separate ordered `data-chapter` entries for the unchanged rail. Every tested process/principle checkpoint selected the correct actual rail label.

## Protected implementation

Hero, Problem, all four service demos and orchestration, System Model, Work, global CSS, motion libraries/tokens, navigation and ProgressRail are unchanged. The earlier temporary export of ProcessVisual was removed: **Sections.tsx is now identical to HEAD**. The cumulative diagram geometry is implemented locally, so existing ProcessVisual callers and protected Hero/CTA code in Sections.tsx are not changed.

Read-only comparison: Services retain their reviewed demo grammars/morph orchestration; System Model retains its reviewed spatial rail and convergence (rather than being rewritten into the playbook's proposed single morph); Work retains honesty labels and image reveals. No protected visual or animation was replaced to force literal agreement with the older strategy document.

## Content lock

- `content-before.txt`: original HEAD main-page DOM text export.
- `content-after.txt`: completed main-page DOM text export.
- `content.diff`: only chapter-related differences: caption's DOM position, arrow line wrapping, and retirement of old independent Approach panel labels, including `HEALTH: NOMINAL`, `AGENT ROUTE · VERIFIED` and `0 HANDOFFS`.
- All six step descriptions, four principles, and existing headings are unchanged. No new claims or demo data were introduced.
- `content-baseline.json` is the earlier supplemental source-literal capture, not a replacement for the DOM exports. Dynamic and hidden route content is not claimed to be an exhaustive site-wide content audit.

## Exact changed files relative to HEAD

1. `src/components/HowWeWork.tsx` — chapter, local diagram, scoped timeline and accessible controls.
2. `src/components/HowWeWork.css` — responsive sticky/stacking composition, diagram styling, reduced motion and local ambient pulse.
3. `src/pages/Home.tsx` — render combined chapter instead of independent ProcessSys/Approach.
4. `scripts/verify-how-we-work.mjs` — chapter-specific browser verification and regression captures.
5. `scripts/verify.mjs` — replace obsolete separate-section selectors with combined chapter checks; use actual ScrollTrigger pin intervals and sufficient scrub settling time instead of parent-box inferred coordinates. No assertions removed or relaxed.
6. `docs/how-we-work/ALIGNMENT.md` — this report.
7. `docs/how-we-work/checkpoints.json` — observed checkpoint values at both requested sizes, forward and backward.
8. `docs/how-we-work/content-baseline.json` — source-literal baseline.
9. `docs/how-we-work/content-before.txt` — DOM baseline.
10. `docs/how-we-work/content-after.txt` — completed DOM export.
11. `docs/how-we-work/content.diff` — explicit content differences.

Build outputs, dependency caches, screenshots and temporary baseline/browser tooling are not source deliverables.

## Automated verification — actual results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS after final source edits |
| `npm run build` | PASS after final source edits |
| `node scripts/verify-how-we-work.mjs` with CHROME_PATH/CHROME_LIBS | PASS after final source edits, 1440×900 and 390×844 |
| `npm run verify` | PASS, 19/19 desktop checks after final source edits |
| `REDUCED=1 npm run verify` | PASS, 18/18; dedicated chapter suite also rechecks reduced motion after final source edits |
| `MOBILE=1 npm run verify` | 17/18: chatbot lead-intent assertion fails. Same 17/18 result and identical failure reproduced using the original verification script against untouched HEAD on port 5174. No protected chatbot changes made. |
| `npm run verify:motion` | All 12 directed service transitions pass. A concurrent run reported rapid-click/resize settling failures despite exit 0. Isolated rerun of its underlying `verify-morph-engine.mjs`, with explicit rejection of any `PASS: false` output, passed every reported assertion and had no page errors. Fixed-delay timing under concurrent browser load is not treated as a source regression or silently ignored. |
| Protected source comparison | PASS: no changes in locked components, global CSS, shared motion or lib code |
| `git diff --check` | PASS |

The desktop suite initially used parent-box-derived pin coordinates and could inspect Problem before its scrub had settled. The test helper now queries the actual registered pin interval and allows scrub settling. Problem's code is unchanged. The initial chapter test also caught GSAP whole-pixel rounding on normalized stroke offsets; `autoRound: false` fixes continuous stroke drawing, and a stationary/reversal test now guards against it.

### Dedicated chapter assertions

- All ten checkpoints forward and every checkpoint backward; one persistent SVG; correct caption/state and rail label.
- Partial stroke at mid-step, no timer drift at rest, exact same stroke value on return.
- Partial Launch wave, exact same theme/wave state when reversing, final paper exit.
- Diagram visible at every checkpoint and no horizontal overflow at either requested viewport.
- Keyboard selection including a backward jump, minimum control height, offscreen ambient pause.
- Dynamic reduced-motion preference: completed SVG, static layout, no chapter ScrollTrigger, no ambient animation.
- No page errors.

## Visual inspection (separate from automated assertions)

Captured and inspected review sheets of all ten chapter checkpoints at **1440×900** and **390×844**, plus full-size Launch, phone principle and reduced-motion frames. Inspected paired before/after Hero, Problem and Services captures at both sizes: layout, typography, panels and visible controls remain consistent; moving demo/ambient content is not claimed pixel-identical. The monitoring orbit was inset to avoid the existing caption. No live-device or assistive-technology certification is claimed.

Screenshots and logs are under ignored `audit_deliverables/how-we-work/`; checkpoint JSON is retained here. The live preview remains on port 5173 for user review.

### Checkpoint observations

| Checkpoint | Geometry / palette |
|---|---|
| Discover | Central hub on paper |
| Design | Four spokes extend from the hub |
| Build | Four endpoint nodes appear along those connections |
| Connect | Perimeter joins nodes; active nodes energize |
| Launch | Signal releases toward a horizon; chapter dips to ink |
| Evolve | Complete system gains a low-amplitude operating halo |
| Systems thinking | Shared perimeter and cross-system connection overlay |
| AI where it earns its place | Only the selected curved route is emphasized |
| Design + engineering | Two aligned frame layers over the same hub |
| Built to keep running | Monitoring orbit/check over the same living system |
| Exit | Warm paper restored before Ask Arche |
| Reverse | Construction, overlay and palette restore deterministically |
