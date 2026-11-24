import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { oneRailStore } from "../lib/oneRailState";

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
        w.style.color = "#0D0E0C";
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

      // 2. Scrubbed sequential word lighting: #9EA398 -> #11120F (Crisp Solid Dark Ink)
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
        { color: "#9EA398" },
        {
          color: "#11120F",
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
      className="relative w-full bg-transparent text-[#0D0E0C] py-12 md:py-16 px-6 md:px-12 select-none overflow-x-clip border-t border-[#0D0E0C]/[0.08]"
    >
      <div className="relative z-10 w-full max-w-[1240px] mx-auto">
        {/* Frosted-Glass Eyebrow Pill Box */}
        <div className="mb-4 sm:mb-6">
          <div className="glass-eyebrow-pill">
            <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#232620]">
              THE TENSION
            </span>
          </div>
        </div>

        {/* Word-by-Word Scroll-Illuminated Manifesto (Spanning Top-Left 10 columns) */}
        <div className="max-w-[1060px]">
          <p
            ref={wordsWrapRef}
            className="text-[clamp(2.75rem,5vw,4.5rem)] font-bold tracking-[-0.038em] leading-[0.98] text-left select-none text-[#11120F]"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontVariationSettings: "'wght' 700",
              fontWeight: 700,
              color: "#9EA398",
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
        <div className="mt-6 sm:mt-8 pt-6 border-t border-[#141413]/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Left Column (Cols 1–6): Architectural Label */}
          <div className="lg:col-span-6 flex items-center gap-3">
            <span className="h-px w-8 bg-[#141413]/[0.15]" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#868A82]">
              THE ARCHITECTURAL IMPERATIVE
            </span>
          </div>

          {/* Right Column (Cols 7–12): Crisp 3-Line Editorial Explanation + 2 Sleek Kinetic Links */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <p className="text-base sm:text-lg text-[#595C56] leading-relaxed font-sans font-normal text-left">
              When film, web, AI agents, and automation live in separate silos, momentum leaks at every seam. Arché engineers all four as one connected system.
            </p>

            <div className="pt-1">
              <div className="glass-dock-box inline-flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[rgba(244,241,224,0.78)] backdrop-blur-[14px] border border-[#141413]/12 shadow-[inset_0_1px_0_rgba(255,253,244,0.92),0_4px_12px_-4px_rgba(20,20,19,0.06)]">
                <a
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#141413] hover:bg-[#141413] hover:text-[#FBFBF6] transition-all duration-200 cursor-pointer select-none"
                >
                  <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Explore the 4 verticals</span>
                  <span className="text-xs transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
                </a>

                <span className="h-3.5 w-px bg-[#141413]/15 flex-shrink-0" />

                <a
                  href="#process"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector("#process")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#595C56] hover:bg-[#141413] hover:text-[#FBFBF6] transition-all duration-200 cursor-pointer select-none"
                >
                  <span>How we work</span>
                  <span className="text-xs transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
