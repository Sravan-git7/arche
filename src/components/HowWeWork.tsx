import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { siteContent } from "../data/site";
import "./HowWeWork.css";

// Approach principles copy, preserved verbatim.
const principles = [
  { k: "Systems thinking", v: "We design the connections between tools, content and people — not isolated deliverables." },
  { k: "AI where it earns its place", v: "Automation and agents only where they remove real work. No AI for the brochure." },
  { k: "Design + engineering", v: "Interface, motion and implementation are one language, not three handoffs." },
  { k: "Built to keep running", v: "Every engagement ends with something you can operate, measure and improve." },
];

// Steps verbatim from siteContent.process (six stages).
const steps = siteContent.process.steps;

// Which side each caption docks to on wide screens.
const CAP_SIDE: Record<string, "left" | "right"> = {
  discover: "left",
  design: "right",
  build: "right",
  connect: "left",
  launch: "left",
  evolve: "left",
  systems: "left",
  ai: "left",
  "design-eng": "left",
  running: "left",
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Master-timeline seconds at the midpoint of each beat's visible window.
// The diagram's beat buttons seek here; onUpdate walks to the nearest.
const PROCESS_BEAT_T = [15, 33.5, 52, 70, 88.5, 104.7];
const APPROACH_BEAT_T = [132, 149.5, 167.7, 184];
const beatFor = (t: number) => {
  let beat = 0;
  for (let i = 1; i < PROCESS_BEAT_T.length; i += 1) {
    if (t >= (PROCESS_BEAT_T[i - 1] + PROCESS_BEAT_T[i]) / 2) beat = i;
  }
  return beat;
};

/**
 * HowWeWork — "The experience, taking shape".
 *
 * One continuous, full-width, scroll-driven 3D story. The anchor is a single
 * digital experience — a website taking shape inside a real slab (true
 * thickness, floor plane, contact shadow, key light). The same experience is
 * carried through all six stages of the Process and then the four Approach
 * principles, with the copy docked beside the action as editorial type.
 *
 * - Paper through Connect; dark begins during Launch (step 05), continues
 *   through Evolve and Approach; paper returns only at .hww-exit.
 * - Text lives in a flat overlay layer (never projected onto geometry) and
 *   is animated by the same scrubbed master timeline as the scene.
 * - The full copy is real DOM content in reading order for assistive tech.
 * - #process / #approach anchors, the two rail entries, the pinned
 *   choreography, reduced-motion support and ScrollTrigger cleanup are all
 *   preserved. One paused timeline is sampled by one ScrollTrigger.
 */
export function HowWeWork() {
  const root = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  // While a beat button is settling the pinned scene into place, keep the
  // diagram's data-state on the visitor's choice (scrub smoothing lags).
  const forcedBeatUntil = useRef(0);
  const pressSeq = useRef(0);
  const [ink, setInk] = useState(false);
  // Which approach principle the visitor asked for most recently.
  const [activePrinciple, setActivePrinciple] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = prefersReducedMotion();

    // ---- probe the light/dark palettes exactly once --------------------
    const probe = document.createElement("div");
    probe.className = "on-ink";
    probe.hidden = true;
    el.appendChild(probe);
    const keys = ["--bg", "--bg-2", "--fg", "--muted", "--faint", "--line", "--card", "--accent-deep", "--accent-ink"];
    const palette = (node: Element) =>
      Object.fromEntries(keys.map((k) => [k, getComputedStyle(node).getPropertyValue(k).trim()]));
    const light = palette(document.documentElement);
    const dark = palette(probe);
    probe.remove();

    const applyTheme = (t: number) => {
      // t: 0 = paper room, 1 = ink room
      const mixed: Record<string, string> = {};
      keys.forEach((k) => {
        mixed[k] = gsap.utils.interpolate(light[k], dark[k], t) as string;
      });
      gsap.set(el, mixed);
      el.style.setProperty("--hww-theme", t.toFixed(4));
      const shouldBeInk = t >= 0.5;
      setInk((prev) => (prev === shouldBeInk ? prev : shouldBeInk));
    };

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const cam = q(".hww-camera")[0] as HTMLElement;
      const routePath = q(".xp-route-path")[0] as unknown as SVGPathElement;
      const routeDot = q(".xp-route-dot")[0] as unknown as SVGCircleElement;
      const routeHalo = q(".xp-route-halo")[0] as unknown as SVGCircleElement;

      const routeLen = routePath.getTotalLength();

      // Point a proxy value u∈[0,1] at a point along an SVG path.
      const pathProxy = (
        path: SVGPathElement,
        len: number,
        dot: SVGCircleElement,
        halo: SVGCircleElement
      ) => ({
        set(u: number) {
          const pt = path.getPointAtLength(clamp01(u) * len);
          dot.setAttribute("cx", String(pt.x));
          dot.setAttribute("cy", String(pt.y));
          halo.setAttribute("cx", String(pt.x));
          halo.setAttribute("cy", String(pt.y));
        },
      });
      const routeProxy = { u: 0 };
      const routePos = pathProxy(routePath, routeLen, routeDot, routeHalo);

      // Two signal packets: leg one carries the enquiry from the form to the
      // Inbox; leg two carries it from the Inbox into the CRM.
      const buildPacket = (pathSel: string, dotSel: string, haloSel: string) => {
        const path = q(pathSel)[0] as unknown as SVGPathElement;
        const dot = q(dotSel)[0] as unknown as SVGCircleElement;
        const halo = q(haloSel)[0] as unknown as SVGCircleElement;
        const len = path.getTotalLength();
        const proxy = { u: 0 };
        const place = (u: number) => {
          const pt = path.getPointAtLength(clamp01(u) * len);
          dot.setAttribute("cx", String(pt.x));
          dot.setAttribute("cy", String(pt.y));
          halo.setAttribute("cx", String(pt.x));
          halo.setAttribute("cy", String(pt.y));
        };
        return { proxy, dot, halo, place };
      };
      const p1 = buildPacket(".xp-packet-path", ".xp-packet", ".xp-packet-halo");
      const p2 = buildPacket(".xp-packet-path-2", ".xp-packet-2", ".xp-packet-halo-2");
      const packetRun = (p: ReturnType<typeof buildPacket>, t: number, d: number) => {
        tl.fromTo(p.dot, { opacity: 0 }, { opacity: 1, duration: 1.1 }, t);
        tl.fromTo(p.halo, { opacity: 0 }, { opacity: 0.45, duration: 1.1 }, t);
        tl.fromTo(p.proxy, { u: 0 }, {
          u: 1, duration: d, ease: "power2.inOut",
          onUpdate: () => p.place(p.proxy.u),
        }, t);
        tl.to(p.dot, { opacity: 0, duration: 1.1 }, t + d + 0.6);
        tl.to(p.halo, { opacity: 0, duration: 1.1 }, t + d + 0.6);
      };

      // =================================================================
      // MASTER TIMELINE — scrubbed 0 → 1 by one ScrollTrigger
      // =================================================================
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
      const show = (sel: string, t: number, d = 5) =>
        tl.fromTo(sel, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: d, ease: "power3.out" }, t);
      const hide = (sel: string, t: number, d = 4) =>
        tl.to(sel, { opacity: 0, y: -18, duration: d, ease: "power2.in" }, t);

      // ---------- initial states (before any scrub) ----------
      const entryX = el.offsetWidth <= 400 ? 96 : el.offsetWidth <= 860 ? 120 : 150;
      gsap.set(cam, { x: entryX, y: 60, z: 260, rotationX: 13, rotationY: -29, rotationZ: 0 });
      gsap.set(q(".xp-page"), { opacity: 0.55, filter: "saturate(0.35)" });
      gsap.set(q(".xp-route-dot, .xp-route-halo"), { opacity: 0 });
      gsap.set(routeDot, { attr: { r: 4.6 } });
      gsap.set(routeHalo, { attr: { r: 10 }, opacity: 0 });
      gsap.set(p1.dot, { opacity: 0, attr: { r: 4.2 } });
      gsap.set(p1.halo, { opacity: 0, attr: { r: 9 } });
      gsap.set(p2.dot, { opacity: 0, attr: { r: 4.2 } });
      gsap.set(p2.halo, { opacity: 0, attr: { r: 9 } });
      gsap.set(q(".dock"), { x: 330, y: 40, z: -150, rotationY: -26, opacity: 0 });
      gsap.set(q(".xp-seam"), { opacity: 0 });
      gsap.set(q(".xp-cta-btn"), { opacity: 0, scale: 0.88, transformOrigin: "50% 50%" });
      gsap.set(q(".xp-cta-plan"), { opacity: 0 });
      gsap.set(q(".xp-cta-slot"), { opacity: 0.9 });
      gsap.set(q(".xp-cta-slot-pulse"), { opacity: 0 });
      gsap.set(q(".xp-void-tag"), { opacity: 0 });
      gsap.set(q(".xp-kicker"), { opacity: 0 });
      gsap.set(q(".xp-card-icon svg"), { opacity: 0.55 });
      gsap.set(q(".xp-card-label"), { opacity: 0.5 });
      gsap.set(q(".xp-route-flash"), { opacity: 0 });
      gsap.set(q(".xp-update-frame"), { opacity: 0, scale: 0.96, transformOrigin: "50% 50%" });
      gsap.set(q(".xp-ai-chip"), { opacity: 0, y: 10 });
      gsap.set(q(".xp-ai-knob"), { x: 0 });
      gsap.set(q(".xp-ai-line"), { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(q(".xp-flare"), { x: -260, opacity: 0 });
      gsap.set(q(".xp-backglow"), { opacity: 0 });
      gsap.set(q(".xp-guides"), { opacity: 0 });
      gsap.set(q(".xp-scan"), { x: -150, opacity: 0 });
      gsap.set(q(".xp-tagline"), { opacity: 0.6 });
      gsap.set(q(".xp-nav-link"), { opacity: 0 });
      gsap.set(q(".xp-word"), { opacity: 0.5 });
      gsap.set(q(".xp-chrome-pill svg, .xp-chrome-pill-bar"), { opacity: 0 });
      gsap.set(q(".xp-panel-skel"), { opacity: 1 });
      gsap.set(q(".xp-panel-plan"), { opacity: 0 });
      gsap.set(q(".xp-panel-live"), { opacity: 0 });
      gsap.set(q(".xp-form-inner"), { opacity: 1 });
      gsap.set(q(".xp-confirm"), { opacity: 0, y: 10 });
      gsap.set(q(".xp-check-ring"), { strokeDashoffset: 100 });
      gsap.set(q(".xp-check-tick"), { strokeDashoffset: 100 });
      gsap.set(q(".xp-email-text"), { clipPath: "inset(0% 100% 0% 0%)" });
      gsap.set(q(".xp-field-caret"), { opacity: 0 });
      gsap.set(q(".xp-field-check"), { opacity: 0 });
      gsap.set(q(".xp-cta-old"), { opacity: 1 });
      gsap.set(q(".xp-cta-new"), { opacity: 0 });
      gsap.set(q(".xp-status-new"), { opacity: 1 });
      gsap.set(q(".xp-status-logged"), { opacity: 0 });
      gsap.set(q(".dock-enquiry"), { opacity: 0, y: 6 });
      gsap.set(q(".xp-draft-row"), { opacity: 0 });
      gsap.set(q(".xp-nav-underline-contact"), { scaleX: 0, transformOrigin: "0% 50%" });
      // scattered start offsets for the Design snap-together
      gsap.set(q(".xp-nav"), { x: 5, y: -3 });
      gsap.set(q(".xp-tagline"), { x: -6 });
      gsap.set(q(".xp-cta-slot"), { x: -6 });
      gsap.set(q(".xp-cta-plan"), { x: -6 });
      gsap.set(q(".xp-cta-btn"), { x: -6 });
      gsap.set(q(".xp-panel"), { x: 10, y: -8 });
      gsap.set(q(".xp-card-col-1"), { x: -9, y: 6 });
      gsap.set(q(".xp-card-col-2"), { x: 7, y: -7 });
      gsap.set(q(".xp-card-col-3"), { x: -5, y: 8 });

      // ---------- intro / masthead ----------
      tl.fromTo(".hww-mast-process", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 6, ease: "power3.out" }, 0.5);
      hide(".hww-mast-process", 8.5, 4.5);

      // =================================================================
      // 01 · DISCOVER — a real gap in the experience (t 5 → 30)
      // =================================================================
      show(".hww-cap-discover", 8, 5);
      hide(".hww-cap-discover", 21.5, 3);
      tl.to(cam, { x: 168, y: -10, z: 118, rotationX: 8.5, rotationY: -16, duration: 13, ease: "power2.inOut" }, 1);
      // the journey enters, travels, and stalls at the missing action
      tl.fromTo(routeProxy, { u: 0 }, { u: 0.46, duration: 8, ease: "power1.inOut", onUpdate: () => routePos.set(routeProxy.u) }, 6.5);
      tl.fromTo(".xp-route-dot", { opacity: 0 }, { opacity: 1, duration: 1.2 }, 6.2);
      tl.fromTo(".xp-route-halo", { opacity: 0 }, { opacity: 0.4, duration: 1.2 }, 6.2);
      tl.to(".xp-route-path", { strokeDashoffset: 54, duration: 8, ease: "power1.inOut" }, 6.5);
      // stalled at the void: the dot dies, the missing step announces itself
      tl.to(".xp-route-dot", { opacity: 0.28, duration: 1.4, ease: "power1.in" }, 15.4);
      tl.to(".xp-route-halo", { opacity: 0, duration: 1.2 }, 15.4);
      tl.fromTo(".xp-cta-slot-pulse", { opacity: 0 }, { opacity: 1, duration: 1.5 }, 9);
      tl.fromTo(".xp-void-tag", { opacity: 0 }, { opacity: 1, duration: 1.6 }, 10.5);
      tl.fromTo(".xp-cta-slot", { opacity: 0.55 }, { opacity: 1, duration: 3 }, 7);
      // the useful content is there; the finish is not
      tl.to(".xp-page", { opacity: 0.66, duration: 6 }, 6);

      // =================================================================
      // 02 · DESIGN — the journey takes a deliberate, coherent form
      // =================================================================
      show(".hww-cap-design", 25, 5);
      hide(".hww-cap-design", 40.5, 3);
      tl.to(cam, { x: -150, y: -46, z: 26, rotationX: 25, rotationY: -3, duration: 17, ease: "power2.inOut" }, 24);
      // drafting guides fade in, everything snaps true
      tl.fromTo(".xp-guides", { opacity: 0 }, { opacity: 0.9, duration: 3.4 }, 26.5);
      tl.to(q(".xp-guide-v, .xp-guide-h"), { scaleY: 1, scaleX: 1, duration: 4, ease: "power3.out", stagger: 0.12 }, 26.5);
      tl.to(q(".xp-crop"), { scale: 1, duration: 3, ease: "power3.out", stagger: 0.08 }, 27);
      tl.to(q(".xp-nav, .xp-tagline, .xp-cta-slot, .xp-cta-plan, .xp-cta-btn, .xp-panel, .xp-card-col-1, .xp-card-col-2, .xp-card-col-3"),
        { x: 0, y: 0, duration: 6.5, ease: "power3.out", stagger: 0.14 }, 27.5);
      // the plan prescribes destinations, labelled services and the action
      tl.to(q(".xp-nav-link"), { opacity: 0.85, duration: 2.4, stagger: 0.3 }, 28.5);
      tl.to(q(".xp-card-label"), { opacity: 0.85, duration: 2.2, stagger: 0.2 }, 29);
      tl.fromTo(".xp-panel-plan", { opacity: 0 }, { opacity: 1, duration: 2.6 }, 29);
      tl.to(".xp-panel-skel", { opacity: 0.35, duration: 2.6 }, 29);
      tl.to(".xp-void-tag", { opacity: 0, duration: 1.6 }, 26.5);
      // the route becomes a complete, intentional plan
      tl.to(routeProxy, { u: 1, duration: 8, ease: "power2.inOut", onUpdate: () => routePos.set(routeProxy.u) }, 27);
      tl.to(".xp-route-path", { strokeDashoffset: 0, duration: 8, ease: "power2.inOut" }, 27);
      tl.to(".xp-route-dot", { opacity: 1, duration: 0.8 }, 27);
      // the void becomes a planned action — outlined, chosen
      tl.to(".xp-cta-slot", { opacity: 0, duration: 2.5 }, 28.5);
      tl.to(".xp-cta-slot-pulse", { opacity: 0, duration: 1.5 }, 28);
      tl.to(".xp-cta-plan", { opacity: 1, duration: 2.2 }, 29);
      tl.to(".xp-page", { opacity: 0.78, duration: 6 }, 27);
      // the visitor arrives — the plan ends where it must
      tl.to(".xp-route-dot", { opacity: 0, duration: 1.6 }, 36.5);
      tl.to(".xp-route-halo", { opacity: 0, duration: 1.6 }, 36.5);
      tl.to(".xp-guides", { opacity: 0, duration: 3 }, 39.5);

      // =================================================================
      // 03 · BUILD — the interface becomes real and finished
      // =================================================================
      show(".hww-cap-build", 43.5, 5);
      hide(".hww-cap-build", 59, 3);
      tl.to(cam, { x: -150, y: 2, z: -52, rotationX: 6, rotationY: 15, duration: 16, ease: "power2.inOut" }, 43.5);
      tl.to(".xp-page", { opacity: 1, filter: "saturate(1)", duration: 7 }, 44);
      // the scan band sweeps through; each part resolves as it passes
      tl.fromTo(".xp-scan", { x: -160, opacity: 0 }, { x: 780, opacity: 1, duration: 17, ease: "none" }, 45.5);
      tl.to(".xp-scan", { opacity: 0, duration: 2.2 }, 62.5);
      // identity and chrome resolve
      tl.to(".xp-word", { opacity: 1, duration: 1.6 }, 46.5);
      tl.to(q(".xp-nav-link"), { opacity: 1, duration: 1.5, stagger: 0.15 }, 47);
      tl.to(q(".xp-chrome-pill svg, .xp-chrome-pill-bar"), { opacity: 0.9, duration: 1.8 }, 47.5);
      tl.to(".xp-kicker", { opacity: 1, duration: 1.4 }, 48.6);
      tl.to(".xp-tagline", { opacity: 1, duration: 1.6 }, 51);
      // the planned action becomes the real button
      tl.to(".xp-cta-plan", { opacity: 0, duration: 1.8 }, 52);
      tl.to(".xp-cta-btn", { opacity: 1, scale: 1, duration: 2.1, ease: "back.out(1.6)" }, 52.6);
      // the form becomes the real thing: labelled fields, one live state
      tl.to(".xp-panel-skel", { opacity: 0, duration: 2 }, 50.5);
      tl.to(".xp-panel-plan", { opacity: 0, duration: 2 }, 50.5);
      tl.to(".xp-panel-live", { opacity: 1, duration: 2.4 }, 51);
      tl.to(".xp-field-emailbox", { boxShadow: "0 0 0 2px rgba(200,241,79,0.85)", duration: 2 }, 54);
      tl.to(".xp-field-caret", { opacity: 1, duration: 0.8 }, 54.6);
      // cards gain their glyphs and solid labels
      tl.to(q(".xp-card-icon svg"), { opacity: 1, duration: 1.5, stagger: 0.4 }, 55);
      tl.to(q(".xp-card-label"), { opacity: 1, duration: 1.5 }, 55.5);
      // the slab itself becomes a finished object
      tl.fromTo(".xp-face", { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 30px 60px -18px rgba(12,12,13,0.3)" },
        { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 46px 90px -16px rgba(12,12,13,0.46)", duration: 6 }, 52);

      // =================================================================
      // 04 · CONNECT — the experience joins the tools around it
      // =================================================================
      show(".hww-cap-connect", 61.5, 5);
      hide(".hww-cap-connect", 77, 3);
      tl.to(cam, { x: -64, y: -14, z: 132, rotationX: 10, rotationY: -25, duration: 16, ease: "power2.inOut" }, 62);
      // the tools seat into the slab, one by one — one joined machine
      const seat = (sel: string, t: number, seam: string) => {
        tl.to(sel, { x: 0, y: 0, z: 2, rotationY: 0, opacity: 1, duration: 6, ease: "power3.inOut" }, t);
        tl.fromTo(seam, { opacity: 0 }, { opacity: 0.95, duration: 1.1 }, t + 3.4);
        tl.to(seam, { opacity: 0.8, duration: 1.6 }, t + 4.6);
        tl.fromTo(".xp-slab", { x: 0 }, { x: 3.5, duration: 0.45, yoyo: true, repeat: 1, ease: "power1.inOut" }, t + 3.6);
      };
      seat(".dock-inbox", 63.5, ".xp-seam-inbox");
      seat(".dock-crm", 67, ".xp-seam-crm");
      seat(".dock-sheets", 70.5, ".xp-seam-sheets");
      // the visitor presses send — one submission, from the real form
      tl.to(".xp-submit", { scale: 0.93, transformOrigin: "50% 50%", duration: 0.5, yoyo: true, repeat: 1, ease: "power1.inOut" }, 74.2);
      tl.to(".xp-field-caret", { opacity: 0, duration: 0.6 }, 74.5);
      // the same enquiry arrives — Inbox first, CRM second, then the log
      packetRun(p1, 75, 5.2);
      packetRun(p2, 80.6, 2.0);
      tl.fromTo(".xp-route-flash", { opacity: 0 }, { opacity: 0.9, duration: 1, yoyo: true, repeat: 1 }, 75.4);
      tl.to(".xp-backglow", { opacity: 0.34, duration: 6 }, 73);
      tl.to(".dock-inbox .dock-enquiry", { opacity: 1, y: 0, duration: 1.6 }, 80.4);
      tl.to(".dock-crm .dock-enquiry", { opacity: 1, y: 0, duration: 1.6 }, 82.4);
      tl.to(".dock-sheets .dock-enquiry", { opacity: 1, y: 0, duration: 1.6 }, 84);

      // =================================================================
      // 05 · LAUNCH — the complete experience, revealed (dark begins)
      // =================================================================
      show(".hww-cap-launch", 80.5, 5);
      hide(".hww-cap-launch", 94, 3);
      tl.to(cam, { x: 30, y: -6, z: -168, rotationX: 2.4, rotationY: 0, duration: 16, ease: "power2.inOut" }, 80);
      tl.to(".xp-backglow", { opacity: 0.85, duration: 8 }, 81);
      tl.fromTo(".xp-unit", { scale: 0.96 }, { scale: 1.045, duration: 9, ease: "power2.inOut" }, 80.5);
      // the go-live: one sweep of light across the glass
      tl.fromTo(".xp-flare", { x: -300, opacity: 0 }, { x: 1050, opacity: 0.9, duration: 8, ease: "power1.inOut" }, 83);
      tl.to(".xp-flare", { opacity: 0, duration: 1.6 }, 90.5);
      tl.fromTo(".xp-route-flash", { opacity: 0 }, { opacity: 1, duration: 1.1, yoyo: true, repeat: 1 }, 84.5);
      packetRun(p1, 84, 6);
      tl.to(q(".xp-seam"), { opacity: 1, duration: 2.4, stagger: 0.25 }, 84);
      // the journey confirms on the page — the form resolves
      tl.to(".xp-form-inner", { opacity: 0, y: -8, duration: 2 }, 86);
      tl.to(".xp-confirm", { opacity: 1, y: 0, duration: 2.4 }, 87.4);
      tl.to(".xp-check-ring", { strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut" }, 87.6);
      tl.to(".xp-check-tick", { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }, 89.4);

      // =================================================================
      // 06 · EVOLVE — part updates, the rest adapts, nothing breaks
      // =================================================================
      show(".hww-cap-evolve", 98, 5);
      hide(".hww-cap-evolve", 109.5, 3);
      tl.to(cam, { x: 0, y: 0, z: -38, rotationX: 5, rotationY: -9, duration: 14, ease: "power2.inOut" }, 97.5);
      // focus frame brackets the shared action
      tl.to(".xp-update-frame", { opacity: 0.95, scale: 1, duration: 2.6 }, 98.5);
      // one shared label updates everywhere it lives — hero, nav, footer
      tl.to(q(".xp-cta-old"), { opacity: 0, duration: 1.6, stagger: 0.15 }, 100.5);
      tl.to(q(".xp-cta-new"), { opacity: 1, duration: 1.6, stagger: 0.15 }, 100.9);
      tl.fromTo(q(".xp-cta-btn, .xp-nav-cta, .xp-foot-cta"),
        { boxShadow: "0 0 0 0 rgba(200,241,79,0)" },
        { boxShadow: "0 0 0 3px rgba(200,241,79,0.55)", duration: 1.4, yoyo: true, repeat: 1, stagger: 0.15 }, 100.5);
      tl.to(".xp-update-frame", { opacity: 0.55, duration: 3 }, 104.5);
      tl.to(".xp-update-frame", { opacity: 0, duration: 2.4 }, 119);
      // the system keeps flowing through the change
      packetRun(p1, 103, 5.5);

      // =================================================================
      // APPROACH — the same scene, widened to the whole system
      // =================================================================
      show(".hww-mast-approach", 116, 4.5);
      hide(".hww-mast-approach", 123, 3.5);
      tl.to(cam, { x: -26, y: -30, z: 168, rotationX: 17, rotationY: -19, duration: 18, ease: "power2.inOut" }, 112.5);
      packetRun(p1, 115, 7);

      // ---- systems thinking ----
      show(".hww-cap-systems", 124.5, 5);
      hide(".hww-cap-systems", 138.5, 3);
      tl.to(cam, { x: 40, y: -20, z: 90, rotationX: 13.5, rotationY: -13, duration: 16, ease: "power2.inOut" }, 124);
      // trace the live journey, surface by surface: page → inbox → CRM → sheets
      tl.fromTo(q(".xp-cta-btn, .xp-nav-cta"), { filter: "brightness(1)" }, { filter: "brightness(1.45)", duration: 0.9, yoyo: true, repeat: 1 }, 126);
      packetRun(p1, 127, 4.6);
      packetRun(p2, 132.2, 2.0);
      tl.fromTo(".dock-inbox .dock-face", { boxShadow: "0 18px 40px -12px rgba(12,12,13,0.4)" },
        { boxShadow: "0 0 0 2px rgba(200,241,79,0.8), 0 18px 40px -12px rgba(12,12,13,0.4)", duration: 1.1, yoyo: true, repeat: 1 }, 131.6);
      tl.fromTo(".dock-crm .dock-face", { boxShadow: "0 18px 40px -12px rgba(12,12,13,0.4)" },
        { boxShadow: "0 0 0 2px rgba(200,241,79,0.8), 0 18px 40px -12px rgba(12,12,13,0.4)", duration: 1.1, yoyo: true, repeat: 1 }, 134.2);
      tl.fromTo(".dock-sheets .dock-face", { boxShadow: "0 18px 40px -12px rgba(12,12,13,0.4)" },
        { boxShadow: "0 0 0 2px rgba(200,241,79,0.8), 0 18px 40px -12px rgba(12,12,13,0.4)", duration: 1.1, yoyo: true, repeat: 1 }, 135.6);
      tl.to(q(".xp-seam"), { opacity: 0.95, duration: 2.2, stagger: 0.3 }, 126);
      tl.to(q(".xp-seam"), { opacity: 0.6, duration: 2.2, stagger: 0.3 }, 129);

      // ---- AI where it earns its place ----
      show(".hww-cap-ai", 140.5, 5);
      hide(".hww-cap-ai", 156.5, 3);
      tl.to(cam, { x: -150, y: -40, z: -26, rotationX: 6.5, rotationY: -27, duration: 16, ease: "power2.inOut" }, 140);
      // one optional tool inside the enquiry workflow: a reply draft for review
      tl.to(".xp-ai-chip", { opacity: 1, y: 0, duration: 2.4 }, 145.5);
      tl.to(".xp-ai-knob", { x: 13, duration: 1.4, ease: "power2.inOut" }, 149.5);
      tl.to(".xp-ai-line", { scaleX: 1, duration: 2.2, ease: "power2.inOut" }, 150);
      tl.to(".xp-draft-row", { opacity: 1, duration: 1.6 }, 150.5);
      // it goes back off — the enquiry flow runs fine without it
      tl.to(".xp-ai-knob", { x: 0, duration: 1.4, ease: "power2.inOut" }, 154.5);
      tl.to(".xp-ai-line", { scaleX: 0, duration: 1.6, ease: "power2.inOut" }, 154.5);
      tl.to(".xp-draft-row", { opacity: 0, duration: 1.6 }, 154.8);
      tl.to(".xp-ai-chip", { opacity: 0, duration: 2 }, 155.5);
      tl.to(q(".xp-seam"), { opacity: 0.8, duration: 1.6 }, 148);

      // ---- design + engineering ----
      show(".hww-cap-design-eng", 159, 5);
      hide(".hww-cap-design-eng", 173.5, 3);
      tl.to(cam, { x: -20, y: 2, z: 34, rotationX: 4, rotationY: -13, duration: 16, ease: "power2.inOut" }, 158.5);
      // the same panel re-opens — one experience, alive under the hand
      tl.to(".xp-confirm", { opacity: 0, y: 6, duration: 1.6 }, 159.3);
      tl.to(".xp-form-inner", { opacity: 1, y: 0, duration: 1.8 }, 159.8);
      // focus, type, verify, press
      tl.to(".xp-field-emailbox", { boxShadow: "0 0 0 2px rgba(200,241,79,0.95)", duration: 1.2 }, 160.5);
      tl.to(".xp-field-caret", { opacity: 1, duration: 0.6 }, 160.5);
      tl.to(".xp-email-text", { clipPath: "inset(0% 0% 0% 0%)", duration: 3.2, ease: "steps(14)" }, 161.5);
      tl.to(".xp-field-caret", { opacity: 0, duration: 0.6 }, 164.9);
      tl.to(".xp-field-check", { opacity: 1, duration: 0.6 }, 165.3);
      tl.fromTo(".xp-submit", { scale: 1 }, { scale: 0.93, duration: 0.45, yoyo: true, repeat: 1, ease: "power1.inOut" }, 166.6);
      // the current location is announced in the nav
      tl.to(".xp-nav-underline-contact", { scaleX: 1, duration: 1.8, ease: "power3.out" }, 168.2);
      tl.fromTo(".xp-face", { filter: "brightness(1)" }, { filter: "brightness(1.38)", duration: 2.6, yoyo: true, repeat: 1, ease: "power1.inOut" }, 168.5);

      // ---- built to keep running ----
      show(".hww-cap-running", 176.5, 5);
      hide(".hww-cap-running", 192.5, 4);
      tl.to(cam, { x: 24, y: -8, z: 88, rotationX: 5, rotationY: -3.5, duration: 15, ease: "power2.inOut" }, 176);
      tl.to(".xp-ai-chip", { opacity: 0, duration: 1.2 }, 177);
      // the shared enquiry record advances — Inbox, CRM and the log all agree
      tl.to(q(".xp-status-new"), { opacity: 0, duration: 1.2, stagger: 0.25 }, 177.5);
      tl.to(q(".xp-status-logged"), { opacity: 1, duration: 1.2, stagger: 0.25 }, 177.9);
      packetRun(p1, 179.5, 5.5);
      tl.to(q(".xp-seam"), { opacity: 0.35, duration: 1.8, stagger: 0.2 }, 181);
      tl.to(q(".xp-seam"), { opacity: 0.95, duration: 1.8, stagger: 0.2 }, 185.5);
      packetRun(p2, 186.8, 2.2);

      // =================================================================
      // EXIT — paper returns only here; scene eases back
      // =================================================================
      tl.to(cam, { x: 0, y: -34, z: 235, rotationX: 4, rotationY: 6, duration: 23, ease: "power2.inOut" }, 197);
      tl.to(".xp-unit", { scale: 1, duration: 14, ease: "power2.inOut" }, 198);
      tl.to(".xp-backglow", { opacity: 0, duration: 12 }, 199);

      if (reduced) {
        // Compose the finished state once (no scrub, no pinning): the
        // completed experience at rest, on paper, with all copy readable.
        tl.progress(1);
        tl.pause();
      } else {
        // One scrubbed trigger driving the one timeline — scroll back up and
        // the scene, copy and palette all reverse exactly.
        ScrollTrigger.create({
          id: "how-we-work-scroll",
          animation: tl,
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.1,
          onToggle: (self) => {
            el.dataset.running = String(self.isActive);
          },
          onUpdate: (self) => {
            const p = clamp01(self.progress);
            // dark begins during Launch, holds through Evolve & Approach,
            // and returns to paper only in the exit stretch
            const up = clamp01((p - 0.352) / 0.075);
            const down = clamp01((1 - p) / 0.055);
            applyTheme(Math.min(up, down));
            // keep the diagram's data-state in step with the story
            const t = p * tl.duration();
            const beat = beatFor(t);
            if (sceneRef.current && performance.now() >= forcedBeatUntil.current) {
              sceneRef.current.setAttribute("data-state", String(beat));
            }
          },
        });
      }

      return () => tl.kill();
    }, el);

    if (reduced) {
      el.classList.add("hww-reduced");
      applyTheme(0);
    } else {
      applyTheme(ScrollTrigger.getById("how-we-work-scroll")?.progress ?? 0);
    }

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jump the pinned story to a beat (no-op when pinning is disabled).
  // An instant scroll keeps the scrub monotonic; a trailing sync writes the
  // settled beat after the short chase, for any reader arriving late.
  const seekTo = (time: number) => {
    const st = ScrollTrigger.getById("how-we-work-scroll");
    if (!st) return;
    const duration = st.animation?.duration?.() ?? 220;
    const p = clamp01(time / duration);
    window.scrollTo({ top: st.start + (st.end - st.start) * p, behavior: "instant" as ScrollBehavior });
    ScrollTrigger.update();
    const seq = pressSeq.current;
    window.setTimeout(() => {
      if (seq !== pressSeq.current) return; // a newer press owns the diagram
      if (performance.now() < forcedBeatUntil.current) return; // still settling
      if (sceneRef.current) sceneRef.current.setAttribute("data-state", String(beatFor(p * duration)));
    }, 360);
  };
  const focusSlot = (scope: "process" | "approach", beat: number) => {
    document
      .querySelector<HTMLElement>(`#${scope} [data-hww-beat="${beat}"] button`)
      ?.scrollIntoView({ block: "center" });
  };
  const pressProcess = (i: number) => {
    pressSeq.current += 1;
    forcedBeatUntil.current = performance.now() + 320;
    if (sceneRef.current) {
      sceneRef.current.setAttribute("data-state", prefersReducedMotion() ? "5" : String(i));
    }
    focusSlot("process", i);
    seekTo(PROCESS_BEAT_T[i]);
  };
  const pressApproach = (i: number) => {
    pressSeq.current += 1;
    forcedBeatUntil.current = performance.now() + 320;
    setActivePrinciple(i);
    focusSlot("approach", i + 6);
    seekTo(APPROACH_BEAT_T[i]);
  };

  return (
    <section ref={root} className={`hww ${ink ? "on-ink" : ""}`} aria-labelledby="hww-title">
      {/* ================= PINNED VIEWPORT ================= */}
      <div className="hww-sticky-viewport">
        <div className="hww-room" aria-hidden="true">
          <div className="hww-room-glow-light" />
          <div className="hww-room-glow-dark" />
          <div className="hww-vignette" />
          <div className="hww-horizon" />
        </div>

        {/* ================= 3D SCENE ================= */}
        <div className="hww-scene" aria-hidden="true" ref={sceneRef} data-pv-diagram data-state="0">
          <div className="hww-cam-scale">
            <div className="hww-camera">
              <div className="hww-floor">
                <div className="hww-floor-light" />
                <div className="hww-floor-dark" />
              </div>
              <div className="hww-contact-shadow" />

              {/* ===== THE EXPERIENCE — one persistent digital product ===== */}
              <div className="xp-unit">
                <div className="xp-slab">
                  {/* slab shell */}
                  <div className="xp-edge xp-edge-top" />
                  <div className="xp-edge xp-edge-bottom" />
                  <div className="xp-edge xp-edge-left" />
                  <div className="xp-edge xp-edge-right" />
                  <div className="xp-back" />
                  <div className="xp-backglow" />

                  {/* lime seams where the tools meet the experience */}
                  <div className="xp-seam xp-seam-inbox" />
                  <div className="xp-seam xp-seam-crm" />
                  <div className="xp-seam xp-seam-sheets" />

                  {/* ===== FRONT FACE ===== */}
                  <div className="xp-face">
                    <div className="xp-chrome">
                      <div className="xp-chrome-dots"><i /><i /><i /></div>
                      <div className="xp-chrome-pill">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round">
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                        <span className="xp-chrome-pill-bar" />
                      </div>
                    </div>

                    {/* ===== THE PAGE ===== */}
                    <div className="xp-page">
                      {/* nav */}
                      <div className="xp-nav">
                        <div className="xp-nav-left">
                          <span className="xp-mark"><i /></span>
                          <span className="xp-word">STUDIO</span>
                        </div>
                        <div className="xp-nav-links">
                          <span className="xp-nav-link">WORK</span>
                          <span className="xp-nav-link">SERVICES</span>
                          <span className="xp-nav-link xp-nav-link-contact">CONTACT<span className="xp-nav-underline xp-nav-underline-contact" /></span>
                        </div>
                        <span className="xp-nav-cta"><span className="xp-cta-label"><i className="xp-cta-old">Get in touch</i><i className="xp-cta-new">Start a project</i></span></span>
                      </div>

                      {/* kicker — lands with the build */}
                      <span className="xp-kicker">WELCOME</span>

                      {/* headline — useful content, present from the start */}
                      <h4 className="xp-headline" aria-hidden="true">
                        <span className="xp-hl"><span>Good work,</span></span>
                        <span className="xp-hl"><span>done properly.</span></span>
                      </h4>

                      {/* what this page offers */}
                      <span className="xp-tagline">Websites, video and AI automation — one system.</span>

                      {/* the action slot (the gap) → planned → real button */}
                      <span className="xp-cta-slot"><span className="xp-cta-slot-pulse" /></span>
                      <span className="xp-void-tag">NO CLEAR NEXT STEP</span>
                      <span className="xp-cta-plan" />
                      <span className="xp-cta-btn"><span className="xp-cta-label"><i className="xp-cta-old">Get in touch</i><i className="xp-cta-new">Start a project</i></span><i className="xp-cta-dot" /></span>

                      {/* ===== the enquiry panel — the page's contact form ===== */}
                      <div className="xp-panel">
                        {/* pre-build: the unfinished form shape */}
                        <div className="xp-panel-skel" aria-hidden="true">
                          <i className="xp-panel-skel-head" />
                          <i className="xp-panel-skel-row" />
                          <div className="xp-panel-skel-half"><i /><i /></div>
                          <i className="xp-panel-skel-row xp-panel-skel-wide" />
                        </div>
                        {/* design: the planned form, dashed outline */}
                        <div className="xp-panel-plan" aria-hidden="true">
                          <span className="xp-panel-plan-tag">PROJECT ENQUIRY</span>
                          <span className="xp-panel-plan-row" />
                          <span className="xp-panel-plan-row xp-panel-plan-half" />
                          <span className="xp-panel-plan-row xp-panel-plan-wide" />
                        </div>
                        {/* built: the live form, then its confirmation */}
                        <div className="xp-panel-live">
                          <div className="xp-form-inner">
                            <div className="xp-panel-head">
                              <span className="xp-panel-title">PROJECT ENQUIRY</span>
                              <span className="xp-panel-note">WE REPLY BY EMAIL</span>
                            </div>
                            <div className="xp-fields-row">
                              <div className="xp-field">
                                <span className="xp-field-label">NAME</span>
                                <span className="xp-field-box"><span className="xp-field-ph">Your name</span></span>
                              </div>
                              <div className="xp-field">
                                <span className="xp-field-label">EMAIL</span>
                                <span className="xp-field-box xp-field-emailbox">
                                  <span className="xp-email-text">you@example.com</span>
                                  <span className="xp-field-caret" />
                                  <svg className="xp-field-check" viewBox="0 0 24 24" fill="none"><path d="M5 12.6l4.6 4.6L19 7.4" pathLength={100} strokeDasharray={100} /></svg>
                                </span>
                              </div>
                            </div>
                            <div className="xp-field xp-field-message">
                              <span className="xp-field-label">MESSAGE</span>
                              <span className="xp-field-box xp-field-messagebox"><span className="xp-field-ph">What are you building?</span></span>
                            </div>
                            <div className="xp-panel-foot">
                              <span className="xp-submit">SEND ENQUIRY<i className="xp-submit-arrow" /></span>
                            </div>
                          </div>
                          <div className="xp-confirm">
                            <svg className="xp-confirm-check" viewBox="0 0 48 48" fill="none">
                              <circle className="xp-check-ring" cx="24" cy="24" r="18" pathLength={100} strokeDasharray={100} />
                              <path className="xp-check-tick" d="M15.5 24.5l6.4 6.4L33 18" pathLength={100} strokeDasharray={100} />
                            </svg>
                            <span className="xp-confirm-title">ENQUIRY RECEIVED</span>
                            <span className="xp-confirm-sub">We&rsquo;ll get back to you by email.</span>
                            <span className="xp-confirm-note">YOUR MESSAGE IS IN THE INBOX</span>
                          </div>
                        </div>
                      </div>

                      {/* three offering columns */}
                      <div className="xp-card-col xp-card-col-1">
                        <div className="xp-card-top">
                          <span className="xp-card-index">01</span>
                          <span className="xp-card-icon">
                            <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg>
                          </span>
                        </div>
                        <span className="xp-card-label">VIDEO</span>
                        <span className="xp-card-bar xp-card-bar-short" />
                      </div>
                      <div className="xp-card-col xp-card-col-2">
                        <div className="xp-card-top">
                          <span className="xp-card-index">02</span>
                          <span className="xp-card-icon">
                            <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /></svg>
                          </span>
                        </div>
                        <span className="xp-card-label">WEB</span>
                        <span className="xp-card-bar xp-card-bar-short" />
                      </div>
                      <div className="xp-card-col xp-card-col-3">
                        <div className="xp-card-top">
                          <span className="xp-card-index">03</span>
                          <span className="xp-card-icon">
                            <svg viewBox="0 0 24 24"><path d="M12 3l1.9 5.7L20 10.6l-6.1 1.9L12 18.4l-1.9-5.9L4 10.6l6.1-1.9z" /></svg>
                          </span>
                        </div>
                        <span className="xp-card-label">AI AUTOMATION</span>
                        <span className="xp-card-bar xp-card-bar-short" />
                      </div>

                      {/* page footer — the shared action appears a third time */}
                      <div className="xp-foot">
                        <span className="xp-foot-word"><i />STUDIO</span>
                        <span className="xp-foot-mid">VIDEO · WEB · AUTOMATION</span>
                        <span className="xp-foot-cta"><span className="xp-cta-label"><i className="xp-cta-old">Get in touch</i><i className="xp-cta-new">Start a project</i></span><span className="xp-foot-arrow">→</span></span>
                      </div>

                      {/* the visitor's journey through the page */}
                      <svg className="xp-route" viewBox="0 0 660 430" fill="none">
                        <path
                          className="xp-route-path"
                          pathLength={100}
                          d="M 96 30 C 232 62, 40 112, 128 170 C 166 200, 92 220, 100 249"
                        />
                        <path
                          className="xp-route-flash"
                          pathLength={100}
                          strokeDasharray="100"
                          d="M 96 30 C 232 62, 40 112, 128 170 C 166 200, 92 220, 100 249"
                          stroke="#c8f14f"
                          strokeWidth="3.4"
                          strokeLinecap="round"
                        />
                        <circle className="xp-route-halo" cx="96" cy="30" r="10" />
                        <circle className="xp-route-dot" cx="96" cy="30" r="4.6" />
                      </svg>

                      {/* drafting guides (Design) */}
                      <div className="xp-guides">
                        <span className="xp-guide xp-guide-v" style={{ left: 26, transform: "scaleY(0)", transformOrigin: "50% 0%" }} />
                        <span className="xp-guide xp-guide-v" style={{ left: 250, transform: "scaleY(0)", transformOrigin: "50% 0%" }} />
                        <span className="xp-guide xp-guide-v" style={{ left: 494, transform: "scaleY(0)", transformOrigin: "50% 0%" }} />
                        <span className="xp-guide xp-guide-h" style={{ top: 96, transform: "scaleX(0)", transformOrigin: "0% 50%" }} />
                        <span className="xp-guide xp-guide-h" style={{ top: 288, transform: "scaleX(0)", transformOrigin: "0% 50%" }} />
                        <span className="xp-crop xp-crop-tl" style={{ transform: "scale(0.6)", transformOrigin: "0% 0%" }} />
                        <span className="xp-crop xp-crop-tr" style={{ transform: "scale(0.6)", transformOrigin: "100% 0%" }} />
                        <span className="xp-crop xp-crop-bl" style={{ transform: "scale(0.6)", transformOrigin: "0% 100%" }} />
                        <span className="xp-crop xp-crop-br" style={{ transform: "scale(0.6)", transformOrigin: "100% 100%" }} />
                      </div>

                      {/* build scan band + evolve focus frame */}
                      <span className="xp-scan" />
                      <span className="xp-update-frame" />
                    </div>

                    {/* glass above everything in the face */}
                    <div className="xp-sheen" />
                    <div className="xp-flare" />
                    <div className="xp-ai-chip">
                      <div className="xp-ai-row">
                        <svg className="xp-ai-spark" viewBox="0 0 24 24" fill="none" stroke="#c8f14f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3l1.9 5.7L20 10.6l-6.1 1.9L12 18.4l-1.9-5.9L4 10.6l6.1-1.9z" />
                        </svg>
                        <span className="xp-ai-title">AI ASSIST</span>
                        <span className="xp-ai-optional">OPTIONAL</span>
                      </div>
                      <p className="xp-ai-sub">Drafts the reply. You approve it.</p>
                      <span className="xp-ai-line" />
                      <div className="xp-ai-toggle"><span className="xp-ai-knob" /></div>
                    </div>
                  </div>

                  {/* ===== THE TOOLS — dock modules the experience joins ===== */}
                  <div className="dock dock-inbox">
                    <span className="dock-port" />
                    <div className="dock-face">
                      <div className="dock-head">
                        <span className="dock-icon">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
                          </svg>
                        </span>
                        <span className="dock-name">INBOX</span>
                      </div>
                      <div className="dock-enquiry">
                        <div className="dock-enq-row">
                          <i className="dock-enq-dot" />
                          <span className="dock-enq-title">ENQUIRY</span>
                          <span className="xp-status"><b className="xp-status-new">NEW</b><b className="xp-status-logged">LOGGED</b></span>
                        </div>
                        <span className="dock-enq-src">VIA CONTACT FORM</span>
                      </div>
                      <div className="xp-draft-row">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.6l4.6 4.6L19 7.4" pathLength={100} /></svg>
                        <span className="xp-draft-text">REPLY DRAFT · FOR REVIEW</span>
                      </div>
                    </div>
                  </div>

                  <div className="dock dock-crm">
                    <span className="dock-port" />
                    <div className="dock-face">
                      <div className="dock-head">
                        <span className="dock-icon">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8.4" r="3.4" /><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
                          </svg>
                        </span>
                        <span className="dock-name">CRM</span>
                      </div>
                      <div className="dock-enquiry">
                        <div className="dock-enq-row">
                          <i className="dock-enq-dot" />
                          <span className="dock-enq-title">LEAD</span>
                          <span className="xp-status"><b className="xp-status-new">NEW</b><b className="xp-status-logged">LOGGED</b></span>
                        </div>
                        <span className="dock-enq-src">VIA CONTACT FORM</span>
                      </div>
                    </div>
                  </div>

                  <div className="dock dock-sheets">
                    <span className="dock-port" />
                    <div className="dock-face">
                      <div className="dock-head">
                        <span className="dock-icon">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M4 15h16M10 4v16M15 4v16" />
                          </svg>
                        </span>
                        <span className="dock-name">SHEETS</span>
                      </div>
                      <div className="dock-enquiry">
                        <div className="dock-enq-row">
                          <i className="dock-enq-dot" />
                          <span className="dock-enq-title">ENTRY</span>
                          <span className="xp-status"><b className="xp-status-new">NEW</b><b className="xp-status-logged">LOGGED</b></span>
                        </div>
                        <span className="dock-enq-src">VIA CONTACT FORM</span>
                      </div>
                    </div>
                  </div>

                  {/* ===== signal packet: the lead leaving the page ===== */}
                  <svg className="xp-packets" viewBox="0 0 890 472" fill="none" aria-hidden="true">
                    <path
                      className="xp-packet-path"
                      pathLength={100}
                      d="M 560 234 C 645 232, 666 175, 661 112"
                    />
                    <path
                      className="xp-packet-path-2"
                      pathLength={100}
                      d="M 661 112 L 661 248"
                    />
                    <circle className="xp-packet-halo" cx="560" cy="234" r="9" />
                    <circle className="xp-packet" cx="560" cy="234" r="4.2" />
                    <circle className="xp-packet-halo-2" cx="661" cy="112" r="9" />
                    <circle className="xp-packet-2" cx="661" cy="112" r="4.2" />
                  </svg>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= EDITORIAL TEXT — synced with the scene ================= */}
        <div className="hww-overlay">
          {/* Process masthead */}
          <header className="hww-mast hww-mast-process">
            <p className="mono mono-a hww-mast-kicker">How we work</p>
            <h2 id="hww-title">From first conversation to a system that keeps improving.</h2>
          </header>

          {/* The six stages — titles and descriptions verbatim */}
          {steps.map((step) => (
            <div
              key={step.n}
              className={`hww-cap hww-cap-${step.k.toLowerCase()} hww-cap-${CAP_SIDE[step.k.toLowerCase()]}`}
            >
              <span className="hww-cap-index"><span className="numeral">{step.n}</span></span>
              <h3>{step.k}</h3>
              <p>{step.v}</p>
            </div>
          ))}

          {/* Approach masthead */}
          <header className="hww-mast hww-mast-approach">
            <p className="mono mono-a hww-mast-kicker">Approach</p>
            <h2>Good systems don&rsquo;t add more work.</h2>
            <p className="hww-mast-sub">They remove it.</p>
          </header>

          {/* The four principles — verbatim */}
          {principles.map((item, i) => (
            <div
              key={item.k}
              className={`hww-cap hww-cap-${["systems", "ai", "design-eng", "running"][i]} hww-cap-${CAP_SIDE[["systems", "ai", "design-eng", "running"][i]]}`}
            >
              <span className="hww-cap-index"><span className="numeral">0{i + 1}</span></span>
              <h3>{item.k}</h3>
              <p>{item.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll track & chapter triggers — anchors unchanged.
          The beat buttons stay in the document for assistive technology:
          visually hidden until focused, always keyboard-operable. */}
      <div className="hww-scroll-track">
        <div id="process" data-chapter="Process" className="hww-trigger-zone hww-trigger-process" role="group" aria-label="Process, six stages">
          {steps.map((step, i) => (
            <div key={step.n} data-hww-beat={i} className="hww-beat-slot" style={{ top: `${(PROCESS_BEAT_T[i] / 220) * 100}%` }}>
              <button
                type="button"
                className="hww-beat"
                onClick={() => pressProcess(i)}
                onFocus={() => pressProcess(i)}
              >
                {`${step.n} ${step.k} — ${step.v}`}
              </button>
            </div>
          ))}
        </div>
        <div id="approach" data-chapter="Approach" className="hww-trigger-zone hww-trigger-approach" role="group" aria-label="Approach, four principles">
          {principles.map((item, i) => (
            <div key={item.k} data-hww-beat={i + 6} className="hww-beat-slot" style={{ top: `${(APPROACH_BEAT_T[i] / 220) * 100}%` }}>
              <button
                type="button"
                className="hww-beat"
                aria-pressed={activePrinciple === i}
                onClick={() => pressApproach(i)}
                onFocus={() => pressApproach(i)}
              >
                {`0${i + 1} ${item.k} — ${item.v}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="hww-exit" aria-hidden="true" />
    </section>
  );
}
