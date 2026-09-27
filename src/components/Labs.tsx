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
 *
 * PROMPT 36 updates — the idle "invitation" pass:
 *  - Sketch 01's status line may no longer truncate: it wraps instead,
 *    so no status text ever hides behind an ellipsis.
 *  - Every sketch now carries one distinct, very subtle looping
 *    micro-motion while untouched, so the grid reads as alive and
 *    waiting to be touched — not as static screenshots. Each borrows a
 *    faint pre-echo of its own triggered response:
 *      01 a ghost packet drifting the track when no payload is in flight
 *      02 a slow diagonal breathing wave across the dot matrix
 *      03 the central core's glow breathing (on top of the idle drift)
 *      04 a soft anticipation halo on the node "Step" would enter next
 *      05 a slow glow bloom behind the live type (the scan line already lives)
 *    All are disabled under prefers-reduced-motion.
 */

/* ================================================================
   PROMPT 42 — shared material language for every sketch.
   Light: lines = bright thin core + soft blurred glow behind it;
          dots  = point-lights (white-hot centre → lime → transparent).
   Weight: triggered changes settle on an under-damped spring (snappy
          start, a few % overshoot at the end — never added latency).
   Every glow/pulse is bound to real state: a connection that exists,
   a packet that is travelling, a value that just changed.
   ================================================================ */
const LAB_SPRING = "cubic-bezier(0.34, 1.32, 0.64, 1)"; // ~4–6% overshoot
/** point-light fill — `a` scales brightness 0..1 */
const pointLight = (a = 1) =>
  `radial-gradient(circle, rgba(250,252,240,${a}) 0 16%, rgba(200,241,79,${0.85 * a}) 34%, rgba(200,241,79,${0.22 * a}) 58%, transparent 72%)`;

/** Under-damped spring follower for numeric values (rAF, settles & stops). */
function useSpringValue(target: number, stiffness = 0.22, damping = 0.68) {
  const [v, setV] = useState(target);
  const st = useRef({ x: target, vel: 0, raf: 0 });
  useEffect(() => {
    const s0 = st.current;
    if (prefersReducedMotion()) {
      s0.x = target;
      setV(target);
      return;
    }
    const step = () => {
      s0.vel = (s0.vel + (target - s0.x) * stiffness) * damping;
      s0.x += s0.vel;
      if (Math.abs(target - s0.x) < 0.01 * Math.max(1, Math.abs(target) / 100) && Math.abs(s0.vel) < 0.01) {
        s0.x = target;
        setV(target);
        s0.raf = 0;
        return;
      }
      setV(s0.x);
      s0.raf = requestAnimationFrame(step);
    };
    cancelAnimationFrame(s0.raf);
    s0.raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(s0.raf);
  }, [target, stiffness, damping]);
  return v;
}

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
          <LabCard tag="SKETCH 01" title="Signal Router" subtitle="Click fast — load the router">
            <SignalRouterLab />
          </LabCard>

          {/* Sketch 2: Attention Field */}
          <LabCard tag="SKETCH 02" title="Attention Field" subtitle="Drag pointer across matrix">
            <AttentionFieldLab />
          </LabCard>

          {/* Sketch 3: Spatial 3D Cluster */}
          <LabCard tag="SKETCH 03" title="Spatial Node Cluster" subtitle="Drag to spin · click a node">
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
      className="lab-card-v2 group relative flex flex-col justify-between rounded-[8px] border p-[18px]"
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

      <div className="lab-stage relative my-[8px] flex-1 flex flex-col justify-center overflow-hidden rounded-[6px] border p-[12px]" style={{ borderColor: "rgba(244, 242, 237, 0.08)", background: "#0c0c0d" }}>
        <span className="lab-atmos pointer-events-none absolute inset-[-8px]" aria-hidden />
        <div className="relative flex flex-1 flex-col justify-center">{children}</div>
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
/* PROMPT 41 — the router is now a small load toy: every click queues a
   packet; up to MAX_FLIGHT run concurrently in their own lane + tint, the
   rest wait in a visible queue (backpressure), overflow is dropped. Each
   stage node shows how many packets it is holding right now. */
type ActivePacket = {
  id: number;
  lane: number;
  hue: number;
  startTime: number; // -1 while queued
  duration: number;
};
const MAX_FLIGHT = 5;
const MAX_QUEUE = 8;
const LANES = [-10, -5, 0, 5, 10];
const TINTS = ["#c8f14f", "#9be15d", "#e6f57a", "#6fd3a0", "#f4d35e"];

function SignalRouterLab() {
  const packetsRef = useRef<ActivePacket[]>([]);
  const [, setFrame] = useState(0);
  const [stats, setStats] = useState({ done: 0, dropped: 0, peak: 0 });
  const [statusText, setStatusText] = useState("Idle — click Dispatch. Click fast to load the router.");
  const [bursts, setBursts] = useState<{ id: number; hue: number }[]>([]);
  const nextId = useRef(1);
  const rafRef = useRef(0);
  const running = useRef(false);
  const stages = ["INGEST", "PARSE", "ROUTE", "DONE"];
  // PROMPT 42: per-stage arrival counter → keyed flash when a packet reaches it
  const arrivals = useRef([0, 0, 0, 0]);
  const seenStage = useRef(new Map<number, number>());

  const inFlight = () => packetsRef.current.filter((p) => p.startTime >= 0);
  const queued = () => packetsRef.current.filter((p) => p.startTime < 0);

  const loop = (now: number) => {
    const list = packetsRef.current;
    const finished = list.filter((p) => p.startTime >= 0 && now - p.startTime > p.duration);
    if (finished.length) {
      setStats((st) => ({ ...st, done: st.done + finished.length }));
      setBursts((b) => [...b.slice(-6), ...finished.map((f) => ({ id: f.id, hue: f.hue }))]);
    }
    let next = list.filter((p) => !finished.includes(p));
    // release queued packets into free lanes
    const busyLanes = new Set(next.filter((p) => p.startTime >= 0).map((p) => p.lane));
    next = next.map((p) => {
      if (p.startTime >= 0 || busyLanes.size >= MAX_FLIGHT) return p;
      const lane = LANES.findIndex((_, i) => !busyLanes.has(i));
      busyLanes.add(lane);
      return { ...p, lane, startTime: now };
    });
    packetsRef.current = next;
    if (finished.length && next.length) {
      const q = next.filter((p) => p.startTime < 0).length;
      const f = next.length - q;
      setStatusText(`#${finished.map((p) => p.id).join(", #")} → DONE · ${f} in flight${q ? `, ${q} still queued` : ""}.`);
    }
    setFrame((f) => f + 1);
    if (next.length) rafRef.current = requestAnimationFrame(loop);
    else {
      running.current = false;
      setStatusText("All payloads processed: ROUTE → DONE [ACK 200]");
    }
  };

  const dispatch = () => {
    const id = nextId.current++;
    const q = queued().length;
    const f = inFlight().length;
    if (f >= MAX_FLIGHT && q >= MAX_QUEUE) {
      setStats((st) => ({ ...st, dropped: st.dropped + 1 }));
      setStatusText(`Payload #${id} dropped — queue full (${MAX_QUEUE}). Backpressure engaged.`);
      return;
    }
    // durations vary slightly so packets overtake/spread like real work
    const pkt: ActivePacket = { id, lane: -1, hue: id % TINTS.length, startTime: -1, duration: 1500 + ((id * 373) % 700) };
    packetsRef.current = [...packetsRef.current, pkt];
    const load = f + q + 1;
    setStats((st) => ({ ...st, peak: Math.max(st.peak, load) }));
    setStatusText(
      f >= MAX_FLIGHT
        ? `Payload #${id} queued — ${q + 1} waiting, ${MAX_FLIGHT} lanes busy.`
        : `Payload #${id} → INGEST · ${f + 1}/${MAX_FLIGHT} lanes in use.`
    );
    if (!running.current) {
      running.current = true;
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const now = performance.now();
  const flying = inFlight();
  const waiting = queued();
  const stageCounts = [0, 0, 0, 0];
  flying.forEach((p) => {
    const pr = Math.min(0.999, (now - p.startTime) / p.duration);
    const si = Math.floor(pr * 4);
    stageCounts[si]++;
    if (seenStage.current.get(p.id) !== si) {
      seenStage.current.set(p.id, si);
      arrivals.current[si]++;
    }
  });
  if (seenStage.current.size > 40) seenStage.current = new Map([...seenStage.current].slice(-20));

  return (
    <div className="flex flex-col justify-between h-full min-h-[190px]">
      <div className="flex items-center justify-between gap-[8px]">
        <span className="mono text-[9.5px] leading-[1.5]" style={{ color: "rgba(244,242,237,0.5)" }}>
          In flight <strong style={{ color: "var(--accent)" }}>{flying.length}</strong> · Queue{" "}
          <strong style={{ color: waiting.length ? "#f4d35e" : "rgba(244,242,237,0.7)" }}>{waiting.length}</strong> · Done{" "}
          <strong style={{ color: "#f4f2ed" }}>{stats.done}</strong>
          {stats.dropped > 0 && (
            <>
              {" "}· Dropped <strong style={{ color: "#ff8a7a" }}>{stats.dropped}</strong>
            </>
          )}
        </span>
        <button type="button" onClick={dispatch} className="btn btn-ghost flex-none py-[6px] px-[12px] text-[9.5px]" data-cursor="TRIGGER">
          Dispatch +
        </button>
      </div>

      <div className="relative my-[18px] flex items-center justify-between px-[10px]">
        {/* PROMPT 42: the stage path is light — soft glow behind a thin bright core.
            It brightens with load (real: packets are on it). */}
        <div className="absolute inset-x-[24px] top-1/2 h-[6px] -translate-y-1/2 rounded-full" style={{ background: "var(--accent)", filter: "blur(4px)", opacity: 0.08 + Math.min(flying.length, 5) * 0.05, transition: "opacity .4s" }} />
        <div className="absolute inset-x-[24px] top-1/2 h-px -translate-y-1/2" style={{ background: "linear-gradient(90deg, rgba(244,242,237,.22), rgba(230,248,170,.5), rgba(244,242,237,.22))" }} />
        {/* faint lane guides appear once the router is under load */}
        {LANES.map((off, i) => (
          <div key={i} className="absolute inset-x-[24px] top-1/2 h-px transition-opacity duration-500" style={{ transform: `translateY(${off}px)`, background: "rgba(200,241,79,0.12)", opacity: flying.some((p) => p.lane === i) ? 1 : 0 }} />
        ))}

        {packetsRef.current.length === 0 && (
          <span className="lab-ghost-packet pointer-events-none absolute top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full" style={{ background: pointLight(0.8) }} aria-hidden />
        )}

        {/* queue — waiting packets stack up before INGEST */}
        <div className="pointer-events-none absolute left-[2px] top-1/2 z-[11] flex -translate-y-1/2 flex-col-reverse gap-[2px]" style={{ transform: "translate(-4px,-50%)" }}>
          {waiting.map((p) => (
            <span key={p.id} className="lab-q-in block h-[6px] w-[6px] rounded-full" style={{ background: `radial-gradient(circle, ${TINTS[p.hue]} 0 35%, transparent 72%)` }} />
          ))}
        </div>

        {flying.map((pkt) => {
          const progress = Math.min(1, Math.max(0, (now - pkt.startTime) / pkt.duration));
          const tint = TINTS[pkt.hue];
          return (
            <div
              key={pkt.id}
              className="pointer-events-none absolute top-1/2 z-[10]"
              style={{ left: `calc(24px + (${progress * 100}% * 0.82))`, transform: `translateY(calc(-50% + ${LANES[pkt.lane]}px))` }}
            >
              <div className="absolute right-[6px] top-1/2 h-[4px] w-[30px] -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${tint})`, filter: "blur(1.5px)", opacity: 0.55 }} />
              <div className="absolute right-[6px] top-1/2 h-px w-[24px] -translate-y-1/2" style={{ background: `linear-gradient(90deg, transparent, rgba(250,252,240,.9))` }} />
              <div className="relative h-[16px] w-[16px] -translate-x-[4px] rounded-full" style={{ background: `radial-gradient(circle, rgba(250,252,240,1) 0 16%, ${tint} 36%, transparent 70%)` }} />
            </div>
          );
        })}

        {stages.map((st, i) => {
          const n = stageCounts[i];
          const isCurrent = n > 0;
          return (
            <div key={st} className="relative z-[2] flex flex-col items-center gap-[6px]">
              <span
                className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full border text-[10px] font-mono"
                style={{
                  borderColor: isCurrent ? "rgba(200,241,79,.9)" : "rgba(244,242,237,0.16)",
                  background: isCurrent ? "radial-gradient(circle, rgba(200,241,79,.32), rgba(20,20,22,.9) 70%)" : "#141416",
                  color: isCurrent ? "#f4f2ed" : "rgba(244,242,237,.7)",
                  boxShadow: isCurrent ? `0 0 ${8 + n * 5}px rgba(200,241,79,${0.25 + Math.min(n, 4) * 0.08})` : "none",
                  transform: `scale(${1 + Math.min(n, 4) * 0.05})`,
                  transition: `transform .5s ${LAB_SPRING}, box-shadow .3s, background .25s, border-color .25s`,
                }}
              >
                {/* arrival flash — one per packet reaching this stage */}
                {arrivals.current[i] > 0 && <span key={arrivals.current[i]} className="lab-flash pointer-events-none absolute inset-[-6px] rounded-full" aria-hidden />}
                0{i + 1}
                {n > 1 && (
                  <span className="mono absolute -right-[6px] -top-[6px] grid h-[13px] min-w-[13px] place-items-center rounded-full px-[3px] text-[7.5px] font-bold" style={{ background: "#f4f2ed", color: "#0c0c0d" }}>
                    {n}
                  </span>
                )}
                {i === 3 &&
                  bursts.map((b) => (
                    <span key={b.id} className="lab-done-burst pointer-events-none absolute inset-0 rounded-full border" style={{ borderColor: TINTS[b.hue] }} onAnimationEnd={() => setBursts((x) => x.filter((y) => y.id !== b.id))} />
                  ))}
              </span>
              <span className="mono text-[8.5px]" style={{ color: isCurrent ? "var(--accent)" : "rgba(244,242,237,0.4)" }}>
                {st}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-[4px] border p-[8px]" style={{ borderColor: "rgba(244,242,237,0.08)", background: "#141416" }}>
        <p className="mono text-[9px] leading-[1.55]" style={{ color: "rgba(244,242,237,0.6)" }} aria-live="polite">
          {statusText}
          {stats.peak > 1 && <span style={{ color: "rgba(244,242,237,0.35)" }}> · peak load {stats.peak}</span>}
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
    // PROMPT 42: spring state (position + velocity) instead of a plain lerp
    const offsets = dotsRef.current.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, intensity: 0 }));

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
        o.vx = (o.vx + (tx - o.x) * 0.24) * 0.56;
        o.vy = (o.vy + (ty - o.y) * 0.24) * 0.56;
        o.x += o.vx;
        o.y += o.vy;
        o.intensity += (targetIntensity - o.intensity) * 0.25;

        if (Math.abs(o.x - tx) > 0.1 || Math.abs(o.y - ty) > 0.1 || Math.abs(o.vx) + Math.abs(o.vy) > 0.05 || Math.abs(o.intensity - targetIntensity) > 0.02) {
          moving = true;
        }

        // Apply physical transform and dynamic illumination with radial falloff
        const scale = 1 + o.intensity * 1.4;
        d.style.transform = `translate3d(${o.x.toFixed(2)}px, ${o.y.toFixed(2)}px, 0) scale(${scale.toFixed(2)})`;

        // Point-light: brightness = real attention intensity at this dot
        if (o.intensity > 0.03) {
          const a = o.intensity;
          d.style.background = `radial-gradient(circle, rgba(250,252,240,${(0.45 + a * 0.55).toFixed(2)}) 0 18%, rgba(200,241,79,${(a * 0.9).toFixed(2)}) 36%, rgba(200,241,79,${(a * 0.25).toFixed(2)}) 58%, transparent 72%)`;
        } else {
          d.style.background = "";
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
      // PROMPT 36: the idle wave stands down while the visitor is driving
      // the field (also covers touch, where :hover doesn't fire).
      el.classList.add("attention-active");
      kick();
    };

    const leave = () => {
      targetRef.current = null;
      el.classList.remove("attention-active");
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
      className="attention-field relative h-[180px] w-full rounded-[4px] cursor-crosshair select-none"
      style={{ background: "#0c0c0d", touchAction: "none" }}
      data-cursor="FIELD"
    >
      {/* PROMPT 42: near-imperceptible ambient drift of the whole field */}
      <div className="lab-drift pointer-events-none absolute inset-0 grid grid-cols-12 place-items-center">
      {Array.from({ length: COLS * ROWS }).map((_, i) => (
        <span key={i} className="grid place-items-center">
          <span
            ref={(n) => {
              dotsRef.current[i] = n;
            }}
            className="lab-dot block h-[11px] w-[11px] rounded-full"
            style={{
              willChange: "transform, background",
              // PROMPT 36 idle invitation: a slow diagonal breathing wave —
              // per-dot delay runs from top-left to bottom-right.
              animationDelay: `${((i % COLS) + Math.floor(i / COLS)) * 130}ms`,
            }}
          />
        </span>
      ))}
      </div>
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
  // PROMPT 41 — click a node to isolate its connections
  const [selected, setSelected] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selected;
  const hoverRef = useRef<number | null>(null);
  const projRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const downAt = useRef({ x: 0, y: 0 });
  const focusT = useRef(0); // 0 → 1 eases the dimming in/out
  const focusV = useRef(0); // PROMPT 42: spring velocity for focus

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

      projRef.current = projected;
      const sel = selectedRef.current;
      focusV.current = (focusV.current + ((sel !== null ? 1 : 0) - focusT.current) * 0.16) * 0.72;
      focusT.current += focusV.current;
      const ft = Math.max(0, focusT.current);
      const linked = new Set<number>();
      if (sel !== null) edges.forEach(([i, j]) => { if (i === sel) linked.add(j); if (j === sel) linked.add(i); });
      const pulse = (performance.now() % 1400) / 1400;

      // Draw Edges with depth fading — selected node's edges stay lit, rest dim
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        const base = Math.min(0.85, Math.max(0.12, 0.2 + (p1.z + p2.z + 4) * 0.09));
        const mine = sel !== null && (i === sel || j === sel);
        const alpha = mine ? base + (1 - base) * ft : base * (1 - ft * 0.88);
        // PROMPT 42: glow pass behind a thin bright core
        const a = Math.max(0, Math.min(1, alpha));
        ctx.save();
        ctx.lineWidth = mine ? 4 + ft * 2 : 3.5;
        ctx.strokeStyle = `rgba(200, 241, 79, ${(a * 0.22).toFixed(3)})`;
        ctx.shadowColor = "rgba(200,241,79,0.6)";
        ctx.shadowBlur = 6 * a;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
        ctx.lineWidth = mine ? 1 + ft * 0.6 : 0.9;
        ctx.strokeStyle = `rgba(232, 250, 180, ${a})`;
        if (mine && !prefersReducedMotion()) {
          // a light pulse runs outward from the selected node along each link,
          // flashing as it arrives at the neighbour
          const from = i === sel ? p1 : p2, to = i === sel ? p2 : p1;
          const t = pulse;
          const px = from.x + (to.x - from.x) * t, py = from.y + (to.y - from.y) * t;
          const g = ctx.createRadialGradient(px, py, 0, px, py, 6);
          g.addColorStop(0, `rgba(250,252,240,${ft})`);
          g.addColorStop(0.4, `rgba(200,241,79,${0.6 * ft})`);
          g.addColorStop(1, "rgba(200,241,79,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
          if (t > 0.86) {
            const k = (t - 0.86) / 0.14;
            ctx.strokeStyle = `rgba(200,241,79,${(1 - k) * 0.7 * ft})`;
            ctx.beginPath();
            ctx.arc(to.x, to.y, 3 + k * 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = `rgba(232, 250, 180, ${a})`;
          }
        }
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // PROMPT 36 idle invitation: the central core's glow breathes slowly
      // (on top of the idle drift) — a faint "waiting" pulse at the heart
      // of the cluster. Static under reduced motion.
      const breathe = prefersReducedMotion() ? 0 : Math.sin(performance.now() * 0.0011);

      // Draw Node Vertices & Central Core
      projected.forEach((p, idx) => {
        const on = sel === null || idx === sel || linked.has(idx);
        ctx.globalAlpha = Math.max(0.15, on ? 1 : 1 - ft * 0.75);
        // PROMPT 42: point-light vertices; nearer (z) = brighter; hover blooms
        const core = (idx === 8 ? 4.5 : 2.5) + (idx === sel ? 1.5 * ft : 0);
        const bloom = core * (idx === hoverRef.current ? 4.2 : 3.2);
        const depth = Math.max(0.55, Math.min(1, 0.8 - p.z * 0.15));
        const lg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, bloom);
        lg.addColorStop(0, `rgba(250,252,240,${depth})`);
        lg.addColorStop(0.22, idx === 8 || idx === sel ? `rgba(200,241,79,${depth})` : `rgba(236,246,210,${depth * 0.85})`);
        lg.addColorStop(0.5, `rgba(200,241,79,${0.22 * depth})`);
        lg.addColorStop(1, "rgba(200,241,79,0)");
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, bloom, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (idx === sel) {
          ctx.strokeStyle = `rgba(200,241,79,${0.8 * ft})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7 + ft * 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (idx === 8) {
          // Central Core Glow — breathing radius + luminance
          const coreR = 8 + breathe * 1.7;
          ctx.strokeStyle = `rgba(200, 241, 79, ${0.38 + breathe * 0.14})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, coreR, 0, Math.PI * 2);
          ctx.stroke();

          // Soft outer aura
          ctx.strokeStyle = `rgba(200, 241, 79, ${0.1 + breathe * 0.05})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, coreR + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const hitTest = (e: { clientX: number; clientY: number }) => {
    const c = canvasRef.current;
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    let best: number | null = null;
    let bd = hasFinePointer() ? 11 : 18;
    // prefer nodes nearer the viewer when they overlap
    projRef.current.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.y - y) - p.z * 0.5;
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    downAt.current = { x: e.clientX, y: e.clientY };
    dragging.current = true;
    velX.current = 0;
    velY.current = 0;
    lastPtr.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) {
      const h = hitTest(e);
      hoverRef.current = h;
      (e.currentTarget as HTMLElement).style.cursor = h !== null ? "pointer" : "";
      return;
    }
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

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    const moved = Math.hypot(e.clientX - downAt.current.x, e.clientY - downAt.current.y);
    if (moved > 5) return; // it was a drag
    const hit = hitTest(e);
    if (hit !== null) {
      setSelected((cur) => (cur === hit ? null : hit));
      velX.current = 0;
      velY.current = 0;
    } else if (selectedRef.current !== null) {
      setSelected(null);
    } else if (!hasFinePointer()) {
      velY.current = 0.08;
      velX.current = 0.04;
    }
  };
  const onPointerCancel = () => {
    dragging.current = false;
  };
  const linkCount = selected === null ? 0 : edges.filter(([i, j]) => i === selected || j === selected).length;
  const nodeName = (i: number) => (i === 8 ? "CORE" : `NODE ${String(i + 1).padStart(2, "0")}`);

  return (
    <div
      ref={containerRef}
      id="lab-3d-fragment"
      className="relative flex h-[180px] w-full flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={() => (hoverRef.current = null)}
      data-cursor="ROTATE"
    >
      <canvas ref={canvasRef} width={240} height={170} />
      {selected !== null && (
        <span key={selected} className="swap-fade mono absolute left-[4px] top-[2px] rounded-full border px-[7px] py-[2px] text-[8.5px]" style={{ borderColor: "var(--accent-deep)", color: "var(--accent)", background: "#0c0c0d" }}>
          {nodeName(selected)} · {linkCount} LINKS
        </span>
      )}
      <span className="mono absolute bottom-[6px] text-[8.5px]" style={{ color: "rgba(244,242,237,0.4)" }}>
        {selected !== null
          ? "Click another node · click empty space to clear"
          : hasFinePointer()
            ? "Drag to rotate · click a node to trace its links"
            : "Tap a node to trace its links · tap space to spin"}
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
  // PROMPT 42: a light pulse travels source → destination; the destination
  // lights (with a flash + spring settle) when the pulse actually arrives.
  const [arrived, setArrived] = useState(true);
  const [hop, setHop] = useState(0);
  const arriveT = useRef(0);
  const TRAVEL = prefersReducedMotion() ? 0 : 340;

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
    setArrived(false);
    setHop((h) => h + 1);
    window.clearTimeout(arriveT.current);
    arriveT.current = window.setTimeout(() => setArrived(true), TRAVEL);

    window.setTimeout(() => {
      setTransitioning(false);
    }, TRAVEL + 260);
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
          className="lab-glow-hover mono text-[9px] px-[8px] py-[3px] rounded-full border transition-colors"
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
        <svg className="pointer-events-none absolute inset-0 h-full w-full z-[3]" aria-hidden>
          {/* the machine's real transitions (the Step cycle) as light: glow + core */}
          {nodeCoords.map((a, i) => {
            const b = nodeCoords[(i + 1) % 4];
            const lit = stateIndex === i || stateIndex === (i + 1) % 4;
            return (
              <g key={i} style={{ opacity: lit ? 1 : 0.45, transition: "opacity .4s" }}>
                <line x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke="rgba(200,241,79,.16)" strokeWidth="5" style={{ filter: "blur(2px)" }} />
                <line x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke="rgba(232,250,180,.28)" strokeWidth="0.8" strokeDasharray="2 3" />
              </g>
            );
          })}
          {transitioning && fromCoord && toCoord && (
            <g key={hop}>
              <line className="cs-edge" x1={`${fromCoord.x}%`} y1={`${fromCoord.y}%`} x2={`${toCoord.x}%`} y2={`${toCoord.y}%`} pathLength={1} stroke="rgba(200,241,79,.35)" strokeWidth="6" strokeDasharray="1" strokeLinecap="round" style={{ filter: "blur(3px)" }} />
              <line className="cs-edge" x1={`${fromCoord.x}%`} y1={`${fromCoord.y}%`} x2={`${toCoord.x}%`} y2={`${toCoord.y}%`} pathLength={1} stroke="rgba(245,252,225,.95)" strokeWidth="1.2" strokeDasharray="1" strokeLinecap="round" />
              {TRAVEL > 0 && (
                <circle r="7" fill="url(#lab-pl)">
                  <animate attributeName="cx" from={`${fromCoord.x}%`} to={`${toCoord.x}%`} dur={`${TRAVEL}ms`} fill="freeze" calcMode="spline" keySplines="0.45 0 0.2 1" keyTimes="0;1" />
                  <animate attributeName="cy" from={`${fromCoord.y}%`} to={`${toCoord.y}%`} dur={`${TRAVEL}ms`} fill="freeze" calcMode="spline" keySplines="0.45 0 0.2 1" keyTimes="0;1" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur={`${TRAVEL + 80}ms`} fill="freeze" />
                </circle>
              )}
            </g>
          )}
          <defs>
            <radialGradient id="lab-pl">
              <stop offset="0" stopColor="#fafcf0" />
              <stop offset="0.35" stopColor="#c8f14f" stopOpacity="0.85" />
              <stop offset="1" stopColor="#c8f14f" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {states.map((st, idx) => {
          const target = stateIndex === idx;
          const active = target && arrived;
          const isFrom = lastStateIndex === idx && transitioning;
          // PROMPT 36 idle invitation: the node "Step" would enter next
          // breathes a soft halo — anticipation, not a second active state.
          const isNext = !transitioning && !active && (stateIndex + 1) % states.length === idx;

          return (
            <button
              key={st}
              type="button"
              onClick={() => goToState(idx)}
              className={`lab-glow-hover relative z-[2] flex flex-col items-start p-[10px] rounded-[6px] border text-left ${isNext ? "lab-idle-next" : ""}`}
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
                boxShadow: active ? "0 0 18px rgba(200, 241, 79, 0.22), inset 0 0 14px rgba(200,241,79,.08)" : undefined,
                transform: active ? "scale(1.03)" : "scale(1)",
                transition: `transform .55s ${LAB_SPRING}, box-shadow .35s, background .3s, border-color .3s`,
              }}
            >
              {active && lastStateIndex !== null && <span key={hop} className="lab-flash pointer-events-none absolute inset-0 rounded-[6px]" aria-hidden />}
              <div className="flex items-center justify-between w-full mb-[2px]">
                <span className="mono text-[8.5px]" style={{ color: active ? "var(--accent)" : "rgba(244,242,237,0.4)" }}>
                  NODE 0{idx + 1}
                </span>
                <span className="block h-[12px] w-[12px] rounded-full" style={{ background: pointLight(active ? 1 : 0.18), transform: active ? "scale(1)" : "scale(.6)", transition: `transform .5s ${LAB_SPRING}, background .3s` }} />
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
  // PROMPT 42: the type follows the slider on a spring — it tracks the thumb
  // immediately and settles with a small overshoot when the value locks in.
  const weightS = useSpringValue(weight, 0.28, 0.66);
  const wght = Math.round(Math.max(100, Math.min(900, weightS)));

  // Live interpolated tracking, stretch, and kinetic pulse
  const letterSpacing = `${((weightS - 400) / 1600).toFixed(3)}em`;
  const animationDuration = `${(2.2 / Math.max(0.5, speed)).toFixed(2)}s`;

  return (
    <div className="flex flex-col justify-between h-full min-h-[190px]">
      {/* Live Reacting Typography Stage */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center h-[96px] rounded-[6px] border px-[12px]"
        style={{ borderColor: "rgba(244,242,237,0.12)", background: "#0c0c0d" }}
      >
        {/* Kinetic scanning indicator reacting to speed */}
        {/* scan line = the velocity value, rendered as light: glow + core + point-light head */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[8px]">
          <div className="lab-scan absolute top-[1px] h-[6px] w-[38%] rounded-full" style={{ background: "linear-gradient(90deg, transparent, rgba(200,241,79,.55), transparent)", filter: "blur(3px)", animationDuration }} />
          <div className="lab-scan absolute top-[3.5px] h-px w-[38%]" style={{ background: "linear-gradient(90deg, transparent, rgba(245,252,225,.95), transparent)", animationDuration }} />
        </div>

        {/* PROMPT 36 idle invitation: a slow glow bloom behind the type —
            the sketch's "resting breath" while the scan line keeps moving. */}
        <div
          className="lab-bloom pointer-events-none absolute top-1/2 left-1/2 h-[76px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(200,241,79,0.16), transparent 70%)" }}
          aria-hidden
        />

        <p
          className="uppercase select-none text-center font-display"
          style={{
            fontWeight: wght,
            fontSize: "clamp(20px, 2.4vw, 28px)",
            letterSpacing,
            color: "var(--accent)",
            textShadow: `0 0 ${(weightS / 80).toFixed(1)}px rgba(200, 241, 79, 0.4), 0 0 2px rgba(245,252,225,.35)`,
            transform: `scaleY(${(0.95 + weightS / 2000).toFixed(3)})`,
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
            className="lab-range w-[124px] cursor-pointer"
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
            className="lab-range w-[124px] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
