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
  micro: 0.18, // press / focus / toggle feedback
  fast: 0.32, // hover responses, small swaps
  base: 0.55, // standard element transition
  slow: 0.85, // grouped transitions
  reveal: 1.05, // editorial type masks
  material: 1.3, // clip-path / image wipes
  cinematic: 1.6, // pinned sequence beats only
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
