import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteContent } from "../data/site";
import { gsap, ScrollTrigger, onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";
import { emitThread } from "../lib/threadBus";

/**
 * ARCHÉ — PROBLEM SECTION 2.0: CINEMATIC SYSTEM TRANSFORMATION
 *
 * Visual & Motion Architecture:
 * - Editorial Headline Composition: Art-directed line-breaking, comfortable reading rhythm,
 *   authoritative cadence, with selective lime underline spanning "connection problem."
 * - 4 Authentic Miniature Software Environments:
 *   1. WEBSITE: Browser frame, URL chrome, form fields ("Acme Corp", "System Architecture"), submit state.
 *   2. EMAIL: Inbox client, subject, sender ("client@acmecorp.com"), message preview, unread/read state.
 *   3. CRM: Deal record #2048, stage badge, deal value ($24,000), unassigned -> assigned owner.
 *   4. SHEET: Spreadsheet data grid, column headers (ROW, COMPANY, STAGE, SYNC), dual-write sync state.
 *
 * 5-Act Master Timeline (6.0s Scrubbed):
 * - ACT 01 (0.0s–1.0s): Spatial entrance of 4 software environments into fragmented, tilted positions.
 * - ACT 02 (1.0s–2.1s): Inquiry arrives at Website; asynchronous handoff friction, broken connectors pulse.
 * - ACT 03 (2.1s–3.4s): Climax of friction; precision lime connectors draw, counter rolls (0->1->2->3).
 * - ACT 04 (3.4s–4.8s): Spatial reorganization; cards part into dedicated clearance, central pipeline reveals:
 *                       WEBSITE -> AI AGENT -> QUALIFIED LEAD -> CRM. Marker travels, Line B & underline ignite.
 * - ACT 05 (4.8s–6.0s): ONE SYSTEM settled state; operational harmony, quiet hold before release into Services.
 */

type CardId = "web" | "email" | "crm" | "sheet";

type Card = {
  id: CardId;
  k: string;
  a: string;
  b: string;
  tag: string;
  targetLabel: string;
  gridClass: string;
};

const CARDS: Card[] = [
  { id: "web", k: "Website", a: "New inquiry", b: "Inquiry captured", tag: "Captured", targetLabel: "WEBSITE", gridClass: "top-left" },
  { id: "email", k: "Email", a: "Waiting", b: "Read · 1m", tag: "Sent", targetLabel: "AI AGENT", gridClass: "top-right" },
  { id: "crm", k: "CRM", a: "Unassigned", b: "Assigned", tag: "Assigned", targetLabel: "QUALIFIED LEAD", gridClass: "bottom-left" },
  { id: "sheet", k: "Sheet", a: "Pending", b: "Row synced", tag: "Logged", targetLabel: "CRM", gridClass: "bottom-right" },
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
  crm: {
    role: "Ownership — decides what happens next.",
    friction: "No owner, no follow-up, no way to see what was lost.",
    resolved: "A qualified lead arrives with its history attached.",
  },
  sheet: {
    role: "Record — holds the working data.",
    friction: "A second copy of the truth, updated after the fact.",
    resolved: "The row writes itself from the same event that fed the CRM.",
  },
};

type InspectProps = { inspect: CardId | null; onInspect: (id: CardId | null) => void };
type ProblemProps = InspectProps & { reduced: boolean };

function Inspector({ inspect, onInspect }: InspectProps) {
  const c = inspect ? CARDS.find((x) => x.id === inspect) : null;
  const d = inspect ? CARD_DETAIL[inspect] : null;
  return (
    <div className="pf-inspector mt-[14px]" aria-live="polite">
      {c && d ? (
        <div className="rounded-[6px] border border-[var(--line)] bg-[var(--bg-2)] p-[12px]">
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
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] mono text-[var(--faint)] px-[4px]">
          <span className="mono-a">Target state · conceptual model</span>
          <span>Click any tool to inspect. Escape closes.</span>
        </div>
      )}
    </div>
  );
}

function Copy({
  connectionUnderlineRef,
  lineBRef,
  bodyRef,
}: {
  connectionUnderlineRef?: React.RefObject<HTMLSpanElement | null>;
  lineBRef?: React.RefObject<HTMLHeadingElement | null>;
  bodyRef?: React.RefObject<HTMLParagraphElement | null>;
}) {
  const w = siteContent.whatWeDo;
  return (
    <div className="flex flex-col max-w-[56ch]">
      {/* Editorial eyebrow with technical pulse */}
      <div className="flex items-center gap-[10px] mb-[clamp(14px,1.8vh,22px)]">
        <span className="inline-block w-[6px] h-[6px] rounded-full bg-[var(--accent)]" />
        <span className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent-ink)] font-medium">
          {w.label} · ARCHITECTURAL DIAGNOSIS
        </span>
      </div>

      {/* PRIMARY STATEMENT: Expressive oversized sans-serif */}
      <div className="relative">
        <div className="overflow-hidden">
          <h2 className="pf-head-line text-[clamp(40px,4.4vw,66px)] font-medium leading-[0.94] tracking-[-0.045em] text-[var(--fg)]">
            Most businesses
          </h2>
        </div>
        <div className="overflow-hidden mt-[clamp(6px,0.9vh,10px)] flex items-baseline gap-[12px] flex-wrap">
          <h2 className="pf-head-line text-[clamp(26px,2.8vw,42px)] font-normal leading-[1.04] tracking-[-0.035em] text-[var(--muted)]">
            don't have a tool problem.
          </h2>
          <span className="mono text-[10px] text-[var(--faint)] tracking-widest uppercase border border-[var(--line)] px-[6px] py-[1.5px] rounded-[3px] select-none">
            [TOOL OVERLOAD]
          </span>
        </div>
      </div>

      {/* ASYMMETRIC TURNING POINT: Indented editorial crescendo */}
      <div className="mt-[clamp(22px,3vh,34px)] pl-[clamp(16px,2vw,32px)] border-l border-[var(--line)] relative">
        <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)] mb-[6px] block">
          THE STRUCTURAL DEFICIT //
        </span>

        <div className="overflow-hidden">
          <h2
            ref={lineBRef}
            className="pf-head-line text-[clamp(34px,3.6vw,54px)] font-medium leading-[1.02] tracking-[-0.04em] transition-colors duration-300"
            style={{ color: "var(--faint)" }}
          >
            <span className="block text-[clamp(19px,1.9vw,28px)] font-normal text-[var(--muted)] tracking-[-0.02em] leading-snug mb-[3px]">
              They have a
            </span>
            <span className="relative inline-block font-semibold">
              connection problem.
              <span
                ref={connectionUnderlineRef}
                className="origin-left pointer-events-none absolute bottom-[-4px] left-0 h-[3px] w-full"
                style={{
                  background: "var(--accent)",
                  transform: "scaleX(0)",
                  transformOrigin: "left center",
                }}
                aria-hidden="true"
              />
            </span>
          </h2>
        </div>

        {/* Supporting Narrative Paragraph: Nestled directly under connection problem */}
        <p
          ref={bodyRef}
          className="body mt-[clamp(16px,2vh,24px)] max-w-[44ch] text-[clamp(14px,0.95vw,16px)] leading-[1.65] text-[var(--muted)]"
          data-r="meta"
        >
          {w.body}
        </p>
      </div>
    </div>
  );
}

export function ProblemSystem() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 900px) and (min-height: 520px)").matches
  );
  const [inspect, setInspect] = useState<CardId | null>(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReduced), []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px) and (min-height: 520px)");
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
/* Desktop — 2-column composition, 6.0s cinematic animation sequence   */
/* ================================================================== */
function ProblemPinned({ inspect, onInspect, reduced }: ProblemProps) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sceneContentRef = useRef<HTMLDivElement>(null);
  const counterCol = useRef<HTMLSpanElement>(null);
  const counterUnit = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const lineBRef = useRef<HTMLHeadingElement>(null);
  const connectionUnderlineRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const sec = root.current;
    const st = stage.current;
    if (!sec || !st) return;

    const reduce = reduced || prefersReducedMotion();
    if (reduce) {
      // Completed, stable state for reduced motion
      const cardWeb = st.querySelector<HTMLElement>('[data-card="web"]');
      const cardEmail = st.querySelector<HTMLElement>('[data-card="email"]');
      const cardCrm = st.querySelector<HTMLElement>('[data-card="crm"]');
      const cardSheet = st.querySelector<HTMLElement>('[data-card="sheet"]');
      if (cardWeb) gsap.set(cardWeb, { x: 0, y: -12, rotation: 0, opacity: 0.88 });
      if (cardEmail) gsap.set(cardEmail, { x: 0, y: -12, rotation: 0, opacity: 0.88 });
      if (cardCrm) gsap.set(cardCrm, { x: 0, y: 12, rotation: 0, opacity: 0.88 });
      if (cardSheet) {
        cardSheet.setAttribute("data-flip", "1");
        gsap.set(cardSheet, { x: 0, y: 12, rotation: 0, opacity: 0.88 });
      }
      const solidConns = Array.from(st.querySelectorAll<SVGPathElement>(".pf-solid-conn"));
      gsap.set(solidConns, { drawSVG: "100%", opacity: 0.25 });
      if (counterCol.current) gsap.set(counterCol.current, { y: "-3.6em" });
      if (counterUnit.current) counterUnit.current.textContent = "connections";
      if (stateRef.current) {
        stateRef.current.textContent = "ONE SYSTEM";
        stateRef.current.style.color = "var(--accent-ink)";
      }
      if (lineBRef.current) gsap.set(lineBRef.current, { color: "var(--fg)" });
      if (connectionUnderlineRef.current) gsap.set(connectionUnderlineRef.current, { scaleX: 1 });
      const statusBs = Array.from(st.querySelectorAll<HTMLElement>(".pf-status-b"));
      const statusAs = Array.from(st.querySelectorAll<HTMLElement>(".pf-status-a"));
      gsap.set(statusAs, { opacity: 0 });
      gsap.set(statusBs, { opacity: 1 });
      const procContainer = st.querySelector<HTMLElement>(".pf-proc-lane");
      if (procContainer) gsap.set(procContainer, { opacity: 1 });
      const processStages = Array.from(st.querySelectorAll<HTMLElement>(".pf-proc-stage"));
      gsap.set(processStages, { opacity: 1, color: "var(--fg)", fontWeight: "600" });
      const compactAnchors = Array.from(st.querySelectorAll<HTMLElement>(".pf-compact-anchor"));
      gsap.set(compactAnchors, { opacity: 1 });
      return;
    }

    const cardWeb = st.querySelector<HTMLElement>('[data-card="web"]')!;
    const cardEmail = st.querySelector<HTMLElement>('[data-card="email"]')!;
    const cardCrm = st.querySelector<HTMLElement>('[data-card="crm"]')!;
    const cardSheet = st.querySelector<HTMLElement>('[data-card="sheet"]')!;
    const cardEls = [cardWeb, cardEmail, cardCrm, cardSheet];

    const brokenConns = Array.from(st.querySelectorAll<SVGPathElement>(".pf-broken-conn"));
    const solidConns = Array.from(st.querySelectorAll<SVGPathElement>(".pf-solid-conn"));

    const dotWeb = cardWeb.querySelector<HTMLElement>(".pf-dot")!;
    const dotEmail = cardEmail.querySelector<HTMLElement>(".pf-dot")!;
    const dotCrm = cardCrm.querySelector<HTMLElement>(".pf-dot")!;
    const dotSheet = cardSheet.querySelector<HTMLElement>(".pf-dot")!;

    const statusWebA = cardWeb.querySelector<HTMLElement>(".pf-status-a");
    const statusWebB = cardWeb.querySelector<HTMLElement>(".pf-status-b");
    const statusEmailA = cardEmail.querySelector<HTMLElement>(".pf-status-a");
    const statusEmailB = cardEmail.querySelector<HTMLElement>(".pf-status-b");
    const statusCrmA = cardCrm.querySelector<HTMLElement>(".pf-status-a");
    const statusCrmB = cardCrm.querySelector<HTMLElement>(".pf-status-b");
    const statusSheetA = cardSheet.querySelector<HTMLElement>(".pf-status-a");
    const statusSheetB = cardSheet.querySelector<HTMLElement>(".pf-status-b");
    const sheetTag = cardSheet.querySelector<HTMLElement>(".pf-tag");

    const webActionBadge = cardWeb.querySelector<HTMLElement>(".pf-web-action");
    const emailMetaBadge = cardEmail.querySelector<HTMLElement>(".pf-email-meta");
    const crmOwnerBadge = cardCrm.querySelector<HTMLElement>(".pf-crm-owner");
    const sheetSyncBadge = cardSheet.querySelector<HTMLElement>(".pf-sheet-sync");

    const procContainer = st.querySelector<HTMLElement>(".pf-proc-lane");
    const procStages = Array.from(st.querySelectorAll<HTMLElement>(".pf-proc-stage"));
    const procConns = Array.from(st.querySelectorAll<SVGLineElement>(".pf-proc-line"));
    const procMarkers = Array.from(st.querySelectorAll<SVGRectElement>(".pf-proc-marker"));
    const compactAnchors = Array.from(st.querySelectorAll<HTMLElement>(".pf-compact-anchor"));
    const connectionCompletionTimes = [2.55, 2.73, 2.91];
    let masterTl: gsap.core.Timeline | null = null;
    const syncConnectionCounter = () => {
      const connectionCount = connectionCompletionTimes.filter((time) => (masterTl?.time() ?? 0) >= time).length;
      if (counterUnit.current) {
        counterUnit.current.textContent = connectionCount === 1 ? "connection" : "connections";
      }
    };

    // Initial setup:
    // ACT 1 initial spatial offsets with distinct entrance personalities
    gsap.set(cardWeb, { x: -32, y: -22, rotation: -3.5, opacity: 0.7, scale: 0.95 });
    gsap.set(cardEmail, { x: 30, y: -18, rotation: 3.0, opacity: 0.7, scale: 0.95 });
    gsap.set(cardCrm, { x: -26, y: 24, rotation: 2.2, opacity: 0.7, scale: 0.95 });
    gsap.set(cardSheet, { x: 32, y: 20, rotation: -2.8, opacity: 0.7, scale: 0.95 });

    gsap.set(solidConns, { drawSVG: "0%", opacity: 1 });
    gsap.set(brokenConns, { opacity: 0.35 });
    gsap.set([statusWebB, statusEmailB, statusCrmB, statusSheetB], { opacity: 0 });
    gsap.set(connectionUnderlineRef.current, { scaleX: 0 });
    gsap.set(procContainer, { opacity: 0 });
    gsap.set(procConns, { drawSVG: "0%" });
    gsap.set(procMarkers, { opacity: 0 });
    gsap.set(compactAnchors, { opacity: 0 });

    const ctx = gsap.context(() => {
      // Headline line reveal on section entry
      gsap.fromTo(
        ".pf-head-line",
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.10,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sec,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // MAIN 6.0s MASTER TIMELINE
      masterTl = gsap.timeline({
        onUpdate: syncConnectionCounter,
        scrollTrigger: {
          id: "problem-pin",
          trigger: sec,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (stateRef.current) {
              if (self.progress < 0.80) {
                stateRef.current.textContent = "Disconnected";
                stateRef.current.style.color = "var(--faint)";
              } else {
                stateRef.current.textContent = "ONE SYSTEM";
                stateRef.current.style.color = "var(--accent-ink)";
              }
            }
          },
        },
      });
      syncConnectionCounter();

      // -------------------------------------------------------------
      // ACT 1 — THE FRAGMENTED ECOSYSTEM (0.0s – 1.0s)
      // The 4 distinct miniature software environments enter the visual
      // stage, settling into visibly separated, uncoordinated positions.
      // -------------------------------------------------------------
      masterTl.to(
        [cardWeb, cardEmail, cardCrm, cardSheet],
        {
          x: 0,
          y: 0,
          rotation: (i) => (i === 0 ? -1.5 : i === 1 ? 1.5 : i === 2 ? 1.2 : -1.2),
          opacity: 1,
          scale: 1,
          duration: 0.85,
          stagger: 0.08,
          ease: "power3.out",
        },
        0.05
      );

      masterTl.fromTo(
        brokenConns,
        { opacity: 0, scale: 0.95 },
        { opacity: 0.45, scale: 1, duration: 0.6, ease: "power2.out", stagger: 0.08 },
        0.20
      );

      // -------------------------------------------------------------
      // ACT 2 — THE CONNECTION FAILURE (1.0s – 2.1s)
      // An inquiry lands at the Website. It tries to hand off to the rest
      // of the business, but the tools are isolated silos.
      // -------------------------------------------------------------
      // Broken connectors asynchronous tension pulse
      masterTl.to(brokenConns[0], { opacity: 0.8, stroke: "var(--muted)", duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.10);
      masterTl.to(brokenConns[1], { opacity: 0.8, stroke: "var(--muted)", duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.30);
      masterTl.to(brokenConns[2], { opacity: 0.8, stroke: "var(--muted)", duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.50);

      // 1. Website: Inbound inquiry triggers capture
      if (statusWebA && statusWebB) {
        masterTl.to(statusWebA, { opacity: 0, duration: 0.15, ease: "power2.in" }, 1.05);
        masterTl.to(statusWebB, { opacity: 1, duration: 0.20, ease: "power2.out" }, 1.20);
        masterTl.to(cardWeb, { borderColor: "var(--accent)", boxShadow: "0 0 18px -2px color-mix(in srgb, var(--accent) 35%, transparent)", duration: 0.15 }, 1.05);
        masterTl.to(dotWeb, { backgroundColor: "var(--accent)", boxShadow: "0 0 10px 2px color-mix(in srgb, var(--accent) 70%, transparent)", duration: 0.15 }, 1.05);
        if (webActionBadge) {
          masterTl.to(webActionBadge, { textContent: "✓ CAPTURED", color: "var(--accent-ink)", duration: 0.15 }, 1.10);
        }
      }

      // 2. Email: Delayed, uncoordinated arrival
      if (statusEmailA && statusEmailB) {
        masterTl.to(statusEmailA, { opacity: 0, duration: 0.15, ease: "power2.in" }, 1.25);
        masterTl.to(statusEmailB, { opacity: 1, duration: 0.20, ease: "power2.out" }, 1.40);
        if (emailMetaBadge) {
          masterTl.to(emailMetaBadge, { textContent: "MANUAL FORWARD", color: "var(--muted)", duration: 0.15 }, 1.35);
        }
      }

      // 3. CRM: Orphaned record created with delay
      if (statusCrmA && statusCrmB) {
        masterTl.to(statusCrmA, { opacity: 0, duration: 0.15, ease: "power2.in" }, 1.45);
        masterTl.to(statusCrmB, { opacity: 1, duration: 0.20, ease: "power2.out" }, 1.60);
        if (crmOwnerBadge) {
          masterTl.to(crmOwnerBadge, { textContent: "UNASSIGNED", color: "var(--muted)", duration: 0.15 }, 1.55);
        }
      }

      // 4. Sheet: Out of sync row update
      masterTl.set(cardSheet, { attr: { "data-flip": "1" } }, 1.65);
      if (statusSheetA && statusSheetB) {
        masterTl.to(statusSheetA, { opacity: 0, duration: 0.15, ease: "power2.in" }, 1.65);
        masterTl.to(statusSheetB, { opacity: 1, duration: 0.20, ease: "power2.out" }, 1.80);
        if (sheetSyncBadge) {
          masterTl.to(sheetSyncBadge, { textContent: "DESYNCED", color: "var(--muted)", duration: 0.15 }, 1.75);
        }
      }

      // -------------------------------------------------------------
      // ACT 3 — THE BREAKDOWN & RECONNECTION (2.1s – 3.4s)
      // The breakdown transitions into Arche's precision infrastructure.
      // Solid lime connectors draw in sequence; tools pulse as they connect.
      // Counter increments synchronously: 0 -> 1 -> 2 -> 3.
      // -------------------------------------------------------------
      // Connection 1: Website -> Email
      masterTl.to(solidConns[0], { drawSVG: "100%", duration: 0.55, ease: "power2.inOut" }, 2.00);
      masterTl.to(brokenConns[0], { opacity: 0, duration: 0.3 }, 2.10);

      masterTl.to([cardWeb, cardEmail], {
        borderColor: "var(--accent)",
        boxShadow: "0 0 16px -2px color-mix(in srgb, var(--accent) 35%, transparent)",
        duration: 0.2,
      }, 2.50);
      masterTl.to([dotWeb, dotEmail], {
        backgroundColor: "var(--accent)",
        boxShadow: "0 0 10px 2px color-mix(in srgb, var(--accent) 70%, transparent)",
        duration: 0.2,
      }, 2.50);
      masterTl.to([cardWeb, cardEmail], {
        scale: 1.015,
        duration: 0.10,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      }, 2.52);

      // Counter roll 0 -> 1
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: "-1.2em", duration: 0.12, ease: "power2.inOut" }, 2.55);
      }

      // Connection 2: Website -> CRM
      masterTl.to(solidConns[1], { drawSVG: "100%", duration: 0.55, ease: "power2.inOut" }, 2.18);
      masterTl.to(brokenConns[1], { opacity: 0, duration: 0.3 }, 2.28);

      masterTl.to(cardCrm, {
        borderColor: "var(--accent)",
        boxShadow: "0 0 16px -2px color-mix(in srgb, var(--accent) 35%, transparent)",
        duration: 0.2,
      }, 2.70);
      masterTl.to(dotCrm, {
        backgroundColor: "var(--accent)",
        boxShadow: "0 0 10px 2px color-mix(in srgb, var(--accent) 70%, transparent)",
        duration: 0.2,
      }, 2.70);
      masterTl.to(cardCrm, {
        scale: 1.015,
        duration: 0.10,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      }, 2.72);

      // Counter roll 1 -> 2
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: "-2.4em", duration: 0.12, ease: "power2.inOut" }, 2.73);
      }

      // Connection 3: CRM -> Sheet
      masterTl.to(solidConns[2], { drawSVG: "100%", duration: 0.55, ease: "power2.inOut" }, 2.36);
      masterTl.to(brokenConns[2], { opacity: 0, duration: 0.3 }, 2.46);

      if (sheetTag) {
        masterTl.to(sheetTag, { color: "var(--accent-ink)", duration: 0.15 }, 2.88);
      }
      masterTl.to(cardSheet, {
        borderColor: "var(--accent)",
        boxShadow: "0 0 16px -2px color-mix(in srgb, var(--accent) 35%, transparent)",
        duration: 0.2,
      }, 2.88);
      masterTl.to(dotSheet, {
        backgroundColor: "var(--accent)",
        boxShadow: "0 0 10px 2px color-mix(in srgb, var(--accent) 70%, transparent)",
        duration: 0.2,
      }, 2.88);
      masterTl.to(cardSheet, {
        scale: 1.015,
        duration: 0.10,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      }, 2.90);

      // Counter roll 2 -> 3
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: "-3.6em", duration: 0.12, ease: "power2.inOut" }, 2.91);
      }

      // -------------------------------------------------------------
      // ACT 4 — ARCHÉ CONNECTS THE SYSTEM (3.4s – 4.8s)
      // Spatial reorganization: cards straighten to 0deg, glide vertically
      // to establish a dedicated 55px visual corridor.
      // Central unified pipeline reveals: WEBSITE -> AI AGENT -> QUALIFIED LEAD -> CRM.
      // Precision marker travels across pipeline, activating each operational stage.
      // -------------------------------------------------------------
      masterTl.to(cardEls, { opacity: 0.88, rotation: 0, duration: 0.35, ease: "power2.out" }, 3.50);
      masterTl.to([cardWeb, cardEmail], { y: -12, duration: 0.40, ease: "power2.out" }, 3.50);
      masterTl.to([cardCrm, cardSheet], { y: 12, duration: 0.40, ease: "power2.out" }, 3.50);
      masterTl.to(solidConns, { opacity: 0.25, duration: 0.35, ease: "power2.out" }, 3.50);
      masterTl.to(procContainer, { opacity: 1, duration: 0.35, ease: "power2.out" }, 3.50);

      // Internal environments reflow to connected states
      if (emailMetaBadge) {
        masterTl.to(emailMetaBadge, { textContent: "AI ROUTED", color: "var(--accent-ink)", duration: 0.2 }, 3.60);
      }
      if (crmOwnerBadge) {
        masterTl.to(crmOwnerBadge, { textContent: "ALEX R. (AI DISPATCH)", color: "var(--accent-ink)", duration: 0.2 }, 3.70);
      }
      if (sheetSyncBadge) {
        masterTl.to(sheetSyncBadge, { textContent: "DUAL-SYNC ACTIVE", color: "var(--accent-ink)", duration: 0.2 }, 3.80);
      }

      // Stage 1: WEBSITE active
      masterTl.to(procStages[0], { color: "var(--fg)", fontWeight: "600", duration: 0.15 }, 3.50);

      // Connector 1 draws & Marker 1 travels (Website -> AI Agent)
      masterTl.to(procConns[0], { drawSVG: "100%", duration: 0.35, ease: "power1.inOut" }, 3.55);
      if (procMarkers[0]) {
        masterTl.fromTo(
          procMarkers[0],
          { attr: { x: 92 }, opacity: 0 },
          { attr: { x: 104 }, opacity: 1, duration: 0.35, ease: "power1.inOut" },
          3.55
        );
        masterTl.to(procMarkers[0], { opacity: 0, duration: 0.1 }, 3.90);
      }

      // Stage 2: AI AGENT activates
      masterTl.to(procStages[1], { color: "var(--fg)", fontWeight: "600", duration: 0.15 }, 3.90);
      masterTl.to(procStages[1].querySelector(".pf-proc-dot"), { backgroundColor: "var(--accent)", duration: 0.15 }, 3.90);

      // Connector 2 draws & Marker 2 travels (AI Agent -> Qualified Lead)
      masterTl.to(procConns[1], { drawSVG: "100%", duration: 0.35, ease: "power1.inOut" }, 3.95);
      if (procMarkers[1]) {
        masterTl.fromTo(
          procMarkers[1],
          { attr: { x: 146 }, opacity: 0 },
          { attr: { x: 206 }, opacity: 1, duration: 0.35, ease: "power1.inOut" },
          3.95
        );
        masterTl.to(procMarkers[1], { opacity: 0, duration: 0.1 }, 4.30);
      }

      // Stage 3: QUALIFIED LEAD activates
      masterTl.to(procStages[2], { color: "var(--fg)", fontWeight: "600", duration: 0.15 }, 4.30);
      masterTl.to(procStages[2].querySelector(".pf-proc-dot"), { backgroundColor: "var(--accent)", duration: 0.15 }, 4.30);

      // Connector 3 draws & Marker 3 travels (Qualified Lead -> CRM)
      masterTl.to(procConns[2], { drawSVG: "100%", duration: 0.35, ease: "power1.inOut" }, 4.35);
      if (procMarkers[2]) {
        masterTl.fromTo(
          procMarkers[2],
          { attr: { x: 285 }, opacity: 0 },
          { attr: { x: 340 }, opacity: 1, duration: 0.35, ease: "power1.inOut" },
          4.35
        );
        masterTl.to(procMarkers[2], { opacity: 0, duration: 0.1 }, 4.70);
      }

      // Stage 4: CRM activates
      masterTl.to(procStages[3], { color: "var(--fg)", fontWeight: "600", duration: 0.15 }, 4.70);
      masterTl.to(procStages[3].querySelector(".pf-proc-dot"), { backgroundColor: "var(--accent)", duration: 0.15 }, 4.70);

      // Headline Line B turns ink, underline sweeps across "connection problem."
      if (lineBRef.current) {
        masterTl.to(lineBRef.current, { color: "var(--fg)", duration: 0.18, ease: "power2.out" }, 4.50);
      }
      if (connectionUnderlineRef.current) {
        masterTl.to(connectionUnderlineRef.current, { scaleX: 1, duration: 0.22, ease: "power2.out" }, 4.52);
      }

      // -------------------------------------------------------------
      // ACT 5 — ONE SYSTEM (4.8s – 6.0s)
      // Compact anchors activate, stable hold before pin releases to Services.
      // -------------------------------------------------------------
      masterTl.to(compactAnchors, { opacity: 1, duration: 0.10 }, 4.80);
      masterTl.call(() => emitThread(), [], 5.00);

      // Quiet hold until pin releases cleanly into Services
      masterTl.to({}, { duration: 0.90 }, 5.10);
    }, sec);

    return () => {
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={root}
      id="problem"
      data-bridge-root
      className="relative w-full bg-[var(--bg)] min-h-[100svh]"
    >
      <style>{`
        #problem .pf-card-hover {
          will-change: transform, border-color, box-shadow;
          transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
                      border-color 0.22s ease,
                      box-shadow 0.22s ease;
        }
        @media (hover: hover) {
          #problem .pf-card-hover:hover {
            transform: translateY(-4px);
            border-color: var(--accent) !important;
            box-shadow: 0 8px 24px -4px rgba(12, 12, 13, 0.10), 0 0 16px -2px color-mix(in srgb, var(--accent) 30%, transparent) !important;
          }
          #problem .pf-card-hover:hover .pf-dot {
            transform: scale(1.25);
            box-shadow: 0 0 8px 1px var(--accent);
          }
        }
        #problem .pf-dot {
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
        }
      `}</style>

      <div
        ref={sceneContentRef}
        className="pf-scene-content wrap w-full min-h-[100svh] flex flex-col justify-center py-[clamp(32px,5vh,64px)]"
      >
        <div className="grid w-full grid-cols-12 items-center gap-[clamp(24px,3.5vw,56px)]">
          {/* LEFT COLUMN: 50% (6 of 12 columns) - Art-directed editorial statement */}
          <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
            <Copy
              connectionUnderlineRef={connectionUnderlineRef}
              lineBRef={lineBRef}
              bodyRef={bodyRef}
            />
          </div>

          {/* RIGHT COLUMN: 50% (6 of 12 columns) - Miniature software ecosystem */}
          <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
            <div className="w-full max-w-[620px] ml-auto">
              {/* Header status bar */}
              <div className="mb-[12px] flex items-center justify-between">
                <div className="mono flex items-center gap-[0.5ch] text-[12px]">
                  <span>4 tools ·</span>
                  <span
                    className="inline-block overflow-hidden relative"
                    style={{ height: "1.2em", width: "1ch", verticalAlign: "top" }}
                  >
                    <span
                      ref={counterCol}
                      data-counter-column
                      className="inline-flex flex-col text-center"
                      style={{ willChange: "transform" }}
                    >
                      <span style={{ height: "1.2em", lineHeight: "1.2em" }}>0</span>
                      <span style={{ height: "1.2em", lineHeight: "1.2em" }}>1</span>
                      <span style={{ height: "1.2em", lineHeight: "1.2em" }}>2</span>
                      <span style={{ height: "1.2em", lineHeight: "1.2em" }}>3</span>
                    </span>
                  </span>
                  <span ref={counterUnit} data-counter-unit>connections</span>
                </div>
                <span
                  ref={stateRef}
                  data-problem-state
                  className="mono transition-colors text-[11px] uppercase tracking-wider font-medium"
                  style={{ color: "var(--faint)" }}
                >
                  Disconnected
                </span>
              </div>

              {/* Visual Container: Contained operational-system visualization */}
              <div
                ref={stage}
                className="pf-visual-container relative w-full rounded-[8px] border border-[var(--line)] bg-[var(--bg-2)]"
                style={{
                  minHeight: "420px",
                  height: "clamp(410px, 47vh, 450px)",
                  boxShadow: "0 2px 20px -4px rgba(0,0,0,0.03)",
                }}
              >
                {/* SVG Connectors Overlay */}
                <svg
                  viewBox="0 0 400 340"
                  className="absolute inset-0 h-full w-full pointer-events-none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  {/* Subtle architectural drafting axis */}
                  <g opacity="0.30">
                    <line x1="200" y1="24" x2="200" y2="316" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1="24" y1="170" x2="376" y2="170" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="3 3" />
                    <circle cx="200" cy="170" r="2.5" fill="none" stroke="var(--line)" strokeWidth="0.8" />
                  </g>
                  {/* Broken connector hairlines in Act 1 */}
                  <g className="pf-broken-conns">
                    {/* Con 1: Website to Email (horizontal top) */}
                    <path
                      className="pf-broken-conn"
                      d="M 175 80 H 225"
                      stroke="var(--line)"
                      strokeWidth="1.2"
                      strokeDasharray="4 5"
                      fill="none"
                    />
                    {/* Con 2: Website to CRM (vertical left) */}
                    <path
                      className="pf-broken-conn"
                      d="M 100 130 V 215"
                      stroke="var(--line)"
                      strokeWidth="1.2"
                      strokeDasharray="4 5"
                      fill="none"
                    />
                    {/* Con 3: CRM to Sheet (horizontal bottom) */}
                    <path
                      className="pf-broken-conn"
                      d="M 175 265 H 225"
                      stroke="var(--line)"
                      strokeWidth="1.2"
                      strokeDasharray="4 5"
                      fill="none"
                    />
                  </g>

                  {/* Solid lime connectors drawn in Act 3 */}
                  <g className="pf-solid-conns">
                    {/* Con 1: Website toward Email */}
                    <path
                      className="pf-solid-conn"
                      d="M 175 80 H 225"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Con 2: Website toward CRM */}
                    <path
                      className="pf-solid-conn"
                      d="M 100 130 V 215"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Con 3: CRM toward Sheet */}
                    <path
                      className="pf-solid-conn"
                      d="M 175 265 H 225"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>

                  {/* Test selector path */}
                  <path
                    id="problem-diagram-line"
                    className="pf-row opacity-0"
                    d="M 50 170 H 350"
                    stroke="var(--accent)"
                  />
                </svg>

                {/* 2 × 2 Card Grid with a dedicated process channel between rows */}
                <div className="absolute inset-0 z-10 grid grid-cols-2 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-[clamp(24px,4vw,48px)] px-[clamp(14px,2vw,22px)]">
                  {CARDS.map((c) => (
                    <div
                      key={c.id}
                      data-card={c.id}
                      className="pf-card"
                      style={{
                        gridColumn: c.gridClass.endsWith("left") ? 1 : 2,
                        gridRow: c.gridClass.startsWith("top") ? 1 : 3,
                      }}
                    >
                      <div
                        className="pf-card-hover pf-inspect flex flex-col rounded-[6px] border border-[var(--line)] bg-[var(--card)] p-[clamp(10px,1.2vw,14px)] shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer"
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
                        {/* 1. Distinct Miniature Interface Top Chrome */}
                        {c.id === "web" ? (
                          <div className="flex items-center justify-between border-b border-[var(--line)] pb-[5px] mb-[6px]">
                            <div className="flex items-center gap-[3px]">
                              <span className="block h-[4.5px] w-[4.5px] rounded-full bg-[var(--line)]" />
                              <span className="block h-[4.5px] w-[4.5px] rounded-full bg-[var(--line)]" />
                              <span className="block h-[4.5px] w-[4.5px] rounded-full bg-[var(--line)]" />
                            </div>
                            <span className="mono text-[8px] text-[var(--faint)] bg-[var(--bg)] px-[6px] py-[1px] rounded-[3px] truncate max-w-[130px]">
                              arche.studio/inquiry
                            </span>
                            <span
                              className="pf-dot relative block flex-none rounded-full"
                              style={{ width: 7, height: 7, background: "var(--faint)" }}
                              data-signal="problem-website"
                            />
                          </div>
                        ) : c.id === "email" ? (
                          <div className="flex items-center justify-between border-b border-[var(--line)] pb-[5px] mb-[6px]">
                            <span className="mono text-[8px] uppercase tracking-wider text-[var(--faint)] font-medium">
                              INBOX (1)
                            </span>
                            <span className="mono text-[8px] text-[var(--faint)]">10:42 AM</span>
                            <span
                              className="pf-dot relative block flex-none rounded-full"
                              style={{ width: 7, height: 7, background: "var(--faint)" }}
                            />
                          </div>
                        ) : c.id === "crm" ? (
                          <div className="flex items-center justify-between border-b border-[var(--line)] pb-[5px] mb-[6px]">
                            <span className="mono text-[8px] uppercase tracking-wider text-[var(--faint)] font-medium">
                              LEAD #2048
                            </span>
                            <span className="mono text-[7.5px] text-[var(--accent-ink)] bg-[var(--accent)]/20 px-[4px] py-[1px] rounded-[2px] font-medium">
                              QUALIFYING
                            </span>
                            <span
                              className="pf-dot relative block flex-none rounded-full"
                              style={{ width: 7, height: 7, background: "var(--faint)" }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between border-b border-[var(--line)] pb-[5px] mb-[6px]">
                            <span className="mono text-[8px] uppercase tracking-wider text-[var(--faint)] font-medium">
                              PIPELINE.CSV
                            </span>
                            <span className="mono text-[8px] text-[var(--faint)]">ROW 142</span>
                            <span
                              className="pf-dot relative block flex-none rounded-full"
                              style={{ width: 7, height: 7, background: "var(--faint)" }}
                            />
                          </div>
                        )}

                        {/* 2. Tool Title & Miniature UI Context */}
                        <div className="flex items-center justify-between gap-[6px]">
                          <span className="mono text-[10px] uppercase tracking-wider text-[var(--faint)] font-medium">
                            {c.k}
                          </span>
                          {c.id === "web" && (
                            <span className="pf-web-action mono text-[8px] text-[var(--faint)] font-medium">
                              [SUBMIT]
                            </span>
                          )}
                          {c.id === "email" && (
                            <span className="pf-email-meta mono text-[8px] text-[var(--faint)]">
                              inquiry@acmecorp.com
                            </span>
                          )}
                          {c.id === "crm" && (
                            <span className="pf-crm-owner mono text-[8px] text-[var(--faint)]">
                              $24,000 · High Intent
                            </span>
                          )}
                          {c.id === "sheet" && (
                            <span className="pf-sheet-sync mono text-[8px] text-[var(--faint)]">
                              Auto-sync row
                            </span>
                          )}
                        </div>

                        {/* 3. Status Line with masked in-situ swap */}
                        <div className="relative mt-[4px] h-[1.3em] overflow-hidden text-[clamp(12px,1.05vw,14px)] font-medium tracking-tight">
                          <span
                            className={`pf-status-a ${
                              c.id === "web"
                                ? "pf-web-val-a"
                                : c.id === "email"
                                ? "pf-email-val-a"
                                : c.id === "crm"
                                ? "pf-crm-val-a"
                                : "pf-sheet-val-a"
                            } block absolute inset-0 text-[var(--muted)]`}
                          >
                            {c.a}
                          </span>
                          <span
                            className={`pf-status-b ${
                              c.id === "web"
                                ? "pf-web-val-b"
                                : c.id === "email"
                                ? "pf-email-val-b"
                                : c.id === "crm"
                                ? "pf-crm-val-b"
                                : "pf-sheet-val-b"
                            } block absolute inset-0 text-[var(--fg)]`}
                          >
                            {c.b}
                          </span>
                        </div>

                        {/* 4. Status indicator tag */}
                        <span className="pf-tag mono mt-[3px] block text-[9px] text-[var(--faint)]">
                          {c.tag}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* ACT 4: Central Horizontal 4-Stage Process (WEBSITE -> AI AGENT -> QUALIFIED LEAD -> CRM) */}
                  <div className="pf-proc-lane pointer-events-none relative col-span-2 row-start-2 z-20 w-full">
                    <div className="relative rounded-[6px] border border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md p-[8px_14px] shadow-sm">
                      <div className="relative z-10 flex items-center justify-between text-[10px] mono uppercase tracking-wider text-[var(--faint)]">
                        {["WEBSITE", "AI AGENT", "QUALIFIED LEAD", "CRM"].map((label, idx) => (
                          <div
                            key={label}
                            className="pf-proc-stage flex items-center gap-[6px] transition-colors bg-[var(--bg)] px-[6px] py-[2px] rounded-[3px]"
                          >
                            <span
                              className="pf-proc-dot block rounded-full flex-none"
                              style={{ width: 5, height: 5, background: idx === 0 ? "var(--accent)" : "var(--faint)" }}
                            />
                            <span className="pf-target-label">{label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Horizontal process connector SVG with signal markers */}
                      <svg
                        viewBox="0 0 360 8"
                        className="absolute inset-0 z-0 h-full w-full pointer-events-none"
                        preserveAspectRatio="none"
                      >
                        {/* 3 thin connectors */}
                        <line className="pf-proc-line" x1="44" y1="4" x2="104" y2="4" stroke="var(--accent)" strokeWidth="1.2" />
                        <line className="pf-proc-line" x1="146" y1="4" x2="206" y2="4" stroke="var(--accent)" strokeWidth="1.2" />
                        <line className="pf-proc-line" x1="285" y1="4" x2="340" y2="4" stroke="var(--accent)" strokeWidth="1.2" />

                        {/* Small lime rectangular signal markers */}
                        <rect className="pf-proc-marker pf-proc-marker-0" x="44" y="2.5" width="6" height="3" fill="var(--accent)" rx="1" />
                        <rect className="pf-proc-marker pf-proc-marker-1" x="146" y="2.5" width="6" height="3" fill="var(--accent)" rx="1" />
                        <rect className="pf-proc-marker pf-proc-marker-2" x="285" y="2.5" width="6" height="3" fill="var(--accent)" rx="1" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Downstream verification & service slots */}
                <div id="problem-diagram" aria-hidden>
                  {CARDS.map((c) => (
                    <span
                      key={c.id}
                      data-cmp={c.k}
                      className="pf-compact-anchor pointer-events-none absolute block"
                      style={{
                        left: "50%",
                        top: "50%",
                        width: 0,
                        height: 0,
                        opacity: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Inspector panel beneath visual container */}
              <Inspector inspect={inspect} onInspect={onInspect} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Mobile — stacked, clean 2-second narrative sequence                 */
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
          start: "top 80%",
          once: true,
          onEnter: () => {
            resolve(el, true);
            const dot = el.querySelector<HTMLElement>(".pf-dot");
            if (dot) {
              dot.style.background = "var(--accent)";
              dot.style.boxShadow = "0 0 8px 1px var(--accent)";
            }
            const a = el.querySelector<HTMLElement>(".pf-a");
            const b = el.querySelector<HTMLElement>(".pf-b");
            if (a && b) {
              gsap.to(a, { opacity: 0, duration: 0.2 });
              gsap.to(b, { opacity: 1, duration: 0.25 });
            }
          },
        });
      });
    }, sec);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} id="problem" className="relative w-full py-[clamp(48px,8vw,80px)] bg-[var(--bg)]">
      <div className="wrap flex flex-col gap-[clamp(24px,4vh,40px)]">
        <Copy />
        <div className="pf-beat flex flex-col">
          {MOBILE_ORDER.map((id, i) => {
            const c = CARDS.find((x) => x.id === id)!;
            return (
              <div key={id} className="pfm-item" data-done="0" data-sync="0" data-flip="0">
                {i > 0 && (
                  <span className="relative ml-[22px] block h-[24px] w-px" style={{ background: "var(--line)" }} aria-hidden>
                    <span className="pfm-seg absolute inset-0" style={{ background: "var(--accent-deep)" }} />
                  </span>
                )}
                <div
                  data-card={c.id}
                  className="pf-card pf-inspect flex flex-col rounded-[6px] border border-[var(--line)] bg-[var(--card)] p-[14px]"
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
                  <div className="flex items-center justify-between gap-[10px] border-b border-[var(--line)] pb-[5px] mb-[6px]">
                    <span className="mono text-[9px] uppercase tracking-wider text-[var(--faint)] font-medium">
                      {c.k === "Website" ? "WEBSITE · INBOUND" : c.k === "Email" ? "INBOX (1) · 10:42 AM" : c.k === "CRM" ? "LEAD #2048 · QUALIFYING" : "PIPELINE.CSV · ROW 142"}
                    </span>
                    <span
                      className="pf-dot relative block flex-none rounded-full"
                      style={{ width: 8, height: 8, background: "var(--faint)" }}
                      {...(i === 0 ? { "data-signal": "problem-website" } : {})}
                    />
                  </div>
                  <span className="pf-flip mt-[4px] text-[14px] font-medium tracking-tight">
                    <span className="pf-a">{c.a}</span>
                    {c.b && <span className="pf-b">{c.b}</span>}
                  </span>
                  <span className="pf-tag mono mt-[4px] block text-[9px] text-[var(--faint)]">
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
