import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteContent, services } from "../data/site";
import { Link } from "../lib/router";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { HeroEnvironment } from "./HeroEnvironment";
import { whenIntroDone } from "./Intro";
import { BusinessFriction } from "./BusinessFriction";

/* ================================================================
   HERO — quiet, precise, then alive. Statement lands word by word;
   the four service modules tick along the base line.
   ================================================================ */
const HERO_LINES = ["Systems that make", "businesses work", "better."];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const statement = useRef<HTMLHeadingElement>(null);
  const rest = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    let intro: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      const masks = statement.current!.querySelectorAll<HTMLElement>(".hl-mask");
      const lines = statement.current!.querySelectorAll<HTMLElement>(".hl-line");

      gsap.set(masks, { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(lines, { y: 14, filter: "blur(4px)" });
      gsap.set(rest.current!.children, { opacity: 0, y: 12 });

      intro = gsap
        .timeline({ paused: true })
        .to(masks, { clipPath: "inset(-14% 0% -22% 0%)", duration: 1.05, ease: "expo.out", stagger: 0.08 })
        .to(lines, { y: 0, filter: "blur(0px)", duration: 1.05, ease: "expo.out", stagger: 0.08 }, 0)
        .to(rest.current!.children, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.6);

      const layoutTop = (n: HTMLElement | null) => {
        let y = 0;
        while (n) {
          y += n.offsetTop;
          n = n.offsetParent as HTMLElement | null;
        }
        return y;
      };
      const LABEL_Y = 108;
      const heroH = () => root.current!.offsetHeight;
      const tyA = () => LABEL_Y + heroH() * 0.5 - layoutTop(statement.current);

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
        .to(statement.current, { scale: 0.2, y: tyA, opacity: 0.4, ease: "none", duration: 0.5 }, 0)
        .to(rest.current, { opacity: 0, ease: "none", duration: 0.28 }, 0)
        .to(".hero-strip", { opacity: 0, ease: "none", duration: 0.28 }, 0)
        .to(statement.current, { y: () => tyA() + heroH() * 0.26, ease: "none", duration: 0.26 })
        .to(statement.current, { y: () => tyA() + heroH() * 0.5, opacity: 0, ease: "none", duration: 0.24 });
    }, root);
    const cancel = whenIntroDone(() => intro?.play());
    return () => {
      cancel();
      ctx.revert();
    };
  }, []);

  const h = siteContent.hero;

  return (
    <section id="hero" ref={root} className="relative flex min-h-[92svh] w-full flex-col justify-end pt-[130px] pb-[26px]">
      <HeroEnvironment />
      {/* faint structural columns */}
      <div className="pointer-events-none absolute inset-0 hidden justify-between px-[var(--gut)] md:flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="h-full w-px" style={{ background: "var(--line)", opacity: 0.5 }} />
        ))}
      </div>

      <div className="wrap relative">
        <div className="mb-[22px] flex items-center gap-[14px]">
          <span className="mono mono-a">{h.kicker}</span>
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
          <span className="mono hidden sm:block">{siteContent.brand.line}</span>
        </div>

        <h1 ref={statement} className="d1 relative" aria-label={h.statement} style={{ transformOrigin: "0% 0%" }}>
          {HERO_LINES.map((ln) => (
            <span key={ln} className="hl-mask block md:whitespace-nowrap" aria-hidden>
              <span className="hl-line block">{ln}</span>
            </span>
          ))}
        </h1>

        <div ref={rest} className="mt-[36px] flex flex-col gap-[26px] border-t pt-[24px] md:flex-row md:items-end md:justify-between" style={{ borderColor: "var(--line)" }}>
          <p className="body max-w-[52ch]">{h.sub}</p>
          <div className="flex flex-none flex-wrap gap-[10px]">
            <Link to={h.ctaPrimary.to} className="btn" cursor="START">
              {h.ctaPrimary.label} <span className="arw">→</span>
            </Link>
            <Link to={h.ctaSecondary.to} className="btn btn-ghost" cursor="VIEW">
              {h.ctaSecondary.label}
            </Link>
          </div>
        </div>

        {/* service modules tick along the base */}
        <div className="hero-strip mt-[22px] grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
          {services.map((s) => (
            <Link key={s.slug} to={`/services/${s.slug}`} className="group flex items-center justify-between px-[16px] py-[13px]" style={{ background: "var(--bg)" }} cursor="OPEN">
              <span className="mono mono-fg">
                {s.n} — {s.title}
              </span>
              <span className="mono transition-transform duration-500 group-hover:translate-x-[4px]" style={{ color: "var(--accent-deep)" }}>
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
   WHAT WE DO — disconnection becomes connection, drawn on scroll.
   ================================================================ */
export function WhatWeDo() {
  const w = siteContent.whatWeDo;

  return (
    <section className="w-full py-[clamp(76px,10vw,160px)]">
      <div className="wrap grid items-center gap-[clamp(30px,4vw,70px)] md:grid-cols-2">
        <div className="flex flex-col gap-[22px]">
          <p className="mono mono-a">{w.label}</p>
          <h2 className="d2" data-r="mask">
            {w.lineA}
          </h2>
          <h2 className="d2" data-r="mask" style={{ color: "var(--faint)" }}>
            {w.lineB}
          </h2>
          <p className="body max-w-[48ch]" data-r="meta" data-r-delay="140">
            {w.body}
          </p>
        </div>

        <BusinessFriction />
      </div>
    </section>
  );
}

/** Thin bridge: problem → where do we start → services */
export function EntryBridge() {
  return (
    <section className="w-full pb-[clamp(28px,4vw,48px)]">
      <div className="wrap flex flex-col gap-[10px] border-t pt-[28px] md:flex-row md:items-end md:justify-between" style={{ borderColor: "var(--line)" }}>
        <h2 className="d3 max-w-[18ch]" data-r="mask">
          Start with the part that needs to move.
        </h2>
        <p className="body max-w-[36ch]" data-r="meta">
          One capability, built properly. The rest can connect when it's useful — not before.
        </p>
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
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section className="on-ink w-full py-[clamp(76px,10vw,150px)]">
      <div className="wrap">
        <div className="mb-[clamp(36px,4vw,64px)] flex items-center gap-[16px]">
          <span className="mono" style={{ color: "var(--accent-deep)" }}>
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
          <div className="flex flex-col md:col-span-8">
            {items.map((it, i) => (
              <button
                key={it.k}
                className="approach-principle grid gap-[12px] border-t py-[22px] text-left md:grid-cols-8"
                style={{ borderColor: active === i ? "var(--accent-deep)" : "var(--line)" }}
                data-r="meta"
                data-r-delay={i * 70}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                <span className="mono md:col-span-1" style={{ color: active === i ? "var(--accent-deep)" : "var(--faint)" }}>0{i + 1}</span>
                <h3 className="d4 md:col-span-3" style={{ color: active === i ? "var(--fg)" : "var(--muted)", transition: "color .35s" }}>{it.k}</h3>
                <p className="body max-w-[42ch] md:col-span-4">{it.v}</p>
              </button>
            ))}
          </div>
          <div className="hidden md:col-span-4 md:block">
            <div className="sticky top-[140px]">
              <ApproachVisual active={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Prompt 15 — Approach Visual Panel.
 * Subtle per-principle updates (small-scale movements, low-contrast opacity shifts).
 * 0: Systems thinking — disconnected dots draw connecting lines
 * 1: AI where it earns — manual task element fades out/disappears
 * 2: Design + engineering — two layers merge into alignment
 * 3: Built to keep running — slow continuous breathing pulse
 */
function ApproachVisual({ active }: { active: number }) {
  const breathRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (active !== 3 || !breathRef.current || prefersReducedMotion()) return;
    const tl = gsap.to(breathRef.current, {
      scale: 1.12,
      opacity: 0.7,
      duration: 1.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    return () => { tl.kill(); };
  }, [active]);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] border" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }} aria-hidden>
      {/* Principle 0: Systems thinking — dots with connecting lines */}
      {[0, 1, 2].map((i) => (
        <span
          key={`dot-${i}`}
          className="absolute block h-[8px] w-[8px] rounded-full transition-all duration-700"
          style={{
            left: `${22 + i * 28}%`,
            top: `${32 + (i % 2) * 30}%`,
            background: active === 0 ? "var(--accent-deep)" : "var(--faint)",
            opacity: active === 0 ? 1 : 0.3,
            transitionTimingFunction: "var(--e-out)",
          }}
        />
      ))}
      {/* Connecting lines — fade in only for principle 0 */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" fill="none">
        <line x1="22" y1="32" x2="50" y2="62" stroke="var(--accent-deep)" strokeWidth="0.6"
          style={{ opacity: active === 0 ? 0.8 : 0, transition: "opacity 0.8s var(--e-out)" }} />
        <line x1="50" y1="62" x2="78" y2="32" stroke="var(--accent-deep)" strokeWidth="0.6"
          style={{ opacity: active === 0 ? 0.8 : 0, transition: "opacity 0.8s var(--e-out)", transitionDelay: "0.15s" }} />
        <line x1="22" y1="32" x2="78" y2="32" stroke="var(--accent-deep)" strokeWidth="0.4"
          style={{ opacity: active === 0 ? 0.5 : 0, transition: "opacity 0.8s var(--e-out)", transitionDelay: "0.3s" }} />
      </svg>

      {/* Principle 1: AI replaces manual — manual task fades away */}
      <span
        className="absolute top-[24%] right-[18%] grid h-[48px] w-[48px] place-items-center rounded-full border transition-all duration-700"
        style={{
          borderColor: active === 1 ? "var(--accent-deep)" : "var(--line)",
          opacity: active === 1 ? 1 : 0.15,
          transitionTimingFunction: "var(--e-out)",
        }}
      >
        <span className="mono text-[9px]" style={{ color: active === 1 ? "var(--accent-deep)" : "var(--faint)" }}>AI</span>
      </span>
      {/* Manual task element — disappears when AI principle is active */}
      <span
        className="absolute top-[20%] right-[36%] flex h-[28px] w-[52px] items-center justify-center rounded-[3px] border transition-all duration-700"
        style={{
          borderColor: "var(--line)",
          opacity: active === 1 ? 0 : 0.25,
          transform: active === 1 ? "translateY(-6px) scale(0.9)" : "translateY(0) scale(1)",
          transitionTimingFunction: "var(--e-out)",
        }}
      >
        <span className="mono text-[7px]" style={{ color: "var(--faint)", textDecoration: active === 1 ? "line-through" : "none" }}>MANUAL</span>
      </span>

      {/* Principle 2: Design + engineering — two layers merge into alignment */}
      <div
        className="absolute right-[16%] bottom-[16%] h-[64px] w-[92px] rounded-[4px] border p-[8px] transition-all duration-700"
        style={{
          borderColor: active === 2 ? "var(--fg)" : "var(--line)",
          opacity: active === 2 ? 1 : 0.15,
          transform: active === 2 ? "translate(0, 0)" : "translate(4px, -2px)",
          transitionTimingFunction: "var(--e-out)",
        }}
      >
        <span className="block h-[4px] w-[65%] rounded-full transition-all duration-500" style={{ background: "var(--line)" }} />
        <span
          className="mt-[6px] block h-[14px] w-[44px] rounded-full transition-all duration-700"
          style={{
            background: active === 2 ? "var(--accent-deep)" : "var(--line)",
            transitionTimingFunction: "var(--e-out)",
          }}
        />
      </div>
      {/* Second overlapping layer — merges when active */}
      <div
        className="absolute right-[14%] bottom-[18%] h-[64px] w-[92px] rounded-[4px] border transition-all duration-700 pointer-events-none"
        style={{
          borderColor: active === 2 ? "var(--accent-deep)" : "transparent",
          opacity: active === 2 ? 0.5 : 0.1,
          transform: active === 2 ? "translate(0, 0)" : "translate(-6px, 4px)",
          transitionTimingFunction: "var(--e-out)",
        }}
      />

      {/* Principle 3: Built to keep running — continuous breathing pulse */}
      <span
        ref={breathRef}
        className="absolute bottom-[14%] left-[18%] block h-[38px] w-[38px] rounded-full border transition-all duration-700"
        style={{
          borderColor: active === 3 ? "var(--accent-deep)" : "var(--line)",
          opacity: active === 3 ? 1 : 0.15,
          transitionTimingFunction: "var(--e-out)",
        }}
      >
        {active === 3 && (
          <span
            className="absolute inset-[5px] rounded-full border-t"
            style={{
              borderColor: "var(--accent-deep)",
              animation: "spin 2.5s linear infinite",
            }}
          />
        )}
      </span>

      <span className="mono absolute right-[12px] bottom-[10px] transition-colors duration-500" style={{ color: "var(--accent-deep)" }}>0{active + 1}</span>
    </div>
  );
}

/* ================================================================
   PROCESS (Prompt 14) — Accumulating Diagram.
   The left-side diagram visibly builds as scroll progresses through steps.
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
            {p.steps.map((s, si) => (
              <div
                key={s.n}
                role="button"
                tabIndex={0}
                aria-pressed={activeStep === si}
                onClick={() => setActiveStep(si)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setActiveStep(si))}
                data-cursor="EXPLORE"
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
                  <h3 className="d4 flex-none md:w-[190px]" data-r="meta" style={s.k === "Connect" ? { color: "var(--accent-deep)" } : undefined}>
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
                            <span className="mono" style={{ padding: "4px 10px", border: "1px solid var(--accent-deep)", borderRadius: 999, color: "var(--accent-deep)" }}>
                              {lab}
                            </span>
                            {i < arr.length - 1 && <span className="mono" style={{ color: "var(--accent-deep)" }}>→</span>}
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
 * Prompt 14 — Process Accumulating Diagram.
 *
 * DISCOVER:  single dim central dot only.
 * DESIGN:    four corner connection lines fade in, still dim.
 * BUILD:     four outer dots appear, staggered.
 * CONNECT:   all dots + center pulse lime together, settle to lit state.
 * LAUNCH:    single bright pulse radiating outward from center.
 * EVOLVE:    slow continuous breathing pulse (never stops).
 *
 * Each state ADDS — never resets or removes.
 */
function ProcessVisual({ active }: { active: number }) {
  const breathRef = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);
  const stages = ["Observe", "Structure", "Assemble", "Connect", "Run", "Learn → Discover"];

  // EVOLVE breathing — continuous, never stops once reached
  useEffect(() => {
    if (active < 5 || !breathRef.current || prefersReducedMotion()) return;
    const tl = gsap.to(breathRef.current, {
      scale: 1.15,
      opacity: 0.55,
      duration: 2.0,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    return () => { tl.kill(); };
  }, [active]);

  // LAUNCH single bright pulse
  useEffect(() => {
    if (active < 4 || !pulseRef.current || prefersReducedMotion()) return;
    gsap.fromTo(pulseRef.current, { scale: 0.3, opacity: 1 }, {
      scale: 3.5,
      opacity: 0,
      duration: 1.0,
      ease: "power2.out",
    });
  }, [active]);

  // Connection line visibility (DESIGN+)
  const showLines = active >= 1;
  // Outer dots visibility (BUILD+)
  const showDots = active >= 2;
  // Connected state (CONNECT+)
  const connected = active >= 3;
  // Launch pulse (LAUNCH+)
  const launched = active >= 4;
  // Evolving (EVOLVE)
  const evolving = active >= 5;

  const cornerPositions = [
    ["14%", "14%"],
    ["86%", "14%"],
    ["14%", "86%"],
    ["86%", "86%"],
  ];

  return (
    <div className="relative aspect-square w-full max-w-[230px] overflow-hidden rounded-[6px]" style={{ background: "var(--bg-2)" }} aria-hidden>
      {/* Connection lines from corners to center (DESIGN+) */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" fill="none">
        {cornerPositions.map(([cx, cy], i) => (
          <line
            key={`line-${i}`}
            x1={parseFloat(cx)}
            y1={parseFloat(cy)}
            x2="50"
            y2="50"
            stroke={connected ? "var(--accent-deep)" : "var(--line)"}
            strokeWidth={connected ? 0.7 : 0.4}
            style={{
              opacity: showLines ? (connected ? 0.8 : 0.4) : 0,
              transition: "opacity 0.6s var(--e-out), stroke 0.5s, stroke-width 0.5s",
              transitionDelay: `${i * 80}ms`,
            }}
          />
        ))}
        {/* Cross connection lines (CONNECT+) */}
        {connected && (
          <>
            <line x1="14" y1="14" x2="86" y2="14" stroke="var(--accent-deep)" strokeWidth="0.35" style={{ opacity: 0.5 }} />
            <line x1="14" y1="86" x2="86" y2="86" stroke="var(--accent-deep)" strokeWidth="0.35" style={{ opacity: 0.5 }} />
            <line x1="14" y1="14" x2="14" y2="86" stroke="var(--accent-deep)" strokeWidth="0.35" style={{ opacity: 0.5 }} />
            <line x1="86" y1="14" x2="86" y2="86" stroke="var(--accent-deep)" strokeWidth="0.35" style={{ opacity: 0.5 }} />
          </>
        )}
      </svg>

      {/* Four corner outer dots (BUILD+, staggered) */}
      {cornerPositions.map(([cx, cy], i) => (
        <span
          key={`corner-${i}`}
          className="absolute block h-[10px] w-[10px] rounded-full border"
          style={{
            left: cx,
            top: cy,
            transform: `translate(-50%, -50%) scale(${showDots ? 1 : 0.2})`,
            background: connected ? "var(--accent-deep)" : "var(--bg)",
            borderColor: connected ? "var(--accent-deep)" : showDots ? "var(--fg)" : "var(--line)",
            opacity: showDots ? 1 : 0,
            transition: "all 0.55s var(--e-out)",
            transitionDelay: `${i * 120}ms`,
            boxShadow: connected ? "0 0 8px color-mix(in srgb, var(--accent-deep) 50%, transparent)" : "none",
          }}
        />
      ))}

      {/* Central dot (always visible — DISCOVER state) */}
      <span
        className="absolute top-1/2 left-1/2 grid h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
        style={{
          background: launched ? "var(--fg)" : connected ? "var(--fg)" : "var(--bg)",
          border: `1.5px solid ${connected ? "var(--accent-deep)" : "var(--line)"}`,
          transition: "all 0.5s var(--e-out)",
          boxShadow: launched ? "0 0 16px color-mix(in srgb, var(--accent-deep) 60%, transparent)" : "none",
        }}
      >
        <span
          className="block h-[7px] w-[7px] rounded-full"
          style={{
            background: connected ? "var(--accent)" : active > 0 ? "var(--fg)" : "var(--faint)",
            transition: "background 0.5s",
          }}
        />
      </span>

      {/* LAUNCH outward pulse ring */}
      <span
        ref={pulseRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block h-[24px] w-[24px] rounded-full border pointer-events-none"
        style={{
          borderColor: "var(--accent-deep)",
          opacity: 0,
        }}
      />

      {/* EVOLVE breathing ring */}
      {evolving && (
        <span
          ref={breathRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block h-[60px] w-[60px] rounded-full border pointer-events-none"
          style={{ borderColor: "var(--accent-deep)", opacity: 0.4 }}
        />
      )}

      {/* Stage label */}
      <p className="mono absolute right-[12px] bottom-[10px] transition-colors duration-500" style={{ color: active === 5 ? "var(--accent-deep)" : "var(--faint)" }}>
        {stages[active]}
      </p>
    </div>
  );
}

/* ================================================================
   FINAL CTA (Prompt 18) — Convergence Moment.
   Small recognizable echoes of earlier motifs drift in from edges
   toward center, merge into a single bright lime point,
   then that point expands into the resting line graphic.
   ================================================================ */
const FC_MOTIFS = [
  { k: "Connected", label: "STATUS", from: [-280, -180], icon: "status" },
  { k: "Service", label: "SVC", from: [260, -200], icon: "tab" },
  { k: "3D Node", label: "NODE", from: [300, 190], icon: "node" },
  { k: "Signal", label: "●", from: [-240, 210], icon: "signal" },
];

const FC_NODES = [
  { k: "Website", x: 16, y: 20, from: [-220, -140] },
  { k: "AI Agent", x: 84, y: 18, from: [200, -160] },
  { k: "Automation", x: 86, y: 80, from: [230, 150] },
  { k: "Content", x: 14, y: 82, from: [-210, 170] },
];

export function FinalCTA() {
  const c = siteContent.contact;
  const root = useRef<HTMLElement>(null);
  const convergeCenterRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const isMobile = !window.matchMedia("(min-width: 900px)").matches;
    const k = isMobile ? 0.4 : 1;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 85%", end: "center 55%", scrub: 0.8 },
      });

      // Phase 1: Motifs drift in from edges toward center (0 -> 0.5)
      tl.fromTo(
        ".fc-motif",
        {
          x: (i: number) => FC_MOTIFS[i].from[0] * k,
          y: (i: number) => FC_MOTIFS[i].from[1] * k,
          rotation: (i: number) => (i % 2 ? 12 : -12),
          opacity: 0.2,
          scale: 0.6,
        },
        { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, ease: "none", duration: 0.5 },
        0
      );

      // Phase 2: Motifs merge into center point + fade
      tl.to(".fc-motif", {
        x: 0, y: 0, scale: 0, opacity: 0, duration: 0.15, ease: "power2.in",
      }, 0.5);

      // Phase 3: Center point expands after merge
      if (convergeCenterRef.current) {
        tl.fromTo(
          convergeCenterRef.current,
          { scale: 0.1, opacity: 0 },
          { scale: 1, opacity: 1, ease: "power2.out", duration: 0.15 },
          0.55
        );
      }

      // Phase 4: Existing convergence structure
      tl.fromTo(
        ".fc-node",
        { x: (i: number) => FC_NODES[i].from[0] * k * 0.3, y: (i: number) => FC_NODES[i].from[1] * k * 0.3, opacity: 0.3 },
        { x: 0, y: 0, opacity: 1, ease: "none", duration: 0.2 },
        0.65
      )
      .fromTo(".fc-line", { attr: { x2: (i: number) => FC_NODES[i].x, y2: (i: number) => FC_NODES[i].y } }, { attr: { x2: 50, y2: 50 }, ease: "none", duration: 0.15 }, 0.7)
      .fromTo(".fc-core", { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, ease: "none", duration: 0.1 }, 0.8);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="on-ink relative w-full overflow-hidden py-[clamp(90px,12vw,180px)]">
      {/* Convergence Motifs (Prompt 18 unique multi-object convergence) */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
        {FC_MOTIFS.map((m, i) => (
          <span
            key={m.k}
            className="fc-motif absolute inline-flex items-center gap-[6px] rounded-full border px-[10px] py-[5px]"
            style={{
              borderColor: m.icon === "signal" ? "var(--accent)" : "var(--line)",
              background: m.icon === "signal" ? "var(--accent-deep)" : "var(--bg-2)",
              color: m.icon === "signal" ? "#0c0c0d" : "var(--fg)",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translate(${FC_MOTIFS[i].from[0]}px, ${FC_MOTIFS[i].from[1]}px)`,
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
        {/* Converge center point */}
        <span
          ref={convergeCenterRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block h-[16px] w-[16px] rounded-full opacity-0"
          style={{
            background: "var(--accent)",
            boxShadow: "0 0 30px var(--accent), 0 0 60px color-mix(in srgb, var(--accent-deep) 60%, transparent)",
          }}
        />
      </div>

      <div className="pointer-events-none absolute top-[8%] right-[3%] bottom-[8%] hidden w-[42%] md:block" aria-hidden>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {FC_NODES.map((n) => (
            <line key={n.k} className="fc-line" x1={n.x} y1={n.y} x2={50} y2={50} stroke="var(--accent-deep)" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity=".7" />
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
      <div className="wrap relative flex flex-col items-start gap-[clamp(28px,4vw,52px)]">
        <div className="flex w-full items-center gap-[16px]">
          <span className="mono" style={{ color: "var(--accent-deep)" }}>
            Next
          </span>
          <span className="h-px flex-1 origin-left" style={{ background: "var(--line)" }} data-r="line" />
        </div>
        <h2 className="d1 max-w-[11ch] md:max-w-[9ch]" data-r="mask">
          Let's build what actually connects.
        </h2>
        <div className="flex flex-wrap items-center gap-[14px]">
          <Link to="/contact" className="btn" cursor="START" style={{ background: "var(--fg)", color: "var(--bg)" }}>
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
