import { useEffect, useLayoutEffect, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion, EASE, DUR, STAGGER, SCROLL, onMotionPreferenceChange, duration } from "./gsap";

/**
 * Splits an element's text into word-level masks: each word becomes an
 * overflow-hidden box containing an <i> that can slide up from below.
 * Word-level (not char-level) keeps the DOM light and preserves natural
 * line-wrapping, which matters for the big editorial statements.
 */
function splitWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split === "1") {
    return Array.from(el.querySelectorAll<HTMLElement>(".r-w > i"));
  }
  const text = el.textContent || "";
  el.textContent = "";
  const frag = document.createDocumentFragment();
  const inners: HTMLElement[] = [];

  text.split(/(\s+)/).forEach((tok) => {
    if (!tok) return;
    if (/^\s+$/.test(tok)) {
      frag.appendChild(document.createTextNode(" "));
      return;
    }
    const box = document.createElement("span");
    box.className = "r-w";
    const inner = document.createElement("i");
    inner.textContent = tok;
    box.appendChild(inner);
    frag.appendChild(box);
    inners.push(inner);
  });

  el.appendChild(frag);
  el.dataset.split = "1";
  return inners;
}

/** Splits into individual characters (used sparingly, for short statements). */
function splitChars(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split === "1") {
    return Array.from(el.querySelectorAll<HTMLElement>(".r-w > i"));
  }
  const text = el.textContent || "";
  el.textContent = "";
  const frag = document.createDocumentFragment();
  const inners: HTMLElement[] = [];

  Array.from(text).forEach((ch) => {
    if (ch === " ") {
      frag.appendChild(document.createTextNode(" "));
      return;
    }
    const box = document.createElement("span");
    box.className = "r-w";
    const inner = document.createElement("i");
    inner.textContent = ch;
    box.appendChild(inner);
    frag.appendChild(box);
    inners.push(inner);
  });

  el.appendChild(frag);
  el.dataset.split = "1";
  return inners;
}

/**
 * The single reveal system for the whole site. Element grammar:
 *
 *   data-r="mask"  → headline, word masks sliding up          (statement)
 *   data-r="chars" → short statement, character cascade       (emphasis)
 *   data-r="clip"  → image / frame, clip-path wipe upward     (material)
 *   data-r="img"   → inner media, 1.08 → 1 settle             (depth)
 *   data-r="meta"  → small label, fade + short translate      (support)
 *   data-r="line"  → rule, scaleX draw from left              (structure)
 *   data-r="fade"  → plain opacity, for large quiet blocks    (breath)
 *
 * data-r-delay (ms) and data-r-start override per element.
 *
 * All durations / curves / staggers come from lib/motion.ts. Tweens that
 * are built lazily inside a ScrollTrigger callback are tracked explicitly —
 * gsap.context() only auto-reverts animations created synchronously, so
 * without this they would survive a route change and leak.
 */
export function useReveal() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReduced), []);

  useLayoutEffect(() => {
    if (reduced) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-r]"));
    const triggers: ScrollTrigger[] = [];
    const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];

    const ctx = gsap.context(() => {
      nodes.forEach((el) => {
        const kind = el.dataset.r;
        const delay = Number(el.dataset.rDelay || 0) / 1000;
        const start = el.dataset.rStart || SCROLL.revealStart;
        const once = el.dataset.rRepeat !== "1";

        const build = (): gsap.core.Tween | gsap.core.Timeline | null => {
          switch (kind) {
            case "mask": {
              const w = splitWords(el);
              gsap.set(el, { opacity: 1 });
              return gsap.fromTo(
                w,
                { yPercent: 108 },
                {
                  yPercent: 0,
                  duration: duration(DUR.reveal),
                  ease: EASE.expo,
                  stagger: STAGGER.words,
                  delay,
                }
              );
            }
            case "chars": {
              const c = splitChars(el);
              gsap.set(el, { opacity: 1 });
              return gsap.fromTo(
                c,
                { yPercent: 105, opacity: 0 },
                {
                  yPercent: 0,
                  opacity: 1,
                  duration: duration(DUR.slow),
                  ease: EASE.out,
                  stagger: STAGGER.chars,
                  delay,
                }
              );
            }
            case "clip":
              return gsap.to(el, {
                clipPath: "inset(0 0 0% 0)",
                duration: duration(DUR.material),
                ease: EASE.expo,
                delay,
              });
            case "img":
              return gsap.fromTo(
                el,
                { scale: 1.08 },
                { scale: 1, duration: DUR.cinematic, ease: EASE.expo, delay }
              );
            case "line":
              return gsap.to(el, {
                scaleX: 1,
                duration: duration(DUR.reveal),
                ease: EASE.expo,
                delay,
              });
            case "fade":
              return gsap.to(el, { opacity: 1, duration: duration(DUR.reveal), ease: EASE.soft, delay });
            default:
              return gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: duration(DUR.slow),
                ease: EASE.out,
                delay,
              });
          }
        };

        // Pre-split masked text before first paint so nothing flashes.
        if (kind === "mask" || kind === "chars") gsap.set(el, { opacity: 0 });

        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start,
            once,
            onEnter: () => {
              const t = build();
              if (t) tweens.push(t);
            },
          })
        );
      });
    });

    return () => {
      tweens.forEach((t) => t.kill());
      triggers.forEach((t) => t.kill());
      ctx.revert();
    };
  }, [reduced]);
}

/** Scroll-linked parallax for media. data-par = strength in percent. */
export function useParallax() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReduced), []);

  useLayoutEffect(() => {
    if (reduced) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-par]"));

    const ctx = gsap.context(() => {
      nodes.forEach((el) => {
        const amt = Number(el.dataset.par || SCROLL.parallaxAmount);
        gsap.fromTo(
          el,
          { yPercent: -amt },
          {
            yPercent: amt,
            ease: EASE.linear,
            scrollTrigger: {
              trigger: el.parentElement || el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, [reduced]);
}
