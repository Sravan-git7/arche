import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { oneRailStore, MASTER_CHAPTERS, OneRailTelemetryData } from "../lib/oneRailState";

/**
 * Living chapter indicator & Master "ONE RAIL" Telemetry HUD.
 *
 * Displays the current master chapter:
 *  - 01 · HERO     (Z: +60)
 *  - 02 · PROBLEM  (Z: +32)
 *  - 03 · SERVICES (Z: 00 through -66 — rigidly locked during Services)
 *  - 04 · WORK     (Z: -90)
 *  - 05 · PRICING  (Z: -120)
 *  - 06 · CONTACT  (Z: -160)
 *
 * Plus continuous live Z-axis telemetry readout in tabular-nums monospace.
 */
export function ProgressRail() {
  const [telemetryData, setTelemetryData] = useState<OneRailTelemetryData>(() =>
    oneRailStore.getTelemetryData()
  );

  const bar = useRef<HTMLSpanElement>(null);
  const edgeBar = useRef<HTMLSpanElement>(null);
  const microDot = useRef<HTMLSpanElement>(null);
  const microBar = useRef<HTMLSpanElement>(null);

  // Subscribe to deterministic OneRail master telemetry
  useEffect(() => {
    return oneRailStore.subscribeTelemetry((data) => {
      setTelemetryData(data);
      const p = Math.max(0, Math.min(1, data.sectionProgress));
      if (microBar.current) microBar.current.style.transform = `scaleX(${p})`;
      if (microDot.current) microDot.current.style.left = `${p * 100}%`;
      if (edgeBar.current) edgeBar.current.style.transform = `scaleX(${p})`;
    });
  }, []);

  // Global page scroll bar and post-Services chapter triggers
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (s) => {
        if (bar.current) gsap.set(bar.current, { scaleY: s.progress });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const idx = Math.max(0, Math.min(MASTER_CHAPTERS.length - 1, telemetryData.chapterIdx));
  const currentChapter = MASTER_CHAPTERS[idx] ?? MASTER_CHAPTERS[0];
  const sectionProgress = Math.max(0, Math.min(1, telemetryData.sectionProgress));

  return (
    <div className="progress-rail fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex" aria-hidden="true">
      {/* ---------- compact edge version (fits cleanly in the gutter) ---------- */}
      <div className="progress-edge">
        <span className="signal-dot" />
        <span className="progress-edge-track">
          <span ref={bar} style={{ transform: "scaleY(0)" }} />
        </span>
        <span className="progress-edge-label">
          {pad(idx + 1)} · {currentChapter.label}
        </span>
        <span className="progress-edge-track progress-edge-chapter">
          <span ref={edgeBar} style={{ transform: `scaleX(${sectionProgress})` }} />
        </span>
      </div>

      {/* ---------- full HUD, only on very wide screens (>= 1700px) ---------- */}
      <div className="progress-card bg-[#F1F2EA]/95 backdrop-blur-xl border border-[#141413]/10 rounded-xl p-3 shadow-[0_12px_36px_rgba(20,20,19,0.08)]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] tracking-[.14em] text-[#141413]/60 font-semibold">
            {pad(idx + 1)} / {pad(MASTER_CHAPTERS.length)}
          </span>
          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-[#141413]/5 border border-[#141413]/10 text-[#141413] font-bold tabular-nums">
            {telemetryData.telemetry}
          </span>
        </div>
        <span key={idx} className="demo-in font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#141413] mt-0.5">
          {currentChapter.label}
        </span>
        <div className="relative mt-[3px] h-[2px] w-full overflow-visible rounded-full" style={{ background: "rgba(20,20,19,0.09)" }}>
          <span
            ref={microBar}
            className="absolute inset-0 origin-left rounded-full transition-transform duration-75 ease-out"
            style={{ background: "#9EE41A", transform: `scaleX(${sectionProgress})` }}
          />
          <span
            ref={microDot}
            className="absolute top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-75 ease-out"
            style={{ left: `${sectionProgress * 100}%`, background: "#9EE41A", boxShadow: "0 0 6px #9EE41A" }}
          />
        </div>
      </div>
    </div>
  );
}
