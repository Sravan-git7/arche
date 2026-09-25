import { useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

/**
 * Interactive problem: four tools that don't talk to each other.
 * Hover / tap a tool to see where work stalls. Press CONNECT and the
 * visitor routes the system themselves: Website → Email → CRM → Sheet.
 */
type Node = { id: string; k: string; idle: string; meta: string; on: string; vx: number; vy: number };

// Coordinates in a 160 × 110 space (matches the 16:11 box, so no distortion).
const NODES: Node[] = [
  { id: "web", k: "Website", idle: "New inquiry", meta: "Waiting for next step", on: "Captured", vx: 32, vy: 30 },
  { id: "email", k: "Email", idle: "Unread · 12m", meta: "No routing", on: "Routed", vx: 124, vy: 26 },
  { id: "crm", k: "CRM", idle: "No owner", meta: "Manual assignment", on: "Assigned", vx: 122, vy: 82 },
  { id: "sheet", k: "Sheet", idle: "Row pending", meta: "Manual update", on: "Logged", vx: 38, vy: 86 },
];

const segLen = (a: Node, b: Node) => Math.hypot(b.vx - a.vx, b.vy - a.vy);
const LENGTHS = NODES.slice(1).map((n, i) => segLen(NODES[i], n));
const TOTAL = LENGTHS.reduce((s, l) => s + l, 0);
const PATH_D = NODES.map((n, i) => `${i ? "L" : "M"}${n.vx} ${n.vy}`).join(" ");

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function BusinessFriction() {
  const [hover, setHover] = useState<string | null>(null);
  const [lit, setLit] = useState(0);
  const [state, setState] = useState<"idle" | "running" | "connected">("idle");
  const path = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const connect = () => {
    if (state !== "idle") return;
    setHover(null);
    if (prefersReducedMotion()) {
      setLit(NODES.length);
      setState("connected");
      if (path.current) path.current.style.strokeDashoffset = "0";
      return;
    }
    setState("running");
    const t = gsap.timeline({ onComplete: () => setState("connected") });
    t.set(path.current, { strokeDashoffset: 1 })
      .set(dot.current, { attr: { cx: NODES[0].vx, cy: NODES[0].vy }, opacity: 1 })
      .call(() => setLit(1));
    let acc = 0;
    NODES.slice(1).forEach((n, i) => {
      acc += LENGTHS[i];
      const label = `seg${i}`;
      t.to(path.current, { strokeDashoffset: 1 - acc / TOTAL, duration: 0.6, ease: "power2.inOut" }, label)
        .to(dot.current, { attr: { cx: n.vx, cy: n.vy }, duration: 0.6, ease: "power2.inOut" }, label)
        .call(() => setLit(i + 2));
    });
    t.to(dot.current, { opacity: 0, duration: 0.3 });
    tl.current = t;
  };

  const reset = () => {
    tl.current?.kill();
    gsap.set(path.current, { strokeDashoffset: 1 });
    gsap.set(dot.current, { opacity: 0 });
    setLit(0);
    setState("idle");
  };

  const connected = state === "connected";
  const idx = hover ? NODES.findIndex((n) => n.id === hover) : -1;

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center justify-between">
        <span className="mono">{connected ? "4 tools · 3 connections" : "4 tools · 0 connections"}</span>
        <span className="flex items-center gap-[8px]">
          <span
            className="block h-[7px] w-[7px] rounded-full"
            style={{ background: connected ? "var(--accent-deep)" : "var(--faint)", transition: "background .4s" }}
          />
          <span className="mono" style={{ color: connected ? "var(--accent-deep)" : "var(--faint)" }}>
            {connected ? "Connected · system ready" : state === "running" ? "Connecting…" : "Disconnected"}
          </span>
        </span>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-[6px]"
        style={{ background: "var(--bg-2)", aspectRatio: "16 / 11" }}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox="0 0 160 110" className="absolute inset-0 h-full w-full" aria-hidden>
          {/* broken hand-offs: two stubs with a gap in the middle */}
          {NODES.slice(1).map((b, i) => {
            const a = NODES[i];
            const hot = idx === i || idx === i + 1;
            const s = (t: number) => ({ x: lerp(a.vx, b.vx, t), y: lerp(a.vy, b.vy, t) });
            const p1 = s(0.36), p2 = s(0.46), p3 = s(0.54), p4 = s(0.64), mid = s(0.5);
            return (
              <g key={i} style={{ opacity: lit > 0 ? 0 : 1, transition: "opacity .4s" }}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={hot ? "var(--fg)" : "var(--faint)"} strokeWidth=".35" strokeDasharray="1.2 1" />
                <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={hot ? "var(--fg)" : "var(--faint)"} strokeWidth=".35" strokeDasharray="1.2 1" />
                <text x={mid.x} y={mid.y + 1.2} textAnchor="middle" fontSize="3.2" fontFamily="var(--font-mono)" fill={hot ? "#d64530" : "var(--faint)"}>
                  ×
                </text>
              </g>
            );
          })}
          <path
            ref={path}
            d={PATH_D}
            pathLength={1}
            fill="none"
            stroke="var(--accent-deep)"
            strokeWidth=".45"
            strokeDasharray="1"
            style={{ strokeDashoffset: 1 }}
          />
          <circle ref={dot} r="1.6" cx={NODES[0].vx} cy={NODES[0].vy} fill="var(--accent-deep)" opacity="0" />
        </svg>

        {NODES.map((n, i) => {
          const on = lit > i;
          const hot = hover === n.id;
          return (
            <button
              key={n.id}
              type="button"
              className="absolute w-[34%] rounded-[5px] border p-[clamp(8px,1vw,12px)] text-left"
              style={{
                left: `${(n.vx / 160) * 100}%`,
                top: `${(n.vy / 110) * 100}%`,
                transform: `translate(-50%, -50%) scale(${hot ? 1.03 : 1})`,
                borderColor: on ? "var(--accent-deep)" : hot ? "var(--fg)" : "var(--line)",
                background: "var(--card)",
                transition: "transform .45s var(--e-out), border-color .4s",
                zIndex: hot ? 3 : 2,
              }}
              data-cursor={state === "idle" ? "INSPECT" : undefined}
              onMouseEnter={() => setHover(n.id)}
              onFocus={() => setHover(n.id)}
              onBlur={() => setHover(null)}
              onClick={() => setHover((h) => (h === n.id ? null : n.id))}
              aria-label={`${n.k}: ${on ? n.on : `${n.idle}, ${n.meta}`}`}
            >
              <span className="flex items-center justify-between">
                <span className="mono mono-fg">{n.k}</span>
                <span
                  className={`block h-[6px] w-[6px] rounded-full ${on ? "" : "animate-pulse"}`}
                  style={{ background: on ? "var(--accent-deep)" : "var(--faint)" }}
                />
              </span>
              <span className="mt-[8px] block text-[clamp(12px,1vw,14px)] tracking-[-.02em]" style={{ color: on ? "var(--accent-deep)" : "var(--fg)" }}>
                {on ? n.on : n.idle}
              </span>
              {!on && (
                <span
                  className="mono mt-[6px] block overflow-hidden"
                  style={{
                    maxHeight: hot ? 30 : 0,
                    opacity: hot ? 1 : 0,
                    transition: "max-height .45s var(--e-out), opacity .3s",
                    fontSize: 9,
                  }}
                >
                  → {n.meta}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        {state !== "connected" ? (
          <button className="btn" onClick={connect} disabled={state === "running"} data-cursor="CONNECT">
            Connect the system <span className="arw">→</span>
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={reset} data-cursor="RESET">
            Disconnect
          </button>
        )}
        <span className="body-s">{connected ? "One inquiry now moves through every tool on its own." : "Hover a tool to see where work stalls."}</span>
      </div>
    </div>
  );
}
