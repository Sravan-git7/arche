import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteContent } from "../data/site";
import { gsap, ScrollTrigger, onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";
import { emitThread } from "../lib/threadBus";

/**
 * PROBLEM — scroll-scrubbed storyboard where four disconnected tools become one system.
 *
 * Storyboard by progress p (0 to 1), pinned for 260vh, scrub 0.6:
 * - p 0.00 to 0.12 — IDLE:
 *   Four cards idle independently: translateY ±3px loops with durations 3.1s, 4.3s, 3.7s, 5.0s;
 *   each card's status dot pulses (ring scale 1 to 1.6, opacity 0.6 to 0) with periods 1.6s, 2.2s, 1.9s, 2.7s;
 *   CRM text "No owner" flickers between opacity 0.55 and 1 every 2.3s.
 *   Loops stop and reset when p > 0.12, and resume when scrubbing back.
 * - p 0.12 to 0.30:
 *   Signal lands on WEBSITE card's status dot; card border tweens to lime;
 *   paragraph and headline lines reveal.
 * - p 0.30 to 0.42:
 *   Line draws (DrawSVG) from WEBSITE to EMAIL; EMAIL's value "Unread · 12m" changes to "Read"
 *   with masked text swap (0.3s). Counter rolls 0 -> 1.
 * - p 0.42 to 0.62:
 *   Two lines draw simultaneously: EMAIL to SHEET and WEBSITE to CRM (fan-out).
 *   SHEET and CRM status tags change from gray to lime; CRM value swaps to "Assigned".
 *   Counter rolls 1 -> 2 -> 3.
 * - p 0.62 to 0.80:
 *   Counter shows "4 TOOLS · 3 CONNECTIONS"; "CONNECTED" tag turns lime and flashes once.
 *   All four status dots pulse twice in unison (scale 1 to 1.8, 0.5s).
 *   Headline line B ("They have a connection problem.") tweens to ink, and a lime 4px underline
 *   draws under "connection".
 * - p 0.80 to 1.00:
 *   Four cards scale to 0.6 and fade to opacity 0 toward panel center;
 *   four status dots stay and glide to horizontal line at panel vertical center,
 *   connected by drawn lime line ("Website → AI Agent → Qualified Lead → CRM").
 *   Hold last 10% for reading.
 */
type CardId = "web" | "email" | "sheet" | "crm";

type Card = {
  id: CardId;
  k: string;
  a: string;
  b?: string;
  tag: string;
  targetLabel: string;
  x: number; // stage units (160 × 110)
  y: number;
  rx: number; // compact-diagram x
  idleDur: number;
  pulsePeriod: number;
};

const W = 160;
const H = 110;
const ROW_Y = 58;

const CARDS: Card[] = [
  { id: "web", k: "Website", a: "New inquiry", tag: "Captured", targetLabel: "Website", x: 33, y: 24, rx: 20, idleDur: 3.1, pulsePeriod: 1.6 },
  { id: "email", k: "Email", a: "Unread · 12m", b: "Read", tag: "Sent", targetLabel: "AI Agent", x: 127, y: 24, rx: 60, idleDur: 4.3, pulsePeriod: 2.2 },
  { id: "sheet", k: "Sheet", a: "Row pending", tag: "Logged", targetLabel: "Qualified Lead", x: 127, y: 86, rx: 100, idleDur: 5.0, pulsePeriod: 2.7 },
  { id: "crm", k: "CRM", a: "No owner", b: "Assigned", tag: "Assigned", targetLabel: "CRM", x: 33, y: 86, rx: 140, idleDur: 3.7, pulsePeriod: 1.9 },
];

const CARD_DETAIL: Record<CardId, { role: string; friction: string; resolved: string }> = {
  web: {
    role: "Entry point — captures intent.",
    friction: "A form submission lands here and waits for someone to notice it.",
    resolved: "The inquiry becomes a trigger, not a dead end.",
  },
  email: {
    role: "Transport — carries the request.",
    friction: "Someone reads, retypes and forwards the same details by hand.",
    resolved: "The request is parsed once, then passed on with its context intact.",
  },
  sheet: {
    role: "Record — holds the working data.",
    friction: "A second copy of the truth, updated after the fact.",
    resolved: "The row writes itself from the same event that fed the CRM.",
  },
  crm: {
    role: "Ownership — decides what happens next.",
    friction: "No owner, no follow-up, no way to see what was lost.",
    resolved: "A qualified lead arrives with its history attached.",
  },
};

// Connection paths between card edges
const FAN = ["M58 24 H102", "M127 36 V74", "M33 36 V74"];
const ROW = `M${CARDS[0].rx} ${ROW_Y} H${CARDS[3].rx}`;


type InspectProps = { inspect: CardId | null; onInspect: (id: CardId | null) => void };
type ProblemProps = InspectProps & { reduced: boolean };

function Inspector({ inspect, onInspect }: InspectProps) {
  const c = inspect ? CARDS.find((x) => x.id === inspect) : null;
  const d = inspect ? CARD_DETAIL[inspect] : null;
  return (
    <div className="pf-inspector" aria-live="polite">
      {c && d ? (
        <>
          <div className="flex items-start justify-between gap-[12px]">
            <span className="mono mono-a">{c.k} — {d.role}</span>
            <button
              type="button"
              className="mono lnk flex-none"
              onClick={() => onInspect(null)}
              aria-label="Close tool inspection"
            >
              ✕ Close
            </button>
          </div>
          <p className="body-s mt-[8px]">
            <span style={{ color: "var(--faint)" }}>Alone: </span>{d.friction}{" "}
            <span style={{ color: "var(--accent-ink)" }}>Connected: </span>{d.resolved}
          </p>
        </>
      ) : (
        <>
          <span className="mono mono-a">Target state · conceptual model</span>
          <p className="body-s mt-[8px]">
            Website <span style={{ color: "var(--accent-ink)" }}>→</span> AI Agent{" "}
            <span style={{ color: "var(--accent-ink)" }}>→</span> Qualified Lead{" "}
            <span style={{ color: "var(--accent-ink)" }}>→</span> CRM
          </p>
          <span className="mono mt-[6px] block" style={{ color: "var(--faint)", fontSize: 9 }}>
            Click or tap any tool to inspect it. Escape closes.
          </span>
        </>
      )}
    </div>
  );
}

function Copy({
  connectionUnderlineRef,
  lineBRef,
  headlineRef,
  bodyRef,
}: {
  connectionUnderlineRef?: React.RefObject<HTMLSpanElement | null>;
  lineBRef?: React.RefObject<HTMLHeadingElement | null>;
  headlineRef?: React.RefObject<HTMLHeadingElement | null>;
  bodyRef?: React.RefObject<HTMLParagraphElement | null>;
}) {
  const w = siteContent.whatWeDo;
  return (
    <div className="flex flex-col gap-[20px]">
      <p className="mono mono-a">{w.label}</p>
      <h2 ref={headlineRef} className="d2" data-r="mask">
        {w.lineA}
      </h2>
      <h2
        ref={lineBRef}
        className="d2 transition-colors duration-200"
        data-r="mask"
        style={{ color: "var(--faint)" }}
      >
        They have a{" "}
        <span className="relative inline-block">
          connection
          <span
            ref={connectionUnderlineRef}
            className="pointer-events-none absolute bottom-0 left-0 h-[4px] w-full origin-left"
            style={{
              background: "var(--accent)",
              transform: "scaleX(0)",
              transformOrigin: "left center",
            }}
            aria-hidden="true"
          />
        </span>{" "}
        problem.
      </h2>
      <p ref={bodyRef} className="body max-w-[46ch]" data-r="meta">
        {w.body}
      </p>
    </div>
  );
}

export function ProblemSystem() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 900px) and (min-height: 760px)").matches
  );
  const [inspect, setInspect] = useState<CardId | null>(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReduced), []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px) and (min-height: 760px)");
    const on = () => setDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const props = { inspect, onInspect: setInspect, reduced };
  return desktop ? <ProblemPinned {...props} /> : <ProblemStacked {...props} />;
}

/* ================================================================== */
/* Desktop — pinned for 260vh, scrubbed 0.6                           */
/* ================================================================== */
function ProblemPinned({ inspect, onInspect, reduced }: ProblemProps) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const counterCol = useRef<HTMLSpanElement>(null);
  const counterUnit = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const lineBRef = useRef<HTMLHeadingElement>(null);
  const connectionUnderlineRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const sec = root.current;
    const st = stage.current;
    if (!sec || !st) return;

    const reduce = reduced || prefersReducedMotion();
    if (reduce) {
      return;
    }

    const cardWeb = st.querySelector<HTMLElement>('[data-card="web"]')!;
    const cardEmail = st.querySelector<HTMLElement>('[data-card="email"]')!;
    const cardSheet = st.querySelector<HTMLElement>('[data-card="sheet"]')!;
    const cardCrm = st.querySelector<HTMLElement>('[data-card="crm"]')!;
    const cardEls = [cardWeb, cardEmail, cardSheet, cardCrm];

    const fanLines = Array.from(st.querySelectorAll<SVGPathElement>(".pf-fan"));
    const fanGroup = st.querySelector<SVGGElement>(".pf-fan-g")!;
    const rowLine = st.querySelector<SVGPathElement>(".pf-row")!;
    const slots = Array.from(st.querySelectorAll<HTMLElement>("[data-thread-slot]"));

    const dotWeb = cardWeb.querySelector<HTMLElement>(".pf-dot")!;
    const dotEmail = cardEmail.querySelector<HTMLElement>(".pf-dot")!;
    const dotSheet = cardSheet.querySelector<HTMLElement>(".pf-dot")!;
    const dotCrm = cardCrm.querySelector<HTMLElement>(".pf-dot")!;

    const pulseRings = Array.from(st.querySelectorAll<HTMLElement>(".pf-pulse-ring"));
    const unisonRings = Array.from(st.querySelectorAll<HTMLElement>(".pf-unison-ring"));
    const crmValA = cardCrm.querySelector<HTMLElement>(".pf-crm-val-a");
    const crmValB = cardCrm.querySelector<HTMLElement>(".pf-crm-val-b");
    const emailValA = cardEmail.querySelector<HTMLElement>(".pf-email-val-a");
    const emailValB = cardEmail.querySelector<HTMLElement>(".pf-email-val-b");
    const sheetTag = cardSheet.querySelector<HTMLElement>(".pf-tag");
    const crmTag = cardCrm.querySelector<HTMLElement>(".pf-tag");

    const targetRowLabels = Array.from(st.querySelectorAll<HTMLElement>(".pf-target-label"));
    const morphNodes = Array.from(st.querySelectorAll<HTMLElement>(".pf-morph-node"));

    // Set initial states
    gsap.set(fanLines, { drawSVG: "0%" });
    gsap.set(rowLine, { drawSVG: "0%" });
    gsap.set(pulseRings, { scale: 1, opacity: 0 });
    gsap.set(unisonRings, { scale: 1, opacity: 0 });
    gsap.set(connectionUnderlineRef.current, { scaleX: 0 });
    gsap.set(targetRowLabels, { opacity: 0, y: 6 });
    gsap.set(morphNodes, { opacity: 0 });

    let idleTweens: gsap.core.Tween[] = [];
    let idleActive = false;

    // Start idle animations (p 0.00 to 0.12)
    const startIdle = () => {
      if (idleActive) return;
      idleActive = true;
      idleTweens = [];

      // 1. Independent translateY ±3px loops: 3.1s, 4.3s, 5.0s, 3.7s
      const cardDurations = [3.1, 4.3, 5.0, 3.7];
      cardEls.forEach((cardEl, i) => {
        idleTweens.push(
          gsap.fromTo(
            cardEl,
            { y: -3 },
            {
              y: 3,
              duration: cardDurations[i] / 2,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            }
          )
        );
      });

      // 2. Unsynced status dot pulse rings (scale 1 to 1.6, opacity 0.6 to 0)
      const ringPeriods = [1.6, 2.2, 2.7, 1.9];
      pulseRings.forEach((ring, i) => {
        idleTweens.push(
          gsap.fromTo(
            ring,
            { scale: 1, opacity: 0.6 },
            {
              scale: 1.6,
              opacity: 0,
              duration: ringPeriods[i],
              ease: "power2.out",
              repeat: -1,
            }
          )
        );
      });

      // 3. CRM "No owner" flickers between 0.55 and 1 every 2.3s
      if (crmValA) {
        idleTweens.push(
          gsap.fromTo(
            crmValA,
            { opacity: 1 },
            {
              opacity: 0.55,
              duration: 1.15,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            }
          )
        );
      }
    };

    const stopIdle = () => {
      if (!idleActive) return;
      idleActive = false;
      idleTweens.forEach((tw) => tw.kill());
      idleTweens = [];
      gsap.set(cardEls, { y: 0 });
      gsap.set(pulseRings, { scale: 1, opacity: 0 });
      if (crmValA) gsap.set(crmValA, { opacity: 1 });
    };

    startIdle();

    const ctx = gsap.context(() => {
      const masterTl = gsap.timeline({
        scrollTrigger: {
          id: "problem-pin",
          trigger: sec,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 2.6)}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (p <= 0.12) {
              startIdle();
            } else {
              stopIdle();
            }

            // Update status text units
            if (counterUnit.current) {
              counterUnit.current.textContent = p >= 0.38 && p < 0.50 ? " connection" : " connections";
            }
            if (stateRef.current) {
              if (p < 0.62) {
                stateRef.current.textContent = "Disconnected";
                stateRef.current.style.color = "var(--faint)";
              } else if (p >= 0.85) {
                stateRef.current.textContent = "one system";
                stateRef.current.style.color = "var(--accent-ink)";
              } else {
                stateRef.current.textContent = "Connected";
                stateRef.current.style.color = "var(--accent-ink)";
              }
            }
          },
        },
      });

      // Storyboard timeline mapping directly to progress [0, 1]:

      // -------------------------------------------------------------
      // p 0.12 to 0.30: Signal lands on WEBSITE; border tweens to lime;
      // headline & paragraph revealed
      // -------------------------------------------------------------
      masterTl.to(
        cardWeb,
        {
          borderColor: "var(--accent)",
          boxShadow: "0 0 16px -4px color-mix(in srgb, var(--accent) 35%, transparent)",
          duration: 0.10,
          ease: "power2.out",
        },
        0.18
      );
      masterTl.to(
        dotWeb,
        {
          backgroundColor: "var(--accent)",
          boxShadow: "0 0 12px 2px color-mix(in srgb, var(--accent) 70%, transparent)",
          duration: 0.10,
        },
        0.18
      );

      // Headline and paragraph reveal
      if (headlineRef.current && bodyRef.current) {
        masterTl.fromTo(
          [headlineRef.current, bodyRef.current],
          { opacity: 0.5, y: 10 },
          { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" },
          0.12
        );
      }

      // -------------------------------------------------------------
      // p 0.30 to 0.42: Line draws from WEBSITE to EMAIL;
      // EMAIL's value "Unread · 12m" changes to "Read" (masked swap);
      // counter rolls 0 -> 1
      // -------------------------------------------------------------
      masterTl.fromTo(
        fanLines[0],
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 0.12, ease: "power2.inOut" },
        0.30
      );

      if (emailValA && emailValB) {
        masterTl.to(emailValA, { y: -10, opacity: 0, duration: 0.05, ease: "power2.in" }, 0.34);
        masterTl.fromTo(emailValB, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.05, ease: "power2.out" }, 0.37);
      }

      masterTl.to(
        cardEmail,
        {
          borderColor: "var(--accent)",
          boxShadow: "0 0 16px -4px color-mix(in srgb, var(--accent) 35%, transparent)",
          duration: 0.08,
          ease: "power2.out",
        },
        0.38
      );
      masterTl.to(
        dotEmail,
        {
          backgroundColor: "var(--accent)",
          boxShadow: "0 0 12px 2px color-mix(in srgb, var(--accent) 70%, transparent)",
          duration: 0.08,
        },
        0.38
      );

      // Counter roll 0 -> 1
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: "-1.2em", duration: 0.04, ease: "power2.inOut" }, 0.38);
      }

      // -------------------------------------------------------------
      // p 0.42 to 0.62: Two lines draw at the same time:
      // EMAIL to SHEET and WEBSITE to CRM (fan-out);
      // SHEET and CRM status tags change from gray to lime;
      // CRM value swaps to "Assigned";
      // counter rolls 1 -> 2 -> 3
      // -------------------------------------------------------------
      masterTl.fromTo(
        fanLines[1],
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 0.18, ease: "power2.inOut" },
        0.42
      );
      masterTl.fromTo(
        fanLines[2],
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 0.18, ease: "power2.inOut" },
        0.42
      );

      // Counter roll 1 -> 2
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: "-2.4em", duration: 0.04, ease: "power2.inOut" }, 0.50);
      }

      // Sheet activates
      masterTl.set(cardSheet, { attr: { "data-flip": "1" } }, 0.50);
      if (sheetTag) masterTl.to(sheetTag, { color: "var(--accent-ink)", duration: 0.06 }, 0.52);
      masterTl.to(
        cardSheet,
        {
          borderColor: "var(--accent)",
          boxShadow: "0 0 16px -4px color-mix(in srgb, var(--accent) 35%, transparent)",
          duration: 0.08,
          ease: "power2.out",
        },
        0.52
      );
      masterTl.to(
        dotSheet,
        {
          backgroundColor: "var(--accent)",
          boxShadow: "0 0 12px 2px color-mix(in srgb, var(--accent) 70%, transparent)",
          duration: 0.08,
        },
        0.52
      );

      // CRM activates & value swaps "No owner" -> "Assigned"
      if (crmValA && crmValB) {
        masterTl.to(crmValA, { y: -14, opacity: 0, duration: 0.04, ease: "power2.in" }, 0.52);
        masterTl.fromTo(crmValB, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.04, ease: "power2.out" }, 0.54);
      }
      if (crmTag) masterTl.to(crmTag, { color: "var(--accent-ink)", duration: 0.06 }, 0.56);
      masterTl.to(
        cardCrm,
        {
          borderColor: "var(--accent)",
          boxShadow: "0 0 16px -4px color-mix(in srgb, var(--accent) 35%, transparent)",
          duration: 0.08,
          ease: "power2.out",
        },
        0.56
      );
      masterTl.to(
        dotCrm,
        {
          backgroundColor: "var(--accent)",
          boxShadow: "0 0 12px 2px color-mix(in srgb, var(--accent) 70%, transparent)",
          duration: 0.08,
        },
        0.56
      );

      // Counter roll 2 -> 3
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: "-3.6em", duration: 0.04, ease: "power2.inOut" }, 0.60);
      }

      // -------------------------------------------------------------
      // p 0.62 to 0.80: "CONNECTED" tag turns lime and flashes once;
      // All four status dots pulse twice in unison;
      // Headline line B tweens to ink color and lime underline draws under "connection"
      // -------------------------------------------------------------
      if (stateRef.current) {
        masterTl.to(stateRef.current, { scale: 1.2, opacity: 0.4, duration: 0.03, ease: "power1.in" }, 0.62);
        masterTl.to(stateRef.current, { scale: 1, opacity: 1, duration: 0.04, ease: "power1.out" }, 0.65);
      }

      // Unison pulses (scale 1 to 1.8, opacity 0.8 to 0)
      masterTl.fromTo(
        unisonRings,
        { scale: 1, opacity: 0.8 },
        { scale: 1.8, opacity: 0, duration: 0.05, ease: "power2.out" },
        0.65
      );
      masterTl.fromTo(
        unisonRings,
        { scale: 1, opacity: 0.8 },
        { scale: 1.8, opacity: 0, duration: 0.05, ease: "power2.out" },
        0.72
      );

      // Headline line B color & underline
      if (lineBRef.current) {
        masterTl.to(lineBRef.current, { color: "var(--fg)", duration: 0.10, ease: "power2.out" }, 0.64);
      }
      if (connectionUnderlineRef.current) {
        masterTl.to(connectionUnderlineRef.current, { scaleX: 1, duration: 0.12, ease: "power2.out" }, 0.66);
      }

      // -------------------------------------------------------------
      // p 0.80 to 1.00: Four cards scale to 0.6 and fade to opacity 0 toward center;
      // Four status dots glide to horizontal row at ROW_Y = 58;
      // Row line draws; target state strip labels appear;
      // Hold last 10% (0.90 to 1.00) for reading
      // -------------------------------------------------------------
      // Cards scale & fade toward center
      masterTl.to(
        cardEls,
        {
          scale: 0.6,
          opacity: 0,
          duration: 0.08,
          ease: "power2.inOut",
        },
        0.80
      );
      masterTl.to(fanGroup, { opacity: 0, duration: 0.06 }, 0.80);

      // Morph nodes appear and glide from initial card positions to target row
      masterTl.fromTo(
        morphNodes,
        { opacity: 0 },
        { opacity: 1, duration: 0.03 },
        0.80
      );

      // Move morph nodes from card positions to (rx, ROW_Y)
      CARDS.forEach((c, i) => {
        const node = morphNodes[i];
        if (node) {
          masterTl.fromTo(
            node,
            { left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%` },
            { left: `${(c.rx / W) * 100}%`, top: `${(ROW_Y / H) * 100}%`, duration: 0.08, ease: "power2.inOut" },
            0.80
          );
        }
        const slot = slots[i];
        if (slot) {
          masterTl.fromTo(
            slot,
            { left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%` },
            { left: `${(c.rx / W) * 100}%`, top: `${(ROW_Y / H) * 100}%`, duration: 0.08, ease: "power2.inOut" },
            0.80
          );
        }
      });

      // Row connecting line draws
      masterTl.fromTo(
        rowLine,
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 0.06, ease: "power2.inOut" },
        0.83
      );

      // Target row labels fade in
      masterTl.fromTo(
        targetRowLabels,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.05, ease: "power2.out", stagger: 0.015 },
        0.85
      );

      // Notify shared system thread
      masterTl.call(() => emitThread(), [], 0.88);

      // Hold last 10 percent (0.90 to 1.00) static
      masterTl.to({}, { duration: 0.10 }, 0.90);
    }, sec);

    return () => {
      stopIdle();
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section ref={root} id="problem" data-bridge-root className="relative flex h-[100svh] w-full items-center pt-[72px]">
      <div className="wrap grid w-full grid-cols-12 items-center gap-[clamp(28px,4vw,72px)]">
        <div className="col-span-5">
          <Copy
            connectionUnderlineRef={connectionUnderlineRef}
            lineBRef={lineBRef}
            headlineRef={headlineRef}
            bodyRef={bodyRef}
          />
        </div>

        <div className="col-span-7">
          <div className="ml-auto" style={{ maxWidth: "calc((100svh - 230px) * 16 / 11)" }}>
            <div className="mb-[12px] flex items-center justify-between">
              <div className="mono flex items-center gap-[0.5ch]">
                <span>4 tools ·</span>
                <span
                  className="inline-block overflow-hidden relative"
                  style={{ height: "1.2em", width: "1ch", verticalAlign: "top" }}
                >
                  <span
                    ref={counterCol}
                    className="inline-flex flex-col text-center"
                    style={{ willChange: "transform" }}
                  >
                    <span style={{ height: "1.2em", lineHeight: "1.2em" }}>0</span>
                    <span style={{ height: "1.2em", lineHeight: "1.2em" }}>1</span>
                    <span style={{ height: "1.2em", lineHeight: "1.2em" }}>2</span>
                    <span style={{ height: "1.2em", lineHeight: "1.2em" }}>3</span>
                  </span>
                </span>
                <span ref={counterUnit}>connections</span>
              </div>
              <span
                ref={stateRef}
                className="mono transition-colors"
                style={{ color: "var(--faint)" }}
              >
                Disconnected
              </span>
            </div>

            <div
              ref={stage}
              className="pf-beat relative w-full rounded-[6px]"
              style={{ aspectRatio: "16 / 11", background: "var(--bg-2)" }}
            >
              <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden>
                <g className="pf-fan-g">
                  {FAN.map((d, i) => (
                    <path
                      key={i}
                      className="pf-fan"
                      d={d}
                      stroke="var(--accent)"
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  ))}
                  {FAN.map((_, i) => <circle key={`packet-${i}`} className="pf-packet" r="1.1" fill="var(--accent-deep)" opacity="0" />)}
                </g>
                <path
                  id="problem-diagram-line"
                  className="pf-row"
                  d={ROW}
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {/* Four Cards */}
              {CARDS.map((c) => (
                <div
                  key={c.id}
                  data-card={c.id}
                  className="pf-card pf-inspect absolute flex w-[31%] flex-col rounded-[5px] border p-[clamp(9px,1vw,13px)]"
                  style={{
                    left: `${(c.x / W) * 100}%`,
                    top: `${(c.y / H) * 100}%`,
                    transform: "translate(-50%,-50%)",
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect the ${c.k} tool`}
                  aria-pressed={inspect === c.id}
                  data-cursor="EXPLORE"
                  onClick={() => onInspect(inspect === c.id ? null : c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onInspect(inspect === c.id ? null : c.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-[10px]">
                    <span className="mono mono-fg">{c.k}</span>
                    <span
                      className="pf-dot relative block flex-none"
                      style={{ width: 8, height: 8 }}
                      {...(c.id === "web" ? { "data-signal": "problem-website" } : {})}
                    >
                      <span className="absolute inset-0 rounded-full" style={{ background: "var(--faint)" }} />
                      {/* Pulse ring for idle pulse */}
                      <span
                        className="pf-pulse-ring pointer-events-none absolute inset-[-3px] rounded-full"
                        style={{ border: "1px solid var(--accent)", opacity: 0 }}
                      />
                      {/* Unison pulse ring */}
                      <span
                        className="pf-unison-ring pointer-events-none absolute inset-[-4px] rounded-full"
                        style={{ background: "var(--accent)", opacity: 0 }}
                      />
                    </span>
                  </div>

                  <span className="pf-flip mt-[8px] text-[clamp(13px,1.1vw,15px)] tracking-[-.02em] relative overflow-hidden h-[1.3em] block">
                    {c.id === "email" ? (
                      <>
                        <span className="pf-email-val-a block absolute inset-0">{c.a}</span>
                        <span className="pf-email-val-b block absolute inset-0 opacity-0">{c.b}</span>
                      </>
                    ) : c.id === "crm" ? (
                      <>
                        <span className="pf-crm-val-a block absolute inset-0">{c.a}</span>
                        <span className="pf-crm-val-b block absolute inset-0 opacity-0">{c.b}</span>
                      </>
                    ) : (
                      <span className="block">{c.a}</span>
                    )}
                  </span>

                  <span className="pf-tag mono mt-[6px] block transition-colors duration-200" style={{ fontSize: 9 }}>
                    {c.tag}
                  </span>
                </div>
              ))}

              {/* Morph Dots & Labels (Glide to horizontal row at ROW_Y = 58) */}
              {CARDS.map((c) => (
                <div
                  key={c.id}
                  className="pf-morph-node pf-compact-anchor pointer-events-none absolute flex flex-col items-center"
                  style={{
                    left: `${(c.x / W) * 100}%`,
                    top: `${(c.y / H) * 100}%`,
                    transform: "translate(-50%,-50%)",
                  }}
                >
                  <span
                    className="pf-morph-dot signal-dot block"
                    style={{
                      width: 8,
                      height: 8,
                    }}
                  />
                  <span
                    className="pf-target-label mono mt-[10px] block text-center whitespace-nowrap"
                    style={{
                      fontSize: 10,
                      color: "var(--accent-ink)",
                    }}
                  >
                    {c.targetLabel}
                  </span>
                </div>
              ))}

              {/* Invisible anchor slots for SystemThread */}
              <div id="problem-diagram" aria-hidden>
                {CARDS.map((c) => (
                  <span
                    key={c.id}
                    data-thread-slot="problem"
                    data-cmp={c.k}
                    className="pointer-events-none absolute block"
                    style={{
                      left: `${(c.rx / W) * 100}%`,
                      top: `${(ROW_Y / H) * 100}%`,
                      width: 0,
                      height: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            <Inspector inspect={inspect} onInspect={onInspect} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Mobile — stacked, each card resolves in the middle third             */
/* ================================================================== */
const MOBILE_ORDER: CardId[] = ["web", "email", "sheet", "crm"];

function ProblemStacked({ inspect, onInspect, reduced }: ProblemProps) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const sec = root.current;
    if (!sec) return;
    const items = Array.from(sec.querySelectorAll<HTMLElement>(".pfm-item"));
    const resolve = (el: HTMLElement, on: boolean) => {
      el.dataset.done = on ? "1" : "0";
      el.dataset.sync = on ? "1" : "0";
      el.dataset.flip = on ? "1" : "0";
    };

    if (reduced) {
      items.forEach((el) => resolve(el, true));
      return;
    }
    items.forEach((el) => resolve(el, false));

    const ctx = gsap.context(() => {
      items.forEach((el, i) => {
        const trigger = i === 0 ? el.querySelector<HTMLElement>(".pf-dot")! : el;
        ScrollTrigger.create({
          trigger,
          start: i === 0 ? "center center" : "top 66%",
          onEnter: () => resolve(el, true),
          onLeaveBack: () => resolve(el, false),
        });
      });
    }, sec);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} id="problem" className="relative w-full py-[clamp(56px,12vw,90px)]">
      <div className="wrap">
        <Copy />
        <div className="pf-beat mt-[36px] flex flex-col">
          {MOBILE_ORDER.map((id, i) => {
            const c = CARDS.find((x) => x.id === id)!;
            return (
              <div key={id} className="pfm-item" data-done="0" data-sync="0" data-flip="0">
                {i > 0 && (
                  <span className="relative ml-[22px] block h-[34px] w-px" style={{ background: "var(--line)" }} aria-hidden>
                    <span className="pfm-seg absolute inset-0" style={{ background: "var(--accent-deep)" }} />
                  </span>
                )}
                <div
                  className="pf-card pf-inspect flex flex-col rounded-[5px] border p-[14px]"
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect the ${c.k} tool`}
                  aria-pressed={inspect === c.id}
                  onClick={() => onInspect(inspect === c.id ? null : c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onInspect(inspect === c.id ? null : c.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-[10px]">
                    <span className="mono mono-fg">{c.k}</span>
                    <span
                      className="pf-dot relative block flex-none"
                      style={{ width: 8, height: 8 }}
                      {...(i === 0 ? { "data-signal": "problem-website" } : {})}
                    >
                      <span className="absolute inset-0 rounded-full" style={{ background: "var(--faint)" }} />
                    </span>
                  </div>
                  <span className="pf-flip mt-[8px] text-[clamp(13px,1.1vw,15px)] tracking-[-.02em]">
                    <span className="pf-a">{c.a}</span>
                    {c.b && <span className="pf-b">{c.b}</span>}
                  </span>
                  <span className="pf-tag mono mt-[6px] block" style={{ fontSize: 9 }}>
                    {c.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <Inspector inspect={inspect} onInspect={onInspect} />
      </div>
    </section>
  );
}
