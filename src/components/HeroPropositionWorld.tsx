import { useLayoutEffect, useRef } from "react";
import { ScrollTrigger } from "../lib/gsap";
import { HeroDarkStudio } from "./HeroDarkStudio";
import { TheProposition } from "./TheProposition";
import { oneRailStore } from "../lib/oneRailState";
import { emitThread } from "../lib/threadBus";

export function HeroPropositionWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const propRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const heroEl = heroRef.current;
    const propEl = propRef.current;
    if (!heroEl || !propEl) return;

    // Immediately guarantee HERO telemetry on top of page
    if (typeof window !== "undefined" && window.scrollY < 300) {
      oneRailStore.setChapter(0, "HERO", 0, "01 · HERO");
    }

    // 1. Hero chapter trigger for Left-Edge Rail
    const heroTrigger = ScrollTrigger.create({
      trigger: heroEl,
      start: "top top",
      end: "bottom 50%",
      onEnter: () => {
        oneRailStore.setChapter(0, "HERO", 0, "01 · HERO");
        emitThread();
      },
      onEnterBack: () => {
        oneRailStore.setChapter(0, "HERO", 0, "01 · HERO");
      },
      onLeaveBack: () => {
        oneRailStore.setChapter(0, "HERO", 0, "01 · HERO");
      },
    });

    // 2. Proposition chapter trigger for Left-Edge Rail
    const propTrigger = ScrollTrigger.create({
      trigger: propEl,
      start: "top 60%",
      end: "bottom 40%",
      onEnter: () => {
        oneRailStore.setChapter(1, "PROBLEM", 0.5, "02 · PROBLEM");
        emitThread();
      },
      onEnterBack: () => {
        oneRailStore.setChapter(1, "PROBLEM", 0.5, "02 · PROBLEM");
      },
      onLeaveBack: () => {
        oneRailStore.setChapter(0, "HERO", 0, "01 · HERO");
      },
    });

    const onScrollCheck = () => {
      if (window.scrollY < 200) {
        oneRailStore.setChapter(0, "HERO", 0, "01 · HERO");
      }
    };
    window.addEventListener("scroll", onScrollCheck, { passive: true });

    return () => {
      heroTrigger.kill();
      propTrigger.kill();
      window.removeEventListener("scroll", onScrollCheck);
    };
  }, []);

  return (
    <div id="hero-proposition-world" ref={containerRef} className="relative w-full bg-[#FBFBF6] text-[#141413] overflow-x-clip">
      {/* =========================================================
          AMBIENT STUDIO LIGHTING LAYERS BEHIND HERO & PROPOSITION
          - Crisp bright-white overhead skylight bloom
          - Drifting #9EE41A sage-lime caustic orb (opacity: 0.22, blur-[90px])
          - Warm-charcoal depth shadow (opacity: 0.08, blur-[110px])
          - Subtle architectural fading dot/grid pattern
          ========================================================= */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Overhead Skylight Radial Cone */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] max-w-[1800px] h-[750px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.45) 40%, transparent 70%)",
          }}
        />

        {/* Soft Drifting #9EE41A Ambient Sage-Lime Caustic Orb (opacity: 0.22, blur-[90px]) */}
        <div
          className="absolute top-[35%] left-[45%] -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[90px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(158,228,26,0.22) 0%, rgba(158,228,26,0.08) 50%, transparent 75%)",
            animation: "driftCaustic 18s ease-in-out infinite alternate",
          }}
        />

        {/* Soft Warm-Charcoal Depth Shadow Orb (opacity: 0.08, blur-[110px]) */}
        <div
          className="absolute top-[65%] right-[15%] w-[650px] h-[450px] rounded-full blur-[110px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,20,19,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Subtle Architectural Hairline Grid with Vignette Fade */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(20,20,19,0.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 85%)",
          }}
        />
      </div>

      <style>{`
        @keyframes driftCaustic {
          0% {
            transform: translate3d(-50%, -20px, 0) scale(0.95);
          }
          100% {
            transform: translate3d(-46%, 30px, 0) scale(1.08);
          }
        }
      `}</style>

      {/* CHAPTER 01: HERO (Warm Off-White Stage + Centered Hierarchy) */}
      <div ref={heroRef} data-chapter="Hero" className="relative z-10 w-full">
        <HeroDarkStudio />
      </div>

      {/* CHAPTER 02: THE PROPOSITION (Word-by-word Manifesto + Liquid-Glass Bento) */}
      <div ref={propRef} data-chapter="Problem" className="relative z-10 w-full">
        <TheProposition />
      </div>
    </div>
  );
}
