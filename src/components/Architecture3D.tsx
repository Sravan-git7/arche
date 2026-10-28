import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";

const STAGES = [
  { number: "01", title: "INPUT", eyebrow: "A SIGNAL ENTERS", headline: "It starts with a question.", text: "A website inquiry arrives with a name, a need and a little context. Nothing has to be copied yet.", data: "NEW INQUIRY / WEBSITE" },
  { number: "02", title: "INTELLIGENCE", eyebrow: "CONTEXT, NOT GUESSWORK", headline: "Make sense of the signal.", text: "The request is classified and relevant details are extracted. When a decision is uncertain, a person can take over.", data: "INTENT / PROJECT INQUIRY" },
  { number: "03", title: "SYSTEM", eyebrow: "ONE SHARED CONTEXT", headline: "Connect the right pieces.", text: "The same structured information can travel between the website, inbox, spreadsheet and CRM—without becoming four versions of the truth.", data: "ROUTE / TOOLS CONNECTED" },
  { number: "04", title: "ACTION", eyebrow: "A USEFUL HANDOFF", headline: "Turn understanding into action.", text: "The workflow can assign an owner, prepare a response and create a follow-up, with the original context attached.", data: "ACTION / ASSIGN + FOLLOW UP" },
  { number: "05", title: "OUTPUT", eyebrow: "READY FOR WHAT'S NEXT", headline: "A connection becomes momentum.", text: "The result is not another disconnected tool. It is a qualified inquiry, ready for a person to move forward.", data: "OUTPUT / QUALIFIED INQUIRY" },
] as const;

const POINTS = [
  { x: 120, y: 304 }, { x: 340, y: 202 }, { x: 560, y: 265 }, { x: 785, y: 157 }, { x: 1050, y: 210 },
];

/** A layered SVG architecture rather than a free-roaming 3D scene. Scroll
 * advances one example through the same five inspectable nodes; mobile and
 * reduced motion retain the exact controls and story without a pin. */
export function Architecture3D() {
  const section = useRef<HTMLElement>(null);
  const packet = useRef<SVGCircleElement>(null);
  const arrivalRoute = useRef<SVGPathElement>(null);
  const field = useRef<SVGGElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReduced), []);

  const select = (index: number) => {
    activeRef.current = index;
    setActive(index);
    const p = POINTS[index];
    packet.current?.setAttribute("cx", String(p.x));
    packet.current?.setAttribute("cy", String(p.y));
  };

  useLayoutEffect(() => {
    const root = section.current;
    if (!root || reduced) return;
    const guide = arrivalRoute.current;
    // Continue the same signal from the service rail into the first model
    // node. It is scroll-led, reversible and never takes control of scroll.
    const drawArrival = (progress: number) => {
      if (guide) guide.style.strokeDashoffset = String(1 - progress);
      if (activeRef.current === 0) {
        packet.current?.setAttribute("cx", String(POINTS[0].x * progress));
        packet.current?.setAttribute("cy", String(POINTS[0].y));
      }
    };
    const arrival = ScrollTrigger.create({
      trigger: root, start: "top bottom", end: "top top",
      onRefresh: (self) => drawArrival(self.progress),
      onUpdate: (self) => drawArrival(self.progress),
    });
    // The field shifts a few pixels beneath the fixed nodes, giving the
    // existing drawing depth without moving its interactive targets.
    const ctx = gsap.context(() => {
      if (field.current) gsap.fromTo(field.current, { x: -12, y: 10, opacity: .55 }, {
        x: 0, y: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "top 20%", scrub: .3 },
      });
    }, root);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (min-height: 760px)", () => {
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "+=160%",
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const scaled = Math.min(4.9999, self.progress * 5);
          const next = Math.min(4, Math.floor(scaled));
          if (next !== activeRef.current) { activeRef.current = next; setActive(next); }
          const from = POINTS[Math.max(0, next - 1)];
          const to = POINTS[next];
          const t = next === 0 ? 0 : Math.min(1, scaled - next);
          packet.current?.setAttribute("cx", String(from.x + (to.x - from.x) * t));
          packet.current?.setAttribute("cy", String(from.y + (to.y - from.y) * t));
        },
      });
      return () => trigger.kill();
    });
    return () => {
      arrival.kill();
      ctx.revert();
      mm.revert();
      guide?.style.removeProperty("stroke-dashoffset");
      const point = POINTS[activeRef.current];
      packet.current?.setAttribute("cx", String(point.x));
      packet.current?.setAttribute("cy", String(point.y));
    };
  }, [reduced]);

  const stage = STAGES[active];
  return (
    <section id="system-architecture" ref={section} className="archetype-section">
      <div className="wrap archetype-wrap">
        <div className="archetype-heading">
          <div><p className="mono mono-a">03 / ARCHETYPE &nbsp;—&nbsp; THE SYSTEM MODEL</p><h2 className="d2">A signal becomes<br />a system.</h2></div>
          <p className="body">One inquiry, five connected states. Follow the route or select a node to see what happens at each handoff.</p>
        </div>
        <div className="archetype-canvas">
          <div className="archetype-canvas-meta"><span>EXAMPLE ROUTE / NOT LIVE</span><span>INPUT → OUTPUT</span></div>
          <div className="archetype-map">
            <svg viewBox="0 0 1200 420" preserveAspectRatio="none" aria-hidden="true">
              <defs><pattern id="archetype-grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="rgba(244,242,237,.07)" strokeWidth="1" /></pattern></defs>
              <g ref={field}>
                <rect width="1200" height="420" fill="url(#archetype-grid)" />
                <path d="M0 355 L425 92 L1200 258 M0 420 L425 157 L1200 323 M235 420 L660 157 M510 420 L935 157" fill="none" stroke="rgba(244,242,237,.10)" strokeWidth="1" />
              </g>
              <path ref={arrivalRoute} data-archetype-arrival d={`M0 ${POINTS[0].y} H${POINTS[0].x}`} fill="none" stroke="var(--accent)" strokeWidth="2" pathLength="1" strokeDasharray="1" />
              {POINTS.slice(1).map((point, i) => <g key={i}>
                <line x1={POINTS[i].x} y1={POINTS[i].y} x2={point.x} y2={point.y} stroke="rgba(244,242,237,.20)" strokeWidth="1.5" strokeDasharray="5 6" />
                <line x1={POINTS[i].x} y1={POINTS[i].y} x2={point.x} y2={point.y} pathLength="1" stroke="var(--accent)" strokeWidth="2" strokeDasharray="1" strokeDashoffset={active > i ? 0 : 1} style={{ transition: "stroke-dashoffset .7s var(--e-out)" }} />
              </g>)}
              <circle ref={packet} data-archetype-packet cx={POINTS[0].x} cy={POINTS[0].y} r="5" fill="var(--accent)" />
            </svg>
            {STAGES.map((item, i) => <button
              key={item.title} type="button" className="archetype-node" data-active={active === i} data-passed={active > i}
              style={{ left: `${POINTS[i].x / 12}%`, top: `${POINTS[i].y / 4.2}%` }}
              onClick={() => select(i)} aria-pressed={active === i} aria-label={`${item.number} ${item.title}: ${item.eyebrow}`}
            ><span className="archetype-node-ring"><i /><b>{item.number}</b></span><span className="archetype-node-label">{item.title}</span></button>)}
          </div>
          <div className="archetype-detail" aria-live="polite">
            <div className="archetype-detail-index"><span>{stage.number} / 05</span><strong>{stage.title}</strong></div>
            <div className="archetype-detail-copy"><span>{stage.eyebrow}</span><h3>{stage.headline}</h3><p>{stage.text}</p></div>
            <div className="archetype-detail-data"><span>● &nbsp; {stage.data}</span><small>SELECT A NODE TO INSPECT</small></div>
          </div>
        </div>
        <div className="archetype-bottom"><span>INPUT / INTELLIGENCE / SYSTEM / ACTION / OUTPUT</span><span>SCROLL TO FOLLOW &nbsp; ↓</span></div>
      </div>
    </section>
  );
}
