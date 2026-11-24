import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { oneRailStore } from "../lib/oneRailState";
import { attachCardTilt } from "../motion/cardTilt";

interface ProcessStep {
  n: string;
  phase: string;
  title: string;
  lead: string;
  desc: string;
  deliverables: string[];
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    n: "01",
    phase: "01 · DISCOVERY",
    title: "System Audit & Friction Mapping",
    lead: "We deconstruct your current operations, tools, and content bottlenecks to identify where momentum is leaking.",
    desc: "Rather than guessing solutions, we audit every existing touchpoint—from camera footage and web traffic to manual lead intake and spreadsheet drift. We map the exact bottlenecks preventing leverage.",
    deliverables: [
      "Operational Friction Audit",
      "Architecture & Pipeline Map",
      "Technical Scope & Delivery Timeline",
    ],
  },
  {
    n: "02",
    phase: "02 · SYSTEM DESIGN",
    title: "Single Operating Model",
    lead: "Blueprinting the exact interfaces, data schemas, AI agent guardrails, and automated pipelines before writing code.",
    desc: "We design how film assets, responsive UI components, AI prompts, and database dual-writes connect into a seamless feedback loop. Zero ambiguity before build begins.",
    deliverables: [
      "Component & Layout Systems",
      "Neural Agent Action Schema",
      "Webhook & Event Bus Topology",
    ],
  },
  {
    n: "03",
    phase: "03 · PARALLEL BUILD",
    title: "Parallel Engineering & Master Grading",
    lead: "Cinema grading, sub-35ms web flagship code, neural agent fine-tuning, and robust webhook event routing.",
    desc: "Our multidisciplinary engineering stack builds all four verticals in parallel. Color grades match interface palettes; web triggers fire real-time agent handoffs; automations execute without delay.",
    deliverables: [
      "4K Master Grade Exports & Audio Mix",
      "Lighthouse 99+ Edge-Rendered Flagship",
      "Tested AI Function Calling & CRM Sync",
    ],
  },
  {
    n: "04",
    phase: "04 · LAUNCH & SCALE",
    title: "Launch, Handoff & Ongoing Scale",
    lead: "Edge deployment, live traffic cutover, automated regression monitoring, and continuous system evolution.",
    desc: "We deploy to global edge infrastructure, verify real-time event logs under load, train your team on system telemetry, and provide continuous optimization care.",
    deliverables: [
      "Zero-Downtime Global Edge Cutover",
      "Live System Telemetry & Logs",
      "Ongoing Optimization & SLA Support",
    ],
  },
];

export function HowWeWork() {
  const rootRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numeralRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // 1. Refresh ScrollTrigger once fonts and layout settle
  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }
    const t1 = setTimeout(() => ScrollTrigger.refresh(), 200);
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // 2. High-precision IntersectionObserver (rootMargin: '-35% 0px -35% 0px'): reliably advances 01 -> 02 -> 03 -> 04
  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = cards.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) {
              setActiveStep(idx);
              oneRailStore.setChapter(4, "PROCESS", idx / 3, "05 · PROCESS");
            }
          }
        });
      },
      {
        rootMargin: "-35% 0px -35% 0px",
        threshold: 0.1,
      }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  // 3. GSAP ScrollTrigger bindings (start: 'top 58%', end: 'bottom 42%', Card 04 start: 'top 72%')
  useLayoutEffect(() => {
    const root = rootRef.current;
    const heading = headingRef.current;
    if (!root) return;

    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    if (prefersReducedMotion()) {
      cards.forEach((c) => {
        c.style.opacity = "1";
      });
      return;
    }

    const ctx = gsap.context(() => {
      // Process Section entry trigger for OneRail HUD
      ScrollTrigger.create({
        trigger: root,
        start: "top 60%",
        end: "bottom 30%",
        onEnter: () => {
          oneRailStore.setChapter(4, "PROCESS", 0, "05 · PROCESS");
        },
        onEnterBack: () => {
          oneRailStore.setChapter(4, "PROCESS", 1, "05 · PROCESS");
        },
      });

      // Masked headline lines reveal
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

      // Card-by-card triggers with dedicated top 72% threshold on Card 04
      cards.forEach((card, i) => {
        const isLast = i === cards.length - 1;
        ScrollTrigger.create({
          trigger: card,
          start: isLast ? "top 72%" : "top 58%",
          end: isLast ? "bottom 20%" : "bottom 42%",
          onEnter: () => {
            setActiveStep(i);
            oneRailStore.setChapter(4, "PROCESS", i / 3, "05 · PROCESS");
          },
          onEnterBack: () => {
            setActiveStep(i);
            oneRailStore.setChapter(4, "PROCESS", i / 3, "05 · PROCESS");
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  // Crisp vertical masked slide when numeral changes: yPercent 100 -> 0, 0.4s power4.out
  useLayoutEffect(() => {
    const el = numeralRef.current;
    if (!el || prefersReducedMotion()) return;

    gsap.fromTo(
      el,
      { yPercent: 100, opacity: 0.2 },
      { yPercent: 0, opacity: 1, duration: 0.4, ease: "power4.out" }
    );
  }, [activeStep]);

  // Tactile 3D micro-tilt + inner parallax on Process step cards
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    cardRefs.current.forEach((card) => {
      if (card) cleanups.push(attachCardTilt(card));
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  const progressPercent = ((activeStep + 1) / PROCESS_STEPS.length) * 100;

  return (
    <section
      ref={rootRef}
      id="process"
      className="relative w-full bg-transparent text-[#0D0E0C] py-14 md:py-20 px-6 md:px-12 select-none overflow-x-clip border-t border-[#0D0E0C]/[0.08]"
    >
      <div className="relative z-10 w-full max-w-[1220px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* =========================================================
              LEFT COLUMN: STICKY-LEFT METALLIC NUMERAL & PROGRESS
              ========================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 self-start flex flex-col justify-between pb-8 lg:pb-12">
            <div>
              {/* Frosted-Glass Eyebrow Pill Box */}
              <div className="mb-6">
                <div className="glass-eyebrow-pill">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
                    HOW WE WORK
                  </span>
                </div>
              </div>

              {/* Display Headline with Masked Editorial Reveal */}
              <h2
                ref={headingRef}
                className="text-[clamp(2.25rem,3.6vw,3.25rem)] font-bold tracking-[-0.038em] leading-[0.98] mb-6 text-[#F4F1E0]"
                style={{
                  fontFamily: "'Inter Tight', sans-serif",
                  fontVariationSettings: "'wght' 700",
                  fontWeight: 700,
                  color: "#F4F1E0",
                  textShadow: "none",
                }}
              >
                <span className="block overflow-hidden py-0.5">
                  <span className="editorial-line block text-[#F4F1E0]">
                    <span className="shiny-ink-text">From brief</span>
                  </span>
                </span>
                <span className="block overflow-hidden py-0.5">
                  <span className="editorial-line block text-[#F4F1E0]">
                    <span className="shiny-ink-text">to live system,</span>
                  </span>
                </span>
                <span className="block overflow-hidden py-0.5">
                  <span className="editorial-line block text-[#92998D]">
                    <span className="headline-secondary-shine">in four clear stages.</span>
                  </span>
                </span>
              </h2>
            </div>

            {/* Giant Metallic Numeral (01 -> 02 -> 03 -> 04) with vertical obsidian-to-silver shine */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-semibold tracking-wider text-[#F4F1E0] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#72B314]" />
                  {PROCESS_STEPS[activeStep].phase}
                </span>
              </div>

              {/* Masked Overflow Container for Vertical Slide */}
              <div className="overflow-hidden relative my-1 h-[clamp(95px,10vw,145px)] flex items-center">
                <div
                  ref={numeralRef}
                  className="select-none leading-[0.9]"
                >
                  <span
                    className="process-numeral-shine text-gradient-charcoal-silver block text-[clamp(6.8rem,10vw,9.2rem)] font-extrabold tracking-[-0.05em] tabular-nums leading-[0.9] select-none"
                    style={{ fontVariationSettings: "'wght' 800", fontWeight: 800 }}
                  >
                    {PROCESS_STEPS[activeStep].n}
                  </span>
                </div>
              </div>

              {/* Clean Hairline Progress Bar */}
              <div className="relative h-[2px] w-full max-w-[240px] rounded-full bg-[#141413]/[0.08] overflow-hidden mt-2">
                <div
                  className="h-full bg-[#9EE41A] transition-all duration-400 ease-out shadow-[0_0_8px_#9EE41A]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: 4 FROSTED-IVORY STEP CARDS
              - Active card: 100% full-contrast #141413 ink (opacity: 1), scale 1.0, 3px #72B314 left border
              - Inactive cards: clean opacity: 0.45, scale 0.97
              ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-8 md:gap-10 pb-[14vh]">
            {PROCESS_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={step.n}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  data-cursor="hover"
                  data-active={isActive ? "true" : undefined}
                  className={`frosted-ivory-card arche-glow-card shiny-border w-full rounded-[24px] p-7 sm:p-9 transition-all duration-400 ${
                    isActive
                      ? "shadow-[0_24px_60px_-12px_rgba(20,20,19,0.12)]"
                      : "shadow-[0_12px_32px_-8px_rgba(20,20,19,0.05)]"
                  }`}
                  style={{
                    opacity: isActive ? 1 : 0.45,
                    transform: isActive ? "scale(1)" : "scale(0.97)",
                    borderLeft: isActive ? "3px solid #9EE41A" : "3px solid transparent",
                    boxShadow: isActive
                      ? "0 24px 60px -12px rgba(20,20,19,0.12), -4px 0 20px -2px rgba(158,228,26,0.30)"
                      : undefined,
                  }}
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#141413]/[0.08] mb-5">
                    <span className="font-mono text-xs font-bold tracking-widest text-[#0B0C0A] uppercase flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#72B314]" />
                      {step.phase}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#2E322B]">
                      0{idx + 1} / 04
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0C0A] mb-3">
                    {step.title}
                  </h3>

                  <p className="text-[17px] text-[#0B0C0A] leading-relaxed font-bold mb-3">
                    {step.lead}
                  </p>

                  <p className="text-[15.5px] text-[#1C1E1A] leading-[1.6] font-medium mb-6">
                    {step.desc}
                  </p>

                  {/* Deliverables List */}
                  <div className="pt-5 border-t border-[#141413]/[0.08]">
                    <p className="font-mono text-[12px] font-bold tracking-wider uppercase text-[#2E322B] mb-3">
                      Key Deliverables:
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {step.deliverables.map((item) => (
                        <div key={item} className="flex items-center gap-2.5 text-[14px] text-[#1C1E1A]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#72B314] shadow-[0_0_4px_#72B314]" />
                          <span className="font-medium text-[#1C1E1A]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
