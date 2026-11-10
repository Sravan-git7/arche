import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { siteContent } from "../data/site";
import { getLenis } from "../lib/useLenis";
import { easing } from "../motion/tokens";
import "./HowWeWork.css";

// Existing Approach copy, preserved verbatim. The overlays add no copy or claims.
const principles = [
  { k: "Systems thinking", v: "We design the connections between tools, content and people — not isolated deliverables." },
  { k: "AI where it earns its place", v: "Automation and agents only where they remove real work. No AI for the brochure." },
  { k: "Design + engineering", v: "Interface, motion and implementation are one language, not three handoffs." },
  { k: "Built to keep running", v: "Every engagement ends with something you can operate, measure and improve." },
];

/** A single persistent diagram, not two scenes connected by a flying clone.
 * Native sticky positioning on both breakpoints; no ScrollTrigger pins.
 * Each readable card is also a keyboard/touch destination, not a hover control.
 */
export function HowWeWork() {
  const root = useRef<HTMLElement>(null);
  const [beat, setBeat] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [paper, setPaper] = useState(false);
  const p = siteContent.process;

  const positions = useRef<number[]>([]);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ reduce: "(prefers-reduced-motion: reduce)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
      const el = root.current!;
      const reduce = !!context.conditions?.reduce;
      setReduced(reduce);
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-hww-beat]"));
      const select = gsap.utils.selector(el);
      // Read the established palette, never manufacture a second dark theme.
      const probe = document.createElement("div");
      probe.className = "on-ink";
      probe.hidden = true;
      el.appendChild(probe);
      const keys = ["--bg", "--bg-2", "--fg", "--muted", "--faint", "--line", "--card", "--accent-deep", "--accent-ink"];
      const palette = (node: Element) => Object.fromEntries(keys.map(k => [k, getComputedStyle(node).getPropertyValue(k).trim()]));
      const light = palette(document.documentElement);
      const dark = palette(probe);
      probe.remove();
      const surfaces = (colors: Record<string, string>) => Object.fromEntries(
        ["--bg", "--bg-2", "--card", "--line", "--accent-deep"].map(key => [key, colors[key]])
      );
      const readable = (colors: Record<string, string>) => Object.fromEntries(
        ["--fg", "--muted", "--faint", "--accent-ink"].map(key => [key, colors["--fg"]])
      );

      // One paused timeline is sampled by the existing ScrollTrigger conductor.
      // No timers, delayed transitions or one-shot remounts can drift on reversal.
      const tl = gsap.timeline({ paused: true, defaults: { ease: easing.scrub, autoRound: false } });
      tl.set(el, light, 0)
        .fromTo(select(".hww-spoke"), { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: .55, duration: .8, stagger: .06 }, .02)
        .fromTo(select(".hww-node"), { scale: 0, opacity: 0, transformOrigin: "center", transformBox: "fill-box" }, { scale: 1, opacity: 1, duration: .7, stagger: .075 }, 1.05)
        .fromTo(select(".hww-perimeter"), { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: .8, duration: .9 }, 2.1)
        .fromTo(select(".hww-energy"), { opacity: 0 }, { opacity: 1, duration: .6 }, 2.4)
        // Launch: the hub releases a wave; ink arrives as the horizon opens.
        .fromTo(select(".hww-release"), { attr: { r: 10 }, opacity: 0 }, { attr: { r: 32 }, opacity: .85, duration: .35 }, 3.05)
        .to(select(".hww-release"), { attr: { r: 46 }, opacity: 0, duration: .6 }, 3.4)
        // Do not interpolate foreground and background through the same gray.
        // Hold full-contrast type, then switch ink at the surface crossover.
        .set(el, readable(light), 3.25)
        .to(el, { ...surfaces(dark), duration: .75 }, 3.25)
        .set(el, readable(dark), 3.66)
        .set(el, dark, 4)
        .fromTo(select(".hww-horizon"), { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: .55, duration: .85 }, 3.15)
        .fromTo(select(".hww-operating"), { opacity: 0 }, { opacity: .7, duration: 1 }, 4);
      for (let i = 0; i < 4; i++) {
        tl.fromTo(select(`.hww-layer-${i}`), { opacity: 0, strokeDashoffset: 1 }, { opacity: 1, strokeDashoffset: 0, duration: .8 }, 5.2 + i);
        if (i < 3) tl.to(select(`.hww-layer-${i}`), { opacity: 0, duration: .25 }, 6 + i);
      }
      tl.set(el, readable(dark), 9)
        .to(el, { ...surfaces(light), duration: 1 }, 9)
        .set(el, readable(light), 9.45)
        .set(el, light, 10);

      const measure = () => {
        const styles = cards.map(card => card.style.position);
        cards.forEach(card => { card.style.position = "static"; });
        positions.current = cards.map(card => card.getBoundingClientRect().top + window.scrollY);
        cards.forEach((card, i) => { card.style.position = styles[i]; });
      };
      const update = () => {
        const y = window.scrollY;
        const points = positions.current;
        let current = 0;
        let time = 0;
        points.forEach((top, i) => {
          if (top <= y + innerHeight * .62) current = i;
          if (i > 0 && top <= y + innerHeight * .82) {
            time = Math.max(time, i - 1 + gsap.utils.clamp(0, 1, (y + innerHeight * .82 - top) / (innerHeight * .2)));
          }
        });
        const exit = el.querySelector(".hww-exit")!.getBoundingClientRect();
        const dissolve = gsap.utils.clamp(0, 1, (innerHeight * .75 - exit.top) / (innerHeight * .3));
        if (dissolve > 0) time = 9 + dissolve;
        tl.time(time);
        el.dataset.scrub = time.toFixed(4);
        setBeat(current);
        setPaper(dissolve > .99);
      };
      measure();
      if (reduce) {
        tl.time(8.999);
        setBeat(5);
        setPaper(false);
        setVisible(false);
        return;
      }
      ScrollTrigger.create({
        id: "how-we-work", trigger: el, start: "top bottom", end: "bottom top",
        onToggle: s => setVisible(s.isActive), onUpdate: update,
        onRefresh: () => { measure(); update(); }, invalidateOnRefresh: true,
      });
      update();
    }, root);
    return () => mm.revert();
  }, []);

  const jump = (i: number) => {
    const y = positions.current[i] - innerHeight * .5;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: "instant" });
    setBeat(i);
  };
  const ink = (reduced || beat >= 4) && !paper;
  const stage = reduced ? 5 : Math.min(5, beat);

  return (
    <section ref={root} className={`hww ${ink ? "on-ink" : ""}`} data-beat={beat} data-running={visible && !reduced} aria-label={p.label}>
      <div className="wrap hww-layout">
        <div className="hww-visual" aria-hidden="true">
          <div className="hww-diagram">
            <ChapterDiagram stage={stage} />
            <svg className="hww-overlay" viewBox="0 0 100 100" fill="none" data-principle={reduced ? 3 : beat >= 6 ? beat - 6 : -1} aria-hidden="true">
              {/* Systems: emphasize the shared perimeter, never replace the build. */}
              <g className="hww-layer hww-layer-0"><rect x="10" y="10" width="80" height="80" rx="12" /><path d="M15 15L85 85M85 15L15 85" /></g>
              {/* AI: a selective route, rather than every branch lighting up. */}
              <g className="hww-layer hww-layer-1"><path d="M15 15Q50 15 50 50T85 85" strokeWidth="1.5" /><circle cx="15" cy="15" r="5" /><circle cx="85" cy="85" r="5" /></g>
              {/* Design + engineering: two aligned layers around the same hub. */}
              <g className="hww-layer hww-layer-2"><rect x="30" y="30" width="40" height="40" rx="3" /><rect x="25" y="25" width="50" height="50" rx="5" strokeDasharray="2 3" /></g>
              {/* Operation: the existing running system gets a monitoring orbit. */}
              <g className="hww-layer hww-layer-3"><circle cx="50" cy="50" r="42" strokeDasharray="3 4" /><path d="M43 50l5 5 10-12" strokeWidth="1.5" /></g>
            </svg>
          </div>
        </div>
        <div className="hww-story">
          <section id="process" data-chapter="Process" aria-labelledby="hww-title">
            <header className="hww-heading">
              <p className="mono mono-a">{p.label}</p>
              <h2 id="hww-title" className="d2" data-r="mask">{p.statement}</h2>
            </header>
            <div className="hww-steps">
              {p.steps.map((step, i) => (
                <article className="hww-card" key={step.n} data-hww-beat={i} data-active={beat === i}>
                  <h3><button type="button" className="hww-select" onClick={() => jump(i)} aria-pressed={beat === i}>
                    <span className="mono">{step.n}</span><span className="d3">{step.k}</span>
                  </button></h3>
                  <p className="body">{step.v}</p>
                  {i === 3 && <div className="hww-connections mono">{["Website", "Agent", "Automation", "Existing tools"].map((label, n) => <span key={label}>{n > 0 && "→ "}{label}</span>)}</div>}
                </article>
              ))}
            </div>
          </section>
          <section id="approach" data-chapter="Approach" aria-labelledby="hww-principles">
            <header className="hww-heading">
              <p className="mono mono-a">Approach</p>
              <h2 id="hww-principles" className="d2" data-r="mask">Good systems don't add more work.</h2>
              <p className="d3" style={{ color: "var(--faint)" }}>They remove it.</p>
            </header>
            {principles.map((item, i) => (
              <article className="hww-card hww-principle" key={item.k} data-hww-beat={i + 6} data-active={beat === i + 6}>
                <h3><button type="button" className="hww-select" onClick={() => jump(i + 6)} aria-pressed={beat === i + 6}>
                  <span className="mono">0{i + 1}</span><span className="d4">{item.k}</span>
                </button></h3>
                <p className="body">{item.v}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
      <div className="hww-exit" aria-hidden="true" />
    </section>
  );
}


/** Same cumulative center / spokes / nodes / perimeter / horizon geometry as
 * ProcessVisual, owned locally so protected Sections and other callers stay intact.
 * Every layer stays mounted, making arbitrary scroll jumps deterministic.
 */
function ChapterDiagram({ stage }: { stage: number }) {
  const corners = [[15, 15], [85, 15], [15, 85], [85, 85]];
  const step = siteContent.process.steps[stage];
  return (
    <div data-pv-diagram data-state={stage} className="pv-root hww-system" aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none">
        <circle className="hww-horizon" cx="50" cy="50" r="40" pathLength="1" strokeDasharray="1" />
        <rect className="hww-perimeter" x="15" y="15" width="70" height="70" rx="9" pathLength="1" strokeDasharray="1" />
        {corners.map(([x, y], i) => <line className="hww-spoke" key={i} x1="50" y1="50" x2={x} y2={y} pathLength="1" strokeDasharray="1" />)}
        {corners.map(([x, y], i) => <g className="hww-node" key={i}><circle cx={x} cy={y} r="3.6" className="hww-node-base" /><circle cx={x} cy={y} r="3.6" className="hww-energy" /></g>)}
        <circle cx="50" cy="50" r="9.5" className="hww-hub" />
        <circle cx="50" cy="50" r="3.2" className="hww-node-base" />
        <circle cx="50" cy="50" r="3.2" className="hww-energy" />
        <circle cx="50" cy="50" r="10" className="hww-release" />
        <g className="hww-operating"><circle cx="50" cy="50" r="25" className="hww-breath" /></g>
      </svg>
      <p className="mono">{step.n} · {step.k.toUpperCase()}</p>
    </div>
  );
}
