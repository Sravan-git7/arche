import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { KineticWord } from "./Kinetic";

/**
 * PROMPT 13 — 3D System Moment (Signature Pinned Camera-Rail Scene)
 *
 * Spatial Representation of Arche's System Model:
 *   INPUT → INTELLIGENCE → SYSTEM → ACTION → OUTPUT
 *
 * Camera:
 *   Fixed rail controlled 1:1 by scroll progress (pinned sequence).
 *   No orbit controls or free rotate. Tight scroll synchronization.
 *
 * Choreography:
 *   - 5 node clusters along depth axis matching Hero translucent plane material language.
 *   - Current active cluster lights up with lime edge highlight & activation pulse.
 *   - Connecting lines between clusters draw in progressively.
 *   - Previous clusters dim back to idle in the background.
 *   - Hovering active cluster node reveals one-line system label.
 *   - Output stage pulls back and compresses into a compact diagram icon.
 *   - Mobile: Non-pinned simplified 2D vertical flow.
 */

type SystemStageNode = {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  label: string;
  pos: { x: number; y: number; z: number };
};

const STAGES: SystemStageNode[] = [
  {
    id: "input",
    num: "01",
    title: "INPUT",
    subtitle: "Raw Ingestion",
    label: "RAW SIGNAL — ingests inbound unstructured data, events & requests.",
    pos: { x: -160, y: -40, z: -100 },
  },
  {
    id: "intelligence",
    num: "02",
    title: "INTELLIGENCE",
    subtitle: "Context Resolution",
    label: "AI AGENT — reads intent, resolves context & plans action.",
    pos: { x: -80, y: 30, z: 220 },
  },
  {
    id: "system",
    num: "03",
    title: "SYSTEM",
    subtitle: "Kernel & State",
    label: "SYSTEM KERNEL — orchestrates workflows, state logic & fallbacks.",
    pos: { x: 0, y: -30, z: 540 },
  },
  {
    id: "action",
    num: "04",
    title: "ACTION",
    subtitle: "Execution Path",
    label: "EXECUTION PATH — triggers tool calls, API routes & automated tasks.",
    pos: { x: 80, y: 40, z: 860 },
  },
  {
    id: "output",
    num: "05",
    title: "OUTPUT",
    subtitle: "Verified Deliverable",
    label: "DELIVERABLE — verified output, lead capture or clean story edit.",
    pos: { x: 160, y: -20, z: 1180 },
  },
];

export function Architecture3D() {
  const pinSectionRef = useRef<HTMLElement>(null);
  const cameraRailRef = useRef<HTMLDivElement>(null);
  const compressIconRef = useRef<HTMLDivElement>(null);

  const [activeStage, setActiveStage] = useState<number>(0);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [lineDrawProgress, setLineDrawProgress] = useState<number[]>(new Array(4).fill(0));
  const [, setIsPullbackCompressed] = useState(false);

  useLayoutEffect(() => {
    const pinEl = pinSectionRef.current;
    const camEl = cameraRailRef.current;
    if (!pinEl || !camEl || prefersReducedMotion()) return;

    // Mobile check: skip pin and 3D camera rail on touch/mobile devices
    if (!window.matchMedia("(min-width: 900px)").matches) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: "3d-system-pinned-rail",
        trigger: pinEl,
        start: "top top",
        end: "+=250%",
        pin: true,
        scrub: true, // 1:1 tight scroll synchronization (no delay/desync)
        onUpdate: (self) => {
          const progress = self.progress;

          // Determine current active stage (0 to 4 across 5 stages)
          const stageIdx = Math.min(4, Math.floor(progress * 5));
          setActiveStage(stageIdx);

          // Connective line progress for 4 connecting lines
          const lineProgs = [0, 1, 2, 3].map((i) => {
            const startP = i * 0.2;
            const endP = (i + 1) * 0.2;
            if (progress <= startP) return 0;
            if (progress >= endP) return 1;
            return (progress - startP) / (endP - startP);
          });
          setLineDrawProgress(lineProgs);

          // Camera Rail 3D Position
          // Rail moves camera along depth axis Z, with subtle curved path tracking
          const targetZ = -progress * 1050;
          const targetX = Math.sin(progress * Math.PI) * 45;
          const targetY = Math.cos(progress * Math.PI * 0.5) * 25;

          // Final pull-back compression at OUTPUT cluster (progress > 0.88)
          const pullback = progress > 0.88;
          setIsPullbackCompressed(pullback);

          const scale = pullback ? 1 - (progress - 0.88) * 4.0 : 1;
          const rotateY = (progress - 0.5) * 12;

          gsap.set(camEl, {
            transform: `translate3d(${targetX}px, ${targetY}px, ${targetZ}px) rotateY(${rotateY}deg) scale(${scale})`,
          });

          // Compress icon animation at end of section
          if (compressIconRef.current) {
            gsap.set(compressIconRef.current, {
              scale: pullback ? (progress - 0.88) * 8.0 : 0,
              opacity: pullback ? (progress - 0.88) * 8.0 : 0,
            });
          }
        },
      });
    }, pinEl);

    return () => ctx.revert();
  }, []);

  const currentDisplayStage = hoveredStage !== null ? hoveredStage : activeStage;
  const currentMod = STAGES[currentDisplayStage];

  return (
    <section
      ref={pinSectionRef}
      id="system-architecture"
      className="relative w-full overflow-hidden py-[clamp(60px,8vw,120px)] border-t border-b"
      style={{ borderColor: "var(--line)", background: "var(--bg)" }}
    >
      <div className="wrap flex flex-col justify-between min-h-[85vh]">
        {/* Header & Kinetic Title */}
        <div className="flex flex-col gap-[12px] z-[10]">
          <div className="flex items-center gap-[10px]">
            <span className="mono mono-a">03 // SPATIAL ARCHITECTURE</span>
            <span className="mono">·</span>
            <span className="mono">5-STAGE SYSTEM MODEL</span>
          </div>
          <KineticWord
            word="SYSTEM MODEL"
            mode="assemble"
            className="block select-none"
            style={{
              fontSize: "clamp(38px,8vw,120px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
            }}
          />
          <p className="body max-w-[54ch]">
            Scroll to navigate the fixed 3D camera rail through Arche's 5 core system stages: <strong className="text-[var(--fg)]">INPUT → INTELLIGENCE → SYSTEM → ACTION → OUTPUT</strong>.
          </p>
        </div>

        {/* Desktop 3D Camera-Rail Spatial Scene */}
        <div className="relative my-[20px] hidden min-[900px]:block h-[500px] w-full overflow-hidden rounded-[8px] border" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
          {/* Subtle Grid Base */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Perspective 3D Scene Viewport */}
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ perspective: 1300, transformStyle: "preserve-3d" }}
          >
            <div
              ref={cameraRailRef}
              className="relative h-full w-full"
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform",
                transition: "transform 0.1s linear",
              }}
            >
              {/* Connective Lines SVG in 3D Space */}
              <svg
                className="absolute inset-0 h-full w-full pointer-events-none z-[2]"
                style={{ transformStyle: "preserve-3d" }}
                aria-hidden
              >
                {STAGES.slice(1).map((node, i) => {
                  const prev = STAGES[i];
                  const activeLine = activeStage > i;
                  const lineProg = lineDrawProgress[i] || 0;

                  return (
                    <line
                      key={`line-${prev.id}-${node.id}`}
                      x1={`${50 + (prev.pos.x / 1000) * 100}%`}
                      y1={`${50 + (prev.pos.y / 600) * 100}%`}
                      x2={`${50 + (node.pos.x / 1000) * 100}%`}
                      y2={`${50 + (node.pos.y / 600) * 100}%`}
                      stroke={activeLine ? "var(--accent-deep)" : "var(--line)"}
                      strokeWidth={activeLine ? "2.5" : "1.2"}
                      strokeDasharray="8 4"
                      style={{
                        strokeDashoffset: (1 - lineProg) * 20,
                        transition: "stroke 0.4s, stroke-width 0.4s",
                      }}
                    />
                  );
                })}
              </svg>

              {/* 5 Spatial Node Clusters */}
              {STAGES.map((st, i) => {
                const isActive = activeStage === i;
                const isPast = activeStage > i;
                const isHovered = hoveredStage === i;

                return (
                  <div
                    key={st.id}
                    className="absolute cursor-pointer transition-all duration-500"
                    style={{
                      left: `calc(50% + ${st.pos.x}px)`,
                      top: `calc(50% + ${st.pos.y}px)`,
                      transform: `translate3d(-50%, -50%, ${st.pos.z}px)`,
                      transformStyle: "preserve-3d",
                      zIndex: isActive ? 20 : 10 - i,
                    }}
                    onMouseEnter={() => setHoveredStage(i)}
                    onMouseLeave={() => setHoveredStage(null)}
                  >
                    {/* Stacked Plane Cluster matching Hero planes */}
                    <div
                      className="group relative flex flex-col justify-between p-[16px] rounded-[6px] border transition-all duration-500"
                      style={{
                        width: 190,
                        height: 120,
                        background: isActive
                          ? "rgba(255, 255, 255, 0.95)"
                          : isPast
                          ? "rgba(255, 255, 255, 0.45)"
                          : "rgba(255, 255, 255, 0.25)",
                        borderColor: isActive
                          ? "var(--accent-deep)"
                          : isPast
                          ? "rgba(12, 12, 13, 0.25)"
                          : "var(--line)",
                        boxShadow: isActive
                          ? "0 0 24px color-mix(in srgb, var(--accent-deep) 35%, transparent)"
                          : "none",
                        opacity: isActive ? 1 : isHovered ? 0.75 : isPast ? 0.55 : 0.3,
                        scale: isActive ? 1.08 : isHovered ? 1.04 : 1.0,
                      }}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className="mono text-[10px] font-bold"
                          style={{
                            color: isActive ? "var(--accent-deep)" : "var(--fg)",
                          }}
                        >
                          {st.num} // {st.title}
                        </span>
                        <span
                          className={`block h-[7px] w-[7px] rounded-full ${isActive ? "demo-pulse" : ""}`}
                          style={{
                            background: isActive
                              ? "var(--accent-deep)"
                              : isPast
                              ? "var(--fg)"
                              : "var(--faint)",
                          }}
                        />
                      </div>

                      {/* Subtitle */}
                      <p className="mono text-[9px]" style={{ color: "var(--muted)" }}>
                        {st.subtitle}
                      </p>

                      {/* Active Indicator Pulse Ring */}
                      {isActive && (
                        <span
                          className="signal-dot absolute -top-[4px] -right-[4px]"
                          style={{ width: 8, height: 8 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compress Icon Overlay (End of Rail Pullback) */}
          <div
            ref={compressIconRef}
            data-system-compress-icon="1"
            className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 z-[30]"
          >
            <div className="flex flex-col items-center gap-[10px] p-[20px] rounded-[8px] border" style={{ borderColor: "var(--accent-deep)", background: "var(--card)" }}>
              <div className="flex items-center gap-[8px]">
                {STAGES.map((s) => (
                  <span key={s.id} className="signal-dot" style={{ width: 8, height: 8 }} />
                ))}
              </div>
              <span className="mono mono-a text-[11px]">SYSTEM CONVERGED → PROCESS</span>
            </div>
          </div>
        </div>

        {/* Active Stage One-Line Label Footer Panel */}
        <div className="mt-[16px] flex flex-col gap-[12px] rounded-[6px] border p-[18px]" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-[12px] border-b pb-[12px]" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-[12px]">
              <span className="mono mono-a text-[12px] font-bold">{currentMod.num}</span>
              <span className="d4">{currentMod.title}</span>
              <span className="mono" style={{ color: "var(--muted)" }}>({currentMod.subtitle})</span>
            </div>
            <div className="flex items-center gap-[6px]">
              {STAGES.map((st, i) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStage(i)}
                  className="mono text-[10px] px-[8px] py-[3px] rounded-full border transition-all"
                  style={{
                    borderColor: activeStage === i ? "var(--accent-deep)" : "var(--line)",
                    background: activeStage === i ? "var(--accent-deep)" : "transparent",
                    color: activeStage === i ? "#0c0c0d" : "var(--muted)",
                  }}
                >
                  {st.num}
                </button>
              ))}
            </div>
          </div>
          <p className="mono mono-fg text-[12px] font-medium" style={{ color: "var(--accent-deep)" }}>
            {currentMod.label}
          </p>
        </div>

        {/* Mobile Fallback: Simplified 2D Vertical Sequence */}
        <div className="mt-[24px] flex flex-col gap-[16px] min-[900px]:hidden">
          {STAGES.map((st, i) => (
            <div
              key={`mobile-${st.id}`}
              className="flex flex-col gap-[8px] rounded-[6px] border p-[16px]"
              style={{
                borderColor: activeStage === i ? "var(--accent-deep)" : "var(--line)",
                background: "var(--card)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="mono mono-a">{st.num} // {st.title}</span>
                <span className="mono text-[10px]">{st.subtitle}</span>
              </div>
              <p className="body-s">{st.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
