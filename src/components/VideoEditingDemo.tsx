import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { prefersReducedMotion } from "../lib/gsap";

/**
 * Video Editing Service Demo (PROMPT 09)
 *
 * Sequence: RAW -> SELECT -> CUT -> MOTION -> CAPTIONS -> GRADE -> EXPORT
 * Fully scrubbable by visitor via playhead or waveform drag / touch-drag.
 * Non-drag hover on any segment box jumps directly to that stage.
 * Mobile includes an auto-play fallback button.
 */

export const STAGES = [
  { id: "raw", label: "RAW", name: "Raw Footage", desc: "Uncut, unprocessed camera output." },
  { id: "select", label: "SELECT", name: "Selection Scan", desc: "Flagging high-retention takes, dropping dead air." },
  { id: "cut", label: "CUT", name: "In/Out Cut Markers", desc: "Pacing cuts dialed with millisecond precision." },
  { id: "motion", label: "MOTION", name: "Kinetic Graphics", desc: "Visual pacing accents and punch-in motion." },
  { id: "captions", label: "CAPTIONS", name: "Dynamic Captions", desc: "Subtitles timed line-by-line for soundless watch." },
  { id: "grade", label: "GRADE", name: "Color & Finish", desc: "Rich contrast with restrained lime accent wash." },
  { id: "export", label: "EXPORT", name: "Master Export", desc: "High-bitrate deliverable ready for platform release." },
] as const;

export type VideoStageId = (typeof STAGES)[number]["id"];

const SEGMENTS = [
  { id: "s1", label: "01", stageIndex: 0, width: "13%" },
  { id: "s2", label: "02", stageIndex: 1, width: "16%" },
  { id: "s3", label: "03", stageIndex: 2, width: "18%" },
  { id: "s4", label: "04", stageIndex: 3, width: "15%" },
  { id: "s5", label: "05", stageIndex: 4, width: "14%" },
  { id: "s6", label: "06", stageIndex: 5, width: "24%" },
];

export function VideoEditingDemo({
  preview = false,
}: {
  active?: boolean;
  preview?: boolean;
}) {
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<number>(0);
  const autoPlayTimer = useRef<number | null>(null);

  const currentStage = STAGES[stageIndex];

  // Stop autoplay on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimer.current) window.clearInterval(autoPlayTimer.current);
    };
  }, []);

  const jumpToStage = (idx: number) => {
    const clamped = Math.max(0, Math.min(STAGES.length - 1, idx));
    setStageIndex(clamped);
    playheadRef.current = clamped / (STAGES.length - 1);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (preview) return;
    setIsPlaying(false);
    if (autoPlayTimer.current) window.clearInterval(autoPlayTimer.current);
    setIsScrubbing(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    setIsScrubbing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const updateFromPointer = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    playheadRef.current = ratio;
    const targetIdx = Math.round(ratio * (STAGES.length - 1));
    setStageIndex(targetIdx);
  };

  const toggleAutoPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (autoPlayTimer.current) window.clearInterval(autoPlayTimer.current);
      return;
    }

    if (prefersReducedMotion()) {
      jumpToStage(STAGES.length - 1);
      return;
    }

    setIsPlaying(true);
    let cur = stageIndex >= STAGES.length - 1 ? 0 : stageIndex;
    jumpToStage(cur);

    if (autoPlayTimer.current) window.clearInterval(autoPlayTimer.current);
    autoPlayTimer.current = window.setInterval(() => {
      cur += 1;
      if (cur >= STAGES.length) {
        setIsPlaying(false);
        if (autoPlayTimer.current) window.clearInterval(autoPlayTimer.current);
      } else {
        jumpToStage(cur);
      }
    }, 450);
  };

  // Map stage to segment selection
  const activeSegmentIdx = Math.min(stageIndex, SEGMENTS.length - 1);
  const playheadPercent = (stageIndex / (STAGES.length - 1)) * 100;

  return (
    <div
      className="video-demo relative flex h-full flex-col justify-between gap-[12px] p-[16px] select-none"
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Top Meta Header */}
      <div className="flex items-center justify-between border-b pb-[10px]" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-[8px]">
          <span className="block h-[6px] w-[6px] rounded-full" style={{ background: "var(--accent-deep)" }} />
          <span className="mono mono-fg">STAGE: {currentStage.label}</span>
          <span className="mono text-[10px] opacity-60">· {currentStage.name}</span>
        </div>
        <div className="flex items-center gap-[12px]">
          <span className="mono text-[10px] opacity-50">
            0{stageIndex + 1} / 0{STAGES.length}
          </span>
          {/* Mobile fallback auto-play */}
          <button
            type="button"
            onClick={toggleAutoPlay}
            className="flex items-center gap-[4px] rounded-full border px-[8px] py-[2px] font-mono text-[9px] uppercase transition-colors"
            style={{
              borderColor: isPlaying ? "var(--accent-deep)" : "var(--line)",
              background: isPlaying ? "var(--accent-deep)" : "transparent",
              color: isPlaying ? "var(--solid)" : "var(--fg)",
            }}
            aria-label={isPlaying ? "Pause auto scrub" : "Auto play preview"}
            data-cursor="CLICK"
          >
            {isPlaying ? "❚❚ PAUSE" : "▶ PLAY"}
          </button>
        </div>
      </div>

      {/* Main Preview Screen (responsive 16/9 with real states) */}
      <div
        className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-[4px] border"
        style={{
          aspectRatio: "16 / 9",
          borderColor: "var(--line)",
          background: "#0c0c0d",
        }}
      >
        {/* State 0: RAW */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-[14px] transition-opacity duration-150"
          style={{
            opacity: stageIndex === 0 ? 1 : 0,
            filter: "saturate(0.5) contrast(0.9)",
            background: "linear-gradient(135deg, #1c1c1f 0%, #0e0e10 100%)",
          }}
        >
          <div className="flex justify-between items-start font-mono text-[9px] text-[#8e8e93]">
            <span>REC [RAW LOG]</span>
            <span className="text-red-500 animate-pulse">● 24 FPS</span>
          </div>
          <div className="my-auto text-center font-mono text-[11px] text-[#71717a] tracking-widest uppercase">
            [ RAW SOURCE TAKES · 4K PRORES ]
          </div>
          <div className="font-mono text-[9px] text-[#71717a]">TC 00:14:22:08</div>
        </div>

        {/* State 1: SELECT */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-[14px] transition-opacity duration-150"
          style={{
            opacity: stageIndex === 1 ? 1 : 0,
            background: "linear-gradient(135deg, #242428 0%, #121214 100%)",
          }}
        >
          <div className="flex justify-between items-start font-mono text-[9px]">
            <span style={{ color: "var(--accent-deep)" }}>TAKE 03 SELECTED</span>
            <span className="text-[#a1a1aa]">RATIO: KEEP 12%</span>
          </div>
          <div className="my-auto flex items-center justify-center gap-[6px]">
            <span className="rounded border px-[8px] py-[3px] font-mono text-[10px] text-white border-zinc-600 bg-zinc-800/80">
              CLIP 03 : HIGH RETENTION
            </span>
          </div>
          <div className="font-mono text-[9px] text-[#a1a1aa]">TRIM: -04:12 DISCARDED</div>
        </div>

        {/* State 2: CUT */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-[14px] transition-opacity duration-150"
          style={{
            opacity: stageIndex === 2 ? 1 : 0,
            background: "linear-gradient(135deg, #1f2024 0%, #0f1012 100%)",
          }}
        >
          <div className="flex justify-between items-start font-mono text-[9px] text-white">
            <span className="text-[#c8f14f]">IN: 00:01:04</span>
            <span className="text-[#c8f14f]">OUT: 00:08:19</span>
          </div>
          <div className="my-auto flex flex-col items-center gap-[4px]">
            <div className="h-px w-[60%] bg-[#c8f14f] relative">
              <span className="absolute -top-[5px] left-0 h-[11px] w-[2px] bg-[#c8f14f]" />
              <span className="absolute -top-[5px] right-0 h-[11px] w-[2px] bg-[#c8f14f]" />
            </div>
            <span className="font-mono text-[10px] tracking-wider text-white">CUT DURATION: 07.25s</span>
          </div>
          <div className="font-mono text-[9px] text-[#a1a1aa]">RHYTHM: FAST PACING MATCHED</div>
        </div>

        {/* State 3: MOTION */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-[14px] transition-opacity duration-150 overflow-hidden"
          style={{
            opacity: stageIndex === 3 ? 1 : 0,
            background: "linear-gradient(135deg, #26272c 0%, #121316 100%)",
          }}
        >
          <div className="flex justify-between items-start font-mono text-[9px] text-white">
            <span>GRAPHICS / ACCENT</span>
            <span style={{ color: "var(--accent-deep)" }}>KINETIC PASS</span>
          </div>
          <div className="my-auto flex flex-col items-center">
            <div className="relative border border-dashed border-[#c8f14f] px-[16px] py-[8px] rounded">
              <span className="font-mono text-[12px] font-bold tracking-widest text-white">
                PUNCH IN // 115%
              </span>
              <span className="absolute -top-[3px] -left-[3px] h-[6px] w-[6px] bg-[#c8f14f]" />
              <span className="absolute -bottom-[3px] -right-[3px] h-[6px] w-[6px] bg-[#c8f14f]" />
            </div>
          </div>
          <div className="font-mono text-[9px] text-[#71717a]">EASE: CUBIC-OUT 320ms</div>
        </div>

        {/* State 4: CAPTIONS */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-[14px] transition-opacity duration-150"
          style={{
            opacity: stageIndex === 4 ? 1 : 0,
            background: "linear-gradient(135deg, #202227 0%, #101114 100%)",
          }}
        >
          <div className="flex justify-between items-start font-mono text-[9px] text-[#a1a1aa]">
            <span>SUBTITLES: AUTO-SYNC</span>
            <span style={{ color: "var(--accent-deep)" }}>ACCURACY 99.4%</span>
          </div>
          <div className="my-auto text-center">
            <span className="inline-block rounded bg-black/85 px-[10px] py-[4px] font-sans text-[13px] font-medium tracking-tight text-white border border-white/10 shadow-lg">
              “Systems that turn ideas into <span style={{ color: "var(--accent)" }}>leverage</span>.”
            </span>
          </div>
          <div className="font-mono text-[9px] text-[#71717a]">FORMAT: WORD-BY-WORD POP</div>
        </div>

        {/* State 5: GRADE */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-[14px] transition-opacity duration-150"
          style={{
            opacity: stageIndex === 5 ? 1 : 0,
            background: "linear-gradient(135deg, #293022 0%, #131710 100%)",
            boxShadow: "inset 0 0 40px rgba(200, 241, 79, 0.08)",
          }}
        >
          <div className="flex justify-between items-start font-mono text-[9px] text-[#c8f14f]">
            <span>COLOR LUT: ARCHE FILM</span>
            <span>GAMMA 2.4</span>
          </div>
          <div className="my-auto text-center">
            <div className="inline-flex items-center gap-[6px] rounded-full border border-[#c8f14f]/40 bg-[#c8f14f]/10 px-[12px] py-[4px]">
              <span className="h-[6px] w-[6px] rounded-full bg-[#c8f14f]" />
              <span className="font-mono text-[10px] text-[#c8f14f] tracking-wider uppercase">
                WARM TONE + ACID ACCENTS
              </span>
            </div>
          </div>
          <div className="font-mono text-[9px] text-[#a1a1aa]">CURVES: HIGHLIGHT ROLL-OFF APPLIED</div>
        </div>

        {/* State 6: EXPORT */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-[14px] transition-opacity duration-150"
          style={{
            opacity: stageIndex === 6 ? 1 : 0,
            background: "linear-gradient(135deg, #1c2214 0%, #0d1108 100%)",
          }}
        >
          <div className="flex justify-between items-start font-mono text-[9px] text-[#c8f14f]">
            <span>RENDER FINISHED</span>
            <span>100% COMPLETE</span>
          </div>
          <div className="my-auto flex flex-col items-center gap-[8px]">
            <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#c8f14f] text-[#0c0c0d] font-bold text-[18px]">
              ✓
            </div>
            <span className="font-mono text-[11px] tracking-widest text-white uppercase">
              MASTER READY FOR RELEASE
            </span>
          </div>
          <div className="flex justify-between font-mono text-[9px] text-[#c8f14f]/80">
            <span>MP4 H.265 / 4K</span>
            <span>SIZE: 142 MB</span>
          </div>
        </div>
      </div>

      {/* Timeline Structure (Segments) */}
      <div className="flex flex-col gap-[6px]">
        <div className="flex justify-between items-center text-[10px] font-mono opacity-60">
          <span>TIMELINE SEGMENTS (HOVER TO JUMP)</span>
          <span>SELECT PASS</span>
        </div>
        {/* Desktop non-drag hover jump + visual segment boxes */}
        <div className="flex w-full gap-[4px] h-[32px]">
          {SEGMENTS.map((seg, i) => {
            const isHighlighted = i === activeSegmentIdx;
            const isPast = i < activeSegmentIdx;
            return (
              <button
                key={seg.id}
                type="button"
                onMouseEnter={() => {
                  if (!preview && !isScrubbing) jumpToStage(seg.stageIndex);
                }}
                onClick={() => jumpToStage(seg.stageIndex)}
                className="group relative h-full rounded-[2px] border transition-all duration-150 flex items-center justify-between px-[6px] overflow-hidden"
                style={{
                  width: seg.width,
                  borderColor: isHighlighted
                    ? "var(--accent-deep)"
                    : isPast
                    ? "rgba(12, 12, 13, 0.4)"
                    : "var(--line)",
                  background: isHighlighted
                    ? "color-mix(in srgb, var(--accent-deep) 15%, var(--card))"
                    : "var(--card)",
                }}
                data-cursor="SELECT"
                aria-label={`Jump to ${STAGES[seg.stageIndex].label}`}
              >
                <span
                  className="font-mono text-[8px] transition-colors"
                  style={{ color: isHighlighted ? "var(--accent-deep)" : "var(--muted)" }}
                >
                  {seg.label}
                </span>
                {isHighlighted && (
                  <span className="h-[4px] w-[4px] rounded-full bg-[var(--accent-deep)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Waveform Scrub Track */}
      <div className="flex flex-col gap-[6px]">
        <div className="flex justify-between items-center text-[10px] font-mono opacity-60">
          <span>DRAG PLAYHEAD ACROSS WAVEFORM</span>
          <span style={{ color: "var(--accent-deep)" }}>
            STAGE: {currentStage.label}
          </span>
        </div>

        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="relative h-[44px] w-full cursor-ew-resize rounded-[4px] border overflow-hidden p-[2px] touch-none"
          style={{
            borderColor: isScrubbing ? "var(--accent-deep)" : "var(--line)",
            background: "var(--bg-2)",
          }}
          data-cursor="DRAG"
          role="slider"
          aria-label="Video timeline scrubber"
          aria-valuemin={0}
          aria-valuemax={STAGES.length - 1}
          aria-valuenow={stageIndex}
          aria-valuetext={currentStage.label}
        >
          {/* Static SVG Waveform representation */}
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 300 40">
            {Array.from({ length: 48 }).map((_, i) => {
              const height = 6 + ((i * 23) % 24);
              const x = i * 6.3 + 3;
              const isPast = x / 300 <= playheadPercent / 100;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={20 - height / 2}
                  x2={x}
                  y2={20 + height / 2}
                  stroke={isPast ? "var(--accent-deep)" : "var(--faint)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity={isPast ? 1 : 0.4}
                />
              );
            })}
          </svg>

          {/* Draggable Playhead */}
          <div
            className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 pointer-events-none transition-transform duration-75"
            style={{
              left: `${playheadPercent}%`,
              background: "var(--accent-deep)",
              boxShadow: "0 0 8px var(--accent-deep)",
            }}
          >
            {/* Playhead Grab Notch */}
            <div
              className="absolute -top-[2px] left-1/2 h-[10px] w-[10px] -translate-x-1/2 rounded-full border border-black"
              style={{ background: "var(--accent)" }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Stage Progress Steps Bar (replaces static RAW -> STORY) */}
      <div
        className="flex items-center justify-between border-t pt-[8px] mt-[2px]"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex flex-wrap items-center gap-[6px]">
          {STAGES.map((st, i) => {
            const isCurrent = i === stageIndex;
            const isPassed = i < stageIndex;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => jumpToStage(i)}
                className="font-mono text-[8.5px] tracking-wider transition-colors"
                style={{
                  color: isCurrent
                    ? "var(--accent-deep)"
                    : isPassed
                    ? "var(--fg)"
                    : "var(--faint)",
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {st.label}
                {i < STAGES.length - 1 && <span className="mx-[4px] text-[var(--line)]">→</span>}
              </button>
            );
          })}
        </div>
        <span className="mono text-[9px] text-[var(--accent-deep)] hidden sm:inline">
          {currentStage.desc}
        </span>
      </div>
    </div>
  );
}
