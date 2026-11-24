import { useLayoutEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { SlotButton } from "./SlotButton";

/**
 * Open Pre-Footer Closing CTA + Full-Bleed Interactive Floating Glass Sphere ("Ball Effect")
 *
 * Inspired by awmedia.marketing's closing section, adapted to Arché's warm
 * cream-ivory and obsidian aesthetic over the global green fluted-glass canvas.
 *
 * - Zero heavy dark box or card borders — completely open and seamless
 * - Soft wide radial #9EE41A / #DDF5A8 studio ambient glow behind center
 * - Translucent 3D-shaded frosted glass sphere (190px-215px) with full-screen
 *   horizontal travel across the entire browser width (x clamped to [-width*0.48, +width*0.48],
 *   y clamped to [-height*0.38, +height*0.38]), driven by gsap.quickTo with power3.out (duration: 0.65)
 * - Frosted pill eyebrow + monumental two-tone shiny headline + dual kinetic CTAs
 */
export function PreFooterCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const orbWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const orb = orbRef.current;
    if (!section || !orb) return;

    if (prefersReducedMotion()) return;

    // Only enable cursor tracking on devices with fine pointer (mouse/trackpad)
    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasFinePointer) return;

    // Use gsap.quickTo for composite-only transform updates with full-screen travel
    const xTo = gsap.quickTo(orb, "x", { duration: 0.65, ease: "power3.out" });
    const yTo = gsap.quickTo(orb, "y", { duration: 0.65, ease: "power3.out" });

    const handlePointerMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const relX = e.clientX - centerX;
      const relY = e.clientY - centerY;

      // Full-screen horizontal travel across the entire browser viewport (matching awmedia)
      const maxTravelX = rect.width * 0.48;
      const maxTravelY = rect.height * 0.38;

      const targetX = Math.max(-maxTravelX, Math.min(maxTravelX, relX));
      const targetY = Math.max(-maxTravelY, Math.min(maxTravelY, relY));

      xTo(targetX);
      yTo(targetY);
    };

    const handlePointerLeave = () => {
      // Smoothly glide orb back to resting center position
      xTo(0);
      yTo(0);
    };

    section.addEventListener("pointermove", handlePointerMove, { passive: true });
    section.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pre-footer-cta"
      className="relative w-full py-24 md:py-32 overflow-x-clip bg-transparent text-[#0D0E0C] select-none"
    >
      {/* 1. Soft Wide Radial Studio Glow (#9EE41A / #DDF5A8) */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] md:w-[920px] h-[340px] md:h-[480px] rounded-full blur-[140px] opacity-[0.24] bg-[radial-gradient(ellipse_at_center,#9EE41A_0%,#DDF5A8_42%,transparent_72%)]"
        aria-hidden="true"
      />

      {/* 2. Full-Screen Floating 3D-Shaded Glass Sphere ("Ball Effect") at Section Center (z-0) */}
      <div
        ref={orbWrapperRef}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 animate-orb-float will-change-transform"
        aria-hidden="true"
      >
        <div
          ref={orbRef}
          className="w-[190px] h-[190px] md:w-[215px] md:h-[215px] rounded-full will-change-transform"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.88) 0%, rgba(244, 241, 224, 0.45) 36%, rgba(158, 228, 26, 0.16) 68%, rgba(20, 20, 19, 0.14) 100%)",
            backdropFilter: "blur(16px) saturate(140%)",
            WebkitBackdropFilter: "blur(16px) saturate(140%)",
            border: "1px solid rgba(255, 255, 255, 0.65)",
            boxShadow:
              "inset 0 6px 16px rgba(255, 255, 255, 0.60), inset 0 -8px 18px rgba(20, 20, 19, 0.10), 0 20px 45px -14px rgba(20, 20, 19, 0.12)",
          }}
        />
      </div>

      {/* 3. Foreground Content Stage (z-10) */}
      <div className="wrap relative z-10 max-w-[1040px] mx-auto text-center flex flex-col items-center">
        {/* Frosted Cream-Ivory Pill Eyebrow */}
        <div className="mb-6 relative z-10">
          <div className="glass-eyebrow-pill">
            <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] animate-pulse flex-shrink-0" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#232620]">
              NOW BOOKING NEXT ENGAGEMENTS
            </span>
          </div>
        </div>

        {/* Monumental Two-Tone Shiny Metallic Headline (floating cleanly in front of the orb) */}
        <div className="relative w-full flex items-center justify-center">
          <h2
            className="relative z-10 text-[clamp(2.75rem,5.6vw,5.25rem)] font-extrabold tracking-[-0.04em] leading-[0.98] text-center"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontVariationSettings: "'wght' 800",
              fontWeight: 800,
            }}
          >
            <span className="block py-1">
              <span className="shiny-ink-text">Ready to connect</span>
            </span>
            <span className="block py-1">
              <span className="headline-secondary-shine">your entire business?</span>
            </span>
          </h2>
        </div>

        {/* Concise 2-Line Subtitle */}
        <p className="mt-6 max-w-[54ch] text-base sm:text-lg text-[#484C45] leading-relaxed text-center relative z-10">
          Replace fragmented agency silos with one high-performance creative and operational engine. From cinematic film and web to 24/7 AI agents and custom automation.
        </p>

        {/* Dual Kinetic CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4 relative z-10">
          <SlotButton
            to="/contact"
            variant="primary"
            arrow="right"
            className="!px-8 !py-3.5 !text-xs !tracking-[0.14em] !font-bold"
          >
            Start a Project
          </SlotButton>

          <SlotButton
            to="/work"
            variant="frosted-ivory"
            arrow="right"
            className="!px-7 !py-3.5 !text-xs !tracking-[0.14em] !font-semibold"
          >
            Explore All Work
          </SlotButton>
        </div>

        {/* Clean Muted Hairline Metadata */}
        <div className="mt-10 pt-5 border-t border-[#141413]/[0.08] w-full max-w-[560px] mx-auto text-center relative z-10">
          <p className="font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-[#6E7368]">
            DIRECT FOUNDER ACCESS · ZERO AGENCY BLOAT · 1 WORKING-DAY RESPONSE
          </p>
        </div>
      </div>
    </section>
  );
}
