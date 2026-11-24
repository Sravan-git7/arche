import { useEffect, useRef, useState } from "react";

interface HeroShowreelCinemaProps {
  progress?: number; // 0 to 1 from Hero scroll expansion
  isExpanded?: boolean;
}

const CHAPTERS = [
  { id: "01", name: "FILM & COLOR", label: "01 FILM", duration: 3200 },
  { id: "02", name: "ENGINEERED WEB", label: "02 WEB", duration: 3200 },
  { id: "03", name: "AI AGENT CORE", label: "03 AI", duration: 3200 },
  { id: "04", name: "OPS AUTOMATION", label: "04 OPS", duration: 3200 },
];

export function HeroShowreelCinema({ progress = 0 }: HeroShowreelCinemaProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [chapterProgress, setChapterProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(true);

  // IntersectionObserver to pause offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3.2s Chapter Cycle with high-precision RAF timer
  useEffect(() => {
    if (!isPlaying) return;

    let start = performance.now();
    let raf = 0;
    const duration = CHAPTERS[activeChapter].duration;

    const tick = (now: number) => {
      if (!isVisibleRef.current) {
        start = now - (chapterProgress / 100) * duration;
        raf = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setChapterProgress(pct);

      if (elapsed >= duration) {
        setActiveChapter((prev) => (prev + 1) % CHAPTERS.length);
        start = performance.now();
        setChapterProgress(0);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeChapter, isPlaying]);

  // Live timecode generator
  const [timecode, setTimecode] = useState("00:04:18:14");
  useEffect(() => {
    let frame = 14;
    let sec = 18;
    const timer = setInterval(() => {
      frame = (frame + 1) % 24;
      if (frame === 0) sec = (sec + 1) % 60;
      const pad = (n: number) => String(n).padStart(2, "0");
      setTimecode(`00:04:${pad(sec)}:${pad(frame)}`);
    }, 1000 / 24);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-[#111210] text-white font-sans rounded-[inherit]"
      style={{
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 24px 60px -12px rgba(20,20,19,0.35)",
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* TOP PRODUCTION HUD BAR                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-0 inset-x-0 h-10 px-4 md:px-6 flex items-center justify-between border-b border-white/[0.08] bg-[#111210]/85 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider font-semibold text-[#9EE41A]">
            <span className="h-2 w-2 rounded-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A] animate-pulse" />
            LIVE SHOWREEL
          </span>
          <span className="hidden sm:inline-block h-3 w-px bg-white/15" />
          <span className="hidden sm:inline font-mono text-[10.5px] text-[#A8A69E] tracking-wider uppercase">
            ARCHÉ // 2026 REEL
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] font-semibold text-white/90 tracking-widest tabular-nums">
            {timecode}
          </span>
          <span className="inline-flex items-center rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[9.5px] font-medium text-[#9EE41A] border border-white/10">
            4K · 24FPS
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SHOWREEL STAGE VIEWPORTS (4 Live High-Contrast Visual Cuts)  */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-full pt-10 pb-12 overflow-hidden flex items-center justify-center">
        {/* CUT 01: FILM & COLOR (Split-Grade 35mm Wipe + Dusk Cinema Plate) */}
        <div
          className={`absolute inset-0 pt-10 pb-12 transition-opacity duration-500 ease-out ${
            activeChapter === 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Cinema Dusk Gradient Plate */}
          <div className="relative w-full h-full bg-gradient-to-tr from-[#0D0E0C] via-[#1A1815] to-[#25201A] flex items-center justify-center overflow-hidden">
            {/* Architectural Horizon Lines */}
            <div className="absolute inset-0 opacity-25">
              <div className="absolute top-1/4 inset-x-0 h-px bg-white/30" />
              <div className="absolute top-1/2 inset-x-0 h-px bg-white/40" />
              <div className="absolute top-3/4 inset-x-0 h-px bg-white/30" />
              <div className="absolute left-1/3 inset-y-0 w-px bg-white/20" />
              <div className="absolute right-1/3 inset-y-0 w-px bg-white/20" />
            </div>

            {/* Live Sweeping Color Grade Split Wipe Line */}
            <div
              className="absolute inset-y-0 w-full flex items-center"
              style={{
                clipPath: `polygon(0 0, ${chapterProgress}% 0, ${chapterProgress}% 100%, 0 100%)`,
              }}
            >
              {/* Graded Cinematic Hue Area */}
              <div className="w-full h-full bg-gradient-to-tr from-[#051408] via-[#0D2411] to-[#1F3E18] opacity-90 flex items-center justify-center" />
            </div>

            {/* Vertical #9EE41A Laser Wipe Hairline */}
            <div
              className="absolute inset-y-0 w-[2px] bg-[#9EE41A] shadow-[0_0_12px_#9EE41A] z-10"
              style={{ left: `${chapterProgress}%` }}
            >
              <div className="absolute top-6 -translate-x-1/2 bg-[#111210] border border-[#9EE41A] text-[#9EE41A] font-mono text-[9px] px-1.5 py-0.5 rounded shadow">
                DA VINCI
              </div>
            </div>

            {/* Cut 01 Centerpiece Visual Graphic */}
            <div className="relative z-20 flex flex-col items-center text-center px-6">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#9EE41A] mb-2 font-semibold">
                CHAPTER 01 // CINEMATOGRAPHY & POST
              </span>
              <h3 className="text-[clamp(28px,4.2vw,56px)] font-bold tracking-[-0.035em] text-white leading-tight">
                Commercial Film & 35mm Finish
              </h3>
              <p className="mt-2 font-mono text-[12px] text-white/60 tracking-wider">
                RED MONSTRO 8K · ARRI MASTER PRIMES · ACES COLOR PIPELINE
              </p>

              {/* Viewfinder Reticle & Calipers */}
              <div className="mt-6 flex items-center gap-6 font-mono text-[11px] text-white/70 bg-[#111210]/70 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                <span>FPS: 23.976</span>
                <span className="text-[#9EE41A]">SHUTTER: 1/48</span>
                <span>ISO: 800</span>
                <span className="text-[#9EE41A]">LUT: ARCHÉ_FILM_04</span>
              </div>
            </div>
          </div>
        </div>

        {/* CUT 02: ENGINEERED WEB (Live Interface Assembly & Confirm Click) */}
        <div
          className={`absolute inset-0 pt-10 pb-12 transition-opacity duration-500 ease-out ${
            activeChapter === 1 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="relative w-full h-full bg-[#141513] flex items-center justify-center p-6 md:p-10 overflow-hidden">
            {/* Background UI Grid */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Simulated Live Architectural Interface Window */}
            <div className="relative w-full max-w-[620px] rounded-xl border border-white/15 bg-[#1B1D19]/90 shadow-2xl overflow-hidden backdrop-blur-md z-10">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E5484D]/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FFB224]/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#9EE41A]/80" />
                  <span className="font-mono text-[10px] text-white/50 ml-2">arché.studio / client-portal</span>
                </div>
                <span className="font-mono text-[9.5px] text-[#9EE41A] font-semibold">120 FPS · REACT CORE</span>
              </div>

              {/* Window Content */}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-[16px] tracking-tight">System Deployment Status</h4>
                    <p className="text-white/50 text-[11px] font-mono">Edge Cluster // Global Latency: 32ms</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#9EE41A]/15 border border-[#9EE41A]/40 text-[#9EE41A] font-mono text-[10px] font-bold">
                    ONLINE
                  </span>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2.5 font-mono">
                  <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <span className="text-white/40 text-[9.5px] block">THROUGHPUT</span>
                    <span className="text-white font-bold text-[14px]">2.4 GB/s</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <span className="text-white/40 text-[9.5px] block">CONVERSIONS</span>
                    <span className="text-[#9EE41A] font-bold text-[14px]">+48.2%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <span className="text-white/40 text-[9.5px] block">UPTIME</span>
                    <span className="text-white font-bold text-[14px]">99.99%</span>
                  </div>
                </div>

                {/* Simulated Live Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="font-mono text-[11px] text-white/70">Awaiting Pipeline Confirmation:</span>
                  <div className="relative">
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-lg bg-[#9EE41A] text-[#111210] font-mono text-[11px] font-bold shadow-[0_0_12px_rgba(158,228,26,0.4)]"
                    >
                      CONFIRM DEPLOY →
                    </button>
                    {/* Simulated Cursor clicking Confirm */}
                    <div
                      className="absolute -bottom-2 -right-2 pointer-events-none transition-transform duration-700 ease-out"
                      style={{
                        transform:
                          chapterProgress > 50
                            ? "translate(-18px, -14px) scale(0.92)"
                            : "translate(20px, 20px) scale(1)",
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 3L11 20L14 13L21 10L4 3Z"
                          fill="#FFFFFF"
                          stroke="#111210"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CUT 03: AI AGENT CORE (Neural Pulse & Live Qualified Booking) */}
        <div
          className={`absolute inset-0 pt-10 pb-12 transition-opacity duration-500 ease-out ${
            activeChapter === 2 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="relative w-full h-full bg-[#101211] flex items-center justify-center p-6 overflow-hidden">
            {/* Luminous Neural Rays in background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-[380px] h-[380px] rounded-full bg-[#9EE41A] blur-[110px]" />
            </div>

            <div className="relative w-full max-w-[600px] flex flex-col gap-3 z-10 font-mono">
              {/* Telemetry pill */}
              <div className="self-center flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-white/70 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
                AUTONOMOUS CLIENT QUALIFICATION AGENT · 1.2S ROUNDTRIP
              </div>

              {/* Chat Message 1 (Incoming Lead) */}
              <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm p-3.5 bg-white/[0.07] border border-white/10 text-white text-[12px] leading-relaxed">
                <span className="text-[#9EE41A] text-[10px] block font-bold mb-1">PROSPECT // INBOUND</span>
                "We need a unified digital system: new flagship web architecture + automated lead routing for our 12-person team."
              </div>

              {/* AI Agent Processing Node */}
              <div className="self-center flex items-center gap-2 text-[10px] text-white/50 my-0.5">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>PARSING INTENT · EVALUATING SCOPE · CALENDAR SYNC</span>
              </div>

              {/* Chat Message 2 (AI Qualified Match) */}
              <div
                className="self-end max-w-[90%] rounded-2xl rounded-tr-sm p-4 bg-[#142211] border border-[#9EE41A]/50 text-white text-[12.5px] shadow-[0_0_24px_rgba(158,228,26,0.18)] transition-all duration-300"
                style={{
                  transform: chapterProgress > 30 ? "translateY(0)" : "translateY(12px)",
                  opacity: chapterProgress > 30 ? 1 : 0,
                }}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#9EE41A]/20">
                  <span className="text-[#9EE41A] font-bold text-[10.5px]">QUALIFIED MATCH // CONFIRMED ✓</span>
                  <span className="text-white/60 text-[9.5px]">CONFIDENCE: 98.4%</span>
                </div>
                <p className="text-white/90 text-[12px] leading-relaxed">
                  "Scope fits Arché Systems Architecture. Lead value estimated at $24,800. Discovery session booked with Partner for Thursday, 10:30 AM."
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/60">
                  <span>DISPATCHED TO CRM & CALENDAR</span>
                  <span className="text-[#9EE41A] font-bold">LATENCY: 1.18s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CUT 04: OPS AUTOMATION (4 Simultaneous High-Speed Pipelines) */}
        <div
          className={`absolute inset-0 pt-10 pb-12 transition-opacity duration-500 ease-out ${
            activeChapter === 3 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="relative w-full h-full bg-[#111311] flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Header */}
            <div className="text-center mb-6 z-10">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#9EE41A] font-semibold">
                CHAPTER 04 // ZERO-DRIFT AUTOMATION PIPELINE
              </span>
              <h3 className="text-[clamp(24px,3.5vw,44px)] font-bold tracking-tight text-white mt-1">
                4 Endpoints Synchronized Simultaneously
              </h3>
            </div>

            {/* Central Node & 4 Branching Conduits */}
            <div className="relative w-full max-w-[640px] grid grid-cols-2 sm:grid-cols-4 gap-3 z-10 font-mono text-[11px]">
              {[
                { name: "01 · INBOX", action: "PARSED & DISPATCHED", status: "1.2s", icon: "✉" },
                { name: "02 · SHEET", action: "DUAL-SYNC ROW WRITTEN", status: "0-DRIFT", icon: "▦" },
                { name: "03 · CRM", action: "DEAL #2048 CREATED", status: "$24.8K", icon: "◈" },
                { name: "04 · SLACK", action: "TEAM CHANNEL ALERTED", status: "LIVE", icon: "⚡" },
              ].map((pipe, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-3 bg-white/[0.04] border border-white/10 flex flex-col justify-between transition-all duration-300"
                  style={{
                    borderColor: chapterProgress > idx * 22 ? "#9EE41A" : "rgba(255,255,255,0.1)",
                    boxShadow:
                      chapterProgress > idx * 22 ? "0 0 16px rgba(158,228,26,0.25)" : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-[12px]">{pipe.name}</span>
                    <span className="text-[#9EE41A] text-[13px]">{pipe.icon}</span>
                  </div>
                  <div className="text-[10px] text-white/50 leading-tight mb-2">
                    {pipe.action}
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[9.5px]">
                    <span className="text-white/40">STATUS</span>
                    <span className="text-[#9EE41A] font-bold">{pipe.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Global Pipeline Telemetry Bar */}
            <div className="mt-6 flex items-center gap-4 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 font-mono text-[10.5px] text-white/70">
              <span className="flex items-center gap-1.5 text-[#9EE41A] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
                EXECUTION SPEED: 5× FASTER
              </span>
              <span>·</span>
              <span>MANUAL ENTRY: 0 HOURS</span>
              <span>·</span>
              <span className="text-white">ERROR RATE: 0.00%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM CHAPTER SELECTOR & LIVE PROGRESS BAR                  */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-0 inset-x-0 h-12 px-4 md:px-6 flex items-center justify-between border-t border-white/[0.08] bg-[#111210]/95 backdrop-blur-md z-30">
        <div className="flex items-center gap-1 sm:gap-2 flex-1 max-w-[680px]">
          {CHAPTERS.map((chap, idx) => {
            const isCur = idx === activeChapter;
            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => {
                  setActiveChapter(idx);
                  setChapterProgress(0);
                }}
                className={`flex-1 relative py-1 px-2 rounded flex flex-col text-left transition-colors duration-200 cursor-pointer ${
                  isCur ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] sm:text-[11px] font-semibold mb-1">
                  <span>{chap.label}</span>
                  {isCur && <span className="text-[#9EE41A] text-[9px] font-bold">PLAYING</span>}
                </div>
                {/* Micro Progress Track */}
                <div className="w-full h-[2px] bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#9EE41A] transition-all duration-75 ease-linear rounded-full"
                    style={{
                      width: isCur ? `${chapterProgress}%` : idx < activeChapter ? "100%" : "0%",
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Play / Pause Toggle Button */}
        <div className="ml-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/[0.14] text-white/80 font-mono text-[10px] tracking-wider transition-colors cursor-pointer border border-white/10"
          >
            <span>{isPlaying ? "PAUSE ❚❚" : "PLAY ▶"}</span>
          </button>
        </div>
      </div>

      {/* Subtle Widescreen Expansion Floating Corner Telemetry (visible when scrolled) */}
      <div
        className="pointer-events-none absolute bottom-14 left-6 z-20 font-mono text-[11px] text-[#9EE41A] tracking-wider font-semibold transition-opacity duration-300"
        style={{ opacity: Math.max(0, (progress - 0.35) * 2) }}
      >
        ARCHÉ // 04 VERTICALS · ONE CONNECTED SYSTEM
      </div>
    </div>
  );
}
