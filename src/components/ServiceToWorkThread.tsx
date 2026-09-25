import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";

/**
 * PROMPT 10 — Services → Work Transition
 *
 * Choreography:
 * Whichever service tab is active when scrolling past the Services section,
 * its stage frame outer container smoothly scales and shifts position to become
 * the exact position and size of the first Work project's frame.
 *
 * Uses a fixed overlay element that tracks scroll progress between the Services stage
 * (#services-stage) and the first Work project frame ([data-work-first-frame]).
 */
export function ServiceToWorkThread() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const frame = frameRef.current;
    if (!overlay || !frame || prefersReducedMotion()) return;

    let blend = 0;
    let raf = 0;

    const updatePosition = () => {
      raf = 0;
      const stageEl = document.getElementById("services-stage");
      const workFrameEl = document.querySelector<HTMLElement>("[data-work-first-frame]");

      if (!stageEl || !workFrameEl) {
        overlay.style.opacity = "0";
        return;
      }

      // Hand-off bounds: only visible during the scroll transition between Services and Work
      const active = blend > 0.005 && blend < 0.995;
      overlay.style.opacity = active ? "1" : "0";

      if (!active) return;

      const rectA = stageEl.getBoundingClientRect();
      const rectB = workFrameEl.getBoundingClientRect();

      // Interpolate coordinates & dimensions in fixed viewport space
      const x = rectA.left + (rectB.left - rectA.left) * blend;
      const y = rectA.top + (rectB.top - rectA.top) * blend;
      const w = rectA.width + (rectB.width - rectA.width) * blend;
      const h = rectA.height + (rectB.height - rectA.height) * blend;
      const borderRadius = 4 + (6 - 4) * blend;

      frame.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame.style.width = `${w}px`;
      frame.style.height = `${h}px`;
      frame.style.borderRadius = `${borderRadius}px`;
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(updatePosition);
    };

    const ctx = gsap.context(() => {
      const stageEl = document.getElementById("services-stage");
      const workFrameEl = document.querySelector("[data-work-first-frame]");

      if (stageEl && workFrameEl) {
        ScrollTrigger.create({
          id: "service-to-work-transition",
          trigger: stageEl,
          start: "bottom 95%",
          endTrigger: workFrameEl,
          end: "top 35%",
          onUpdate: (self) => {
            blend = self.progress;
            schedule();
          },
          onRefresh: (self) => {
            blend = self.progress;
            schedule();
          },
        });
      }
    });

    const onRefresh = () => schedule();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    window.addEventListener("resize", schedule);
    updatePosition();

    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[40] transition-opacity duration-200"
      style={{ opacity: 0, contain: "layout style" }}
      aria-hidden
    >
      <div
        ref={frameRef}
        className="absolute top-0 left-0 overflow-hidden"
        style={{
          border: "1px solid var(--accent-deep)",
          background: "color-mix(in srgb, var(--bg-2) 60%, transparent)",
          boxShadow: "0 0 20px color-mix(in srgb, var(--accent-deep) 15%, transparent)",
          willChange: "transform, width, height",
        }}
      >
        {/* Connection signal dot accent */}
        <span
          className="signal-dot absolute top-[12px] left-[12px] z-[2]"
          style={{ width: 6, height: 6 }}
        />
      </div>
    </div>
  );
}
