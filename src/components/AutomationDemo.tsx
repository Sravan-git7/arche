import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

const SLUG = "ai-automation";

// 6 Manual Steps for Phase A
const MANUAL_STEPS = [
  { id: "m1", n: "01", title: "Email arrives", target: "inbox" },
  { id: "m2", n: "02", title: "Copy the details", target: "inbox" },
  { id: "m3", n: "03", title: "Update the sheet", target: "sheet" },
  { id: "m4", n: "04", title: "Open the CRM", target: "crm" },
  { id: "m5", n: "05", title: "Send a reply", target: "inbox" },
  { id: "m6", n: "06", title: "Create a task", target: "slack" },
];

// 4 Destination Systems
const DESTINATIONS = [
  {
    id: "inbox",
    name: "INBOX",
    manualLabel: "Email Logged",
    autoLatency: "12ms",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    id: "sheet",
    name: "SHEET",
    manualLabel: "Row Appended",
    autoLatency: "34ms",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    ),
  },
  {
    id: "crm",
    name: "CRM",
    manualLabel: "Deal Created",
    autoLatency: "45ms",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "slack",
    name: "SLACK",
    manualLabel: "Ping Dispatched",
    autoLatency: "18ms",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="3" height="8" x="13" y="2" rx="1.5" />
        <path d="M19 8.5a2.5 2.5 0 0 0-5 0" />
        <rect width="3" height="8" x="8" y="14" rx="1.5" />
        <path d="M5 15.5a2.5 2.5 0 0 0 5 0" />
        <rect width="8" height="3" x="14" y="13" rx="1.5" />
        <path d="M15.5 19a2.5 2.5 0 0 0 0-5" />
        <rect width="8" height="3" x="2" y="8" rx="1.5" />
        <path d="M8.5 5a2.5 2.5 0 0 0 0 5" />
      </svg>
    ),
  },
];

interface ConnectorCoords {
  width: number;
  height: number;
  startX: number;
  startY: number;
  inputStartX: number;
  inputEndX: number;
  inputY: number;
  endpoints: { x: number; y: number }[];
}

export function AutomationDemo({
  active = false,
  isInView: _isInView,
  runKey = 0,
  preview = false,
}: {
  active?: boolean;
  isInView?: boolean;
  runKey?: number;
  preview?: boolean;
}) {
  const [phase, setPhase] = useState<"manual" | "automated">("manual");
  const [phaseProgress, setPhaseProgress] = useState(0); // 0 to 1 inside current phase
  const [manualSeconds, setManualSeconds] = useState("0.0s");
  const [userSelectedPhase, setUserSelectedPhase] = useState<"manual" | "automated" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const aiCoreRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [coords, setCoords] = useState<ConnectorCoords>({
    width: 600,
    height: 260,
    startX: 240,
    startY: 130,
    inputStartX: 0,
    inputEndX: 164,
    inputY: 130,
    endpoints: [
      { x: 380, y: 35 },
      { x: 380, y: 98 },
      { x: 380, y: 162 },
      { x: 380, y: 225 },
    ],
  });

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Exact Edge-to-Edge Coordinate Measurement via ResizeObserver
  const updateCoords = () => {
    if (!containerRef.current || !aiCoreRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();
    const aiRect = aiCoreRef.current.getBoundingClientRect();

    if (cRect.width === 0 || cRect.height === 0) return;

    const startX = aiRect.right - cRect.left;
    const startY = aiRect.top - cRect.top + aiRect.height / 2;
    const inputStartX = 0;
    const inputEndX = aiRect.left - cRect.left;
    const inputY = startY;

    const endpoints: { x: number; y: number }[] = [];
    cardRefs.current.forEach((el) => {
      if (el) {
        const r = el.getBoundingClientRect();
        endpoints.push({
          x: r.left - cRect.left,
          y: r.top - cRect.top + r.height / 2,
        });
      }
    });

    if (endpoints.length === 4) {
      setCoords({
        width: cRect.width,
        height: cRect.height,
        startX,
        startY,
        inputStartX,
        inputEndX,
        inputY,
        endpoints,
      });
    }
  };

  useLayoutEffect(() => {
    updateCoords();
  }, [phase]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateCoords();

    const ro = new ResizeObserver(() => {
      updateCoords();
    });
    ro.observe(el);

    window.addEventListener("resize", updateCoords);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateCoords);
    };
  }, []);

  // 2-Phase Automatic Sequence Loop (Manual: 4.2s, Automated: 4.5s -> ~8.7s cycle)
  useEffect(() => {
    if (prefersReducedMotion() || !active) {
      setPhase("automated");
      setPhaseProgress(1);
      setManualSeconds("10.9s");
      return;
    }

    markPreviewPlayed(SLUG);

    const DURATION_MANUAL = 4200;
    const DURATION_AUTOMATED = 4500;
    const TOTAL_CYCLE = DURATION_MANUAL + DURATION_AUTOMATED;

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) % TOTAL_CYCLE;

      if (userSelectedPhase) {
        // User manually clicked one tab, run that phase specifically
        if (userSelectedPhase === "manual") {
          setPhase("manual");
          const p = (elapsed % DURATION_MANUAL) / DURATION_MANUAL;
          setPhaseProgress(p);
          setManualSeconds(`${(p * 10.9).toFixed(1)}s`);
        } else {
          setPhase("automated");
          const p = (elapsed % DURATION_AUTOMATED) / DURATION_AUTOMATED;
          setPhaseProgress(p);
        }
      } else {
        // Automatic 2-phase sequence
        if (elapsed < DURATION_MANUAL) {
          setPhase("manual");
          const p = elapsed / DURATION_MANUAL;
          setPhaseProgress(p);
          setManualSeconds(`${(p * 10.9).toFixed(1)}s`);
        } else {
          setPhase("automated");
          const p = (elapsed - DURATION_MANUAL) / DURATION_AUTOMATED;
          setPhaseProgress(p);
          if (!preview && p > 0.9) {
            announcePreviewDone(SLUG);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    startTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, preview, userSelectedPhase]);

  // Viewport/key reset
  useEffect(() => {
    setPhase("manual");
    setPhaseProgress(0);
    setManualSeconds("0.0s");
    setUserSelectedPhase(null);
    startTimeRef.current = performance.now();
  }, [active, runKey]);

  const handleSelectPhase = (selected: "manual" | "automated") => {
    setUserSelectedPhase(selected);
    setPhase(selected);
    setPhaseProgress(0);
    startTimeRef.current = performance.now();
  };

  const handleRunAgain = () => {
    setUserSelectedPhase(null);
    setPhase("manual");
    setPhaseProgress(0);
    setManualSeconds("0.0s");
    startTimeRef.current = performance.now();
  };

  // Phase A calculations
  const manualStepActiveIndex = Math.min(
    MANUAL_STEPS.length - 1,
    Math.floor(phaseProgress * MANUAL_STEPS.length)
  );

  // Phase B calculations
  // Input line travel: 0 to 0.2 (~180ms)
  const inputProgress = Math.min(1, phaseProgress / 0.16);
  // Core excitation: 0.16 to 0.28
  const isCoreExcited = phaseProgress >= 0.16 && phaseProgress < 0.45;
  // Bezier fan-out travel: 0.25 to 0.55 (~600ms, well under 0.8s)
  const beamProgress = Math.min(1, Math.max(0, (phaseProgress - 0.22) / 0.26));
  // All 4 cards illuminated and updated:
  const isAutoUpdated = phaseProgress >= 0.48;

  // Compute position of light comets along the 4 cubic Bezier curves
  const getCubicPoint = (
    t: number,
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number]
  ): [number, number] => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
    const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];
    return [x, y];
  };

  return (
    <div
      className="automation-demo relative flex flex-col justify-between w-full h-full p-3 sm:p-5 select-none rounded-2xl border border-white/[0.08]"
      style={{
        background: "#080B07",
        backgroundImage:
          "radial-gradient(ellipse 75% 60% at 20% 0%, rgba(158,228,26,0.11), transparent 65%), radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 18px 18px",
      }}
      aria-label="Full-Width Auto-Switching AI Automation Console"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP STUDIO BAR: SEGMENTED PILL TOGGLE + RUNNING/REPLAY     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-white/[0.08]">
        {/* Segmented Pill Toggle [ MANUAL | AUTOMATED ] */}
        <div
          className="flex items-center rounded-full p-0.5 border"
          style={{
            background: "rgba(18, 23, 17, 0.88)",
            borderColor: "rgba(255,255,255,0.09)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <button
            type="button"
            onClick={() => handleSelectPhase("manual")}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-[9px] font-semibold tracking-wider transition-all cursor-pointer"
            style={{
              background: phase === "manual" ? "#161C14" : "transparent",
              border: phase === "manual" ? "1px solid rgba(158,228,26,0.35)" : "1px solid transparent",
              color: phase === "manual" ? "#9EE41A" : "#8A8D89",
              boxShadow: phase === "manual" ? "0 0 14px rgba(158,228,26,0.2)" : "none",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: phase === "manual" ? "#9EE41A" : "rgba(255,255,255,0.2)",
              }}
            />
            <span>MANUAL</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPhase("automated")}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-[9px] font-semibold tracking-wider transition-all cursor-pointer"
            style={{
              background: phase === "automated" ? "#161C14" : "transparent",
              border: phase === "automated" ? "1px solid rgba(158,228,26,0.35)" : "1px solid transparent",
              color: phase === "automated" ? "#9EE41A" : "#8A8D89",
              boxShadow: phase === "automated" ? "0 0 14px rgba(158,228,26,0.2)" : "none",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: phase === "automated" ? "#9EE41A" : "rgba(255,255,255,0.2)",
              }}
            />
            <span>AUTOMATED</span>
          </button>
        </div>

        {/* Live Status Indicator & Replay Button */}
        <div className="flex items-center gap-2">
          {/* Phase Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1 border font-mono text-[9px] font-semibold text-[#CBD1C5]"
            style={{
              background: "rgba(18, 23, 17, 0.82)",
              borderColor: "rgba(255,255,255,0.09)",
            }}
          >
            <span className="text-[#8A8D89]">PHASE:</span>
            <span className="text-[#9EE41A] font-bold">
              {phase === "manual" ? "01 MANUAL DRAG" : "02 INSTANT AUTONOMY"}
            </span>
          </div>

          {/* Running / Run Again Button */}
          <button
            type="button"
            onClick={handleRunAgain}
            className="flex items-center gap-1.5 rounded-md px-3 py-1 border font-mono text-[9px] font-bold tracking-wider cursor-pointer transition-all"
            style={{
              background: "rgba(18, 23, 17, 0.88)",
              borderColor: "rgba(255,255,255,0.09)",
              color: "#CBD1C5",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
            <span>RUN AGAIN</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE CONTAINER (Smooth 0.35s Crossfade)          */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full my-auto py-3">
        {/* =========================================================== */}
        {/* PHASE A — MANUAL (~4.2s)                                    */}
        {/* =========================================================== */}
        <div
          className="transition-all duration-350 ease-out"
          style={{
            display: phase === "manual" ? "block" : "none",
            opacity: phase === "manual" ? 1 : 0,
            transform: phase === "manual" ? "scale(1)" : "scale(0.985)",
          }}
        >
          {/* Sub-Header: YOU · 6 MANUAL STEPS vs RESULT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pb-2 font-mono text-[9px] font-bold text-[#8A8D89] uppercase tracking-wider">
            <div className="md:col-span-7 flex items-center justify-between">
              <span className="text-[#F59E0B] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                YOU · 6 MANUAL STEPS
              </span>
              <span className="text-[#F59E0B] font-mono">
                SIMULATED · {manualSeconds}
              </span>
            </div>
            <div className="md:col-span-5 hidden md:flex items-center justify-between">
              <span>RESULT</span>
              <span className="text-[#8A8D89]">SLUGGISH UPDATE</span>
            </div>
          </div>

          {/* 2-Column Split: 58% Steps | 42% Destination Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch min-h-[265px]">
            {/* Left Column (58% -> md:col-span-7): 6 Step Rows */}
            <div className="md:col-span-7 flex flex-col justify-between gap-1.5">
              {MANUAL_STEPS.map((step, idx) => {
                const isPast = manualStepActiveIndex > idx;
                const isCurrent = manualStepActiveIndex === idx;

                return (
                  <div
                    key={step.id}
                    className="rounded-lg px-3 py-2 border flex items-center justify-between transition-all duration-300"
                    style={{
                      background: isCurrent
                        ? "rgba(245, 158, 11, 0.12)"
                        : isPast
                          ? "rgba(255, 255, 255, 0.03)"
                          : "rgba(255, 255, 255, 0.015)",
                      borderColor: isCurrent
                        ? "rgba(245, 158, 11, 0.45)"
                        : isPast
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(255, 255, 255, 0.04)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: isCurrent
                            ? "#F59E0B"
                            : isPast
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(255,255,255,0.05)",
                          color: isCurrent ? "#0B0C0A" : "#8A8D89",
                        }}
                      >
                        {step.n}
                      </span>
                      <span
                        className="font-sans text-[11px] font-semibold"
                        style={{
                          color: isCurrent ? "#F59E0B" : isPast ? "#C9CEC3" : "#6E726A",
                        }}
                      >
                        {step.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[8px]">
                      {isPast && <span className="text-[#10B981] font-bold">DONE</span>}
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-[#F59E0B] font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] animate-spin" />
                          <span>TYPING...</span>
                        </span>
                      )}
                      {!isPast && !isCurrent && <span className="text-[#6E726A]">WAITING</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column (42% -> md:col-span-5): 4 Destination Cards (Manual) */}
            <div className="md:col-span-5 flex flex-col justify-between gap-2">
              {DESTINATIONS.map((dest, idx) => {
                const isUpdated = manualStepActiveIndex >= idx + 1;

                return (
                  <div
                    key={dest.id}
                    className="rounded-lg p-2.5 border flex items-center justify-between transition-all duration-300"
                    style={{
                      background: isUpdated ? "rgba(25, 30, 24, 0.9)" : "rgba(18, 23, 17, 0.75)",
                      borderColor: isUpdated ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-[#8A8D89]">{dest.icon}</div>
                      <div>
                        <div className="font-sans font-bold text-[10.5px] text-[#F4F1E0]">
                          {dest.name}
                        </div>
                        <div className="font-mono text-[7.5px] text-[#8A8D89]">
                          {isUpdated ? dest.manualLabel : "Waiting on human"}
                        </div>
                      </div>
                    </div>

                    <span
                      className="font-mono text-[8px] font-bold px-2 py-0.5 rounded transition-colors"
                      style={{
                        background: isUpdated ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                        color: isUpdated ? "#CBD1C5" : "#6E726A",
                      }}
                    >
                      {isUpdated ? "UPDATED" : "WAITING"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================== */}
        {/* PHASE B — AUTOMATED (~4.5s)                                 */}
        {/* =========================================================== */}
        <div
          className="transition-all duration-350 ease-out"
          style={{
            display: phase === "automated" ? "block" : "none",
            opacity: phase === "automated" ? 1 : 0,
            transform: phase === "automated" ? "scale(1)" : "scale(0.985)",
          }}
        >
          {/* Sub-Header: SYSTEM · 1 EVENT vs RESULT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pb-2 font-mono text-[9px] font-bold text-[#8A8D89] uppercase tracking-wider">
            <div className="md:col-span-7 flex items-center justify-between">
              <span className="text-[#9EE41A] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
                SYSTEM · 1 EVENT
              </span>
              <span className="text-[#9EE41A] font-mono">
                TRIGGER: INBOUND RFQ
              </span>
            </div>
            <div className="md:col-span-5 hidden md:flex items-center justify-between">
              <span>RESULT</span>
              <span className="text-[#9EE41A]">ALL 4 SYSTEMS SYNCED</span>
            </div>
          </div>

          {/* Unified Aligned Coordinate Layout */}
          <div
            ref={containerRef}
            className="relative grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch min-h-[265px]"
          >
            {/* SVG Bezier Overlay connecting AI core to 4 destination cards with ZERO GAP */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none hidden md:block z-10"
              style={{ overflow: "visible" }}
            >
              <defs>
                <filter id="autoGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Input Line: Left Edge to AI Core */}
              <line
                x1={coords.inputStartX}
                y1={coords.inputY}
                x2={coords.inputEndX}
                y2={coords.inputY}
                stroke={inputProgress > 0.1 ? "#9EE41A" : "rgba(255,255,255,0.12)"}
                strokeWidth="2"
              />

              {/* Traveling Light Comet on Input Line */}
              {phaseProgress < 0.22 && (
                <circle
                  cx={coords.inputStartX + (coords.inputEndX - coords.inputStartX) * inputProgress}
                  cy={coords.inputY}
                  r="4.5"
                  fill="#9EE41A"
                  filter="url(#autoGlow)"
                />
              )}

              {/* 4 Fan-Out Cubic Bezier Curves (AI Core Right Edge -> 4 Cards Left Edges) */}
              {coords.endpoints.map((ep, idx) => {
                const p0: [number, number] = [coords.startX, coords.startY];
                const p1: [number, number] = [
                  coords.startX + (ep.x - coords.startX) * 0.45,
                  coords.startY,
                ];
                const p2: [number, number] = [
                  coords.startX + (ep.x - coords.startX) * 0.55,
                  ep.y,
                ];
                const p3: [number, number] = [ep.x, ep.y];

                const pathD = `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;

                // Comet position along curve
                const cometPt = getCubicPoint(beamProgress, p0, p1, p2, p3);

                return (
                  <g key={idx}>
                    {/* Underlying Rail */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isAutoUpdated ? "rgba(158,228,26,0.35)" : "rgba(255,255,255,0.1)"}
                      strokeWidth="2"
                    />

                    {/* Animated Traveling Comet Pulses */}
                    {phaseProgress >= 0.22 && phaseProgress < 0.52 && (
                      <>
                        <circle
                          cx={cometPt[0]}
                          cy={cometPt[1]}
                          r="4.5"
                          fill="#9EE41A"
                          filter="url(#autoGlow)"
                        />
                        <circle
                          cx={cometPt[0]}
                          cy={cometPt[1]}
                          r="7.5"
                          fill="#9EE41A"
                          opacity="0.3"
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Left / Center Flow Area (58% -> md:col-span-7) */}
            <div className="md:col-span-7 relative flex items-center justify-between p-2">
              {/* Inbound Lead Indicator at Left Edge */}
              <div
                className="z-20 rounded-lg p-2.5 border flex flex-col justify-center transition-all duration-300"
                style={{
                  background: "rgba(22, 32, 19, 0.95)",
                  borderColor: inputProgress > 0 ? "#9EE41A" : "rgba(255,255,255,0.1)",
                  boxShadow: inputProgress > 0 ? "0 0 14px rgba(158,228,26,0.25)" : "none",
                }}
              >
                <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold text-[#9EE41A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
                  <span>INBOUND</span>
                </div>
                <div className="font-sans font-bold text-[10.5px] text-[#F4F1E0] mt-0.5">
                  RFQ Web Form
                </div>
              </div>

              {/* Center AI Core: 76px x 76px, circular dark-glass with zero emojis */}
              <div className="relative flex flex-col items-center justify-center my-auto z-20">
                <div
                  ref={aiCoreRef}
                  className="rounded-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300"
                  style={{
                    width: "76px",
                    height: "76px",
                    background:
                      "radial-gradient(circle at center, rgba(158,228,26,0.22) 0%, rgba(14, 18, 13, 0.96) 72%)",
                    border: "1.5px solid #9EE41A",
                    boxShadow: isCoreExcited
                      ? "0 0 32px rgba(158,228,26,0.45), inset 0 1px 0 rgba(255,255,255,0.3)"
                      : "0 0 20px rgba(158,228,26,0.22), inset 0 1px 0 rgba(255,255,255,0.15)",
                    transform: isCoreExcited ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span
                    className="font-sans font-extrabold text-xl tracking-tight text-[#F4F1E0]"
                    style={{ textShadow: "0 0 12px rgba(158,228,26,0.5)" }}
                  >
                    AI
                  </span>
                </div>

                {/* Subtle Monospace Caption */}
                <div className="font-mono text-[8px] font-semibold text-[#8A8D89] tracking-wider uppercase mt-2">
                  READS · DECIDES · ROUTES
                </div>
              </div>

              {/* Spacer on right so AI core is centered in the 58% column */}
              <div className="w-[10px] hidden md:block" />
            </div>

            {/* Right Destination Stack (42% -> md:col-span-5) */}
            <div className="md:col-span-5 flex flex-col justify-between gap-2 z-20">
              {DESTINATIONS.map((dest, idx) => (
                <div
                  key={dest.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  className="rounded-lg p-2.5 border flex items-center justify-between transition-all duration-300"
                  style={{
                    background: isAutoUpdated
                      ? "rgba(22, 34, 18, 0.95)"
                      : "rgba(18, 23, 17, 0.8)",
                    borderColor: isAutoUpdated ? "#9EE41A" : "rgba(255,255,255,0.08)",
                    boxShadow: isAutoUpdated
                      ? "0 0 16px rgba(158,228,26,0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
                      : "none",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={isAutoUpdated ? "text-[#9EE41A]" : "text-[#8A8D89]"}>
                      {dest.icon}
                    </div>
                    <div>
                      <div className="font-sans font-bold text-[10.5px] text-[#F4F1E0] flex items-center gap-1.5">
                        <span>{dest.name}</span>
                        <span className="font-mono text-[8.5px] text-[#9EE41A] font-semibold">
                          · {dest.autoLatency}
                        </span>
                      </div>
                      <div className="font-mono text-[7.5px] text-[#8A8D89]">
                        {isAutoUpdated ? "Instant Sync" : "Standby"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono text-[8px] font-bold px-2 py-0.5 rounded transition-all"
                      style={{
                        background: isAutoUpdated
                          ? "rgba(158,228,26,0.2)"
                          : "rgba(255,255,255,0.04)",
                        color: isAutoUpdated ? "#9EE41A" : "#8A8D89",
                      }}
                    >
                      {isAutoUpdated ? "UPDATED ✓" : "WAITING"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM SUBTLE FOOTER BAR (Phase A vs Phase B Dynamic)      */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/[0.08] font-mono text-[8.5px]">
        {phase === "manual" ? (
          <>
            <div className="text-[#8A8D89]">
              <span>AUTO-PREVIEW · MANUAL RUN · </span>
              <span className="text-[#F59E0B] font-bold">10.9s</span>
            </div>
            <div className="text-[#F59E0B] font-bold">
              18 HRS/WK LOST TO DATA ENTRY
            </div>
          </>
        ) : (
          <>
            <div className="text-[#8A8D89]">
              <span>DONE · </span>
              <span className="text-[#9EE41A] font-bold">0.32s · PERSON FREE</span>
            </div>
            <div className="text-[#9EE41A] font-bold">
              MANUAL 10.9s → AUTOMATED 0.32s · 34× FASTER
            </div>
          </>
        )}
      </div>
    </div>
  );
}
