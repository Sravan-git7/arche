import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";

/**
 * PROMPT 12 / 30 — Arche Labs (Playable Experiments)
 *
 * PROMPT 30 updates — Deepen the payoff per sketch:
 *  1. Signal Router: Live traveling packet with trailing glow tail moving along the stage track.
 *  2. Attention Field: Multi-dot radial falloff so adjacent dots dim-brighten smoothly.
 *  3. Spatial 3D Cluster: Drag-to-rotate with physics momentum / inertia deceleration on release.
 *  4. State Machine: Visual transition line drawing from old active node to the new one on state step.
 *  5. Kinetic Scrubber: Real-time variable typography and speed-reactive kinetic wave.
 */

export function Labs() {
  return (
    <section className="w-full py-[clamp(64px,8vw,120px)] on-ink bg-[#0c0c0d] text-[#f4f2ed]">
      <div className="wrap">
        {/* Header */}
        <div className="mb-[clamp(32px,4vw,56px)] flex flex-wrap items-end justify-between gap-[20px] border-b pb-[20px]" style={{ borderColor: "var(--line)" }}>
          <div>
            <div className="flex items-center gap-[10px] mb-[8px]">
              <span className="mono mono-a">ARCHE LABS</span>
              <span className="mono">·</span>
              <span className="mono" style={{ color: "var(--accent)" }}>5 PLAYABLE SKETCHES</span>
            </div>
            <h2 className="d2 max-w-[18ch]" data-r="mask">
              Playable experiments & system prototypes.
            </h2>
          </div>
          <p className="body max-w-[42ch]" style={{ color: "rgba(244, 242, 237, 0.65)" }} data-r="meta">
            Not deliverables or case studies. Small working prototypes — click, drag, or trigger any sketch to observe real state logic.
          </p>
        </div>

        {/* 5 Playable Sketches Grid */}
        <div className="grid gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
          {/* Sketch 1: Signal Router */}
          <LabCard tag="SKETCH 01" title="Signal Router" subtitle="Click to dispatch packet">
            <SignalRouterLab />
          </LabCard>

          {/* Sketch 2: Attention Field */}
          <LabCard tag="SKETCH 02" title="Attention Field" subtitle="Drag pointer across matrix">
            <AttentionFieldLab />
          </LabCard>

          {/* Sketch 3: Spatial 3D Cluster */}
          <LabCard tag="SKETCH 03" title="Spatial Node Cluster" subtitle="Drag to rotate with inertia">
            <Spatial3DLab />
          </LabCard>

          {/* Sketch 4: State Machine Toy */}
          <LabCard tag="SKETCH 04" title="State Machine" subtitle="Click nodes or step state">
            <StateMachineLab />
          </LabCard>

          {/* Sketch 5: Kinetic Scrubber */}
          <LabCard tag="SKETCH 05" title="Kinetic Scrubber" subtitle="Scrub font weight & speed">
            <KineticScrubberLab />
          </LabCard>
        </div>
      </div>
    </section>
  );
}

function LabCard({
  tag,
  title,
  subtitle,
  children,
}: {
  tag: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="group relative flex flex-col justify-between rounded-[8px] border p-[18px] transition-all duration-300 hover:border-[var(--accent-deep)]"
      style={{
        borderColor: "var(--line)",
        background: "#141416",
        minHeight: 340,
      }}
    >
      <div className="mb-[12px] flex items-center justify-between">
        <span className="mono rounded-full border px-[8px] py-[3px] text-[9.5px]" style={{ borderColor: "rgba(244, 242, 237, 0.2)", color: "var(--accent)" }}>
          {tag}
        </span>
        <span className="mono text-[10px]" style={{ color: "rgba(244, 242, 237, 0.45)" }}>
          {subtitle}
        </span>
      </div>

      <div className="my-[8px] flex-1 flex flex-col justify-center overflow-hidden rounded-[6px] border p-[12px]" style={{ borderColor: "rgba(244, 242, 237, 0.08)", background: "#0c0c0d" }}>
        {children}
      </div>

      <div className="mt-[12px] flex items-center justify-between pt-[10px] border-t" style={{ borderColor: "rgba(244, 242, 237, 0.08)" }}>
        <h3 className="mono font-medium text-[13px] text-[#f4f2ed]">{title}</h3>
        <span className="mono text-[10px] transition-transform duration-300 group-hover:translate-x-[4px]" style={{ color: "var(--accent)" }}>
          Interactive →
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   SKETCH 1: SIGNAL ROUTER (PROMPT 30: Traveling packet + tail)
   ============================================================ */
type ActivePacket = {
  id: number;
  startTime: number;
  duration: number;
};

function SignalRouterLab() {
  const [packets, setPackets] = useState<ActivePacket[]>([]);
  const [activeStage, setActiveStage] = useState(0);
  const [statusText, setStatusText] = useState("Status: Idle — Click 'Dispatch Packet' to simulate payload.");
  const nextId = useRef(1);
  const rafRef = useRef(0);

  const stages = ["INGEST", "PARSE", "ROUTE", "DONE"];

  const dispatch = () => {
    const id = nextId.current++;
    const now = performance.now();
    setStatusText(`Payload #${id} dispatched into INGEST pipeline...`);

    setPackets((prev) => [...prev.slice(-3), { id, startTime: now, duration: 1600 }]);
  };

  useEffect(() => {
    const loop = (now: number) => {
      setPackets((current) => {
        if (current.length === 0) return current;

        const updated = current.filter((p) => now - p.startTime <= p.duration);
        if (updated.length > 0) {
          const latest = updated[updated.length - 1];
          const progress = Math.min(1, (now - latest.startTime) / latest.duration);
          const stageIdx = Math.min(3, Math.floor(progress * 4));
          setActiveStage(stageIdx);
        } else {
          setStatusText("All payloads processed: ROUTE → DONE [ACK 200]");
        }
        return updated;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="flex flex-col justify-between h-full min-h-[190px]">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px]" style={{ color: "rgba(244,242,237,0.5)" }}>
          Active Stage: <strong style={{ color: "var(--accent)" }}>{stages[activeStage]}</strong>
        </span>
        <button
          type="button"
          onClick={dispatch}
          className="btn btn-ghost py-[6px] px-[12px] text-[9.5px]"
          data-cursor="TRIGGER"
        >
          Dispatch Packet +
        </button>
      </div>

      {/* Track & Traveling Packet */}
      <div className="relative my-[20px] flex items-center justify-between px-[10px]">
        {/* Background Track Line */}
        <div className="absolute inset-x-[24px] top-1/2 h-[2px] -translate-y-1/2" style={{ background: "rgba(244,242,237,0.12)" }} />

        {/* Traveling Animated Packets with Trailing Glow Tails */}
        {packets.map((pkt) => {
          const now = performance.now();
          const progress = Math.min(1, Math.max(0, (now - pkt.startTime) / pkt.duration));
          const leftPct = progress * 100;

          return (
            <div
              key={pkt.id}
              className="pointer-events-none absolute top-1/2 z-[10] -translate-y-1/2"
              style={{
                left: `calc(24px + (${leftPct}% * 0.82))`,
                transition: "none",
              }}
            >
              {/* Trailing Tail Effect */}
              <div
                className="absolute right-[4px] top-1/2 h-[4px] w-[34px] -translate-y-1/2 rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(200,241,79,0.3) 50%, var(--accent) 100%)",
                  filter: "drop-shadow(0 0 6px var(--accent))",
                }}
              />
              {/* Leading Packet Node */}
              <div
                className="relative h-[11px] w-[11px] rounded-full"
                style={{
                  background: "var(--accent)",
                  boxShadow: "0 0 12px var(--accent), 0 0 20px rgba(200,241,79,0.8)",
                }}
              />
            </div>
          );
        })}

        {/* Four Stage Nodes */}
        {stages.map((st, i) => {
          const isCurrent = activeStage === i && packets.length > 0;
          return (
            <div key={st} className="relative z-[2] flex flex-col items-center gap-[6px]">
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border text-[10px] font-mono transition-all duration-300"
                style={{
                  borderColor: isCurrent ? "var(--accent)" : "rgba(244,242,237,0.2)",
                  background: isCurrent ? "var(--accent-deep)" : "#141416",
                  color: isCurrent ? "#0c0c0d" : "#f4f2ed",
                  boxShadow: isCurrent ? "0 0 16px var(--accent)" : "none",
                  transform: isCurrent ? "scale(1.12)" : "scale(1)",
                }}
              >
                0{i + 1}
              </span>
              <span className="mono text-[8.5px]" style={{ color: isCurrent ? "var(--accent)" : "rgba(244,242,237,0.4)" }}>
                {st}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-[4px] border p-[8px]" style={{ borderColor: "rgba(244,242,237,0.08)", background: "#141416" }}>
        <p className="mono text-[9px] truncate" style={{ color: "rgba(244,242,237,0.6)" }}>
          {statusText}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SKETCH 2: ATTENTION FIELD (PROMPT 30: Multi-dot Radial Falloff)
   ============================================================ */
function AttentionFieldLab() {
  const boxRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);

  const COLS = 12;
  const ROWS = 6;

  useEffect(() => {
    const el = boxRef.current;
    if (!el || prefersReducedMotion()) return;
    const offsets = dotsRef.current.map(() => ({ x: 0, y: 0, intensity: 0 }));

    const frame = () => {
      const b = el.getBoundingClientRect();
      let moving = false;

      dotsRef.current.forEach((d, i) => {
        if (!d) return;
        const cx = ((i % COLS) + 0.5) * (b.width / COLS);
        const cy = (Math.floor(i / COLS) + 0.5) * (b.height / ROWS);

        let tx = 0;
        let ty = 0;
        let targetIntensity = 0;

        if (targetRef.current) {
          const dx = cx - targetRef.current.x;
          const dy = cy - targetRef.current.y;
          const dist = Math.hypot(dx, dy) || 1;
          const radius = 95; // Radius of magnetic falloff

          if (dist < radius) {
            // PROMPT 30: Soft radial falloff for nearest dots
            const norm = 1 - dist / radius;
            targetIntensity = Math.pow(norm, 1.6);
            tx = (dx / dist) * targetIntensity * 22;
            ty = (dy / dist) * targetIntensity * 22;
          }
        }

        const o = offsets[i];
        o.x += (tx - o.x) * 0.18;
        o.y += (ty - o.y) * 0.18;
        o.intensity += (targetIntensity - o.intensity) * 0.22;

        if (Math.abs(o.x - tx) > 0.1 || Math.abs(o.y - ty) > 0.1 || Math.abs(o.intensity - targetIntensity) > 0.02) {
          moving = true;
        }

        // Apply physical transform and dynamic illumination with radial falloff
        const scale = 1 + o.intensity * 1.6;
        d.style.transform = `translate3d(${o.x.toFixed(2)}px, ${o.y.toFixed(2)}px, 0) scale(${scale.toFixed(2)})`;

        // Color & luminous glow interpolate smoothly with falloff intensity
        if (o.intensity > 0.05) {
          d.style.background = `color-mix(in srgb, var(--accent) ${(o.intensity * 100).toFixed(0)}%, rgba(244,242,237,0.25))`;
          d.style.boxShadow = `0 0 ${(o.intensity * 10).toFixed(1)}px rgba(200, 241, 79, ${(o.intensity * 0.8).toFixed(2)})`;
        } else {
          d.style.background = "rgba(244,242,237,0.2)";
          d.style.boxShadow = "none";
        }
      });

      rafRef.current = moving || targetRef.current ? requestAnimationFrame(frame) : 0;
    };

    const kick = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(frame);
    };

    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      targetRef.current = { x: e.clientX - b.left, y: e.clientY - b.top };
      kick();
    };

    const leave = () => {
      targetRef.current = null;
      kick();
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative grid h-[180px] w-full grid-cols-12 place-items-center rounded-[4px] cursor-crosshair select-none"
      style={{ background: "#0c0c0d", touchAction: "none" }}
      data-cursor="FIELD"
    >
      {Array.from({ length: COLS * ROWS }).map((_, i) => (
        <span key={i} className="grid place-items-center">
          <span
            ref={(n) => {
              dotsRef.current[i] = n;
            }}
            className="block h-[5px] w-[5px] rounded-full"
            style={{
              background: "rgba(244,242,237,0.2)",
              willChange: "transform, background, box-shadow",
            }}
          />
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   SKETCH 3: SPATIAL 3D NODE CLUSTER (PROMPT 30: Inertia Physics)
   ============================================================ */
function Spatial3DLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotX = useRef(0.4);
  const rotY = useRef(0.6);
  const velX = useRef(0);
  const velY = useRef(0);
  const dragging = useRef(false);
  const lastPtr = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const rafRef = useRef(0);

  // 3D Node Vertices & Edges
  const nodes = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1],
    [0, 0, 0]
  ];
  const edges = [
    [0,1], [1,2], [2,3], [3,0],
    [4,5], [5,6], [6,7], [7,4],
    [0,4], [1,5], [2,6], [3,7],
    [8,0], [8,2], [8,5], [8,7]
  ];

  // Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // PROMPT 30: Apply momentum / inertia when not dragging
      if (!dragging.current) {
        rotX.current += velX.current;
        rotY.current += velY.current;

        // Friction deceleration
        velX.current *= 0.94;
        velY.current *= 0.94;

        // Subtle ambient continuous drift once momentum settles
        if (Math.hypot(velX.current, velY.current) < 0.0002) {
          velX.current = 0;
          velY.current = 0;
          rotY.current += 0.002; // Gentle idle float
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const scale = 54;

      const cosX = Math.cos(rotX.current);
      const sinX = Math.sin(rotX.current);
      const cosY = Math.cos(rotY.current);
      const sinY = Math.sin(rotY.current);

      const projected = nodes.map(([x, y, z]) => {
        // Rotate Y
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        // Rotate X
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const pScale = 260 / (260 + z2 * 40);
        return {
          x: cx + x1 * scale * pScale,
          y: cy + y2 * scale * pScale,
          z: z2,
        };
      });

      // Draw Edges with depth fading
      ctx.lineWidth = 1.3;
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        const alpha = Math.min(0.85, Math.max(0.12, 0.2 + (p1.z + p2.z + 4) * 0.09));
        ctx.strokeStyle = `rgba(200, 241, 79, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw Node Vertices & Central Core
      projected.forEach((p, idx) => {
        ctx.fillStyle = idx === 8 ? "#c8f14f" : "#f4f2ed";
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx === 8 ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (idx === 8) {
          // Central Core Glow
          ctx.strokeStyle = "rgba(200, 241, 79, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    velX.current = 0;
    velY.current = 0;
    lastPtr.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastPtr.current.time);
    const dx = e.clientX - lastPtr.current.x;
    const dy = e.clientY - lastPtr.current.y;

    rotY.current += dx * 0.014;
    rotX.current += dy * 0.014;

    // Track instantaneous release velocity for momentum
    velY.current = (dx / dt) * 0.16;
    velX.current = (dy / dt) * 0.16;

    lastPtr.current = { x: e.clientX, y: e.clientY, time: now };
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const handleTapStep = () => {
    if (!hasFinePointer()) {
      velY.current = 0.08;
      velX.current = 0.04;
    }
  };

  return (
    <div
      ref={containerRef}
      id="lab-3d-fragment"
      className="relative flex h-[180px] w-full flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={handleTapStep}
      data-cursor="ROTATE"
    >
      <canvas ref={canvasRef} width={240} height={170} />
      <span className="mono absolute bottom-[6px] text-[8.5px]" style={{ color: "rgba(244,242,237,0.4)" }}>
        {hasFinePointer() ? "Drag to rotate with physics momentum" : "Tap to spin with inertia"}
      </span>
    </div>
  );
}

/* ============================================================
   SKETCH 4: STATE MACHINE (PROMPT 30: Transition Line Drawing)
   ============================================================ */
function StateMachineLab() {
  const [stateIndex, setStateIndex] = useState(0);
  const [lastStateIndex, setLastStateIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);

  const states = ["IDLE", "EVALUATE", "EXECUTE", "VERIFY"];

  // Node centers in SVG percentage coordinates
  const nodeCoords = [
    { x: 25, y: 25 }, // 0: IDLE (top-left)
    { x: 75, y: 25 }, // 1: EVALUATE (top-right)
    { x: 75, y: 75 }, // 2: EXECUTE (bottom-right)
    { x: 25, y: 75 }, // 3: VERIFY (bottom-left)
  ];

  const goToState = (nextIdx: number) => {
    if (nextIdx === stateIndex) return;
    setLastStateIndex(stateIndex);
    setStateIndex(nextIdx);
    setTransitioning(true);

    window.setTimeout(() => {
      setTransitioning(false);
    }, 450);
  };

  const nextState = () => {
    goToState((stateIndex + 1) % states.length);
  };

  const fromCoord = lastStateIndex !== null ? nodeCoords[lastStateIndex] : null;
  const toCoord = nodeCoords[stateIndex];

  return (
    <div className="flex flex-col justify-between h-full min-h-[190px]">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px]" style={{ color: "rgba(244,242,237,0.5)" }}>
          State: <strong style={{ color: "var(--accent)" }}>{states[stateIndex]}</strong>
        </span>
        <button
          type="button"
          onClick={() => setFallbackMode((f) => !f)}
          className="mono text-[9px] px-[8px] py-[3px] rounded-full border transition-colors"
          style={{
            borderColor: fallbackMode ? "var(--accent)" : "rgba(244,242,237,0.2)",
            color: fallbackMode ? "var(--accent)" : "rgba(244,242,237,0.5)",
          }}
        >
          Fallback: {fallbackMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* State Node Grid with Dynamic Transition Line */}
      <div className="relative grid grid-cols-2 gap-[10px] my-[10px]">
        {/* SVG Transition Layer */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full z-[1]" aria-hidden>
          {transitioning && fromCoord && toCoord && (
            <line
              className="cs-edge"
              x1={`${fromCoord.x}%`}
              y1={`${fromCoord.y}%`}
              x2={`${toCoord.x}%`}
              y2={`${toCoord.y}%`}
              pathLength={1}
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeDasharray="1"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px var(--accent))"
            />
          )}
        </svg>

        {states.map((st, idx) => {
          const active = stateIndex === idx;
          const isFrom = lastStateIndex === idx && transitioning;

          return (
            <button
              key={st}
              type="button"
              onClick={() => goToState(idx)}
              className="relative z-[2] flex flex-col items-start p-[10px] rounded-[6px] border text-left transition-all duration-300"
              style={{
                borderColor: active
                  ? "var(--accent)"
                  : isFrom
                  ? "rgba(200, 241, 79, 0.4)"
                  : "rgba(244,242,237,0.12)",
                background: active
                  ? "rgba(200, 241, 79, 0.12)"
                  : isFrom
                  ? "rgba(200, 241, 79, 0.05)"
                  : "#141416",
                boxShadow: active ? "0 0 14px rgba(200, 241, 79, 0.18)" : "none",
                transform: active ? "scale(1.02)" : "scale(1)",
              }}
            >
              <div className="flex items-center justify-between w-full mb-[2px]">
                <span className="mono text-[8.5px]" style={{ color: active ? "var(--accent)" : "rgba(244,242,237,0.4)" }}>
                  NODE 0{idx + 1}
                </span>
                {active && <span className="block h-[5px] w-[5px] rounded-full bg-[var(--accent)] animate-ping" />}
              </div>
              <span className="mono text-[11px] font-medium" style={{ color: active ? "#f4f2ed" : "rgba(244,242,237,0.6)" }}>
                {st}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={nextState}
        className="btn btn-ghost py-[6px] text-[10px] w-full justify-center"
      >
        Step State Machine →
      </button>
    </div>
  );
}

/* ============================================================
   SKETCH 5: KINETIC VARIABLE SCRUBBER (PROMPT 30: Real-Time Live Reaction)
   ============================================================ */
function KineticScrubberLab() {
  const [weight, setWeight] = useState(500);
  const [speed, setSpeed] = useState(1.4);

  // Live interpolated tracking, stretch, and kinetic pulse
  const letterSpacing = `${((weight - 400) / 1600).toFixed(3)}em`;
  const animationDuration = `${(2.2 / Math.max(0.5, speed)).toFixed(2)}s`;

  return (
    <div className="flex flex-col justify-between h-full min-h-[190px]">
      {/* Live Reacting Typography Stage */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center h-[96px] rounded-[6px] border px-[12px]"
        style={{ borderColor: "rgba(244,242,237,0.12)", background: "#0c0c0d" }}
      >
        {/* Kinetic scanning indicator reacting to speed */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{
            background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
            animation: `drawLine 0.8s ease-in-out infinite alternate`,
            animationDuration,
          }}
        />

        <p
          className="uppercase select-none text-center font-display"
          style={{
            fontWeight: weight,
            fontSize: "clamp(20px, 2.4vw, 28px)",
            letterSpacing,
            color: "var(--accent)",
            textShadow: `0 0 ${(weight / 80).toFixed(1)}px rgba(200, 241, 79, 0.4)`,
            transform: `scaleY(${(0.95 + weight / 2000).toFixed(3)})`,
            transition: "none", // Instant 60fps frame reactivity
          }}
        >
          ARCHE // LAB
        </p>

        <span className="mono text-[8px] text-[rgba(244,242,237,0.4)] mt-[4px]">
          wght: {weight} · spd: {speed.toFixed(1)}x · flux: {(weight * speed).toFixed(0)}
        </span>
      </div>

      {/* Real-time Scrubbing Sliders */}
      <div className="mt-[10px] flex flex-col gap-[8px]">
        <div className="flex items-center justify-between gap-[10px]">
          <span className="mono text-[9.5px]" style={{ color: "rgba(244,242,237,0.6)" }}>
            Weight: <strong className="text-[var(--accent)]">{weight}</strong>
          </span>
          <input
            type="range"
            min={100}
            max={900}
            step={5}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-[124px] accent-[var(--accent)] cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between gap-[10px]">
          <span className="mono text-[9.5px]" style={{ color: "rgba(244,242,237,0.6)" }}>
            Velocity: <strong className="text-[var(--accent)]">{speed.toFixed(1)}x</strong>
          </span>
          <input
            type="range"
            min={0.5}
            max={4.0}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-[124px] accent-[var(--accent)] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
