import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Link } from "../lib/router";
import { gsap, prefersReducedMotion, onMotionPreferenceChange } from "../lib/gsap";

/**
 * ARCHÉ — HERO SECTION: EDITORIAL FLAGSHIP & LIVE SYSTEM SWITCH
 *
 * 100% GPU-composited, zero WebGL/Three.js canvases, 60fps locked.
 * 1. Clean vertical flex: min-h-[100svh], max-w-[1200px] mx-auto px-6 md:px-12 pt-[92px] pb-8
 * 2. Top Micro-Header: • CREATIVE TECHNOLOGY STUDIO | FILM · WEB · AI · OPS + • Accepting Projects
 * 3. 100% Unobstructed Centered Editorial Block:
 *    - Bold display headline: "Systems that make / businesses work better." (crisp #9EE41A period)
 *    - 1-line subcopy: "Brand film, web architecture, AI agents & operational automation—built as one connected system."
 *    - Tactile hardware switch: FRAGMENTED ⇄ CONNECTED BY ARCHÉ
 *    - Dual CTAs: "Start a Project →" (charcoal pill with specular highlight) + "Explore Services ↓" (beveled stone pill)
 * 4. 4 Clean Horizontal Architectural Tiles Docked BELOW the CTAs:
 *    - 01 · FILM (35MM 4K), 02 · WEB (38MS LIVE), 03 · AI AGENT (DEMO BOOKED), 04 · OPS (4× SYNCED)
 * 5. Meaningful Load + Toggle Animation:
 *    - Starts briefly (1.1s) in FRAGMENTED (y: ±6px, dashed stubs)
 *    - Physically snaps dead-straight (y: 0, rotate: 0) into CONNECTED BY ARCHÉ
 *    - 4 clean orthogonal #9EE41A SVG feeder lines below the tiles draw shut and merge
 *      symmetrically into the single center #9EE41A vertical spine leading down into The Proposition!
 */
export function HeroSystemSwitch() {
  const [isConnected, setIsConnected] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const userInteractedRef = useRef(false);

  const heroSecRef = useRef<HTMLElement>(null);
  const exitConduitRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<HTMLDivElement>(null);
  const feederSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => onMotionPreferenceChange(setReducedMotion), []);

  // -------------------------------------------------------------
  // 1. Auto-Play Opening Story on Load:
  // Starts in FRAGMENTED for 1.1s, then snaps cleanly to CONNECTED BY ARCHÉ.
  // -------------------------------------------------------------
  useEffect(() => {
    let timer: number;

    const startTimer = () => {
      timer = window.setTimeout(() => {
        if (!userInteractedRef.current) {
          setIsConnected(true);
        }
      }, 1100);
    };

    if (typeof document !== "undefined" && document.documentElement.classList.contains("arche-intro-loading")) {
      window.addEventListener("arche:hero-reveal-start", startTimer, { once: true });
    } else {
      startTimer();
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("arche:hero-reveal-start", startTimer);
    };
  }, []);

  const handleToggle = () => {
    userInteractedRef.current = true;
    setIsConnected((prev) => !prev);
  };

  // -------------------------------------------------------------
  // 2. GSAP Scroll Exit Handoff: Tiles and center block glide smoothly,
  // center lime conduit shoots straight down into The Proposition.
  // -------------------------------------------------------------
  useLayoutEffect(() => {
    const heroEl = heroSecRef.current;
    if (!heroEl || reducedMotion) return;

    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 768;
      if (!isDesktop) return;

      const exitTl = gsap.timeline({
        scrollTrigger: {
          id: "hero-system-switch-exit",
          trigger: heroEl,
          start: "top top",
          end: "bottom top",
          scrub: 0.85,
        },
      });

      // Smooth exit parallax on hero elements
      if (tilesRef.current) {
        exitTl.to(tilesRef.current, { y: 24, opacity: 0.85, ease: "power2.in" }, 0);
      }
      if (exitConduitRef.current) {
        exitTl.to(exitConduitRef.current, { scaleY: 1.6, y: 20, opacity: 1, ease: "power2.out" }, 0);
      }
    }, heroSecRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  // Spring ease for tactile switch
  const springEase = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <section
      id="hero"
      ref={heroSecRef}
      className="relative flex min-h-[100svh] w-full flex-col justify-between pt-[92px] pb-8 px-6 md:px-12 select-none overflow-hidden"
      style={{ background: "#F4F4EE", color: "#141413" }}
    >
      {/* Scoped CSS animations for 35mm waveform & pulse */}
      <style>{`
        @keyframes archeHeroWave {
          0%, 100% { transform: scaleY(0.22); }
          50% { transform: scaleY(1); }
        }
        .arche-wave-bar {
          transform-origin: bottom;
          animation: archeHeroWave 1.4s ease-in-out infinite;
        }
      `}</style>

      {/* Background Architectural Drafting Gridlines */}
      <div className="pointer-events-none absolute inset-0 hidden justify-between px-12 md:flex z-0" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-full w-px"
            style={{ background: "rgba(20,20,19,0.04)" }}
          />
        ))}
      </div>

      {/* Subtle Paper Grain Overlay (3% matte) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage: `radial-gradient(#141413 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />

      {/* Inner Bound Container: max-w-[1200px] mx-auto w-full flex flex-col justify-between flex-1 */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto flex flex-col justify-between flex-1">

        {/* =========================================================
            1. TOP MICRO-HEADER
            ========================================================= */}
        <div className="flex w-full items-center justify-between border-b border-[rgba(20,20,19,0.08)] pb-3">
          {/* Left Studio Identifier */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A] animate-pulse" />
            <span className="font-mono text-[10.5px] sm:text-[11px] font-semibold tracking-wider text-[#141413] uppercase">
              Creative Technology Studio
            </span>
          </div>

          {/* Right Disciplines & Availability Pill */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-mono text-[10.5px] tracking-wider text-[#6E6D68] uppercase">
              Film · Web · AI · Ops
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAE7DF] px-3 py-1 font-mono text-[10px] text-[#141413] font-medium border border-[rgba(20,20,19,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A]" />
              Accepting Projects
            </span>
          </div>
        </div>

        {/* =========================================================
            2. CENTERED EDITORIAL BLOCK (100% UNOBSTRUCTED)
            ========================================================= */}
        <div className="flex flex-col items-center justify-center text-center my-auto py-6 sm:py-8 w-full">
          {/* Bold Masked Display Headline (clamp(40px, 5.4vw, 80px), font-weight: 600, -0.042em tracking, line-height: 0.96) */}
          <div className="max-w-[900px] mx-auto min-h-[90px] sm:min-h-[110px] md:min-h-[130px] flex items-center justify-center">
            <h1
              className="text-[clamp(38px,5.4vw,80px)] font-semibold tracking-[-0.042em] leading-[0.96] transition-colors duration-300"
              style={{
                color: isConnected ? "#141413" : "#4A4944",
              }}
            >
              {isConnected ? (
                <>
                  <span className="block">Systems that make</span>
                  <span className="block">
                    businesses work better
                    <span className="text-[#9EE41A] font-bold">.</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="block">Disconnected tools</span>
                  <span className="block">
                    slow great teams down
                    <span className="text-[#C94A38] font-bold">.</span>
                  </span>
                </>
              )}
            </h1>
          </div>

          {/* Clean 1-Line Subcopy */}
          <p className="mt-4 sm:mt-5 max-w-[560px] mx-auto font-sans text-[clamp(13.5px,1.15vw,16px)] leading-[1.46] text-[#6E6D68] transition-colors duration-300">
            {isConnected
              ? "Brand film, web architecture, AI agents & operational automation—built as one connected system."
              : "Siloed apps, manual re-entry, lost context & leaking revenue."}
          </p>

          {/* Centered Tactile Hardware Switch: FRAGMENTED ⇄ CONNECTED BY ARCHÉ */}
          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              onClick={handleToggle}
              aria-pressed={isConnected}
              aria-label={`Toggle system state: currently ${isConnected ? "Connected by Arché" : "Fragmented"}`}
              className="group relative inline-flex items-center rounded-full p-1 bg-[#E5E2D9] border border-[rgba(20,20,19,0.12)] cursor-pointer select-none transition-all duration-150 active:scale-[0.98]"
              style={{
                boxShadow: "inset 0 2px 6px rgba(20,20,19,0.08), 0 1px 0 rgba(255,255,255,0.85)",
                width: "clamp(300px, 32vw, 364px)",
                height: "44px",
              }}
            >
              {/* Sliding Matte Charcoal Thumb */}
              <div
                className="absolute top-1 bottom-1 rounded-full bg-[#141413] z-10 transition-transform duration-380"
                style={{
                  width: "calc(50% - 4px)",
                  transform: isConnected ? "translate3d(calc(100% + 4px), 0, 0)" : "translate3d(0, 0, 0)",
                  transitionTimingFunction: springEase,
                  boxShadow: "0 2px 8px rgba(20,20,19,0.28), inset 0 1px 0 rgba(255,255,255,0.22)",
                }}
              >
                {/* Subtle top specular highlight bevel edge */}
                <div className="w-full h-px bg-white/20 rounded-full mt-0.5" />
              </div>

              {/* Left Label: FRAGMENTED */}
              <div
                className="relative z-20 flex w-1/2 items-center justify-center gap-1.5 transition-colors duration-250"
                style={{
                  color: !isConnected ? "#F4F4EE" : "#8E8E88",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: !isConnected ? "#C94A38" : "#A8A69E",
                    boxShadow: !isConnected ? "0 0 6px #C94A38" : "none",
                  }}
                />
                <span className="font-mono text-[9.5px] sm:text-[10px] font-bold tracking-wider uppercase">
                  Fragmented
                </span>
              </div>

              {/* Right Label: CONNECTED BY ARCHÉ */}
              <div
                className="relative z-20 flex w-1/2 items-center justify-center gap-1.5 transition-colors duration-250"
                style={{
                  color: isConnected ? "#F4F4EE" : "#8E8E88",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: isConnected ? "#9EE41A" : "#A8A69E",
                    boxShadow: isConnected ? "0 0 8px #9EE41A" : "none",
                  }}
                />
                <span className="font-mono text-[9.5px] sm:text-[10px] font-bold tracking-wider uppercase">
                  Connected by Arché
                </span>
              </div>
            </button>
          </div>

          {/* Dual CTAs: Start a Project → & Explore Services ↓ */}
          <div className="mt-5 sm:mt-6 flex items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#141413] px-6 py-2.5 font-mono text-[10.5px] sm:text-[11px] font-semibold tracking-wider text-[#F4F4EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_14px_rgba(20,20,19,0.18)] hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-160 cursor-pointer"
            >
              <span>Start a Project</span>
              <span className="text-[#9EE41A]">→</span>
            </Link>
            <a
              href="#problem"
              className="inline-flex items-center gap-2 rounded-full bg-[#EAE7DF] px-6 py-2.5 font-mono text-[10.5px] sm:text-[11px] font-semibold tracking-wider text-[#141413] border border-[rgba(20,20,19,0.10)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_8px_rgba(20,20,19,0.06)] hover:border-[#141413] hover:scale-[1.02] active:scale-[0.98] transition-all duration-160 cursor-pointer"
            >
              <span>Explore Services</span>
              <span>↓</span>
            </a>
          </div>
        </div>

        {/* =========================================================
            3. 4 CLEAN HORIZONTAL ARCHITECTURAL TILES DOCKED BELOW CTAS
            (grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-[1040px] mx-auto w-full)
            ========================================================= */}
        <div ref={tilesRef} className="w-full max-w-[1040px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full text-left">
            {/* Tile 01: Film */}
            <div
              className="rounded-xl border bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_-3px_rgba(20,20,19,0.06)] will-change-transform"
              style={{
                transform: isConnected ? "translate3d(0, 0, 0) rotate(0deg)" : "translate3d(0, -6px, 0) rotate(0deg)",
                borderColor: isConnected ? "rgba(158,228,26,0.4)" : "rgba(20,20,19,0.10)",
                transition: `transform 420ms ${springEase}, border-color 300ms ease`,
              }}
            >
              <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{
                      background: isConnected ? "#9EE41A" : "#8E8E88",
                      boxShadow: isConnected ? "0 0 6px #9EE41A" : "none",
                    }}
                  />
                  <span className="font-mono text-[10px] font-semibold text-[#141413] uppercase">
                    01 · Film
                  </span>
                </div>
                <span
                  className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-all duration-300"
                  style={{
                    background: isConnected ? "rgba(158,228,26,0.16)" : "rgba(201,74,56,0.12)",
                    color: isConnected ? "#141413" : "#C94A38",
                  }}
                >
                  {isConnected ? "35MM 4K" : "RAW 18%"}
                </span>
              </div>
              <div className="mt-2.5">
                {isConnected ? (
                  <>
                    <div className="flex items-end justify-between h-5 gap-0.5 px-1 bg-[#F4F4EE] rounded p-0.5">
                      {[0.4, 0.9, 0.6, 1.0, 0.7, 0.45, 0.85, 0.55, 0.95, 0.75].map((h, i) => (
                        <span
                          key={i}
                          className="arche-wave-bar w-1 rounded-full bg-[#141413]"
                          style={{
                            height: `${h * 100}%`,
                            animationDelay: `${i * 0.1}s`,
                            background: i % 2 === 0 ? "#9EE41A" : "#141413",
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] text-[#6E6D68]">
                      <span>ARRI 35 PASS</span>
                      <span className="text-[#141413] font-bold">84% RETENTION ✓</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center h-5 px-2 bg-[#EAE7DF] rounded text-[#8E8E88] font-mono text-[9px]">
                      <span className="h-1 w-full bg-[#8E8E88]/30 rounded-full" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] text-[#C94A38]">
                      <span>LUT: OFF</span>
                      <span>DROP-OFF 0:04s</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tile 02: Web */}
            <div
              className="rounded-xl border bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_-3px_rgba(20,20,19,0.06)] will-change-transform"
              style={{
                transform: isConnected ? "translate3d(0, 0, 0) rotate(0deg)" : "translate3d(0, 6px, 0) rotate(0deg)",
                borderColor: isConnected ? "rgba(158,228,26,0.4)" : "rgba(20,20,19,0.10)",
                transition: `transform 440ms ${springEase}, border-color 300ms ease`,
              }}
            >
              <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{
                      background: isConnected ? "#9EE41A" : "#C94A38",
                      boxShadow: isConnected ? "0 0 6px #9EE41A" : "none",
                    }}
                  />
                  <span className="font-mono text-[10px] font-semibold text-[#141413] uppercase">
                    02 · Web
                  </span>
                </div>
                <span
                  className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-all duration-300"
                  style={{
                    background: isConnected ? "rgba(158,228,26,0.16)" : "rgba(201,74,56,0.12)",
                    color: isConnected ? "#141413" : "#C94A38",
                  }}
                >
                  {isConnected ? "38MS LIVE" : "4.8s LOAD"}
                </span>
              </div>
              <div className="mt-2.5">
                {isConnected ? (
                  <>
                    <div className="w-full bg-[#EAE7DF] h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#9EE41A] h-full w-[96%] rounded-full shadow-[0_0_6px_#9EE41A]" />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between font-mono text-[8.5px] text-[#6E6D68]">
                      <span>100/100 LIGHTHOUSE</span>
                      <span className="text-[#141413] font-bold">CVR 8.4% ↑</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full bg-[#EAE7DF] h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#C94A38] h-full w-[20%] rounded-full" />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between font-mono text-[8.5px] text-[#C94A38]">
                      <span>BOUNCE: 64%</span>
                      <span>LEAKING LEADS</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tile 03: AI Agent */}
            <div
              className="rounded-xl border bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_-3px_rgba(20,20,19,0.06)] will-change-transform"
              style={{
                transform: isConnected ? "translate3d(0, 0, 0) rotate(0deg)" : "translate3d(0, -6px, 0) rotate(0deg)",
                borderColor: isConnected ? "rgba(158,228,26,0.4)" : "rgba(20,20,19,0.10)",
                transition: `transform 430ms ${springEase}, border-color 300ms ease`,
              }}
            >
              <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{
                      background: isConnected ? "#9EE41A" : "#C94A38",
                      boxShadow: isConnected ? "0 0 6px #9EE41A" : "none",
                    }}
                  />
                  <span className="font-mono text-[10px] font-semibold text-[#141413] uppercase">
                    03 · AI Agent
                  </span>
                </div>
                <span
                  className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-all duration-300"
                  style={{
                    background: isConnected ? "rgba(158,228,26,0.16)" : "rgba(201,74,56,0.12)",
                    color: isConnected ? "#141413" : "#C94A38",
                  }}
                >
                  {isConnected ? "DEMO BOOKED" : "14 UNREAD"}
                </span>
              </div>
              <div className="mt-2.5">
                {isConnected ? (
                  <>
                    <div className="rounded bg-[#F4F4EE] px-1.5 py-1 border border-[#141413]/[0.06] flex items-center justify-between font-mono text-[8.5px] text-[#141413]">
                      <span className="font-semibold truncate">Acme ($24.8k)</span>
                      <span className="text-[#9EE41A] font-bold">1.2s</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] text-[#6E6D68]">
                      <span>AUTO ROUTED</span>
                      <span className="text-[#141413] font-bold">QUALIFIED ✓</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded bg-[#EAE7DF] px-1.5 py-1 text-[#C94A38] font-mono text-[8.5px] truncate">
                      14 INBOX LEADS UNANSWERED
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] text-[#C94A38]">
                      <span>STATUS: OFFLINE</span>
                      <span>LOST PIPELINE</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tile 04: Ops */}
            <div
              className="rounded-xl border bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_-3px_rgba(20,20,19,0.06)] will-change-transform"
              style={{
                transform: isConnected ? "translate3d(0, 0, 0) rotate(0deg)" : "translate3d(0, 6px, 0) rotate(0deg)",
                borderColor: isConnected ? "rgba(158,228,26,0.4)" : "rgba(20,20,19,0.10)",
                transition: `transform 450ms ${springEase}, border-color 300ms ease`,
              }}
            >
              <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{
                      background: isConnected ? "#9EE41A" : "#8E8E88",
                      boxShadow: isConnected ? "0 0 6px #9EE41A" : "none",
                    }}
                  />
                  <span className="font-mono text-[10px] font-semibold text-[#141413] uppercase">
                    04 · Ops
                  </span>
                </div>
                <span
                  className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-all duration-300"
                  style={{
                    background: isConnected ? "rgba(158,228,26,0.16)" : "rgba(201,74,56,0.12)",
                    color: isConnected ? "#141413" : "#C94A38",
                  }}
                >
                  {isConnected ? "4× SYNCED" : "MANUAL 6×"}
                </span>
              </div>
              <div className="mt-2.5">
                {isConnected ? (
                  <>
                    <div className="flex items-center justify-between py-0.5 px-1 bg-[#F4F4EE] rounded">
                      {["INBOX", "SHEET", "CRM", "SLACK"].map((node, i) => (
                        <div key={node} className="flex items-center gap-0.5">
                          <span className="h-1 w-1 rounded-full bg-[#9EE41A]" />
                          <span className="font-mono text-[7.5px] font-bold text-[#141413]">{node}</span>
                          {i < 3 && <span className="h-px w-1 bg-[#9EE41A]" />}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] text-[#6E6D68]">
                      <span>STREAM: LIVE</span>
                      <span className="text-[#141413] font-bold">ZERO DRIFT ✓</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-0.5 px-1 bg-[#EAE7DF] rounded text-[#8E8E88] font-mono text-[7.5px]">
                      <span>INBOX</span>
                      <span className="text-[#C94A38]">┄×┄</span>
                      <span>CSV</span>
                      <span className="text-[#C94A38]">┄×┄</span>
                      <span>CRM</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] text-[#C94A38]">
                      <span>DESYNCED</span>
                      <span>RE-ENTRY ERR</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================
              4. CLEAN ORTHOGONAL SVG FEEDER LINES (MERGING INTO SPINE)
              Draws shut and merges symmetrically from 4 tiles into x = 50%
              ========================================================= */}
          <div className="relative w-full h-[48px] overflow-visible">
            <svg
              ref={feederSvgRef}
              className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 1000 48"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <filter id="hero-feeder-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {!isConnected ? (
                /* Fragmented State: Muted dashed gray stubs + red disconnected crosses */
                <g opacity="0.45" className="transition-opacity duration-300">
                  <path d="M 125 0 V 24 H 490" fill="none" stroke="#8E8E88" strokeWidth="1.5" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                  <path d="M 375 0 V 24 H 490" fill="none" stroke="#8E8E88" strokeWidth="1.5" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                  <path d="M 625 0 V 24 H 510" fill="none" stroke="#8E8E88" strokeWidth="1.5" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                  <path d="M 875 0 V 24 H 510" fill="none" stroke="#8E8E88" strokeWidth="1.5" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                  <path d="M 500 24 V 48" fill="none" stroke="#8E8E88" strokeWidth="1.5" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                  <text x="310" y="27" fill="#C94A38" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">×</text>
                  <text x="690" y="27" fill="#C94A38" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">×</text>
                  <circle cx="500" cy="24" r="3" fill="#8E8E88" />
                </g>
              ) : (
                /* Connected State: Crisp #9EE41A orthogonal feeder lines + racing pulse */
                <g className="transition-opacity duration-400">
                  {/* Tile 01 -> Hub */}
                  <path d="M 125 0 V 24 H 500" fill="none" stroke="#9EE41A" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" filter="url(#hero-feeder-glow)" />
                  {/* Tile 02 -> Hub */}
                  <path d="M 375 0 V 24 H 500" fill="none" stroke="#9EE41A" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" filter="url(#hero-feeder-glow)" />
                  {/* Tile 03 -> Hub */}
                  <path d="M 625 0 V 24 H 500" fill="none" stroke="#9EE41A" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" filter="url(#hero-feeder-glow)" />
                  {/* Tile 04 -> Hub */}
                  <path d="M 875 0 V 24 H 500" fill="none" stroke="#9EE41A" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" filter="url(#hero-feeder-glow)" />
                  {/* Center Vertical Trunk -> Spine */}
                  <path d="M 500 24 V 48" fill="none" stroke="#9EE41A" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" filter="url(#hero-feeder-glow)" />

                  {/* Central Junction Hub */}
                  <circle cx="500" cy="24" r="3.5" fill="#9EE41A" filter="url(#hero-feeder-glow)" />

                  {/* 60fps Light Pulses Racing Inward */}
                  {!reducedMotion && (
                    <>
                      <circle r="2.5" fill="#9EE41A" filter="url(#hero-feeder-glow)">
                        <animateMotion dur="1.8s" repeatCount="indefinite" path="M 125 0 V 24 H 500 V 48" />
                      </circle>
                      <circle r="2.5" fill="#9EE41A" filter="url(#hero-feeder-glow)">
                        <animateMotion dur="1.8s" begin="0.45s" repeatCount="indefinite" path="M 375 0 V 24 H 500 V 48" />
                      </circle>
                      <circle r="2.5" fill="#9EE41A" filter="url(#hero-feeder-glow)">
                        <animateMotion dur="1.8s" begin="0.9s" repeatCount="indefinite" path="M 625 0 V 24 H 500 V 48" />
                      </circle>
                      <circle r="2.5" fill="#9EE41A" filter="url(#hero-feeder-glow)">
                        <animateMotion dur="1.8s" begin="1.35s" repeatCount="indefinite" path="M 875 0 V 24 H 500 V 48" />
                      </circle>
                    </>
                  )}
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* =========================================================
            5. CENTER VERTICAL EXIT SPINE LEADING TO THE PROPOSITION
            ========================================================= */}
        <div className="relative flex flex-col items-center justify-center pt-1">
          <a
            href="#problem"
            className="group flex flex-col items-center gap-1 font-mono text-[9px] font-medium tracking-widest text-[#8E8E88] uppercase hover:text-[#141413] transition-colors"
          >
            <span>DATA FLOW PIPELINE ↓</span>
            <div
              ref={exitConduitRef}
              className="w-[1.5px] h-6 rounded-full transition-all duration-300"
              style={{
                background: isConnected ? "#9EE41A" : "#8E8E88",
                boxShadow: isConnected ? "0 0 8px #9EE41A" : "none",
              }}
            />
          </a>
        </div>

      </div>
    </section>
  );
}
