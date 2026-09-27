import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteContent, services } from "../data/site";
import { Link } from "../lib/router";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
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
    <section ref={sectionRef} className="on-ink w-full py-[clamp(76px,10vw,150px)]">
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
          <div className="flex flex-col md:col-span-7">
            {items.map((it, i) => (
              <button
                key={it.k}
                className="approach-principle grid gap-[12px] border-t py-[22px] text-left md:grid-cols-8 cursor-pointer transition-all duration-300 group"
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
          <div className="hidden md:col-span-5 md:block">
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
    hubLabel: "99.99%",
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
            {/* Mobile companion diagram — same accumulating states, scroll-driven */}
            <div className="mb-[26px] flex justify-center md:hidden">
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
          color: alive ? "var(--accent-deep)" : "var(--faint)",
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

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
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
  }, []);

  return (
    <section ref={root} className="on-ink relative w-full overflow-hidden py-[clamp(90px,12vw,180px)]">
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
          <span className="mono" style={{ color: "var(--accent-deep)" }}>
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
