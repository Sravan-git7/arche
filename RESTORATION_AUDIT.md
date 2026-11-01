# Arche — Visual Restoration Audit Report

**Date:** November 1, 2026  
**Repository:** `D:\arche`  
**Reference Baselines:**
- **Original Source of Truth:** `stash@{0}` (local pre-merge implementation)
- **Upstream Synchronization:** `origin/main` (`ec94af9`)
- **Current Working Copy:** Local workspace at `d:\arche` (on `main`)

---

## 1. Executive Summary

Following the upstream GitHub merge and initial partial restoration, this audit conducts a comprehensive, non-destructive comparative evaluation across all 12 website sections.

### Key Audit Findings:
1. **Core Restoration Success:** The major architectural components that were wiped out or replaced with flat mockups in upstream `main`—specifically **Architecture 3D** (`Architecture3D.tsx`, 686 lines of spatial camera rails), **Approach Visual** (`ApproachVisual`, 4-principle morphing diagram), **Process System** (`ProcessSys` & `ProcessVisual`, accumulating SVG nodal diagram), and **all four flagship interactive demos** (`VideoEditingDemo`, `WebDevDemo`, `AgentDemo`, `AutomationDemo`)—have been successfully and fully restored to the working website.
2. **2D DOM Motion System & Morph Engine:** The working website features the advanced DOM/CSS Morph Engine (`ServiceTransitionLayer.tsx`, `src/lib/serviceMotion.ts`), enabling seamless ghosting and mid-flight retargeting between services without Three.js or canvas overhead.
3. **Encoding & Text Integrity:** All corrupted UTF-8 mojibake introduced during the upstream Windows merge (such as `ΓåÆ`, `ΓÇö`, `┬╖`, `Γ¥ÜΓ¥Ü`) has been eliminated. 0 corrupted characters remain across `src/`.
4. **Primary Missing Original Elements:**
   - **Ask Arche Animated Typewriter / Streaming Loop:** `stash@{0}` had an animated simulation loop (`idle` → `thinking` → `typing` → `streaming`), three pulsating `.type-dot` circles, and dynamic status labels (`Thinking`, `Composing`, `Responding`, `Ready`). Upstream PR #7 removed this in favor of instant answers (`· Ready`).
   - **Signal Dot First-Scroll Delight Wobble:** `stash@{0}` featured a one-time "first-scroll reward" where the signal dot performed a curious wobble (`sessionStorage.getItem("arche_first_scroll_reward")`) on the visitor's first departure from the hero. Upstream replaced `BridgeDot.tsx` with `Signal.tsx` (quadratic arc travel system) and dropped the wobble.
5. **Intentional vs. Accidental Changes:**
   - Changes stemming from `docs/commercial-review.md` (softening liability-sensitive claims such as "handling time reduced from 12:00 to 0:04", "7 hand-offs eliminated", and client case study assertions) were intentional risk mitigations.
   - The deletion of rich interactive components and diagrams in upstream PR #7 was accidental/destructive; their restoration in the current working copy is completely sound and verified.
6. **Integrity & Verification:** The current working website passes all test suites: TypeScript compilation (0 errors), singlefile production build, 19/19 desktop checks, 18/18 mobile checks, 18/18 reduced-motion checks, and 12/12 morph transition verifications.

---

## 2. Section-by-Section Comparison

---

### Section 1: Hero
- **Original Design & Behavior (`stash@{0}`):**
  - Architectural isometric plane stack (`HeroEnvironment.tsx`) with 3 layered planes and a lime-edged plate carrying the resting signal dot (`.hp-signal`).
  - Full GSAP SplitText line and word reveal sequence on statement and kicker.
  - Interactive mouse tilt/parallax on planes.
  - Headline copy: *"Arche is a multi-disciplinary studio building high-performance websites, AI automations, and custom software."*
  - Badge: `● AVAILABLE FOR Q2 2026`.
- **Current Design & Behavior (Working Copy):**
  - Restored to the original `stash@{0}` layout, typography, and copy.
  - Unwanted upstream kicker (*"What if everything worked together?"*) removed.
  - Dynamic `onMotionPreferenceChange` listener and `reducedMotion` state added for instant accessibility adaptation.
- **What Changed:** Only the internal motion preference listener was added.
- **What is Missing:** Nothing. The original visual and physical composition is 100% intact.
- **Change Intentionality:** Intentional (restoring copy + accessibility improvement).
- **Relevant Files:**
  - `src/components/Sections.tsx` (`Hero`)
  - `src/components/HeroEnvironment.tsx`
  - `src/index.css`
- **Selective Restoration Feasibility:** Already restored. No further action needed.

---

### Section 2: Problem / Fragmentation
- **Original Design & Behavior (`stash@{0}`):**
  - Pinned scroll section (`#problem`) over `260vh` with scrub `0.6`.
  - 4 fragmented tool cards: `web` (Website), `email` (Inbox), `sheet` (Spreadsheet), `crm` (CRM).
  - Multi-phase GSAP timeline:
    1. Fan out of disconnected tools with red friction highlights.
    2. Sheet card flips with lime accent.
    3. Collapse into unified system line (`#problem-diagram-line`) connecting all 4 nodes.
    4. Counter flips: "Disconnected" → "Connected" (lime).
    5. Final 10% hold (0.90 to 1.00).
    6. System thread event emitted (`emitThread()`) into Services.
- **Current Design & Behavior (Working Copy):**
  - Full pinned interactive timeline restored.
  - Pinned scroll distance tightened from `260vh` (`window.innerHeight * 2.6`) to `210vh` (`window.innerHeight * 2.1`) to resolve user-reported scroll fatigue.
  - Trailing hold phase tightened from `0.10` to `0.04` (0.90 to 0.94) for a snappier handoff into Services.
  - Viewport media query enhanced to `(min-width: 900px) and (min-height: 760px)` to prevent pin trapping on short viewports.
  - Added SVG `pf-packet` animated flow particles and `data-flip="1"` state.
  - State readout at end: `"one system"`.
- **What Changed:** Pinned distance tuned (`-50vh`), trailing hold reduced, short-screen fallback added.
- **What is Missing:** Nothing visual is missing. The sequence is identical, but faster and less prone to trapping the user.
- **Change Intentionality:** Intentional refinements requested by the user.
- **Relevant Files:**
  - `src/components/ProblemSystem.tsx`
  - `src/index.css` (`.pf-compact-node`, `.pf-compact-anchor`)
- **Selective Restoration Feasibility:** Fully functional and superior to original.

---

### Section 3: Architecture / System Model
- **Original Design & Behavior (`stash@{0}`):**
  - `src/components/Architecture3D.tsx` (686 lines).
  - 2D DOM spatial camera rail system (`rail3d.ts`), simulated focal depth, perspective projection, 5 archetype stage glyphs (`StageGlyph`), telemetry HUD, and interactive jump navigation pills (`[data-cursor="JUMP"]`).
- **Current Design & Behavior (Working Copy):**
  - **100% IDENTICAL to `stash@{0}`**.
  - Upstream `origin/main` had wiped this file down to 137 lines of a flat SVG diagram (`.archetype-section` in `src/experience.css`).
  - The working copy completely reverted that upstream destruction, re-instating the full 686-line spatial camera system.
- **What Changed:** Replaced the upstream flat SVG diagram with the original 686-line component.
- **What is Missing:** Nothing.
- **Change Intentionality:** Intentional restoration of the original implementation.
- **Relevant Files:**
  - `src/components/Architecture3D.tsx`
  - `src/lib/rail3d.ts`
- **Selective Restoration Feasibility:** Fully restored and verified.

---

### Section 4: Services & Four Interactive Demos
- **Original Design & Behavior (`stash@{0}`):**
  - `Chapters.tsx`, `SystemStage.tsx`, and four flagship interactive demos:
    1. **Video Editing Demo** (`VideoEditingDemo.tsx`): draggable timeline playhead, waveform scrub, stage markers, resolution badges, ⏸/▶ preview.
    2. **Web Development Demo** (`WebDevDemo.tsx`): 3 interactive responsive viewport modes (Desktop, Tablet, Mobile), inspector overlay, Lighthouse audit scorecards (99 Perf, 100 Acc, 100 SEO).
    3. **AI Agents Demo** (`AgentDemo.tsx`): interactive simulated agent, real-time reasoning trace ("THINKING", "GROUNDING", "DECISION"), query chips, status announcer.
    4. **AI Automation Demo** (`AutomationDemo.tsx`): event pipeline simulation, manual vs. automated execution race, multi-node pulse flow, speedup multiplier.
  - Left service column: number, title, description, 3 process tags with connecting arrows, and "Explore [Service]" button.
- **Current Design & Behavior (Working Copy):**
  - All four rich interactive demos are fully mounted and functional.
  - Upstream flat CSS mockups (`.edit-demo`, `.web-experience`, etc.) have been completely removed.
  - Left column spacing intentionally re-architected: grouped into a compact upper group (number, title, description, process tags) with the "Explore" button pinned near the bottom to balance the right demo panel.
  - Added keyboard accessibility:
    - Scrubber in Video Editing accepts `Home`, `End`, `ArrowLeft`, `ArrowRight`.
    - Service tabs in `Chapters.tsx` accept `ArrowLeft`, `ArrowRight`, `Home`, `End`.
  - Automation Demo race condition fixed (`autoStarted.current = true`).
  - Morph Engine (`ServiceTransitionLayer.tsx`) active for smooth ghosted transitions.
  - UTF-8 encoding mojibake 100% repaired.
- **What Changed:**
  - Editorial spacing in the left column.
  - Keyboard accessibility added.
  - Morph Engine layered in for continuous transitions.
  - Bug fixes and honesty note added to Automation Demo ("SIMULATION · NO LIVE DATA").
- **What is Missing:** Nothing from the original design.
- **Change Intentionality:** Intentional refinements and bug fixes.
- **Relevant Files:**
  - `src/components/Chapters.tsx`
  - `src/components/SystemStage.tsx`
  - `src/components/ServiceTransitionLayer.tsx`
  - `src/components/VideoEditingDemo.tsx`
  - `src/components/WebDevDemo.tsx`
  - `src/components/AgentDemo.tsx`
  - `src/components/AutomationDemo.tsx`
- **Selective Restoration Feasibility:** The current implementation is complete and verified.

---

### Section 5: Work / Portfolio
- **Original Design & Behavior (`stash@{0}`):**
  - `WorkIndex.tsx` with expandable project rows (`ProjectRow`), dynamic cursor tracking (`VIEW` / `CLOSE`), radial spotlight glow follows pointer, filterable architecture tags.
  - Copy in Honesty Verification: *"Classified as CONCEPT. Self-initiated work: no client names, testimonials or invented results — only what was actually built."*
- **Current Design & Behavior (Working Copy):**
  - All visual effects, glowing card hover tracking, and accordion expansion intact.
  - Added accessibility: `role="button"`, `tabIndex={0}`, `aria-expanded`, keyboard `Enter` / `Space` support.
  - Copy softened per upstream commercial review: *"Classified as CONCEPT. Self-initiated work or a concept — not a client case study, testimonial or claimed result."*
- **What Changed:** Keyboard accessibility added; copy slightly softened.
- **What is Missing:** None of the visual components or animations are missing.
- **Change Intentionality:** Intentional accessibility addition + commercial review copy alignment.
- **Relevant Files:**
  - `src/components/WorkIndex.tsx`
  - `src/data/projects.ts`
- **Selective Restoration Feasibility:** If desired, the original copy (*"only what was actually built"*) can be restored by editing `src/components/WorkIndex.tsx` line 297 without touching motion.

---

### Section 6: Approach
- **Original Design & Behavior (`stash@{0}`):**
  - 4 interactive principles with sticky selection:
    1. "One narrative spine"
    2. "Architecture before surface"
    3. "Motion as explanation"
    4. "Honest constraints"
  - `ApproachVisual` dynamic diagram component containing `MiniBuiltDiagram` and morphing architectural states keyed to the active principle.
- **Current Design & Behavior (Working Copy):**
  - **100% restored from `stash@{0}`.**
  - Upstream had deleted `ApproachVisual` and dropped `id="approach"`.
  - Working copy restored `ApproachVisual`, `MiniBuiltDiagram`, and `id="approach"`.
  - Added `type="button"` and `aria-pressed` for accessibility.
- **What Changed:** Restored from stash; added accessibility attributes.
- **What is Missing:** Nothing.
- **Change Intentionality:** Intentional restoration.
- **Relevant Files:**
  - `src/components/Sections.tsx` (`Approach`, `ApproachVisual`, `MiniBuiltDiagram`)
- **Selective Restoration Feasibility:** Fully restored and operational.

---

### Section 7: Process
- **Original Design & Behavior (`stash@{0}`):**
  - `ProcessSys` and `ProcessVisual` in `src/components/Sections.tsx`.
  - Scroll-scrubbed accumulating SVG nodal diagram: 4 stage nodes with glowing lime accents, perimeter connectivity lines, pulsing central hub, and orbiting signal dot.
  - 4 stages: Discovery & Architecture → Interface & Engine → Integration & Testing → Delivery & Handoff.
- **Current Design & Behavior (Working Copy):**
  - **100% restored from `stash@{0}`.**
  - Upstream flat CSS mockup (`.process-model` in `src/experience.css`) completely removed.
  - All SVG nodes, pulse circles, and scrub timelines are active.
- **What Changed:** Restored from stash; flat mockup eliminated.
- **What is Missing:** Nothing.
- **Change Intentionality:** Intentional restoration.
- **Relevant Files:**
  - `src/components/Sections.tsx` (`ProcessSys`, `ProcessVisual`)
- **Selective Restoration Feasibility:** Fully restored and operational.

---

### Section 8: Ask Arche
- **Original Design & Behavior (`stash@{0}`):**
  - Interactive simulated AI assistant (`ArcheAssistant.tsx`).
  - **Animated Typewriter / Streaming Loop:**
    - States: `idle` → `thinking` → `typing` → `streaming`.
    - Simulated thinking delay (350–550ms) with pulsing indicator.
    - 3 bouncing `.type-dot` circles with staggered CSS animation delays (`0ms`, `140ms`, `280ms`) and `"typing"` label.
    - Progressive text streaming reveal.
    - Header status dynamically displayed: `· Thinking`, `· Composing`, `· Responding`, or `· Ready`.
    - Starter chips disabled during generation (`disabled={busy}`, `opacity: 0.45`).
  - `MiniAgent` visual in TriggerPanel:
    - Step badges: `["QUESTION", "REASONING", "ACTION"]`.
    - User quote: *"Can I move my booking to Friday?"*
    - Agent response: *"✓ Moved to Fri 10:00 · confirmation sent"*
  - TriggerPanel caption: *"No script matched — this is where a human takes over."*
  - Starter chips:
    - *"I need a website."*
    - *"I want to automate my workflow."*
    - *"I need an AI agent."*
    - *"I have footage that never ships."*
- **Current Design & Behavior (Working Copy):**
  - Instant response: `phase` state removed; always shows `· Ready`.
  - No typing dots or simulated delays; chips remain immediately clickable.
  - `MiniAgent` visual changed to:
    - Step badges: `["QUESTION", "MATCH", "HANDOFF"]`.
    - User quote: *"Can you qualify this inquiry?"*
    - Agent response: *"Example: a handoff could be prepared"*
  - TriggerPanel caption changed to: *"Illustrative view · no live actions or connected tools."*
  - Starter chips changed to:
    - *"What does Arche do?"*
    - *"Can you automate lead management?"*
    - *"Can you connect my existing tools?"*
    - *"How do I start a project?"*
- **What Changed:**
  - Upstream PR #7 removed the typewriter/streaming animation loop and softened the copy/steps in the visual preview panel.
- **What is Missing:**
  - **The animated typewriter/streaming state, pulsating typing dots, and dynamic status labels (`Thinking`, `Composing`, `Responding`).**
- **Change Intentionality:** Upstream PR #7 simplified this; however, the simulated typing animation was a key interactive showcase element in `stash@{0}`.
- **Relevant Files:**
  - `src/components/ArcheAssistant.tsx`
  - `src/data/intents.ts`
- **Selective Restoration Feasibility:**
  - **HIGH FEASIBILITY.** The animated typewriter and typing dots can be selectively restored into `ArcheAssistant.tsx`.
  - In `prefersReducedMotion()`, the component should immediately reveal the text (preserving accessibility), while in standard motion mode it can play the simulated typing cadence.

---

### Section 9: FAQ
- **Original Design & Behavior (`stash@{0}`):**
  - Smooth GSAP accordion with sliding height/opacity and expanding scaleX indicator bar.
  - Sticky side statement: *"Clear answers to how we work."*
  - Copy: *"Anything unanswered? Ask us directly — you'll hear back within a working day."*
  - Note: Did **not** have `id="faq"` on the section tag.
- **Current Design & Behavior (Working Copy):**
  - Exactly identical accordion motion and layout.
  - Added `id="faq"` to support direct anchor navigation (`/#faq`).
  - Added ARIA attributes: `type="button"`, `aria-controls="faq-panel-n"`, `aria-hidden={!open}`.
  - Added `killTweensOf` unmount cleanup.
  - Copy softened to: *"Anything unanswered? Ask us directly — we're happy to talk it through."*
- **What Changed:** Added `id="faq"`, ARIA accessibility, and softened copy.
- **What is Missing:** Nothing visual or behavioral is missing.
- **Change Intentionality:** Intentional accessibility and navigation enhancement.
- **Relevant Files:**
  - `src/components/FAQ.tsx`
- **Selective Restoration Feasibility:** Perfect state. Keep current implementation.

---

### Section 10: Pricing
- **Original Design & Behavior (`stash@{0}`):**
  - Dedicated `/pricing` route (`PricingPage.tsx`) and `ServicePricing.tsx`.
  - Interactive `AutomationCompare` slider with quantitative claims:
    - Header: *"The difference, measured. Drag across. Watch the hand-offs disappear."*
    - Metrics:
      - Handling time: `12:00` → `0:04`
      - Hand-offs: `7` → `0`
      - Systems updated: `0` → `6`
    - Readout: *"100% routed — one event, 6 systems updated, end to end in 4s."*
  - Original `site.ts` had a Pricing link in the main navigation.
- **Current Design & Behavior (Working Copy):**
  - Dedicated `/pricing` page is fully functional and linked from the footer and CTA buttons.
  - Primary header nav link removed (per site structure review, focusing header on Work/Services/Contact).
  - In `AutomationCompare.tsx`, metrics softened per `docs/commercial-review.md`:
    - Header: *"The same request, two views. Drag across. Explore the hand-offs."*
    - Metrics:
      - View: `50%`
      - Manual steps shown: `7`
      - Example modules: `6`
    - Readout: *"Connected view — an illustrative route. No live systems were updated."*
  - Slider keyboard navigation added (`Home`, `End`, `ArrowLeft`, `ArrowRight`).
  - Jump pills support reduced motion.
- **What Changed:**
  - Upstream PR #7 softened metrics to illustrative examples rather than fixed guarantees.
  - Accessible keyboard control added to slider.
  - Primary header nav link removed; footer link retained.
- **What is Missing:** The quantitative `12:00 → 0:04` handling time claim.
- **Change Intentionality:** Intentional commercial liability precaution (`docs/commercial-review.md`).
- **Relevant Files:**
  - `src/pages/PricingPage.tsx`
  - `src/components/AutomationCompare.tsx`
  - `src/components/ServicePricing.tsx`
  - `src/data/pricing.ts`
- **Selective Restoration Feasibility:** The current implementation is compliant with commercial guidelines. If the owner approves quantitative benchmarking, the metric counters can be restored easily.

---

### Section 11: Contact & Footer
- **Original Design & Behavior (`stash@{0}`):**
  - 4-step guided project inquiry wizard (`ContactPage.tsx`).
  - Interactive "flying tags" (`flyTag`) that fly from selected options into the summary header chips.
  - Stored every submission in unencrypted browser storage: `localStorage.setItem("arche:inquiries", ...)`.
  - Form step 4 was rendered in an unwrapped `<div>` with button click handlers.
  - Post-submission copy promised: *"usually within two working days"*.
- **Current Design & Behavior (Working Copy):**
  - Guided wizard and flying tags completely preserved.
  - Step 4 wrapped in a valid semantic `<form noValidate onSubmit=...>`.
  - Added `role="progressbar"` with ARIA range values.
  - Removed `localStorage` archiving of user inquiries to protect user privacy (no local PII leakage).
  - Added double-submission guard (`sendingRef.current = true`).
  - Web3Forms API integrated with pre-filled `mailto:` email fallback when unconfigured.
  - Post-submission copy: *"with next steps and honest scoping"*.
- **What Changed:** Semantic form wrap, accessibility progressbar, PII storage removal, double-click prevention.
- **What is Missing:** Local storage inquiry history (intentional security improvement).
- **Change Intentionality:** Intentional engineering improvements.
- **Relevant Files:**
  - `src/pages/Contact.tsx`
  - `src/lib/inquiries.ts`
- **Selective Restoration Feasibility:** The current version is superior and robust.

---

### Section 12: Header and Navigation
- **Original Design & Behavior (`stash@{0}`):**
  - Sticky glass header with Wordmark, navigation links (`Work`, `Services`, `Contact`), and "Start a Project" CTA.
  - Interactive Services hover/click preview drawer.
  - Auto-hide on scroll down, auto-reveal on scroll up.
  - Mobile full-screen navigation drawer.
- **Current Design & Behavior (Working Copy):**
  - Identical navigation links and Services preview drawer.
  - Added keyboard accessibility: `Escape` closes menus and returns focus to toggle button; tab focus into header automatically reveals the navbar.
  - Added `aria-controls="mobile-navigation"` and `role="navigation"`.
  - Smooth reduced-motion compliance.
- **What Changed:** Enhanced with keyboard and screen reader accessibility.
- **What is Missing:** Nothing.
- **Change Intentionality:** Intentional accessibility improvements.
- **Relevant Files:**
  - `src/components/Header.tsx`
- **Selective Restoration Feasibility:** Already in the optimal state.

---

## 3. Missing Original Elements

The following items from `stash@{0}` are currently absent or modified in the working copy:

| Item | Location | `stash@{0}` Implementation | Current Implementation | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Ask Arche Typewriter Loop** | `src/components/ArcheAssistant.tsx` | Simulated `idle` → `thinking` → `typing` → `streaming` phases, 3 bouncing `.type-dot` circles, `Thinking`/`Composing`/`Responding`/`Ready` badges. | Instant answer, permanent `· Ready` badge, no typing dots. | **Recommended for Selective Restoration.** Restores the dynamic AI feel without degrading accessibility (reduced-motion bypasses delay). |
| **Signal Dot First-Scroll Wobble** | `src/components/BridgeDot.tsx` / `src/lib/signal.ts` | One-time delight wobble animation (`sessionStorage.getItem("arche_first_scroll_reward")`) on first scroll past hero. | Signal travels along quadratic arc, but without the initial playful "look around" wobble. | **Recommended for Selective Restoration.** Can be added to `src/lib/signal.ts` on initial travel trigger. |
| **AutomationCompare Quantitative Metrics** | `src/components/AutomationCompare.tsx` | "Handling time 12:00 → 0:04", "7 hand-offs gone", "Watch the hand-offs disappear". | "View: 50%", "Manual steps shown", "Explore the hand-offs". | **Keep Current.** Upstream commercial review flagged this for lack of empirical proof. Retaining current illustrative copy is safer. |
| **Project Row Honesty Verification Copy** | `src/components/WorkIndex.tsx` | "...only what was actually built." | "...not a client case study, testimonial or claimed result." | **Owner Decision.** Either copy is acceptable; current copy provides legal protection. |
| **LocalStorage Inquiry Logging** | `src/pages/Contact.tsx` | Appended every submitted inquiry to `localStorage.getItem("arche:inquiries")`. | Omitted. Submits only to Web3Forms / fallback. | **Keep Current.** Storing PII in browser localStorage without encryption violates privacy best practices. |

---

## 4. Critical Regressions & Fixes Applied

During the upstream merge, several severe regressions occurred. The following table documents these regressions and their current resolution status:

| Defect / Regression | Source of Regression | Status in Working Copy |
| :--- | :--- | :--- |
| **Architecture 3D Replacement** | PR #7 replaced 686-line spatial camera rail with 137-line flat SVG diagram. | **RESOLVED.** 686-line `Architecture3D.tsx` fully restored from `stash@{0}`. |
| **Approach & Process Diagram Removal** | PR #7 deleted `ApproachVisual` and `ProcessVisual` in favor of flat CSS models. | **RESOLVED.** Full SVG nodal diagram and morph principles restored from `stash@{0}`. |
| **Services 4 Flagship Demos Bypassed** | PR #7 created flat mockups in `src/experience.css` (`.edit-demo`, `.web-experience`, etc.). | **RESOLVED.** All 4 interactive flagship demos restored; `src/experience.css` eliminated. |
| **UTF-8 Character Corruption (Mojibake)** | Windows CRLF/merge tool corrupted arrows, em-dashes, and pause icons across 5 demo files. | **RESOLVED.** 100% repaired. 0 corrupted characters remain. |
| **Left Service Column Vertical Space** | Left column clustered in top half while demo occupied ~450px. | **RESOLVED.** Re-balanced into compact upper editorial group + bottom-aligned Explore button. |
| **Problem Section Scroll Fatigue** | Pinned scroll distance of 260vh felt sluggish. | **RESOLVED.** Tightened to 210vh with reduced trailing hold phase (0.04). |
| **Short Viewport Pinned Trapping** | Desktop pin triggered on short laptop viewports, trapping users. | **RESOLVED.** Added `(min-height: 760px)` condition to desktop query. |

---

## 5. Recommended Selective Restoration Plan

If you wish to complete the restoration back to the high-delight character of `stash@{0}`, the following selective restorations are recommended:

### Option A: Restore the "Ask Arche" Typewriter & Streaming States (Recommended)
- **What to restore:** In `src/components/ArcheAssistant.tsx`, re-introduce the `phase: "idle" | "thinking" | "typing" | "streaming"` cycle, the animated `.type-dot` pulsating circles, and dynamic status labels (`Thinking...`, `Composing...`, `Responding...`).
- **Accessibility Safeguard:** Wrap the delay in `if (prefersReducedMotion()) { /* reveal instantly */ return; }` so users with motion sensitivity receive immediate answers.
- **Impact on Motion System:** Zero. It is isolated entirely within the ArcheAssistant DOM container.

### Option B: Restore the First-Scroll Signal Wobble (Recommended)
- **What to restore:** In `src/lib/signal.ts`, on the first invocation of `signal.travel("hero-dot", "problem-website")`, check `sessionStorage.getItem("arche_first_scroll_reward")`. If not set, run a quick 4-step GSAP micro-wobble on the inner dot before it follows the arc, then mark the session storage flag.
- **Accessibility Safeguard:** Bypassed when `prefersReducedMotion()` is true.
- **Impact on Motion System:** Zero. It complements the existing quadratic arc.

### Option C: Revert AutomationCompare Metrics (Optional / Owner Review)
- Only restore the `12:00 → 0:04` handling time metrics if the studio owner has confirmed that this benchmark is legally defensible and desired for marketing.

---

## 6. Files That Should Remain Untouched

To protect the working DOM motion system, test integrity, and accessibility improvements, the following files should **NOT** be touched or reverted:

1. `src/components/Architecture3D.tsx` — 100% identical to original; working properly.
2. `src/components/ServiceTransitionLayer.tsx` — Houses the Morph Engine; critical for seamless demo transitions.
3. `src/lib/serviceMotion.ts` — Contains the geometry measurement and ghost tracking logic.
4. `src/components/WebDevDemo.tsx` — 100% restored, fully responsive, zero lint/type errors.
5. `src/components/AgentDemo.tsx` — 100% restored, working reasoning trace and speech synthesis.
6. `src/components/VideoEditingDemo.tsx` — Complete with keyboard navigation and playhead scrub.
7. `src/components/ProblemSystem.tsx` — Pinned at the optimized 210vh distance with short-viewport protection.
8. `src/motion/*` & `src/lib/gsap.ts` — Central motion tokens and scroll registration.
9. `src/pages/Contact.tsx` — Secure form submission, progress bar, and no PII leak.

---

## 7. Safe Implementation Order (When Authorized)

When you are ready to proceed with implementing these selective restorations, follow this safe sequence:

1. **Step 1: Ask Arche Typewriter Simulation**
   - File: `src/components/ArcheAssistant.tsx`
   - Action: Restore `phase` state, `type-dot` elements, and thinking delay with `prefersReducedMotion()` guard.
   - Verification: Run `npm run typecheck` and test interactive chat in browser.

2. **Step 2: Signal Dot First-Scroll Delight Wobble**
   - File: `src/lib/signal.ts`
   - Action: Add one-time session storage wobble to the `signal.travel` scrub timeline.
   - Verification: Verify initial scroll from Hero to Problem in browser.

3. **Step 3: Verification Suite Execution**
   - Run: `npm run verify` (Desktop 19 checks)
   - Run: `MOBILE=1 node scripts/verify.mjs` (Mobile 18 checks)
   - Run: `REDUCED=1 node scripts/verify.mjs` (Reduced motion 18 checks)
   - Run: `npm run verify:motion` (Morph engine 12 transitions)
   - Run: `npm run build` (Singlefile bundle check)

---

*Report prepared without modifying project source code or altering Git branch state.*
