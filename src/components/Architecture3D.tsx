import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { getLenis } from "../lib/useLenis";
import { KineticWord } from "./Kinetic";
import { StageGlyph } from "./StageGlyph";
import { CARD, CONVERGE_AT, LAST, STAGES, focusIndex, linkProgress, project } from "../lib/rail3d";

/**
 * PROMPT 13 / 24 / 29 — 3D System Model (Spatial Pinned Rail).
 *
 * PROMPT 29 updates:
 *  - Vertical scroll distance increased by +52% (+=380%) for an unhurried, cinematic move.
 *  - Spacing & padding around all HUD slots, labels, and tooltips increased by 2–3x.
 *  - Continuous subtle camera drift / sway active even when scroll is static.
 *  - Stronger node cluster activation pulse with pronounced brightness and luminous soft bloom.
 *
 * PROMPT 35 updates — the clusters stop being placeholder cards:
 *  - Each stage carries its own line-and-node identity (StageGlyph):
 *    input = converging signals into a socket, intelligence = hub & spoke,
 *    system = the dense interlocking kernel, action = dispatched fan-out,
 *    output = sealed check with verification nodes. The old bar-line
 *    "skeleton" filler inside the planes is gone.
 *  - Depth of field: the focused stage renders sharp and full-ink; distance
 *    continuously desaturates and softens each plane, so the rail reads as
 *    a camera travelling, not a wall of cards.
 *  - Hovering the focused stage now answers on the shape itself — brightness
 *    lift, sharpen, glyph glow, and a faster pulse ring — alongside the
 *    existing role tooltip.
 */

export function Architecture3D() {
  const pinRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const links = useRef<(SVGLineElement | null)[]>([]);
  const railFill = useRef<HTMLSpanElement>(null);
  const labelSwap = useRef<HTMLDivElement>(null);
  const labelTl = useRef<gsap.core.Timeline | null>(null);

  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const [hover, setHover] = useState(false);
  const [converged, setConverged] = useState(false);
  const [rail3d, setRail3d] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches && !prefersReducedMotion()
  );

  // Live camera drift / sway reference
  const driftRef = useRef({ x: 0, y: 0 });
  const scrollProgRef = useRef(0);
  // Hover state mirrored into a ref so the per-frame depth-of-field can
  // brighten/sharpen the shape under the cursor without a React round-trip.
  const hoverRef = useRef(false);

  /* The rail only exists where it can be pinned: desktop, motion allowed. */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => setRail3d(mq.matches && !prefersReducedMotion());
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* ---- the camera rail: one render function of scroll progress ---------- */
  useLayoutEffect(() => {
    const pin = pinRef.current;
    const scene = sceneRef.current;
    if (!pin || !scene || !rail3d) return;

    let box = { w: scene.clientWidth || 900, h: scene.clientHeight || 500 };
    const measure = () => {
      box = { w: scene.clientWidth || box.w, h: scene.clientHeight || box.h };
    };

    let lastActive = -1;
    let lastConv: boolean | null = null;
    let rafId = 0;

    const frame = (p: number, drift = driftRef.current) => {
      scrollProgRef.current = p;
      const pts = STAGES.map((_, i) => project(i, p, box, drift));
      const idx = focusIndex(p);
      // How far the camera is from each stage, in stages (0 = in focus).
      const camAt = p * LAST;

      pts.forEach((pt, i) => {
        const el = cards.current[i];
        if (!el) return;
        // A slight rotateY per cluster turns the rail into a curved wall facing camera
        const tilt = -STAGES[i].ox * 11;
        el.style.transform = `translate3d(${pt.x.toFixed(2)}px, ${pt.y.toFixed(2)}px, 0) scale(${pt.scale.toFixed(4)}) rotateY(${tilt.toFixed(2)}deg) rotateX(3deg)`;
        el.style.opacity = pt.opacity.toFixed(3);
        el.style.visibility = pt.visible ? "visible" : "hidden";
        el.style.zIndex = String(pt.z);

        // Depth of field (PROMPT 35): the focused plane stays sharp and
        // full-ink; every step of distance desaturates and softens the
        // others. Hovering the focused stage lifts brightness, adds a touch
        // of saturation, and pulls the focus back in — the shape answers.
        const dist = Math.abs(i - camAt);
        const hv = i === idx && hoverRef.current && p < CONVERGE_AT ? 1 : 0;
        const sat = Math.max(0.4, 1 - dist * 0.52) + hv * 0.12;
        const blur = Math.max(0, Math.min(1.2, dist * 1.05) - hv * 0.55);
        const bright = 1 - Math.min(0.09, dist * 0.075) + hv * 0.15;
        el.style.filter = `saturate(${sat.toFixed(3)}) brightness(${bright.toFixed(3)}) blur(${blur.toFixed(2)}px)`;
      });

      // Connectors draw in as the camera closes each gap
      for (let i = 0; i < LAST; i += 1) {
        const line = links.current[i];
        if (!line) continue;
        const a = pts[i];
        const b = pts[i + 1];
        const on = a.visible && b.visible;
        const prog = linkProgress(i, p);
        line.setAttribute("x1", a.x.toFixed(2));
        line.setAttribute("y1", a.y.toFixed(2));
        line.setAttribute("x2", b.x.toFixed(2));
        line.setAttribute("y2", b.y.toFixed(2));
        const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        line.setAttribute("stroke-dasharray", `${len.toFixed(2)}`);
        line.setAttribute("stroke-dashoffset", (len * (1 - prog)).toFixed(2));
        line.setAttribute("opacity", (on ? Math.min(a.opacity, b.opacity) * (0.4 + prog * 0.6) : 0).toFixed(3));
        line.setAttribute("stroke-width", prog >= 1 ? "2.2" : "1.4");
      }

      if (railFill.current) railFill.current.style.transform = `scaleY(${p.toFixed(4)})`;

      if (idx !== lastActive) {
        lastActive = idx;
        setActive(idx);
      }
      const conv = p >= CONVERGE_AT;
      if (conv !== lastConv) {
        lastConv = conv;
        setConverged(conv);
        if (conv) {
          setHover(false);
          hoverRef.current = false;
        }
      }
    };

    // Continuous subtle camera drift loop even when scroll position is static
    const animateDrift = (time: number) => {
      if (!prefersReducedMotion()) {
        driftRef.current = {
          x: Math.sin(time * 0.00075) * 8.5,
          y: Math.cos(time * 0.00055) * 5.5,
        };
        frame(scrollProgRef.current, driftRef.current);
      }
      rafId = requestAnimationFrame(animateDrift);
    };
    rafId = requestAnimationFrame(animateDrift);

    const ro = new ResizeObserver(() => {
      measure();
      frame(ScrollTrigger.getById("3d-system-pinned-rail")?.progress ?? 0);
    });
    ro.observe(scene);
    measure();

    const ctx = gsap.context(() => {
      // PROMPT 29: Increased vertical scroll distance from +=250% to +=380% (+52%) for unhurried cinematic travel
      const st = ScrollTrigger.create({
        id: "3d-system-pinned-rail",
        trigger: pin,
        start: "top top",
        end: "+=380%",
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => frame(self.progress),
        onRefresh: (self) => {
          measure();
          frame(self.progress);
        },
      });
      frame(st.progress || 0);
    }, pin);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      ctx.revert();
    };
  }, [rail3d]);

  /* ---- the active-stage label leaves before the next one arrives -------- */
  useEffect(() => {
    const el = labelSwap.current;
    if (!el || shownRef.current === active) return;
    if (prefersReducedMotion()) {
      shownRef.current = active;
      setShown(active);
      return;
    }
    labelTl.current?.kill();
    labelTl.current = gsap
      .timeline()
      .to(el, { autoAlpha: 0, y: -8, duration: 0.16, ease: "power2.in" })
      .add(() => {
        shownRef.current = active;
        setShown(active);
      })
      .fromTo(el, { y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out", immediateRender: false });
  }, [active]);

  useEffect(
    () => () => {
      labelTl.current?.kill();
    },
    []
  );

  /** Clicking a stage number travels the rail there */
  const gotoStage = (i: number) => {
    const st = ScrollTrigger.getById("3d-system-pinned-rail");
    if (!st) return;
    const y = st.start + (i / LAST) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.25 });
    else window.scrollTo({ top: y, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const stage = STAGES[shown];
  const live = STAGES[active];

  return (
    <section
      ref={pinRef}
      id="system-architecture"
      className="relative w-full overflow-hidden border-t border-b"
      style={{ borderColor: "var(--line)", background: "var(--bg)" }}
    >
      {rail3d ? (
        /* ---------- desktop: pinned camera rail ---------- */
        <div className="wrap flex h-[100svh] flex-col justify-center gap-[clamp(16px,2.2vh,28px)] pt-[80px] pb-[28px]">
          <header className="flex flex-none flex-wrap items-end justify-between gap-x-[32px] gap-y-[14px]">
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center gap-[10px]">
                <span className="mono mono-a">03 // SPATIAL ARCHITECTURE</span>
                <span className="mono">·</span>
                <span className="mono">5-STAGE SYSTEM MODEL</span>
              </div>
              <KineticWord
                word="SYSTEM MODEL"
                mode="assemble"
                className="block select-none"
                style={{ fontSize: "clamp(28px,4.4vw,64px)", fontWeight: 600, letterSpacing: "-0.05em", lineHeight: 0.92 }}
              />
            </div>
            <p className="body max-w-[44ch] text-[var(--muted)] leading-relaxed">
              One fixed camera rail. Five clusters along a single depth axis:{" "}
              <strong style={{ color: "var(--fg)" }}>INPUT → INTELLIGENCE → SYSTEM → ACTION → OUTPUT</strong>. Scroll
              travels the rail.
            </p>
          </header>

          {/* ---------- the scene ---------- */}
          <div
            ref={sceneRef}
            className="relative min-h-[440px] w-full flex-1 overflow-hidden rounded-[8px] border shadow-xs"
            style={{
              borderColor: "var(--line)",
              background: "var(--bg-2)",
              perspective: 1200,
              perspectiveOrigin: "50% 50%",
            }}
            aria-label="System model camera rail"
          >
            {/* blueprint ground */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
              aria-hidden
            />
            {/* depth vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(130% 95% at 50% 50%, transparent 40%, color-mix(in srgb, var(--bg-2) 90%, transparent) 100%)",
              }}
              aria-hidden
            />

            {/* connectors between clusters */}
            <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden>
              <defs>
                <filter id="rail-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {STAGES.slice(1).map((s, i) => (
                <line
                  key={`link-${s.id}`}
                  ref={(el) => {
                    links.current[i] = el;
                  }}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="0"
                  stroke="var(--accent-deep)"
                  strokeWidth="1.5"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                  strokeLinecap="round"
                  opacity="0"
                  filter="url(#rail-line-glow)"
                />
              ))}
            </svg>

            {/* the five cluster planes — enhanced bloom & brightness */}
            {STAGES.map((s, i) => {
              const on = i === active;
              return (
                <div
                  key={s.id}
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  className={`absolute top-0 left-0 rounded-[8px] border transition-colors duration-400 ${
                    on ? "cluster-active-bloom" : ""
                  } ${on && hover ? "cluster-hover" : ""}`}
                  style={{
                    width: CARD.w,
                    height: CARD.h,
                    marginLeft: -CARD.w / 2,
                    marginTop: -CARD.h / 2,
                    borderColor: on ? "var(--accent-deep)" : "rgba(12,12,13,0.14)",
                    background: on
                      ? "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(246,252,228,0.96) 50%, rgba(200,241,79,0.18) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(238,235,228,0.14))",
                    boxShadow: on
                      ? "0 0 35px rgba(200, 241, 79, 0.55), 0 0 80px rgba(127, 174, 0, 0.28), 0 30px 60px -20px rgba(12,12,13,0.55)"
                      : "0 26px 50px -42px rgba(12,12,13,0.45)",
                    pointerEvents: on && !converged ? "auto" : "none",
                    cursor: on && !converged ? "help" : "default",
                    willChange: "transform, opacity, filter",
                    transformStyle: "preserve-3d",
                  }}
                  onMouseEnter={() => {
                    if (!on) return;
                    setHover(true);
                    hoverRef.current = true;
                  }}
                  onMouseLeave={() => {
                    setHover(false);
                    hoverRef.current = false;
                  }}
                  aria-hidden
                >
                  {/* Subtle Expanding Pulse Ring on active cluster */}
                  {on && (
                    <span
                      className="cluster-pulse-ring pointer-events-none absolute -inset-[6px] rounded-[12px] border-2 border-[var(--accent)]"
                      aria-hidden
                    />
                  )}

                  {/* Stage identity: a distinct line-and-node glyph per
                      stage (PROMPT 35) — the placeholder bar-lines are
                      gone. Ink is driven by focus state via currentColor. */}
                  <span
                    className="stage-glyph pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      width: 118,
                      color: on ? "var(--accent-deep)" : "var(--faint)",
                      transition: "color .4s var(--e-out), filter .25s var(--e-out)",
                    }}
                  >
                    <StageGlyph id={s.id} animate={on} className="block h-auto w-full" />
                  </span>

                  <span
                    className="mono pointer-events-none absolute top-[12px] left-[15px]"
                    style={{
                      fontSize: 9,
                      letterSpacing: ".16em",
                      color: on ? "var(--accent-deep)" : "var(--faint)",
                      transition: "color .4s var(--e-out)",
                    }}
                  >
                    {s.num}
                  </span>

                  {on && (
                    <>
                      <span className="signal-dot absolute -top-[5px] -right-[5px]" style={{ width: 10, height: 10 }} />
                    </>
                  )}
                </div>
              );
            })}

            {/* ---------- HUD: Generous Padding & Spacing (Prompt 29) ---------- */}

            {/* Left HUD: The Camera Rail */}
            <div
              className="pointer-events-none absolute top-1/2 left-[24px] min-[1200px]:left-[38px] z-[30] -translate-y-1/2 rounded-[8px] border px-[18px] py-[16px]"
              style={{
                width: 224,
                borderColor: "var(--line)",
                background: "var(--bg)",
                boxShadow: "0 18px 40px -24px rgba(12,12,13,0.5)",
                opacity: converged ? 0.35 : 1,
                transition: "opacity .4s var(--e-out)",
              }}
              aria-hidden
            >
              <div className="mb-[12px] flex items-center gap-[8px]">
                <span className="signal-dot" style={{ width: 6, height: 6 }} />
                <span className="mono font-semibold" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "var(--muted)" }}>
                  CAMERA RAIL
                </span>
              </div>
              <div className="relative flex flex-col gap-[4px]">
                <span className="absolute top-[12px] bottom-[12px] left-[5px] w-px" style={{ background: "var(--line)" }} />
                <span
                  ref={railFill}
                  className="absolute top-[12px] bottom-[12px] left-[5px] w-px origin-top"
                  style={{ background: "var(--accent-deep)", transform: "scaleY(0)" }}
                />
                {STAGES.map((s, i) => {
                  const state = i < active ? "past" : i === active ? "now" : "next";
                  return (
                    <span
                      key={s.id}
                      className="relative flex h-[30px] items-center gap-[10px]"
                      style={{
                        opacity: state === "past" ? 0.35 : state === "now" ? 1 : 0.6,
                        transition: "opacity .35s var(--e-out)",
                      }}
                    >
                      <span
                        className="relative z-[1] block h-[10px] w-[10px] flex-none rounded-full"
                        style={{
                          background: state === "now" ? "var(--accent-deep)" : "var(--bg)",
                          border: `1.5px solid ${state === "now" ? "var(--accent-deep)" : "var(--faint)"}`,
                          boxShadow: state === "now" ? "0 0 0 4px color-mix(in srgb, var(--accent-deep) 22%, transparent)" : "none",
                          transition: "all .35s var(--e-out)",
                        }}
                      />
                      <span className="mono" style={{ fontSize: 9.5, color: state === "now" ? "var(--accent-deep)" : "var(--faint)" }}>
                        {s.num}
                      </span>
                      <span
                        className="mono truncate font-medium"
                        style={{
                          fontSize: 10.5,
                          letterSpacing: ".12em",
                          color: state === "now" ? "var(--fg)" : "var(--muted)",
                          transition: "color .35s var(--e-out)",
                        }}
                      >
                        {s.title}
                      </span>
                      <span className="mono ml-auto" style={{ fontSize: 9, color: "var(--faint)" }}>
                        {state === "past" ? "✓" : state === "now" ? "●" : ""}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Top-Right HUD: Hover Tooltip */}
            <div
              className="pointer-events-none absolute top-[24px] min-[1200px]:top-[36px] right-[24px] min-[1200px]:right-[38px] z-[36] max-w-[48%]"
              style={{
                opacity: hover && !converged ? 1 : 0,
                transform: hover && !converged ? "none" : "translateY(-6px)",
                transition: "opacity .25s linear, transform .35s var(--e-out)",
              }}
              aria-hidden={!hover}
            >
              <div
                className="mono block rounded-[6px] px-[18px] py-[14px] shadow-lg"
                style={{
                  background: "var(--fg)",
                  color: "var(--bg)",
                  fontSize: 10.5,
                  lineHeight: 1.6,
                  letterSpacing: ".05em",
                }}
              >
                {live.label}
              </div>
            </div>

            {/* Bottom-Right HUD: Active Stage Card */}
            <div
              className="absolute right-[24px] min-[1200px]:right-[38px] bottom-[24px] min-[1200px]:bottom-[34px] z-[32]"
              style={{
                width: "min(48%, 460px)",
                opacity: converged ? 0 : 1,
                transition: "opacity .4s var(--e-out)",
              }}
              aria-live="polite"
            >
              <div
                ref={labelSwap}
                className="rounded-[8px] border p-[20px_24px] shadow-sm"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--bg)",
                  boxShadow: "0 20px 45px -28px rgba(12,12,13,0.55)",
                }}
              >
                <div className="flex items-baseline justify-between gap-[12px] pb-[10px] border-b" style={{ borderColor: "var(--line)" }}>
                  <span className="mono font-semibold" style={{ color: "var(--accent-deep)", fontSize: 12, letterSpacing: ".1em" }}>
                    {stage.num} // {stage.title}
                  </span>
                  <span className="mono" style={{ color: "var(--muted)", fontSize: 10, letterSpacing: ".08em" }}>
                    {stage.subtitle}
                  </span>
                </div>
                <p className="mono mt-[12px]" style={{ fontSize: 11, lineHeight: 1.65, color: "var(--fg)", letterSpacing: ".03em" }}>
                  {stage.label}
                </p>
              </div>
            </div>

            {/* Centre HUD: Convergence Badge */}
            <div
              className="pointer-events-none absolute inset-0 z-[40] grid place-items-center px-[20px]"
              style={{ opacity: converged ? 1 : 0, transition: "opacity .45s var(--e-out)" }}
              aria-hidden={!converged}
            >
              <div
                className="flex flex-col items-center gap-[16px] rounded-[10px] border px-[36px] py-[28px]"
                style={{
                  borderColor: "var(--accent-deep)",
                  background: "var(--bg)",
                  boxShadow: "0 30px 70px -30px rgba(12,12,13,0.7), 0 0 35px rgba(200, 241, 79, 0.25)",
                  transform: converged ? "scale(1)" : "scale(0.88)",
                  transition: "transform .6s var(--e-out)",
                }}
              >
                <span className="flex items-center gap-[12px]">
                  {STAGES.map((s) => (
                    <span key={s.id} className="signal-dot" style={{ width: 9, height: 9 }} />
                  ))}
                </span>
                <span className="mono font-semibold" style={{ color: "var(--accent-deep)", fontSize: 12, letterSpacing: ".16em" }}>
                  SYSTEM CONVERGED → PROCESS
                </span>
              </div>
            </div>
          </div>

          {/* ---------- rail controls ---------- */}
          <div className="flex flex-none flex-wrap items-center justify-between gap-[14px]">
            <div className="flex items-center gap-[8px]" role="group" aria-label="Jump the camera rail to a stage">
              {STAGES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => gotoStage(i)}
                  aria-current={active === i}
                  aria-label={`${s.num} ${s.title}`}
                  className="mono rounded-full border px-[12px] py-[5px] transition-all duration-300"
                  style={{
                    fontSize: 10,
                    letterSpacing: ".12em",
                    borderColor: active === i ? "var(--accent-deep)" : "var(--line)",
                    background: active === i ? "var(--accent-deep)" : "transparent",
                    color: active === i ? "var(--solid)" : "var(--muted)",
                  }}
                  data-cursor="JUMP"
                >
                  {s.num}
                </button>
              ))}
            </div>
            <span className="mono text-[11px]" style={{ color: "var(--muted)" }}>
              {converged ? "Converged — the system becomes the process" : "Scroll to travel the rail · hover a cluster for its role"}
            </span>
          </div>
        </div>
      ) : (
        /* ---------- mobile / reduced motion: 2D vertical flow ---------- */
        <div className="wrap flex flex-col gap-[24px] py-[clamp(56px,7vw,110px)]">
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center gap-[10px]">
              <span className="mono mono-a">03 // SPATIAL ARCHITECTURE</span>
              <span className="mono">·</span>
              <span className="mono">5-STAGE SYSTEM MODEL</span>
            </div>
            <h2 className="d2" style={{ fontSize: "clamp(30px,7vw,54px)" }}>
              System model.
            </h2>
            <p className="body max-w-[46ch] text-[var(--muted)]">
              Five clusters on one axis: <strong>INPUT → INTELLIGENCE → SYSTEM → ACTION → OUTPUT</strong>.
            </p>
          </div>

          <div className="relative flex flex-col gap-[14px] pl-[28px]">
            <span className="absolute top-[12px] bottom-[12px] left-[8px] w-px" style={{ background: "var(--accent-deep)", opacity: 0.6 }} />
            {STAGES.map((st) => (
              <div
                key={st.id}
                className="relative flex flex-col gap-[8px] rounded-[8px] border p-[20px]"
                style={{ borderColor: "var(--line)", background: "var(--card)" }}
              >
                <span className="absolute top-[24px] left-[-25px] block h-[10px] w-[10px] rounded-full" style={{ background: "var(--accent-deep)" }} />
                <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
                  <span className="mono font-semibold" style={{ color: "var(--accent-deep)", fontSize: 11.5, letterSpacing: ".1em" }}>
                    {st.num} // {st.title}
                  </span>
                  <span className="mono" style={{ color: "var(--muted)", fontSize: 10 }}>
                    {st.subtitle}
                  </span>
                </div>
                <span className="stage-glyph block w-[112px]" style={{ color: "var(--accent-deep)" }}>
                  <StageGlyph id={st.id} className="block h-auto w-full" />
                </span>
                <p className="body-s text-[var(--fg)]">{st.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
