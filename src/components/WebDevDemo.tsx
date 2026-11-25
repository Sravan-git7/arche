import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

const SLUG = "web-development";

export const STAGES = [
  { id: "wireframe", label: "01 WIREFRAME", name: "Architecture" },
  { id: "design", label: "02 DESIGN", name: "Visual Craft" },
  { id: "speed", label: "03 BUILD & SPEED", name: "Performance" },
  { id: "converting", label: "04 LIVE & CONVERTING", name: "Conversion" },
] as const;

// Backward-compatibility export
export const MODES = ["BLUEPRINT", "CRAFT", "LIVE"] as const;

export function WebDevDemo({
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
  const [activeStage, setActiveStage] = useState<number>(0); // 0 to 3
  const [cursorPos, setCursorPos] = useState({ x: 75, y: 70, visible: false, clicked: false });
  const [isBooked, setIsBooked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // 12.8-Second Choreography Loop (4 stages x 3.2s)
  useEffect(() => {
    if (prefersReducedMotion() || !active || userInteracted) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    markPreviewPlayed(SLUG);

    const STAGE_DURATION = 3200; // 3.2s per stage
    const TOTAL_LOOP_MS = STAGE_DURATION * 4; // 12.8s total

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) % TOTAL_LOOP_MS;
      const currentStage = Math.floor(elapsed / STAGE_DURATION);
      const stageElapsed = elapsed % STAGE_DURATION;

      setActiveStage(currentStage);

      // Stage 0: WIREFRAME
      if (currentStage === 0) {
        setCursorPos({ x: 75, y: 70, visible: false, clicked: false });
        setIsBooked(false);
        setShowToast(false);
      }
      // Stage 1: DESIGN
      else if (currentStage === 1) {
        setCursorPos({ x: 75, y: 70, visible: false, clicked: false });
        setIsBooked(false);
        setShowToast(false);
      }
      // Stage 2: BUILD & SPEED
      else if (currentStage === 2) {
        setCursorPos({ x: 75, y: 70, visible: false, clicked: false });
        setIsBooked(false);
        setShowToast(false);
      }
      // Stage 3: LIVE & CONVERTING
      else {
        // Cursor glides in: 0 to 1400ms
        if (stageElapsed < 1400) {
          const t = stageElapsed / 1400;
          setCursorPos({
            x: 75 - (75 - 46) * t,
            y: 70 - (70 - 48) * t,
            visible: true,
            clicked: false,
          });
          setIsBooked(false);
          setShowToast(false);
        }
        // Cursor clicks button: 1400ms to 1800ms
        else if (stageElapsed < 1800) {
          setCursorPos({ x: 46, y: 48, visible: true, clicked: true });
          setIsBooked(true);
          setShowToast(true);
        }
        // Toast and confirmed state sustained: 1800ms to 3200ms
        else {
          setCursorPos({ x: 46, y: 48, visible: true, clicked: false });
          setIsBooked(true);
          setShowToast(true);
          if (!preview && stageElapsed > 2800) {
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
  }, [active, userInteracted, preview]);

  // Reset on viewport or key changes
  useEffect(() => {
    setActiveStage(0);
    setCursorPos({ x: 75, y: 70, visible: false, clicked: false });
    setIsBooked(false);
    setShowToast(false);
    setUserInteracted(false);
    startTimeRef.current = performance.now();
  }, [active, runKey]);

  const handleSelectStage = (idx: number) => {
    setUserInteracted(true);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setActiveStage(idx);
    if (idx === 3) {
      setCursorPos({ x: 46, y: 48, visible: true, clicked: false });
      setIsBooked(true);
      setShowToast(true);
    } else {
      setCursorPos({ x: 75, y: 70, visible: false, clicked: false });
      setIsBooked(false);
      setShowToast(false);
    }
  };

  return (
    <div
      className="web-dev-demo relative flex flex-col justify-between w-full h-full p-2.5 sm:p-4 select-none rounded-2xl border border-white/[0.08]"
      style={{
        background: "#080B07",
        backgroundImage:
          "radial-gradient(ellipse 75% 60% at 20% 0%, rgba(158,228,26,0.11), transparent 65%), radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 18px 18px",
      }}
      aria-label="Interactive Web Development Pipeline Stage"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP STUDIO CONTROL & STAGE SWITCHER                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-white/[0.08]">
        {/* Stage Tabs (Clickable, Auto-advancing) */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scroll">
          {STAGES.map((s, idx) => {
            const isCurrent = activeStage === idx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectStage(idx)}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold tracking-wider transition-all border cursor-pointer whitespace-nowrap"
                style={{
                  background: isCurrent ? "rgba(158,228,26,0.14)" : "rgba(18, 23, 17, 0.82)",
                  borderColor: isCurrent ? "#9EE41A" : "rgba(255,255,255,0.09)",
                  color: isCurrent ? "#9EE41A" : "#8A8D89",
                  boxShadow: isCurrent
                    ? "0 0 12px rgba(158,228,26,0.2), inset 0 1px 0 rgba(255,255,255,0.12)"
                    : "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: isCurrent ? "#9EE41A" : "rgba(255,255,255,0.2)" }}
                />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Telemetry Badges */}
        <div className="flex items-center gap-2">
          {/* Active Stage Indicator */}
          <div
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 border font-mono text-[9px] font-semibold text-[#CBD1C5]"
            style={{
              background: "rgba(18, 23, 17, 0.82)",
              borderColor: "rgba(255,255,255,0.09)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
            <span className="text-[#9EE41A] font-bold">
              {activeStage === 0 && "CONVERSION ARCHITECTURE"}
              {activeStage === 1 && "LUXURY VISUAL CRAFT"}
              {activeStage === 2 && "0.4s SPEED & 99 PERF"}
              {activeStage === 3 && "INBOUND CONVERTING ✓"}
            </span>
          </div>

          {/* Auto/Interactive Status */}
          <button
            type="button"
            onClick={() => {
              setUserInteracted(false);
              startTimeRef.current = performance.now();
            }}
            className="hidden sm:flex items-center gap-1 rounded-md px-2 py-1 border font-mono text-[9px] font-semibold cursor-pointer transition-colors"
            style={{
              background: "rgba(18, 23, 17, 0.82)",
              borderColor: "rgba(255,255,255,0.09)",
              color: userInteracted ? "#8A8D89" : "#9EE41A",
            }}
            title={userInteracted ? "Click to resume auto-cycle" : "Auto-cycling"}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${userInteracted ? "bg-[#8A8D89]" : "bg-[#9EE41A] animate-pulse"}`}
            />
            <span>{userInteracted ? "RESUME AUTO" : "AUTO"}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE (Desktop Stage 68% | Business Impact 32%)   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-3 items-stretch">
        {/* Left: Desktop Browser Stage (~68% -> lg:col-span-8) */}
        <div
          className="lg:col-span-8 relative flex flex-col rounded-xl border overflow-hidden shadow-2xl"
          style={{
            background: "#0B0F0A",
            borderColor: "rgba(255,255,255,0.09)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 40px -12px rgba(0,0,0,0.6)",
          }}
        >
          {/* Browser Chrome Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#121711] border-b border-white/[0.08] z-20">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]/80" />
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]/80" />
              <span className="h-2 w-2 rounded-full bg-[#10B981]/80" />
            </div>

            {/* URL Pill */}
            <div className="flex items-center gap-1.5 rounded-full bg-[#0A0D09] px-3 py-0.5 border border-white/[0.08] font-mono text-[9px] text-[#8A8D89] max-w-[240px] truncate">
              <span className="text-[#9EE41A]">🔒</span>
              <span className="text-[#CBD1C5]">arche.studio/flagship</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[8.5px] text-[#8A8D89]">
              <span className="hidden sm:inline">1440 × 900</span>
              <span className="text-[#9EE41A] font-bold">STAGE 0{activeStage + 1}</span>
            </div>
          </div>

          {/* Browser Viewport: ONLY ONE ACTIVE STAGE RENDERED AT A TIME (ZERO OVERLAP) */}
          <div className="relative w-full h-[330px] sm:h-[350px] overflow-hidden select-none bg-[#0B0F0A]">
            {/* --------------------------------------------------------- */}
            {/* STAGE 01: WIREFRAME (Architectural Planning Skeleton)     */}
            {/* --------------------------------------------------------- */}
            {activeStage === 0 && (
              <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between bg-[#0B0F0A] animate-fadeIn">
                {/* Blueprint Grid Watermark */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(158,228,26,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(158,228,26,0.2) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* Wireframe Nav Skeleton */}
                <div className="flex items-center justify-between border-b border-dashed border-white/20 pb-2.5 z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 rounded border border-dashed border-[#9EE41A]/60 bg-[#9EE41A]/[0.06] flex items-center justify-center font-mono text-[8px] font-bold text-[#9EE41A]">
                      [ LOGO ]
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-12 rounded border border-dashed border-white/20 bg-white/[0.02]" />
                    <div className="h-4 w-12 rounded border border-dashed border-white/20 bg-white/[0.02]" />
                    <div className="h-4 w-12 rounded border border-dashed border-white/20 bg-white/[0.02]" />
                  </div>
                  <div className="h-5 w-24 rounded border border-dashed border-[#9EE41A]/60 bg-[#9EE41A]/[0.08] flex items-center justify-center font-mono text-[8px] font-bold text-[#9EE41A]">
                    [ CTA BUTTON ]
                  </div>
                </div>

                {/* Wireframe Hero Skeleton */}
                <div className="my-auto space-y-3.5 py-1 z-10">
                  <div className="inline-flex items-center gap-1.5 rounded border border-dashed border-[#9EE41A]/50 bg-[#9EE41A]/[0.05] px-2 py-0.5 font-mono text-[8.5px] font-semibold text-[#9EE41A]">
                    <span>01 · CONVERSION ARCHITECTURE PLANNED</span>
                  </div>

                  <div className="space-y-2">
                    <div className="h-7 w-4/5 rounded border border-dashed border-white/30 bg-white/[0.03]" />
                    <div className="h-4 w-2/3 rounded border border-dashed border-white/20 bg-white/[0.02]" />
                  </div>

                  {/* Wireframe CTA Placeholder */}
                  <div className="pt-1">
                    <div className="inline-flex items-center justify-center h-8 px-4 rounded-full border border-dashed border-[#9EE41A]/60 bg-[#9EE41A]/10 font-mono text-[9px] font-bold text-[#9EE41A]">
                      [ BOOK A STRATEGY CALL CTA ]
                    </div>
                  </div>

                  {/* Wireframe Bento Skeleton (3 boxes) */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="h-14 rounded-lg border border-dashed border-white/25 bg-white/[0.02] p-2 flex flex-col justify-between">
                      <div className="font-mono text-[8px] font-bold text-[#CBD1C5]">MOTION ENGINE</div>
                      <div className="font-mono text-[7px] text-[#8A8D89]">60fps GSAP Physics</div>
                    </div>
                    <div className="h-14 rounded-lg border border-dashed border-[#9EE41A]/40 bg-[#9EE41A]/[0.03] p-2 flex flex-col justify-between">
                      <div className="font-mono text-[8px] font-bold text-[#9EE41A]">EDGE LATENCY</div>
                      <div className="font-mono text-[7px] text-[#8A8D89]">Sub-35ms Global Speed</div>
                    </div>
                    <div className="h-14 rounded-lg border border-dashed border-white/25 bg-white/[0.02] p-2 flex flex-col justify-between">
                      <div className="font-mono text-[8px] font-bold text-[#CBD1C5]">CONVERSION FUNNEL</div>
                      <div className="font-mono text-[7px] text-[#8A8D89]">Qualified Pipeline</div>
                    </div>
                  </div>
                </div>

                {/* Wireframe Footer Telemetry */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-white/15 font-mono text-[8.5px] text-[#8A8D89] z-10">
                  <span>LAYOUT: 12-COLUMN SUBGRID · 24PX GAP</span>
                  <span className="text-[#9EE41A] font-bold">CLS 0.000 · ZERO LAYOUT SHIFT</span>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* STAGE 02: DESIGN (Rich Dark Luxury Visual Craft)          */}
            {/* --------------------------------------------------------- */}
            {activeStage === 1 && (
              <div
                className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between bg-[#0A0E09] animate-fadeIn"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(158,228,26,0.16), transparent 70%)",
                }}
              >
                {/* Luxury Mini-Navbar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-xs tracking-tight text-[#F4F1E0]">
                      ARCHÉ
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
                  </div>
                  <div className="flex items-center gap-4 font-sans text-[10px] text-[#CBD1C5]">
                    <span className="hover:text-white cursor-pointer transition-colors">Work</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Systems</span>
                    <span className="hover:text-white cursor-pointer transition-colors">About</span>
                  </div>
                  <div className="rounded-full bg-[#9EE41A] px-2.5 py-0.5 font-sans text-[9px] font-bold text-[#0B0C0A]">
                    Launch
                  </div>
                </div>

                {/* High-Contrast Luxury Hero */}
                <div className="my-auto space-y-3 z-10">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#9EE41A]/10 border border-[#9EE41A]/30 px-2 py-0.5 font-mono text-[8.5px] text-[#9EE41A] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
                    BESPOKE DIGITAL FLAGSHIP
                  </div>

                  <h4 className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-[#F4F1E0] leading-tight max-w-[24ch]">
                    Built to Lead Your Category.
                  </h4>

                  <p className="font-sans text-[11px] text-[#C9CEC3] leading-relaxed max-w-[42ch]">
                    Engineered for high-growth brands that demand sub-frame speed, fluid physics, and
                    uncompromising conversion.
                  </p>

                  <div className="pt-1">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#F4F1E0] text-[#0B0C0A] font-sans text-xs font-bold shadow-lg">
                      <span>Book a Strategy Call →</span>
                    </div>
                  </div>

                  {/* 3 High-Contrast Service Cards */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="rounded-lg p-2.5 border border-white/[0.08] bg-[rgba(18,23,17,0.85)]">
                      <div className="font-sans font-bold text-[10.5px] text-[#F4F1E0]">
                        Motion Physics
                      </div>
                      <div className="font-mono text-[7.5px] text-[#8A8D89] mt-0.5">
                        60fps GSAP Choreography
                      </div>
                    </div>
                    <div className="rounded-lg p-2.5 border border-[#9EE41A]/35 bg-[rgba(25,38,20,0.85)] shadow-[0_0_12px_rgba(158,228,26,0.15)]">
                      <div className="font-sans font-bold text-[10.5px] text-[#9EE41A]">
                        Edge Speed
                      </div>
                      <div className="font-mono text-[7.5px] text-[#CBD1C5] mt-0.5">
                        Sub-35ms Global Latency
                      </div>
                    </div>
                    <div className="rounded-lg p-2.5 border border-white/[0.08] bg-[rgba(18,23,17,0.85)]">
                      <div className="font-sans font-bold text-[10.5px] text-[#F4F1E0]">
                        Conversion Engine
                      </div>
                      <div className="font-mono text-[7.5px] text-[#8A8D89] mt-0.5">
                        3.8× Industry Benchmark
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Proof Strip */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] font-mono text-[8.5px] text-[#8A8D89] z-10">
                  <span>TYPOGRAPHY: INTER TIGHT · 700 DISPLAY</span>
                  <span className="text-[#9EE41A] font-bold">DARK SMOKED CYPRESS ATMOSPHERE</span>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* STAGE 03: BUILD & SPEED (Lighthouse 100 & Enterprise Verif) */}
            {/* --------------------------------------------------------- */}
            {activeStage === 2 && (
              <div
                className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between bg-[#0A0E09] animate-fadeIn"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(158,228,26,0.22), transparent 70%)",
                }}
              >
                {/* Background Site Preview (Slightly dimmed for contrast) */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] opacity-60">
                  <span className="font-sans font-bold text-xs text-[#F4F1E0]">ARCHÉ</span>
                  <span className="font-mono text-[9px] text-[#9EE41A]">ENGINEERING CHECK ✓</span>
                </div>

                {/* Center High-Impact Speed & Architecture Overlay Badge Strip */}
                <div className="my-auto space-y-3 z-10">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#9EE41A]/15 border border-[#9EE41A]/40 px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#9EE41A]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
                      LIGHTHOUSE 100 & ARCHITECTURE VERIFIED
                    </div>
                    <span className="font-mono text-[9px] text-[#9EE41A] font-bold">
                      TOP 1% GLOBAL
                    </span>
                  </div>

                  {/* 4 Enterprise Green Checkmark Cards */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="rounded-xl border border-[#9EE41A]/40 bg-[#0E150C]/95 p-3 flex flex-col justify-between shadow-[0_0_16px_rgba(158,228,26,0.15)]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-[#9EE41A]">
                          0.4s Load Time
                        </span>
                        <span className="h-4 w-4 rounded-full bg-[#9EE41A]/20 flex items-center justify-center text-[9px] text-[#9EE41A] font-bold">
                          ✓
                        </span>
                      </div>
                      <div className="font-sans text-[9px] text-[#C9CEC3] mt-1">
                        Top 1% global sub-frame LCP performance
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#9EE41A]/40 bg-[#0E150C]/95 p-3 flex flex-col justify-between shadow-[0_0_16px_rgba(158,228,26,0.15)]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-[#9EE41A]">
                          99 Lighthouse Score
                        </span>
                        <span className="h-4 w-4 rounded-full bg-[#9EE41A]/20 flex items-center justify-center text-[9px] text-[#9EE41A] font-bold">
                          ✓
                        </span>
                      </div>
                      <div className="font-sans text-[9px] text-[#C9CEC3] mt-1">
                        Perfect scores across SEO, Perf & Accessibility
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#9EE41A]/40 bg-[#0E150C]/95 p-3 flex flex-col justify-between shadow-[0_0_16px_rgba(158,228,26,0.15)]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-[#9EE41A]">
                          SEO & Social Graph
                        </span>
                        <span className="h-4 w-4 rounded-full bg-[#9EE41A]/20 flex items-center justify-center text-[9px] text-[#9EE41A] font-bold">
                          ✓
                        </span>
                      </div>
                      <div className="font-sans text-[9px] text-[#C9CEC3] mt-1">
                        Dynamic meta, OG card generation & microdata
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#9EE41A]/40 bg-[#0E150C]/95 p-3 flex flex-col justify-between shadow-[0_0_16px_rgba(158,228,26,0.15)]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-[#9EE41A]">
                          Mobile Native
                        </span>
                        <span className="h-4 w-4 rounded-full bg-[#9EE41A]/20 flex items-center justify-center text-[9px] text-[#9EE41A] font-bold">
                          ✓
                        </span>
                      </div>
                      <div className="font-sans text-[9px] text-[#C9CEC3] mt-1">
                        Zero layout shift, touch-optimized fluid physics
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Speed Proof */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] font-mono text-[8.5px] text-[#8A8D89] z-10">
                  <span>TIME TO INTERACTIVE: 28MS</span>
                  <span className="text-[#9EE41A] font-bold">60FPS GPU COMPOSITED ONLY</span>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* STAGE 04: LIVE & CONVERTING (Cursor Click & Lead Inbound) */}
            {/* --------------------------------------------------------- */}
            {activeStage === 3 && (
              <div
                className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between bg-[#0A0E09] animate-fadeIn"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(158,228,26,0.18), transparent 70%)",
                }}
              >
                {/* Navbar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-xs tracking-tight text-[#F4F1E0]">
                      ARCHÉ
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
                  </div>
                  <div className="flex items-center gap-4 font-sans text-[10px] text-[#CBD1C5]">
                    <span>Work</span>
                    <span>Systems</span>
                    <span>About</span>
                  </div>
                  <div className="rounded-full bg-[#9EE41A] px-2.5 py-0.5 font-sans text-[9px] font-bold text-[#0B0C0A]">
                    Live
                  </div>
                </div>

                {/* Live Hero with Interactive CTA */}
                <div className="my-auto space-y-3 z-10">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#9EE41A]/10 border border-[#9EE41A]/30 px-2 py-0.5 font-mono text-[8.5px] text-[#9EE41A] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-ping" />
                    LIVE PRODUCTION SYSTEM
                  </div>

                  <h4 className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-[#F4F1E0] leading-tight max-w-[24ch]">
                    Built to Lead Your Category.
                  </h4>

                  <p className="font-sans text-[11px] text-[#C9CEC3] leading-relaxed max-w-[42ch]">
                    Prospects arrive, experience immediate sub-frame clarity, and book directly into
                    your pipeline.
                  </p>

                  {/* Primary CTA Button (Target of Cursor) */}
                  <div className="relative inline-block pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBooked(true);
                        setShowToast(true);
                      }}
                      className="relative z-10 flex items-center gap-2 rounded-full px-5 py-2.5 font-sans text-xs font-bold transition-all cursor-pointer shadow-lg"
                      style={{
                        background: isBooked ? "#9EE41A" : "#F4F1E0",
                        color: "#0B0C0A",
                        transform: cursorPos.clicked ? "scale(0.96)" : "scale(1)",
                        boxShadow: isBooked ? "0 0 20px rgba(158,228,26,0.4)" : "none",
                      }}
                    >
                      <span>{isBooked ? "CALL BOOKED ✓" : "Book a Strategy Call →"}</span>
                    </button>

                    {/* Animated Ripple Pulse on Click */}
                    {cursorPos.clicked && (
                      <span className="absolute inset-0 rounded-full bg-[#9EE41A]/50 animate-ping pointer-events-none" />
                    )}
                  </div>

                  {/* Live Conversion Metrics */}
                  <div className="flex items-center gap-4 pt-2 font-mono text-[8.5px]">
                    <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/[0.08]">
                      <span className="text-[#9EE41A] font-bold block text-[10px]">3.8× CVR</span>
                      <span className="text-[#8A8D89]">Inbound Engine</span>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/[0.08]">
                      <span className="text-[#F4F1E0] font-bold block text-[10px]">0.4s LCP</span>
                      <span className="text-[#8A8D89]">Zero Lag</span>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/[0.08]">
                      <span className="text-[#9EE41A] font-bold block text-[10px]">+$48k</span>
                      <span className="text-[#8A8D89]">Avg Deal Captured</span>
                    </div>
                  </div>
                </div>

                {/* Floating Inbound Lead Toast */}
                {showToast && (
                  <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-xl bg-[#0B0C0A] border border-[#9EE41A]/50 px-3.5 py-2 shadow-2xl font-mono text-[9px] font-bold text-[#F4F1E0] animate-bounce">
                    <span className="h-2 w-2 rounded-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A]" />
                    <span className="text-[#9EE41A]">
                      NEW QUALIFIED LEAD · BOOKED FOR THU 3 PM ✓
                    </span>
                  </div>
                )}

                {/* Animated Studio Cursor */}
                {cursorPos.visible && (
                  <div
                    className="absolute pointer-events-none z-50 transition-all duration-300 ease-out"
                    style={{
                      left: `${cursorPos.x}%`,
                      top: `${cursorPos.y}%`,
                      transform: cursorPos.clicked ? "scale(0.85)" : "scale(1)",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 4L11 20L14 13L21 10L4 4Z"
                        fill="#9EE41A"
                        stroke="#0B0C0A"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="font-mono text-[7.5px] bg-[#0B0C0A] text-[#9EE41A] px-1 py-0.5 rounded shadow absolute top-5 left-3 whitespace-nowrap border border-[#9EE41A]/30">
                      LIVE VISITOR
                    </span>
                  </div>
                )}

                {/* Footer Telemetry */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] font-mono text-[8.5px] text-[#8A8D89] z-10">
                  <span>CONVERSION STATUS: ACTIVE PIPELINE</span>
                  <span className="text-[#9EE41A] font-bold">24/7 AUTOMATIC QUALIFICATION</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Business Impact Panel (~32% -> lg:col-span-4) */}
        <div
          className="lg:col-span-4 flex flex-col justify-between rounded-xl border p-3.5 sm:p-4 text-[#CBD1C5] gap-3"
          style={{
            background: "rgba(18, 23, 17, 0.85)",
            borderColor: "rgba(255,255,255,0.09)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 24px -6px rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-wider text-[#8A8D89] pb-2 border-b border-white/[0.08]">
            <span className="text-[#F4F1E0]">Business Impact</span>
            <span className="text-[#9EE41A] flex items-center gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
              REAL-WORLD ROI
            </span>
          </div>

          {/* 4 Clear Business Impact Rows */}
          <div className="space-y-2.5 my-auto">
            {/* Metric 1: PAGE LOAD SPEED */}
            <div className="rounded-lg p-2.5 border border-white/[0.07] bg-[#0E150C]/90 flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-[#8A8D89]">PAGE LOAD SPEED</span>
                <span className="text-[#9EE41A] font-bold">12× FASTER</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-[#8A8D89] line-through">4.8s (avg site)</span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-[#9EE41A]">
                  0.4s
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
                <div
                  className="bg-[#9EE41A] h-full rounded-full transition-all duration-500"
                  style={{ width: "95%" }}
                />
              </div>
            </div>

            {/* Metric 2: VISITOR TRUST & RETENTION */}
            <div className="rounded-lg p-2.5 border border-white/[0.07] bg-[#0E150C]/90 flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-[#8A8D89]">VISITOR TRUST & RETENTION</span>
                <span className="text-[#9EE41A] font-bold">+52% GAIN</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-[#8A8D89]">32% (avg site)</span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-[#F4F1E0]">
                  84%
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
                <div
                  className="bg-[#F4F1E0] h-full rounded-full transition-all duration-500"
                  style={{ width: "84%" }}
                />
              </div>
            </div>

            {/* Metric 3: INBOUND CONVERSION */}
            <div className="rounded-lg p-2.5 border border-white/[0.07] bg-[#0E150C]/90 flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-[#8A8D89]">INBOUND CONVERSION</span>
                <span className="text-[#9EE41A] font-bold">3.8× MULTIPLIER</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-[#8A8D89]">1.0× (avg site)</span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-[#9EE41A]">
                  3.8×
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
                <div
                  className="bg-[#9EE41A] h-full rounded-full transition-all duration-500"
                  style={{ width: "88%" }}
                />
              </div>
            </div>

            {/* Metric 4: 24/7 LEAD CAPTURE */}
            <div className="rounded-lg p-2.5 border border-white/[0.07] bg-[#0E150C]/90 flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-[#8A8D89]">24/7 LEAD CAPTURE</span>
                <span className="text-[#9EE41A] font-bold">ZERO LEAKAGE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#8A8D89]">Manual Forms</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9EE41A]/15 border border-[#9EE41A]/35 px-2 py-0.5 font-mono text-[10px] font-bold text-[#9EE41A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
                  ALWAYS ON ✓
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Outcome Summary */}
          <div className="rounded-lg bg-[#0A0D09] border border-[#9EE41A]/20 p-2.5 font-mono text-[8.5px] space-y-1">
            <div className="text-[#8A8D89] font-bold">EXECUTIVE OUTCOME:</div>
            <div className="text-[#F4F1E0] font-sans text-[10.5px] font-semibold leading-snug">
              3.8× more qualified leads with sub-frame speed and zero revenue leakage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
