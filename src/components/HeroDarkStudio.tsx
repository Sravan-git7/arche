import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "../lib/gsap";
import { getLenis } from "../motion/SmoothScroll";
import { SlotButton } from "./SlotButton";
import { oneRailStore } from "../lib/oneRailState";

const KINETIC_WORDS = ["move.", "scale.", "convert.", "win."];

const HERO_SERVICES = [
  { n: "01", label: "FILM", idx: 0 },
  { n: "02", label: "WEB", idx: 1 },
  { n: "03", label: "AI AGENTS", idx: 2 },
  { n: "04", label: "AUTOMATION", idx: 3 },
];

/**
 * ARCHÉ CREATIVE STUDIOS — HERO SECTION
 *
 * 100% Centered Monumental Hierarchy (in the exact rhythm of awmedia.marketing):
 * - Canvas: Warm Studio Ivory (#FBFBF6) with organic translucent lime-mist light waves
 * - Eyebrow: Naked minimal micro-text with 5px #72B314 dot (zero pill boxes/borders)
 * - Headline: Monumental 2-line centered display ("Systems that make" / "businesses scale.")
 *   with "scale." highlighted in Arché Leaf-Lime (#72B314) and animated #9EE41A underline
 * - Subtitle: Clean 2-line centered Warm Graphite (#595C56) copy
 * - Dual CTAs: Crisp solid #141413 pill + frosted ivory button
 * - 4-Column Architectural bottom index bar scrolling to each service
 * - Zero side boxes, zero schematics, zero clutter
 */
export function HeroDarkStudio() {
  const containerRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const wordWrapRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const subcopyRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  // Cycling verb state & single-node slot-roll ref
  const [wordIndex, setWordIndex] = useState(0);
  const wordNodeRef = useRef<HTMLSpanElement>(null);
  const isTransitioningRef = useRef(false);

  // Smooth scroll helper
  const scrollToServices = () => {
    const el = document.getElementById("services");
    if (!el) return;
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(el, { offset: -90, duration: 1.2 });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToServiceCard = (cardIdx: number) => {
    const cards = document.querySelectorAll(".sticky-service-card");
    const target = cards[cardIdx];
    if (target) {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(target as HTMLElement, { offset: -96, duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      scrollToServices();
    }
  };

  // -----------------------------------------------------------------
  // 1. STRICT SINGLE-LINE VERTICAL SLOT-ROLL (ZERO OVERLAP COLLISION)
  // Outgoing slides cleanly out (-110%, 220ms) BEFORE/AS next word slides up (110% -> 0%, 280ms)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const interval = setInterval(() => {
      const node = wordNodeRef.current;
      if (isTransitioningRef.current || !node) return;
      isTransitioningRef.current = true;

      // 1. Outgoing word slides cleanly out up (-110%, opacity 0, 220ms)
      gsap.to(node, {
        yPercent: -110,
        opacity: 0,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
          // 2. Advance index and immediately stage next word at +110%
          setWordIndex((prev) => (prev + 1) % KINETIC_WORDS.length);
          gsap.set(node, { yPercent: 110, opacity: 0 });

          // 3. Incoming word slides cleanly up into place (0%, opacity 1, 280ms)
          gsap.to(node, {
            yPercent: 0,
            opacity: 1,
            duration: 0.28,
            ease: "cubic-bezier(0.22, 1, 0.36, 1)",
            onComplete: () => {
              isTransitioningRef.current = false;
            },
          });
        },
      });
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  // -----------------------------------------------------------------
  // 2. PAGE-LOAD ENTRANCE & SCROLL-OUT DEPTH TRANSITION (GSAP)
  // -----------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    const content = heroContentRef.current;
    if (!container || !content) return;

    if (prefersReducedMotion()) {
      return;
    }

    const ctx = gsap.context(() => {
      // 0. Hero chapter trigger for OneRail HUD
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom 40%",
        onEnter: () => {
          oneRailStore.setChapter(0, "HERO", 0, "01 · HERO");
        },
        onEnterBack: () => {
          oneRailStore.setChapter(0, "HERO", 0, "01 · HERO");
        },
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Eyebrow micro-text fade & slide in
      if (eyebrowRef.current) {
        tl.fromTo(
          eyebrowRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.55 },
          0.05
        );
      }

      // Monumental headline gentle reveal — NEVER stuck outside line-mask
      const lines = [line1Ref.current, line2Ref.current].filter(Boolean);
      if (lines.length > 0) {
        tl.fromTo(
          lines,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.12, ease: "power3.out" },
          0.10
        );
      }

      // Subcopy and Dual CTAs glide in
      const lowerElements = [subcopyRef.current, ctaGroupRef.current, bottomBarRef.current].filter(Boolean);
      if (lowerElements.length > 0) {
        tl.fromTo(
          lowerElements,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" },
          0.38
        );
      }

      // Scroll-Out Depth Transition (ScrollTrigger, scrub: 0.75):
      gsap.to(content, {
        scale: 0.94,
        y: -40,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom 30%",
          scrub: 0.75,
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative w-full min-h-[88svh] max-h-[960px] pt-24 pb-8 bg-transparent text-[#0D0E0C] overflow-x-clip flex flex-col justify-between select-none"
    >
      {/* =========================================================
          100% CENTERED EDITORIAL HIERARCHY (AWMEDIA RHYTHM)
          - Centered along one commanding vertical axis
          - 1. Small minimal eyebrow (zero pill box or border)
          - 2. Monumental 2-line centered headline with glossy metallic specular gradient
          - 3. Clean 2-line centered subtitle in Warm Graphite (#3B3E38)
          - 4. Centered dual pill CTAs (#141413 solid + frosted ivory)
          - Zero side boxes, zero schematics, zero clutter
          ========================================================= */}
      <div
        ref={heroContentRef}
        className="relative z-10 w-full max-w-[1140px] mx-auto px-6 my-auto flex flex-col items-center justify-center text-center will-change-transform"
      >
        {/* 1. FROSTED-GLASS EYEBROW PILL BADGE (awmedia.marketing style in Arché cream-ivory) */}
        <div
          ref={eyebrowRef}
          className="mb-4 cursor-default"
        >
          <div className="glass-eyebrow-pill">
            <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#232620]">
              ARCHÉ CREATIVE STUDIOS · FILM · WEB · AI · OPS
            </span>
          </div>
        </div>

        {/* 2. MONUMENTAL 2-LINE CENTERED HEADLINE (DEEP JET-BLACK INK GRADIENT — ZERO GHOST OUTLINES) */}
        <h1
          className="text-[clamp(3.75rem,7.6vw,6.85rem)] font-bold tracking-[-0.042em] leading-[0.92] w-full max-w-[1140px] text-[#11120F]"
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontVariationSettings: "'wght' 700",
            fontWeight: 700,
            color: "#11120F",
            textShadow: "none",
          }}
        >
          {/* Line 1: Systems that make */}
          <span className="block py-1">
            <span ref={line1Ref} className="block will-change-transform text-[#11120F]">
              <span className="shiny-ink-text">Systems that make</span>
            </span>
          </span>

          {/* Line 2: businesses [verb]. (Vertical slot-roll, 100% visible immediately) */}
          <span className="block py-1 mt-1 sm:mt-2">
            <span
              ref={line2Ref}
              className="inline-flex flex-wrap items-baseline justify-center gap-[0.25em] will-change-transform max-w-full text-[#11120F]"
            >
              <span className="text-[#11120F]"><span className="shiny-ink-text">businesses</span></span>

              {/* Strict single-line overflow-hidden container (1.05em height, relative) */}
              <span
                ref={wordWrapRef}
                className="relative overflow-hidden inline-flex items-baseline h-[1.05em] px-1 font-bold text-left min-w-[3.6ch] align-baseline"
              >
                <span
                  ref={wordNodeRef}
                  className="inline-flex items-baseline will-change-transform text-[#11120F]"
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontVariationSettings: "'wght' 700",
                    fontWeight: 700,
                  }}
                >
                  <span ref={wordRef} className="verb-glint-shine">
                    {KINETIC_WORDS[wordIndex]}
                  </span>
                </span>

                {/* Subtle 2px #84CC16 bottom accent */}
                <span
                  className="absolute left-1 right-1 bottom-0 h-[2px] rounded-full bg-[#84CC16] shadow-[0_0_8px_rgba(132,204,22,0.5)] pointer-events-none"
                  aria-hidden
                />
              </span>
            </span>
          </span>
        </h1>

        {/* 3. CLEAN 2-LINE CENTERED SUBTITLE IN BALANCED 660px BREATHING ROOM */}
        <p
          ref={subcopyRef}
          className="mt-5 sm:mt-6 max-w-[660px] text-[19px] text-[#3B3E38] leading-[1.55] font-sans font-normal"
        >
          Brand film, bespoke web flagships, autonomous AI agents, and operational automation—engineered together as one connected system.
        </p>

        {/* 4. CENTERED DUAL KINETIC SLOT-ROLL CTAS */}
        <div
          ref={ctaGroupRef}
          className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3.5"
        >
          {/* Primary Solid Charcoal Pill with Slot-Roll */}
          <SlotButton
            to="/contact"
            variant="primary"
            arrow="right"
            className="!px-7 !py-3.5 !text-[13.5px] sm:!text-[14px]"
          >
            Start a Project
          </SlotButton>

          {/* Secondary Frosted Ivory Pill with Slot-Roll */}
          <SlotButton
            onClick={scrollToServices}
            variant="frosted-ivory"
            arrow="down"
            className="!px-7 !py-3.5 !text-[13.5px] sm:!text-[14px]"
          >
            Explore Services
          </SlotButton>
        </div>
      </div>

      {/* =========================================================
          CRISP 4-COLUMN ARCHITECTURAL BOTTOM INDEX DOCK
          - Centered max-w-[920px] pill dock well clear of Ask Arché
          - Separated by 1px hairlines
          - Click scrolls directly to each Service card
          ========================================================= */}
      <div
        ref={bottomBarRef}
        data-hero-index-bar
        className="relative z-20 w-full max-w-[920px] mx-auto mt-6 mb-0 px-3 sm:px-4"
      >
        <div className="rounded-2xl border border-[#141413]/[0.08] bg-[rgba(244,241,224,0.82)] backdrop-blur-md shadow-[0_4px_16px_rgba(20,20,19,0.04)] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#141413]/[0.08] overflow-hidden">
          {HERO_SERVICES.map((item) => (
            <button
              key={item.n}
              type="button"
              onClick={() => scrollToServiceCard(item.idx)}
              className="group py-2.5 sm:py-3 px-3 sm:px-4 text-left flex items-center justify-between transition-colors hover:bg-[rgba(235,232,213,0.95)] cursor-pointer"
            >
              <div className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-wider text-[#595C56] group-hover:text-[#141413] transition-colors">
                <span className="text-[#141413] font-bold">{item.n} —</span>
                <span>{item.label}</span>
              </div>
              <span className="font-mono text-xs text-[#141413]/30 group-hover:text-[#72B314] group-hover:translate-x-0.5 transition-all">
                →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Keyframe Animations for Drifting Lime Mist */}
      <style>{`
        @keyframes driftLimeMist {
          0% {
            transform: translate3d(-2%, -2%, 0) scale(0.96);
          }
          100% {
            transform: translate3d(2%, 2%, 0) scale(1.04);
          }
        }
        @keyframes driftLimeMistReverse {
          0% {
            transform: translate3d(2%, 2%, 0) scale(1.02);
          }
          100% {
            transform: translate3d(-2%, -2%, 0) scale(0.96);
          }
        }
      `}</style>
    </section>
  );
}
