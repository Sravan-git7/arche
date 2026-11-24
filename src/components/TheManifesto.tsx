import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { oneRailStore } from "../lib/oneRailState";
import { SlotButton } from "./SlotButton";

const MANIFESTO_WORDS = [
  { text: "Most", isTarget: false },
  { text: "businesses", isTarget: false },
  { text: "don't", isTarget: false },
  { text: "have", isTarget: false },
  { text: "a", isTarget: false },
  { text: "talent", isTarget: false },
  { text: "problem.", isTarget: false },
  { text: "They", isTarget: false },
  { text: "have", isTarget: false },
  { text: "a", isTarget: false },
  { text: "connection", isTarget: true },
  { text: "problem.", isTarget: true },
];

/**
 * Chapter 02 — The Tension (Scroll-Lit Manifesto)
 *
 * A breathing centered word-by-word scroll-illuminated statement
 * transitioning from muted silver-grey (#C8CBC3) to crisp Jet Charcoal (#141413)
 * with an animated #9EE41A 2.5px underline drawing under "connection problem."
 */
export function TheManifesto() {
  const rootRef = useRef<HTMLElement>(null);
  const wordsWrapRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const wrap = wordsWrapRef.current;
    if (!root || !wrap) return;

    if (prefersReducedMotion()) {
      const words = wrap.querySelectorAll<HTMLElement>(".manifesto-word");
      words.forEach((w) => {
        w.style.color = "#FFFFFF";
      });
      return;
    }

    const words = wrap.querySelectorAll<HTMLElement>(".manifesto-word");

    const ctx = gsap.context(() => {
      // 1. OneRail chapter trigger
      ScrollTrigger.create({
        trigger: root,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => {
          oneRailStore.setChapter(1, "TENSION", 0.5, "02 · TENSION");
        },
        onEnterBack: () => {
          oneRailStore.setChapter(1, "TENSION", 0.5, "02 · TENSION");
        },
      });

      // 2. Scrubbed sequential word lighting: dim ivory -> brilliant alabaster #FFFFFF
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 70%",
          end: "bottom 30%",
          scrub: 0.5,
        },
      });

      tl.fromTo(
        words,
        { color: "#5B6454" },
        {
          color: "#F4F1E0",
          duration: 1,
          stagger: 0.04,
          ease: "none",
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="tension"
      className="relative w-full bg-transparent text-[#F4F1E0] py-12 md:py-16 px-6 md:px-12 select-none overflow-x-clip border-t border-white/10"
    >
      <div className="relative z-10 w-full max-w-[1240px] mx-auto">
        {/* Frosted-Glass Eyebrow Pill Box */}
        <div className="mb-4 sm:mb-6">
          <div className="glass-eyebrow-pill">
            <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
              THE TENSION
            </span>
          </div>
        </div>

        {/* Word-by-Word Scroll-Illuminated Manifesto (Spanning Top-Left 10 columns) */}
        <div className="max-w-[1060px]">
          <p
            ref={wordsWrapRef}
            className="text-[clamp(2.75rem,5vw,4.5rem)] font-bold tracking-[-0.038em] leading-[0.98] text-left select-none text-[#F4F1E0]"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontVariationSettings: "'wght' 700",
              fontWeight: 700,
              color: "#5B6454",
              textShadow: "none",
            }}
          >
            {MANIFESTO_WORDS.map((w, idx) => (
              <span
                key={idx}
                className="manifesto-word inline-block mx-[0.12em] will-change-[color]"
              >
                {w.text}
              </span>
            ))}
          </p>
        </div>

        {/* Asymmetric Bottom Grid (Offset to Columns 7–12) */}
        <div className="mt-6 sm:mt-8 pt-6 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Left Column (Cols 1–6): Architectural Label */}
          <div className="lg:col-span-6 flex items-center gap-3">
            <span className="h-px w-8 bg-white/20" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#92998D]">
              THE ARCHITECTURAL IMPERATIVE
            </span>
          </div>

          {/* Right Column (Cols 7–12): Crisp 3-Line Editorial Explanation + 2 Sleek Kinetic Links */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <p className="text-base sm:text-lg text-[#C9CEC3] leading-relaxed font-sans font-normal text-left">
              When film, web, AI agents, and automation live in separate silos, momentum leaks at every seam. Arché engineers all four as one connected system.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <SlotButton
                href="#services"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
                }}
                variant="smoked-glass"
                arrow="down"
                className="!px-5 !py-2.5 !text-[12px] !font-medium !tracking-[0.06em]"
              >
                Explore the 4 verticals
              </SlotButton>

              <SlotButton
                href="#process"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  document.querySelector("#process")?.scrollIntoView({ behavior: "smooth" });
                }}
                variant="smoked-glass"
                arrow="right"
                className="!px-5 !py-2.5 !text-[12px] !font-medium !tracking-[0.06em]"
              >
                How we work
              </SlotButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
