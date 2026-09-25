import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";

/**
 * The recurring lime signal, carried from the hero into the Problem section.
 *
 * Starts on the hero's in-plane dot and travels with scroll to whatever
 * element carries `data-bridge-target`:
 *   mode "pin"  → lands on that element at the moment its section pins,
 *                 then hands off (the pinned timeline owns the dot from there)
 *   mode "flow" → lands on it when it reaches the viewport centre
 * Position is a pure function of scroll progress — never a timed tween.
 */

/** Layout position from the offset chain — unaffected by our transforms. */
const offsetPos = (n: HTMLElement, stop: HTMLElement | null = null) => {
  let x = 0;
  let y = 0;
  let c: HTMLElement | null = n;
  while (c && c !== stop) {
    x += c.offsetLeft;
    y += c.offsetTop;
    c = c.offsetParent as HTMLElement | null;
  }
  return { x, y };
};

export function BridgeDot() {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      let from = { x: 0, y: 0 };
      let to = { x: 0, y: 0 };
      let arrive = 1;
      let ok = false;
      let heroDot: HTMLElement | null = null;

      const measure = () => {
        const src = document.querySelector<HTMLElement>(".hp-signal");
        heroDot = src;
        const dst = document.querySelector<HTMLElement>("[data-bridge-target]");
        ok = !!(src && dst);
        if (!src || !dst) return;

        // hero dot at rest (scroll 0 → viewport == document)
        const s = offsetPos(src);
        from = { x: s.x + src.offsetWidth / 2, y: s.y + src.offsetHeight / 2 };

        if (dst.dataset.bridgeMode === "pin") {
          const root = dst.closest<HTMLElement>("[data-bridge-root]");
          const pin = ScrollTrigger.getById(dst.dataset.bridgePin || "");
          const r = offsetPos(dst, root);
          arrive = Math.max(1, pin ? pin.start : 1);
          // the pinned root sits at the viewport's top-left while pinned
          to = { x: r.x + dst.offsetWidth / 2, y: r.y + dst.offsetHeight / 2 };
        } else {
          const d = dst.getBoundingClientRect();
          const cy = d.top + window.scrollY + d.height / 2;
          arrive = Math.max(1, cy - window.innerHeight / 2);
          to = { x: d.left + d.width / 2, y: window.innerHeight / 2 };
        }
      };

      ScrollTrigger.create({
        start: 0,
        end: () => {
          measure();
          return arrive;
        },
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (!ok) return;
          const t = self.progress;
          // exactly one dot: the hero's stays on its plate only at rest
          if (heroDot) heroDot.style.visibility = t > 0 ? "hidden" : "";
          gsap.set(el, {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
            // takes over from the hero dot immediately, at the same position
            opacity: t > 0 ? 1 : 0,
          });
        },
        // hand-off: the destination's own timeline takes the dot from here
        onLeave: () => gsap.set(el, { opacity: 0 }),
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <span
      ref={ref}
      className="signal-dot pointer-events-none fixed top-0 left-0 z-[5]"
      style={{ marginLeft: -3, marginTop: -3, opacity: 0 }}
      aria-hidden
    />
  );
}
