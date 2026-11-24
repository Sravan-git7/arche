import { useLayoutEffect, useRef } from "react";
import { Link } from "../lib/router";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { media } from "../data/media";

// Word-by-word manifesto tokens
const MANIFESTO_WORDS = [
  { text: "Most", isTarget: false },
  { text: "businesses", isTarget: false },
  { text: "don't", isTarget: false },
  { text: "have", isTarget: false },
  { text: "a", isTarget: false },
  { text: "tool", isTarget: false },
  { text: "problem.", isTarget: false },
  { text: "They", isTarget: false },
  { text: "have", isTarget: false },
  { text: "a", isTarget: false },
  { text: "connection", isTarget: true },
  { text: "problem.", isTarget: true },
  { text: "When", isTarget: false },
  { text: "film,", isTarget: false },
  { text: "web,", isTarget: false },
  { text: "AI", isTarget: false },
  { text: "agents,", isTarget: false },
  { text: "and", isTarget: false },
  { text: "automation", isTarget: false },
  { text: "live", isTarget: false },
  { text: "in", isTarget: false },
  { text: "separate", isTarget: false },
  { text: "silos,", isTarget: false },
  { text: "momentum", isTarget: false },
  { text: "leaks", isTarget: false },
  { text: "at", isTarget: false },
  { text: "every", isTarget: false },
  { text: "seam.", isTarget: false },
];

interface WhyItem {
  n: string;
  title: string;
  desc: string;
  highlights?: string[];
}

const WHY_ITEMS: Record<string, WhyItem> = {
  card01: {
    n: "01",
    title: "Four disciplines. One team.",
    desc: "Film, web, AI agents, and automation built under one roof—no handoff friction between four separate freelancers.",
  },
  card02: {
    n: "02",
    title: "We ship on schedule. Always.",
    desc: "Clear weekly milestones, live staging links, and zero radio silence from kickoff to launch.",
  },
  card03: {
    n: "03",
    title: "Not corporate. Direct.",
    desc: "You talk straight to the designers and engineers building your system—fast decisions, clean execution.",
    highlights: ["Direct Partner Access", "Weekly Staging Links", "Zero Agency Bloat"],
  },
  card04: {
    n: "04",
    title: "Built to scale after launch.",
    desc: "Every site, agent, and workflow is yours to own, with ongoing iteration when you need it.",
  },
};

/**
 * The Proposition & Why Arché Editorial Chapter.
 *
 * Canvas: Warm Studio Ivory (#FBFBF6).
 * Composition:
 *   1. Word-by-word illuminated manifesto ("Most businesses don't have a tool problem...")
 *   2. Asymmetric "Why ambitious teams build with Arché." 12-column editorial bento
 *      - Left 8 cols: Top row cards 01 & 02 + Bottom full-span card 03
 *      - Right 4 cols: Monochrome architectural studio photograph + Compact card 04
 */
export function TheProposition() {
  const rootRef = useRef<HTMLElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const wordsWrapRef = useRef<HTMLParagraphElement>(null);
  const highlighterBarRef = useRef<HTMLSpanElement>(null);
  const bentoGridRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);

  // Word-by-Word Scroll Lighting + Lime Highlighter Sweep + Bento Reveal
  useLayoutEffect(() => {
    const wrap = wordsWrapRef.current;
    const manifesto = manifestoRef.current;
    const bar = highlighterBarRef.current;
    const grid = bentoGridRef.current;
    const photo = photoRef.current;
    if (!wrap || !manifesto) return;

    if (prefersReducedMotion()) {
      const words = wrap.querySelectorAll<HTMLElement>(".manifesto-word");
      words.forEach((w) => {
        w.style.opacity = "1";
      });
      if (bar) bar.style.transform = "scaleX(1)";
      return;
    }

    const words = wrap.querySelectorAll<HTMLElement>(".manifesto-word");

    const ctx = gsap.context(() => {
      // 1. Scrubbed sequential word lighting: opacity 0.12 -> 1.0 deep black
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: manifesto,
          start: "top 78%",
          end: "bottom 38%",
          scrub: 0.5,
        },
      });

      tl.fromTo(
        words,
        { opacity: 0.12 },
        {
          opacity: 1,
          duration: 1,
          stagger: 0.05,
          ease: "none",
        }
      );

      // 2. Bright #9EE41A highlighter bar sweep under "connection problem."
      if (bar) {
        tl.fromTo(
          bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.45,
            ease: "power2.out",
          },
          0.32
        );
      }

      // 3. Asymmetric Bento physical rise on scroll
      if (grid) {
        const cards = grid.querySelectorAll<HTMLElement>(".bento-card-unit");
        gsap.fromTo(
          cards,
          {
            y: 36,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: grid,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // 4. Subtle parallax on architectural photograph
      if (photo) {
        const img = photo.querySelector("img");
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -6, scale: 1.06 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: photo,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="proposition"
      className="relative w-full bg-[#FBFBF6] text-[#141413] py-24 md:py-32 lg:py-36 px-4 sm:px-6 md:px-12 select-none overflow-x-clip"
    >
      {/* Background Organic Lime-Mist Light Waves */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[500px] rounded-full blur-[140px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(148,212,46,0.16) 0%, rgba(148,212,46,0.03) 50%, transparent 75%)",
          }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-[650px] h-[400px] rounded-full blur-[130px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(148,212,46,0.10) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[1240px] mx-auto flex flex-col gap-24 md:gap-32">
        {/* =========================================================
            BLOCK 1: WORD-BY-WORD SCROLL-LIT MANIFESTO
            ========================================================= */}
        <div ref={manifestoRef} className="w-full max-w-[1100px]">
          {/* Naked Micro-Text Eyebrow (Zero Pill Box or Border) */}
          <div className="flex items-center gap-2.5 mb-8">
            <span className="h-[5px] w-[5px] rounded-full bg-[#72B314] shadow-[0_0_8px_#9EE41A]" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#868A82]">
              THE PROPOSITION
            </span>
          </div>

          {/* Word-by-word illuminated editorial text with bright lime highlighter bar */}
          <p
            ref={wordsWrapRef}
            className="text-[clamp(32px,4.5vw,62px)] font-bold tracking-[-0.045em] leading-[1.08] text-[#141413]"
          >
            {MANIFESTO_WORDS.map((item, idx) => {
              if (item.text === "connection") {
                return (
                  <span
                    key={idx}
                    className="relative inline-block mr-[0.24em] align-baseline whitespace-nowrap"
                  >
                    <span
                      className="manifesto-word inline-block mr-[0.24em] text-[#141413] font-bold"
                      style={{ opacity: 0.15 }}
                    >
                      connection
                    </span>
                    {" "}
                    <span
                      className="manifesto-word inline-block text-[#141413] font-bold"
                      style={{ opacity: 0.15 }}
                    >
                      problem.
                    </span>
                    {/* Clean animated 3px #9EE41A underline sweeping cleanly under "connection problem." */}
                    <span
                      ref={highlighterBarRef}
                      className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#9EE41A] rounded-full origin-left scale-x-0 shadow-[0_0_12px_rgba(158,228,26,0.65)] pointer-events-none"
                      style={{ transformOrigin: "left center" }}
                    />
                  </span>
                );
              }

              if (item.text === "problem." && item.isTarget) {
                return null;
              }

              return (
                <span
                  key={idx}
                  className="manifesto-word inline-block mr-[0.24em] text-[#141413] will-change-transform"
                  style={{ opacity: 0.15 }}
                >
                  {item.text}
                </span>
              );
            })}
          </p>

          <p className="mt-8 max-w-[50ch] text-[clamp(15px,1.2vw,17px)] text-[#595C56] leading-relaxed font-sans">
            Arché engineers film, web, AI agents, and pipeline automations into one unified architecture—ensuring zero handoff friction, instant data sync, and uncompromised execution velocity.
          </p>
        </div>

        {/* =========================================================
            BLOCK 2: ASYMMETRIC "WHY ARCHÉ" EDITORIAL BENTO
            ========================================================= */}
        <div ref={bentoGridRef} className="w-full">
          {/* Section Header with Leaf-Lime Emphasis (Zero Serif Italics) */}
          <div className="mb-12 md:mb-16 max-w-[800px]">
            {/* Naked Micro-Text Eyebrow */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="h-[5px] w-[5px] rounded-full bg-[#72B314] shadow-[0_0_8px_#9EE41A]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#868A82]">
                WHY ARCHÉ
              </span>
            </div>

            <h2 className="text-[clamp(34px,4.5vw,58px)] font-bold tracking-[-0.045em] leading-[1.04]">
              <span className="text-[#141413]">Why ambitious </span>
              <span className="text-[#8A8D86]">
                teams build with Arché.
              </span>
            </h2>

            <p className="mt-4 text-[clamp(15px,1.2vw,17px)] text-[#595C56] max-w-[52ch] leading-relaxed">
              We eliminate the seams between creative, technology, and operations so your systems compound instead of break.
            </p>
          </div>

          {/* 12-Column Asymmetric Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT 8 COLUMNS: Top row (Card 01 + Card 02) & Bottom full-span Card 03 */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Top Row: 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* CARD 01: Four disciplines. One team. */}
                <div
                  className="bento-card-unit frosted-ivory-card arche-glow-card shiny-border rounded-[24px] p-7 sm:p-8 flex flex-col justify-between min-h-[260px] group transition-all"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#0B0C0A]/[0.08] text-[#2E322B]">
                    <span className="font-mono text-sm font-bold text-[#0B0C0A] tracking-wider">
                      {WHY_ITEMS.card01.n}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-[#2E322B] font-semibold">
                      SYSTEM ARCHITECTURE
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0C0A] leading-snug">
                      {WHY_ITEMS.card01.title}
                    </h3>
                    <p className="mt-3 text-[15.5px] font-medium text-[#1C1E1A] leading-[1.6]">
                      {WHY_ITEMS.card01.desc}
                    </p>
                  </div>
                </div>

                {/* CARD 02: We ship on schedule. Always. */}
                <div
                  className="bento-card-unit frosted-ivory-card arche-glow-card shiny-border rounded-[24px] p-7 sm:p-8 flex flex-col justify-between min-h-[260px] group transition-all"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#0B0C0A]/[0.08] text-[#2E322B]">
                    <span className="font-mono text-sm font-bold text-[#0B0C0A] tracking-wider">
                      {WHY_ITEMS.card02.n}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-[#2E322B] font-semibold">
                      DELIVERY CERTAINTY
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0C0A] leading-snug">
                      {WHY_ITEMS.card02.title}
                    </h3>
                    <p className="mt-3 text-[15.5px] font-medium text-[#1C1E1A] leading-[1.6]">
                      {WHY_ITEMS.card02.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Full-Span Card 03: Not corporate. Direct. (Zero Pill Chips) */}
              <div
                className="bento-card-unit frosted-ivory-card arche-glow-card shiny-border rounded-[24px] p-7 sm:p-9 flex flex-col justify-between min-h-[220px] group transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#0B0C0A]/[0.08] text-[#2E322B]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#0B0C0A] tracking-wider">
                      {WHY_ITEMS.card03.n}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-[#2E322B] font-semibold">
                      COLLABORATION MODEL
                    </span>
                  </div>
                  {/* Naked Clean Micro-Label (Zero Pill Chips) */}
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[#5B8F0E] font-bold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5B8F0E]" />
                    DIRECT FOUNDER ACCESS · WEEKLY STAGING
                  </span>
                </div>

                <div className="mt-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                  <div className="max-w-[56ch]">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#0B0C0A] leading-snug">
                      {WHY_ITEMS.card03.title}
                    </h3>
                    <p className="mt-2.5 text-[15.5px] font-medium text-[#1C1E1A] leading-[1.6]">
                      {WHY_ITEMS.card03.desc}
                    </p>
                  </div>

                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-[#0B0C0A] font-bold hover:text-[#5B8F0E] transition-colors flex-shrink-0"
                  >
                    Direct Access <span className="arw">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT 4 COLUMNS: Tall Architectural Photograph + Card 04 */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Tall Full-Bleed Monochrome Architectural Studio Photograph */}
              <div
                ref={photoRef}
                className="bento-card-unit relative w-full min-h-[300px] sm:min-h-[340px] lg:min-h-[360px] flex-1 rounded-[24px] overflow-hidden border border-[#141413]/[0.08] shadow-[0_12px_32px_-16px_rgba(20,20,19,0.08)]"
              >
                <img
                  src={media["w-01"] || media["i-feature"]}
                  alt="Arché Creative Studio Architecture"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale contrast-110 will-change-transform"
                />

                {/* Subtle Refined Studio Badge */}
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white font-medium">
                    STUDIO PRACTICE · 2026
                  </span>
                </div>

                {/* Bottom Gradient Fade */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(20,20,19,0.02) 0%, rgba(20,20,19,0.40) 100%)",
                  }}
                />
              </div>

              {/* CARD 04: Built to scale after launch. */}
              <div
                className="bento-card-unit frosted-ivory-card arche-glow-card shiny-border rounded-[24px] p-7 sm:p-8 flex flex-col justify-between group transition-all"
              >
                <div className="flex items-center justify-between pb-4 border-b border-[#0B0C0A]/[0.08] text-[#2E322B]">
                  <span className="font-mono text-sm font-bold text-[#0B0C0A] tracking-wider">
                    {WHY_ITEMS.card04.n}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[#2E322B] font-semibold">
                    LONG-TERM OWNERSHIP
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0C0A] leading-snug">
                    {WHY_ITEMS.card04.title}
                  </h3>
                  <p className="mt-2.5 text-[15.5px] font-medium text-[#1C1E1A] leading-[1.6]">
                    {WHY_ITEMS.card04.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
