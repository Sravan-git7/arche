import { useEffect, useLayoutEffect, useRef } from "react";
import { HeroDarkStudio } from "../components/HeroDarkStudio";
import { TheManifesto } from "../components/TheManifesto";
import { Chapters } from "../components/Chapters";
import { TheStudioDifference } from "../components/TheStudioDifference";
import { HowWeWork } from "../components/HowWeWork";
import { WorkIndex } from "../components/WorkIndex";
import { FAQ } from "../components/FAQ";
import { ProgressRail } from "../components/ProgressRail";
import { SlotButton } from "../components/SlotButton";
import { usePage } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";
import { resetPreviews } from "../lib/autoplay";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { oneRailStore } from "../lib/oneRailState";

/**
 * ARCHÉ CREATIVE STUDIOS — REFINED 7-CHAPTER EDITORIAL STORY ARC
 *
 * Sequence:
 *  Chapter 01 — Hero Stage (<HeroDarkStudio />)
 *  Chapter 02 — The Tension (<TheManifesto />: Scroll-Lit Word Scrub)
 *  Chapter 03 — The Proof of Craft (<Chapters />: 4 Full-Width Sticky Stacking Capability Consoles)
 *  Chapter 04 — The Studio Difference (<TheStudioDifference />: Merged Convictions + 4-Column Stat Strip)
 *  Chapter 05 — How We Work (<HowWeWork />: Pinned 01-04 Process + Masked Reveals)
 *  Chapter 06 — Selected Work (<WorkIndex />: Horizontal Carousel + Honesty Evidence)
 *  Chapter 07 — FAQ & Booking (<FAQ />: Accordion + Smoked-Obsidian Closing Banner)
 */
export function Home() {
  usePage("Arche Creative Studios");
  useReveal();
  useParallax();

  const workSectionRef = useRef<HTMLElement>(null);
  const workHeadingRef = useRef<HTMLHeadingElement>(null);

  // Fresh visit gets clean preview state
  useEffect(() => resetPreviews(), []);

  // Work section chapter trigger & masked headline reveal
  useLayoutEffect(() => {
    const el = workSectionRef.current;
    const heading = workHeadingRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 60%",
        end: "bottom 30%",
        onEnter: () => {
          oneRailStore.setChapter(5, "WORK", 0.5, "06 · WORK");
        },
        onEnterBack: () => {
          oneRailStore.setChapter(5, "WORK", 0.5, "06 · WORK");
        },
      });

      if (heading && !prefersReducedMotion()) {
        const lines = heading.querySelectorAll(".editorial-line");
        gsap.fromTo(
          lines,
          { y: "105%", opacity: 0 },
          {
            y: "0%",
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: heading,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full bg-transparent text-[#141413] overflow-x-clip">
      {/* Chapter 01: Hero */}
      <div data-chapter="Hero">
        <HeroDarkStudio />
      </div>

      {/* Chapter 02: The Tension (Scroll-Lit Manifesto) */}
      <div data-chapter="Tension">
        <TheManifesto />
      </div>

      {/* Chapter 03: The Proof of Craft (4 Services Sticky Stack) */}
      <div data-chapter="Services">
        <Chapters />
      </div>

      {/* Chapter 04: The Studio Difference (Merged Convictions + 4-Column Stat Strip) */}
      <div data-chapter="Difference">
        <TheStudioDifference />
      </div>

      {/* Chapter 05: How We Work (Pinned 01-04 Process) */}
      <div data-chapter="Process">
        <HowWeWork />
      </div>

      {/* Chapter 06: Selected Work */}
      <div data-chapter="Work">
        <section
          ref={workSectionRef}
          id="work"
          className="relative w-full py-14 md:py-20 bg-transparent text-[#0D0E0C] border-t border-[#0D0E0C]/[0.08] overflow-hidden"
        >
          <div className="wrap relative z-10">
            <div className="mb-[clamp(28px,3.5vw,48px)] flex flex-wrap items-end justify-between gap-[18px]">
              <div>
                {/* Frosted-Glass Eyebrow Pill Box */}
                <div className="mb-4">
                  <div className="glass-eyebrow-pill">
                    <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                    <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#232620]">
                      SELECTED WORK · VERIFIED PROOFS
                    </span>
                  </div>
                </div>

                <h2
                  ref={workHeadingRef}
                  className="text-[clamp(2.75rem,5vw,4.5rem)] font-bold tracking-[-0.038em] leading-[0.98] text-[#11120F]"
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontVariationSettings: "'wght' 700",
                    fontWeight: 700,
                    color: "#11120F",
                    textShadow: "none",
                  }}
                >
                  <span className="block overflow-hidden py-1">
                    <span className="editorial-line block text-[#11120F]">
                      <span className="shiny-ink-text">Built,</span>
                    </span>
                  </span>
                  <span className="block overflow-hidden py-1">
                    <span className="editorial-line block text-[#63685E]">
                      <span className="headline-secondary-shine">labelled honestly.</span>
                    </span>
                  </span>
                </h2>

                <p className="mt-3.5 max-w-[48ch] text-[#484C45] text-sm sm:text-base leading-relaxed">
                  Internal builds and prototypes — not client case studies. Each one shows how a capability is designed to operate.
                </p>
              </div>

              <SlotButton to="/work" variant="primary" arrow="right" className="!px-5 !py-2.5">
                All work
              </SlotButton>
            </div>

            <WorkIndex limit={3} showFilters={false} />
          </div>
        </section>
      </div>

      {/* Chapter 07: FAQ + Dark Obsidian Final CTA */}
      <div data-chapter="FAQ">
        <FAQ />
      </div>

      {/* Floating HUD Telemetry Rail */}
      <ProgressRail />
    </div>
  );
}
