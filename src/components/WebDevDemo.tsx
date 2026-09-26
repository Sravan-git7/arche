import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

const PHASES = ["IDEA", "STRUCTURE", "INTERFACE", "LIVE"] as const;
const SLUG = "web-development";

/**
 * PROMPT 28 — Web Development demo: IDEA → STRUCTURE → INTERFACE → LIVE.
 *
 * The build sequence automatically plays on view, then hands control to the visitor at LIVE.
 */
export function WebDevDemo({
  active = false,
  preview = false,
  auto = false,
}: {
  active?: boolean;
  preview?: boolean;
  auto?: boolean;
}) {
  const [phase, setPhase] = useState(0);
  const timers = useRef<number[]>([]);
  const started = useRef(false);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  useEffect(() => {
    if (started.current || !active || preview) return;
    started.current = true;
    markPreviewPlayed(SLUG);

    if (prefersReducedMotion()) {
      setPhase(3);
      announcePreviewDone(SLUG);
      return;
    }

    // Step through the phases: IDEA (0) -> STRUCTURE (1) -> INTERFACE (2) -> LIVE (3)
    timers.current.push(
      window.setTimeout(() => setPhase(1), 800),
      window.setTimeout(() => setPhase(2), 1800),
      window.setTimeout(() => {
        setPhase(3);
        announcePreviewDone(SLUG);
      }, 3200)
    );
  }, [active, preview]);

  return <Core phase={phase} preview={preview} />;
}

function Core({ phase, preview = false }: { phase: number; preview?: boolean }) {
  const live = phase >= 3;
  const [page, setPage] = useState<"work" | "studio" | "visit">("work");
  const [hint, setHint] = useState(true); // "look around" cue, until first touch
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booked, setBooked] = useState("");
  const [name, setName] = useState("");
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const notice =
      phase >= 3 ? "Live. Use the miniature site." : phase === 2 ? "Interface visible." : phase === 1 ? "Structure forming." : "Idea placed.";
    setAnnouncement(notice);
  }, [phase]);

  // The cue retires on its own after a while; any interaction retires it at once.
  useEffect(() => {
    if (!live || preview || !hint) return;
    const id = window.setTimeout(() => setHint(false), 9000);
    return () => window.clearTimeout(id);
  }, [live, preview, hint]);

  const book = (who: string) => {
    const at = who.trim();
    setBooked(at ? at.toUpperCase().slice(0, 12) : "");
    setBookingOpen(false);
    setAnnouncement(at ? `Visit booked for ${at} on Friday at 3 PM.` : "Visit booked for Friday at 3 PM.");
  };

  return (
    <div
      className="relative flex h-full flex-col gap-[9px] px-[14px] pb-[14px] pt-[36px] min-[900px]:h-auto min-[900px]:flex-1 min-[900px]:justify-center min-[900px]:pb-[14px]"
      data-preview={preview ? "1" : "0"}
      onPointerDown={() => setHint(false)}
    >
      <div className="flex flex-none items-center" aria-label="Build progress">
        {PHASES.map((label, i) => (
          <div key={label} className="flex items-center">
            <span className="wd-phase mono" data-on={phase >= i ? "1" : "0"}>
              {label}
            </span>
            {i < PHASES.length - 1 && (
              <span className="wd-phase-line" aria-hidden>
                <span className="wd-phase-line-track">
                  <span className="wd-phase-line-fill" style={{ width: phase >= i + 1 ? "100%" : "0%" }} />
                </span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* work surface */}
      <div className="wd-surface relative flex flex-1 flex-col overflow-hidden rounded-[5px] border" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
        <div className="wd-frame absolute inset-0 flex flex-col gap-[10px] rounded-[4px] border bg-[var(--bg)] p-[14px] min-[900px]:gap-[9px] min-[900px]:p-[13px]" style={{ borderColor: "var(--line)" }}>
          {/* headline block */}
          <div
            className="wd-part relative h-[60px] flex-none overflow-hidden rounded-[4px] border"
            style={{
              borderColor: phase >= 2 ? "var(--line)" : "var(--faint)",
              background: phase >= 2 ? "linear-gradient(140deg,#f7f5ef 0%, #eef0e3 54%, #e6e3da 100%)" : "transparent",
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-between gap-[14px] px-[12px]"
              style={{
                opacity: phase >= 2 ? 1 : 0,
                filter: phase >= 2 ? "none" : "blur(2px)",
                transition: "opacity .9s var(--e-out), filter .9s var(--e-out)",
              }}
            >
              <p className="m-0 text-[clamp(15px,1.25vw,19px)] leading-[1.06] tracking-[-0.04em]" style={{ transform: phase >= 2 ? "none" : "translateY(8px)", transition: "transform .9s var(--e-out)" }}>
                Quiet rooms for loud ideas.
              </p>
              <span className="mono self-start pt-[2px]" style={{ color: "color-mix(in srgb, var(--accent-deep) 75%, var(--fg))" }}>
                NORTH
              </span>
            </div>
            <p
              className="absolute bottom-[9px] left-[12px] m-0 max-w-[86%] text-[clamp(14px,1.2vw,17px)] leading-[1.25] tracking-[-0.045em]"
              style={{
                opacity: phase === 0 ? 1 : 0,
                transform: phase === 0 ? "translateY(0)" : "translateY(6px)",
                transition: "opacity .5s var(--e-out), transform .5s var(--e-out)",
              }}
              aria-hidden="true"
            >
              Quiet rooms for loud ideas.
            </p>
          </div>

          {/* content block */}
          <div
            className="wd-part relative flex flex-1 rounded-[4px] border"
            style={{
              borderColor: phase >= 2 ? "var(--line)" : "var(--faint)",
              background: phase >= 2 ? "var(--bg)" : "transparent",
              minHeight: 0,
            }}
          >
            <div
              className="grid gap-[9px] p-[10px] min-[560px]:grid-cols-2"
              style={{ opacity: phase >= 2 ? 1 : 0, transition: "opacity .9s var(--e-out) .08s" }}
            >
              {[
                ["Booking system", "A visit button that updates this very page."],
                ["Rooms previewed", "Small interface pieces, not decoration."],
              ].map(([t, b], i) => (
                <div
                  key={t}
                  className="rounded-[3px] border bg-[var(--card)] px-[12px] py-[9px]"
                  style={{
                    borderColor: "var(--line)",
                    opacity: phase >= 2 ? 1 : 0,
                    transform: phase >= 2 ? "none" : "scaleY(0.72)",
                    transition: "opacity .55s var(--e-out), transform .55s var(--e-out)",
                    transitionDelay: `${90 + i * 80}ms`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[clamp(11.5px,1.05vw,14px)] font-medium tracking-[-0.02em]">{t}</strong>
                    <span className="mt-[2px] block h-[6px] w-[6px] flex-none rounded-full" style={{ background: i === 0 ? "var(--accent-deep)" : "var(--faint)" }} />
                  </div>
                  <p className="m-0 mt-[6px] text-[clamp(9.5px,0.8vw,11px)] leading-[1.4]" style={{ color: "var(--muted)" }}>
                    {b}
                  </p>
                  <div className="mt-[7px] h-[5px] w-[86%] rounded-full" style={{ background: "var(--line)", overflow: "hidden" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: phase >= 3 ? `${i === 0 ? 68 : 41}%` : "0%",
                        background: "var(--accent-deep)",
                        transition: "width .7s var(--e-out)",
                        transitionDelay: `${220 + i * 60}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* action row — structured early, interactive only when LIVE */}
          <div className={`wd-part flex flex-none flex-wrap items-center justify-between gap-x-[14px] gap-y-[6px] ${live && !preview ? "" : "pointer-events-none"}`}>
            <button
              type="button"
              className="wd-book flex-none"
              disabled={!live || preview}
              onClick={() => setBookingOpen(true)}
              aria-expanded={bookingOpen}
              data-cursor={live && !preview ? "BOOK" : undefined}
            >
              Book a visit
              <span aria-hidden>→</span>
            </button>
            <label
              className={`flex min-w-0 max-w-[46%] flex-1 items-center gap-[7px] border-b pb-[4px] ${bookingOpen ? "pointer-events-none opacity-45" : ""}`}
              style={{ borderColor: booked ? "var(--accent-deep)" : "var(--line)" }}
            >
              <span className="mono flex-none">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!live || preview || Boolean(booked)}
                placeholder={booked ? "Reserved" : "Ana Silva"}
                aria-label="Name for the visit"
                className="w-full min-w-0 bg-transparent text-[clamp(11px,1vw,13.5px)] font-medium tracking-[-0.02em] outline-none placeholder:font-mono placeholder:text-[11px] placeholder:text-[var(--faint)]"
              />
            </label>
          </div>

          {/* confirmation sheet — inside the mini-site */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end" style={{ pointerEvents: bookingOpen ? "auto" : "none" }} aria-hidden={!bookingOpen}>
            <div
              className="mx-[4%] border border-[var(--line)] rounded-[4px] bg-[var(--card)] p-[11px]"
              style={{
                transform: bookingOpen ? "translateY(-4%)" : "translateY(112%)",
                opacity: bookingOpen ? 1 : 0,
                transition: "transform .5s var(--e-out), opacity .35s var(--e-out)",
              }}
              role="dialog"
              aria-label="Confirm the visit"
            >
              <div className="flex items-center justify-between gap-[8px]">
                <span className="mono mono-fg">Next opening</span>
                <button type="button" className="mono lnk" onClick={() => setBookingOpen(false)}>
                  Not now
                </button>
              </div>
              <p className="m-0 mt-[7px] text-[clamp(14px,1.35vw,19px)] leading-[1.25] tracking-[-0.04em]">Friday · 3 PM — one quiet room.</p>
              <button type="button" className="wd-book mt-[9px] self-start" onClick={() => book(name)} data-cursor="CONFIRM" onMouseDown={(e) => e.stopPropagation()}>
                Confirm visit · 3 PM
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* status bar */}
      <div className="flex flex-none flex-wrap items-center justify-between gap-[8px]">
        <p
          className="mono m-0"
          style={{
            color: booked ? "var(--accent-deep)" : live ? "var(--fg)" : phase === 2 ? "var(--fg)" : "var(--faint)",
            letterSpacing: booked ? ".16em" : ".14em",
          }}
        >
          {booked ? `VISIT CONFIRMED · FRI 3 PM${booked ? ` · ${booked}` : ""}` : live ? "Live · this interface responds" : PHASES[phase]}
        </p>
        {live && page !== "visit" && (
          <button type="button" className="mono lnk" onClick={() => setPage("visit")}>
            See details →
          </button>
        )}
      </div>

      {/* LIVE affordance — a pulsing cursor hand: this is yours to look around */}
      {live && !preview && hint && (
        <div
          className="wd-hint demo-in flex flex-none items-center gap-[10px] rounded-[4px] border px-[10px] py-[7px]"
          style={{
            borderColor: "color-mix(in srgb, var(--accent-deep) 40%, var(--line))",
            background: "color-mix(in srgb, var(--accent) 12%, var(--card))",
          }}
        >
          <span className="wd-hand" aria-hidden>
            <span className="wd-hand-ring" />
            <svg width="15" height="19" viewBox="0 0 18 22">
              <path
                d="M1 1 L1 17 L5.4 12.9 L8.6 20.2 L11.6 18.9 L8.5 11.7 L14.4 11.7 Z"
                fill="var(--fg)"
                stroke="var(--bg)"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="mono" style={{ color: "var(--accent-deep)" }}>
            Live — look around
          </span>
          <span className="body-s truncate" style={{ color: "var(--muted)" }}>
            switch the tabs, or book a visit. It responds.
          </span>
        </div>
      )}

      {live && (
        <div className="relative flex flex-none items-center justify-between gap-[10px] rounded-[4px] border px-[10px] py-[7px]" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          {(["work", "studio", "visit"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setPage(v)} aria-pressed={page === v} className="demo-navlink text-[9.5px] tracking-[.14em] uppercase" data-on={page === v ? "1" : "0"}>
              {v === "work" ? "Design" : v === "studio" ? "Interface" : "Book"}
            </button>
          ))}
          <span className="demo-in body-s ml-auto text-right" style={{ color: "var(--faint)" }} aria-live="off">
            {page === "work" && "Three rooms redesigned after hours."}
            {page === "studio" && "Small interface pieces, rebuilt daily."}
            {page === "visit" && "Quiet space. Friday 3 PM · Ana will guide you."}
          </span>
        </div>
      )}

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
