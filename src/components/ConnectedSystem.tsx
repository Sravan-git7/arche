import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

/**
 * Two interactions that let the visitor feel the business model:
 *  1. Choose an entry point → a signal physically travels the path, node by node.
 *  2. Build it yourself → drag (or tap) modules together to connect the system.
 */
const ENTRIES = [
  { k: "Website", steps: ["Visitor", "Website", "Inquiry", "AI agent", "Qualified lead", "CRM"], result: "A visitor becomes a routed, qualified opportunity." },
  { k: "AI agent", steps: ["Question", "Agent", "Knowledge", "Tool", "Action"], result: "The conversation ends in a useful action." },
  { k: "Automation", steps: ["Trigger", "Decision", "Action", "System update"], result: "Routine work runs itself; exceptions reach a person." },
  { k: "Content", steps: ["Idea", "Create", "Publish", "Measure", "Learn"], result: "Content becomes a loop that improves every cycle." },
];

export function ConnectedSystem() {
  const [active, setActive] = useState(0);
  const [reached, setReached] = useState(-1);
  const [runs, setRuns] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const item = ENTRIES[active];

  useEffect(() => {
    const n = item.steps.length;
    if (prefersReducedMotion()) {
      setReached(n - 1);
      return;
    }
    setReached(-1);
    const dot = track.current?.querySelector<HTMLElement>(".cs-dot");
    const fill = track.current?.querySelector<HTMLElement>(".cs-fill");
    if (!dot || !fill) return;
    const tl = gsap.timeline({ delay: 0.15 });
    tl.set(dot, { left: "0%", opacity: 1 }).set(fill, { scaleX: 0 });
    item.steps.forEach((_, i) => {
      const pct = (i / (n - 1)) * 100;
      tl.to(dot, { left: `${pct}%`, duration: i === 0 ? 0.01 : 0.5, ease: "power2.inOut" }, i === 0 ? 0 : ">")
        .to(fill, { scaleX: pct / 100, duration: i === 0 ? 0.01 : 0.5, ease: "power2.inOut" }, "<")
        .call(() => setReached(i));
    });
    tl.to(dot, { scale: 1.8, opacity: 0, duration: 0.5 });
    return () => {
      tl.kill();
    };
  }, [active, runs, item.steps]);

  return (
    <section className="w-full py-[clamp(70px,9vw,140px)]" style={{ background: "var(--bg-2)" }}>
      <div className="wrap">
        <div className="grid gap-[24px] md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="mono mono-a mb-[12px]">Entry points</p>
            <h2 className="d2 max-w-[13ch]" data-r="mask">You don’t need everything at once.</h2>
            <p className="body mt-[18px] max-w-[44ch]" data-r="meta">
              Start where the friction is. Pick a way in and follow the signal.
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="flex flex-wrap items-center gap-[8px]">
              {ENTRIES.map((e, i) => (
                <button key={e.k} className="chip" data-on={active === i ? "1" : "0"} onClick={() => (active === i ? setRuns((r) => r + 1) : setActive(i))} data-cursor="RUN">
                  {e.k}
                </button>
              ))}
            </div>

            <div className="mt-[28px] rounded-[6px] border p-[clamp(16px,2vw,28px)]" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
              <div className="mb-[28px] flex items-center justify-between">
                <span className="mono mono-fg">{item.k} · example path</span>
                <button className="mono lnk" onClick={() => setRuns((r) => r + 1)}>Replay</button>
              </div>

              <div ref={track} className="relative mx-[6%]">
                <span className="absolute top-[18px] right-0 left-0 h-px" style={{ background: "var(--line)" }} />
                <span className="cs-fill absolute top-[18px] right-0 left-0 h-px origin-left" style={{ background: "var(--accent-deep)", transform: "scaleX(0)" }} />
                <span className="cs-dot signal-dot absolute top-[15px] z-[2] -ml-[3px]" style={{ opacity: 0 }} />
                <div className="relative flex justify-between">
                  {item.steps.map((s, i) => {
                    const on = reached >= i;
                    return (
                      <div key={`${active}-${s}`} className="flex w-0 flex-col items-center gap-[10px]">
                        <span
                          className="grid h-[36px] w-[36px] flex-none place-items-center rounded-full border"
                          style={{
                            borderColor: on ? "var(--accent-deep)" : "var(--line)",
                            background: "var(--bg)",
                            transform: on ? "scale(1)" : "scale(.82)",
                            transition: "all .4s var(--e-out)",
                          }}
                        >
                          <span className="block h-[6px] w-[6px] rounded-full" style={{ background: on ? "var(--accent-deep)" : "var(--faint)" }} />
                        </span>
                        <span className="mono w-[70px] text-center" style={{ color: on ? "var(--fg)" : "var(--faint)", fontSize: 9.5, transition: "color .3s" }}>
                          {s}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="body mt-[26px] border-t pt-[16px]" style={{ borderColor: "var(--line)", color: reached >= item.steps.length - 1 ? "var(--fg)" : "var(--faint)", transition: "color .4s" }}>
                {item.result}
              </p>
            </div>
          </div>
        </div>

        <SystemCanvas />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Build-it-yourself canvas                                             */
/* ------------------------------------------------------------------ */
type CNode = { id: string; k: string; x: number; y: number };
const START: CNode[] = [
  { id: "web", k: "Website", x: 0.16, y: 0.3 },
  { id: "agent", k: "AI Agent", x: 0.42, y: 0.66 },
  { id: "auto", k: "Automation", x: 0.66, y: 0.26 },
  { id: "crm", k: "CRM", x: 0.86, y: 0.7 },
];
const COMPAT: [string, string][] = [
  ["web", "agent"],
  ["agent", "auto"],
  ["auto", "crm"],
];
const key = (a: string, b: string) => [a, b].sort().join("|");
const isCompat = (a: string, b: string) => COMPAT.some(([x, y]) => key(x, y) === key(a, b));

function SystemCanvas() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 320 });
  const [nodes, setNodes] = useState(START);
  const [edges, setEdges] = useState<string[]>([key("web", "agent")]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [near, setNear] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const moved = useRef(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const px = (n: CNode) => ({ x: n.x * size.w, y: n.y * size.h });
  const byId = (id: string) => nodes.find((n) => n.id === id)!;

  const tryConnect = (a: string, b: string) => {
    if (a === b || !isCompat(a, b)) return false;
    const k = key(a, b);
    setEdges((e) => (e.includes(k) ? e : [...e, k]));
    return true;
  };

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragId(id);
    moved.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId || !box.current) return;
    moved.current = true;
    const b = box.current.getBoundingClientRect();
    const x = Math.max(0.07, Math.min(0.93, (e.clientX - b.left) / b.width));
    const y = Math.max(0.12, Math.min(0.88, (e.clientY - b.top) / b.height));
    setNodes((ns) => ns.map((n) => (n.id === dragId ? { ...n, x, y } : n)));
    const me = { x: x * size.w, y: y * size.h };
    const cand = nodes.find((n) => n.id !== dragId && isCompat(n.id, dragId) && !edges.includes(key(n.id, dragId)) && Math.hypot(px(n).x - me.x, px(n).y - me.y) < 150);
    setNear(cand ? cand.id : null);
  };

  const onPointerUp = () => {
    if (!dragId) return;
    if (near) tryConnect(dragId, near);
    else if (!moved.current) {
      // tap-to-connect (mobile + keyboard-free fallback)
      if (picked && picked !== dragId) {
        tryConnect(picked, dragId);
        setPicked(null);
      } else setPicked(dragId);
    }
    setDragId(null);
    setNear(null);
  };

  const done = COMPAT.every(([a, b]) => edges.includes(key(a, b)));

  return (
    <div className="mt-[clamp(40px,5vw,72px)]">
      <div className="mb-[14px] flex flex-wrap items-end justify-between gap-[12px]">
        <div>
          <p className="mono mono-a mb-[6px]">Build it yourself</p>
          <h3 className="d4">Drag modules together to connect them.</h3>
        </div>
        <div className="flex items-center gap-[14px]">
          <span className="mono" style={{ color: done ? "var(--accent-deep)" : "var(--faint)" }}>
            {done ? "● System connected" : `${edges.length} / ${COMPAT.length} connections`}
          </span>
          <button
            className="mono lnk"
            onClick={() => {
              setNodes(START);
              setEdges([key("web", "agent")]);
              setPicked(null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={box}
        className="relative h-[clamp(260px,30vw,340px)] w-full overflow-hidden rounded-[6px] border select-none"
        style={{ borderColor: "var(--line)", background: "var(--bg)", touchAction: "pan-y" }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden>
          {edges.map((k) => {
            const [a, b] = k.split("|");
            const pa = px(byId(a));
            const pb = px(byId(b));
            return <line key={k} className="cs-edge" x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} pathLength={1} strokeDasharray="1" stroke="var(--accent-deep)" strokeWidth="1.5" />;
          })}
          {dragId && near && (() => {
            const pa = px(byId(dragId));
            const pb = px(byId(near));
            return (
              <g>
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="var(--accent-deep)" strokeWidth="1" strokeDasharray="4 5" />
                <text x={(pa.x + pb.x) / 2} y={(pa.y + pb.y) / 2 - 8} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.5" fill="var(--accent-deep)">
                  CONNECT
                </text>
              </g>
            );
          })()}
        </svg>

        {nodes.map((n) => {
          const p = px(n);
          const linked = edges.some((k) => k.split("|").includes(n.id));
          const hot = dragId === n.id || near === n.id || picked === n.id;
          return (
            <button
              key={n.id}
              type="button"
              className="absolute flex items-center gap-[8px] rounded-full border px-[14px] py-[9px]"
              style={{
                left: p.x,
                top: p.y,
                transform: `translate(-50%, -50%) scale(${hot ? 1.06 : 1})`,
                borderColor: hot ? "var(--accent-deep)" : linked ? "var(--fg)" : "var(--line)",
                background: "var(--card)",
                cursor: dragId === n.id ? "grabbing" : "grab",
                touchAction: "none",
                transition: dragId === n.id ? "border-color .2s" : "transform .35s var(--e-out), border-color .3s, left .5s var(--e-out), top .5s var(--e-out)",
                zIndex: dragId === n.id ? 5 : 2,
              }}
              onPointerDown={onPointerDown(n.id)}
              data-cursor="DRAG"
              aria-label={`${n.k} module`}
            >
              <span className="block h-[7px] w-[7px] rounded-full" style={{ background: linked ? "var(--accent-deep)" : "var(--faint)" }} />
              <span className="mono mono-fg">{n.k}</span>
            </button>
          );
        })}
        {picked && <p className="mono absolute bottom-[10px] left-[14px]">Now tap a module to connect to {byId(picked).k}</p>}
      </div>
    </div>
  );
}
