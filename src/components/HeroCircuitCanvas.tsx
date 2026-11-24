import { useEffect, useRef } from "react";

interface HeroCircuitCanvasProps {
  hoveredIndex: number | null;
  reducedMotion?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface CircuitTrace {
  id: number;
  points: Point[];
  totalLength: number;
  segmentLengths: number[];
}

interface SignalPacket {
  traceIndex: number;
  t: number; // 0 to 1
  speed: number;
  trailLength: number; // in pixels
  color: string;
  glowBlur: number;
  isSurge?: boolean;
}

export function HeroCircuitCanvas({ hoveredIndex, reducedMotion }: HeroCircuitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{ targetX: number; targetY: number; currentX: number; currentY: number; active: boolean }>({
    targetX: -9999,
    targetY: -9999,
    currentX: -9999,
    currentY: -9999,
    active: false,
  });

  const isVisibleRef = useRef<boolean>(true);
  const surgePacketsRef = useRef<SignalPacket[]>([]);

  // Trigger surge packets when a bottom index node is hovered
  useEffect(() => {
    if (hoveredIndex === null || reducedMotion) return;
    const traceIdx = hoveredIndex; // 0: Film, 1: Web, 2: Agent, 3: Ops
    surgePacketsRef.current.push(
      {
        traceIndex: traceIdx,
        t: 0.0,
        speed: 0.016,
        trailLength: 54,
        color: "#9EE41A",
        glowBlur: 14,
        isSurge: true,
      },
      {
        traceIndex: traceIdx,
        t: -0.06,
        speed: 0.016,
        trailLength: 42,
        color: "#C4F566",
        glowBlur: 10,
        isSurge: true,
      }
    );
  }, [hoveredIndex, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let rafId = 0;
    let width = 0;
    let height = 0;

    // Track visibility to completely pause render loop when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.targetX = e.clientX - rect.left;
      pointerRef.current.targetY = e.clientY - rect.top;
      pointerRef.current.active = true;
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    // Helpers to build parametric traces
    let traces: CircuitTrace[] = [];

    const rebuildTraces = (w: number, h: number) => {
      // 4 Main Margins Architectural Traces running from bottom rail to outer margin chips
      // Trace 0: Bottom Node 01 (w * 0.125) -> Left outer margin -> Chip 01 (w * 0.08, h * 0.26) -> top loop
      const p0: Point[] = [
        { x: w * 0.125, y: h * 0.94 },
        { x: w * 0.055, y: h * 0.94 },
        { x: w * 0.045, y: h * 0.93 },
        { x: w * 0.045, y: h * 0.28 },
        { x: w * 0.075, y: h * 0.25 },
        { x: w * 0.075, y: h * 0.11 },
        { x: w * 0.16, y: h * 0.11 },
      ];

      // Trace 1: Bottom Node 02 (w * 0.375) -> Left inner margin -> Chip 02 (w * 0.09, h * 0.68)
      const p1: Point[] = [
        { x: w * 0.375, y: h * 0.94 },
        { x: w * 0.23, y: h * 0.94 },
        { x: w * 0.13, y: h * 0.84 },
        { x: w * 0.13, y: h * 0.68 },
        { x: w * 0.085, y: h * 0.68 },
        { x: w * 0.085, y: h * 0.44 },
      ];

      // Trace 2: Bottom Node 03 (w * 0.625) -> Right inner margin -> Chip 04 (w * 0.91, h * 0.68)
      const p2: Point[] = [
        { x: w * 0.625, y: h * 0.94 },
        { x: w * 0.77, y: h * 0.94 },
        { x: w * 0.87, y: h * 0.84 },
        { x: w * 0.87, y: h * 0.68 },
        { x: w * 0.915, y: h * 0.68 },
        { x: w * 0.915, y: h * 0.44 },
      ];

      // Trace 3: Bottom Node 04 (w * 0.875) -> Right outer margin -> Chip 03 (w * 0.92, h * 0.26) -> top loop
      const p3: Point[] = [
        { x: w * 0.875, y: h * 0.94 },
        { x: w * 0.945, y: h * 0.94 },
        { x: w * 0.955, y: h * 0.93 },
        { x: w * 0.955, y: h * 0.28 },
        { x: w * 0.925, y: h * 0.25 },
        { x: w * 0.925, y: h * 0.11 },
        { x: w * 0.84, y: h * 0.11 },
      ];

      const raw = [p0, p1, p2, p3];

      traces = raw.map((pts, id) => {
        const segLens: number[] = [];
        let total = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
          segLens.push(d);
          total += d;
        }
        return {
          id,
          points: pts,
          totalLength: total,
          segmentLengths: segLens,
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildTraces(width, height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initial 8 continuous traveling signal packets (2 per trace, staggered speeds)
    const continuousPackets: SignalPacket[] = [
      { traceIndex: 0, t: 0.12, speed: 0.0035, trailLength: 36, color: "#9EE41A", glowBlur: 8 },
      { traceIndex: 0, t: 0.62, speed: 0.0035, trailLength: 32, color: "#9EE41A", glowBlur: 7 },
      { traceIndex: 1, t: 0.25, speed: 0.0042, trailLength: 38, color: "#9EE41A", glowBlur: 8 },
      { traceIndex: 1, t: 0.78, speed: 0.0042, trailLength: 30, color: "#9EE41A", glowBlur: 6 },
      { traceIndex: 2, t: 0.35, speed: 0.0040, trailLength: 36, color: "#9EE41A", glowBlur: 8 },
      { traceIndex: 2, t: 0.85, speed: 0.0040, trailLength: 32, color: "#9EE41A", glowBlur: 7 },
      { traceIndex: 3, t: 0.05, speed: 0.0038, trailLength: 40, color: "#9EE41A", glowBlur: 8 },
      { traceIndex: 3, t: 0.55, speed: 0.0038, trailLength: 34, color: "#9EE41A", glowBlur: 7 },
    ];

    // Helper: interpolate point along polyline
    const getPointAt = (trace: CircuitTrace, normT: number): { pt: Point; angle: number } | null => {
      const dist = Math.max(0, Math.min(1, normT)) * trace.totalLength;
      let walked = 0;
      for (let i = 0; i < trace.segmentLengths.length; i++) {
        const segLen = trace.segmentLengths[i];
        if (walked + segLen >= dist || i === trace.segmentLengths.length - 1) {
          const segT = segLen > 0 ? (dist - walked) / segLen : 0;
          const pA = trace.points[i];
          const pB = trace.points[i + 1];
          const x = pA.x + (pB.x - pA.x) * segT;
          const y = pA.y + (pB.y - pA.y) * segT;
          const angle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
          return { pt: { x, y }, angle };
        }
        walked += segLen;
      }
      return null;
    };

    // Render loop
    let lastTime = performance.now();

    const render = (time: number) => {
      rafId = requestAnimationFrame(render);
      if (!isVisibleRef.current) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smooth pointer lerp
      const ptr = pointerRef.current;
      if (ptr.active) {
        ptr.currentX += (ptr.targetX - ptr.currentX) * 0.10;
        ptr.currentY += (ptr.targetY - ptr.currentY) * 0.10;
      } else {
        ptr.currentX += (-9999 - ptr.currentX) * 0.05;
        ptr.currentY += (-9999 - ptr.currentY) * 0.05;
      }

      // -------------------------------------------------------------
      // 1. BASE ARCHITECTURAL CIRCUIT TRACES & TERMINAL PADS
      // -------------------------------------------------------------
      ctx.lineWidth = 1;
      for (let i = 0; i < traces.length; i++) {
        const trace = traces[i];
        const pts = trace.points;
        if (pts.length < 2) continue;

        ctx.strokeStyle = "rgba(20, 20, 19, 0.05)";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length; j++) {
          ctx.lineTo(pts[j].x, pts[j].y);
        }
        ctx.stroke();

        // Terminal pads (circles with micro crosshair)
        for (let j = 0; j < pts.length; j++) {
          if (j === 0 || j === pts.length - 1 || j === 3) {
            const p = pts[j];
            ctx.fillStyle = "rgba(20, 20, 19, 0.07)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // -------------------------------------------------------------
      // 2. CONTINUOUS & SURGE TRAVELING LIGHT PACKETS
      // -------------------------------------------------------------
      const allPackets = [...continuousPackets, ...surgePacketsRef.current];

      for (let i = 0; i < allPackets.length; i++) {
        const pkt = allPackets[i];
        if (!reducedMotion) {
          pkt.t += pkt.speed * (dt * 60);
          if (pkt.t > 1.0) {
            if (pkt.isSurge) {
              // Expire surge packet
              continue;
            } else {
              pkt.t = 0.0;
            }
          }
        }

        if (pkt.t < 0) continue; // Waiting to launch

        const trace = traces[pkt.traceIndex];
        if (!trace) continue;

        const info = getPointAt(trace, pkt.t);
        if (!info) continue;

        const { pt } = info;

        // Draw fading tail along previous positions
        const steps = 6;
        for (let s = 1; s <= steps; s++) {
          const trailT = pkt.t - (s / steps) * (pkt.trailLength / trace.totalLength);
          if (trailT >= 0) {
            const trailInfo = getPointAt(trace, trailT);
            if (trailInfo) {
              const alpha = (1 - s / steps) * 0.45;
              ctx.strokeStyle = `rgba(158, 228, 26, ${alpha})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(trailInfo.pt.x, trailInfo.pt.y, 1.2, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(158, 228, 26, ${alpha})`;
              ctx.fill();
            }
          }
        }

        // Glowing packet head
        ctx.save();
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = pkt.glowBlur;
        ctx.fillStyle = pkt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pkt.isSurge ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Clean up finished surge packets
      surgePacketsRef.current = surgePacketsRef.current.filter((p) => p.t <= 1.0);

      // -------------------------------------------------------------
      // 3. INTERACTIVE CURSOR GRID-REVEAL & CALIBRATION CROSSHAIRS
      // -------------------------------------------------------------
      if (ptr.active && ptr.currentX > 0 && ptr.currentY > 0) {
        const radius = 180;
        const gridStep = 80;

        // Draw subtle calibration rings around cursor
        ctx.save();
        ctx.strokeStyle = "rgba(158, 228, 26, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ptr.currentX, ptr.currentY, 26, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(158, 228, 26, 0.08)";
        ctx.beginPath();
        ctx.arc(ptr.currentX, ptr.currentY, 68, 0, Math.PI * 2);
        ctx.stroke();

        // 4 tiny tick marks at 0, 90, 180, 270 deg
        const ticks = [
          { dx: 26, dy: 0 },
          { dx: -26, dy: 0 },
          { dx: 0, dy: 26 },
          { dx: 0, dy: -26 },
        ];
        ctx.strokeStyle = "rgba(158, 228, 26, 0.4)";
        for (const tk of ticks) {
          ctx.beginPath();
          ctx.moveTo(ptr.currentX + tk.dx - 2, ptr.currentY + tk.dy);
          ctx.lineTo(ptr.currentX + tk.dx + 2, ptr.currentY + tk.dy);
          ctx.moveTo(ptr.currentX + tk.dx, ptr.currentY + tk.dy - 2);
          ctx.lineTo(ptr.currentX + tk.dx, ptr.currentY + tk.dy + 2);
          ctx.stroke();
        }
        ctx.restore();

        // Reveal grid intersection crosshairs inside radius
        const minX = Math.floor((ptr.currentX - radius) / gridStep) * gridStep;
        const maxX = Math.ceil((ptr.currentX + radius) / gridStep) * gridStep;
        const minY = Math.floor((ptr.currentY - radius) / gridStep) * gridStep;
        const maxY = Math.ceil((ptr.currentY + radius) / gridStep) * gridStep;

        for (let gx = minX; gx <= maxX; gx += gridStep) {
          for (let gy = minY; gy <= maxY; gy += gridStep) {
            const d = Math.hypot(gx - ptr.currentX, gy - ptr.currentY);
            if (d < radius) {
              const alpha = (1 - d / radius) * 0.85;

              // Registration '+' Crosshair
              ctx.strokeStyle = `rgba(158, 228, 26, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(gx - 4, gy);
              ctx.lineTo(gx + 4, gy);
              ctx.moveTo(gx, gy - 4);
              ctx.lineTo(gx, gy + 4);
              ctx.stroke();

              // Tiny center dot
              ctx.fillStyle = `rgba(158, 228, 26, ${alpha * 0.9})`;
              ctx.beginPath();
              ctx.arc(gx, gy, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // -------------------------------------------------------------
      // 4. CLEAN CENTER READABILITY ZONE (Soft Radial Fade Out)
      // Guarantees zero clutter or distraction behind centered typography
      // -------------------------------------------------------------
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const cx = width / 2;
      const cy = height * 0.46;
      const innerR = Math.min(width * 0.16, 120);
      const outerR = Math.min(width * 0.44, 480);

      const radGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      radGrad.addColorStop(0.0, "rgba(0, 0, 0, 1.0)");
      radGrad.addColorStop(0.55, "rgba(0, 0, 0, 0.92)");
      radGrad.addColorStop(0.85, "rgba(0, 0, 0, 0.40)");
      radGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-0"
      style={{ willChange: "transform" }}
      aria-hidden="true"
    />
  );
}
