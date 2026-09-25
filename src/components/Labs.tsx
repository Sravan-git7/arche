import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";

/**
 * PROMPT 12 — Arche Labs (Playable Experiments)
 *
 * 5 Genuine Interactive Sketches (Dark background, small frames):
 *  1. Signal Router       — Tap to dispatch live payload packet through nodes.
 *  2. Attention Field     — Dynamic magnetic dot matrix responding to pointer/touch drag.
 *  3. Spatial 3D Cluster  — Interactive 3D wireframe node (drag to rotate / tap step).
 *                           Serves as the literal visual bridge to the 3D System section.
 *  4. State Machine Toy   — Interactive state machine logic matrix with branch toggles.
 *  5. Kinetic Scrubber    — Live variable font weight, tracking & velocity controller.
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

        {/* 5 Playable Sketches Grid (3-column layout on desktop, dark card frames) */}
        <div className="grid gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
          {/* Sketch 1: Signal Router */}
          <LabCard tag="SKETCH 01" title="Signal Router" subtitle="Click to dispatch packet">
            <SignalRouterLab />
          </LabCard>

          {/* Sketch 2: Attention Field */}
          <LabCard tag="SKETCH 02" title="Attention Field" subtitle="Drag pointer across matrix">
            <AttentionFieldLab />
          </LabCard>

          {/* Sketch 3: Spatial 3D Cluster (Bridge to Prompt 13) */}
          <LabCard tag="SKETCH 03" title="Spatial Node Cluster" subtitle="Drag to rotate 3D node">
            <Spatial3DLab />
          </LabCard>

          {/* Sketch 4: State Machine Toy */}
          <LabCard tag="SKETCH 04" title="State Machine" subtitle="Click nodes to switch state">
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
   SKETCH 1: SIGNAL ROUTER
   ============================================================ */
function SignalRouterLab() {
  const [packets, setPackets] = useState<{ id: number; stage: number }[]>([]);
  const [activeStage, setActiveStage] = useState(0);
  const nextId = useRef(1);

  const dispatch = () => {
    const id = nextId.current++;
    setPackets((prev) => [...prev.slice(-4), { id, stage: 0 }]);

    let s = 0;
    const interval = setInterval(() => {
      s++;
      setActiveStage(s % 4);
      setPackets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stage: s } : p))
      );
      if (s >= 3) clearInterval(interval);
    }, 400);
  };

  const stages = ["INGEST", "PARSE", "ROUTE", "DONE"];

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

      <div className="relative my-[16px] flex items-center justify-between px-[6px]">
        <div className="absolute inset-x-[20px] top-1/2 h-px -translate-y-1/2" style={{ background: "rgba(244,242,237,0.15)" }} />
        {stages.map((st, i) => {
          const isCurrent = activeStage === i;
          return (
            <div key={st} className="relative z-[2] flex flex-col items-center gap-[6px]">
              <span
                className="flex h-[28px] w-[28px] items-center justify-center rounded-full border text-[10px] font-mono transition-all duration-300"
                style={{
                  borderColor: isCurrent ? "var(--accent)" : "rgba(244,242,237,0.2)",
                  background: isCurrent ? "var(--accent-deep)" : "#141416",
                  color: isCurrent ? "#0c0c0d" : "#f4f2ed",
                  boxShadow: isCurrent ? "0 0 12px var(--accent-deep)" : "none",
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
        <p className="mono text-[9px]" style={{ color: "rgba(244,242,237,0.5)" }}>
          {packets.length === 0
            ? "Status: Idle — Click 'Dispatch Packet' to simulate live event payload."
            : `Payload #${packets[packets.length - 1].id} -> Stage: ${stages[packets[packets.length - 1].stage]}`}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SKETCH 2: ATTENTION FIELD
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
    const offsets = dotsRef.current.map(() => ({ x: 0, y: 0 }));

    const frame = () => {
      const b = el.getBoundingClientRect();
      let moving = false;

      dotsRef.current.forEach((d, i) => {
        if (!d) return;
        const cx = ((i % COLS) + 0.5) * (b.width / COLS);
        const cy = (Math.floor(i / COLS) + 0.5) * (b.height / ROWS);

        let tx = 0;
        let ty = 0;

        if (targetRef.current) {
          const dx = cx - targetRef.current.x;
          const dy = cy - targetRef.current.y;
          const dist = Math.hypot(dx, dy) || 1;
          const f = Math.max(0, 1 - dist / 100);
          tx = (dx / dist) * f * 24;
          ty = (dy / dist) * f * 24;
        }

        const o = offsets[i];
        o.x += (tx - o.x) * 0.18;
        o.y += (ty - o.y) * 0.18;

        if (Math.abs(o.x - tx) > 0.1 || Math.abs(o.y - ty) > 0.1) moving = true;
        d.style.transform = `translate3d(${o.x}px, ${o.y}px, 0) scale(${1 + Math.hypot(o.x, o.y) / 14})`;
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
      data-cursor="DRAG"
    >
      {Array.from({ length: COLS * ROWS }).map((_, i) => (
        <span key={i} className="grid place-items-center">
          <span
            ref={(n) => {
              dotsRef.current[i] = n;
            }}
            className="block h-[5px] w-[5px] rounded-full transition-colors duration-200"
            style={{
              background: i === 34 ? "var(--accent)" : "rgba(244,242,237,0.25)",
              willChange: "transform",
            }}
          />
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   SKETCH 3: SPATIAL 3D NODE CLUSTER (Bridge to Prompt 13)
   ============================================================ */
function Spatial3DLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotX, setRotX] = useState(0.4);
  const [rotY, setRotY] = useState(0.6);
  const dragging = useRef(false);
  const lastPtr = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Draw 3D wireframe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const scale = 52;

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    const projected = nodes.map(([x, y, z]) => {
      // Rotate Y
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      // Rotate X
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const pScale = 250 / (250 + z2 * 40);
      return {
        x: cx + x1 * scale * pScale,
        y: cy + y2 * scale * pScale,
        z: z2,
      };
    });

    // Draw Edges
    ctx.lineWidth = 1.2;
    edges.forEach(([i, j]) => {
      const p1 = projected[i];
      const p2 = projected[j];
      const alpha = 0.15 + (p1.z + p2.z + 4) * 0.08;
      ctx.strokeStyle = `rgba(200, 241, 79, ${Math.min(0.8, Math.max(0.1, alpha))})`;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Draw Node Dots
    projected.forEach((p, idx) => {
      ctx.fillStyle = idx === 8 ? "#c8f14f" : "#f4f2ed";
      ctx.beginPath();
      ctx.arc(p.x, p.y, idx === 8 ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [rotX, rotY]);

  // Prompt 12 -> 13 Transition Bridge: ScrollTrigger dissolve/expand into 3D Architecture section
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "bottom 80%",
        end: "bottom 10%",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          // Scale and expand visually into the 3D System section
          gsap.set(el, {
            scale: 1 + progress * 0.4,
            opacity: 1 - progress * 0.3,
            rotate: progress * 15,
          });
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPtr.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPtr.current.x;
    const dy = e.clientY - lastPtr.current.y;
    lastPtr.current = { x: e.clientX, y: e.clientY };

    setRotY((r) => r + dx * 0.012);
    setRotX((r) => r + dy * 0.012);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  // Mobile Tap Step Rotate Fallback
  const handleTapStep = () => {
    if (!hasFinePointer()) {
      setRotY((r) => r + Math.PI / 4);
      setRotX((r) => r + Math.PI / 6);
    }
  };

  return (
    <div
      ref={containerRef}
      id="lab-3d-fragment"
      data-lab-3d-bridge="1"
      className="relative flex h-[180px] w-full flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={handleTapStep}
      data-cursor="DRAG"
    >
      <canvas ref={canvasRef} width={240} height={170} />
      <span className="mono absolute bottom-[6px] text-[8.5px]" style={{ color: "rgba(244,242,237,0.4)" }}>
        {hasFinePointer() ? "Drag to rotate 3D node" : "Tap to step rotate 45°"}
      </span>
    </div>
  );
}

/* ============================================================
   SKETCH 4: STATE MACHINE MICRO-TOY
   ============================================================ */
function StateMachineLab() {
  const [stateIndex, setStateIndex] = useState(0);
  const [fallbackMode, setFallbackMode] = useState(false);

  const states = ["IDLE", "EVALUATE", "EXECUTE", "VERIFY"];

  const nextState = () => {
    setStateIndex((prev) => (prev + 1) % states.length);
  };

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

      <div className="grid grid-cols-2 gap-[8px] my-[12px]">
        {states.map((st, idx) => {
          const active = stateIndex === idx;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStateIndex(idx)}
              className="flex flex-col items-start p-[10px] rounded-[4px] border text-left transition-all duration-200"
              style={{
                borderColor: active ? "var(--accent)" : "rgba(244,242,237,0.12)",
                background: active ? "rgba(200, 241, 79, 0.08)" : "#141416",
              }}
            >
              <span className="mono text-[8px]" style={{ color: active ? "var(--accent)" : "rgba(244,242,237,0.4)" }}>
                NODE 0{idx + 1}
              </span>
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
   SKETCH 5: KINETIC VARIABLE SCRUBBER
   ============================================================ */
function KineticScrubberLab() {
  const [weight, setWeight] = useState(500);
  const [speed, setSpeed] = useState(1.2);

  return (
    <div className="flex flex-col justify-between h-full min-h-[190px]">
      <div className="relative overflow-hidden flex items-center justify-center h-[90px] rounded-[4px] border px-[12px]" style={{ borderColor: "rgba(244,242,237,0.1)", background: "#0c0c0d" }}>
        <p
          className="tracking-[0.08em] uppercase transition-all duration-150 text-center"
          style={{
            fontWeight: weight,
            fontSize: "clamp(18px, 2.2vw, 26px)",
            color: "var(--accent)",
            letterSpacing: `${(weight - 400) / 2000}em`,
          }}
        >
          ARCHE // LAB
        </p>
      </div>

      <div className="mt-[12px] flex flex-col gap-[10px]">
        <div className="flex items-center justify-between gap-[10px]">
          <span className="mono text-[9.5px]" style={{ color: "rgba(244,242,237,0.6)" }}>
            Weight: {weight}
          </span>
          <input
            type="range"
            min={300}
            max={800}
            step={20}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-[120px] accent-[var(--accent)] cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between gap-[10px]">
          <span className="mono text-[9.5px]" style={{ color: "rgba(244,242,237,0.6)" }}>
            Speed: {speed}x
          </span>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-[120px] accent-[var(--accent)] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
