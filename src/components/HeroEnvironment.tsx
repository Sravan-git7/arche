import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";
import { isIntroActive } from "./Intro";

/**
 * ARCHE HERO ARCHITECTURAL SPATIAL SCENE
 *
 * Visualizing Arche's core positioning:
 * "We don't build services. We architect systems."
 *
 * ARCHITECTURAL CHOREOGRAPHY:
 * - ACT 1: GRID & COORDINATE GENESIS (0.0s – 0.4s)
 *   Fine isometric projection axes, registration crosshairs, and spatial grid markers
 *   etch themselves into the perspective field.
 *
 * - ACT 2: ARCHITECTURAL CONVERGENCE (0.2s – 1.4s)
 *   Five articulated functional tiers (Ingestion, Routing Kernel, System Core,
 *   Execution Bus, Interface Gateway) converge along isometric trajectories
 *   into a synchronized structural system.
 *
 * - ACT 3: STRUCTURAL BUS INTERCONNECTION (0.5s – 1.2s)
 *   Multi-tier vertical connector conduits and bus lines draw between the plates,
 *   physically locking the architecture into a coherent matrix.
 *
 * - ACT 4: SIGNAL INTAKE & CORE IGNITION (0.55s – 1.6s)
 *   A requirement enters along the blueprint trajectory vector from REQ // IN into the
 *   central anchor on the ARCHE CORE motherboard.
 *   On arrival (1.35s), dual concentric radar pulses emanate outward and circuit traces
 *   illuminate in a cascading ignition.
 *
 * - ACT 5: RESONANT LIVING SYSTEM (1.8s+)
 *   Calm respiration on the signal dot, ambient micro-traffic along the conduit bus,
 *   and smooth 3-plane cursor depth parallax (front 14px, mid 8px, back 3px, lerp 0.08).
 *
 * SCROLL DYNAMICS:
 * - Scrubbed over 100vh with no pin: scales 1 -> 0.86, lifts y: -4vh, fades to opacity: 0.15.
 * - Signal dot maintains continuous spatial registration for handoff to Problem section.
 */

type DepthLayer = "back" | "middle" | "front";

type SubsystemDetail = {
  tierNumber: string;
  subsystemName: string;
  metric: string;
  status: string;
  channels: string[];
};

type Plate = {
  w: number;
  h: number;
  top: number;
  left: number;
  layer: DepthLayer;
  edge: boolean;
  tag: string;
  subsystem: SubsystemDetail;
};

const PLATES: Plate[] = [
  {
    w: 62,
    h: 28,
    top: 14,
    left: 24,
    layer: "back",
    edge: false,
    tag: "SYS // 01",
    subsystem: {
      tierNumber: "01",
      subsystemName: "INGESTION STREAM",
      metric: "RATE // 10.4 kb/s",
      status: "SYNCED",
      channels: ["WEB", "API", "FLOW"],
    },
  },
  {
    w: 58,
    h: 27,
    top: 22,
    left: 14,
    layer: "middle",
    edge: true,
    tag: "SYS // 02",
    subsystem: {
      tierNumber: "02",
      subsystemName: "ORCHESTRATION KERNEL",
      metric: "LOGIC // OPTIMAL",
      status: "ROUTING",
      channels: ["ROUTER", "DECIDE", "DISPATCH"],
    },
  },
  {
    w: 52,
    h: 25,
    top: 36,
    left: 30,
    layer: "middle",
    edge: false,
    tag: "ARCHE // CORE",
    subsystem: {
      tierNumber: "00",
      subsystemName: "ARCHITECTURAL MATRIX",
      metric: "COUPLING // 100%",
      status: "STABLE",
      channels: ["AI-AGENT", "PIPELINE", "SHARED-DATA"],
    },
  },
  {
    w: 44,
    h: 21,
    top: 51,
    left: 16,
    layer: "front",
    edge: true,
    tag: "SYS // 03",
    subsystem: {
      tierNumber: "03",
      subsystemName: "EXECUTION BUS",
      metric: "THREADS // 4 ACTIVE",
      status: "ARMED",
      channels: ["VIDEO", "WEB", "CRM"],
    },
  },
  {
    w: 34,
    h: 17,
    top: 64,
    left: 40,
    layer: "front",
    edge: false,
    tag: "SYS // 04",
    subsystem: {
      tierNumber: "04",
      subsystemName: "INTERFACE GATEWAY",
      metric: "LATENCY // <1ms",
      status: "ONLINE",
      channels: ["SURFACE", "TELEMETRY"],
    },
  },
];

const SIGNAL_PLATE = 2;

// Disconnected starting offsets for each plate to converge into architectural registration
const PLATE_OFFSETS = [
  { x: 45, y: -55 },
  { x: -75, y: -30 },
  { x: -40, y: 65 },
  { x: -65, y: 60 },
  { x: 55, y: 50 },
];

export function HeroEnvironment() {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReduced), []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const plates = gsap.utils.toArray<HTMLElement>(".hp-plate", el);
    const limeEdges = gsap.utils.toArray<SVGElement>(".hp-lime-edge", el);
    const connectors = gsap.utils.toArray<SVGElement>(".hp-plate-connector", el);
    const crosshairs = gsap.utils.toArray<HTMLElement>(".hp-crosshair, .hp-tag, .hp-telemetry", el);
    const circuitLines = gsap.utils.toArray<SVGElement>(".hp-circuit-trace", el);
    const intakeTrack = el.querySelector<SVGElement>(".hp-intake-track");
    const intakeNode = el.querySelector<SVGElement>(".hp-intake-node, .hp-intake-label");
    const signal = el.querySelector<HTMLElement>(".hp-signal");
    const pulse1 = el.querySelector<HTMLElement>(".hp-signal-pulse-1");
    const pulse2 = el.querySelector<HTMLElement>(".hp-signal-pulse-2");
    const pulseRings = gsap.utils.toArray<SVGElement>(".hp-core-radar-ring", el);

    // Architectural isometric angle is fixed on plates
    gsap.set(plates, { rotationX: 58, rotationZ: -34, transformOrigin: "50% 50%" });

    const reduce = reduced || prefersReducedMotion();
    if (reduce) {
      gsap.set(plates, { x: 0, y: 0, opacity: 1 });
      gsap.set(limeEdges, { drawSVG: "100%" });
      if (circuitLines.length) gsap.set(circuitLines, { drawSVG: "100%", opacity: 0.6 });
      if (connectors.length) gsap.set(connectors, { drawSVG: "100%" });
      if (crosshairs.length) gsap.set(crosshairs, { opacity: 1 });
      if (pulseRings.length) gsap.set(pulseRings, { opacity: 0.35 });
      if (intakeTrack) gsap.set(intakeTrack, { drawSVG: "100%" });
      if (intakeNode) gsap.set(intakeNode, { opacity: 0.75 });
      gsap.set(signal, { x: 0, y: 0, opacity: 1, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // HERO SCROLL-OUT (scrubbed, scrub 0.6, over the first 100vh, no pin):
      // - Planes scale 1 to 0.86, move up 4vh, fade to opacity 0.15
      const scrollOut = gsap.timeline({
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top top",
          end: "+=100%",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      scrollOut.to(el, { scale: 0.86, y: "-4vh", opacity: 0.15, ease: "none" }, 0);

      // HERO IDLE: desktop only (min-width: 768px with fine pointer).
      // Three plane depth layers follow the pointer: front 14px, middle 8px, back 3px, smoothed with a lerp of 0.08.
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (hover: hover) and (pointer: fine)", () => {
        const frontEls = el.querySelectorAll<HTMLElement>(".hp-layer-front");
        const midEls = el.querySelectorAll<HTMLElement>(".hp-layer-middle");
        const backEls = el.querySelectorAll<HTMLElement>(".hp-layer-back");

        const frontX = gsap.quickSetter(frontEls, "x", "px");
        const frontY = gsap.quickSetter(frontEls, "y", "px");
        const midX = gsap.quickSetter(midEls, "x", "px");
        const midY = gsap.quickSetter(midEls, "y", "px");
        const backX = gsap.quickSetter(backEls, "x", "px");
        const backY = gsap.quickSetter(backEls, "y", "px");

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const onPointerMove = (e: PointerEvent) => {
          targetX = (e.clientX / window.innerWidth - 0.5) * 2;
          targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        const tickerCb = () => {
          currentX += (targetX - currentX) * 0.08;
          currentY += (targetY - currentY) * 0.08;

          frontX(currentX * 14);
          frontY(currentY * 14 * 0.6);
          midX(currentX * 8);
          midY(currentY * 8 * 0.6);
          backX(currentX * 3);
          backY(currentY * 3 * 0.6);
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        gsap.ticker.add(tickerCb);

        return () => {
          window.removeEventListener("pointermove", onPointerMove);
          gsap.ticker.remove(tickerCb);
          gsap.set([frontEls, midEls, backEls], { x: 0, y: 0 });
        };
      });

      // Initial state before reveal: disconnected geometric plates at spatial offsets
      plates.forEach((p, idx) => {
        const offset = PLATE_OFFSETS[idx] || { x: -60, y: 60 };
        gsap.set(p, { x: offset.x, y: offset.y, opacity: 0 });
      });
      gsap.set(limeEdges, { drawSVG: "0%" });
      if (circuitLines.length) gsap.set(circuitLines, { drawSVG: "0%", opacity: 0 });
      if (connectors.length) gsap.set(connectors, { drawSVG: "0%" });
      if (crosshairs.length) gsap.set(crosshairs, { opacity: 0 });
      if (pulseRings.length) gsap.set(pulseRings, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" });
      if (intakeTrack) gsap.set(intakeTrack, { drawSVG: "0%" });
      if (intakeNode) gsap.set(intakeNode, { opacity: 0 });

      // Signal dot intake start position relative to resting anchor:
      // Anchor is at (56%, 48.5%) of Plate 2, Intake node is at (14%, 22%)
      const plate2El = plates[SIGNAL_PLATE];
      const pW = plate2El ? plate2El.offsetWidth : 320;
      const pH = plate2El ? plate2El.offsetHeight : 160;
      const startX = -0.42 * pW;
      const startY = -0.265 * pH;

      gsap.set(signal, { x: startX, y: startY, opacity: 0, scale: 0.5 });
      if (pulse1) gsap.set(pulse1, { scale: 1, opacity: 0 });
      if (pulse2) gsap.set(pulse2, { scale: 1, opacity: 0 });

      const entrance = gsap.timeline({ paused: true });

      // ACT 2: ARCHITECTURE — Disconnected geometric plates converge into unified registration
      plates.forEach((p, idx) => {
        entrance.to(
          p,
          {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 1.35,
            ease: "power3.out",
          },
          idx * 0.1
        );
      });

      // Perimeter lime edges draw across as plates settle
      entrance.to(
        limeEdges,
        {
          drawSVG: "100%",
          duration: 0.7,
          ease: "power2.inOut",
          stagger: 0.1,
        },
        0.25
      );

      // Blueprint internal circuit lines trace across each tier
      if (circuitLines.length) {
        entrance.to(
          circuitLines,
          {
            drawSVG: "100%",
            opacity: 0.5,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.06,
          },
          0.35
        );
      }

      // Corner crosshairs, technical tags, and telemetry metrics snap in
      if (crosshairs.length) {
        entrance.to(
          crosshairs,
          {
            opacity: 1,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.04,
          },
          0.38
        );
      }

      // Vertical structural connector hairlines draw between registering plate tiers
      if (connectors.length) {
        entrance.to(
          connectors,
          {
            drawSVG: "100%",
            duration: 0.65,
            ease: "power2.out",
            stagger: 0.12,
          },
          0.4
        );
      }

      // Core architectural radar rings bloom
      if (pulseRings.length) {
        entrance.to(
          pulseRings,
          {
            opacity: 0.35,
            scale: 1,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.1,
          },
          0.48
        );
      }

      // ACT 1: SIGNAL — Requirement enters along precise architectural trajectory vector
      if (intakeTrack) {
        entrance.to(
          intakeTrack,
          {
            drawSVG: "100%",
            duration: 0.8,
            ease: "power2.inOut",
          },
          0.45
        );
      }

      if (intakeNode) {
        entrance.to(
          intakeNode,
          {
            opacity: 0.75,
            duration: 0.35,
            ease: "power2.out",
          },
          0.45
        );
      }

      // Signal dot appears at intake port and glides along vector path to central system anchor
      entrance.to(
        signal,
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        },
        0.55
      );

      entrance.to(
        signal,
        {
          x: 0,
          y: 0,
          duration: 0.75,
          ease: "power2.inOut",
        },
        0.55
      );

      // Arrival & lock-in: signal snaps into the anchor with concentric pulses
      entrance.to(
        signal,
        {
          scale: 1.25,
          duration: 0.1,
          ease: "power1.out",
        },
        1.3
      );
      entrance.to(
        signal,
        {
          scale: 1,
          duration: 0.12,
          ease: "power1.in",
        },
        1.4
      );

      // Concentric signal pulse 1 (crisp expansion)
      if (pulse1) {
        entrance.fromTo(
          pulse1,
          { scale: 1, opacity: 0.75 },
          { scale: 2.8, opacity: 0, duration: 0.85, ease: "power2.out" },
          1.3
        );
      }

      // Concentric signal pulse 2 (broader radar expansion)
      if (pulse2) {
        entrance.fromTo(
          pulse2,
          { scale: 1, opacity: 0.5 },
          { scale: 4.4, opacity: 0, duration: 1.05, ease: "power2.out" },
          1.46
        );
      }

      // Calm breathing idle respiration at rest
      entrance.to(
        signal,
        {
          y: -5,
          duration: 2.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        },
        2.0
      );

      // Ambient system heartbeat pulse traversing structural connectors
      if (connectors.length) {
        entrance.to(
          connectors,
          {
            stroke: "var(--accent)",
            strokeWidth: 1.5,
            duration: 0.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            repeatDelay: 3.5,
            stagger: 0.25,
          },
          2.4
        );
      }

      let cleanupReveal = () => {};
      if (!isIntroActive()) {
        // Same-session reload: planes already in resting position
        gsap.set(plates, { x: 0, y: 0, opacity: 1 });
        gsap.set(limeEdges, { drawSVG: "100%" });
        if (circuitLines.length) gsap.set(circuitLines, { drawSVG: "100%", opacity: 0.5 });
        if (connectors.length) gsap.set(connectors, { drawSVG: "100%" });
        if (crosshairs.length) gsap.set(crosshairs, { opacity: 1 });
        if (pulseRings.length) gsap.set(pulseRings, { opacity: 0.35, scale: 1 });
        if (intakeTrack) gsap.set(intakeTrack, { drawSVG: "100%" });
        if (intakeNode) gsap.set(intakeNode, { opacity: 0.75 });
        gsap.set(signal, { x: 0, y: 0, opacity: 1, scale: 1 });
        gsap.to(signal, {
          y: -5,
          duration: 2.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      } else {
        const onHeroReveal = () => {
          entrance.play();
        };
        window.addEventListener("arche:hero-reveal-start", onHeroReveal, { once: true });
        const failsafe = window.setTimeout(onHeroReveal, 3200);
        cleanupReveal = () => {
          window.removeEventListener("arche:hero-reveal-start", onHeroReveal);
          window.clearTimeout(failsafe);
        };
      }

      return () => {
        cleanupReveal();
      };
    }, el);

    return () => {
      ctx.revert();
    };
  }, [reduced]);

  const sp = PLATES[SIGNAL_PLATE];

  return (
    <div
      ref={root}
      className="pointer-events-none absolute top-0 right-0 h-full w-full md:w-[58%]"
      style={{ perspective: 1400, transformStyle: "preserve-3d", opacity: 0.95 }}
      aria-hidden="true"
    >
      {/* Background architectural coordinate matrix rays */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0 opacity-40"
        fill="none"
        aria-hidden="true"
      >
        <line x1="20%" y1="10%" x2="85%" y2="80%" stroke="rgba(12,12,13,0.06)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="15%" y1="75%" x2="75%" y2="15%" stroke="rgba(12,12,13,0.06)" strokeWidth="1" strokeDasharray="4 8" />
      </svg>

      {/* Structural connector conduits between plate tiers */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-[1]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        {/* Tier 01 -> Tier 02 connector */}
        <path
          className="hp-plate-connector"
          d="M 48 24 L 40 28 L 40 34"
          vectorEffect="non-scaling-stroke"
          stroke="rgba(12,12,13,0.22)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        {/* Tier 02 -> Tier 03 (Core) primary bus */}
        <path
          className="hp-plate-connector"
          d="M 36 36 L 36 44 L 46 44"
          vectorEffect="non-scaling-stroke"
          stroke="rgba(12,12,13,0.25)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* Tier 03 (Core) -> Tier 04 connector */}
        <path
          className="hp-plate-connector"
          d="M 52 48 L 52 56 L 38 56"
          vectorEffect="non-scaling-stroke"
          stroke="rgba(12,12,13,0.22)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        {/* Tier 04 -> Tier 05 dispatch connector */}
        <path
          className="hp-plate-connector"
          d="M 38 62 L 48 68"
          vectorEffect="non-scaling-stroke"
          stroke="rgba(12,12,13,0.2)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      </svg>

      {PLATES.map((p, i) => (
        <div
          key={i}
          className={`hp-layer hp-layer-${p.layer} absolute inset-0`}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="hp-par absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div
              className="hp-plate absolute rounded-[1px] transition-shadow duration-500"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.w}%`,
                height: `${p.h}%`,
                border: `1px solid ${p.edge ? "color-mix(in srgb, var(--accent-deep) 75%, transparent)" : "rgba(12,12,13,0.11)"}`,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(235,232,225,0.28)), repeating-linear-gradient(90deg, rgba(12,12,13,0.038) 0 1px, transparent 1px 36px)",
                backdropFilter: "blur(2px)",
                boxShadow: "0 32px 64px -36px rgba(12,12,13,0.22)",
              }}
            >
              {/* Corner crosshair registration marks */}
              <span className="hp-crosshair absolute top-1.5 left-2 text-[7px] font-mono leading-none select-none text-black/35 dark:text-white/35">
                +
              </span>
              <span className="hp-crosshair absolute bottom-1.5 right-2 text-[7px] font-mono leading-none select-none text-black/35 dark:text-white/35">
                +
              </span>
              <span className="hp-crosshair absolute top-1.5 right-2 text-[6.5px] font-mono leading-none select-none text-black/25 dark:text-white/25">
                ┌
              </span>
              <span className="hp-crosshair absolute bottom-1.5 left-2 text-[6.5px] font-mono leading-none select-none text-black/25 dark:text-white/25">
                └
              </span>

              {/* Architectural subsystem classification & metric header */}
              <div className="absolute top-2 left-5 right-5 flex items-center justify-between pointer-events-none select-none">
                <span className="hp-tag font-mono text-[6.5px] tracking-wider text-black/50 dark:text-white/50">
                  {p.tag} · {p.subsystem.subsystemName}
                </span>
                <span className="hp-telemetry font-mono text-[6px] tracking-widest text-[var(--accent-ink)] font-medium">
                  {p.subsystem.status}
                </span>
              </div>

              {/* Subsystem channels / node indicators */}
              <div className="absolute bottom-2 left-5 flex items-center gap-2 pointer-events-none select-none">
                {p.subsystem.channels.map((ch, cIdx) => (
                  <span
                    key={cIdx}
                    className="hp-telemetry inline-flex items-center gap-1 font-mono text-[5.5px] tracking-tight text-black/35 dark:text-white/35"
                  >
                    <span className="inline-block w-[3px] h-[3px] rounded-full bg-[var(--accent)] opacity-60" />
                    {ch}
                  </span>
                ))}
              </div>

              {/* Subsystem telemetry metric callout */}
              <div className="absolute bottom-2 right-5 pointer-events-none select-none">
                <span className="hp-telemetry font-mono text-[5.5px] tracking-wider text-black/40 dark:text-white/40">
                  {p.subsystem.metric}
                </span>
              </div>

              {/* Architectural vector blueprint traces & perimeter conduits */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                {/* Precision lime leading edge */}
                <line
                  className="hp-lime-edge"
                  x1="0"
                  y1="0"
                  x2="100"
                  y2="0"
                  vectorEffect="non-scaling-stroke"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Circuit bus traces inside the plate */}
                <path
                  className="hp-circuit-trace"
                  d="M 12 45 H 40 L 48 60 H 88"
                  vectorEffect="non-scaling-stroke"
                  stroke="rgba(12,12,13,0.12)"
                  strokeWidth="0.75"
                />
                <circle cx="12" cy="45" r="1.5" fill="var(--accent)" opacity="0.6" />
                <circle cx="88" cy="60" r="1.5" fill="rgba(12,12,13,0.2)" />

                {i === SIGNAL_PLATE && (
                  <>
                    {/* Concentric radar rings anchored at the central core */}
                    <circle
                      className="hp-core-radar-ring"
                      cx="56"
                      cy="48.5"
                      r="16"
                      vectorEffect="non-scaling-stroke"
                      stroke="color-mix(in srgb, var(--accent) 35%, transparent)"
                      strokeWidth="0.75"
                      strokeDasharray="2 3"
                    />
                    <circle
                      className="hp-core-radar-ring"
                      cx="56"
                      cy="48.5"
                      r="28"
                      vectorEffect="non-scaling-stroke"
                      stroke="rgba(12,12,13,0.08)"
                      strokeWidth="0.5"
                      strokeDasharray="4 4"
                    />

                    {/* Intake port node */}
                    <circle
                      cx="14"
                      cy="22"
                      r="2.5"
                      fill="none"
                      stroke="var(--accent-deep)"
                      strokeWidth="1"
                      className="hp-intake-node"
                    />
                    <text
                      x="14"
                      y="16"
                      fill="currentColor"
                      className="hp-intake-label font-mono text-[6.5px] select-none text-black/50 dark:text-white/50 font-medium"
                      letterSpacing="0.08em"
                    >
                      REQ // INTAKE
                    </text>

                    {/* Architectural requirement intake vector track */}
                    <line
                      className="hp-intake-track"
                      x1="14"
                      y1="22"
                      x2="56"
                      y2="48.5"
                      vectorEffect="non-scaling-stroke"
                      stroke="color-mix(in srgb, var(--accent) 70%, transparent)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />

                    {/* Central anchor registration crosshair */}
                    <g className="hp-crosshair" opacity="0.5">
                      <line x1="56" y1="40.5" x2="56" y2="56.5" vectorEffect="non-scaling-stroke" stroke="var(--accent-deep)" strokeWidth="0.75" />
                      <line x1="48" y1="48.5" x2="64" y2="48.5" vectorEffect="non-scaling-stroke" stroke="var(--accent-deep)" strokeWidth="0.75" />
                    </g>
                  </>
                )}
              </svg>

              {i === SIGNAL_PLATE && (
                <span
                  data-signal="hero-dot"
                  className="hp-signal signal-dot absolute"
                  style={{
                    left: `${sp.left + sp.w / 2}%`,
                    top: `${sp.top + sp.h / 2}%`,
                    marginLeft: -3,
                    marginTop: -3,
                  }}
                >
                  <span
                    className="hp-signal-pulse hp-signal-pulse-1 absolute inset-0 rounded-full"
                    style={{
                      border: "1px solid var(--accent)",
                      background: "color-mix(in srgb, var(--accent) 30%, transparent)",
                      pointerEvents: "none",
                    }}
                  />
                  <span
                    className="hp-signal-pulse hp-signal-pulse-2 absolute inset-0 rounded-full"
                    style={{
                      border: "1px solid var(--accent)",
                      background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                      pointerEvents: "none",
                    }}
                  />
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Subtle architectural gradient mask keeping headline legibility crisp */}
      <div
        className="absolute inset-y-0 left-0 w-[45%] max-md:hidden pointer-events-none"
        style={{ background: "linear-gradient(90deg, var(--bg) 0%, transparent 100%)", opacity: 0.55 }}
      />
    </div>
  );
}
