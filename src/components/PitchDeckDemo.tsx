import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

const SLUG = "pitch-decks";

export type DeckMode = "before" | "after";

export interface StorySlide {
  id: string;
  n: string;
  label: string;
  title: string;
}

const STORY_SLIDES: StorySlide[] = [
  { id: "hook", n: "01", label: "01 HOOK", title: "Enterprise AI workflows fail without deterministic interface architecture." },
  { id: "traction", n: "02", label: "02 TRACTION", title: "3.4× Revenue Velocity Across Flagship Deployments" },
  { id: "ask", n: "03", label: "03 THE ASK", title: "Series A · ₹24 Cr Capital Allocation Strategy" },
];

export function PitchDeckDemo({
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
  const [mode, setMode] = useState<DeckMode>("after"); // default to after
  const [slideIdx, setSlideIdx] = useState(1); // default to 02 TRACTION (index 1)
  const [isAuto, setIsAuto] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Auto-advance loop: alternates Before (2.5s) -> After (3.2s) across slides
  useEffect(() => {
    if (prefersReducedMotion() || !active || userInteracted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    markPreviewPlayed(SLUG);

    const runStep = () => {
      setMode((prevMode) => {
        if (prevMode === "before") {
          // Switch to after on the current slide
          return "after";
        } else {
          // Advance to next slide and show before or after
          setSlideIdx((prevIdx) => {
            const nextIdx = (prevIdx + 1) % STORY_SLIDES.length;
            if (nextIdx === STORY_SLIDES.length - 1 && !preview) {
              announcePreviewDone(SLUG);
            }
            return nextIdx;
          });
          return "before";
        }
      });
    };

    // Cycle intervals: 2800ms
    timerRef.current = window.setInterval(runStep, 2800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, userInteracted, preview]);

  // Reset on active or runKey change
  useEffect(() => {
    if (!active) {
      setMode("after");
      setSlideIdx(1);
      setIsAuto(true);
      setUserInteracted(false);
    } else {
      setMode("after");
      setSlideIdx(1);
      setIsAuto(true);
      setUserInteracted(false);
    }
  }, [active, runKey]);

  const handleToggleMode = (m: DeckMode) => {
    setUserInteracted(true);
    setIsAuto(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(m);
  };

  const handleSelectSlide = (idx: number) => {
    setUserInteracted(true);
    setIsAuto(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setSlideIdx(idx);
    setMode("after");
  };

  const currentSlide = STORY_SLIDES[slideIdx];
  const isBefore = mode === "before";

  return (
    <div
      className="pitch-deck-demo relative flex flex-col justify-between w-full h-full p-2.5 sm:p-4 select-none rounded-2xl border border-white/[0.08]"
      style={{
        background: "#080B07",
        backgroundImage:
          "radial-gradient(ellipse 75% 60% at 20% 0%, rgba(158,228,26,0.11), transparent 65%), radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 18px 18px",
      }}
      aria-label="Pitch Decks & Storytelling Studio Console"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BAR: BEFORE vs AFTER TOGGLE + AUTO PILL               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-white/[0.08]">
        {/* Clickable Mode Toggle */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center rounded-full p-0.5 border"
            style={{
              background: "rgba(18, 23, 17, 0.85)",
              borderColor: "rgba(255,255,255,0.09)",
            }}
          >
            <button
              type="button"
              onClick={() => handleToggleMode("before")}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[9px] font-semibold transition-all cursor-pointer"
              style={{
                background: isBefore ? "#E05A47" : "transparent",
                color: isBefore ? "#FFFFFF" : "#8A8D89",
                boxShadow: isBefore ? "0 0 12px rgba(224,90,71,0.35)" : "none",
              }}
            >
              <span>BEFORE: RAW DECK</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("after")}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[9px] font-semibold transition-all cursor-pointer"
              style={{
                background: !isBefore ? "#9EE41A" : "transparent",
                color: !isBefore ? "#0B0C0A" : "#8A8D89",
                boxShadow: !isBefore ? "0 0 14px rgba(158,228,26,0.35)" : "none",
              }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${!isBefore ? "bg-[#0B0C0A]" : "bg-white/30"}`} />
              <span>AFTER: ARCHÉ STORY DECK</span>
            </button>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-2">
          {/* Slide selector pills */}
          <div className="hidden sm:flex items-center gap-1">
            {STORY_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all border cursor-pointer"
                style={{
                  background: slideIdx === idx ? "rgba(158,228,26,0.15)" : "transparent",
                  borderColor: slideIdx === idx ? "#9EE41A" : "rgba(255,255,255,0.08)",
                  color: slideIdx === idx ? "#9EE41A" : "#8A8D89",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Auto indicator */}
          <div
            className="flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[9px] border transition-colors"
            style={{
              borderColor: isAuto ? "rgba(158,228,26,0.3)" : "rgba(255,255,255,0.08)",
              background: isAuto ? "rgba(158,228,26,0.08)" : "transparent",
              color: isAuto ? "#9EE41A" : "#8A8D89",
            }}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isAuto ? "bg-[#9EE41A] animate-pulse" : "bg-white/30"}`} />
            <span>{isAuto ? "AUTO" : "PAUSED"}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN 2-COLUMN LAYOUT (68% Slide Stage | 32% Impact Panel) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-3 items-stretch">
        {/* Left Stage (68% -> lg:col-span-8) */}
        <div className="lg:col-span-8 relative flex flex-col justify-center">
          {/* ========================================================= */}
          {/* BEFORE: RAW DECK (Cluttered, unreadable dense walls)      */}
          {/* ========================================================= */}
          {isBefore ? (
            <div
              className="relative w-full rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xl border overflow-hidden transition-all duration-300"
              style={{
                aspectRatio: "16 / 9.8",
                background: "#E8E7E0",
                borderColor: "rgba(180, 70, 50, 0.3)",
                color: "#2C302B",
              }}
            >
              {/* Top Warning Banner */}
              <div className="flex items-center justify-between pb-2 border-b border-black/10 text-[9px] font-mono">
                <span className="bg-[#E05A47]/15 text-[#B83220] font-bold px-2 py-0.5 rounded border border-[#E05A47]/30">
                  ⚠ BEFORE: FOUNDER RAW DRAFT
                </span>
                <span className="text-[#8F3223] font-bold">
                  LOST IN 18 SECONDS
                </span>
              </div>

              {/* Cluttered Body */}
              <div className="my-auto py-2 space-y-2">
                <div className="font-sans text-xs font-bold text-[#141613]">
                  Overview of Product Features &amp; Revenue Pipeline Update v3_final.pptx
                </div>

                {/* Dense Bullet Wall with Callout */}
                <div className="relative rounded bg-white/70 p-2 border border-black/10 text-[8.5px] leading-tight space-y-1 font-sans text-[#4A4E45]">
                  <p>• Our platform integrates multi-channel operational interfaces across several disconnected SaaS providers.</p>
                  <p>• Significant potential TAM of $48B across global enterprise accounts with 120-day procurement cycles.</p>
                  <p>• High CAC due to lack of positioning clarity and complicated product messaging during partner meetings.</p>
                  <p>• Quarterly projections depend on 6 disparate team handoffs with manual data entry in Excel spreadsheets.</p>

                  <div className="absolute right-2 top-2 bg-[#E05A47] text-white font-mono text-[7.5px] font-bold px-1.5 py-0.5 rounded shadow">
                    Too much text · 24% drop-off
                  </div>
                </div>

                {/* Messy Tiny Table */}
                <div className="relative rounded bg-white/60 p-1.5 border border-black/10 font-mono text-[7.5px]">
                  <div className="grid grid-cols-4 font-bold pb-1 border-b border-black/10 text-[#141613]">
                    <span>Metric</span>
                    <span>Q1 Actual</span>
                    <span>Q2 Estimate</span>
                    <span>Status</span>
                  </div>
                  <div className="grid grid-cols-4 py-0.5 text-[#5A5E54]">
                    <span>Revenue</span>
                    <span>₹1,24,00,000</span>
                    <span>₹2,40,00,000</span>
                    <span className="text-[#B83220]">Unverified</span>
                  </div>
                  <div className="grid grid-cols-4 py-0.5 text-[#5A5E54]">
                    <span>Retention</span>
                    <span>~80%?</span>
                    <span>TBD</span>
                    <span className="text-[#B83220]">No Cohorts</span>
                  </div>

                  <div className="absolute right-2 bottom-1.5 bg-[#B83220]/15 text-[#B83220] font-mono text-[7.5px] font-bold px-1 rounded">
                    Chaotic data layout
                  </div>
                </div>
              </div>

              {/* Bottom Warning Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-black/10 font-mono text-[8.5px] text-[#8F3223] font-semibold">
                <span>SLIDE 0{slideIdx + 1} OF 32 (BLOATED DECK)</span>
                <span>INVESTORS CLOSE TAB AFTER 18s</span>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* AFTER: ARCHÉ STORY DECK (Crisp, High-Conversion Executive)*/
            /* ========================================================= */
            <div
              className="relative w-full rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xl border overflow-hidden transition-all duration-300"
              style={{
                aspectRatio: "16 / 9.8",
                background: "#F4F1E0",
                borderColor: "rgba(20, 20, 19, 0.15)",
                color: "#0B0C0A",
              }}
            >
              {/* Top Header Row */}
              <div className="flex items-center justify-between pb-2 border-b border-[#0B0C0A]/10 text-[9px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="bg-[#0B0C0A] text-[#9EE41A] font-bold px-2 py-0.5 rounded">
                    ARCHÉ STORYLINE
                  </span>
                  <span className="font-bold text-[#2E322B] uppercase tracking-wider">
                    {currentSlide.label}
                  </span>
                </div>
                <span className="text-[#32720E] font-bold">
                  SERIES-A EXECUTIVE MASTER
                </span>
              </div>

              {/* Slide Content By Index */}
              <div className="my-auto py-1">
                {/* 01 HOOK */}
                {slideIdx === 0 && (
                  <div className="flex flex-col gap-2.5 animate-fadeIn">
                    <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#0B0C0A] px-2.5 py-0.5 font-mono text-[8.5px] font-bold text-[#9EE41A]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A]" />
                      CATEGORY THESIS · 2026
                    </div>
                    <h4 className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B0C0A] leading-tight max-w-[28ch]">
                      Enterprise AI workflows fail without deterministic interface architecture.
                    </h4>
                    <p className="font-sans text-[12.5px] sm:text-[13.5px] text-[#2E322B] leading-relaxed max-w-[44ch] font-medium">
                      Fragmented toolchains create operational latency. Unified narrative and software platforms drive compound venture velocity.
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-1 pt-1.5 border-t border-[#0B0C0A]/10 font-mono text-[9px] font-bold text-[#0B0C0A]">
                      <div className="bg-[#0B0C0A]/[0.04] p-1.5 rounded">100% DETERMINISTIC</div>
                      <div className="bg-[#0B0C0A]/[0.04] p-1.5 rounded">&lt;35MS LATENCY</div>
                      <div className="bg-[#0B0C0A]/[0.04] p-1.5 rounded">BESPOKE SYSTEM</div>
                    </div>
                  </div>
                )}

                {/* 02 TRACTION */}
                {slideIdx === 1 && (
                  <div className="flex flex-col gap-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B0C0A] px-2.5 py-0.5 font-mono text-[8.5px] font-bold text-[#9EE41A]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A]" />
                        TRACTION &amp; UNIT ECONOMICS
                      </span>
                      <span className="font-mono text-[9.5px] font-bold text-[#32720E] bg-[#6FA914]/15 px-2 py-0.5 rounded">
                        +240% YoY
                      </span>
                    </div>

                    <h4 className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0B0C0A]">
                      3.4× Revenue Velocity
                    </h4>

                    {/* Animated SVG Rising Area Curve */}
                    <div className="relative w-full h-[76px] sm:h-[84px] rounded-lg bg-[#0B0C0A]/[0.03] border border-[#0B0C0A]/[0.08] p-1 overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 320 70" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="pitchTractionGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#72B314" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#72B314" stopOpacity="0.01" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 65 Q 80 58, 140 42 T 260 18 L 320 8 L 320 70 L 0 70 Z" fill="url(#pitchTractionGrad)" />
                        <path d="M 0 65 Q 80 58, 140 42 T 260 18 L 320 8" fill="none" stroke="#4E8C08" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="320" cy="8" r="4.5" fill="#32720E" />
                        <circle cx="320" cy="8" r="7.5" fill="#72B314" opacity="0.35" className="animate-ping" />
                      </svg>
                      <div className="absolute right-3 top-2 font-mono text-[8.5px] font-bold text-[#0B0C0A] bg-[#F4F1E0] px-1.5 py-0.5 rounded shadow border border-[#0B0C0A]/10">
                        ₹4.2 Cr ARR
                      </div>
                    </div>

                    {/* 3 Metric Chips */}
                    <div className="grid grid-cols-3 gap-2 mt-0.5">
                      <div className="rounded-lg bg-[#0B0C0A]/[0.04] p-1.5 border border-[#0B0C0A]/[0.08]">
                        <div className="font-sans text-[14px] sm:text-[16px] font-extrabold text-[#0B0C0A]">₹4.2 Cr</div>
                        <div className="font-mono text-[7.5px] font-bold text-[#4A4E44]">ARR GENERATED</div>
                      </div>
                      <div className="rounded-lg bg-[#0B0C0A]/[0.04] p-1.5 border border-[#0B0C0A]/[0.08]">
                        <div className="font-sans text-[14px] sm:text-[16px] font-extrabold text-[#0B0C0A]">94%</div>
                        <div className="font-mono text-[7.5px] font-bold text-[#4A4E44]">NET RETENTION</div>
                      </div>
                      <div className="rounded-lg bg-[#0B0C0A]/[0.04] p-1.5 border border-[#0B0C0A]/[0.08]">
                        <div className="font-sans text-[14px] sm:text-[16px] font-extrabold text-[#0B0C0A]">18 Days</div>
                        <div className="font-mono text-[7.5px] font-bold text-[#4A4E44]">AVG CLOSE CYCLE</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 03 THE ASK */}
                {slideIdx === 2 && (
                  <div className="flex flex-col gap-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B0C0A] px-2.5 py-0.5 font-mono text-[8.5px] font-bold text-[#9EE41A]">
                        SERIES A · CAPITAL ALLOCATION
                      </span>
                      <span className="font-mono text-[9px] font-bold text-[#0B0C0A]">
                        ₹24 Cr ROUND
                      </span>
                    </div>

                    <h4 className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B0C0A]">
                      Series A · ₹24 Cr Capital Allocation
                    </h4>

                    {/* Donut Ring & Milestone Rows */}
                    <div className="flex items-center gap-4 py-1">
                      <div className="relative w-18 h-18 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="38" stroke="#E5E7DC" strokeWidth="12" fill="none" />
                          <circle cx="50" cy="50" r="38" stroke="#0B0C0A" strokeWidth="12" fill="none" strokeDasharray="107.4 238.7" strokeDashoffset="0" />
                          <circle cx="50" cy="50" r="38" stroke="#6FA914" strokeWidth="12" fill="none" strokeDasharray="83.5 238.7" strokeDashoffset="-107.4" />
                          <circle cx="50" cy="50" r="38" stroke="#92998D" strokeWidth="12" fill="none" strokeDasharray="47.7 238.7" strokeDashoffset="-190.9" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-[8.5px] font-bold text-[#0B0C0A]">
                          100%
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5 font-mono text-[8px]">
                        <div className="flex items-center justify-between p-1 rounded bg-[#0B0C0A]/[0.04]">
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#0B0C0A]" />
                            Product Architecture (45%)
                          </span>
                          <span className="text-[#4A4E44]">Deterministic UI</span>
                        </div>
                        <div className="flex items-center justify-between p-1 rounded bg-[#0B0C0A]/[0.04]">
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#6FA914]" />
                            Growth Engine (35%)
                          </span>
                          <span className="text-[#4A4E44]">Enterprise Pipeline</span>
                        </div>
                        <div className="flex items-center justify-between p-1 rounded bg-[#0B0C0A]/[0.04]">
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#92998D]" />
                            Ops &amp; Infra (20%)
                          </span>
                          <span className="text-[#4A4E44]">Global Scale</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-[#0B0C0A]/10 font-mono text-[8.5px] text-[#4A4E44] font-semibold">
                <span>16:9 MASTER PROJECTION</span>
                <span className="text-[#0B0C0A] font-bold">14 SLIDES · HIGH CONVICTION</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: INVESTOR IMPACT (32% -> lg:col-span-4) */}
        <div
          className="lg:col-span-4 flex flex-col justify-between rounded-xl border p-3.5 text-[#CBD1C5] gap-3"
          style={{
            background: "rgba(18, 23, 17, 0.85)",
            borderColor: "rgba(255,255,255,0.09)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 24px -6px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-wider text-[#8A8D89] pb-1 border-b border-white/[0.08]">
            <span>Investor Impact</span>
            <span style={{ color: isBefore ? "#E05A47" : "#9EE41A" }}>
              {isBefore ? "RAW BASELINE" : "ARCHÉ STORYLINE"}
            </span>
          </div>

          {/* 3 Real Founder Outcomes */}
          <div className="space-y-2.5 my-auto">
            {/* Metric 1: Avg Deck Read Time */}
            <div className="rounded-lg p-2.5 bg-black/30 border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="font-mono text-[8px] uppercase tracking-wide text-[#8A8D89]">
                  Avg Deck Read Time
                </div>
                <div className="font-mono text-[7.5px] text-[#5A5E54]">
                  Time partner spends engaged
                </div>
              </div>
              <div
                className="font-mono text-[14px] font-extrabold transition-all"
                style={{ color: isBefore ? "#E05A47" : "#9EE41A" }}
              >
                {isBefore ? "0m 18s" : "3m 42s"}
              </div>
            </div>

            {/* Metric 2: Slide Completion Rate */}
            <div className="rounded-lg p-2.5 bg-black/30 border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="font-mono text-[8px] uppercase tracking-wide text-[#8A8D89]">
                  Slide Completion
                </div>
                <div className="font-mono text-[7.5px] text-[#5A5E54]">
                  Read full deck to end
                </div>
              </div>
              <div
                className="font-mono text-[14px] font-extrabold transition-all"
                style={{ color: isBefore ? "#E05A47" : "#9EE41A" }}
              >
                {isBefore ? "24%" : "89%"}
              </div>
            </div>

            {/* Metric 3: Investor Callbacks */}
            <div className="rounded-lg p-2.5 bg-black/30 border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="font-mono text-[8px] uppercase tracking-wide text-[#8A8D89]">
                  Investor Callbacks
                </div>
                <div className="font-mono text-[7.5px] text-[#5A5E54]">
                  Partner intro conversion
                </div>
              </div>
              <div
                className="font-mono text-[14px] font-extrabold transition-all"
                style={{ color: isBefore ? "#E05A47" : "#9EE41A" }}
              >
                {isBefore ? "1.0×" : "3.4×"}
              </div>
            </div>
          </div>

          {/* Bottom Status Pill & Toggle Action */}
          <div className="space-y-2 pt-1 border-t border-white/[0.08]">
            <div
              className="flex items-center justify-center gap-1.5 rounded-lg py-2 px-2.5 font-mono text-[9.5px] font-bold border transition-all"
              style={{
                background: isBefore ? "rgba(224,90,71,0.12)" : "rgba(158,228,26,0.12)",
                borderColor: isBefore ? "rgba(224,90,71,0.35)" : "rgba(158,228,26,0.35)",
                color: isBefore ? "#E05A47" : "#9EE41A",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: isBefore ? "#E05A47" : "#9EE41A" }}
              />
              <span>{isBefore ? "HIGH DROP-OFF · CONFUSION" : "FUNDRAISE READY ✓"}</span>
            </div>

            <button
              type="button"
              onClick={() => handleToggleMode(isBefore ? "after" : "before")}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] py-1.5 px-2 font-mono text-[8.5px] font-semibold text-[#F4F1E0] transition-colors cursor-pointer"
            >
              <span>{isBefore ? "SHOW ARCHÉ AFTER →" : "COMPARE WITH BEFORE ←"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
