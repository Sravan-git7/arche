import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";

/**
 * Ultra-clean weightless & precise custom cursor (desktop fine pointer only).
 *
 * States:
 *  - Default: 22px transparent ring (1px solid rgba(20,20,19,0.22)) + 4px #141413 center dot.
 *  - Interactive: 34px transparent ring with 1.5px solid #72B314 (center dot hidden, 100% clear).
 *  - Work Thumbnails: 54px frosted-glass lens with crisp #9EE41A ↗ (data-cursor="view" only).
 *
 * Smoothly lerped via gsap.quickTo at 0.12s ease.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !hasFinePointer() || (typeof window !== "undefined" && window.innerWidth < 1024)) return;

    const d = dot.current;
    const r = ring.current;
    const l = label.current;
    if (!d || !r || !l) return;

    gsap.set([d, r], { opacity: 0 });

    // Precise lerping at 0.12s ease
    const dx = gsap.quickTo(d, "x", { duration: 0.06, ease: "power3.out" });
    const dy = gsap.quickTo(d, "y", { duration: 0.06, ease: "power3.out" });
    const rx = gsap.quickTo(r, "x", { duration: 0.12, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.12, ease: "power3.out" });

    let shown = false;
    let magnet: HTMLElement | null = null;
    let currentState: "default" | "hover" | "view" = "default";

    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([d, r], { opacity: 1, duration: 0.25 });
      }

      dx(e.clientX);
      dy(e.clientY);

      if (magnet) {
        const b = magnet.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        rx(cx + (e.clientX - cx) * 0.35);
        ry(cy + (e.clientY - cy) * 0.35);
      } else {
        rx(e.clientX);
        ry(e.clientY);
      }
    };

    const over = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;

      const cursorAttr = (el.closest?.("[data-cursor]") as HTMLElement | null)?.dataset?.cursor?.toLowerCase();
      // Work thumbnail images ONLY: data-cursor="view"
      const isView = cursorAttr === "view";
      // Interactive clickable controls: buttons, links, inputs
      const isHover = !isView && Boolean(el.closest?.("a, button, input, textarea, label, [role='button'], [role='slider']"));

      // Ring magnetism reserved for primary CTAs
      magnet = (el.closest?.("[data-magnetic]") as HTMLElement | null) ?? null;

      // Check if hovering dark/obsidian background
      const darkEl = el.closest?.(".on-ink, .bg-\\[\\#141413\\], [data-theme='dark'], .video-grading-monitor, .navbar-smoked-obsidian");
      if (darkEl) {
        d.classList.add("on-dark");
      } else {
        d.classList.remove("on-dark");
      }

      if (isView) {
        if (currentState !== "view") {
          currentState = "view";
          r.className = "cursor-ring cursor-state-view";
          l.innerHTML = "&#x2197;"; // ↗
          l.style.opacity = "1";
          d.classList.remove("cursor-dot-hover");
          gsap.to(d, { opacity: 0, duration: 0.12 });
        }
      } else if (isHover) {
        if (currentState !== "hover") {
          currentState = "hover";
          r.className = "cursor-ring cursor-state-hover";
          l.innerHTML = "";
          l.style.opacity = "0";
          d.classList.add("cursor-dot-hover");
          gsap.to(d, { opacity: 1, duration: 0.12 });
        }
      } else {
        if (currentState !== "default") {
          currentState = "default";
          r.className = "cursor-ring";
          l.innerHTML = "";
          l.style.opacity = "0";
          d.classList.remove("cursor-dot-hover");
          gsap.to(d, { opacity: 1, duration: 0.18 });
        }
      }
    };

    const down = () => {
      gsap.to(r, { scale: 0.88, duration: 0.16, ease: "power2.out" });
    };

    const up = () => {
      gsap.to(r, { scale: 1, duration: 0.35, ease: "back.out(1.7)" });
    };

    const leave = () => {
      shown = false;
      gsap.to([d, r], { opacity: 0, duration: 0.25 });
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointerleave", leave);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot hidden lg:block" aria-hidden />
      <div
        ref={ring}
        className="cursor-ring hidden lg:grid"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        aria-hidden
      >
        <span ref={label} className="pointer-events-none select-none text-base font-semibold leading-none" />
      </div>
    </>
  );
}
