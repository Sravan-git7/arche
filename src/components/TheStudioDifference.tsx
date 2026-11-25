import { useLayoutEffect, useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { oneRailStore } from "../lib/oneRailState";
import { attachCardTilt } from "../motion/cardTilt";

interface MetricItem {
  n: string;
  stat: string;
  target: number;
  format: string;
  label: string;
  sub: string;
}

const METRICS: MetricItem[] = [
  {
    n: "01",
    stat: "4",
    target: 4,
    format: "{val}",
    label: "Disciplines",
    sub: "Cinema, Decks, Code & Flow engineered under one roof.",
  },
  {
    n: "02",
    stat: "< 14",
    target: 14,
    format: "< {val}",
    label: "Days",
    sub: "Rapid staging links with zero radio silence from kickoff.",
  },
  {
    n: "03",
    stat: "24/7",
    target: 24,
    format: "{val}/7",
    label: "AI Coverage",
    sub: "Autonomous intake, qualification, and routing around the clock.",
  },
  {
    n: "04",
    stat: "100%",
    target: 100,
    format: "{val}%",
    label: "Custom Built",
    sub: "Yours to own with zero locked vendor templates or recurring fee traps.",
  },
];

interface ConvictionItem {
  n: string;
  title: string;
  lead: string;
  desc: string;
  meta: string;
  proof: string;
}

const CONVICTIONS: ConvictionItem[] = [
  {
    n: "01",
    title: "One team, zero handoff friction",
    lead: "Four disciplines engineered as one feedback loop.",
    desc: "Film, pitch decks, web, and automation built under one roof. No competing agency agendas, no lost context between separate vendors, and no finger-pointing.",
    meta: "Unified Architecture",
    proof: "01 · Unified Repo & Brand",
  },
  {
    n: "02",
    title: "Weekly staging links, on schedule",
    lead: "Deterministic delivery without revision stalls.",
    desc: "Clear weekly milestones and testable staging URLs from week one. You see real working progress every seven days with zero radio silence.",
    meta: "100% On-Time SLA",
    proof: "02 · Live Staging Every Friday",
  },
  {
    n: "03",
    title: "Direct access to the builders, full ownership",
    lead: "Zero middle management bloat. 100% intellectual property transfer.",
    desc: "You collaborate directly with the senior engineers and directors building your system. Every asset, repository, prompt, and workflow is yours to own.",
    meta: "Direct Partner Access",
    proof: "03 · 100% IP & Code Ownership",
  },
];

/**
 * Chapter 04 — The Studio Difference
 *
 * Merges "Why Arché" + "Proof Metrics" into ONE cohesive section:
 * - Headline: "Why ambitious " (#141413) + "teams build with Arché." (#8A8D86)
 * - Directly below: ONE clean unified 4-column hairline-divided stat strip (zero status pills)
 * - Paired with 3 clean horizontal architectural conviction cards below it
 * - Duplicate server photo and standalone metrics removed
 */
export function TheStudioDifference() {
  const rootRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const heading = headingRef.current;
    const strip = stripRef.current;
    const cards = cardsRef.current;
    if (!root) return;

    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. OneRail chapter trigger
      ScrollTrigger.create({
        trigger: root,
        start: "top 60%",
        end: "bottom 35%",
        onEnter: () => {
          oneRailStore.setChapter(3, "STUDIO", 0.5, "04 · STUDIO");
        },
        onEnterBack: () => {
          oneRailStore.setChapter(3, "STUDIO", 0.5, "04 · STUDIO");
        },
      });

      // 2. Masked headline line entrance
      if (heading) {
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

      // 3. Stat strip subtle reveal + live tabular count-up + hairline draw
      if (strip) {
        gsap.fromTo(
          strip,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: strip,
              start: "top 85%",
              once: true,
            },
          }
        );

        const hairline = strip.querySelector(".stat-strip-hairline");
        if (hairline) {
          gsap.fromTo(
            hairline,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: strip,
                start: "top 85%",
                once: true,
              },
            }
          );
        }

        const statCounters = strip.querySelectorAll<HTMLElement>("[data-stat-counter]");
        statCounters.forEach((el) => {
          const target = parseFloat(el.getAttribute("data-stat-target") || "0");
          const format = el.getAttribute("data-stat-format") || "{val}";
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: strip,
              start: "top 85%",
              once: true,
            },
            onUpdate: () => {
              const current = Math.round(obj.val);
              el.textContent = format.replace("{val}", String(current));
            },
          });
        });
      }

      // 4. Staggered conviction cards reveal (3D perspective card rise)
      if (cards) {
        const cardUnits = cards.querySelectorAll(".conviction-card");
        gsap.fromTo(
          cardUnits,
          { y: 36, rotateX: 8, opacity: 0 },
          {
            y: 0,
            rotateX: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cards,
              start: "top 82%",
              once: true,
            },
          }
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  // Tactile 3D micro-tilt + inner parallax on conviction cards
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    if (cardsRef.current) {
      cardsRef.current.querySelectorAll<HTMLElement>(".conviction-card").forEach((c) => {
        cleanups.push(attachCardTilt(c));
      });
    }
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section
      ref={rootRef}
      id="difference"
      className="relative w-full bg-transparent text-[#F4F1E0] py-14 md:py-20 px-6 md:px-12 select-none overflow-x-clip border-t border-white/10"
    >
      <div className="relative z-10 w-full max-w-[1240px] mx-auto">
        {/* Asymmetric Header Split Lockup */}
        <div className="mb-12 sm:mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Left 7 cols: Eyebrow + Bold 2-Line Headline */}
          <div className="lg:col-span-7">
            {/* Frosted-Glass Eyebrow Pill Box */}
            <div className="mb-4">
              <div className="glass-eyebrow-pill">
                <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
                  THE STUDIO DIFFERENCE
                </span>
              </div>
            </div>

            <h2
              ref={headingRef}
              className="text-[clamp(2.75rem,5vw,4.5rem)] font-bold tracking-[-0.038em] leading-[0.98] text-left text-[#F4F1E0]"
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontVariationSettings: "'wght' 700",
                fontWeight: 700,
                color: "#F4F1E0",
                textShadow: "none",
              }}
            >
              <span className="block overflow-hidden py-1">
                <span className="editorial-line block text-[#F4F1E0]">
                  <span className="shiny-ink-text">Why ambitious</span>
                </span>
              </span>
              <span className="block overflow-hidden py-1">
                <span className="editorial-line block text-[#92998D]">
                  <span className="headline-secondary-shine">teams build with Arché.</span>
                </span>
              </span>
            </h2>
          </div>

          {/* Right 5 cols (cols 8-12): Crisp Light Sage-Ivory Studio Statement */}
          <div className="lg:col-span-5 pb-1">
            <p className="text-sm sm:text-base leading-relaxed text-left max-w-[46ch] text-[#CBD1C5] font-sans font-normal">
              We eliminated agency bloat, fragmented freelancers, and vague retainer hours. A single multidisciplinary studio built to move faster and convert better.
            </p>
          </div>
        </div>

        {/* 1. ONE Clean Unified 4-Column Hairline-Divided Stat Strip (Smoked Cypress Liquid Glass) */}
        <div
          ref={stripRef}
          className="smoked-cypress-glass arche-glow-card shiny-border relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-3xl overflow-hidden mb-10 sm:mb-14"
        >
          <div className="stat-strip-hairline absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9EE41A]/50 to-transparent origin-left z-10" />
          {METRICS.map((m, idx) => (
            <div
              key={m.n}
              data-stat-card="true"
              className={`bg-transparent p-7 sm:p-8 flex flex-col justify-between min-h-[220px] transition-all ${
                idx < 3 ? "lg:border-r border-white/10" : ""
              } ${idx % 2 === 0 ? "sm:border-r lg:border-r-0 border-white/10" : ""} ${
                idx < 2 ? "border-b sm:border-b-0 lg:border-b-0 border-white/10" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] tracking-widest uppercase pb-3 border-b border-white/10 text-[#C4CBC0]">
                  <span className="font-bold text-[#F4F1E0]">{m.n}</span>
                  <span className="text-[11px] tracking-wider text-[#92998D] font-semibold">SPEC</span>
                </div>

                <div className="mt-6">
                  <span
                    data-stat-counter="true"
                    data-stat-target={m.target}
                    data-stat-format={m.format}
                    className="block font-display text-[clamp(2.5rem,3.6vw,3.25rem)] font-bold tracking-[-0.035em] text-[#F4F1E0] leading-none"
                    style={{ fontVariationSettings: "'wght' 700", fontWeight: 700 }}
                  >
                    {m.stat}
                  </span>
                  <span className="block mt-2.5 text-[16px] font-bold text-[#F4F1E0] tracking-tight">
                    {m.label}
                  </span>
                </div>
              </div>

              <p className="mt-5 text-[14px] text-[#C4CBC0] font-normal leading-relaxed">
                {m.sub}
              </p>
            </div>
          ))}
        </div>

        {/* 2. Three Clean Horizontal Architectural Conviction Cards */}
        <div
          ref={cardsRef}
          style={{ perspective: "1000px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {CONVICTIONS.map((c) => (
            <div
              key={c.n}
              className="conviction-card frosted-ivory-card arche-glow-card shiny-border rounded-[24px] p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-14px_rgba(20,20,19,0.12)] cursor-pointer"
              data-cursor="hover"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#141413]/[0.08] mb-5 font-mono text-xs">
                  <span className="text-[#0B0C0A] font-bold">{c.n} · CONVICTION</span>
                  <span className="text-[#2E322B] text-[12px] uppercase tracking-wider font-bold">
                    {c.meta}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold tracking-[-0.025em] leading-[1.15] text-[#0B0C0A] mb-2.5">
                  {c.title}
                </h3>

                <p className="text-[16px] font-bold text-[#0B0C0A] leading-relaxed mb-3">
                  {c.lead}
                </p>

                <p className="text-[15.5px] text-[#1C1E1A] font-medium leading-[1.6]">
                  {c.desc}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#141413]/[0.08] flex items-center justify-between">
                <span data-proof-cue className="font-mono text-[12px] uppercase tracking-widest text-[#2E322B] font-bold">
                  {c.proof}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
