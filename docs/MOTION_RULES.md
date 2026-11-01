# Motion Rules

R1 NO SUBSTITUTION. If an effect in a task cannot be built as specified, do not replace it with a simpler effect, a fade, or a generic reveal. Skip that one item, build everything else, and list exactly what is blocked and why.

R2 NO RESTYLING. Do not change colors, fonts, sizes, spacing, copy, class names or component structure except where the task names the change. Read colors and fonts from the existing CSS variables or Tailwind config. Never hard-code new hex values.

R3 INSPECT BEFORE ASSUMING. When a task says "report", describe what you found in the code in plain words before you edit anything.

R4 PERFORMANCE. Animate transform, opacity, clip-path and stroke-dashoffset. Border-radius and background-color are allowed sparingly. Never animate width, height, top or left on more than about 10 elements at once. No blur filters on large areas.

R5 LIBRARIES. Use GSAP 3 (core, ScrollTrigger, SplitText, Flip, DrawSVG, MotionPath; all are free), @gsap/react (useGSAP), and Lenis (npm package "lenis"). Add no other animation library. Do not add Three.js unless it is already a dependency.

R6 REACT HYGIENE. Create every timeline and ScrollTrigger inside useGSAP with a scope ref (or gsap.context) so it is cleaned up on unmount and under React StrictMode. Revert SplitText instances on cleanup. Use gsap.matchMedia for desktop, mobile and reduced-motion variants. Use invalidateOnRefresh: true wherever positions are measured from the DOM.

R7 REDUCED MOTION. Under prefers-reduced-motion: reduce there is no scrubbed motion, no pinning, no parallax, no Lenis. Content appears in its final state with at most a 200ms opacity transition.

R8 SCROLL SYNC. Lenis is driven from gsap.ticker (gsap.ticker.add((t) => lenis.raf(t * 1000))), lenis.on("scroll", ScrollTrigger.update), and gsap.ticker.lagSmoothing(0).

R9 MOBILE (below 768px). No pinned scrubbed scenes. Use once-per-view reveals instead.

R10 HONESTY. No invented clients, metrics, percentages or testimonials. If you find any in the code, report them. Never add any.

R11 REPORT FORMAT. At the end of every task output: (a) files changed, (b) what you verified and how, (c) anything not done and why, (d) what you observed at each scroll checkpoint named in the task.

R12 NEVER TOUCH the contact submission logic (src/lib/inquiries.ts and the form submit handler) or any environment variable handling.
