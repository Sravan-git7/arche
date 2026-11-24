import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteContent } from "../data/site";
import { gsap, ScrollTrigger, onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";
import { emitThread } from "../lib/threadBus";

/**
 * ARCHÉ — PROBLEM SECTION 2.0: CINEMATIC SYSTEM TRANSFORMATION
 *
 * Visual & Motion Architecture:
 * - Editorial Headline Composition: Art-directed line-breaking, comfortable reading rhythm,
 *   tightened typography (-0.035em tracking, 1.0 line-height), with selective #9EE41A lime
 *   underline spanning "connection problem."
 * - 4 Authentic Miniature Software Environments:
 *   1. WEBSITE: Browser frame, URL chrome, form fields ("Acme Corp", "System Architecture"), submit state.
 *   2. EMAIL: Inbox client, subject, sender ("client@acmecorp.com"), message preview, unread/read state.
 *   3. CRM: Deal record #2048, stage badge, deal value ($24,000), unassigned -> assigned owner.
 *   4. SHEET: Spreadsheet data grid, column headers (ROW, COMPANY, STAGE, SYNC), dual-write sync state.
 * - Hardware Tactile Depth:
 *   - Recessed #EAE7DF tray with inner bevel and subtle drafting grid.
 *   - Directional bevels on all 4 tool cards (inset 0 1px 0 rgba(255,255,255,0.95), ambient drop shadow).
 *   - Baseline-aligned counter with tabular nums and exact pixel translation (zero jumping).
 *   - Clean dashed footer divider with inline micro-copy.
 *   - Phase 3 physical handoff spine drawing downward into Services' top-center spine.
 *
 * 5-Act Master Timeline (6.0s Scrubbed):
 * - ACT 01 (0.0s–1.0s): Spatial entrance of 4 software environments into subtly drifted, tilted positions.
 * - ACT 02 (1.0s–2.1s): Inquiry arrives at Website; asynchronous handoff friction, broken connectors pulse.
 * - ACT 03 (2.1s–3.4s): Climax of friction; precision lime connectors draw, counter rolls (0->1->2->3).
 * - ACT 04 (3.4s–4.8s): The Architectural Snap; cards lock rock-steady to 0°, central pipeline reveals:
 *                       WEBSITE ━━ AI AGENT ━━ QUALIFIED LEAD ━━ CRM.
 * - ACT 05 (4.8s–6.0s): ONE SYSTEM settled state; handoff spine draws downward to bottom edge for Services handoff.
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
    <div className="pf-inspector mt-[16px]" aria-live="polite">
      {c && d ? (
        <div className="rounded-[8px] border border-[#141413]/[0.10] bg-white p-[14px] shadow-[0_2px_8px_rgba(20,20,19,0.04)]">
          <div className="flex items-start justify-between gap-[12px]">
            <span className="mono text-[11.5px] font-semibold text-[#141413]">
              {c.k} — {d.role}
            </span>
            <button
              type="button"
              className="mono text-[11px] text-[#6E6D68] hover:text-[#141413] flex-none px-2 py-0.5 rounded border border-[#141413]/10 hover:border-[#141413]/25 transition-colors cursor-pointer"
              onClick={() => onInspect(null)}
              aria-label="Close tool inspection"
            >
              ✕ Close
            </button>
          </div>
          <p className="body-s mt-[8px] text-[12px] leading-relaxed text-[#6E6D68]">
            <span className="text-[#8E8E88]">Alone: </span>{d.friction}{" "}
            <span className="text-[#141413] font-medium">Connected: </span>{d.resolved}
          </p>
        </div>
      ) : (
        <div className="pt-[10px] border-t border-dashed border-[#141413]/[0.12] flex items-center justify-between text-[11px] mono text-[#8E8E88]">
          <span className="uppercase tracking-[0.14em] font-medium text-[#6E6D68]">
            Target state · conceptual model
          </span>
          <span className="text-[10.5px]">Click any tool to inspect. Escape closes.</span>
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
    <div className="flex flex-col w-full">
      {/* 1. Architectural Section Eyebrow */}
      <div className="flex items-center gap-[10px] mb-[clamp(16px,2vh,28px)]">
        <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#9EE41A] shadow-[0_0_6px_rgba(158,228,26,0.6)] animate-pulse" />
        <span className="mono text-[11px] uppercase tracking-[0.18em] text-[#141413] font-semibold">
          {w.label} · ARCHITECTURAL DIAGNOSIS
        </span>
      </div>

      {/* 2. Main statement: “Most businesses don't have a tool problem.” */}
      <div className="relative overflow-hidden">
        <h2 className="pf-head-line text-[clamp(36px,4.5vw,84px)] font-bold leading-[0.98] tracking-[-0.035em] text-[#141413]">
          <span>Most businesses</span>
          <br className="hidden sm:inline" />{" "}
          <span>don't have a tool problem.</span>
        </h2>
      </div>

      {/* 3. Secondary statement: “They have a connection problem.” */}
      <div className="mt-[clamp(24px,3.2vh,42px)] pl-[clamp(18px,2.2vw,32px)] border-l-2 border-[#141413]/12 relative">
        <span className="mono text-[10.5px] uppercase tracking-[0.20em] text-[#6E6D68] mb-[8px] block font-medium">
          THE STRUCTURAL DEFICIT //
        </span>

        <div className="overflow-hidden">
          <h2
            ref={lineBRef}
            className="pf-head-line text-[clamp(30px,4.0vw,74px)] font-bold leading-[1.0] tracking-[-0.035em] transition-colors duration-300"
            style={{ color: "#8E8E88" }}
          >
            <span className="block text-[clamp(16px,1.8vw,28px)] font-normal text-[#8E8E88] tracking-[-0.025em] leading-snug mb-[4px]">
              They have a
            </span>
            <span className="relative inline-block font-bold">
              connection problem.
              <span
                ref={connectionUnderlineRef}
                className="origin-left pointer-events-none absolute bottom-[-4px] left-0 h-[3.5px] w-full rounded-full"
                style={{
                  background: "#9EE41A",
                  transform: "scaleX(0)",
                  transformOrigin: "left center",
                  boxShadow: "0 0 10px rgba(158,228,26,0.6)",
                }}
                aria-hidden="true"
              />
            </span>
          </h2>
        </div>

        {/* 4. Supporting Narrative Paragraph with horizontal sweep */}
        <p
          ref={bodyRef}
          className="body mt-[clamp(20px,2.6vh,34px)] max-w-[46ch] !text-[clamp(15.5px,1.25vw,23px)] !leading-[1.58] text-[#6E6D68]"
          data-r="meta"
          style={{ willChange: "clip-path" }}
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
  const statusDotRef = useRef<HTMLSpanElement>(null);
  const lineBRef = useRef<HTMLHeadingElement>(null);
  const connectionUnderlineRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const handoffLineRef = useRef<HTMLSpanElement>(null);
  const handoffPulseRef = useRef<HTMLSpanElement>(null);

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
      if (cardWeb) gsap.set(cardWeb, { x: 0, y: -12, rotation: 0, opacity: 1 });
      if (cardEmail) gsap.set(cardEmail, { x: 0, y: -12, rotation: 0, opacity: 1 });
      if (cardCrm) gsap.set(cardCrm, { x: 0, y: 12, rotation: 0, opacity: 1 });
      if (cardSheet) {
        cardSheet.setAttribute("data-flip", "1");
        gsap.set(cardSheet, { x: 0, y: 12, rotation: 0, opacity: 1 });
      }
      const solidConns = Array.from(st.querySelectorAll<SVGPathElement>(".pf-solid-conn"));
      gsap.set(solidConns, { drawSVG: "100%", opacity: 0.25 });
      if (counterCol.current) gsap.set(counterCol.current, { y: -54 });
      if (counterUnit.current) counterUnit.current.textContent = "connections";
      if (stateRef.current) {
        stateRef.current.textContent = "ONE SYSTEM";
        stateRef.current.style.color = "#141413";
      }
      if (statusDotRef.current) {
        statusDotRef.current.style.background = "#9EE41A";
        statusDotRef.current.style.boxShadow = "0 0 8px #9EE41A";
      }
      if (lineBRef.current) gsap.set(lineBRef.current, { color: "#141413" });
      if (connectionUnderlineRef.current) gsap.set(connectionUnderlineRef.current, { scaleX: 1 });
      if (bodyRef.current) gsap.set(bodyRef.current, { clipPath: "inset(0 0% 0 0)" });
      const statusBs = Array.from(st.querySelectorAll<HTMLElement>(".pf-status-b"));
      const statusAs = Array.from(st.querySelectorAll<HTMLElement>(".pf-status-a"));
      gsap.set(statusAs, { opacity: 0 });
      gsap.set(statusBs, { opacity: 1 });
      const procContainer = st.querySelector<HTMLElement>(".pf-proc-lane");
      if (procContainer) gsap.set(procContainer, { opacity: 1 });
      const processStages = Array.from(st.querySelectorAll<HTMLElement>(".pf-proc-stage"));
      gsap.set(processStages, { opacity: 1, color: "#141413", fontWeight: "600" });
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
    // Subtle initial spatial drift & slight organic rotation
    gsap.set(cardWeb, { x: -12, y: -9, rotation: -2.0, opacity: 0.92, scale: 0.98 });
    gsap.set(cardEmail, { x: 11, y: -8, rotation: 1.8, opacity: 0.92, scale: 0.98 });
    gsap.set(cardCrm, { x: -10, y: 11, rotation: 1.6, opacity: 0.92, scale: 0.98 });
    gsap.set(cardSheet, { x: 12, y: 9, rotation: -1.8, opacity: 0.92, scale: 0.98 });

    gsap.set(solidConns, { drawSVG: "0%", opacity: 1 });
    gsap.set(brokenConns, { opacity: 0.35 });
    gsap.set([statusWebB, statusEmailB, statusCrmB, statusSheetB], { opacity: 0 });
    gsap.set(connectionUnderlineRef.current, { scaleX: 0 });
    if (bodyRef.current) gsap.set(bodyRef.current, { clipPath: "inset(0 100% 0 0)" });
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
                stateRef.current.style.color = "#6E6D68";
                if (statusDotRef.current) {
                  statusDotRef.current.style.background = "#A8A69E";
                  statusDotRef.current.style.boxShadow = "none";
                }
              } else {
                stateRef.current.textContent = "ONE SYSTEM";
                stateRef.current.style.color = "#141413";
                if (statusDotRef.current) {
                  statusDotRef.current.style.background = "#9EE41A";
                  statusDotRef.current.style.boxShadow = "0 0 8px #9EE41A";
                }
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
      masterTl.to(brokenConns[0], { opacity: 0.8, stroke: "#6E6D68", duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.10);
      masterTl.to(brokenConns[1], { opacity: 0.8, stroke: "#6E6D68", duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.30);
      masterTl.to(brokenConns[2], { opacity: 0.8, stroke: "#6E6D68", duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.50);

      // 1. Website: Inbound inquiry triggers capture
      if (statusWebA && statusWebB) {
        masterTl.to(statusWebA, { opacity: 0, duration: 0.15, ease: "power2.in" }, 1.05);
        masterTl.to(statusWebB, { opacity: 1, duration: 0.20, ease: "power2.out" }, 1.20);
        masterTl.to(cardWeb, { borderColor: "#9EE41A", boxShadow: "0 0 18px -2px rgba(158,228,26,0.35)", duration: 0.15 }, 1.05);
        masterTl.to(dotWeb, { backgroundColor: "#9EE41A", boxShadow: "0 0 10px 2px rgba(158,228,26,0.70)", duration: 0.15 }, 1.05);
        if (webActionBadge) {
          masterTl.to(webActionBadge, { textContent: "✓ CAPTURED", color: "#141413", duration: 0.15 }, 1.10);
        }
      }

      // 2. Email: Delayed, uncoordinated arrival
      if (statusEmailA && statusEmailB) {
        masterTl.to(statusEmailA, { opacity: 0, duration: 0.15, ease: "power2.in" }, 1.25);
        masterTl.to(statusEmailB, { opacity: 1, duration: 0.20, ease: "power2.out" }, 1.40);
        if (emailMetaBadge) {
          masterTl.to(emailMetaBadge, { textContent: "MANUAL FORWARD", color: "#8E8E88", duration: 0.15 }, 1.35);
        }
      }

      // 3. CRM: Orphaned record created with delay
      if (statusCrmA && statusCrmB) {
        masterTl.to(statusCrmA, { opacity: 0, duration: 0.15, ease: "power2.in" }, 1.45);
        masterTl.to(statusCrmB, { opacity: 1, duration: 0.20, ease: "power2.out" }, 1.60);
        if (crmOwnerBadge) {
          masterTl.to(crmOwnerBadge, { textContent: "UNASSIGNED", color: "#8E8E88", duration: 0.15 }, 1.55);
        }
      }

      // 4. Sheet: Out of sync row update
      masterTl.set(cardSheet, { attr: { "data-flip": "1" } }, 1.65);
      if (statusSheetA && statusSheetB) {
        masterTl.to(statusSheetA, { opacity: 0, duration: 0.15, ease: "power2.in" }, 1.65);
        masterTl.to(statusSheetB, { opacity: 1, duration: 0.20, ease: "power2.out" }, 1.80);
        if (sheetSyncBadge) {
          masterTl.to(sheetSyncBadge, { textContent: "DESYNCED", color: "#8E8E88", duration: 0.15 }, 1.75);
        }
      }

      // -------------------------------------------------------------
      // ACT 3 — THE BREAKDOWN & RECONNECTION (2.1s – 3.4s)
      // Precision lime connectors draw in sequence; tools pulse as they connect.
      // Counter increments synchronously: 0 -> 1 -> 2 -> 3.
      // -------------------------------------------------------------
      // Connection 1: Website -> Email
      masterTl.to(solidConns[0], { drawSVG: "100%", duration: 0.55, ease: "power2.inOut" }, 2.00);
      masterTl.to(brokenConns[0], { opacity: 0, duration: 0.3 }, 2.10);

      masterTl.to([cardWeb, cardEmail], {
        borderColor: "#9EE41A",
        boxShadow: "0 0 16px -2px rgba(158,228,26,0.35)",
        duration: 0.2,
      }, 2.50);
      masterTl.to([dotWeb, dotEmail], {
        backgroundColor: "#9EE41A",
        boxShadow: "0 0 10px 2px rgba(158,228,26,0.70)",
        duration: 0.2,
      }, 2.50);
      masterTl.to([cardWeb, cardEmail], {
        scale: 1.015,
        duration: 0.10,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      }, 2.52);

      // Counter roll 0 -> 1 (-18px)
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: -18, duration: 0.12, ease: "power2.inOut" }, 2.55);
      }

      // Connection 2: Website -> CRM
      masterTl.to(solidConns[1], { drawSVG: "100%", duration: 0.55, ease: "power2.inOut" }, 2.18);
      masterTl.to(brokenConns[1], { opacity: 0, duration: 0.3 }, 2.28);

      masterTl.to(cardCrm, {
        borderColor: "#9EE41A",
        boxShadow: "0 0 16px -2px rgba(158,228,26,0.35)",
        duration: 0.2,
      }, 2.70);
      masterTl.to(dotCrm, {
        backgroundColor: "#9EE41A",
        boxShadow: "0 0 10px 2px rgba(158,228,26,0.70)",
        duration: 0.2,
      }, 2.70);
      masterTl.to(cardCrm, {
        scale: 1.015,
        duration: 0.10,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      }, 2.72);

      // Counter roll 1 -> 2 (-36px)
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: -36, duration: 0.12, ease: "power2.inOut" }, 2.73);
      }

      // Connection 3: CRM -> Sheet
      masterTl.to(solidConns[2], { drawSVG: "100%", duration: 0.55, ease: "power2.inOut" }, 2.36);
      masterTl.to(brokenConns[2], { opacity: 0, duration: 0.3 }, 2.46);

      if (sheetTag) {
        masterTl.to(sheetTag, { color: "#141413", duration: 0.15 }, 2.88);
      }
      masterTl.to(cardSheet, {
        borderColor: "#9EE41A",
        boxShadow: "0 0 16px -2px rgba(158,228,26,0.35)",
        duration: 0.2,
      }, 2.88);
      masterTl.to(dotSheet, {
        backgroundColor: "#9EE41A",
        boxShadow: "0 0 10px 2px rgba(158,228,26,0.70)",
        duration: 0.2,
      }, 2.88);
      masterTl.to(cardSheet, {
        scale: 1.015,
        duration: 0.10,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      }, 2.90);

      // Counter roll 2 -> 3 (-54px)
      if (counterCol.current) {
        masterTl.to(counterCol.current, { y: -54, duration: 0.12, ease: "power2.inOut" }, 2.91);
      }

      // -------------------------------------------------------------
      // ACT 4 — THE ARCHITECTURAL SNAP (3.4s – 4.8s)
      // Spatial reorganization: cards straighten to 0deg, glide vertically
      // to establish a dedicated clearance channel.
      // Central unified pipeline reveals: WEBSITE ━━ AI AGENT ━━ QUALIFIED LEAD ━━ CRM.
      // Precision markers travel across pipeline, activating each operational stage.
      // -------------------------------------------------------------
      masterTl.to(cardEls, { opacity: 0.95, rotation: 0, duration: 0.40, ease: "power3.out" }, 3.50);
      masterTl.to([cardWeb, cardEmail], { y: -12, duration: 0.45, ease: "power3.out" }, 3.50);
      masterTl.to([cardCrm, cardSheet], { y: 12, duration: 0.45, ease: "power3.out" }, 3.50);
      masterTl.to(solidConns, { opacity: 0.25, duration: 0.35, ease: "power2.out" }, 3.50);
      masterTl.to(procContainer, { opacity: 1, duration: 0.35, ease: "power2.out" }, 3.50);

      // Body text horizontal sweep reveal
      if (bodyRef.current) {
        masterTl.to(bodyRef.current, { clipPath: "inset(0 0% 0 0)", duration: 0.85, ease: "power2.out" }, 3.45);
      }

      // Internal environments reflow to connected states
      if (emailMetaBadge) {
        masterTl.to(emailMetaBadge, { textContent: "AI ROUTED", color: "#141413", duration: 0.2 }, 3.60);
      }
      if (crmOwnerBadge) {
        masterTl.to(crmOwnerBadge, { textContent: "ALEX R. (AI DISPATCH)", color: "#141413", duration: 0.2 }, 3.70);
      }
      if (sheetSyncBadge) {
        masterTl.to(sheetSyncBadge, { textContent: "DUAL-SYNC ACTIVE", color: "#141413", duration: 0.2 }, 3.80);
      }

      // Stage 1: WEBSITE active
      masterTl.to(procStages[0], { color: "#141413", fontWeight: "600", duration: 0.15 }, 3.50);

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
      masterTl.to(procStages[1], { color: "#141413", fontWeight: "600", duration: 0.15 }, 3.90);
      masterTl.to(procStages[1].querySelector(".pf-proc-dot"), { backgroundColor: "#9EE41A", boxShadow: "0 0 6px #9EE41A", duration: 0.15 }, 3.90);

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
      masterTl.to(procStages[2], { color: "#141413", fontWeight: "600", duration: 0.15 }, 4.30);
      masterTl.to(procStages[2].querySelector(".pf-proc-dot"), { backgroundColor: "#9EE41A", boxShadow: "0 0 6px #9EE41A", duration: 0.15 }, 4.30);

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
      masterTl.to(procStages[3], { color: "#141413", fontWeight: "600", duration: 0.15 }, 4.70);
      masterTl.to(procStages[3].querySelector(".pf-proc-dot"), { backgroundColor: "#9EE41A", boxShadow: "0 0 6px #9EE41A", duration: 0.15 }, 4.70);

      // Headline Line B turns ink, underline sweeps across "connection problem."
      if (lineBRef.current) {
        masterTl.to(lineBRef.current, { color: "#141413", duration: 0.20, ease: "power2.out" }, 4.40);
      }
      if (connectionUnderlineRef.current) {
        masterTl.to(connectionUnderlineRef.current, { scaleX: 1, duration: 0.35, ease: "power2.out" }, 4.45);
      }

      // -------------------------------------------------------------
      // ACT 5 — ONE SYSTEM & PHYSICAL HANDOFF SPINE (4.8s – 6.0s)
      // Compact anchors activate, vertical lime spine draws downward to bottom edge,
      // creating an unbroken physical handoff into Services' top spine.
      // -------------------------------------------------------------
      masterTl.to(compactAnchors, { opacity: 1, duration: 0.10 }, 4.80);
      masterTl.call(() => emitThread(), [], 5.00);

      // Bottom vertical handoff spine draws down toward section boundary
      if (handoffLineRef.current && handoffPulseRef.current) {
        masterTl.to(handoffLineRef.current, { height: 64, duration: 0.75, ease: "power2.inOut" }, 4.85);
        masterTl.to(handoffPulseRef.current, { opacity: 1, duration: 0.15 }, 4.85);
        masterTl.to(handoffPulseRef.current, { y: 64, duration: 0.75, ease: "power2.inOut" }, 4.85);
      }

      // Quiet hold until pin releases cleanly into Services
      masterTl.to({}, { duration: 0.40 }, 5.60);
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
      className="relative w-full bg-[#F4F4EE] min-h-[100svh]"
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
            transform: translateY(-3px);
            border-color: #9EE41A !important;
            box-shadow: 0 12px 28px -6px rgba(20,20,19,0.10), 0 0 14px -2px rgba(158,228,26,0.35) !important;
          }
          #problem .pf-card-hover:hover .pf-dot {
            transform: scale(1.25);
            box-shadow: 0 0 8px 1px #9EE41A;
          }
        }
        #problem .pf-dot {
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
        }
      `}</style>

      <div
        ref={sceneContentRef}
        className="pf-scene-content wrap w-full min-h-[100svh] flex flex-col justify-center py-[clamp(32px,5vh,64px)] relative"
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
              {/* Header status bar with unified baseline alignment */}
              <div className="mb-[14px] flex items-baseline justify-between font-mono text-[11.5px] uppercase tracking-[0.14em]">
                <div className="flex items-baseline gap-[6px] text-[#6E6D68]">
                  <span className="font-semibold text-[#141413]">4 TOOLS</span>
                  <span className="text-[#141413]/30">·</span>
                  <div
                    className="inline-block overflow-hidden relative"
                    style={{ height: "18px", width: "1.1ch", verticalAlign: "baseline" }}
                  >
                    <span
                      ref={counterCol}
                      data-counter-column
                      className="inline-flex flex-col text-center font-bold text-[#141413]"
                      style={{
                        willChange: "transform",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span style={{ height: "18px", lineHeight: "18px" }}>0</span>
                      <span style={{ height: "18px", lineHeight: "18px" }}>1</span>
                      <span style={{ height: "18px", lineHeight: "18px" }}>2</span>
                      <span style={{ height: "18px", lineHeight: "18px" }}>3</span>
                    </span>
                  </div>
                  <span ref={counterUnit} data-counter-unit className="text-[#6E6D68]">connections</span>
                </div>

                <div className="flex items-center gap-[6px]">
                  <span
                    ref={statusDotRef}
                    className="h-[6px] w-[6px] rounded-full transition-all duration-200"
                    style={{ background: "#A8A69E" }}
                  />
                  <span
                    ref={stateRef}
                    data-problem-state
                    className="font-medium tracking-[0.16em] transition-colors duration-200"
                    style={{ color: "#6E6D68" }}
                  >
                    Disconnected
                  </span>
                </div>
              </div>

              {/* Recessed Studio Tray (.pf-visual-container) */}
              <div
                ref={stage}
                className="pf-visual-container relative w-full rounded-[10px] border border-[#141413]/[0.08] bg-[#EAE7DF] overflow-hidden"
                style={{
                  minHeight: "420px",
                  height: "clamp(420px, 48vh, 460px)",
                  boxShadow: "inset 0 2px 6px rgba(20,20,19,0.05), 0 4px 20px -2px rgba(20,20,19,0.04)",
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
                  <g opacity="0.35">
                    <line x1="200" y1="20" x2="200" y2="320" stroke="rgba(20,20,19,0.12)" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1="20" y1="170" x2="380" y2="170" stroke="rgba(20,20,19,0.12)" strokeWidth="0.8" strokeDasharray="3 3" />
                    <circle cx="200" cy="170" r="2.5" fill="none" stroke="rgba(20,20,19,0.15)" strokeWidth="0.8" />
                  </g>

                  {/* Broken connector hairlines in Act 1 */}
                  <g className="pf-broken-conns">
                    {/* Con 1: Website to Email (horizontal top) */}
                    <path
                      className="pf-broken-conn"
                      d="M 175 80 H 225"
                      stroke="rgba(20,20,19,0.22)"
                      strokeWidth="1.2"
                      strokeDasharray="4 5"
                      fill="none"
                    />
                    {/* Con 2: Website to CRM (vertical left) */}
                    <path
                      className="pf-broken-conn"
                      d="M 100 130 V 215"
                      stroke="rgba(20,20,19,0.22)"
                      strokeWidth="1.2"
                      strokeDasharray="4 5"
                      fill="none"
                    />
                    {/* Con 3: CRM to Sheet (horizontal bottom) */}
                    <path
                      className="pf-broken-conn"
                      d="M 175 265 H 225"
                      stroke="rgba(20,20,19,0.22)"
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
                      stroke="#9EE41A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Con 2: Website toward CRM */}
                    <path
                      className="pf-solid-conn"
                      d="M 100 130 V 215"
                      stroke="#9EE41A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Con 3: CRM toward Sheet */}
                    <path
                      className="pf-solid-conn"
                      d="M 175 265 H 225"
                      stroke="#9EE41A"
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
                    stroke="#9EE41A"
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
                        className="pf-card-hover pf-inspect flex flex-col rounded-[8px] border border-[#141413]/[0.09] bg-white p-[clamp(10px,1.2vw,14px)] cursor-pointer select-none"
                        style={{
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 10px 24px -6px rgba(20,20,19,0.07), 0 1px 3px rgba(20,20,19,0.03)",
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
                        {/* 1. Distinct Miniature Interface Top Chrome */}
                        {c.id === "web" ? (
                          <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-[5px] mb-[6px]">
                            <div className="flex items-center gap-[3px]">
                              <span className="block h-[4.5px] w-[4.5px] rounded-full bg-[#141413]/20" />
                              <span className="block h-[4.5px] w-[4.5px] rounded-full bg-[#141413]/20" />
                              <span className="block h-[4.5px] w-[4.5px] rounded-full bg-[#141413]/20" />
                            </div>
                            <span className="mono text-[8.5px] text-[#8E8E88] bg-[#F4F4EE] px-[6px] py-[1px] rounded-[3px] truncate max-w-[130px]">
                              arche.studio/inquiry
                            </span>
                            <span
                              className="pf-dot relative block flex-none rounded-full"
                              style={{ width: 7, height: 7, background: "#8E8E88" }}
                              data-signal="problem-website"
                            />
                          </div>
                        ) : c.id === "email" ? (
                          <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-[5px] mb-[6px]">
                            <span className="mono text-[8.5px] uppercase tracking-wider text-[#8E8E88] font-medium">
                              INBOX (1)
                            </span>
                            <span className="mono text-[8.5px] text-[#8E8E88]">10:42 AM</span>
                            <span
                              className="pf-dot relative block flex-none rounded-full"
                              style={{ width: 7, height: 7, background: "#8E8E88" }}
                            />
                          </div>
                        ) : c.id === "crm" ? (
                          <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-[5px] mb-[6px]">
                            <span className="mono text-[8.5px] uppercase tracking-wider text-[#8E8E88] font-medium">
                              LEAD #2048
                            </span>
                            <span className="mono text-[8px] text-[#141413] bg-[#9EE41A]/25 px-[5px] py-[1px] rounded-[2px] font-semibold">
                              QUALIFYING
                            </span>
                            <span
                              className="pf-dot relative block flex-none rounded-full"
                              style={{ width: 7, height: 7, background: "#8E8E88" }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-[5px] mb-[6px]">
                            <span className="mono text-[8.5px] uppercase tracking-wider text-[#8E8E88] font-medium">
                              PIPELINE.CSV
                            </span>
                            <span className="mono text-[8.5px] text-[#8E8E88]">ROW 142</span>
                            <span
                              className="pf-dot relative block flex-none rounded-full"
                              style={{ width: 7, height: 7, background: "#8E8E88" }}
                            />
                          </div>
                        )}

                        {/* 2. Tool Title & Miniature UI Context */}
                        <div className="flex items-center justify-between gap-[6px]">
                          <span className="mono text-[10px] uppercase tracking-wider text-[#6E6D68] font-semibold">
                            {c.k}
                          </span>
                          {c.id === "web" && (
                            <span className="pf-web-action mono text-[8px] text-[#8E8E88] font-medium">
                              [SUBMIT]
                            </span>
                          )}
                          {c.id === "email" && (
                            <span className="pf-email-meta mono text-[8px] text-[#8E8E88]">
                              inquiry@acmecorp.com
                            </span>
                          )}
                          {c.id === "crm" && (
                            <span className="pf-crm-owner mono text-[8px] text-[#8E8E88]">
                              $24,000 · High Intent
                            </span>
                          )}
                          {c.id === "sheet" && (
                            <span className="pf-sheet-sync mono text-[8px] text-[#8E8E88]">
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
                            } block absolute inset-0 text-[#8E8E88]`}
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
                            } block absolute inset-0 text-[#141413]`}
                          >
                            {c.b}
                          </span>
                        </div>

                        {/* 4. Status indicator tag */}
                        <span className="pf-tag mono mt-[3px] block text-[9px] text-[#8E8E88]">
                          {c.tag}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* ACT 4: Central Horizontal 4-Stage Process (WEBSITE ━━ AI AGENT ━━ QUALIFIED LEAD ━━ CRM) */}
                  <div className="pf-proc-lane pointer-events-none relative col-span-2 row-start-2 z-20 w-full my-[4px]">
                    <div className="relative rounded-[6px] border border-[#141413]/[0.08] bg-[#F4F4EE]/95 backdrop-blur-md p-[8px_14px] shadow-sm">
                      <div className="relative z-10 flex items-center justify-between text-[10px] mono uppercase tracking-wider text-[#8E8E88]">
                        {["WEBSITE", "AI AGENT", "QUALIFIED LEAD", "CRM"].map((label, idx) => (
                          <div
                            key={label}
                            className="pf-proc-stage flex items-center gap-[6px] transition-colors bg-[#F4F4EE] px-[6px] py-[2px] rounded-[3px]"
                          >
                            <span
                              className="pf-proc-dot block rounded-full flex-none"
                              style={{ width: 5, height: 5, background: idx === 0 ? "#9EE41A" : "#8E8E88" }}
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
                        <line className="pf-proc-line" x1="44" y1="4" x2="104" y2="4" stroke="#9EE41A" strokeWidth="1.2" />
                        <line className="pf-proc-line" x1="146" y1="4" x2="206" y2="4" stroke="#9EE41A" strokeWidth="1.2" />
                        <line className="pf-proc-line" x1="285" y1="4" x2="340" y2="4" stroke="#9EE41A" strokeWidth="1.2" />

                        {/* Small lime rectangular signal markers */}
                        <rect className="pf-proc-marker pf-proc-marker-0" x="44" y="2.5" width="6" height="3" fill="#9EE41A" rx="1" />
                        <rect className="pf-proc-marker pf-proc-marker-1" x="146" y="2.5" width="6" height="3" fill="#9EE41A" rx="1" />
                        <rect className="pf-proc-marker pf-proc-marker-2" x="285" y="2.5" width="6" height="3" fill="#9EE41A" rx="1" />
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
                      data-thread-slot="problem"
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

      {/* Phase 3: Seamless Physical Handoff Spine to Services */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center"
      >
        <span
          ref={handoffPulseRef}
          className="h-[5px] w-[5px] rounded-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A] opacity-0"
        />
        <span
          ref={handoffLineRef}
          className="block w-[1.5px] bg-[#9EE41A]"
          style={{
            height: "0px",
            boxShadow: "0 0 10px rgba(158,228,26,0.6)",
            transformOrigin: "top center",
          }}
        />
      </div>
    </section>
  );
}

/* ================================================================== */
/* Mobile — stacked, clean narrative sequence                          */
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
              dot.style.background = "#9EE41A";
              dot.style.boxShadow = "0 0 8px 1px #9EE41A";
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
    <section ref={root} id="problem" className="relative w-full py-[clamp(48px,8vw,80px)] bg-[#F4F4EE]">
      <div className="wrap flex flex-col gap-[clamp(24px,4vh,40px)]">
        <Copy />
        <div className="pf-beat flex flex-col">
          {MOBILE_ORDER.map((id, i) => {
            const c = CARDS.find((x) => x.id === id)!;
            return (
              <div key={id} className="pfm-item" data-done="0" data-sync="0" data-flip="0">
                {i > 0 && (
                  <span className="relative ml-[22px] block h-[24px] w-px" style={{ background: "rgba(20,20,19,0.12)" }} aria-hidden>
                    <span className="pfm-seg absolute inset-0" style={{ background: "#9EE41A" }} />
                  </span>
                )}
                <div
                  data-card={c.id}
                  className="pf-card pf-inspect flex flex-col rounded-[8px] border border-[#141413]/[0.09] bg-white p-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_-6px_rgba(20,20,19,0.06)]"
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
                  <div className="flex items-center justify-between gap-[10px] border-b border-[#141413]/[0.08] pb-[5px] mb-[6px]">
                    <span className="mono text-[9px] uppercase tracking-wider text-[#8E8E88] font-medium">
                      {c.k === "Website" ? "WEBSITE · INBOUND" : c.k === "Email" ? "INBOX (1) · 10:42 AM" : c.k === "CRM" ? "LEAD #2048 · QUALIFYING" : "PIPELINE.CSV · ROW 142"}
                    </span>
                    <span
                      className="pf-dot relative block flex-none rounded-full"
                      style={{ width: 8, height: 8, background: "#8E8E88" }}
                      {...(i === 0 ? { "data-signal": "problem-website" } : {})}
                    />
                  </div>
                  <span className="pf-flip mt-[4px] text-[14px] font-medium tracking-tight text-[#141413]">
                    <span className="pf-a">{c.a}</span>
                    {c.b && <span className="pf-b">{c.b}</span>}
                  </span>
                  <span className="pf-tag mono mt-[4px] block text-[9px] text-[#8E8E88]">
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
