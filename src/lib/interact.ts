import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "./gsap";

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Global magnetic behaviour for `.btn` and `[data-magnetic]`.
 * Small, damped pull toward the pointer (capped at ±10px) with an elastic
 * return. Desktop / fine pointer only; skipped under reduced motion.
 */
export function useMagnetic() {
  useEffect(() => {
    if (prefersReducedMotion() || !hasFinePointer()) return;

    let current: HTMLElement | null = null;
    let xTo: ((v: number) => void) | null = null;
    let yTo: ((v: number) => void) | null = null;

    const release = (el: HTMLElement) =>
      gsap.to(el, { x: 0, y: 0, duration: 0.75, ease: "elastic.out(1, 0.55)", overwrite: "auto" });

    const clamp = (v: number) => Math.max(-10, Math.min(10, v));

    const onMove = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.(".btn, [data-magnetic]") as HTMLElement | null;
      if (t !== current) {
        if (current) release(current);
        current = t;
        xTo = t ? gsap.quickTo(t, "x", { duration: 0.45, ease: "power3.out" }) : null;
        yTo = t ? gsap.quickTo(t, "y", { duration: 0.45, ease: "power3.out" }) : null;
      }
      if (!current || !xTo || !yTo) return;
      const r = current.getBoundingClientRect();
      const s = parseFloat(current.dataset.magnetic || "") || 0.25;
      xTo(clamp((e.clientX - (r.left + r.width / 2)) * s));
      yTo(clamp((e.clientY - (r.top + r.height / 2)) * s));
    };

    const onLeave = () => {
      if (current) release(current);
      current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);
}
