import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteContent, services } from "../data/site";
import { Link } from "../lib/router";
import { gsap, onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";
import { HeroEnvironment } from "./HeroEnvironment";
import { isIntroActive } from "./Intro";

/* ================================================================
   HERO — Original 3D Architectural Hero (Arché 4-Plate Monolith Stack)
   Authoritative 2-Column Swiss-Editorial Grid paired with Three.js PBR Centerpiece.
   ================================================================ */

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const statement = useRef<HTMLHeadingElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const proofRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReducedMotion), []);
  const [hoveredService, setHoveredService] = useState<number | null>(null);

  useLayoutEffect(() => {
    const heroEl = root.current;
    if (!heroEl) return;

    const reduce = reducedMotion || prefersReducedMotion();
    if (reduce) return;

    const ctx = gsap.context(() => {
      // 1. HERO SCROLL-OUT (ScrollTrigger, scrub: 0.85):
      // Left editorial column lifts with subtle parallax into The Proposition
      const scrollOut = gsap.timeline({
        scrollTrigger: {
          trigger: heroEl,
          start: "top top",
          end: "+=100%",
          scrub: 0.85,
          invalidateOnRefresh: true,
        },
      });

      if (leftColRef.current) {
        scrollOut.to(leftColRef.current, { yPercent: -12, opacity: 0, ease: "none", duration: 1 }, 0);
      }

      if (stripRef.current) {
        scrollOut.to(stripRef.current, { opacity: 0, ease: "none", duration: 0.3 }, 0);
      }

      // Pre-set elements for choreographed entrance
      gsap.set([line1Ref.current, line2Ref.current], { yPercent: 108 });
      if (subRef.current) gsap.set(subRef.current, { opacity: 0, y: 16 });
      if (buttonsRef.current) gsap.set(buttonsRef.current, { opacity: 0, y: 18 });
      if (proofRef.current) gsap.set(proofRef.current, { opacity: 0, y: 18 });
      if (stripRef.current) gsap.set(stripRef.current, { opacity: 0, y: 14 });

      // Orchestrated Hero Reveal Timeline (0.0s -> 1.35s, power4.out)
      const revealTl = gsap.timeline({ paused: true });

      // Display headline lines rise cleanly out of overflow-hidden masks
      revealTl.to(
        [line1Ref.current, line2Ref.current],
        {
          yPercent: 0,
          duration: 1.05,
          ease: "power4.out",
          stagger: 0.08,
        },
        0.1
      );

      // Sub-statement
      if (subRef.current) {
        revealTl.to(
          subRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
          },
          0.35
        );
      }

      // Dual CTAs
      if (buttonsRef.current) {
        revealTl.to(
          buttonsRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
          },
          0.5
        );
      }

      // 3-Column Proof Strip
      if (proofRef.current) {
        revealTl.to(
          proofRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          0.65
        );
      }

      // Bottom Index Rail
      if (stripRef.current) {
        revealTl.to(
          stripRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          0.8
        );
      }

      // Same-session fast reveal
      const runFastReveal = () => {
        if (subRef.current) gsap.set(subRef.current, { opacity: 1, y: 0 });
        if (buttonsRef.current) gsap.set(buttonsRef.current, { opacity: 1, y: 0 });
        if (proofRef.current) gsap.set(proofRef.current, { opacity: 1, y: 0 });
        if (stripRef.current) gsap.set(stripRef.current, { opacity: 1, y: 0 });

        gsap.fromTo(
          [line1Ref.current, line2Ref.current],
          { yPercent: 108 },
          {
            yPercent: 0,
            duration: 0.85,
            ease: "power4.out",
            stagger: 0.07,
          }
        );
      };

      let cleanupRevealListener = () => {};
      if (!isIntroActive()) {
        runFastReveal();
      } else {
        const onHeroReveal = () => {
          revealTl.play();
        };
        window.addEventListener("arche:hero-reveal-start", onHeroReveal, { once: true });
        const failsafe = window.setTimeout(onHeroReveal, 3200);
        cleanupRevealListener = () => {
          window.removeEventListener("arche:hero-reveal-start", onHeroReveal);
          window.clearTimeout(failsafe);
        };
      }

      return () => {
        cleanupRevealListener();
      };
    }, heroEl);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  const h = siteContent.hero;

  return (
    <section
      id="hero"
      ref={root}
      className="relative flex h-[100svh] min-h-[100svh] max-h-[100svh] w-full flex-col justify-between pt-[76px] md:pt-[84px] pb-0 overflow-hidden select-none bg-[#F4F4EE]"
      style={{ background: "#F4F4EE", color: "#141413" }}
    >
      {/* Subtle paper grain & architectural drafting grid hairlines */}
      <div className="pointer-events-none absolute inset-0 hidden justify-between px-8 md:flex z-0" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="h-full w-px" style={{ background: "rgba(20,20,19,0.045)" }} />
        ))}
      </div>

      {/* Top Telemetry Hairline Bar */}
      <div className="flex-shrink-0 w-full max-w-[1360px] mx-auto px-6 md:px-8 pt-2 pb-2 flex items-center justify-between border-b border-[rgba(20,20,19,0.08)] z-10">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-[#141413] uppercase">
            Creative Technology Studio
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline font-mono text-[11px] tracking-wider text-[#6E6D68] uppercase">
            Systems · Film · Web · AI
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAE7DF] px-2.5 py-0.5 font-mono text-[10px] text-[#141413] font-medium border border-[rgba(20,20,19,0.08)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
            Accepting Projects
          </span>
        </div>
      </div>

      {/* Main Stage: Authoritative 2-Column Swiss-Editorial Grid */}
      <div className="flex-1 min-h-0 w-full max-w-[1360px] mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-8 py-1 md:py-2 z-10">
        {/* Left Column (Editorial Typography, CTAs, Proof Strip) */}
        <div ref={leftColRef} className="lg:col-span-7 flex flex-col justify-center">
          {/* Display Headline */}
          <h1 ref={statement} className="font-sans font-semibold text-[#141413] tracking-[-0.042em] leading-[0.97]">
            <div className="overflow-hidden">
              <span ref={line1Ref} className="block text-[clamp(44px,5.0vw,80px)]">
                Systems that make
              </span>
            </div>
            <div className="overflow-hidden mt-1 md:mt-1.5">
              <span ref={line2Ref} className="block text-[clamp(44px,5.0vw,80px)]">
                businesses work better.
              </span>
            </div>
          </h1>

          {/* Editorial Sub-Statement */}
          <p ref={subRef} className="font-sans text-[15px] sm:text-[16px] md:text-[17.5px] leading-[1.52] text-[#141413]/75 max-w-[520px] mt-4 md:mt-5">
            Film, interactive web, AI agents, and operational automation—engineered together as one connected system so founders and brands scale without friction.
          </p>

          {/* Dual High-Craft CTAs */}
          <div ref={buttonsRef} className="mt-5 md:mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={h.ctaPrimary.to}
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#141413] px-6 py-2.5 md:py-3 font-sans text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#20201E] active:scale-[0.98]"
              style={{
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 24px -4px rgba(20,20,19,0.20)",
              }}
              cursor="START"
              data-magnetic
            >
              <span>{h.ctaPrimary.label}</span>
              <span className="inline-block transition-transform duration-250 ease-out group-hover:translate-x-1 font-sans">
                →
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                const svcSection = document.getElementById("services-home");
                if (svcSection) {
                  const targetY = svcSection.offsetTop;
                  if ((window as any).__lenis) {
                    (window as any).__lenis.scrollTo(targetY, { duration: 1.1 });
                  } else {
                    svcSection.scrollIntoView({ behavior: "smooth" });
                  }
                }
              }}
              className="group inline-flex items-center gap-2 rounded-full border border-[rgba(20,20,19,0.18)] bg-[#EAE7DF] px-5 py-2.5 md:py-3 font-sans text-[13px] font-medium text-[#141413] transition-all duration-200 hover:border-[#141413] hover:bg-white active:scale-[0.98]"
              data-cursor="VIEW"
            >
              <span>Explore Services</span>
              <span className="inline-block transition-transform duration-250 ease-out group-hover:translate-y-0.5">
                ↓
              </span>
            </button>
          </div>

          {/* 3-Column Architectural Proof Strip */}
          <div ref={proofRef} className="mt-5 md:mt-7 pt-4 md:pt-5 border-t border-dashed border-[#141413]/15 grid grid-cols-3 gap-4 md:gap-6 max-w-[540px]">
            <div>
              <div className="font-mono text-[10px] md:text-[11px] font-semibold tracking-wider text-[#141413] uppercase">
                04 Verticals
              </div>
              <div className="font-sans text-[12px] md:text-[13px] text-[#6E6D68] mt-0.5">
                Film, Web, AI, Ops
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] md:text-[11px] font-semibold tracking-wider text-[#141413] uppercase">
                One Pipeline
              </div>
              <div className="font-sans text-[12px] md:text-[13px] text-[#6E6D68] mt-0.5">
                Zero silos
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] md:text-[11px] font-semibold tracking-wider text-[#141413] uppercase">
                Production Grade
              </div>
              <div className="font-sans text-[12px] md:text-[13px] text-[#6E6D68] mt-0.5">
                Engineered from scratch
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Unobstructed 3D Arché 4-Plate Monolith Stack) */}
        <div className="lg:col-span-5 h-[280px] sm:h-[340px] md:h-[400px] lg:h-full relative flex items-center justify-center">
          <HeroEnvironment hoveredService={hoveredService} />
        </div>
      </div>

      {/* Bottom Docked 01–04 Vertical Rail (100% visible inside 100vh) */}
      <div ref={stripRef} className="hero-strip flex-shrink-0 w-full max-w-[1360px] mx-auto px-6 md:px-8 border-t border-[rgba(20,20,19,0.10)] py-2 z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(20,20,19,0.08)] border border-[rgba(20,20,19,0.08)] rounded-lg overflow-hidden backdrop-blur-sm bg-white/40">
          {services.map((s, idx) => (
            <Link
              key={s.slug}
              to={`/services/${s.slug}`}
              onMouseEnter={() => setHoveredService(idx)}
              onMouseLeave={() => setHoveredService(null)}
              onFocus={() => setHoveredService(idx)}
              onBlur={() => setHoveredService(null)}
              onClick={(e) => {
                if (typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname === "")) {
                  const svcSection = document.getElementById("services-home");
                  if (svcSection) {
                    e.preventDefault();
                    const targetY = svcSection.offsetTop;
                    if ((window as any).__lenis) {
                      (window as any).__lenis.scrollTo(targetY, { duration: 1.2 });
                    } else {
                      svcSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }
              }}
              className="hero-service-item group flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 transition-colors bg-[#F4F4EE]/90 hover:bg-white"
              cursor="OPEN"
            >
              <span className="font-mono text-[11px] font-medium tracking-wider text-[#141413]">
                {s.n} · {s.title.toUpperCase()}
              </span>
              <span className="font-mono text-[11px] text-[#9EE41A] transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ================================================================
   APPROACH (Prompt 15) — quiet positioning.
   Right-side visual panel responds subtly to which principle is active.
   ================================================================ */
export function Approach() {
  const items = [
    { k: "Systems thinking", v: "We design the connections between tools, content and people — not isolated deliverables." },
    { k: "AI where it earns its place", v: "Automation and agents only where they remove real work. No AI for the brochure." },
    { k: "Design + engineering", v: "Interface, motion and implementation are one language, not three handoffs." },
    { k: "Built to keep running", v: "Every engagement ends with something you can operate, measure and improve." },
  ];
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const miniRef = useRef<HTMLSpanElement>(null);
  const handoffDone = useRef(false);

  // Scroll-driven active principle detection
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const buttons = document.querySelectorAll<HTMLElement>(".approach-principle");
    const cleanups: (() => void)[] = [];
    buttons.forEach((btn, i) => {
      const st = ScrollTrigger.create({
        trigger: btn,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      });
      cleanups.push(() => st.kill());
    });

    /*
     * Prompt 14 → 15 handoff: the fully-built, breathing Process diagram
     * compresses and becomes the small icon accompanying "Systems thinking".
     * A clone flies from the diagram's last on-screen position into the icon
     * slot; if the diagram is already off-screen (fast scroll / reduced
     * motion fallback), the icon simply arrives compressed.
     */
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 62%",
      once: true,
      onEnter: () => {
        if (handoffDone.current) return;
        handoffDone.current = true;
        const icon = miniRef.current;
        if (!icon) return;
        const sources = Array.from(document.querySelectorAll<HTMLElement>("[data-pv-diagram]")).filter(
          (el) => el.offsetParent !== null
        );
        const src = sources[0]?.getBoundingClientRect();
        const dst = icon.getBoundingClientRect();
        const desktop = window.innerWidth >= 900;

        const reveal = () =>
          gsap.fromTo(
            icon,
            { scale: 1.5, opacity: 0, filter: "blur(3px)" },
            { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out", clearProps: "filter" }
          );

        if (!prefersReducedMotion() && desktop && src && src.width > 40 && src.bottom > 0 && src.top < window.innerHeight) {
          // fly a clone from the process diagram into the icon slot
          const clone = document.createElement("div");
          clone.setAttribute("aria-hidden", "true");
          clone.style.cssText = `position:fixed;left:${src.left + src.width / 2}px;top:${
            src.top + src.height / 2
          }px;width:${src.width}px;height:${src.width}px;translate:-50% -50%;z-index:90;pointer-events:none;`;
          clone.innerHTML = miniBuiltDiagramMarkup();
          document.body.appendChild(clone);
          gsap.to(clone, {
            x: dst.left + dst.width / 2 - (src.left + src.width / 2),
            y: dst.top + dst.height / 2 - (src.top + src.height / 2),
            scale: dst.width / src.width,
            opacity: 0.9,
            duration: 0.85,
            ease: "expo.inOut",
            onComplete: () => {
              clone.remove();
              reveal();
            },
          });
        } else {
          reveal();
        }
      },
    });
    cleanups.push(() => st.kill());

    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section id="approach" ref={sectionRef} className="on-ink relative w-full overflow-hidden py-[clamp(76px,10vw,150px)]">
      {/* Ambient diagonal sweep — plays once on section entry */}
      <div
        className="approach-sweep pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(135deg, transparent 0%, color-mix(in srgb, var(--accent) 5%, transparent) 45%, transparent 65%)",
          transform: "translateX(-110%)",
          transition: "transform 1.4s var(--e-inout)",
        }}
        aria-hidden
      />
      <div className="wrap">
        <div className="mb-[clamp(36px,4vw,64px)] flex items-center gap-[16px]">
          <span className="mono" style={{ color: "var(--accent-ink)" }}>
            Approach
          </span>
          <span className="h-px flex-1 origin-left" style={{ background: "var(--line)" }} data-r="line" />
        </div>
        <h2 className="d1 max-w-[14ch]" data-r="mask">
          Good systems don't add more work.
        </h2>
        <p className="d3 mt-[18px] max-w-[16ch]" data-r="mask" style={{ color: "var(--faint)" }}>
          They remove it.
        </p>

        <div className="mt-[clamp(48px,6vw,90px)] grid gap-[28px] md:grid-cols-12">
          <div className="flex min-w-0 flex-col md:col-span-7">
            {items.map((it, i) => (
              <button
                key={it.k}
                type="button"
                aria-pressed={active === i}
                className="approach-principle grid min-w-0 gap-[12px] border-t py-[22px] text-left md:grid-cols-8 cursor-pointer transition-all duration-300 group"
                style={{
                  borderColor: active === i ? "var(--accent-deep)" : "var(--line)",
                  background: active === i ? "rgba(200, 241, 79, 0.03)" : "transparent",
                  paddingLeft: active === i ? "10px" : "0px",
                }}
                data-r="meta"
                data-r-delay={i * 70}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                <span className="mono md:col-span-1" style={{ color: active === i ? "var(--accent)" : "var(--faint)" }}>0{i + 1}</span>
                <h3 className="d4 flex items-center gap-[10px] md:col-span-3" style={{ color: active === i ? "var(--fg)" : "var(--muted)", transition: "color .35s" }}>
                  {i === 0 && (
                    /* the Process diagram, compressed — still running */
                    <span
                      ref={miniRef}
                      className={`pv-mini inline-block h-[24px] w-[24px] flex-none ${prefersReducedMotion() ? "opacity-100" : "opacity-0"}`}
                      aria-hidden
                    >
                      <span className="pv-breath block h-full w-full">
                        <MiniBuiltDiagram />
                      </span>
                    </span>
                  )}
                  {it.k}
                </h3>
                <p className="body max-w-[42ch] md:col-span-4" style={{ color: active === i ? "var(--fg)" : "var(--faint)", transition: "color .35s" }}>{it.v}</p>
              </button>
            ))}

            {/* Mobile visual preview */}
            <div className="mt-[24px] block md:hidden">
              <ApproachVisual active={active} onSelect={setActive} />
            </div>
          </div>
          <div className="hidden min-w-0 md:col-span-5 md:block">
            <div className="sticky top-[140px]">
              <ApproachVisual active={active} onSelect={setActive} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Static markup string of the built diagram, for the handoff clone.
 *  Colors are hardcoded to the dark Approach scope — the clone is appended
 *  to document.body, outside the .on-ink CSS variable scope. */
function miniBuiltDiagramMarkup(): string {
  const dots = PV_CORNERS.map(
    (c) => `<span style="position:absolute;left:${c.x}%;top:${c.y}%;width:7%;height:7%;translate:-50% -50%;border-radius:999px;background:#c8f14f;box-shadow:0 0 12px rgba(200,241,79,.55);"></span>`
  ).join("");
  const lines = PV_CORNERS.map(
    (c) =>
      `<line x1="${c.x}" y1="${c.y}" x2="50" y2="50" stroke="#7fae00" stroke-width="2.4" opacity="0.9"/>`
  ).join("");
  return `
    <div style="width:100%;height:100%;background:#141416;border-radius:8px;position:relative;overflow:hidden;">
      <svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%;" fill="none">${lines}</svg>
      ${dots}
      <span style="position:absolute;left:50%;top:50%;width:14%;height:14%;translate:-50% -50%;border-radius:999px;border:2px solid #7fae00;background:#141416;display:grid;place-items:center;">
        <span style="width:38%;height:38%;border-radius:999px;background:#c8f14f;"></span>
      </span>
    </div>`;
}

/** The built Process diagram in miniature — lives beside "Systems thinking". */
function MiniBuiltDiagram() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden>
      {PV_CORNERS.map((c, i) => (
        <line key={i} x1={c.x} y1={c.y} x2="50" y2="50" stroke="var(--accent-deep)" strokeWidth="3" opacity="0.8" />
      ))}
      {PV_CORNERS.map((c, i) => (
        <circle key={`d${i}`} cx={c.x} cy={c.y} r="6.5" fill="var(--accent)" />
      ))}
      <circle cx="50" cy="50" r="12" fill="var(--bg-2)" stroke="var(--accent-deep)" strokeWidth="3" />
      <circle cx="50" cy="50" r="4.5" fill="var(--accent)" />
    </svg>
  );
}

/**
 * PROMPT 31 — Approach Visual Panel.
 * Distinct, rich visual states responding directly to the 4 principles:
 * 0: Systems thinking — disconnected nodes drawing connections between them
 * 1: AI where it earns its place — manual task visibly fades out / disappears
 * 2: Design + engineering — two distinct layers merge into alignment
 * 3: Built to keep running — slow continuous pulse & resilient operating loop
 */
interface ApproachVisualProps {
  active: number;
  onSelect?: (index: number) => void;
}

export function ApproachVisual({ active, onSelect }: ApproachVisualProps) {
  const titles = [
    { num: "01", name: "Systems thinking", sub: "DISCONNECTED NODES → INTEGRATED GRAPH", status: "4 NODES · 1 HUB · LINKED" },
    { num: "02", name: "AI where it earns", sub: "MANUAL DETOUR → DIRECT AGENT ROUTE", status: "AGENT ROUTE · VERIFIED" },
    { num: "03", name: "Design + engineering", sub: "DESIGN LAYER → ALIGNED WITH CODE", status: "0 HANDOFFS" },
    { num: "04", name: "Built to keep running", sub: "SHIPPED SYSTEM → CONTINUOUS UPTIME", status: "HEALTH: NOMINAL" },
  ];

  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden rounded-[8px] border min-h-[340px] md:min-h-[380px] select-none transition-colors duration-500"
      style={{
        borderColor: "var(--line)",
        background: "#0f0f12",
        boxShadow: "0 18px 40px -12px rgba(0,0,0,0.6)",
      }}
      aria-label="Approach interactive architectural diagram"
    >
      {/* Top HUD: Step Switcher & Live Principle Title */}
      <div
        className="flex items-center justify-between border-b px-[14px] py-[10px]"
        style={{ borderColor: "rgba(244,242,237,0.08)", background: "rgba(20,20,24,0.7)" }}
      >
        <div className="flex items-center gap-[8px] min-w-0">
          <span className="block h-[6px] w-[6px] flex-none rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="mono text-[9.5px] font-medium tracking-wider truncate" style={{ color: "rgba(244,242,237,0.7)" }}>
            0{active + 1} // {titles[active].name.toUpperCase()}
          </span>
        </div>

        {/* 4 Interactive Selector Tabs */}
        <div className="flex items-center gap-[4px] flex-none">
          {titles.map((t, idx) => {
            const isCur = active === idx;
            return (
              <button
                key={t.num}
                type="button"
                onClick={() => onSelect?.(idx)}
                className="mono text-[9px] px-[6px] py-[2px] rounded transition-all duration-200 cursor-pointer"
                style={{
                  background: isCur ? "var(--accent)" : "rgba(244,242,237,0.06)",
                  color: isCur ? "#0c0c0d" : "rgba(244,242,237,0.45)",
                  fontWeight: isCur ? 700 : 500,
                  transform: isCur ? "scale(1.05)" : "scale(1)",
                }}
                title={t.name}
              >
                {t.num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main canvas — one persistent morphing diagram (shared elements across all 4 states) */}
      <div className="relative flex-1 flex flex-col items-center justify-center gap-[10px] px-[16px] py-[14px] min-h-[240px]">
        <ApproachMorph active={active} />
        <div className="relative h-[14px] w-full">
          {titles.map((t, i) => (
            <span
              key={t.num}
              className="mono absolute inset-0 text-center text-[8.5px] tracking-wider transition-all duration-500"
              style={{
                color: "rgba(244,242,237,0.6)",
                opacity: active === i ? 1 : 0,
                transform: active === i ? "translateY(0)" : "translateY(6px)",
                transitionDelay: active === i ? "0.35s" : "0s",
              }}
              aria-hidden={active !== i}
            >
              {t.status}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Telemetry Readout Bar */}
      <div
        className="flex items-center justify-between border-t px-[14px] py-[8px]"
        style={{ borderColor: "rgba(244,242,237,0.08)", background: "rgba(20,20,24,0.7)" }}
      >
        <span className="mono text-[8.5px] truncate max-w-[85%]" style={{ color: "var(--accent)" }}>
          ↳ {titles[active].sub}
        </span>
        <span className="mono text-[8.5px] font-bold" style={{ color: "rgba(244,242,237,0.5)" }}>
          0{active + 1}/04
        </span>
      </div>
    </div>
  );
}

/**
 * PROMPT 39 — the Approach diagram is ONE set of shared elements (4 nodes,
 * 1 hub, 8 edges) whose geometry is tweened between states, so each
 * principle opens from the previous principle's closing shape:
 *  0 graph (square + spokes) → 1 nodes collapse into an input→agent→output
 *  pipeline, one node lifts into a fading manual detour → 2 the pipeline
 *  spreads into an engineering frame and a design layer slides into
 *  alignment on it → 3 the frame's corners drop onto an orbit around the
 *  running core. Text is limited to one glyph in the hub — nothing can overlap.
 */
type MNode = { x: number; y: number; r: number; o: number };
const M_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0], // perimeter
  [0, 4], [1, 4], [2, 4], [3, 4], // spokes (4 = hub)
];
const M_STATES: { nodes: MNode[]; edges: number[]; dashed?: number[]; hubLabel: string }[] = [
  {
    nodes: [
      { x: 45, y: 22, r: 5, o: 1 }, { x: 155, y: 22, r: 5, o: 1 },
      { x: 155, y: 118, r: 5, o: 1 }, { x: 45, y: 118, r: 5, o: 1 },
      { x: 100, y: 70, r: 11, o: 1 },
    ],
    edges: [1, 1, 1, 1, 0.55, 0.55, 0.55, 0.55],
    hubLabel: "",
  },
  {
    nodes: [
      { x: 100, y: 24, r: 4, o: 0.3 }, { x: 178, y: 78, r: 7, o: 1 },
      { x: 178, y: 78, r: 7, o: 0 }, { x: 22, y: 78, r: 7, o: 1 },
      { x: 100, y: 78, r: 17, o: 1 },
    ],
    edges: [0.22, 0, 0, 0.22, 0, 1, 0, 1],
    dashed: [0, 3],
    hubLabel: "AI",
  },
  {
    nodes: [
      { x: 52, y: 26, r: 3.5, o: 1 }, { x: 148, y: 26, r: 3.5, o: 1 },
      { x: 148, y: 114, r: 3.5, o: 1 }, { x: 52, y: 114, r: 3.5, o: 1 },
      { x: 100, y: 70, r: 4, o: 1 },
    ],
    edges: [0.9, 0.9, 0.9, 0.9, 0, 0, 0, 0],
    hubLabel: "",
  },
  {
    nodes: [
      { x: 100 - 34, y: 70 - 34, r: 4, o: 1 }, { x: 100 + 34, y: 70 - 34, r: 4, o: 1 },
      { x: 100 + 34, y: 70 + 34, r: 4, o: 1 }, { x: 100 - 34, y: 70 + 34, r: 4, o: 1 },
      { x: 100, y: 70, r: 22, o: 1 },
    ],
    edges: [0, 0, 0, 0, 0.3, 0.3, 0.3, 0.3],
    hubLabel: "RUNNING",
  },
];

function ApproachMorph({ active }: { active: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const pos = useRef<MNode[]>(M_STATES[0].nodes.map((n) => ({ ...n })));
  const edgeState = useRef(M_STATES[0].edges.map((o) => ({ o, d: 0 })));
  const first = useRef(true);

  useEffect(() => {
    const root = svg.current;
    if (!root) return;
    const st = M_STATES[active];
    const nodes = root.querySelectorAll<SVGCircleElement>("[data-mn]");
    const edges = root.querySelectorAll<SVGLineElement>("[data-me]");
    const render = () => {
      pos.current.forEach((n, i) => {
        const c = nodes[i];
        c.setAttribute("cx", String(n.x));
        c.setAttribute("cy", String(n.y));
        c.setAttribute("r", String(n.r));
        c.style.opacity = String(n.o);
      });
      M_EDGES.forEach(([a, b], i) => {
        const l = edges[i];
        const A = pos.current[a], B = pos.current[b];
        l.setAttribute("x1", String(A.x)); l.setAttribute("y1", String(A.y));
        l.setAttribute("x2", String(B.x)); l.setAttribute("y2", String(B.y));
        l.style.opacity = String(edgeState.current[i].o);
        l.style.strokeDashoffset = String(edgeState.current[i].d);
      });
    };
    const reduced = prefersReducedMotion();
    const dur = reduced ? 0 : 0.9;
    const tl = gsap.timeline({ onUpdate: render, onComplete: render });
    st.nodes.forEach((n, i) => tl.to(pos.current[i], { ...n, duration: dur, ease: "expo.inOut" }, 0));
    st.edges.forEach((o, i) => {
      const e = edgeState.current[i];
      const appearing = o > 0 && e.o === 0;
      edges[i].style.strokeDasharray = st.dashed?.includes(i) ? "0.04 0.03" : "1";
      if (appearing || (first.current && active === 0 && !reduced)) {
        // disconnected → connected: the edge draws itself in
        e.d = 1;
        tl.to(e, { o, d: 0, duration: dur * 0.8, ease: "power3.out" }, dur * 0.45 + (i % 4) * 0.08);
      } else {
        tl.to(e, { o, d: 0, duration: dur * 0.6, ease: "power2.inOut" }, o === 0 ? 0 : dur * 0.3);
      }
    });
    first.current = false;
    render();
    return () => { tl.kill(); };
  }, [active]);

  const on = (i: number) => active === i;
  return (
    <svg ref={svg} viewBox="0 0 200 140" className="h-auto w-full max-w-[300px] overflow-visible" fill="none" aria-hidden>
      {/* state 3 — orbit ring + orbiting signal */}
      <g style={{ opacity: on(3) ? 1 : 0, transition: `opacity .6s ${on(3) ? ".5s" : "0s"}` }}>
        <circle cx="100" cy="70" r="48" stroke="var(--accent-deep)" strokeWidth="1" className="approach-pulse-ring" style={{ transformOrigin: "100px 70px" }} />
        <g className="animate-spin" style={{ transformOrigin: "100px 70px", animationDuration: "7s" }}>
          <circle cx="100" cy="22" r="3" fill="var(--accent)" style={{ filter: "drop-shadow(0 0 4px var(--accent))" }} />
        </g>
      </g>
      {/* state 2 — design layer slides onto the engineering frame */}
      <rect
        x="52" y="26" width="96" height="88" rx="3"
        stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="4 3"
        style={{
          opacity: on(2) ? 1 : 0,
          transform: on(2) ? "translate(0,0)" : "translate(16px,-12px)",
          transition: `transform .9s cubic-bezier(.16,1,.3,1) ${on(2) ? ".75s" : "0s"}, opacity .4s ${on(2) ? ".6s" : "0s"}`,
        }}
      />
      {/* state 1 — signal travelling the agent route */}
      {on(1) && (
        <circle r="2.6" cx="22" cy="78" fill="#f4f2ed" className="approach-route-dot" />
      )}
      {M_EDGES.map((_, i) => (
        <line key={i} data-me pathLength={1} stroke={i < 4 ? "var(--accent)" : "var(--accent-deep)"} strokeWidth={i < 4 ? 1.2 : 1} strokeLinecap="round" />
      ))}
      {M_STATES[0].nodes.map((_, i) => (
        <circle
          key={i}
          data-mn
          fill={i === 4 ? "#141416" : "var(--accent)"}
          stroke={i === 4 ? "var(--accent)" : "none"}
          strokeWidth={i === 4 ? 1.2 : 0}
          style={{ filter: "drop-shadow(0 0 4px rgba(200,241,79,.5))" }}
        />
      ))}
      {/* hub glyph — the only in-diagram text, one at a time */}
      {M_STATES.map((st, i) =>
        st.hubLabel ? (
          <text
            key={i}
            x="100" y={i === 1 ? 78 : 70} textAnchor="middle" dominantBaseline="central"
            className="mono" fontSize={i === 3 ? 7 : 9} fontWeight={700} fill="var(--accent)"
            style={{ opacity: on(i) ? 1 : 0, transition: `opacity .4s ${on(i) ? ".7s" : "0s"}` }}
          >
            {st.hubLabel}
          </text>
        ) : null
      )}
    </svg>
  );
}

/* ================================================================
   PROCESS (Prompt 14) — Accumulating Diagram.
   The left-side diagram visibly builds as scroll progresses through
   steps; clicking a step label jumps the diagram to that state.
   Mobile: a compact diagram rides along, still scroll-triggered.
   ================================================================ */
export function ProcessSys() {
  const root = useRef<HTMLElement>(null);
  const p = siteContent.process;
  const [activeStep, setActiveStep] = useState(0);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pr-fill",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: ".pr-list", start: "top 70%", end: "bottom 78%", scrub: 0.5 },
        }
      );
      gsap.utils.toArray<HTMLElement>(".pr-step").forEach((step, i) => {
        gsap.to(step.querySelector(".pr-node"), {
          backgroundColor: "#c8f14f",
          borderColor: "#7fae00",
          scale: 1.25,
          duration: 0.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: step,
            start: "top 64%",
            toggleActions: "play none none reverse",
            onEnter: () => setActiveStep(i),
            onEnterBack: () => setActiveStep(i),
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="process" ref={root} className="w-full py-[clamp(76px,10vw,150px)]">
      <div className="wrap">
        <div className="mb-[clamp(40px,5vw,80px)] grid gap-[20px] md:grid-cols-12">
          <p className="mono mono-a md:col-span-3">{p.label}</p>
          <h2 className="d2 md:col-span-9" data-r="mask">
            {p.statement}
          </h2>
        </div>

        <div className="pr-list relative grid md:grid-cols-12">
          <div className="pointer-events-none absolute top-0 bottom-0 left-[7px] w-px md:left-[calc(25%+7px)]">
            <span className="absolute inset-0" style={{ background: "var(--line)" }} />
            <span className="pr-fill absolute inset-0 origin-top" style={{ background: "var(--fg)" }} />
          </div>
          <div className="hidden md:col-span-3 md:block">
            <div className="sticky top-[130px] pr-[36px]">
              <ProcessVisual active={activeStep} />
            </div>
          </div>
          <div className="flex flex-col md:col-span-9">
            {/* Mobile companion diagram — same accumulating states, stays sticky with the stages */}
            <div
              className="sticky top-[64px] z-10 mb-[16px] flex justify-center py-[8px] md:hidden"
              style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(8px)" }}
            >
              <ProcessVisual active={activeStep} compact />
            </div>
            {p.steps.map((s, si) => (
              <div
                key={s.n}
                role="button"
                tabIndex={0}
                aria-pressed={activeStep === si}
                onClick={() => setActiveStep(si)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setActiveStep(si))}
                data-cursor="JUMP"
                className="pr-step relative flex cursor-pointer gap-[22px] rounded-[4px] py-[clamp(18px,2.2vw,32px)] pl-[34px] outline-none md:pl-[42px]"
                style={{ background: activeStep === si ? "var(--bg-2)" : "transparent", transition: "background .4s var(--e-out)" }}
              >
                <span
                  className="pr-node absolute top-[calc(clamp(18px,2.2vw,32px)+6px)] left-0 block h-[15px] w-[15px] rounded-full md:left-[-0.5px]"
                  style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                />
                <span className="mono mono-fg flex-none pt-[5px]" style={{ width: 30 }}>
                  {s.n}
                </span>
                <div className="flex flex-1 flex-col gap-[6px] md:flex-row md:items-baseline md:gap-[36px]">
                  <h3 className="d4 flex-none md:w-[190px]" data-r="meta" style={s.k === "Connect" ? { color: "var(--accent-ink)" } : undefined}>
                    {s.k}
                  </h3>
                  <div className="flex flex-col gap-[10px]">
                    <p className="body max-w-[48ch]" data-r="meta" data-r-delay="80">
                      {s.v}
                    </p>
                    {s.k === "Connect" && (
                      <div className="flex flex-wrap items-center gap-[8px]" data-r="meta">
                        {["Website", "Agent", "Automation", "Existing tools"].map((lab, i, arr) => (
                          <span key={lab} className="flex items-center gap-[8px]">
                            <span className="mono" style={{ padding: "4px 10px", border: "1px solid var(--accent-deep)", borderRadius: 999, color: "var(--accent-ink)" }}>
                              {lab}
                            </span>
                            {i < arr.length - 1 && <span className="mono" style={{ color: "var(--accent-ink)" }}>→</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Prompt 14 — Process Accumulating Diagram (rebuilt for Prompt 24).
 *
 * Each state only ADDS to what the previous state built, and — this was the
 * fix — the built result is a pure function of the active step, so the
 * diagram at Evolve is visibly a superset of the diagram at Discover no
 * matter how the visitor got there (scroll, click, jump, scroll back):
 *
 *  0 DISCOVER  a single dim central dot, alone.
 *  1 DESIGN    the four connection lines draw out from the centre, still dim.
 *  2 BUILD     the four outer dots appear at the end of each line, one at a
 *              time with a short stagger.
 *  3 CONNECT   the four dots close into a perimeter, everything turns lime,
 *              and all five nodes pulse once together before settling lit.
 *  4 LAUNCH    a single bright pulse radiates outward from the centre to a
 *              dotted horizon ring, which stays behind as new geometry.
 *  5 EVOLVE    the built system keeps running: a slow breathing halo, a
 *              signal dot orbiting the perimeter, the horizon turning.
 *
 * Persistent layers are plain inline styles + CSS transitions (React owns
 * them, so state changes always animate and never desync). The two one-shot
 * moments are keyed CSS animations: bumping the key remounts the echo layer,
 * which restarts the animation — nothing here fights React for a transform.
 */
const PV_CORNERS = [
  { x: 15, y: 15 },
  { x: 85, y: 15 },
  { x: 15, y: 85 },
  { x: 85, y: 85 },
];

const PV_E = "var(--e-out)";

function ProcessVisual({ active, compact = false }: { active: number; compact?: boolean }) {
  const s = Math.max(0, Math.min(5, active));
  const prev = useRef(-1);
  const [syncKey, setSyncKey] = useState(0);
  const [launchKey, setLaunchKey] = useState(0);

  const lines = s >= 1; // DESIGN
  const dots = s >= 2; // BUILD
  const lit = s >= 3; // CONNECT
  const launched = s >= 4; // LAUNCH
  const alive = s >= 5; // EVOLVE

  /* One-shot beats, fired when those states are entered moving forward —
     and in the right order when a click jumps past more than one. */
  useEffect(() => {
    const from = prev.current;
    prev.current = s;
    if (prefersReducedMotion()) return;
    const ids: number[] = [];
    let t = 240; // let the new layers draw in first
    if (s >= 3 && from < 3) {
      ids.push(window.setTimeout(() => setSyncKey((k) => k + 1), t));
      t += 420;
    }
    if (s >= 4 && from < 4) ids.push(window.setTimeout(() => setLaunchKey((k) => k + 1), t));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [s]);

  const stage = siteContent.process.steps[s];
  const svgCenter = { transformBox: "view-box", transformOrigin: "50px 50px" } as const;
  const svgSelf = { transformBox: "fill-box", transformOrigin: "center" } as const;

  return (
    <div
      data-pv-diagram
      data-state={s}
      className={`pv-root relative aspect-square w-full overflow-hidden rounded-[6px] ${compact ? "max-w-[164px]" : "max-w-[230px]"}`}
      style={{ background: "var(--bg-2)" }}
      aria-hidden
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none">
        {/* LAUNCH+ — the horizon the pulse travelled to. It stays: new
            geometry that the earlier states do not have. Turns once EVOLVE. */}
        <circle
          cx="50"
          cy="50"
          r="40"
          pathLength={100}
          strokeDasharray="1.4 3.2"
          stroke="var(--accent-deep)"
          strokeWidth="0.7"
          style={{
            opacity: launched ? 0.5 : 0,
            transition: `opacity .6s ${PV_E}`,
            animation: alive && !prefersReducedMotion() ? "pvSpin 26s linear infinite" : "none",
            ...svgCenter,
          }}
        />

        {/* CONNECT+ — the perimeter that joins the four outer dots */}
        <rect
          x="15"
          y="15"
          width="70"
          height="70"
          rx="9"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={lit ? 0 : 1}
          stroke="var(--accent-deep)"
          strokeWidth="0.9"
          style={{ opacity: lit ? 0.7 : 0, transition: `stroke-dashoffset 1s ${PV_E} .08s, opacity .5s ${PV_E}` }}
        />

        {/* DESIGN+ — four connection lines, drawn out from the centre */}
        {PV_CORNERS.map((c, i) => (
          <line
            key={`ln-${i}`}
            x1="50"
            y1="50"
            x2={c.x}
            y2={c.y}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={lines ? 0 : 1}
            stroke={lit ? "var(--accent-deep)" : "var(--fg)"}
            strokeWidth={lit ? 0.85 : 0.55}
            style={{
              opacity: lines ? (lit ? 0.85 : 0.3) : 0,
              transition: `stroke-dashoffset .85s ${PV_E} ${i * 90}ms, opacity .45s ${PV_E} ${i * 90}ms, stroke .5s, stroke-width .5s`,
            }}
          />
        ))}

        {/* EVOLVE — the breathing halo. Slow, low amplitude, never stops. */}
        {alive && !prefersReducedMotion() && (
          <circle cx="50" cy="50" r="25" stroke="var(--accent-deep)" strokeWidth="0.8" className="pv-breath" style={svgCenter} />
        )}

        {/* EVOLVE — one signal, orbiting the built system */}
        {alive && !prefersReducedMotion() && (
          <g style={{ animation: "pvSpin 7.5s linear infinite", ...svgCenter }}>
            <circle cx="50" cy="16" r="2.1" fill="var(--accent)" style={{ filter: "drop-shadow(0 0 3px var(--accent-deep))" }} />
          </g>
        )}

        {/* BUILD+ — the four outer dots, one at a time */}
        {PV_CORNERS.map((c, i) => (
          <circle
            key={`dot-${i}`}
            cx={c.x}
            cy={c.y}
            r="3.6"
            fill={lit ? "var(--accent)" : "var(--fg)"}
            style={{
              opacity: dots ? 1 : 0,
              transform: dots ? "scale(1)" : "scale(0)",
              transition: `transform .55s cubic-bezier(.34,1.56,.64,1) ${i * 110}ms, opacity .3s ${PV_E} ${i * 110}ms, fill .5s`,
              filter: lit ? "drop-shadow(0 0 3px color-mix(in srgb, var(--accent-deep) 70%, transparent))" : "none",
              ...svgSelf,
            }}
          />
        ))}

        {/* DISCOVER+ — the centre. Present and dim from the very first state. */}
        <circle
          cx="50"
          cy="50"
          r="9.5"
          fill="var(--bg-2)"
          stroke={lit ? "var(--accent-deep)" : "var(--line)"}
          strokeWidth="1"
          style={{
            opacity: lines ? 1 : 0.6,
            transition: `stroke .5s, opacity .5s, filter .5s`,
            filter: lit ? "drop-shadow(0 0 5px color-mix(in srgb, var(--accent-deep) 45%, transparent))" : "none",
          }}
        />
        <circle
          cx="50"
          cy="50"
          r="3.2"
          fill={lit ? "var(--accent)" : "var(--faint)"}
          style={{
            opacity: lit ? 1 : 0.6,
            transform: launched ? "scale(1.5)" : "scale(1)",
            transition: `transform .55s ${PV_E}, fill .5s, opacity .5s`,
            ...svgSelf,
          }}
        />

        {/* CONNECT — all five nodes pulse lime once, together (keyed remount) */}
        {syncKey > 0 && lit && (
          <g key={`sync-${syncKey}`}>
            <circle cx="50" cy="50" r="9.5" fill="none" stroke="var(--accent)" strokeWidth="1.3" className="pv-sync-ring" style={svgCenter} />
            {PV_CORNERS.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r="3.6" fill="var(--accent)" className="pv-sync-dot" style={svgSelf} />
            ))}
            <circle cx="50" cy="50" r="3.2" fill="var(--accent)" className="pv-sync-dot" style={svgSelf} />
          </g>
        )}

        {/* LAUNCH — one bright pulse radiating outward from the centre */}
        {launchKey > 0 && (
          <g key={`launch-${launchKey}`}>
            <circle cx="50" cy="50" r="10" fill="none" stroke="var(--accent)" strokeWidth="2" className="pv-launch" style={svgCenter} />
            <circle cx="50" cy="50" r="6" fill="var(--accent)" className="pv-launch-core" style={svgCenter} />
          </g>
        )}
      </svg>

      <p
        className="mono absolute inset-x-0 bottom-[7px] text-center"
        style={{
          fontSize: compact ? 8 : 9,
          letterSpacing: ".12em",
          color: alive ? "var(--accent-ink)" : "var(--faint)",
          transition: "color .5s",
        }}
      >
        {stage.n} · {stage.k.toUpperCase()}
      </p>
    </div>
  );
}

/* ================================================================
   FINAL CTA (Prompt 18) — The Convergence Moment.
   The one time the site uses true multi-object convergence: echoes of
   earlier motifs (a Problem status card, a Service tab icon, a 3D node
   fragment, the lime signal dot) drift in from the viewport edges,
   merge into a single bright lime point, and that point expands outward
   into the resting node/line graphic as the headline appears.
   Plays once on entry (~1.9s). Mobile: the converged graphic is
   pre-arranged and simply settles in — light entrance only.
   ================================================================ */
const FC_MOTIFS = [
  { label: "STATUS", from: [-320, -210], icon: "status" },
  { label: "SERVICE", from: [300, -230], icon: "tab" },
  { label: "NODE", from: [340, 200], icon: "node" },
  { label: "SIGNAL", from: [-290, 230], icon: "signal" },
];

const FC_NODES = [
  { k: "Website", x: 16, y: 20 },
  { k: "AI Agent", x: 84, y: 18 },
  { k: "Automation", x: 86, y: 80 },
  { k: "Content", x: 14, y: 82 },
];

/* Index-safe accessors: the section renders two sets of .fc-line (desktop
   graphic + mobile static graphic), so a bare ".fc-line" selector can hand
   GSAP more targets than there are nodes. Never let a missing index throw
   inside a tween — that would abort the whole timeline every frame. */
const fcNode = (i: number) => FC_NODES[i] ?? FC_NODES[((i % FC_NODES.length) + FC_NODES.length) % FC_NODES.length];
const fcX = (i: number) => fcNode(i).x;
const fcY = (i: number) => fcNode(i).y;

export function FinalCTA() {
  const c = siteContent.contact;
  const root = useRef<HTMLElement>(null);
  const convergeCenterRef = useRef<HTMLSpanElement>(null);

  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReducedMotion), []);

  useLayoutEffect(() => {
    if (!root.current || reducedMotion) return;
    const desktop = window.matchMedia("(min-width: 900px)").matches;

    const ctx = gsap.context(() => {
      if (!desktop) {
        /* Mobile: composed graphic pre-arranged, light entrance only. */
        gsap.set(".fc-static", { opacity: 0, y: 16 });
        gsap.set(".fc-static .fc-line", { attr: { x2: 50, y2: 50 } });
        gsap.set(".fc-text > *", { opacity: 0, y: 14 });
        gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        })
          .to(".fc-static", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" })
          .to(".fc-static .fc-line", { attr: { x2: fcX, y2: fcY, duration: 0.6, ease: "power2.out" } }, 0.1)
          .to(".fc-text > *", { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" }, 0.25);
        gsap.set(".fc-motif, .fc-converge-point", { display: "none" });
        return;
      }

      /* Desktop: the one true convergence. Plays once on entry.
         Initial states are set explicitly, then the timeline only uses
         .to() — no immediateRender ambiguity. */
      gsap.set(".fc-motif", {
        x: (i: number) => FC_MOTIFS[i].from[0],
        y: (i: number) => FC_MOTIFS[i].from[1],
        rotation: (i: number) => (i % 2 ? 10 : -10),
        opacity: 0,
        scale: 0.85,
      });
      gsap.set(convergeCenterRef.current, { scale: 0, opacity: 0 });
      gsap.set(".fc-line-live", { attr: { x2: 50, y2: 50 }, opacity: 0 });
      gsap.set(".fc-node", { opacity: 0, scale: 0.6 });
      gsap.set(".fc-core", { opacity: 0, scale: 0.5 });
      gsap.set(".fc-text > *", { opacity: 0, y: 18 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 74%", once: true },
      });

      // 1 — echoes drift in from the edges toward center (~1s)
      tl.to(
        ".fc-motif",
        {
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          scale: 1,
          duration: 1.0,
          ease: "power2.inOut",
          stagger: 0.05,
        },
        0
      );

      // 2 — they merge into a single bright lime point
      tl.to(".fc-motif", { scale: 0, opacity: 0, duration: 0.3, ease: "power3.in", stagger: 0.03 }, 1.0).to(
        convergeCenterRef.current,
        { scale: 1, opacity: 1, duration: 0.28, ease: "power2.out" },
        1.12
      );

      // 3 — the point expands outward into the node/line graphic
      tl.to(convergeCenterRef.current, { scale: 2.6, opacity: 0, duration: 0.5, ease: "power2.out" }, 1.42)
        .to(
          ".fc-line-live",
          { attr: { x2: fcX, y2: fcY }, opacity: 0.7, duration: 0.45, ease: "power2.out", stagger: 0.04 },
          1.46
        )
        .to(
          ".fc-node",
          { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.8)", stagger: 0.05 },
          1.62
        )
        .to(".fc-core", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, 1.78);

      // 4 — the headline settles in as the graphic reaches rest
      tl.to(
        ".fc-text > *",
        { opacity: 1, y: 0, duration: 0.65, stagger: 0.09, ease: "power3.out" },
        1.62
      );
    }, root);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="start" ref={root} className="on-ink relative w-full overflow-hidden py-[clamp(90px,12vw,180px)]">
      {/* Convergence motifs — desktop only; mobile uses the static graphic */}
      <div className="pointer-events-none absolute inset-0 hidden place-items-center lg:grid" aria-hidden>
        {FC_MOTIFS.map((m) => (
          <span
            key={m.label}
            className="fc-motif absolute inline-flex items-center gap-[6px] rounded-full border px-[10px] py-[5px]"
            style={{
              borderColor: m.icon === "signal" ? "var(--accent)" : "var(--line)",
              background: m.icon === "signal" ? "var(--accent-deep)" : "var(--bg-2)",
              color: m.icon === "signal" ? "#0c0c0d" : "var(--fg)",
              top: "50%",
              left: "50%",
              translate: "-50% -50%",
            }}
          >
            {m.icon === "signal" ? (
              <span className="signal-dot" style={{ width: 6, height: 6 }} />
            ) : (
              <span className="block h-[6px] w-[6px] rounded-full" style={{ background: m.icon === "node" ? "var(--accent-deep)" : "var(--faint)" }} />
            )}
            <span className="mono text-[8px]">{m.label}</span>
          </span>
        ))}
        {/* the single bright lime point the motifs merge into */}
        <span
          ref={convergeCenterRef}
          className="fc-converge-point absolute top-1/2 left-1/2 block h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
          style={{
            background: "var(--accent)",
            boxShadow: "0 0 30px var(--accent), 0 0 60px color-mix(in srgb, var(--accent-deep) 60%, transparent)",
          }}
        />
      </div>

      {/* resting node/line graphic — desktop: right column; mobile: static composed */}
      <div className="pointer-events-none absolute top-[8%] right-[3%] bottom-[8%] hidden w-[42%] lg:block" aria-hidden>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {FC_NODES.map((n) => (
            <line key={n.k} className="fc-line fc-line-live" x1={n.x} y1={n.y} x2={50} y2={50} stroke="var(--accent-deep)" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity=".7" />
          ))}
        </svg>
        {FC_NODES.map((n) => (
          <span key={n.k} className="fc-node mono absolute rounded-full border px-[12px] py-[6px]" style={{ left: `${n.x}%`, top: `${n.y}%`, translate: "-50% -50%", borderColor: "var(--line)", color: "var(--fg)", background: "var(--bg-2)" }}>
            {n.k}
          </span>
        ))}
        <div className="fc-core absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[10px] rounded-full px-[16px] py-[10px]" style={{ background: "var(--fg)", color: "var(--bg)" }}>
          <span className="signal-dot" />
          <span className="font-mono text-[11px] tracking-[.16em] uppercase">Arche</span>
        </div>
      </div>

      {/* mobile composed graphic — pre-arranged, light entrance */}
      <div className="wrap relative mb-[34px] lg:hidden" aria-hidden>
        <div className="fc-static relative mx-auto aspect-[16/7] w-full max-w-[520px]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {FC_NODES.map((n) => (
              <line key={n.k} className="fc-line" x1={n.x} y1={n.y} x2={50} y2={50} stroke="var(--accent-deep)" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity=".7" />
            ))}
          </svg>
          {FC_NODES.map((n) => (
            <span key={n.k} className="mono absolute rounded-full border px-[9px] py-[4px] text-[8px]" style={{ left: `${n.x}%`, top: `${n.y}%`, translate: "-50% -50%", borderColor: "var(--line)", color: "var(--fg)", background: "var(--bg-2)" }}>
              {n.k}
            </span>
          ))}
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[8px] rounded-full px-[13px] py-[8px]" style={{ background: "var(--fg)", color: "var(--bg)" }}>
            <span className="signal-dot" />
            <span className="font-mono text-[10px] tracking-[.16em] uppercase">Arche</span>
          </div>
        </div>
      </div>

      <div className="wrap fc-text relative flex flex-col items-start gap-[clamp(28px,4vw,52px)]">
        <div className="flex w-full items-center gap-[16px]">
          <span className="mono" style={{ color: "var(--accent-ink)" }}>
            Next
          </span>
          <span className="h-px flex-1 origin-left" style={{ background: "var(--line)" }} data-r="line" />
        </div>
        <h2 className="d1 max-w-[11ch] md:max-w-[9ch]">
          Let's build what actually connects.
        </h2>
        <div className="flex flex-wrap items-center gap-[14px]">
          <Link to="/contact" className="btn" cursor="START" data-magnetic style={{ background: "var(--fg)", color: "var(--bg)" }}>
            Start a Project <span className="arw">→</span>
          </Link>
          <a href={`mailto:${c.email}`} className="mono lnk" style={{ color: "var(--muted)" }}>
            {c.email}
          </a>
        </div>
      </div>
    </section>
  );
}

