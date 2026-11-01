/**
 * ARCHE — motion language.
 *
 * One vocabulary for the whole experience. GSAP tweens, CSS transitions and
 * scroll choreography all draw from the same curves, duration bands and
 * stagger steps, so a reveal in the hero and a state change in a service
 * demo feel like they belong to the same system.
 *
 * Rhythm: calm → curiosity → interaction → cinematic → clarity →
 * exploration → resolution. Use `DUR.cinematic` sparingly; `DUR.micro`
 * is for direct manipulation (press, focus, toggle).
 *
 * CSS mirrors these curves in :root (--e-out / --e-inout / --e-in) and in
 * --dur-* / --stagger-*, so DOM transitions and JS tweens stay aligned.
 */

/** GSAP easing names. Kept as plain strings — no CustomEase dependency. */
export const EASE = {
  /** The house curve: fast departure, long, quiet arrival (≈ cubic-bezier(.16,1,.3,1)). */
  out: "power3.out",
  /** Heavy editorial reveals and clip-path wipes. */
  expo: "expo.out",
  /** Pinned sequences, wipes, route changes. */
  inOut: "power4.inOut",
  /** Short state changes, fades, HUD updates. */
  soft: "power2.out",
  /** Scroll-scrubbed, linear camera travel. */
  linear: "none",
  /** Anticipation + follow-through for arrivals. */
  back: "back.out(1.7)",
  /** Spring return on release (magnetic buttons, cursor press). */
  spring: "elastic.out(1, 0.55)",
} as const;

/** Duration bands, in seconds. */
export const DUR = {
  micro: 0.14, // 140ms micro feedback
  short: 0.24, // 240ms short transition
  base: 0.48, // 480ms base element transition
  hop: 0.8, // 800ms generic tab hop
  serviceTransition: 1.1, // 1100ms signature service transition
  slow: 0.85, // grouped transitions
  reveal: 1.05, // editorial type masks
  material: 1.3, // clip-path / image wipes
  cinematic: 1.6, // pinned sequence beats only
  ambient: 6.0, // 6000ms ambient cycle
} as const;

/** Millisecond constants matching Section 1 shared tokens */
export const SHARED_TOKENS = {
  micro: 140,
  short: 240,
  base: 480,
  hop: 800,
  serviceTransition: 1100,
  ambient: 6000,
} as const;

/** Motion grammar definitions per service form (Section 1) */
export const GRAMMAR = {
  video: {
    name: "CUT",
    cssEase: "cubic-bezier(.9, 0, .1, 1)",
    gsapEase: "power4.inOut",
    durationMs: 180,
    heldBeats: true,
  },
  web: {
    name: "SETTLE",
    cssEase: "cubic-bezier(.16, 1, .3, 1)",
    gsapEase: "back.out(1.15)", // ~4% overshoot spring
    spring: { stiffness: 170, damping: 20 },
    durationMs: 550,
  },
  automation: {
    name: "ROUTE",
    cssEase: "cubic-bezier(.45, 0, .15, 1)",
    gsapEase: "power3.inOut",
    signalSpeedPxPerSec: 900,
    durationMs: 450,
  },
  agent: {
    name: "SPEAK",
    cssEase: "cubic-bezier(.25, .1, .25, 1)",
    gsapEase: "power2.out",
    staggerMs: 100,
    jitterMs: 30,
    durationMs: 480,
  },
} as const;

/** Stagger steps, in seconds. */
export const STAGGER = {
  chars: 0.022,
  words: 0.055,
  items: 0.08,
  scenes: 0.14,
} as const;

/** Scroll choreography defaults. */
export const SCROLL = {
  revealStart: "top 85%",
  parallaxAmount: 8, // percent of element height
  scrub: 0.6,
} as const;

export type MotionTokens = {
  EASE: typeof EASE;
  DUR: typeof DUR;
  STAGGER: typeof STAGGER;
  SHARED_TOKENS: typeof SHARED_TOKENS;
  GRAMMAR: typeof GRAMMAR;
};

/** Single source of truth for the OS-level motion preference. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Subscribe to a *change* of the motion preference at runtime. Components
 * that build timelines once need to rebuild (or tear down) when a visitor
 * flips the OS setting mid-session instead of waiting for a reload.
 */
export function onMotionPreferenceChange(fn: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = (e: MediaQueryListEvent) => fn(e.matches);
  mq.addEventListener?.("change", handler);
  return () => mq.removeEventListener?.("change", handler);
}

/** Coarse pointers get shorter, simpler motion and no hover-only effects. */
export const hasFinePointer = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Motion is allowed at all by the visitor's OS setting. */
export const motionEnabled = (): boolean => !prefersReducedMotion();

/** Narrow touch devices get shorter sequences; never a blanket motion ban. */
export const constrainedDevice = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 640px) and (pointer: coarse)").matches;

/** Multiply a duration by this on constrained devices. */
export const duration = (seconds: number): number =>
  constrainedDevice() ? Math.min(seconds, DUR.base) : seconds;
