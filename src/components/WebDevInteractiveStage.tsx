import { useEffect, useRef, useState } from "react";

/**
 * WebDevInteractiveStage
 *
 * Flagship interactive showcase for Web Development:
 * - Sleek frameless desktop browser showcase with traffic lights, URL bar, sub-35ms telemetry badge
 * - Clean mini-navbar at top of preview (AC Arché mark, Work · Services · Process, Start a Project pill)
 * - Elevated hero block with refined #11120F / #595D55 contrast and #9EE41A dot accent
 * - Rich 3-column bento / proof strip (99 Lighthouse ring, 34ms interaction speed, Dark-Obsidian CRM tile)
 * - Rich scrollable architecture & conversion sections below the fold clearing the mobile phone frame
 * - Overlapping synchronized matte-black mobile phone preview on the bottom-right (data-cursor="view")
 */
export function WebDevInteractiveStage() {
  const [scrollProgress, setScrollProgress] = useState(0.18);
  const [isInteracting, setIsInteracting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  // Auto-scroll gentle breath when not interacting
  useEffect(() => {
    if (isInteracting) return;
    let frameId: number;
    let t = 0;

    const animate = () => {
      t += 0.007;
      // Oscillate gently between 0.10 and 0.60
      const target = 0.32 + Math.sin(t) * 0.22;
      setScrollProgress(target);

      if (desktopScrollRef.current && mobileScrollRef.current) {
        const d = desktopScrollRef.current;
        const m = mobileScrollRef.current;
        const dMax = d.scrollHeight - d.clientHeight;
        const mMax = m.scrollHeight - m.clientHeight;
        if (dMax > 0) d.scrollTop = target * dMax;
        if (mMax > 0) m.scrollTop = target * mMax;
      }
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isInteracting]);

  // Handle desktop manual scroll
  const handleDesktopScroll = () => {
    if (isSyncingRef.current || !desktopScrollRef.current || !mobileScrollRef.current) return;
    isSyncingRef.current = true;
    const d = desktopScrollRef.current;
    const m = mobileScrollRef.current;
    const progress = d.scrollTop / (d.scrollHeight - d.clientHeight || 1);
    setScrollProgress(progress);
    m.scrollTop = progress * (m.scrollHeight - m.clientHeight || 1);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 10);
  };

  // Handle mobile manual scroll
  const handleMobileScroll = () => {
    if (isSyncingRef.current || !desktopScrollRef.current || !mobileScrollRef.current) return;
    isSyncingRef.current = true;
    const d = desktopScrollRef.current;
    const m = mobileScrollRef.current;
    const progress = m.scrollTop / (m.scrollHeight - m.clientHeight || 1);
    setScrollProgress(progress);
    d.scrollTop = progress * (d.scrollHeight - d.clientHeight || 1);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 10);
  };

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText("https://www.archecreativestudios.in");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      className="relative w-full rounded-2xl md:rounded-3xl bg-[#0E0F0D] p-3 sm:p-5 md:p-6 border border-[#141413]/20 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)]"
      onPointerEnter={() => setIsInteracting(true)}
      onPointerLeave={() => setIsInteracting(false)}
    >
      {/* Top Console Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/[0.08]">
        {/* Left: Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-[0_0_6px_rgba(255,95,86,0.5)]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[0_0_6px_rgba(255,189,46,0.5)]" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] shadow-[0_0_6px_rgba(39,201,63,0.5)]" />
          </div>
          <span className="ml-2 hidden sm:inline-block font-mono text-[11px] text-white/40 uppercase tracking-widest">
            ARCHÉ ENGINE · 60FPS
          </span>
        </div>

        {/* Center: URL Pill */}
        <button
          type="button"
          onClick={handleCopyUrl}
          title="Click to copy official URL"
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] transition-colors cursor-pointer group"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
          <span className="font-mono text-[11px] text-white/70 group-hover:text-white transition-colors">
            https://www.archecreativestudios.in
          </span>
          <span className="font-mono text-[9px] text-[#9EE41A] uppercase tracking-wider pl-1">
            {copiedUrl ? "COPIED!" : "200 OK"}
          </span>
        </button>

        {/* Right: Telemetry Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#9EE41A]/10 border border-[#9EE41A]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
            <span className="font-mono text-[10.5px] font-semibold text-[#9EE41A]">
              34ms FCP
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.06]">
            <span className="font-mono text-[10px] text-white/60">CLS: 0.00</span>
          </div>
        </div>
      </div>

      {/* Main Preview Workspace */}
      <div className="relative mt-3 sm:mt-4 aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#181916] border border-white/[0.06]">
        {/* DESKTOP BROWSER VIEWPORT */}
        <div
          ref={desktopScrollRef}
          onScroll={handleDesktopScroll}
          className="w-full h-full overflow-y-auto scrollbar-none scroll-smooth select-none bg-[#F7F6EE] text-[#141413]"
          style={{ overscrollBehavior: "contain" }}
        >
          {/* Simulated Living Arché Flagship Site */}
          <div className="w-full min-h-[200%] flex flex-col">
            {/* 1. Clean Mini-Navbar at the Top */}
            <div className="pt-4 px-6 sm:px-8 flex items-center justify-between border-b border-[#141413]/[0.08] pb-3.5 sticky top-0 bg-[#F7F6EE]/92 backdrop-blur-md z-10">
              {/* Left: AC Arché Mark */}
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-[6px] bg-[#141413] flex items-center justify-center font-mono text-[9px] font-bold text-[#9EE41A] shadow-sm">
                  AC
                </span>
                <span className="font-bold text-[13px] tracking-tight text-[#141413]">Arché</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_rgba(158,228,26,0.8)] animate-pulse" />
              </div>

              {/* Center: Subtle Mini Nav Links */}
              <div className="hidden sm:flex items-center gap-5 font-sans text-[11px] font-medium text-[#141413]/70">
                <span className="text-[#141413] font-semibold">Work</span>
                <span className="text-[#141413]/70">Services</span>
                <span className="text-[#141413]/70">Process</span>
              </div>

              {/* Right: Mini Start a Project Pill (kept cleanly to the left of the floating SYNCED VIEWPORTS pill) */}
              <div className="flex items-center gap-3 sm:mr-44 md:mr-48">
                <div className="px-3 py-1 rounded-full bg-[#141413] text-[#F4F4EE] text-[10px] font-semibold tracking-tight shadow-sm flex items-center gap-1">
                  <span>Start a Project</span>
                  <span className="text-[#9EE41A]">→</span>
                </div>
              </div>
            </div>

            {/* 2. Elevated Hero Block */}
            <div className="pt-6 sm:pt-7 pb-2 px-6 sm:px-8 max-w-[66%] sm:max-w-[68%]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8E6D3] text-[#141413] text-[9.5px] font-mono uppercase tracking-wider mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#72B314]" />
                TECHNOLOGY MEETS CREATIVITY
              </div>

              <h2 className="text-xl sm:text-[27px] md:text-[31px] font-bold tracking-[-0.035em] leading-[1.08] text-[#11120F]">
                We don't just build websites. <br />
                <span className="text-[#595D55] inline-flex items-center gap-1.5">
                  We build digital experiences.
                  <span className="inline-block w-2 h-2 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
                </span>
              </h2>

              <p className="mt-2 text-[12px] sm:text-[13px] text-[#595C56] leading-relaxed max-w-[440px]">
                Sub-35ms responsive platforms engineered with React, fluid GSAP physics, and zero template bloat.
              </p>

              {/* Dual Action Pills */}
              <div className="mt-4 flex items-center gap-2.5">
                <div className="px-3.5 py-1.5 rounded-full bg-[#141413] text-[#F4F4EE] text-[10.5px] font-semibold shadow-sm flex items-center gap-1">
                  <span>Explore Architecture</span>
                  <span className="text-[#9EE41A]">→</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-full border border-[#141413]/20 text-[#141413] text-[10.5px] font-semibold bg-white/40">
                  Performance Audit
                </div>
              </div>
            </div>

            {/* 3. Rich 3-Column Bento / Proof Strip (max-w-[68%] clearing phone preview) */}
            <div className="mt-6 px-6 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[66%] sm:max-w-[68%]">
              {/* Card 1: 99 Lighthouse Performance */}
              <div className="p-3 rounded-xl bg-[#EBE8D8] border border-[#141413]/[0.06] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-[#72B314] uppercase tracking-wider">
                    01 · SPEED
                  </span>
                  <div className="w-5 h-5 rounded-full border-2 border-[#72B314] flex items-center justify-center font-mono text-[8.5px] font-bold text-[#141413]">
                    99
                  </div>
                </div>
                <div className="mt-2.5">
                  <p className="text-[11.5px] font-bold text-[#141413] leading-tight">
                    Lighthouse Performance
                  </p>
                  <p className="text-[9.5px] text-[#595C56] mt-0.5 font-mono">Sub-second load</p>
                </div>
              </div>

              {/* Card 2: 34ms Interaction Speed */}
              <div className="p-3 rounded-xl bg-[#EBE8D8] border border-[#141413]/[0.06] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-[#72B314] uppercase tracking-wider">
                    02 · LATENCY
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#9EE41A] animate-pulse shadow-[0_0_6px_#9EE41A]" />
                </div>
                <div className="mt-2.5">
                  <p className="text-[11.5px] font-bold text-[#141413] leading-tight">
                    34ms Interaction Speed
                  </p>
                  <p className="text-[9.5px] text-[#595C56] mt-0.5 font-mono">Zero layout shift</p>
                </div>
              </div>

              {/* Card 3: Sleek Mini Dark-Obsidian Preview Tile */}
              <div className="p-3 rounded-xl bg-[#141413] text-[#F4F4EE] border border-white/10 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-[#9EE41A] uppercase tracking-wider">
                    03 · CONVERT
                  </span>
                  <span className="font-mono text-[8px] text-white/50 tracking-wider">ACTIVE</span>
                </div>
                <div className="mt-2.5">
                  <p className="text-[11.5px] font-bold text-[#F4F4EE] leading-tight">
                    Live Booking Flow
                  </p>
                  <p className="text-[9.5px] text-[#9EE41A] mt-0.5 font-mono">Instant CRM Sync</p>
                </div>
              </div>
            </div>

            {/* 4. Rich Scrollable Sections Below the Fold (Clearing mobile frame) */}
            <div className="mt-7 px-6 sm:px-8 pb-10 max-w-[66%] sm:max-w-[68%]">
              {/* Architecture & Telemetry Row */}
              <div className="pt-5 border-t border-[#141413]/[0.08]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] text-[#72B314] font-bold uppercase tracking-wider">
                    • 02 ARCHITECTURAL INTEGRITY
                  </span>
                  <span className="font-mono text-[9.5px] text-[#595C56]">100% AUDITED</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#141413]/90">
                  <div className="p-2.5 rounded-lg bg-[#EAE7D6] border border-[#141413]/[0.05]">
                    <span className="font-mono text-[9px] text-[#595C56] block">COMPOSITOR</span>
                    <span className="font-semibold">60fps GPU Transforms</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#EAE7D6] border border-[#141413]/[0.05]">
                    <span className="font-mono text-[9px] text-[#595C56] block">BUNDLE SIZE</span>
                    <span className="font-semibold">&lt; 35kB Initial Payload</span>
                  </div>
                </div>
              </div>

              {/* Conversion & Lead Flow Row */}
              <div className="mt-6 pt-5 border-t border-[#141413]/[0.08]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] text-[#72B314] font-bold uppercase tracking-wider">
                    • 03 DIRECT INBOUND FUNNEL
                  </span>
                  <span className="font-mono text-[9.5px] text-[#595C56]">CRM WEBHOOK</span>
                </div>

                <div className="p-3 rounded-xl bg-[#EBE8D8] border border-[#141413]/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#141413] text-[#9EE41A] font-mono text-[9px] font-bold flex items-center justify-center">
                      ✓
                    </span>
                    <div>
                      <p className="text-[11.5px] font-bold text-[#141413] leading-tight">
                        Demo Booking Confirmed · Fri 3:00 PM
                      </p>
                      <p className="text-[9.5px] text-[#595C56]">HubSpot Contact &amp; Calendar Synced</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#9EE41A]/20 text-[#3F630B] font-mono text-[9px] font-bold">
                    ROUTED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OVERLAPPING SYNCHRONIZED MATTE-BLACK MOBILE PHONE PREVIEW */}
        <div
          data-cursor="view"
          className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-[160px] sm:w-[210px] md:w-[230px] aspect-[9/18.5] rounded-[28px] sm:rounded-[36px] bg-[#121211] p-1.5 sm:p-2 border-[2.5px] sm:border-[3.5px] border-[#2B2B28] shadow-[0_24px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.12)] transition-transform duration-300 hover:scale-[1.03] select-none z-20"
        >
          {/* Top Notch / Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 sm:w-18 h-3.5 sm:h-4 bg-black rounded-full z-30 flex items-center justify-between px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#124212]/80" />
          </div>

          {/* Mobile Screen */}
          <div
            ref={mobileScrollRef}
            onScroll={handleMobileScroll}
            className="w-full h-full rounded-[22px] sm:rounded-[28px] overflow-y-auto scrollbar-none bg-[#F7F6EE] text-[#141413] pt-6 px-2.5 sm:px-3 pb-3"
            style={{ overscrollBehavior: "contain" }}
          >
            {/* Mobile Nav */}
            <div className="flex items-center justify-between pb-3 border-b border-[#141413]/10">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-[#141413] text-[#9EE41A] font-mono text-[8px] flex items-center justify-center font-bold">
                  AC
                </span>
                <span className="font-bold text-[11px] text-[#141413]">Arché</span>
              </div>
              <div className="w-4 h-4 flex flex-col justify-center gap-0.5">
                <span className="w-full h-0.5 bg-[#141413] rounded-full" />
                <span className="w-full h-0.5 bg-[#141413] rounded-full" />
              </div>
            </div>

            {/* Mobile Hero */}
            <div className="py-4">
              <span className="inline-block px-1.5 py-0.5 rounded bg-[#E8E6D3] text-[#72B314] font-mono text-[7px] font-bold">
                SUB-35MS WEB
              </span>
              <h3 className="text-xs font-bold leading-tight mt-1 text-[#141413]">
                Digital experiences engineered for conversion.
              </h3>
              <p className="text-[8.5px] text-[#595C56] mt-1 leading-snug">
                Zero template bloat. Seamless 60fps gestures and instant loading.
              </p>
              <div className="mt-2.5 w-full py-1.5 rounded-full bg-[#141413] text-[#F4F4EE] text-[9px] font-semibold text-center">
                Start a Project →
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="flex flex-col gap-1.5 my-2">
              <div className="p-2 rounded-lg bg-[#EBE8D8] border border-[#141413]/05">
                <span className="font-mono text-[7px] text-[#72B314] font-bold">01 · SPEED</span>
                <p className="text-[9px] font-bold text-[#141413]">34ms FCP</p>
              </div>
              <div className="p-2 rounded-lg bg-[#EBE8D8] border border-[#141413]/05">
                <span className="font-mono text-[7px] text-[#72B314] font-bold">02 · MOBILE-FIRST</span>
                <p className="text-[9px] font-bold text-[#141413]">100svh Fluidity</p>
              </div>
            </div>

            {/* Mobile Bottom Badge */}
            <div className="pt-2 text-center border-t border-[#141413]/10">
              <span className="font-mono text-[7px] text-[#595C56]">100% RESPONSIVE ARCHITECTURE</span>
            </div>
          </div>
        </div>

        {/* Scroll sync indicator pill */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
          <span className="font-mono text-[9.5px] text-white/80">
            SYNCED VIEWPORTS: {Math.round(scrollProgress * 100)}%
          </span>
        </div>
      </div>

      {/* Bottom Sub-panel: Interactive guidance & instructions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[11px] text-white/50 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#9EE41A]">⇄</span>
          <span>Scroll either desktop or mobile viewport to inspect synchronized responsive layout</span>
        </div>
        <div className="flex items-center gap-3">
          <span>DESKTOP: 1440px</span>
          <span className="text-white/20">|</span>
          <span>MOBILE: 390px</span>
        </div>
      </div>
    </div>
  );
}
