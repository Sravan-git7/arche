import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";

/**
 * Contextual cursor. A precise dot plus a trailing ring that morphs between
 * states: idle, link, labelled (VIEW / TRY / DRAG / ASK / ROTATE / START …).
 * The ring is pulled toward the centre of magnetic targets, and compresses
 * on press. Desktop only.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !hasFinePointer()) return;

    const d = dot.current!;
    const r = ring.current!;
    const l = label.current!;

    gsap.set([d, r], { opacity: 0 });
    gsap.set(r, { scale: 0.42 });

    const dx = gsap.quickTo(d, "x", { duration: 0.1, ease: "power3.out" });
    const dy = gsap.quickTo(d, "y", { duration: 0.1, ease: "power3.out" });
    const rx = gsap.quickTo(r, "x", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.5, ease: "power3.out" });

    let shown = false;
    let text = "";
    let baseScale = 0.42;
    let magnet: HTMLElement | null = null;

    const setScale = (s: number) => {
      baseScale = s;
      gsap.to(r, { scale: s, duration: 0.45, ease: "power3.out", overwrite: "auto" });
    };

    const setLabel = (next: string) => {
      if (next === text) return;
      text = next;
      gsap.to(l, {
        opacity: 0,
        y: -4,
        duration: 0.12,
        overwrite: true,
        onComplete: () => {
          l.textContent = next;
          gsap.fromTo(l, { y: 4 }, { opacity: next ? 1 : 0, y: 0, duration: 0.2 });
        },
      });
    };

    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
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
      const labelled = el?.closest?.("[data-cursor]") as HTMLElement | null;
      const interactive = el?.closest?.("a,button,input,textarea,label,[role='slider']");
      // ring magnetism, like button magnetism, is reserved for primary CTAs
      magnet = (el?.closest?.("[data-magnetic]") as HTMLElement | null) ?? null;

      if (labelled) {
        setLabel(labelled.dataset.cursor || "");
        setScale(1);
        gsap.to(d, { opacity: 0, duration: 0.2 });
      } else {
        setLabel("");
        setScale(interactive ? 0.7 : 0.42);
        gsap.to(d, { opacity: 1, duration: 0.2 });
      }
    };

    const down = () => gsap.to(r, { scale: baseScale * 0.84, duration: 0.18, ease: "power2.out" });
    const up = () => gsap.to(r, { scale: baseScale, duration: 0.5, ease: "elastic.out(1, 0.5)" });

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
      <div ref={dot} className="cursor-dot" aria-hidden />
      <div ref={ring} className="cursor-ring" aria-hidden>
        <span ref={label} style={{ opacity: 0 }} />
      </div>
    </>
  );
}
