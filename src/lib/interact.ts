import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "./gsap";

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * PROMPT 20 — Magnetic buttons.
 * Applies ONLY to elements tagged [data-magnetic] — the primary CTAs
 * (START A PROJECT, the Automation demo's RUN, Ask Arche's SEND).
 * Restraint is the point: body links, footer links and FAQ items never
 * get this. On pointer proximity (within ~40px of the button edge) the
 * button shifts up to ~8px toward the pointer with a damped-spring
 * response, snapping back on exit. Desktop / fine pointer only; skipped
 * under reduced motion.
 */
export function useMagnetic() {
  useEffect(() => {
    if (prefersReducedMotion() || !hasFinePointer()) return;

    const PROXIMITY = 40;
    const MAX_SHIFT = 8;

    let els: HTMLElement[] = [];
    const pairs = new Map<HTMLElement, { x: gsap.QuickToFunc; y: gsap.QuickToFunc }>();

    const collect = () => {
      els = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
    };
    collect();
    const mo = new MutationObserver(collect);
    mo.observe(document.body, { childList: true, subtree: true });

    const pairFor = (el: HTMLElement) => {
      let p = pairs.get(el);
      if (!p) {
        p = {
          x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }),
        };
        pairs.set(el, p);
      }
      return p;
    };

    const release = (el: HTMLElement) => {
      gsap.killTweensOf(el, "x,y");
      pairs.delete(el);
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.55)", overwrite: "auto" });
    };

    const clamp = (v: number) => Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, v));

    const onMove = (e: PointerEvent) => {
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        // distance from the pointer to the rect edge (0 when inside)
        const ex = Math.max(r.left - e.clientX, e.clientX - r.right, 0);
        const ey = Math.max(r.top - e.clientY, e.clientY - r.bottom, 0);
        const near = Math.hypot(ex, ey) <= PROXIMITY;
        if (near) {
          const p = pairFor(el);
          p.x(clamp((e.clientX - (r.left + r.width / 2)) * 0.16));
          p.y(clamp((e.clientY - (r.top + r.height / 2)) * 0.16));
        } else if (pairs.has(el)) {
          release(el);
        }
      }
    };

    const onLeave = () => {
      pairs.forEach((_, el) => release(el));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      mo.disconnect();
    };
  }, []);
}
