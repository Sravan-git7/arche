/**
 * Motion tokens — Arche motion grammar.
 * Standardized easing, duration, and stagger values per docs/MOTION_RULES.md.
 */

export const EASE = {
  reveal: "expo.out",
  soft: "power3.out",
  inOut: "power3.inOut",
  land: "back.out(1.25)",
  travel: "power2.inOut",
  scrub: "none",
} as const;

export const DUR = {
  micro: 0.18,
  short: 0.35,
  base: 0.6,
  reveal: 1.0,
  scene: 1.2,
  hop: 0.8,
} as const;

export const STAGGER = {
  line: 0.08,
  word: 0.04,
  item: 0.06,
} as const;

export const tokens = {
  ease: EASE,
  dur: DUR,
  stagger: STAGGER,
} as const;

export default tokens;
