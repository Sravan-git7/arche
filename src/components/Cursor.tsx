import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";

/**
 * Ultra-clean weightless & precise custom cursor with awmedia-style white cursor glow.
 *
 * States:
 *  - 34px smoked translucent lens with 4px #FFFFFF center dot
 *  - 240px subtle white ambient light follower trailing cursor via gsap.quickTo
 *  - Interactive: expands smoothly on hover with lime specular border
 *  - Work Thumbnails: 56px lens with crisp #9EE41A ↗ (data-cursor="view")
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const ambient = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !hasFinePointer() || (typeof window !== "undefined" && window.innerWidth < 1024)) return;

    const d = dot.current;
    const r = ring.current;
    const a = ambient.current;
    const l = label.current;
    if (!d || !r || !l) return;

    gsap.set([d, r], { opacity: 0 });
    if (a) gsap.set(a, { opacity: 0 });

    // Precise lerping via gsap.quickTo
    const dx = gsap.quickTo(d, "x", { duration: 0.05, ease: "power3.out" });
    const dy = gsap.quickTo(d, "y", { duration: 0.05, ease: "power3.out" });
    const rx = gsap.quickTo(r, "x", { duration: 0.12, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.12, ease: "power3.out" });
    const ax = a ? gsap.quickTo(a, "x", { duration: 0.32, ease: "power2.out" }) : null;
    const ay = a ? gsap.quickTo(a, "y", { duration: 0.32, ease: "power2.out" }) : null;

    let shown = false;
    let magnet: HTMLElement | null = null;
    let currentState: "default" | "hover" | "view" = "default";

    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([d, r], { opacity: 1, duration: 0.25 });
        if (a) gsap.to(a, { opacity: 1, duration: 0.4 });
      }

      dx(e.clientX);
      dy(e.clientY);
      if (ax && ay) {
        ax(e.clientX);
        ay(e.clientY);
      }

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

      const cursorTarget = el.closest?.("[data-cursor]") as HTMLElement | null;
      const cursorAttr = cursorTarget?.dataset?.cursor?.toLowerCase();
      // Work thumbnail images ONLY: data-cursor="view" on elements inside work showcase thumbnail trays
      const isWorkThumbnail = Boolean(
        el.closest?.(".work-thumbnail-frame, [data-work-thumbnail]") ||
        (cursorAttr === "view" && Boolean(cursorTarget?.querySelector("img, video") || cursorTarget?.classList.contains("cursor-pointer") && cursorTarget?.closest(".aspect-\\[16\\/10\\]")))
      );
      const isView = cursorAttr === "view" && isWorkThumbnail && !el.closest?.("h1, h2, h3, h4, p, span.editorial-line, .faq-card");
      // Interactive clickable controls: buttons, links, inputs
      const isHover = !isView && Boolean(el.closest?.("a, button, input, textarea, label, [role='button'], [role='slider'], [data-cursor='hover']"));

      // Ring magnetism reserved for primary CTAs
      magnet = (el.closest?.("[data-magnetic]") as HTMLElement | null) ?? null;

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
      if (a) gsap.to(a, { opacity: 0, duration: 0.3 });
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
      {/* 240px Subtle White Ambient Light Follower over dark fluted-glass background */}
      <div
        ref={ambient}
        className="pointer-events-none fixed top-0 left-0 w-[240px] h-[240px] -ml-[120px] -mt-[120px] rounded-full z-[1] will-change-transform hidden lg:block"
        style={{
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.065) 0%, transparent 70%)",
        }}
        aria-hidden
      />
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
