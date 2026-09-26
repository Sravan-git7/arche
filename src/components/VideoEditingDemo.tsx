import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

/**
 * Video Editing Service Demo (PROMPT 09, autoplay per PROMPT 24)
 *
 * Sequence: RAW -> SELECT -> CUT -> MOTION -> CAPTIONS -> GRADE -> EXPORT
 * Fully scrubbable by visitor via playhead or waveform drag / touch-drag.
 * Non-drag hover on any segment box jumps directly to that stage.
 * Mobile includes an auto-play fallback button.
 *
 * The playhead is CONTINUOUS (a 0..1 value written to a `--ph` custom
 * property, so the head and the played part of the waveform move every
 * frame without re-rendering React); the stage it sits in is the discrete
 * value derived from it. On first view it scrubs the whole RAW -> EXPORT
 * range once, slowly (~4.6s), then hands control to the visitor — any
 * pointer input kills the auto pass immediately and for good.
 */

const SLUG = "video-editing";
/** Seconds for the first-view auto pass across the full range. */
const AUTO_SCRUB = 4.6;

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
  active = false,
  preview = false,
  auto = false,
}: {
  active?: boolean;
  preview?: boolean;
  auto?: boolean;
}) {
  const LAST = STAGES.length - 1;
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0); // continuous playhead position, 0..1
  const proxy = useRef({ p: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const autoStarted = useRef(false);
  const startTimer = useRef(0);

  const currentStage = STAGES[stageIndex];

  /**
   * Write a playhead position. The head and the played waveform are driven
   * straight off the `--ph` custom property (no React work per frame); the
   * stage state only changes when the head crosses into the next stage.
   */
  const applyPos = (p: number) => {
    const v = Math.max(0, Math.min(1, p));
    posRef.current = v;
    trackRef.current?.style.setProperty("--ph", v.toFixed(4));
    const idx = Math.round(v * LAST);
    setStageIndex((prev) => (prev === idx ? prev : idx));
  };

  const stopTween = () => {
    tween.current?.kill();
    tween.current = null;
    setIsPlaying(false);
  };

  /** Glide the playhead to an absolute position. */
  const glideTo = (p: number, duration: number, ease = "power2.inOut", onDone?: () => void) => {
    if (prefersReducedMotion()) {
      applyPos(p);
      onDone?.();
      return;
    }
    stopTween();
    setIsPlaying(duration > 0.6);
    proxy.current.p = posRef.current;
    tween.current = gsap.to(proxy.current, {
      p,
      duration,
      ease,
      onUpdate: () => applyPos(proxy.current.p),
      onComplete: () => {
        tween.current = null;
        setIsPlaying(false);
        onDone?.();
      },
    });
  };

  /** The visitor took the playhead: no auto pass from here on. */
  const takeOver = () => {
    autoStarted.current = true;
    if (startTimer.current) window.clearTimeout(startTimer.current);
    stopTween();
  };

  const jumpToStage = (idx: number) => {
    takeOver();
    glideTo(Math.max(0, Math.min(LAST, idx)) / LAST, 0.4);
  };

  useEffect(
    () => () => {
      if (startTimer.current) window.clearTimeout(startTimer.current);
      tween.current?.kill();
    },
    []
  );

  /* PROMPT 28 — Video Editing: auto-scrub sequence across RAW → EXPORT plays on view */
  useEffect(() => {
    if (autoStarted.current || !active || preview) return;
    const id = window.setTimeout(() => {
      startTimer.current = 0;
      autoStarted.current = true;
      markPreviewPlayed(SLUG);
      glideTo(1, AUTO_SCRUB, "sine.inOut", () => announcePreviewDone(SLUG));
    }, 450);
    startTimer.current = id;
    return () => {
      window.clearTimeout(id);
      if (startTimer.current === id) startTimer.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, preview]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (preview) return;
    takeOver();
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
    applyPos((clientX - rect.left) / rect.width);
  };

  /** PLAY / PAUSE — a visitor-triggered pass over the same range. */
  const toggleAutoPlay = () => {
    if (preview) return;
    takeOver();
    if (isPlaying) return; // takeOver() already stopped it
    if (posRef.current > 0.995) applyPos(0);
    glideTo(1, 3.2, "sine.inOut");
  };

  // Map stage to segment selection
  const activeSegmentIdx = Math.min(stageIndex, SEGMENTS.length - 1);

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
          className="vd-track relative h-[44px] w-full cursor-ew-resize rounded-[4px] border overflow-hidden p-[2px] touch-none"
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
          {/* Waveform: one faint bed, one lime copy clipped to the playhead.
              Both read the same `--ph` value, so the sweep is continuous. */}
          {[false, true].map((played) => (
            <svg
              key={played ? "played" : "bed"}
              className={`absolute inset-0 h-full w-full ${played ? "vd-wave-played" : ""}`}
              preserveAspectRatio="none"
              viewBox="0 0 300 40"
              aria-hidden
            >
              {Array.from({ length: 48 }).map((_, i) => {
                const height = 6 + ((i * 23) % 24);
                const x = i * 6.3 + 3;
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={20 - height / 2}
                    x2={x}
                    y2={20 + height / 2}
                    stroke={played ? "var(--accent-deep)" : "var(--faint)"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity={played ? 1 : 0.4}
                  />
                );
              })}
            </svg>
          ))}

          {/* Draggable Playhead */}
          <div
            className="vd-playhead pointer-events-none absolute top-0 bottom-0 w-[2px]"
            style={{
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
