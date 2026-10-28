import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { Link } from "../lib/router";

/**
 * Module metadata matching Arche's four commercial services + CRM pipeline output.
 */
export type ModuleInfo = {
  id: string;
  num: string;
  k: string;
  category: string;
  role: string;
  desc: string;
  // Starting scattered positions (percentage of canvas width/height)
  startX: number;
  startY: number;
};

const MODULES: ModuleInfo[] = [
  {
    id: "video",
    num: "01",
    k: "Video",
    category: "Inbound",
    role: "Editorial video content",
    desc: "Raw material edited into content designed to capture attention.",
    startX: 0.12,
    startY: 0.37,
  },
  {
    id: "web",
    num: "02",
    k: "Website",
    category: "Interface",
    role: "Conversion architecture",
    desc: "Digital pages designed to help visitors take a clear next step.",
    startX: 0.32,
    startY: 0.72,
  },
  {
    id: "agent",
    num: "03",
    k: "AI Agent",
    category: "Intelligence",
    role: "Conversational assistant",
    desc: "A conversational interface can use approved information to answer questions and qualify inquiries.",
    startX: 0.52,
    startY: 0.20,
  },
  {
    id: "auto",
    num: "04",
    k: "Automation",
    category: "Workflow",
    role: "Autonomous logic & routing",
    desc: "Multi-step workflows can route data and connect tools according to agreed rules.",
    startX: 0.72,
    startY: 0.74,
  },
  {
    id: "crm",
    num: "05",
    k: "CRM",
    category: "Pipeline",
    role: "Single source of truth",
    desc: "Centralized pipeline tracking customer records, deal progression, and revenue history.",
    startX: 0.90,
    startY: 0.37,
  },
];

type CNode = { id: string; x: number; y: number };

/**
 * Natural end-to-end backbone pipeline:
 *  Video (Inbound) ↔ Website (Interface) ↔ AI Agent (Intelligence) ↔ Automation (Workflow) ↔ CRM (Pipeline)
 */
const COMPAT: [string, string][] = [
  ["video", "web"],
  ["web", "agent"],
  ["agent", "auto"],
  ["auto", "crm"],
];

const key = (a: string, b: string) => [a, b].sort().join("|");
const isCompat = (a: string, b: string) => COMPAT.some(([x, y]) => key(x, y) === key(a, b));

const getCompatibleTargetNames = (id: string): string => {
  const targets = COMPAT.filter(([a, b]) => a === id || b === id).map(([a, b]) => {
    const otherId = a === id ? b : a;
    return MODULES.find((m) => m.id === otherId)?.k ?? otherId;
  });
  return targets.join(" & ");
};

const getSettledPos = (id: string, isNarrow: boolean): { x: number; y: number } => {
  if (isNarrow) {
    // S-curve responsive layout for mobile screens
    switch (id) {
      case "video":
        return { x: 0.24, y: 0.20 };
      case "web":
        return { x: 0.76, y: 0.33 };
      case "agent":
        return { x: 0.50, y: 0.46 };
      case "auto":
        return { x: 0.24, y: 0.59 };
      case "crm":
        return { x: 0.76, y: 0.72 };
      default:
        return { x: 0.5, y: 0.5 };
    }
  }
  // Linear horizontal pipeline layout for desktop/tablet
  switch (id) {
    case "video":
      return { x: 0.10, y: 0.50 };
    case "web":
      return { x: 0.30, y: 0.50 };
    case "agent":
      return { x: 0.50, y: 0.50 };
    case "auto":
      return { x: 0.70, y: 0.50 };
    case "crm":
      return { x: 0.90, y: 0.50 };
    default:
      return { x: 0.5, y: 0.5 };
  }
};

export function ConnectedSystem() {
  const box = useRef<HTMLDivElement>(null);
  const payoffRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 360 });

  // Initial nodes placed in scattered positions
  const [nodes, setNodes] = useState<CNode[]>(() =>
    MODULES.map((m) => ({ id: m.id, x: m.startX, y: m.startY }))
  );

  // Starts with 1 connection established (Website ↔ AI Agent) to guide the visitor
  const [edges, setEdges] = useState<string[]>([key("web", "agent")]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [near, setNear] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const signal = useRef<SVGGElement>(null);

  const moved = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const prevDoneRef = useRef(false);

  // Measure canvas size reactively
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const updateSize = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the full draggable chip inside the canvas, even on a 320px screen.
  // Positions, lines, hit targets and packet animation all share this mapping.
  const px = (n: CNode) => {
    const side = Math.min(72, size.w * 0.27);
    return { x: Math.max(side, Math.min(size.w - side, n.x * size.w)), y: n.y * size.h };
  };
  const byId = (id: string): CNode => nodes.find((n) => n.id === id) ?? { id, x: 0.5, y: 0.5 };
  const moduleById = (id: string): ModuleInfo => MODULES.find((m) => m.id === id)!;

  const done = COMPAT.every(([a, b]) => edges.includes(key(a, b)));
  const isNarrow = size.w < 640;

  // Trigger payoff settle & lime pulse when fully connected
  useEffect(() => {
    if (done) {
      const isFirstTrigger = !prevDoneRef.current;
      prevDoneRef.current = true;

      // Animate nodes to settled unified system layout
      setNodes((ns) =>
        ns.map((n) => {
          const settled = getSettledPos(n.id, isNarrow);
          return { ...n, x: settled.x, y: settled.y };
        })
      );

      if (isFirstTrigger) {
        setIsPulsing(true);
        const timer = window.setTimeout(() => setIsPulsing(false), 1600);
        return () => window.clearTimeout(timer);
      }
    } else {
      prevDoneRef.current = false;
      setIsPulsing(false);
    }
  }, [done, isNarrow]);

  // A single packet travels the completed example once. Updating the SVG
  // directly avoids re-rendering the whole interactive canvas every frame.
  useEffect(() => {
    const dot = signal.current;
    if (!done || !dot) return;
    const points = ["video", "web", "agent", "auto", "crm"].map((id) => px(byId(id)));
    const place = (position: number) => {
      const index = Math.min(points.length - 2, Math.floor(position));
      const t = Math.min(1, position - index);
      const a = points[index], b = points[index + 1];
      dot.setAttribute("transform", `translate(${a.x + (b.x - a.x) * t} ${a.y + (b.y - a.y) * t})`);
    };
    if (prefersReducedMotion()) { place(points.length - 1); return; }
    const state = { t: 0 };
    const tween = gsap.to(state, { t: points.length - 1, duration: 3.2, ease: "none", onUpdate: () => place(state.t) });
    return () => { tween.kill(); };
  }, [done, size.w, size.h, nodes]);

  useEffect(() => () => { if (longPressTimer.current) window.clearTimeout(longPressTimer.current); }, []);

  const tryConnect = (a: string, b: string) => {
    if (a === b || !isCompat(a, b)) return false;
    const k = key(a, b);
    if (edges.includes(k)) return false;
    setEdges((prev) => [...prev, k]);
    return true;
  };

  const handleConnectAll = () => {
    const allEdges = COMPAT.map(([a, b]) => key(a, b));
    setEdges(allEdges);
    setPicked(null);
    setNear(null);
  };

  const handleReset = () => {
    setEdges([key("web", "agent")]);
    setNodes(MODULES.map((m) => ({ id: m.id, x: m.startX, y: m.startY })));
    setPicked(null);
    setNear(null);
    setHoveredId(null);
    setInspectedId(null);
    setIsPulsing(false);
  };

  // Pointer drag events
  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragId(id);
    setInspectedId(id);
    moved.current = false;

    // Long press support for touch devices to inspect node
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      if (!moved.current) {
        setInspectedId(id);
      }
    }, 280);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId || !box.current) return;
    moved.current = true;
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const b = box.current.getBoundingClientRect();
    const x = Math.max(0.08, Math.min(0.92, (e.clientX - b.left) / b.width));
    const y = Math.max(0.12, Math.min(0.88, (e.clientY - b.top) / b.height));

    setNodes((ns) => ns.map((n) => (n.id === dragId ? { ...n, x, y } : n)));

    const me = px({ id: dragId, x, y });
    const threshold = isNarrow ? 110 : 150;
    const cand = nodes.find(
      (n) =>
        n.id !== dragId &&
        isCompat(n.id, dragId) &&
        !edges.includes(key(n.id, dragId)) &&
        Math.hypot(px(n).x - me.x, px(n).y - me.y) < threshold
    );
    setNear(cand ? cand.id : null);
  };

  const onPointerUp = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!dragId) return;

    if (near) {
      tryConnect(dragId, near);
    } else if (!moved.current) {
      // Tap-to-connect fallback for touch / accessibility
      if (picked && picked !== dragId) {
        const linked = tryConnect(picked, dragId);
        if (linked) {
          setPicked(null);
        } else {
          setPicked(dragId);
        }
      } else {
        setPicked(dragId === picked ? null : dragId);
      }
    }
    setDragId(null);
    setNear(null);
  };

  const activeInspectionId = hoveredId || inspectedId || dragId || picked;
  const activeModule = activeInspectionId ? moduleById(activeInspectionId) : null;

  return (
    <section id="connected-system" className="w-full py-[clamp(70px,9vw,140px)] border-t" style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}>
      <div className="wrap">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-[20px] mb-[clamp(24px,3.5vw,40px)]">
          <div className="max-w-[640px]">
            <p className="mono mono-a mb-[12px]">Entry points</p>
            <h2 className="d2 max-w-[14ch]" data-r="mask">
              You don’t need everything at once.
            </h2>
            <p className="body mt-[16px] max-w-[48ch]" data-r="meta">
              Start where the friction is. Drag or select compatible modules to explore how individual capabilities could connect. This is a conceptual model, not a live integration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-[12px] md:self-end">
            {/* Status Counter */}
            <div
              className="flex items-center gap-[8px] rounded-full border px-[14px] py-[7px] transition-all duration-300"
              style={{
                borderColor: done ? "var(--accent-deep)" : "var(--line)",
                background: done ? "rgba(127, 174, 0, 0.08)" : "var(--bg)",
              }}
            >
              <span
                className={`block h-[7px] w-[7px] rounded-full transition-colors duration-300 ${
                  done ? "bg-[var(--accent-deep)] ring-4 ring-[rgba(200,241,79,0.4)]" : "bg-[var(--muted)]"
                }`}
              />
              <span className="mono text-[11px]" style={{ color: done ? "var(--fg)" : "var(--muted)" }}>
                {done ? "Example system connected" : `${edges.length} / ${COMPAT.length} connections`}
              </span>
            </div>

            {/* Quick Actions */}
            {!done ? (
              <button
                type="button"
                className="mono lnk text-[11px]"
                onClick={handleConnectAll}
                data-cursor="RUN"
                title="Automatically link all modules"
              >
                Connect all
              </button>
            ) : null}

            <button
              type="button"
              className="mono lnk text-[11px]"
              onClick={handleReset}
              data-cursor="CLICK"
            >
              {done ? "Rearrange" : "Reset"}
            </button>
          </div>
        </div>

        {/* Interactive Canvas */}
        <div
          ref={box}
          className={`relative h-[clamp(320px,36vw,400px)] w-full overflow-hidden rounded-[8px] border select-none transition-all duration-500 ${
            isPulsing ? "ring-2 ring-[var(--accent)] shadow-[0_0_30px_rgba(200,241,79,0.35)]" : ""
          }`}
          style={{
            borderColor: done ? "var(--accent-deep)" : "var(--line)",
            background: "var(--bg)",
            touchAction: "pan-y",
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={(e) => {
            // Click outside chips to clear selection
            if ((e.target as HTMLElement).tagName === "DIV") {
              setPicked(null);
              setInspectedId(null);
            }
          }}
        >
          {/* Subtle Canvas Dot Grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Top Canvas Instruction / Mode Badge */}
          <div className="pointer-events-none absolute top-[14px] left-[16px] z-10 flex items-center gap-[8px]">
            <span
              className="block h-[5px] w-[5px] rounded-full"
              style={{ background: done ? "var(--accent-deep)" : "var(--muted)" }}
            />
            <span className="mono text-[10px] tracking-wide uppercase opacity-75" style={{ color: "var(--fg)" }}>
              {done
                ? "Example route · 5 modules connected"
                : picked
                ? `Selected ${moduleById(picked).k} · Tap matching module to link`
                : dragId
                ? near
                  ? `Release to connect with ${moduleById(near).k}`
                  : `Dragging ${moduleById(dragId).k}`
                : "Hover module to inspect · Drag near matching modules to link"}
            </span>
          </div>

          {/* SVG Connection Lines */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden>
            <defs>
              <filter id="lime-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Render established edges */}
            {edges.map((k) => {
              const [a, b] = k.split("|");
              const pa = px(byId(a));
              const pb = px(byId(b));
              return (
                <g key={k}>
                  {/* Subtle wider line for glow / pulse */}
                  {isPulsing && (
                    <line
                      x1={pa.x}
                      y1={pa.y}
                      x2={pb.x}
                      y2={pb.y}
                      stroke="var(--accent)"
                      strokeWidth="5"
                      opacity="0.8"
                      filter="url(#lime-glow)"
                    />
                  )}
                  <line
                    className="cs-edge"
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    pathLength={1}
                    strokeDasharray={done ? "none" : "1"}
                    stroke={done ? "var(--accent-deep)" : "var(--fg)"}
                    strokeWidth={isPulsing ? 3 : 1.75}
                    style={{
                      transition: "stroke .4s, stroke-width .4s",
                    }}
                  />
                  {/* Small flow indicator dot at midpoint */}
                  <circle
                    cx={(pa.x + pb.x) / 2}
                    cy={(pa.y + pb.y) / 2}
                    r={2.5}
                    fill={done ? "var(--accent-deep)" : "var(--muted)"}
                  />
                </g>
              );
            })}

            {/* Example packet: one trip after the model is connected. */}
            {done && <g ref={signal}><circle r="5" fill="var(--accent)" /><circle r="2" fill="var(--accent-ink)" /></g>}

            {/* Dynamic Proximity Snap Line when dragging */}
            {dragId && near && (() => {
              const pa = px(byId(dragId));
              const pb = px(byId(near));
              return (
                <g>
                  <line
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    stroke="var(--accent-deep)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <rect
                    x={(pa.x + pb.x) / 2 - 32}
                    y={(pa.y + pb.y) / 2 - 18}
                    width="64"
                    height="18"
                    rx="9"
                    fill="var(--solid)"
                  />
                  <text
                    x={(pa.x + pb.x) / 2}
                    y={(pa.y + pb.y) / 2 - 6}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="9"
                    letterSpacing="1"
                    fontWeight="600"
                    fill="var(--accent)"
                  >
                    CONNECT
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Module Nodes */}
          {nodes.map((n) => {
            const p = px(n);
            const tooltipWidth = Math.min(280, size.w - 24, window.innerWidth * 0.75);
            const tooltipCenter = Math.max(tooltipWidth / 2 + 12, Math.min(size.w - tooltipWidth / 2 - 12, p.x));
            const m = moduleById(n.id);
            const isLinked = edges.some((k) => k.split("|").includes(n.id));
            const isDragging = dragId === n.id;
            const isNearTarget = near === n.id;
            const isPicked = picked === n.id;
            const isHovered = hoveredId === n.id || inspectedId === n.id;
            const isHot = isDragging || isNearTarget || isPicked;

            // Connection targets for tooltip
            const targetNames = getCompatibleTargetNames(n.id);

            return (
              <div
                key={n.id}
                className="absolute"
                style={{
                  left: p.x,
                  top: p.y,
                  transform: "translate(-50%, -50%)",
                  transition: isDragging
                    ? "none"
                    : "left 0.75s var(--e-out), top 0.75s var(--e-out)",
                  zIndex: isDragging ? 30 : isHot ? 25 : isHovered ? 20 : 10,
                }}
              >
                {/* Floating Description Tooltip (visible on hover, focus, long-press, tap) */}
                {isHovered && !isDragging && (
                  <div
                    className="pointer-events-none absolute z-40 animate-fade-in"
                    style={{
                      left: `calc(50% + ${tooltipCenter - p.x}px)`,
                      top: p.y > size.h * 0.45 ? "-12px" : "calc(100% + 12px)",
                      transform: p.y > size.h * 0.45 ? "translate(-50%, -100%)" : "translate(-50%, 0)",
                      width: "max-content",
                      maxWidth: "min(280px, 75vw)",
                    }}
                  >
                    <div
                      className="rounded-[6px] border px-[12px] py-[8px] shadow-lg backdrop-blur-md"
                      style={{
                        background: "var(--card)",
                        borderColor: isLinked ? "var(--accent-deep)" : "var(--line)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.09)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-[10px] mb-[3px]">
                        <span className="mono text-[9px] uppercase font-bold" style={{ color: "var(--accent-ink)" }}>
                          {m.num} · {m.category}
                        </span>
                        <span className="mono text-[9px]" style={{ color: isLinked ? "var(--accent-ink)" : "var(--muted)" }}>
                          {isLinked ? "● Linked" : "○ Unlinked"}
                        </span>
                      </div>
                      <p className="mono text-[10.5px] leading-[1.35]" style={{ color: "var(--fg)" }}>
                        {m.desc}
                      </p>
                      {!isLinked && (
                        <p className="mono text-[9px] mt-[4px]" style={{ color: "var(--muted)" }}>
                          Connects to: {targetNames}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Node Chip Button */}
                <button
                  type="button"
                  className={`relative flex items-center gap-[8px] rounded-full border px-[12px] py-[7px] sm:px-[14px] sm:py-[8px] shadow-sm transition-all duration-300 ${
                    isPulsing ? "ring-4 ring-[rgba(200,241,79,0.6)]" : ""
                  }`}
                  style={{
                    transform: `scale(${isHot ? 1.08 : isHovered ? 1.04 : 1})`,
                    borderColor: isPulsing
                      ? "var(--accent-deep)"
                      : isHot
                      ? "var(--accent-deep)"
                      : isLinked
                      ? "var(--fg)"
                      : "var(--line)",
                    background: isPicked
                      ? "var(--accent)"
                      : isHot
                      ? "var(--bg-2)"
                      : "var(--card)",
                    color: isPicked ? "var(--solid)" : "var(--fg)",
                    cursor: isDragging ? "grabbing" : "grab",
                    touchAction: "none",
                  }}
                  onPointerDown={onPointerDown(n.id)}
                  onClick={(e) => {
                    // Enter / Space on a focused module produces a synthetic
                    // click with detail === 0. Real pointer clicks are already
                    // handled by onPointerDown / onPointerUp (drag + tap), so
                    // only handle the keyboard path here to avoid double-firing.
                    if (e.detail !== 0) return;
                    setInspectedId(n.id);
                    if (picked && picked !== n.id) {
                      const linked = tryConnect(picked, n.id);
                      setPicked(linked ? null : n.id);
                    } else {
                      setPicked(picked === n.id ? null : n.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredId(n.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(n.id)}
                  onBlur={() => {
                    setHoveredId(null);
                    setInspectedId(null);
                  }}
                  data-cursor={isDragging ? "GRAB" : "DRAG"}
                  aria-label={`${m.k} module — ${m.desc}`}
                  aria-pressed={isPicked}
                >
                  {/* Status indicator dot */}
                  <span
                    className={`block h-[7px] w-[7px] rounded-full transition-colors duration-300 ${
                      done ? "bg-[var(--accent-deep)]" : ""
                    }`}
                    style={{
                      background: isLinked
                        ? "var(--accent-deep)"
                        : "var(--faint)",
                    }}
                  />

                  {/* Module Label */}
                  <span className="mono mono-fg text-[11px] sm:text-[12px] font-medium tracking-tight">
                    {m.k}
                  </span>

                  {/* Category tag */}
                  <span
                    className="mono hidden xs:inline-block text-[9px] px-[5px] py-[1px] rounded border uppercase tracking-wider"
                    style={{
                      borderColor: isPicked ? "rgba(0,0,0,0.15)" : "var(--line)",
                      color: isPicked ? "var(--solid)" : "var(--muted)",
                      opacity: 0.8,
                    }}
                  >
                    {m.category}
                  </span>
                </button>
              </div>
            );
          })}

          {/* Bottom Live Inspection / System Feed Bar */}
          <div
            className="absolute right-0 bottom-0 left-0 border-t px-[16px] py-[10px] flex items-center justify-between gap-[12px] backdrop-blur-xs"
            style={{
              borderColor: "var(--line)",
              background: "rgba(244, 242, 237, 0.85)",
            }}
          >
            <div className="flex items-center gap-[8px] min-w-0">
              <span
                className="block h-[5px] w-[5px] rounded-full flex-shrink-0"
                style={{ background: activeModule ? "var(--accent-deep)" : "var(--muted)" }}
              />
              <p className="mono text-[10px] sm:text-[11px]" style={{ color: "var(--fg)" }}>
                {activeModule ? (
                  <>
                    <strong style={{ color: "var(--accent-ink)" }}>
                      {activeModule.num} {activeModule.k.toUpperCase()}:
                    </strong>{" "}
                    {activeModule.role}
                  </>
                ) : done ? (
                  "Example route. Select a module."
                ) : (
                  "Drag or tap two modules to link."
                )}
              </p>
            </div>

            <span className="mono hidden sm:inline-block text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>
              {done ? "● 4/4 Connected" : `${edges.length}/4 Links`}
            </span>
          </div>
        </div>

        {/* Completion Payoff Unit (Triggered when 4/4 connections are made) */}
        {done && (
          <div
            ref={payoffRef}
            className="mt-[24px] rounded-[8px] border p-[clamp(20px,3vw,36px)] animate-fade-in transition-all duration-700"
            style={{
              borderColor: "var(--accent-deep)",
              background: "var(--bg)",
              boxShadow: "0 14px 40px -10px rgba(127, 174, 0, 0.12)",
            }}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-[24px]">
              <div className="max-w-[700px]">
                <div className="flex items-center gap-[8px] mb-[12px]">
                  <span className="block h-[8px] w-[8px] rounded-full bg-[var(--accent-deep)] ring-4 ring-[rgba(200,241,79,0.35)] animate-pulse" />
                  <span className="mono mono-a uppercase tracking-wider text-[11px]" style={{ color: "var(--accent-ink)" }}>
                    System Architecture · Connected
                  </span>
                </div>

                <h3 className="d3 font-medium text-[clamp(22px,2.5vw,34px)]" data-r="mask">
                  That’s the shape of a connected system.
                </h3>

                <p className="body mt-[14px] text-[var(--muted)] leading-relaxed max-w-[62ch]">
                  In this example, video can lead people to a website, an agent can help qualify an inquiry, and automation can route it to a CRM. Actual behavior depends on the agreed scope and connected tools.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[12px] md:self-center flex-shrink-0">
                <button
                  type="button"
                  className="btn btn-ghost text-[12px] py-[10px] px-[18px]"
                  onClick={handleReset}
                  data-cursor="RESET"
                >
                  Rearrange modules
                </button>
                <Link
                  to="/contact"
                  className="btn btn-primary text-[12px] py-[10px] px-[20px]"
                  data-cursor="START"
                >
                  Start a Project <span className="arw">→</span>
                </Link>
              </div>
            </div>

            {/* Three System Flow Pillars */}
            <div
              className="mt-[28px] grid grid-cols-1 sm:grid-cols-3 gap-[16px] sm:gap-[20px] border-t pt-[22px]"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="rounded-[4px] p-[12px_14px]" style={{ background: "var(--bg-2)" }}>
                <span className="mono text-[10px] block font-semibold mb-[4px]" style={{ color: "var(--accent-ink)" }}>
                  01 · INBOUND FLOW
                </span>
                <p className="mono text-[11px] leading-snug" style={{ color: "var(--fg)" }}>
                  Editorial content can lead visitors toward a clear next step on the website.
                </p>
              </div>

              <div className="rounded-[4px] p-[12px_14px]" style={{ background: "var(--bg-2)" }}>
                <span className="mono text-[10px] block font-semibold mb-[4px]" style={{ color: "var(--accent-ink)" }}>
                  02 · QUALIFICATION
                </span>
                <p className="mono text-[11px] leading-snug" style={{ color: "var(--fg)" }}>
                  An agent can answer questions and collect context for a human handoff.
                </p>
              </div>

              <div className="rounded-[4px] p-[12px_14px]" style={{ background: "var(--bg-2)" }}>
                <span className="mono text-[10px] block font-semibold mb-[4px]" style={{ color: "var(--accent-ink)" }}>
                  03 · AUTONOMOUS SYNC
                </span>
                <p className="mono text-[11px] leading-snug" style={{ color: "var(--fg)" }}>
                  A configured workflow can prepare tasks, update records, and notify the team.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
