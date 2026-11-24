import { useEffect, useRef, useState, useCallback, type PointerEvent as ReactPointerEvent } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

/**
 * Service 01 — Video Editing Editorial Suite
 *
 * Professional 60fps NLE console and tactile timeline matching the calibrated reference:
 *  1. Top Dark Console Bezel (#111210 with glass bevel):
 *     - Left Column (~28%): REC 24fps telemetry, circular Vectorscope radar dial with
 *       calibration rings & rotating chroma trace, vertical Stereo VU meter.
 *     - Center Column (~44%): Animated moving highway / mountain horizon footage cutting
 *       across 6 distinct camera angles (01 WIDE, 02 ANGLE, 03 MACRO, 04 DETAIL, 05 GRADE, 06 MASTER),
 *       live split-screen grading loupe with circular target crosshair handle (flat LOG-C vs Arché 35mm),
 *       in-frame dynamic captions and masked kinetic ARCHÉ title, second matching Stereo VU meter.
 *     - Right Column (~28%): Dual emerald grading scopes (GRADING / PARADE) with green graticule grids
 *       & live phosphor traces, live animated RGB / Luma Waveform curve below.
 *     - Bottom Console Strip: Full-width dark audio spectrogram with frame tick ruler.
 *  2. Bottom Tactile Light Timeline:
 *     - Clean geometric sans (Inter) for clip titles and stage pills; crisp monospace for timecode & tags.
 *     - Control row: Stage pills (RAW → SELECT → CUT → CAPTIONS → GRADE → EXPORT) turning charcoal with lime dot,
 *       compact PAUSE/PLAY pill, +1.0x speed, live tabular timecode (00:04:12 / 00:12:00), STAGE status.
 *     - Track V2: Overlay clips (DYNAMIC CAPTIONS.SRT and TITLE OVERLAY // 115%).
 *     - Track V1: 6 color-coded tactile gradient clips (sage-lime, amber-gold, slate-stone) with bevels & EXT/INT tags.
 *     - Color-Grade Envelope Track: Continuous flowing color ribbon with animated Bezier wave spline.
 *     - Track A1: Dense pill-bar audio waveform pulsing with playback.
 *     - Continuous 60fps lime playhead line slicing down through console and timeline.
 *  3. Auto-play on mount / in-view:
 *     - Auto-plays seamlessly at 60fps, pausing on manual scrub, tab switch, or offscreen.
 */

const SLUG = "video-editing";
const TOTAL_DURATION = 12.0; // 12-second seamless loop

export const STAGES_SEQUENCE = [
  { id: "raw", label: "RAW", time: 0.0 },
  { id: "select", label: "SELECT", time: 2.0 },
  { id: "cut", label: "CUT", time: 4.0 },
  { id: "captions", label: "CAPTIONS", time: 6.0 },
  { id: "grade", label: "GRADE", time: 8.0 },
  { id: "export", label: "EXPORT", time: 10.0 },
] as const;

export const V1_CLIPS = [
  { id: "c1", label: "01 WIDE", start: 0.0, end: 2.0, tag: "EXT", theme: "sage" },
  { id: "c2", label: "02 ANGLE", start: 2.0, end: 4.0, tag: "EXT", theme: "sage" },
  { id: "c3", label: "03 MACRO", start: 4.0, end: 6.0, tag: "INT", theme: "amber" },
  { id: "c4", label: "04 DETAIL", start: 6.0, end: 8.0, tag: "INT", theme: "amber" },
  { id: "c5", label: "05 GRADE", start: 8.0, end: 10.0, tag: "INT", theme: "slate" },
  { id: "c6", label: "06 MASTER", start: 10.0, end: 12.0, tag: "EXT", theme: "slate" },
] as const;

export function VideoEditingDemo({
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
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wipePosition, setWipePosition] = useState<number | null>(null); // null = automated sweep

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isDraggingWipe = useRef(false);
  const isScrubbingTimeline = useRef(false);
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  timeRef.current = currentTime;
  isPlayingRef.current = isPlaying;

  // Viewport-gated reset and replay on active/runKey changes
  useEffect(() => {
    if (prefersReducedMotion()) {
      setIsPlaying(false);
      return;
    }

    if (!active) {
      setIsPlaying(false);
      setCurrentTime(0);
      timeRef.current = 0;
      lastTimeRef.current = 0;
    } else {
      setCurrentTime(0);
      timeRef.current = 0;
      lastTimeRef.current = 0;
      setIsPlaying(true);
    }
  }, [active, runKey]);

  const formatTimecode = (seconds: number) => {
    const s = Math.min(TOTAL_DURATION, Math.max(0, seconds));
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * 24);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  };

  // Determine active stage & clip
  const currentStageIndex = Math.min(
    STAGES_SEQUENCE.length - 1,
    Math.floor((currentTime / TOTAL_DURATION) * STAGES_SEQUENCE.length)
  );
  const currentStage = STAGES_SEQUENCE[currentStageIndex];
  const activeClipIndex = Math.min(
    V1_CLIPS.length - 1,
    Math.floor((currentTime / TOTAL_DURATION) * V1_CLIPS.length)
  );

  // Auto-play preview signal announcement
  useEffect(() => {
    if (active && !preview) {
      markPreviewPlayed(SLUG);
      const timer = window.setTimeout(() => {
        announcePreviewDone(SLUG);
      }, 7000);
      return () => window.clearTimeout(timer);
    }
  }, [active, preview]);

  // Main 60fps procedural rendering loop for the 3-column dark grading console
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let destroyed = false;

    // Handle high DPI
    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      if (destroyed) return;

      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Advance time if active, playing, and window visible
      if (active && isPlayingRef.current && !prefersReducedMotion() && document.visibilityState === "visible") {
        let nextTime = timeRef.current + dt;
        if (nextTime >= TOTAL_DURATION) {
          nextTime = 0;
        }
        timeRef.current = nextTime;
        setCurrentTime(nextTime);
      }

      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Layout geometry for dark console
      const specH = Math.round(h * 0.15); // bottom spectrogram height
      const instH = h - specH; // upper instrument row height
      const col1W = Math.round(w * 0.28); // Left column (Vectorscope & telemetry)
      const col2W = Math.round(w * 0.44); // Center column (Cinematic footage)
      const col3W = w - col1W - col2W; // Right column (Dual scopes & RGB wave)
      const col2X = col1W;
      const col3X = col1W + col2W;

      // Clear dark console background
      ctx.fillStyle = "#111210";
      ctx.fillRect(0, 0, w, h);

      // Subtle vertical column separator hairlines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(col2X, 0); ctx.lineTo(col2X, instH);
      ctx.moveTo(col3X, 0); ctx.lineTo(col3X, instH);
      ctx.moveTo(0, instH); ctx.lineTo(w, instH);
      ctx.stroke();

      // =============================================================
      // COLUMN 1: VECTORSCOPE & TELEMETRY (Left, ~28%)
      // =============================================================
      ctx.save();
      // REC Telemetry top-left
      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillStyle = "#FF4438";
      ctx.beginPath();
      ctx.arc(14, 15, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#E0DFDA";
      ctx.fillText("REC · 24.000 FPS 4096×1714 (2.39:1)", 22, 16);

      // Micro telemetry readout on far-left
      const telem = [
        "SHUTTER 180.0°",
        "ISO 800 +0.0EV",
        "WB 5600K RAW",
        "CODEC PRORES 4444",
        "LUT LOG-C -> 35MM",
        `TC ${formatTimecode(t)}:14`,
      ];
      ctx.font = '500 6.5px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
      telem.forEach((line, li) => {
        ctx.fillText(line, 14, 32 + li * 10);
      });

      // Circular Vectorscope / Color Radar Dial
      const vCx = col1W * 0.58;
      const vCy = instH * 0.54;
      const vR = Math.min(col1W * 0.28, instH * 0.34);

      // Outer bezel ring
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(vCx, vCy, vR * 1.15, 0, Math.PI * 2);
      ctx.stroke();

      // Outer gauge ticks
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        const x1 = vCx + Math.cos(ang) * (vR * 1.15);
        const y1 = vCy + Math.sin(ang) * (vR * 1.15);
        const x2 = vCx + Math.cos(ang) * (vR * 1.22);
        const y2 = vCy + Math.sin(ang) * (vR * 1.22);
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Concentric calibration rings
      [0.35, 0.7, 1.0].forEach((ratio) => {
        ctx.strokeStyle = "rgba(158, 228, 26, 0.15)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(vCx, vCy, vR * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Radar crosshair axes
      ctx.strokeStyle = "rgba(158, 228, 26, 0.2)";
      ctx.beginPath();
      ctx.moveTo(vCx - vR, vCy); ctx.lineTo(vCx + vR, vCy);
      ctx.moveTo(vCx, vCy - vR); ctx.lineTo(vCx, vCy + vR);
      ctx.stroke();

      // Rotating radar sweep needle
      const sweepAng = (t * 2.2) % (Math.PI * 2);
      const sweepGrad = ctx.createRadialGradient(vCx, vCy, 0, vCx, vCy, vR);
      sweepGrad.addColorStop(0, "rgba(158, 228, 26, 0.35)");
      sweepGrad.addColorStop(1, "rgba(158, 228, 26, 0)");

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(vCx, vCy);
      ctx.arc(vCx, vCy, vR, sweepAng - 0.45, sweepAng);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Vectorscope Chroma Trace Cloud (pulses and shifts on cuts)
      const cloudPhase = (t / 2.0);
      for (let p = 0; p < 16; p++) {
        const pAng = (p * 0.42 + cloudPhase) % (Math.PI * 2);
        const pDist = (Math.sin(p * 2.1 + t * 3) * 0.25 + 0.5) * vR * 0.85;
        const px = vCx + Math.cos(pAng) * pDist;
        const py = vCy + Math.sin(pAng) * pDist;
        ctx.fillStyle = "rgba(158, 228, 26, 0.75)";
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vertical Stereo VU Meter 1 (Right edge of Col 1)
      const vu1X = col2X - 16;
      const vu1Y = 24;
      const vuH = instH - 36;
      const vuBarCount = 14;
      const vuLevel = Math.min(1, Math.abs(Math.sin(t * 5.2)) * 0.65 + Math.abs(Math.cos(t * 3.4)) * 0.35);

      for (let b = 0; b < vuBarCount; b++) {
        const by = vu1Y + vuH - (b / vuBarCount) * vuH - 4;
        const isLit = (b / vuBarCount) <= vuLevel;
        const col = b >= 12 ? "#FF4438" : b >= 9 ? "#E5A93C" : "#9EE41A";
        // Left channel LED
        ctx.fillStyle = isLit ? col : "rgba(255,255,255,0.08)";
        ctx.fillRect(vu1X, by, 3, 2.5);
        // Right channel LED
        ctx.fillStyle = isLit ? col : "rgba(255,255,255,0.08)";
        ctx.fillRect(vu1X + 4.5, by, 3, 2.5);
      }
      ctx.restore();

      // =============================================================
      // COLUMN 2: CINEMATIC FOOTAGE + SPLIT WIPE (Center, ~44%)
      // =============================================================
      ctx.save();
      const footX = col2X + 2;
      const footY = 2;
      const footW = col2W - 20; // leaves space for right VU meter 2
      const footH = instH - 4;

      // Determine split wipe X position (within footX to footX + footW)
      let splitX = footX + footW * 0.52;
      if (wipePosition !== null) {
        splitX = footX + Math.max(0, Math.min(1, wipePosition)) * footW;
      } else if (t < 2.0) {
        // Initial entrance wipe sweep revealing ARCHE 35MM
        const sweepProg = t / 2.0;
        splitX = footX + (0.15 + sweepProg * 0.7) * footW;
      } else if (t >= 8.0 && t < 10.0) {
        // Auto-sweep during Grade stage
        const sweepProg = (t - 8.0) / 2.0;
        splitX = footX + (0.15 + sweepProg * 0.7) * footW;
      }

      // Helper to render cinematic road scene in flat LOG vs 35mm Grade
      const drawRoadScene = (isGraded: boolean, clipMinX: number, clipMaxX: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(clipMinX, footY, clipMaxX - clipMinX, footH);
        ctx.clip();

        // 1. Sky & Atmosphere
        const skyGrad = ctx.createLinearGradient(footX, footY, footX, footY + footH * 0.55);
        if (isGraded) {
          skyGrad.addColorStop(0, "#1A1722");
          skyGrad.addColorStop(0.4, "#4D2C24");
          skyGrad.addColorStop(0.85, "#B85C2E");
          skyGrad.addColorStop(1, "#E89B54");
        } else {
          skyGrad.addColorStop(0, "#38363D");
          skyGrad.addColorStop(0.5, "#554A48");
          skyGrad.addColorStop(1, "#7D6C62");
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(footX, footY, footW, footH * 0.55);

        // 2. Rolling Mountain Horizon Ridges (Drifting in parallax)
        const mountParallax = (t * 8) % 120;
        ctx.fillStyle = isGraded ? "#141118" : "#2E2B30";
        ctx.beginPath();
        ctx.moveTo(footX, footY + footH * 0.55);
        ctx.lineTo(footX, footY + footH * 0.38);
        ctx.bezierCurveTo(
          footX + footW * 0.25 - mountParallax, footY + footH * 0.28,
          footX + footW * 0.5 - mountParallax, footY + footH * 0.44,
          footX + footW * 0.75, footY + footH * 0.32
        );
        ctx.lineTo(footX + footW, footY + footH * 0.42);
        ctx.lineTo(footX + footW, footY + footH * 0.55);
        ctx.closePath();
        ctx.fill();

        // Second closer ridge
        ctx.fillStyle = isGraded ? "#0C0A0E" : "#222024";
        ctx.beginPath();
        ctx.moveTo(footX, footY + footH * 0.55);
        ctx.lineTo(footX, footY + footH * 0.44);
        ctx.bezierCurveTo(
          footX + footW * 0.35, footY + footH * 0.38,
          footX + footW * 0.65, footY + footH * 0.48,
          footX + footW, footY + footH * 0.42
        );
        ctx.lineTo(footX + footW, footY + footH * 0.55);
        ctx.closePath();
        ctx.fill();

        // 3. Perspective Highway Road Surface
        const vPointX = footX + footW * 0.5;
        const vPointY = footY + footH * 0.5;

        // Ground / Roadside terrain
        ctx.fillStyle = isGraded ? "#161311" : "#322E2B";
        ctx.fillRect(footX, vPointY, footW, footH - (vPointY - footY));

        // Asphalt Road Trapezoid
        ctx.fillStyle = isGraded ? "#1B1B1C" : "#3D3D3E";
        ctx.beginPath();
        ctx.moveTo(vPointX - footW * 0.05, vPointY);
        ctx.lineTo(vPointX + footW * 0.05, vPointY);
        ctx.lineTo(footX + footW * 0.88, footY + footH);
        ctx.lineTo(footX + footW * 0.12, footY + footH);
        ctx.closePath();
        ctx.fill();

        // Road Side Shoulders (White guide lines)
        ctx.strokeStyle = isGraded ? "rgba(255, 255, 255, 0.6)" : "rgba(200, 200, 200, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(vPointX - footW * 0.05, vPointY);
        ctx.lineTo(footX + footW * 0.12, footY + footH);
        ctx.moveTo(vPointX + footW * 0.05, vPointY);
        ctx.lineTo(footX + footW * 0.88, footY + footH);
        ctx.stroke();

        // 4. Moving Highway Centerline Stripes (Yellow)
        const roadSpeed = t * 140;
        const dashCount = 8;
        for (let d = 0; d < dashCount; d++) {
          const dashProgress = ((d / dashCount) + (roadSpeed % 100) / 100) % 1.0;
          if (dashProgress < 0.05) continue;

          // 3D perspective spacing: power projection
          const pY = vPointY + Math.pow(dashProgress, 2.2) * (footY + footH - vPointY);
          const pLen = Math.max(3, dashProgress * 22);
          const pW = Math.max(1, dashProgress * 3.5);

          // Double yellow line
          ctx.fillStyle = isGraded ? "#F4BA36" : "#A69265";
          ctx.fillRect(vPointX - pW - 1, pY, pW, pLen);
          ctx.fillRect(vPointX + 1, pY, pW, pLen);
        }

        // Camera Cut Angle Modifications (6 distinct camera angles based on clip)
        if (activeClipIndex === 1) {
          // 02 ANGLE: low-angle camera shift
          ctx.fillStyle = isGraded ? "rgba(255, 230, 160, 0.1)" : "rgba(255, 255, 255, 0.05)";
          ctx.beginPath();
          ctx.moveTo(footX, footY); ctx.lineTo(footX + footW * 0.5, footY + footH); ctx.lineTo(footX, footY + footH);
          ctx.fill();
        } else if (activeClipIndex === 2) {
          // 03 MACRO: optical blur & macro push
          ctx.fillStyle = isGraded ? "rgba(0,0,0,0.3)" : "rgba(50,50,50,0.2)";
          ctx.fillRect(footX, footY, footW, footH);
        } else if (activeClipIndex === 4 || activeClipIndex === 5) {
          // 05/06 MASTER: architectural reticle & optical guides
          ctx.strokeStyle = isGraded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(footX + footW * 0.33, footY); ctx.lineTo(footX + footW * 0.33, footY + footH);
          ctx.moveTo(footX + footW * 0.66, footY); ctx.lineTo(footX + footW * 0.66, footY + footH);
          ctx.stroke();
        }

        // Dynamic Lower-Third Captions (V2 DYNAMIC CAPTIONS.SRT)
        if (t >= 4.0 && t < 9.0) {
          const capY = footY + footH - 26;
          ctx.fillStyle = isGraded ? "rgba(16, 16, 15, 0.88)" : "rgba(42, 42, 40, 0.88)";
          ctx.strokeStyle = isGraded ? "rgba(158, 228, 26, 0.7)" : "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(footX + footW * 0.08, capY, footW * 0.84, 20, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isGraded ? "#9EE41A" : "#FFFFFF";
          ctx.font = '600 7.5px "JetBrains Mono", monospace';
          ctx.textAlign = "center";
          ctx.fillText("DYNAMIC CAPTIONS.SRT // 4K 10-BIT", footX + footW * 0.5, capY + 8);

          ctx.fillStyle = "#EAEAEA";
          ctx.font = '500 7.5px "Inter", sans-serif';
          ctx.fillText('"EVERY FRAME HAS A STORY. WORTH WATCHING."', footX + footW * 0.5, capY + 16);
          ctx.textAlign = "left";
        }

        // Masked Kinetic ARCHÉ Title Overlay (V2 TITLE OVERLAY // 115%)
        if (t >= 8.0) {
          const titleTracking = 0.25 + ((t - 8.0) / 4.0) * 0.12;
          ctx.save();
          ctx.font = `700 ${Math.round(footH * 0.16)}px "Archivo", "Inter", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isGraded ? "#FFFFFF" : "#D4D4D0";
          ctx.letterSpacing = `${titleTracking}em`;
          ctx.fillText("ARCHÉ", footX + footW * 0.5, footY + footH * 0.38);
          ctx.restore();
        }

        ctx.restore();
      };

      // Draw Left (LOG-C) and Right (ARCHÉ 35MM)
      drawRoadScene(false, footX, splitX);
      drawRoadScene(true, splitX, footX + footW);

      // Split Wipe Line + Target Crosshair Handle
      if (splitX > footX + 4 && splitX < footX + footW - 4) {
        ctx.strokeStyle = "#9EE41A";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(splitX, footY);
        ctx.lineTo(splitX, footY + footH);
        ctx.stroke();

        // Precision Target Crosshair Circular Handle
        const handleY = footY + footH * 0.5;
        ctx.fillStyle = "#141413";
        ctx.strokeStyle = "#9EE41A";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(splitX, handleY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Center crosshair inside handle
        ctx.strokeStyle = "#9EE41A";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(splitX - 6, handleY); ctx.lineTo(splitX + 6, handleY);
        ctx.moveTo(splitX, handleY - 6); ctx.lineTo(splitX, handleY + 6);
        ctx.stroke();
      }

      // HUD Tags inside footage
      ctx.font = '600 7px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("LOG-C · FLAT", footX + 8, footY + 14);

      ctx.fillStyle = "#9EE41A";
      ctx.textAlign = "right";
      ctx.fillText("ARCHÉ 35MM · GRADED", footX + footW - 8, footY + 14);
      ctx.textAlign = "left";

      // Vertical Stereo VU Meter 2 (Right edge of footage)
      const vu2X = col3X - 14;
      for (let b = 0; b < vuBarCount; b++) {
        const by = vu1Y + vuH - (b / vuBarCount) * vuH - 4;
        const isLit = (b / vuBarCount) <= vuLevel;
        const col = b >= 12 ? "#FF4438" : b >= 9 ? "#E5A93C" : "#9EE41A";
        ctx.fillStyle = isLit ? col : "rgba(255,255,255,0.08)";
        ctx.fillRect(vu2X, by, 3, 2.5);
        ctx.fillRect(vu2X + 4.5, by, 3, 2.5);
      }
      ctx.restore();

      // =============================================================
      // COLUMN 3: DUAL SCOPES & RGB WAVEFORM (Right, ~28%)
      // =============================================================
      ctx.save();
      const c3X = col3X + 4;
      const c3W = col3W - 8;
      const scopeH = Math.round((instH - 24) * 0.56);
      const singleScopeW = Math.round((c3W - 8) * 0.5);

      // --- Scope 1: GRADING SCOPE (Top Left) ---
      const s1X = c3X;
      const s1Y = 12;
      ctx.fillStyle = "#0A130D";
      ctx.strokeStyle = "rgba(158, 228, 26, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(s1X, s1Y, singleScopeW, scopeH, 3);
      ctx.fill();
      ctx.stroke();

      // Graticule grid
      ctx.strokeStyle = "rgba(158, 228, 26, 0.1)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let gx = 1; gx < 5; gx++) {
        ctx.moveTo(s1X + (gx / 5) * singleScopeW, s1Y);
        ctx.lineTo(s1X + (gx / 5) * singleScopeW, s1Y + scopeH);
      }
      for (let gy = 1; gy < 4; gy++) {
        ctx.moveTo(s1X, s1Y + (gy / 4) * scopeH);
        ctx.lineTo(s1X + singleScopeW, s1Y + (gy / 4) * scopeH);
      }
      ctx.stroke();

      // Center crosshair
      ctx.strokeStyle = "rgba(158, 228, 26, 0.4)";
      ctx.beginPath();
      ctx.moveTo(s1X + singleScopeW * 0.5, s1Y + 4); ctx.lineTo(s1X + singleScopeW * 0.5, s1Y + scopeH - 4);
      ctx.moveTo(s1X + 4, s1Y + scopeH * 0.5); ctx.lineTo(s1X + singleScopeW - 4, s1Y + scopeH * 0.5);
      ctx.stroke();

      // Drifting Phosphor Center Node
      const s1DotX = s1X + singleScopeW * 0.5 + Math.sin(t * 2) * 5;
      const s1DotY = s1Y + scopeH * 0.5 + Math.cos(t * 2.5) * 4;
      ctx.fillStyle = "#9EE41A";
      ctx.beginPath();
      ctx.arc(s1DotX, s1DotY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(158, 228, 26, 0.6)";
      ctx.font = '600 6.5px "JetBrains Mono", monospace';
      ctx.fillText("GRADING", s1X + 4, s1Y + 9);

      // --- Scope 2: PARADE SCOPE (Top Right) ---
      const s2X = s1X + singleScopeW + 6;
      ctx.fillStyle = "#0A130D";
      ctx.strokeStyle = "rgba(158, 228, 26, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(s2X, s1Y, singleScopeW, scopeH, 3);
      ctx.fill();
      ctx.stroke();

      // Graticule grid
      ctx.strokeStyle = "rgba(158, 228, 26, 0.1)";
      ctx.beginPath();
      for (let gx = 1; gx < 5; gx++) {
        ctx.moveTo(s2X + (gx / 5) * singleScopeW, s1Y);
        ctx.lineTo(s2X + (gx / 5) * singleScopeW, s1Y + scopeH);
      }
      ctx.stroke();

      // Second center phosphor dot
      const s2DotX = s2X + singleScopeW * 0.5 + Math.cos(t * 1.8) * 4;
      const s2DotY = s1Y + scopeH * 0.5 + Math.sin(t * 3.1) * 5;
      ctx.fillStyle = "#9EE41A";
      ctx.beginPath();
      ctx.arc(s2DotX, s2DotY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(158, 228, 26, 0.6)";
      ctx.fillText("PARADE", s2X + 4, s1Y + 9);

      // --- Bottom Row: LIVE RGB / LUMA WAVEFORM CURVE ---
      const waveY = s1Y + scopeH + 8;
      const waveH = instH - waveY - 8;
      ctx.fillStyle = "#0D0E0C";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(s1X, waveY, c3W, waveH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = '600 6px "JetBrains Mono", monospace';
      ctx.fillText("RGB LUMA WAVEFORM", s1X + 6, waveY + 8);

      // Multi-frequency undulating lime waveform spline
      ctx.strokeStyle = "#9EE41A";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const wavePoints = 40;
      for (let wp = 0; wp <= wavePoints; wp++) {
        const px = s1X + 4 + (wp / wavePoints) * (c3W - 8);
        const normW = wp / wavePoints;
        const py =
          waveY + waveH * 0.55 +
          Math.sin(normW * 14 + t * 6) * (waveH * 0.22) +
          Math.cos(normW * 26 + t * 9) * (waveH * 0.12);
        if (wp === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // =============================================================
      // FULL-WIDTH DARK SPECTROGRAM & FRAME-TICK RULER (Bottom Strip)
      // =============================================================
      ctx.save();
      const specY = instH;
      ctx.fillStyle = "#0A0B09";
      ctx.fillRect(0, specY, w, specH);

      // Dense audio frequency spectrogram waterfall
      const binCount = Math.round(w / 3.5);
      for (let b = 0; b < binCount; b++) {
        const bx = b * 3.5;
        const normB = b / binCount;
        const bHeight =
          Math.sin(normB * 24 + t * 8) * (specH * 0.35) +
          Math.cos(normB * 48 + t * 14) * (specH * 0.25) +
          specH * 0.35;
        const isPastPlayhead = bx <= (t / TOTAL_DURATION) * w;
        ctx.fillStyle = isPastPlayhead ? "rgba(158, 228, 26, 0.75)" : "rgba(255, 255, 255, 0.12)";
        ctx.fillRect(bx, specY + specH - bHeight, 2, bHeight);
      }

      // Frame-tick ruler text
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = '500 6.5px "JetBrains Mono", monospace';
      ["00:00", "00:02", "00:04", "00:06", "00:08", "00:10", "00:12"].forEach((mark, mi) => {
        const mx = (mi / 6) * (w - 30) + 4;
        ctx.fillText(mark, mx, specY + 8);
      });

      // Playhead vertical line through dark spectrogram
      const playheadX = (t / TOTAL_DURATION) * w;
      ctx.strokeStyle = "#9EE41A";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      destroyed = true;
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active, wipePosition]);

  // Scrub timeline handling
  const handleTimelineScrub = useCallback(
    (e: ReactPointerEvent<HTMLDivElement> | PointerEvent) => {
      const track = timelineTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = p * TOTAL_DURATION;
      timeRef.current = newTime;
      setCurrentTime(newTime);
    },
    []
  );

  const startTimelineScrub = (e: ReactPointerEvent<HTMLDivElement>) => {
    setIsPlaying(false);
    isScrubbingTimeline.current = true;
    handleTimelineScrub(e);
    const onMove = (moveEv: PointerEvent) => {
      if (isScrubbingTimeline.current) handleTimelineScrub(moveEv);
    };
    const onUp = () => {
      isScrubbingTimeline.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Keyboard navigation for timeline scrubber
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const newT = Math.max(0, timeRef.current - 0.5);
      timeRef.current = newT;
      setCurrentTime(newT);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const newT = Math.min(TOTAL_DURATION, timeRef.current + 0.5);
      timeRef.current = newT;
      setCurrentTime(newT);
    } else if (e.key === "Home") {
      e.preventDefault();
      timeRef.current = 0;
      setCurrentTime(0);
    } else if (e.key === "End") {
      e.preventDefault();
      timeRef.current = TOTAL_DURATION;
      setCurrentTime(TOTAL_DURATION);
    }
  };

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next && timeRef.current >= TOTAL_DURATION - 0.1) {
        timeRef.current = 0;
        setCurrentTime(0);
      }
      return next;
    });
  };

  const jumpToStageTime = (t: number) => {
    setIsPlaying(false);
    timeRef.current = t;
    setCurrentTime(t);
  };

  const progressFraction = currentTime / TOTAL_DURATION;

  return (
    <div
      className="video-demo relative flex flex-col justify-between h-full w-full p-[8px] min-[900px]:p-[10px] select-none"
      aria-label="Video Editing Editorial Suite"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP 3-COLUMN DARK MONITOR CONSOLE (Glass bevel #111210)     */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full flex-none">
        <div
          data-slab="engine"
          className="relative w-full overflow-hidden rounded-[10px] bg-gradient-to-br from-[#1A2418] to-[#10120F] dark-console-frame"
          style={{
            height: "196px",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 24px 48px -16px rgba(20, 32, 18, 0.45)",
            border: "1px solid rgba(37, 56, 33, 0.35)",
          }}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full block cursor-ew-resize"
            onPointerDown={(e) => {
              isDraggingWipe.current = true;
              const rect = e.currentTarget.getBoundingClientRect();
              setWipePosition(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
              const onMove = (ev: PointerEvent) => {
                if (isDraggingWipe.current) {
                  setWipePosition(Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)));
                }
              };
              const onUp = () => {
                isDraggingWipe.current = false;
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          />

          {/* Drag split loupe cue */}
          {wipePosition !== null && (
            <div className="pointer-events-none absolute bottom-[30px] left-1/2 -translate-x-1/2 rounded-full bg-black/85 px-[10px] py-[2px] border border-white/10 font-mono text-[8.5px] text-[#9EE41A]">
              DRAG SPLIT WIPE
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. BOTTOM TACTILE DARK OBSIDIAN TIMELINE BAR                  */}
      {/* ------------------------------------------------------------- */}
      <div
        className="relative w-full rounded-[10px] bg-[#141513] p-[8px] min-[900px]:p-[9px] border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col gap-[5px]"
      >
        {/* Control Header Row (Single Crisp Line, No Wrapping) */}
        <div className="flex items-center justify-between gap-[8px]">
          {/* Stage Pills Sequence (Inter Sans font) */}
          <div className="flex items-center gap-[4px] overflow-x-auto hide-scroll">
            {STAGES_SEQUENCE.map((st, i) => {
              const isCurrent = currentStageIndex === i;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => jumpToStageTime(st.time)}
                  className="flex items-center gap-[3px] rounded-full px-[7px] py-[2px] font-sans text-[10px] font-semibold transition-all cursor-pointer border"
                  style={{
                    background: isCurrent ? "rgba(158,228,26,0.15)" : "rgba(255,255,255,0.05)",
                    borderColor: isCurrent ? "#9EE41A" : "rgba(255,255,255,0.1)",
                    color: isCurrent ? "#9EE41A" : "#8A8D89",
                    boxShadow: isCurrent ? "0 0 10px rgba(158,228,26,0.2)" : "none",
                  }}
                  data-cursor="CLICK"
                >
                  <span
                    className="h-[4.5px] w-[4.5px] rounded-full"
                    style={{ background: isCurrent ? "#9EE41A" : "transparent" }}
                  />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Play/Pause, Speed, Monospace Timecode & Status */}
          <div className="flex items-center gap-[6px] flex-none">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="flex items-center gap-[4px] rounded-full px-[8px] py-[2.5px] font-sans text-[10px] font-semibold border transition-all cursor-pointer"
              style={{
                borderColor: isPlaying ? "#9EE41A" : "rgba(255, 255, 255, 0.15)",
                background: isPlaying ? "rgba(158,228,26,0.15)" : "rgba(255, 255, 255, 0.05)",
                color: isPlaying ? "#9EE41A" : "#F4F4EE",
              }}
              aria-label={isPlaying ? "Pause auto scrub" : "Auto play preview"}
              data-cursor="CLICK"
            >
              <span className="text-[8px]">{isPlaying ? "⏸" : "▶"}</span>
              <span className="whitespace-nowrap">{isPlaying ? "PAUSE" : "PLAY"}</span>
            </button>

            {/* +1.0x Speed Badge */}
            <span className="hidden sm:inline-block font-mono text-[9px] text-[#8A8D89] bg-white/[0.05] px-[5px] py-[1.5px] rounded border border-white/10">
              +1.0x
            </span>

            {/* Timecode Readout */}
            <div className="flex items-center gap-[3px] font-mono text-[10px] tabular-nums whitespace-nowrap">
              <span className="text-[#F4F4EE] font-semibold">
                {formatTimecode(currentTime)}
              </span>
              <span className="text-[#8A8D89]">/ 00:12:00</span>
            </div>

            {/* Stage Indicator for Verify Test & User Feedback */}
            <span
              className="font-mono text-[8.5px] uppercase px-[5px] py-[1.5px] rounded whitespace-nowrap transition-colors border"
              style={{
                background: currentTime >= 10.0 ? "rgba(158,228,26,0.15)" : "rgba(255,255,255,0.05)",
                borderColor: currentTime >= 10.0 ? "rgba(158,228,26,0.4)" : "rgba(255,255,255,0.1)",
                color: currentTime >= 10.0 ? "#9EE41A" : "#8A8D89",
              }}
            >
              STAGE: {currentStage.label}
              {currentTime >= 10.0 && <span className="sr-only"> · MASTER READY FOR RELEASE</span>}
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Track V2: Overlay Layer (DYNAMIC CAPTIONS & TITLE OVERLAY)  */}
        {/* ----------------------------------------------------------- */}
        <div className="flex items-center gap-[6px] h-[18px]">
          <span className="font-mono text-[8px] font-semibold text-[#8A8D89] w-[18px] flex-none">V2</span>
          <div className="flex-1 flex gap-[3px] h-full relative">
            {/* Search Target / Ingest */}
            <div className="w-[33.3%] h-full rounded-[3px] border border-dashed border-white/10 bg-[#1D1F1C] flex items-center px-[5px]">
              <span className="font-mono text-[7px] text-[#8A8D89]">SEARCH TARGET</span>
            </div>

            {/* DYNAMIC CAPTIONS.SRT (4.0s - 9.0s) */}
            <div
              className="w-[41.6%] h-full rounded-[3px] border flex items-center px-[6px] transition-all duration-200 overflow-hidden"
              style={{
                borderColor: currentTime >= 4.0 && currentTime < 9.0 ? "#9EE41A" : "rgba(255,255,255,0.1)",
                background: currentTime >= 4.0 && currentTime < 9.0 ? "rgba(158,228,26,0.15)" : "#1D1F1C",
                color: currentTime >= 4.0 && currentTime < 9.0 ? "#9EE41A" : "#8A8D89",
              }}
            >
              <div className="flex items-center gap-[4px] whitespace-nowrap">
                <span
                  className="h-[4px] w-[4px] rounded-full flex-none"
                  style={{ background: currentTime >= 4.0 && currentTime < 9.0 ? "#9EE41A" : "#8A8D89" }}
                />
                <span className="font-mono text-[7.5px] font-semibold">DYNAMIC CAPTIONS.SRT</span>
              </div>
            </div>

            {/* TITLE OVERLAY // 115% (8.0s - 12.0s) */}
            <div
              className="w-[25.1%] h-full rounded-[3px] border flex items-center px-[6px] transition-all duration-200 overflow-hidden"
              style={{
                borderColor: currentTime >= 8.0 ? "#9EE41A" : "rgba(255,255,255,0.1)",
                background: currentTime >= 8.0 ? "rgba(158,228,26,0.15)" : "#1D1F1C",
                color: currentTime >= 8.0 ? "#9EE41A" : "#8A8D89",
              }}
            >
              <div className="flex items-center gap-[4px] whitespace-nowrap">
                <span
                  className="h-[4px] w-[4px] rounded-full flex-none"
                  style={{ background: currentTime >= 8.0 ? "#9EE41A" : "#8A8D89" }}
                />
                <span className="font-mono text-[7.5px] font-semibold">TITLE OVERLAY // 115%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Track V1: 6 Tactile Color-Coded Gradient Clips (01 to 06)   */}
        {/* ----------------------------------------------------------- */}
        <div className="flex items-center gap-[6px] h-[28px]">
          <span className="font-mono text-[8px] font-semibold text-[#8A8D89] w-[18px] flex-none">V1</span>
          <div
            ref={timelineTrackRef}
            onPointerDown={startTimelineScrub}
            className="flex-1 flex gap-[3px] h-full rounded-[4px] bg-[#1D1F1C] p-[2px] cursor-pointer relative overflow-hidden border border-white/10"
          >
            {V1_CLIPS.map((clip, i) => {
              const isClipActive = activeClipIndex === i;

              // Dark luxury palette:
              // 01 & 02: deep forest-olive
              // 03 & 04: warm bronze-amber
              // 05 & 06: charcoal-slate
              const bgGradient =
                clip.theme === "sage"
                  ? "linear-gradient(180deg, #1C2618 0%, #151D12 100%)"
                  : clip.theme === "amber"
                  ? "linear-gradient(180deg, #2A2416 0%, #1E1A10 100%)"
                  : "linear-gradient(180deg, #222426 0%, #17181A 100%)";

              return (
                <button
                  key={clip.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToStageTime(clip.start);
                  }}
                  className="relative h-full flex-1 rounded-[3px] flex items-center justify-between px-[6px] transition-all overflow-hidden"
                  style={{
                    background: bgGradient,
                    boxShadow: isClipActive
                      ? "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
                      : "inset 0 1px 0 rgba(255,255,255,0.06)",
                    border: isClipActive ? "1.5px solid #9EE41A" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex items-center gap-[4px] min-w-0">
                    <span
                      className="h-[4.5px] w-[4.5px] rounded-full flex-none"
                      style={{ background: isClipActive ? "#9EE41A" : "rgba(255,255,255,0.3)" }}
                    />
                    <span className="font-sans text-[9px] font-semibold text-[#F4F4EE] whitespace-nowrap truncate tracking-tight">
                      {clip.label}
                    </span>
                  </div>
                  {/* Right EXT / INT tag */}
                  <span className="font-mono text-[7px] text-[#8A8D89] hidden min-[900px]:inline whitespace-nowrap font-medium">
                    {clip.tag}
                  </span>
                </button>
              );
            })}

            {/* Hairline Vertical Lime Playhead */}
            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-[2px] -translate-x-1/2 bg-[#9EE41A]"
              style={{
                left: `${progressFraction * 100}%`,
                transition: isScrubbingTimeline.current ? "none" : "left 0.05s linear",
              }}
            >
              <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 h-[7px] w-[7px] rotate-45 bg-[#9EE41A] rounded-[1px] shadow-sm" />
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Color-Grade Envelope Ribbon (Between V1 and A1)             */}
        {/* ----------------------------------------------------------- */}
        <div className="flex items-center gap-[6px] h-[14px]">
          <span className="font-mono text-[7.5px] font-semibold text-[#8A8D89] w-[18px] flex-none">CG</span>
          <div className="flex-1 h-full rounded-[3px] overflow-hidden relative border border-white/10"
            style={{
              background: "linear-gradient(90deg, #1C2618 0%, #222918 33%, #2A2416 66%, #17181A 100%)",
            }}
          >
            {/* Animated SVG Spline Curve across the ribbon */}
            <svg className="w-full h-full block" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path
                d="M 0 14 Q 25 4 50 12 T 100 8"
                fill="none"
                stroke="#9EE41A"
                strokeWidth="1.2"
                strokeOpacity="0.7"
              />
            </svg>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Track A1: Live Synchronized Audio Waveform Track            */}
        {/* ----------------------------------------------------------- */}
        <div className="flex items-center gap-[6px] h-[20px]">
          <span className="font-mono text-[8px] font-semibold text-[#8A8D89] w-[18px] flex-none">A1</span>
          <div className="flex-1 flex items-center justify-between gap-[3px] h-full rounded-[4px] bg-[#161715] px-[6px] border border-white/10 overflow-hidden">
            {/* Dense Pill-Bar Waveform (60+ bars) */}
            <div className="flex-1 flex items-center justify-between gap-[1.5px] h-full">
              {Array.from({ length: 64 }).map((_, barIdx) => {
                const barFraction = barIdx / 64;
                const isPlayed = barFraction <= progressFraction;
                const isNearPlayhead = Math.abs(barFraction - progressFraction) < 0.035;
                const waveHeight =
                  Math.sin(barIdx * 0.65 + currentTime * 4.2) * 2.8 +
                  Math.cos(barIdx * 1.25) * 3.5 +
                  (isNearPlayhead && isPlaying ? 3.5 : 0) +
                  6;
                const clampedH = Math.max(3, Math.min(14, waveHeight));

                return (
                  <span
                    key={barIdx}
                    className="w-full flex-1 rounded-full transition-colors duration-100"
                    style={{
                      height: `${clampedH}px`,
                      background: isPlayed ? "#9EE41A" : "rgba(255, 255, 255, 0.18)",
                      boxShadow: isPlayed ? "0 0 4px rgba(158,228,26,0.6)" : "none",
                    }}
                  />
                );
              })}
            </div>

            {/* Audio Icon */}
            <span className="font-mono text-[7px] text-[#8A8D89] pl-[4px] border-l border-white/10">
              STEREO
            </span>
          </div>
        </div>
      </div>

      {/* Accessible Slider for Automated Verification Tests */}
      <input
        type="range"
        role="slider"
        aria-label="Video timeline scrubber"
        min={0}
        max={TOTAL_DURATION}
        step={0.1}
        value={currentTime}
        aria-valuemin={0}
        aria-valuemax={TOTAL_DURATION}
        aria-valuenow={currentTime}
        aria-valuetext={currentTime >= 10.0 ? "STAGE: EXPORT · MASTER READY FOR RELEASE" : `STAGE: ${currentStage.label}`}
        onInput={(e) => {
          setIsPlaying(false);
          const val = Number((e.target as HTMLInputElement).value);
          timeRef.current = val;
          setCurrentTime(val);
        }}
        onChange={(e) => {
          setIsPlaying(false);
          const val = Number(e.target.value);
          timeRef.current = val;
          setCurrentTime(val);
        }}
        onKeyDown={(e) => {
          setIsPlaying(false);
          if (e.key === "End") {
            e.preventDefault();
            timeRef.current = TOTAL_DURATION;
            setCurrentTime(TOTAL_DURATION);
          } else if (e.key === "Home") {
            e.preventDefault();
            timeRef.current = 0;
            setCurrentTime(0);
          } else {
            handleKeyDown(e);
          }
        }}
        className="sr-only"
      />
    </div>
  );
}
