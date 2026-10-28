import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteContent, services } from "../data/site";
import { Link } from "../lib/router";
import { gsap, ScrollTrigger, onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";
import { HeroEnvironment } from "./HeroEnvironment";
import { whenIntroDone } from "./Intro";

/* ================================================================
   HERO — quiet, precise, then alive. Statement lands word by word;
   the four service modules tick along the base line.
   ================================================================ */
const HERO_LINES = ["Systems that make", "businesses work", "better."];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const statement = useRef<HTMLHeadingElement>(null);
  const rest = useRef<HTMLDivElement>(null);

  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReducedMotion), []);

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return;
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
  }, [reducedMotion]);

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
          <div className="max-w-[52ch]">
            <p className="mono mono-a mb-[10px]">What if everything worked together?</p>
            <p className="body">{h.sub}</p>
          </div>
          <div className="flex flex-none flex-wrap gap-[10px]">
            <Link to={h.ctaPrimary.to} className="btn" cursor="START" data-magnetic>
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
              <span className="mono transition-transform duration-500 group-hover:translate-x-[4px]" style={{ color: "var(--accent-ink)" }}>
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
  const manualUntil = useRef(0);
  const selectPrinciple = (index: number) => {
    manualUntil.current = performance.now() + 1200;
    setActive(index);
  };
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll-driven active principle detection
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReducedMotion), []);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const buttons = sectionRef.current?.querySelectorAll<HTMLElement>(".approach-principle") ?? [];
    const cleanups: (() => void)[] = [];
    buttons.forEach((btn, i) => {
      const st = ScrollTrigger.create({
        trigger: btn,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => { if (performance.now() >= manualUntil.current) setActive(i); },
        onEnterBack: () => { if (performance.now() >= manualUntil.current) setActive(i); },
      });
      cleanups.push(() => st.kill());
    });

    return () => cleanups.forEach((c) => c());
  }, [reducedMotion]);

  return (
    <section id="approach" ref={sectionRef} data-visible={visible} className="on-ink w-full py-[clamp(76px,10vw,150px)]">
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
                className="approach-principle grid min-w-0 gap-[12px] border-t py-[22px] text-left md:grid-cols-8 cursor-pointer transition-all duration-300 group"
                style={{
                  borderColor: active === i ? "var(--accent-deep)" : "var(--line)",
                  background: active === i ? "rgba(200, 241, 79, 0.03)" : "transparent",
                  paddingLeft: active === i ? "10px" : "0px",
                }}
                data-r="meta"
                data-r-delay={i * 70}
                aria-pressed={active === i}
                onMouseEnter={() => selectPrinciple(i)}
                onFocus={() => selectPrinciple(i)}
                onClick={() => selectPrinciple(i)}
              >
                <span className="mono md:col-span-1" style={{ color: active === i ? "var(--accent)" : "var(--faint)" }}>0{i + 1}</span>
                <h3 className="d4 flex items-center gap-[10px] md:col-span-3" style={{ color: active === i ? "var(--fg)" : "var(--muted)", transition: "color .35s" }}>
                  {i === 0 && (
                    /* the Process diagram, compressed — still running */
                    <span
                      className="pv-mini inline-block h-[24px] w-[24px] flex-none"
                      aria-hidden
                    >
                      <MiniBuiltDiagram />
                    </span>
                  )}
                  {it.k}
                </h3>
                <p className="body max-w-[42ch] md:col-span-4" style={{ color: active === i ? "var(--fg)" : "var(--faint)", transition: "color .35s" }}>{it.v}</p>
              </button>
            ))}

            {/* Mobile visual preview */}
            <div className="mt-[24px] block md:hidden">
              <ApproachVisual active={active} onSelect={selectPrinciple} />
            </div>
          </div>
          <div className="hidden min-w-0 md:col-span-5 md:block">
            <div className="sticky top-[140px]">
              <ApproachVisual active={active} onSelect={selectPrinciple} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The same connected route that closes Process, compressed into a mark. */
function MiniBuiltDiagram() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden>
      <path d="M8 66 L28 32 L50 53 L72 22 L92 42" stroke="var(--accent-deep)" strokeWidth="4" />
      {[[8, 66], [28, 32], [50, 53], [72, 22], [92, 42]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="var(--accent)" />)}
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
    { num: "02", name: "AI where it earns", sub: "MANUAL DETOUR → DIRECT AGENT ROUTE", status: "EXAMPLE · AGENT ROUTE" },
    { num: "03", name: "Design + engineering", sub: "DESIGN LAYER → ALIGNED WITH CODE", status: "INTERFACE + SYSTEM · ALIGNED" },
    { num: "04", name: "Built to keep running", sub: "BUILT SYSTEM → OPERABLE LOOP", status: "CONCEPTUAL OPERATIONAL STATE" },
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
                aria-pressed={isCur}
                aria-label={`Show ${t.name}`}
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
    hubLabel: "ON",
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
        <g className={on(3) ? "animate-spin" : undefined} style={{ transformOrigin: "100px 70px", animationDuration: "7s" }}>
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
            className="mono" fontSize={i === 3 ? 8.5 : 9} fontWeight={700} fill="var(--accent)"
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
  const manualUntil = useRef(0);
  const selectStep = (index: number) => {
    // Focus can scroll a step into view. Let that scroll settle without
    // allowing its ScrollTrigger callbacks to undo an explicit selection.
    manualUntil.current = performance.now() + 1200;
    setActiveStep(index);
  };

  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReducedMotion), []);

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return;
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
            onEnter: () => { if (performance.now() >= manualUntil.current) setActiveStep(i); },
            onEnterBack: () => { if (performance.now() >= manualUntil.current) setActiveStep(i); },
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

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
          <div className="pointer-events-none absolute top-0 bottom-0 left-[7px] w-px md:left-[calc(33.333%+7px)]">
            <span className="absolute inset-0" style={{ background: "var(--line)" }} />
            <span className="pr-fill absolute inset-0 origin-top" style={{ background: "var(--fg)" }} />
          </div>
          <div className="hidden md:col-span-4 md:block">
            <div className="sticky top-[130px] pr-[36px]">
              <ProcessVisual active={activeStep} />
            </div>
          </div>
          <div className="flex flex-col md:col-span-8">
            {/* Mobile companion diagram — same accumulating states, scroll-driven */}
            <div className="process-mobile-pin sticky top-[68px] z-[5] mb-[26px] flex justify-center pb-[8px] md:hidden" style={{ background: "var(--bg)" }}>
              <ProcessVisual active={activeStep} compact />
            </div>
            {p.steps.map((s, si) => (
              <button
                key={s.n}
                type="button"
                aria-pressed={activeStep === si}
                onFocus={() => selectStep(si)}
                onClick={() => selectStep(si)}
                data-cursor="JUMP"
                className="pr-step relative flex w-full cursor-pointer gap-[22px] rounded-[4px] py-[clamp(18px,2.2vw,32px)] pl-[34px] text-left md:pl-[42px]"
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
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The process diagram accumulates real conceptual structure: sources,
 * architecture, components, connections, operation and a feedback path. */
const PROCESS_STATES = [
  { title: "Find the friction", note: "People, tools and content are the starting inputs." },
  { title: "Draw the architecture", note: "Organise those inputs around a clear purpose." },
  { title: "Build the pieces", note: "Construct the interface, agent and workflow." },
  { title: "Connect the pieces", note: "Make the handoffs between components explicit." },
  { title: "Put it to work", note: "The connected system is ready to operate." },
  { title: "Learn and improve", note: "Feedback returns to the system for the next iteration." },
];

function ProcessVisual({ active, compact = false }: { active: number; compact?: boolean }) {
  const s = Math.max(0, Math.min(5, active));
  const stage = siteContent.process.steps[s];
  const detail = PROCESS_STATES[s];
  const sources = [{ label: "PEOPLE", y: 48 }, { label: "TOOLS", y: 110 }, { label: "CONTENT", y: 172 }];
  const outputs = [{ label: "WEB", y: 48 }, { label: "AGENT", y: 110 }, { label: "FLOW", y: 172 }];
  return (
    <div data-pv-diagram data-state={s} className={`process-model ${compact ? "process-model-compact" : ""}`} role="img" aria-label={`${stage.k}: ${detail.note}`}>
      <div className="process-model-head"><span>THE SYSTEM / {stage.n}</span><span>{stage.k.toUpperCase()}</span></div>
      <svg viewBox="0 0 320 220" fill="none" aria-hidden="true">
        <path className="process-model-frame" d="M8 8H312V212H8Z" stroke="currentColor" />
        {sources.map((item) => <g key={item.label}>
          <path pathLength="1" className="process-input-line" d={`M72 ${item.y} H100 L126 110`} stroke="currentColor" />
          <rect className="process-source" x="16" y={item.y - 13} width="56" height="26" rx="2" />
          <text x="44" y={item.y + 3} textAnchor="middle">{item.label}</text>
        </g>)}
        {outputs.map((item) => <g key={item.label}>
          <path pathLength="1" className="process-output-line" d={`M194 110 H220 L244 ${item.y}`} stroke="currentColor" />
          <rect className="process-output" x="244" y={item.y - 13} width="60" height="26" rx="2" />
          <text className="process-output-text" x="274" y={item.y + 3} textAnchor="middle">{item.label}</text>
        </g>)}
        <rect className="process-core" x="126" y="74" width="68" height="72" rx="3" />
        <circle className="process-core-dot" cx="160" cy="99" r="7" />
        <text className="process-core-text" x="160" y="123" textAnchor="middle">{s === 0 ? "?" : s >= 4 ? "READY" : "SYSTEM"}</text>
        <path className="process-feedback" d="M274 185 V202 H160 V146" stroke="currentColor" strokeDasharray="3 4" />
        <circle className="process-feedback-dot" cx="160" cy="202" r="3" />
      </svg>
      <div className="process-model-foot"><strong>{detail.title}</strong><p>{detail.note}</p></div>
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
