import { useState, useEffect } from "react";
import { prefersReducedMotion } from "../lib/gsap";

export interface PitchDeckDemoProps {
  active?: boolean;
}

interface SlideData {
  step: string;
  stage: string;
  title: string;
  kicker: string;
  bullet: string;
  metricLabel: string;
  metricValue: string;
  diagramType: "problem" | "solution" | "opportunity" | "impact";
}

const SLIDES: SlideData[] = [
  {
    step: "01",
    stage: "PROBLEM",
    kicker: "The Critical Friction",
    title: "Fragmented Operations Cost Teams 32% in Lost Momentum",
    bullet: "Disconnected tools, scattered assets, and chaotic decks fail to convert high-value investors.",
    metricLabel: "Friction Index",
    metricValue: "4.8× Drag",
    diagramType: "problem",
  },
  {
    step: "02",
    stage: "SOLUTION",
    kicker: "The Narrative Arc",
    title: "One Unified System Connecting Vision to Measurable Proof",
    bullet: "We engineer structured storylines, distilled value propositions, and custom slide architecture.",
    metricLabel: "Clarity Score",
    metricValue: "99.4%",
    diagramType: "solution",
  },
  {
    step: "03",
    stage: "OPPORTUNITY",
    kicker: "Market Economics",
    title: "Expanding Into a $14.2B Underserved Enterprise Segment",
    bullet: "Clear TAM/SAM/SOM framing demonstrating scalable defensibility and unit economics.",
    metricLabel: "Total Addressable",
    metricValue: "$14.2B",
    diagramType: "opportunity",
  },
  {
    step: "04",
    stage: "IMPACT",
    kicker: "Traction & The Ask",
    title: "180% Quarter-Over-Quarter Growth With Locked Strategic Pipeline",
    bullet: "Compelling traction slides that give investors and partners the confidence to commit.",
    metricLabel: "Partner Traction",
    metricValue: "180% QoQ",
    diagramType: "impact",
  },
];

export function PitchDeckDemo({ active = true }: PitchDeckDemoProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!active || !isPlaying || prefersReducedMotion()) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [active, isPlaying]);

  const slide = SLIDES[currentIdx];

  return (
    <div className="relative w-full overflow-hidden rounded-[8px] border border-[var(--line)] bg-[#0c0c0d] p-[clamp(16px,2vw,28px)] text-[#f4f2ed] shadow-lg select-none">
      {/* Top Deck Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[rgba(244,242,237,0.12)] pb-[14px]">
        <div className="flex items-center gap-[8px]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)]">
            STORY ARCHITECTURE · {slide.stage}
          </span>
        </div>

        {/* Narrative Flow Pills */}
        <div className="flex items-center gap-[6px]">
          {SLIDES.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => {
                setCurrentIdx(idx);
                setIsPlaying(false);
              }}
              className={`rounded-[4px] px-[8px] py-[3px] font-mono text-[10px] tracking-wider transition-all duration-300 ${
                currentIdx === idx
                  ? "bg-[var(--accent)] text-[#0c0c0d] font-bold"
                  : "bg-[rgba(244,242,237,0.06)] text-[rgba(244,242,237,0.6)] hover:bg-[rgba(244,242,237,0.12)] hover:text-[#f4f2ed]"
              }`}
            >
              {s.step} {s.stage}
            </button>
          ))}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause presentation loop" : "Play presentation loop"}
            className="ml-[4px] rounded-[4px] border border-[rgba(244,242,237,0.18)] px-[6px] py-[3px] font-mono text-[9px] text-[rgba(244,242,237,0.7)] hover:text-[#f4f2ed]"
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
        </div>
      </div>

      {/* Main Slide Presentation Stage */}
      <div className="relative mt-[20px] aspect-[16/9] w-full overflow-hidden rounded-[6px] border border-[rgba(244,242,237,0.08)] bg-[#141416] p-[clamp(16px,2.4vw,32px)] flex flex-col justify-between">
        {/* Subtle slide watermark & grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(244,242,237,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Slide Top Metadata */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <span className="font-mono text-[10px] text-[rgba(244,242,237,0.45)] uppercase tracking-wider">
              ARCHE // SLIDE {slide.step} OF 04
            </span>
          </div>
          <span className="rounded-full border border-[rgba(200,241,79,0.3)] bg-[rgba(200,241,79,0.08)] px-[9px] py-[2px] font-mono text-[9px] text-[var(--accent)] uppercase">
            {slide.kicker}
          </span>
        </div>

        {/* Slide Content Grid: Headline + Visual Narrative */}
        <div className="relative z-10 grid gap-[20px] md:grid-cols-12 items-center my-auto">
          {/* Left: Headline & narrative */}
          <div className="md:col-span-7 flex flex-col gap-[10px]">
            <h3
              key={slide.title}
              className="text-[clamp(16px,1.9vw,26px)] font-semibold leading-[1.18] tracking-[-0.03em] text-[#f4f2ed] transition-opacity duration-300"
            >
              {slide.title}
            </h3>
            <p className="text-[clamp(11px,1.1vw,14px)] text-[rgba(244,242,237,0.7)] leading-relaxed">
              {slide.bullet}
            </p>
          </div>

          {/* Right: Custom Story Visual & Diagram */}
          <div className="md:col-span-5 flex flex-col items-center justify-center rounded-[6px] border border-[rgba(244,242,237,0.12)] bg-[#0c0c0d] p-[16px]">
            {slide.diagramType === "problem" && (
              <div className="w-full flex flex-col gap-[8px]">
                <div className="flex justify-between font-mono text-[9px] text-[rgba(244,242,237,0.6)]">
                  <span>DISCONNECTED STACK</span>
                  <span className="text-[#ff5c5c]">HIGH RESISTANCE</span>
                </div>
                <div className="flex items-center justify-between gap-[4px] py-[8px]">
                  {["PITCH", "DATA", "DESIGN", "STORY"].map((label, i) => (
                    <div
                      key={label}
                      className="flex-1 rounded-[3px] border border-[#ff5c5c]/40 bg-[#ff5c5c]/10 py-[8px] text-center font-mono text-[8px] text-[rgba(244,242,237,0.8)]"
                      style={{ transform: `translateY(${(i % 2 === 0 ? -3 : 3)}px)` }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="font-mono text-[10px] text-[rgba(244,242,237,0.5)] text-center">
                  Broken narrative chain → Low conviction
                </div>
              </div>
            )}

            {slide.diagramType === "solution" && (
              <div className="w-full flex flex-col gap-[8px]">
                <div className="flex justify-between font-mono text-[9px] text-[rgba(244,242,237,0.6)]">
                  <span>NARRATIVE ENGINE</span>
                  <span className="text-[var(--accent)]">CONNECTED</span>
                </div>
                <div className="relative flex items-center justify-between gap-[4px] py-[6px]">
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[var(--accent)] -translate-y-1/2" />
                  {["HOOK", "PROOF", "MOAT", "ASK"].map((label) => (
                    <div
                      key={label}
                      className="relative z-10 flex-1 rounded-[3px] border border-[var(--accent)] bg-[#0c0c0d] py-[7px] text-center font-mono text-[8px] font-bold text-[var(--accent)]"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="font-mono text-[10px] text-[var(--accent)] text-center">
                  Seamless sequential belief progression
                </div>
              </div>
            )}

            {slide.diagramType === "opportunity" && (
              <div className="w-full flex flex-col gap-[6px]">
                <div className="flex justify-between font-mono text-[9px] text-[rgba(244,242,237,0.6)]">
                  <span>MARKET PENETRATION</span>
                  <span className="text-[var(--accent)]">$14.2B</span>
                </div>
                <div className="flex items-end justify-between gap-[6px] h-[52px] pt-[6px]">
                  <div className="flex-1 bg-[rgba(244,242,237,0.15)] h-[30%] rounded-t-[2px]" />
                  <div className="flex-1 bg-[rgba(244,242,237,0.3)] h-[55%] rounded-t-[2px]" />
                  <div className="flex-1 bg-[var(--accent)] h-[95%] rounded-t-[2px] shadow-[0_0_12px_rgba(200,241,79,0.4)]" />
                </div>
                <div className="flex justify-between font-mono text-[8px] text-[rgba(244,242,237,0.45)]">
                  <span>SOM</span>
                  <span>SAM</span>
                  <span className="text-[var(--accent)] font-bold">TAM</span>
                </div>
              </div>
            )}

            {slide.diagramType === "impact" && (
              <div className="w-full flex flex-col gap-[6px]">
                <div className="flex justify-between font-mono text-[9px] text-[rgba(244,242,237,0.6)]">
                  <span>COMPOUNDING TRACTION</span>
                  <span className="text-[var(--accent)]">+180% QoQ</span>
                </div>
                <svg className="w-full h-[52px] overflow-visible" viewBox="0 0 160 50">
                  <path
                    d="M 0,45 Q 40,42 80,28 T 160,6"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                  />
                  <circle cx="160" cy="6" r="3.5" fill="var(--accent)" />
                </svg>
                <div className="flex justify-between font-mono text-[8px] text-[rgba(244,242,237,0.45)]">
                  <span>SEED</span>
                  <span>SERIES A</span>
                  <span className="text-[var(--accent)] font-bold">SCALE</span>
                </div>
              </div>
            )}

            {/* Bottom metric highlight */}
            <div className="mt-[8px] flex items-center justify-between w-full border-t border-[rgba(244,242,237,0.1)] pt-[6px]">
              <span className="font-mono text-[9px] text-[rgba(244,242,237,0.5)]">
                {slide.metricLabel}
              </span>
              <span className="font-mono text-[11px] font-bold text-[var(--accent)]">
                {slide.metricValue}
              </span>
            </div>
          </div>
        </div>

        {/* Slide Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-[rgba(244,242,237,0.08)] pt-[8px] text-[9px] font-mono text-[rgba(244,242,237,0.4)]">
          <span>CONFIDENTIAL & PROPRIETARY</span>
          <span>ARCHE CREATIVE STUDIOS · PRESENTATION ARCHITECTURE</span>
        </div>
      </div>
    </div>
  );
}

