import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

const PHASES = ["IDEA", "STRUCTURE", "INTERFACE", "LIVE"] as const;
const SLUG = "web-development";

/**
 * Service 02 — Web Development (NORTH · ARCHITECTURE)
 *
 * Light architectural interface preview engineered inside the shared warm-stone studio tray:
 * - Continuous live blueprint-to-live-interface loop (IDEA → STRUCTURE → INTERFACE → LIVE)
 * - Hairline architectural gridlines draw in, cards elevate into place with live metric bars
 * - Focus ring simulates a visit booking, switching slot to "CONFIRMED · FRI 3:00 PM" + "LEAD CAPTURED" badge
 * - Fully interactive: users or automated tests can click "Book a visit", open the dialog, and confirm
 */
export function WebDevDemo({
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
  const [phase, setPhase] = useState(0); // Start at IDEA
  const [viewTab, setViewTab] = useState<"design" | "interface" | "book">("design");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedName, setBookedName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [limePulse, setLimePulse] = useState(false);
  const [simulatedFocus, setSimulatedFocus] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [userInteracted, setUserInteracted] = useState(false);

  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  // Viewport-gated reset & replay
  useEffect(() => {
    clearTimers();
    if (!active) {
      setPhase(0);
      setBooked(false);
      setSimulatedFocus(false);
      return;
    }

    if (preview || userInteracted) return;

    markPreviewPlayed(SLUG);

    if (prefersReducedMotion()) {
      setPhase(3);
      announcePreviewDone(SLUG);
      return;
    }

    const runLoop = () => {
      clearTimers();
      setBooked(false);
      setSimulatedFocus(false);
      setPhase(0);

      // 0.4s: Structure
      timers.current.push(
        window.setTimeout(() => {
          setPhase(1);
        }, 400)
      );

      // 1.1s: Interface (cards snap in & bars fill)
      timers.current.push(
        window.setTimeout(() => {
          setPhase(2);
        }, 1100)
      );

      // 2.0s: Live interface ready
      timers.current.push(
        window.setTimeout(() => {
          setPhase(3);
          announcePreviewDone(SLUG);
        }, 2000)
      );

      // 3.0s: Focus ring on "Book a visit"
      timers.current.push(
        window.setTimeout(() => {
          setSimulatedFocus(true);
        }, 3000)
      );

      // 3.6s: Simulated click -> Confirm reservation
      timers.current.push(
        window.setTimeout(() => {
          setBooked(true);
          setBookedName("Alex Rivera");
          setSimulatedFocus(false);
          setLimePulse(true);
        }, 3600)
      );

      timers.current.push(
        window.setTimeout(() => {
          setLimePulse(false);
        }, 4800)
      );

      // 8.5s: Seamless loop repeat
      timers.current.push(
        window.setTimeout(() => {
          runLoop();
        }, 8500)
      );
    };

    runLoop();

    return () => clearTimers();
  }, [active, runKey, preview, userInteracted]);

  const confirmBooking = (who: string) => {
    const trimmed = who.trim() || "Ana Silva";
    setBookedName(trimmed);
    setBooked(true);
    setBookingOpen(false);
    setLimePulse(true);
    window.setTimeout(() => setLimePulse(false), 1200);
    setAnnouncement(`Visit booked for ${trimmed} on Friday at 3 PM.`);
  };

  useEffect(() => {
    const notice =
      phase >= 3
        ? "Live. Architectural interface ready."
        : phase === 2
        ? "Interface elements visible."
        : phase === 1
        ? "Blueprint structure forming."
        : "Idea placed.";
    setAnnouncement(notice);
  }, [phase]);

  return (
    <div
      className="relative flex h-full w-full flex-col justify-between p-[12px] min-[900px]:p-[16px] select-none"
      data-preview={preview ? "1" : "0"}
      aria-label="Web Development Demo"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Top Blueprint Progress Bar & View Tabs                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-none items-center justify-between gap-[10px]">
        {/* Blueprint Build Steps */}
        <div className="flex items-center gap-[4px]" aria-label="Build progress">
          {PHASES.map((label, i) => {
            const isPassed = phase >= i;
            return (
              <div key={label} className="flex items-center gap-[4px]">
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.14em] px-[7px] py-[2px] rounded transition-all duration-300"
                  style={{
                    background: isPassed ? "#141413" : "#ECEAE2",
                    color: isPassed ? (i === 3 ? "#9EE41A" : "#FFFFFF") : "#A8A69E",
                    fontWeight: isPassed ? 600 : 400,
                  }}
                >
                  {label}
                </span>
                {i < PHASES.length - 1 && (
                  <span
                    className="h-px w-[14px] transition-all duration-400"
                    style={{
                      background: phase >= i + 1 ? "#9EE41A" : "rgba(20,20,19,0.12)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* View Switcher Tabs: DESIGN / INTERFACE / BOOK */}
        <div
          className="flex items-center gap-[2px] rounded-full p-[2px] border border-[#141413]/10 bg-[#EAE7DF]"
          role="tablist"
          aria-label="Interface Views"
        >
          {(["design", "interface", "book"] as const).map((tab) => {
            const isTabActive = viewTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isTabActive}
                onClick={() => {
                  setUserInteracted(true);
                  clearTimers();
                  setViewTab(tab);
                  if (tab === "book" && !booked) setBookingOpen(true);
                }}
                className="rounded-full px-[9px] py-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer"
                style={{
                  background: isTabActive ? "#141413" : "transparent",
                  color: isTabActive ? "#F4F4EE" : "#5C5F59",
                  boxShadow: isTabActive ? "0 1px 4px rgba(20,20,19,0.15)" : "none",
                }}
              >
                {tab === "design" ? "Design" : tab === "interface" ? "Interface" : "Book"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Architectural Blueprint Surface & Cards (Light Stone + White) */}
      {/* ------------------------------------------------------------- */}
      <div
        className="wd-surface relative flex-1 my-[6px] flex flex-col justify-between overflow-hidden rounded-[10px] border border-[#141413]/10 bg-[#E5E7DC] p-[10px] min-[900px]:p-[12px]"
        style={{
          boxShadow: "0 12px 32px -12px rgba(20,20,19,0.10), 0 2px 6px rgba(20,20,19,0.04)",
        }}
      >
        {/* Animated Blueprint Grid Dividers */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <svg className="h-full w-full opacity-30" preserveAspectRatio="none">
            <defs>
              <pattern id="wd-bp-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(20,20,19,0.08)" strokeWidth="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wd-bp-grid)" />
          </svg>
          {/* Hairline Grid Dividers */}
          <div
            className="absolute inset-x-0 top-[60px] h-px bg-[#141413]/[0.08] transition-transform duration-500 ease-out origin-left"
            style={{ transform: phase >= 1 ? "scaleX(1)" : "scaleX(0.2)" }}
          />
          <div
            className="absolute inset-x-0 bottom-[56px] h-px bg-[#141413]/[0.08] transition-transform duration-500 ease-out origin-right"
            style={{ transform: phase >= 1 ? "scaleX(1)" : "scaleX(0.2)" }}
          />
        </div>

        {/* Top Hero Architectural Headline Block */}
        <div
          data-slab="s3"
          className="relative z-10 rounded-[8px] border border-[#141413]/10 p-[10px] min-[900px]:p-[12px] bg-[#F1F2EA] transition-all duration-500"
          style={{
            boxShadow: "0 2px 8px rgba(20,20,19,0.06)",
            opacity: phase >= 1 ? 1 : 0.85,
            transform: phase >= 1 ? "none" : "translateY(4px)",
          }}
        >
          <div className="flex items-center justify-between gap-[10px]">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#5C5F59] block mb-[2px]">
                NORTH // ARCHITECTURE · 02
              </span>
              <h4 className="text-[clamp(15px,1.3vw,18px)] font-medium tracking-tight text-[#141413] leading-tight">
                Quiet rooms for loud ideas.
              </h4>
            </div>
            <div className="flex items-center gap-[6px] rounded-full bg-[#EAE7DF] px-[9px] py-[3px] border border-[#141413]/10 shadow-sm">
              <span
                className="h-[6px] w-[6px] rounded-full transition-transform"
                style={{
                  background: limePulse || booked ? "#9EE41A" : "#8A8D89",
                  transform: limePulse ? "scale(1.6)" : "scale(1)",
                  boxShadow: limePulse || booked ? "0 0 6px #9EE41A" : "none",
                }}
              />
              <span className="font-mono text-[9px] font-semibold text-[#141413]">
                {booked ? "RESERVED" : "PRODUCTION"}
              </span>
            </div>
          </div>
        </div>

        {/* Two Beveled White Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-[8px] my-[4px]">
          {/* Card 1: Booking system */}
          <div
            data-slab="s4"
            className="rounded-[8px] p-[10px] min-[900px]:p-[12px] border border-[#141413]/10 bg-[#F1F2EA] transition-all duration-500"
            style={{
              boxShadow: "0 4px 14px rgba(20,20,19,0.05)",
              opacity: phase >= 1 ? 1 : 0.7,
              transform: phase >= 1 ? "none" : "translateY(4px)",
            }}
          >
            <div className="flex items-center justify-between gap-[8px]">
              <strong className="text-[13px] font-medium tracking-tight text-[#141413]">
                Booking system
              </strong>
              <span
                className="h-[6px] w-[6px] rounded-full transition-colors"
                style={{
                  background: booked ? "#9EE41A" : "#8A8D89",
                  boxShadow: booked ? "0 0 6px #9EE41A" : "none",
                }}
              />
            </div>
            <p className="mt-[3px] text-[11px] leading-[1.35] text-[#5C5F59]">
              A visit button that updates this very page in real-time.
            </p>
            {/* Smooth Progress Hairline */}
            <div className="mt-[8px] h-[3.5px] w-full rounded-full bg-[#EAE7DF] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-600 ease-out"
                style={{
                  width: booked ? "100%" : phase >= 3 ? "68%" : phase >= 2 ? "45%" : phase >= 1 ? "25%" : "0%",
                  background: "#9EE41A",
                  boxShadow: "0 0 4px #9EE41A",
                }}
              />
            </div>
          </div>

          {/* Card 2: Rooms previewed */}
          <div
            data-slab="s5"
            className="rounded-[8px] p-[10px] min-[900px]:p-[12px] border border-[#141413]/10 bg-[#F1F2EA] transition-all duration-500"
            style={{
              boxShadow: "0 4px 14px rgba(20,20,19,0.05)",
              opacity: phase >= 1 ? 1 : 0.7,
              transform: phase >= 1 ? "none" : "translateY(4px)",
            }}
          >
            <div className="flex items-center justify-between gap-[8px]">
              <strong className="text-[13px] font-medium tracking-tight text-[#141413]">
                Rooms previewed
              </strong>
              <span className="h-[6px] w-[6px] rounded-full bg-[#8A8D89]" />
            </div>
            <p className="mt-[3px] text-[11px] leading-[1.35] text-[#5C5F59]">
              Small interface pieces, engineered with precision, not decoration.
            </p>
            <div className="mt-[8px] h-[3.5px] w-full rounded-full bg-[#EAE7DF] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-600 ease-out"
                style={{
                  width: phase >= 3 ? "52%" : phase >= 2 ? "38%" : phase >= 1 ? "18%" : "0%",
                  background: "#9EE41A",
                  boxShadow: "0 0 4px #9EE41A",
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Row & Confirmation Micro-Interaction */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-[8px] pt-[2px]">
          <div className="flex items-center gap-[8px]">
            {/* BOOK A VISIT / VISIT CONFIRMED Button (.wd-book) */}
            <div className="relative">
              {simulatedFocus && (
                <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-[#9EE41A] animate-ping opacity-75" />
              )}
              <button
                type="button"
                data-slab="engine"
                className="wd-book rounded-full px-[13px] py-[6px] font-mono text-[10.5px] font-semibold transition-all duration-300 flex items-center gap-[6px] cursor-pointer"
                style={{
                  background: booked ? "#141413" : "#9EE41A",
                  color: booked ? "#9EE41A" : "#141413",
                  border: booked ? "1px solid #141413" : "1px solid #9EE41A",
                  boxShadow: simulatedFocus
                    ? "0 0 0 2px #9EE41A, 0 4px 12px rgba(158,228,26,0.4)"
                    : "0 2px 10px rgba(20,20,19,0.1)",
                }}
                disabled={preview}
                onClick={() => {
                  setUserInteracted(true);
                  clearTimers();
                  if (booked) {
                    setBooked(false);
                  } else {
                    setBookingOpen(true);
                  }
                }}
                data-cursor="BOOK"
              >
                <span>{booked ? "VISIT CONFIRMED ✓" : "Book a visit"}</span>
                {!booked && <span>→</span>}
              </button>
            </div>

            {/* Quick Name Input Pill */}
            <div
              data-slab="s1"
              className="flex items-center gap-[6px] rounded-full border border-[#141413]/10 bg-[#F1F2EA] px-[9px] py-[3.5px] shadow-sm"
            >
              <span className="font-mono text-[9px] uppercase text-[#5C5F59]">GUEST:</span>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setUserInteracted(true);
                  setNameInput(e.target.value);
                }}
                placeholder={bookedName || "Alex Rivera"}
                aria-label="Name for the visit"
                disabled={booked}
                className="w-[85px] bg-transparent font-mono text-[10px] text-[#141413] outline-none placeholder:text-[#8A8D89]"
              />
            </div>
          </div>

          <div className="flex items-center gap-[6px]">
            {booked && (
              <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[#141413] bg-[#9EE41A]/30 px-[7px] py-[2px] rounded border border-[#9EE41A] animate-fade-in">
                LEAD CAPTURED
              </span>
            )}
            <span className="font-mono text-[10px] text-[#5C5F59] tracking-wider">
              {booked ? "STATUS: FRIDAY 3 PM RESERVED" : "SLOT: FRI 3:00 PM"}
            </span>
          </div>
        </div>

        {/* Confirmation Sheet / Inline Booking Dialog (needed by verify.mjs) */}
        {bookingOpen && (
          <div
            className="absolute inset-x-[10px] bottom-[10px] z-30 rounded-[8px] border border-[#141413]/15 bg-[#F1F2EA] p-[12px] shadow-[0_12px_32px_rgba(20,20,19,0.18)] transition-all"
            role="dialog"
            aria-label="Confirm the visit"
          >
            <div className="flex items-center justify-between border-b border-[#141413]/10 pb-[8px] mb-[8px]">
              <span className="font-mono text-[10px] uppercase font-semibold text-[#141413]">
                Confirm the visit · Next opening
              </span>
              <button
                type="button"
                onClick={() => setBookingOpen(false)}
                className="font-mono text-[9.5px] text-[#5C5F59] hover:text-[#141413] cursor-pointer"
              >
                Cancel ✕
              </button>
            </div>
            <p className="text-[13px] text-[#141413] font-medium leading-snug">
              Friday · 3:00 PM — Quiet Room Studio Tour
            </p>
            <p className="text-[11px] text-[#5C5F59] mt-[2px] mb-[10px]">
              Reserve one reserved session for {nameInput.trim() || "Alex Rivera"}.
            </p>
            <button
              type="button"
              onClick={() => confirmBooking(nameInput)}
              className="rounded-full bg-[#141413] text-[#F4F4EE] hover:text-[#9EE41A] px-[14px] py-[6px] font-mono text-[10.5px] font-semibold shadow-sm hover:opacity-95 cursor-pointer"
              aria-label="Confirm visit · 3 PM"
            >
              Confirm visit · 3 PM
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Bottom Telemetry Bar                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-none items-center justify-between gap-[8px] font-mono text-[10px] text-[#5C5F59] pt-[2px]">
        <div className="flex items-center gap-[6px]">
          <span
            className="h-[5px] w-[5px] rounded-full transition-colors"
            style={{
              background: booked ? "#9EE41A" : "#8A8D89",
              boxShadow: booked ? "0 0 6px #9EE41A" : "none",
            }}
          />
          <span className="text-[#141413] font-medium">
            {booked ? `VISIT CONFIRMED · FRI 3 PM (${bookedName})` : "LIVE · ARCHITECTURAL PROTOTYPE"}
          </span>
        </div>
        <span>SYSTEM RESPONSE: 42ms</span>
      </div>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
