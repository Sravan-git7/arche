import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { getLenis } from "../lib/useLenis";
import { KineticWord } from "./Kinetic";
import { CARD, CONVERGE_AT, LAST, STAGES, focusIndex, linkProgress, project } from "../lib/rail3d";

/**
 * PROMPT 13 — 3D System Moment (signature pinned camera-rail scene).
 * PROMPT 24 — legibility rebuild.
 *
 * Spatial representation of Arche's system model:
 *   INPUT → INTELLIGENCE → SYSTEM → ACTION → OUTPUT
 *
 * Camera: one fixed rail driven 1:1 by scroll progress (pinned sequence).
 * No orbit controls, no free rotate.
 *
 * Why the geometry is solved here instead of handed to CSS 3D:
 * The five clusters sit at even intervals along a SINGLE depth axis and the
 * camera travels that axis. Position, size and opacity for every cluster are
 * a pure function of scroll progress (`project()` in lib/rail3d), so
 *   · a cluster can never drift through the camera plane and blow up over
 *     the scene (the old failure mode — huge text printing on top of itself),
 *   · a cluster the camera has passed fades out and swings out of frame
 *     before the next one arrives,
 *   · the whole rail can be verified numerically at every scroll position.
 *
 * Text lives ONLY in fixed HUD slots, each with a solid background and its
 * own z-layer, so no two text elements can overlap at any scroll position:
 *   left    the camera rail — one dedicated row per stage, never shared
 *   bottom-right  the active stage card (identity + one-line role)
 *   top-right     the hover tooltip for the cluster under the cursor
 *   centre        SYSTEM CONVERGED → PROCESS, the final beat
 * The cluster planes themselves carry no text at all.
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

    let box = { w: scene.clientWidth || 800, h: scene.clientHeight || 420 };
    const measure = () => {
      box = { w: scene.clientWidth || box.w, h: scene.clientHeight || box.h };
    };

    let lastActive = -1;
    let lastConv: boolean | null = null;

    const frame = (p: number) => {
      const pts = STAGES.map((_, i) => project(i, p, box));

      pts.forEach((pt, i) => {
        const el = cards.current[i];
        if (!el) return;
        // A slight rotateY per cluster turns the rail into a curved wall
        // facing the camera; perspective lives on the scene container.
        const tilt = -STAGES[i].ox * 13;
        el.style.transform = `translate3d(${pt.x.toFixed(2)}px, ${pt.y.toFixed(2)}px, 0) scale(${pt.scale.toFixed(4)}) rotateY(${tilt.toFixed(2)}deg) rotateX(4deg)`;
        el.style.opacity = pt.opacity.toFixed(3);
        el.style.visibility = pt.visible ? "visible" : "hidden";
        el.style.zIndex = String(pt.z);
      });

      // Connectors draw in as the camera closes each gap.
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
        line.setAttribute("opacity", (on ? Math.min(a.opacity, b.opacity) * (0.35 + prog * 0.65) : 0).toFixed(3));
        line.setAttribute("stroke-width", prog >= 1 ? "1.8" : "1.2");
      }

      if (railFill.current) railFill.current.style.transform = `scaleY(${p.toFixed(4)})`;

      const idx = focusIndex(p);
      if (idx !== lastActive) {
        lastActive = idx;
        setActive(idx);
      }
      const conv = p >= CONVERGE_AT;
      if (conv !== lastConv) {
        lastConv = conv;
        setConverged(conv);
        if (conv) setHover(false);
      }
    };

    const ro = new ResizeObserver(() => {
      measure();
      frame(ScrollTrigger.getById("3d-system-pinned-rail")?.progress ?? 0);
    });
    ro.observe(scene);
    measure();

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        id: "3d-system-pinned-rail",
        trigger: pin,
        start: "top top",
        end: "+=250%",
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
      .to(el, { autoAlpha: 0, y: -7, duration: 0.15, ease: "power2.in" })
      .add(() => {
        shownRef.current = active;
        setShown(active);
      })
      // immediateRender:false — the "from" state must not land before the
      // outgoing label has finished leaving.
      .fromTo(el, { y: 9 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power3.out", immediateRender: false });
  }, [active]);

  useEffect(
    () => () => {
      labelTl.current?.kill();
    },
    []
  );

  /** Clicking a stage number travels the rail there — scroll stays the source of truth. */
  const gotoStage = (i: number) => {
    const st = ScrollTrigger.getById("3d-system-pinned-rail");
    if (!st) return;
    const y = st.start + (i / LAST) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.15 });
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
        <div className="wrap flex h-[100svh] flex-col justify-center gap-[clamp(12px,1.8vh,20px)] pt-[86px] pb-[22px]">
          <header className="flex flex-none flex-wrap items-end justify-between gap-x-[28px] gap-y-[12px]">
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
                style={{ fontSize: "clamp(28px,4.6vw,66px)", fontWeight: 600, letterSpacing: "-0.05em", lineHeight: 0.92 }}
              />
            </div>
            <p className="body max-w-[42ch]" style={{ color: "var(--muted)" }}>
              One fixed camera rail. Five clusters along a single depth axis:{" "}
              <strong style={{ color: "var(--fg)" }}>INPUT → INTELLIGENCE → SYSTEM → ACTION → OUTPUT</strong>. Scroll
              travels the rail.
            </p>
          </header>

          {/* ---------- the scene ---------- */}
          <div
            ref={sceneRef}
            className="relative min-h-[260px] w-full flex-1 overflow-hidden rounded-[8px] border"
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
              className="pointer-events-none absolute inset-0 opacity-45"
              style={{
                backgroundImage:
                  "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
              aria-hidden
            />
            {/* depth vignette — the far end of the rail recedes */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 42%, color-mix(in srgb, var(--bg-2) 88%, transparent) 100%)" }}
              aria-hidden
            />

            {/* connectors between clusters (under the planes) */}
            <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden>
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
                  strokeWidth="1.2"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                  strokeLinecap="round"
                  opacity="0"
                />
              ))}
            </svg>

            {/* the five cluster planes — no text, ever */}
            {STAGES.map((s, i) => {
              const on = i === active;
              return (
                <div
                  key={s.id}
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  className="absolute top-0 left-0 rounded-[6px] border"
                  style={{
                    width: CARD.w,
                    height: CARD.h,
                    marginLeft: -CARD.w / 2,
                    marginTop: -CARD.h / 2,
                    borderColor: on ? "var(--accent-deep)" : "rgba(12,12,13,0.16)",
                    background: on
                      ? "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,244,224,0.72)), repeating-linear-gradient(90deg, rgba(12,12,13,0.05) 0 1px, transparent 1px 40px)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(235,232,225,0.2)), repeating-linear-gradient(90deg, rgba(12,12,13,0.045) 0 1px, transparent 1px 40px)",
                    boxShadow: on
                      ? "0 26px 50px -34px rgba(12,12,13,0.6), 0 0 22px color-mix(in srgb, var(--accent-deep) 26%, transparent)"
                      : "0 26px 50px -42px rgba(12,12,13,0.45)",
                    pointerEvents: on && !converged ? "auto" : "none",
                    cursor: on && !converged ? "help" : "default",
                    willChange: "transform, opacity",
                    transformStyle: "preserve-3d",
                  }}
                  onMouseEnter={() => on && setHover(true)}
                  onMouseLeave={() => setHover(false)}
                  aria-hidden
                >
                  <span className="absolute inset-x-[14px] top-[14px] flex items-center justify-between">
                    <span
                      className="block h-[8px] w-[8px] rounded-full"
                      style={{
                        background: on ? "var(--accent-deep)" : "var(--faint)",
                        transition: "background .35s var(--e-out)",
                      }}
                    />
                    <span className="block h-[5px] w-[44px] rounded-full" style={{ background: "var(--line)" }} />
                  </span>
                  <span className="absolute inset-x-[14px] bottom-[16px] flex flex-col gap-[7px]">
                    <span
                      className="block h-[6px] rounded-full"
                      style={{
                        width: "76%",
                        background: on ? "color-mix(in srgb, var(--accent-deep) 55%, var(--line))" : "var(--line)",
                        transition: "background .35s var(--e-out)",
                      }}
                    />
                    <span className="block h-[6px] w-[52%] rounded-full" style={{ background: "var(--line)" }} />
                  </span>
                  {on && (
                    <>
                      <span className="signal-dot absolute -top-[4px] -right-[4px]" style={{ width: 8, height: 8 }} />
                      <span className="demo-pulse pointer-events-none absolute inset-0 rounded-[6px]" />
                    </>
                  )}
                </div>
              );
            })}

            {/* ---------- HUD: every label has its own slot ---------- */}

            {/* left — the camera rail. One dedicated row per stage. */}
            <div
              className="pointer-events-none absolute top-1/2 left-[14px] z-[30] -translate-y-1/2 rounded-[6px] border px-[12px] py-[11px]"
              style={{
                width: 194,
                borderColor: "var(--line)",
                // solid: a cluster plane may drift behind this panel as the
                // camera passes it — the rail text must never merge with it
                background: "var(--bg)",
                boxShadow: "0 16px 34px -28px rgba(12,12,13,0.6)",
                opacity: converged ? 0.4 : 1,
                transition: "opacity .4s var(--e-out)",
              }}
              aria-hidden
            >
              <div className="mb-[9px] flex items-center gap-[7px]">
                <span className="signal-dot" style={{ width: 5, height: 5 }} />
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "var(--muted)" }}>
                  CAMERA RAIL
                </span>
              </div>
              <div className="relative flex flex-col">
                <span className="absolute top-[10px] bottom-[10px] left-[4px] w-px" style={{ background: "var(--line)" }} />
                <span
                  ref={railFill}
                  className="absolute top-[10px] bottom-[10px] left-[4px] w-px origin-top"
                  style={{ background: "var(--accent-deep)", transform: "scaleY(0)" }}
                />
                {STAGES.map((s, i) => {
                  const state = i < active ? "past" : i === active ? "now" : "next";
                  return (
                    <span
                      key={s.id}
                      className="relative flex h-[26px] items-center gap-[9px]"
                      style={{
                        opacity: state === "past" ? 0.32 : state === "now" ? 1 : 0.66,
                        transition: "opacity .35s var(--e-out)",
                      }}
                    >
                      <span
                        className="relative z-[1] block h-[9px] w-[9px] flex-none rounded-full"
                        style={{
                          background: state === "now" ? "var(--accent-deep)" : "var(--bg)",
                          border: `1px solid ${state === "now" ? "var(--accent-deep)" : "var(--faint)"}`,
                          boxShadow: state === "now" ? "0 0 0 4px color-mix(in srgb, var(--accent-deep) 18%, transparent)" : "none",
                          transition: "all .35s var(--e-out)",
                        }}
                      />
                      <span className="mono" style={{ fontSize: 9, color: state === "now" ? "var(--accent-deep)" : "var(--faint)" }}>
                        {s.num}
                      </span>
                      <span
                        className="mono truncate"
                        style={{
                          fontSize: 10,
                          letterSpacing: ".13em",
                          fontWeight: state === "now" ? 600 : 400,
                          color: state === "now" ? "var(--fg)" : "var(--muted)",
                          transition: "color .35s var(--e-out)",
                        }}
                      >
                        {s.title}
                      </span>
                      <span className="mono ml-auto" style={{ fontSize: 8.5, color: "var(--faint)" }}>
                        {state === "past" ? "✓" : state === "now" ? "●" : ""}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* top-right — hover tooltip, solid ink, its own layer */}
            <div
              className="pointer-events-none absolute top-[14px] right-[14px] z-[36] max-w-[46%]"
              style={{
                opacity: hover && !converged ? 1 : 0,
                transform: hover && !converged ? "none" : "translateY(-5px)",
                transition: "opacity .2s linear, transform .3s var(--e-out)",
              }}
              aria-hidden={!hover}
            >
              <span
                className="mono block rounded-[4px] px-[11px] py-[8px]"
                style={{ background: "var(--fg)", color: "var(--bg)", fontSize: 10, lineHeight: 1.55, letterSpacing: ".06em" }}
              >
                {live.label}
              </span>
            </div>

            {/* bottom-right — the active stage card (solid ground, no merge) */}
            <div
              className="absolute right-[14px] bottom-[14px] z-[32]"
              style={{
                width: "min(52%, 430px)",
                opacity: converged ? 0 : 1,
                transition: "opacity .35s var(--e-out)",
              }}
              aria-live="polite"
            >
              <div
                ref={labelSwap}
                className="rounded-[6px] border p-[12px]"
                style={{ borderColor: "var(--line)", background: "var(--bg)", boxShadow: "0 16px 34px -26px rgba(12,12,13,0.6)" }}
              >
                <div className="flex items-baseline justify-between gap-[10px]">
                  <span className="mono" style={{ color: "var(--accent-deep)", fontSize: 11.5, fontWeight: 600, letterSpacing: ".1em" }}>
                    {stage.num} // {stage.title}
                  </span>
                  <span className="mono" style={{ color: "var(--muted)", fontSize: 9.5, letterSpacing: ".1em" }}>
                    {stage.subtitle}
                  </span>
                </div>
                <p className="mono mt-[8px]" style={{ fontSize: 10.5, lineHeight: 1.6, color: "var(--fg)", letterSpacing: ".04em" }}>
                  {stage.label}
                </p>
              </div>
            </div>

            {/* centre — the pull-back convergence, on top of everything */}
            <div
              className="pointer-events-none absolute inset-0 z-[40] grid place-items-center px-[16px]"
              style={{ opacity: converged ? 1 : 0, transition: "opacity .4s var(--e-out)" }}
              aria-hidden={!converged}
            >
              <div
                className="flex flex-col items-center gap-[11px] rounded-[8px] border px-[22px] py-[18px]"
                style={{
                  borderColor: "var(--accent-deep)",
                  background: "var(--bg)",
                  boxShadow: "0 26px 60px -34px rgba(12,12,13,0.65)",
                  transform: converged ? "scale(1)" : "scale(0.9)",
                  transition: "transform .55s var(--e-out)",
                }}
              >
                <span className="flex items-center gap-[9px]">
                  {STAGES.map((s) => (
                    <span key={s.id} className="signal-dot" style={{ width: 8, height: 8 }} />
                  ))}
                </span>
                <span className="mono" style={{ color: "var(--accent-deep)", fontSize: 11, letterSpacing: ".14em" }}>
                  SYSTEM CONVERGED → PROCESS
                </span>
              </div>
            </div>
          </div>

          {/* ---------- rail controls ---------- */}
          <div className="flex flex-none flex-wrap items-center justify-between gap-[12px]">
            <div className="flex items-center gap-[6px]" role="group" aria-label="Jump the camera rail to a stage">
              {STAGES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => gotoStage(i)}
                  aria-current={active === i}
                  aria-label={`${s.num} ${s.title}`}
                  className="mono rounded-full border px-[9px] py-[4px]"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: ".12em",
                    borderColor: active === i ? "var(--accent-deep)" : "var(--line)",
                    background: active === i ? "var(--accent-deep)" : "transparent",
                    color: active === i ? "var(--solid)" : "var(--muted)",
                    transition: "all .3s var(--e-out)",
                  }}
                  data-cursor="JUMP"
                >
                  {s.num}
                </button>
              ))}
            </div>
            <span className="mono" style={{ color: "var(--faint)", fontSize: 10 }}>
              {converged ? "Converged — the system becomes the process" : "Scroll to travel the rail · hover a cluster for its role"}
            </span>
          </div>
        </div>
      ) : (
        /* ---------- mobile / reduced motion: 2D vertical flow ---------- */
        <div className="wrap flex flex-col gap-[22px] py-[clamp(56px,7vw,110px)]">
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center gap-[10px]">
              <span className="mono mono-a">03 // SPATIAL ARCHITECTURE</span>
              <span className="mono">·</span>
              <span className="mono">5-STAGE SYSTEM MODEL</span>
            </div>
            <h2 className="d2" style={{ fontSize: "clamp(30px,7vw,54px)" }}>
              System model.
            </h2>
            <p className="body max-w-[46ch]">
              Five clusters on one axis: <strong>INPUT → INTELLIGENCE → SYSTEM → ACTION → OUTPUT</strong>.
            </p>
          </div>

          <div className="relative flex flex-col gap-[10px] pl-[26px]">
            <span className="absolute top-[10px] bottom-[10px] left-[8px] w-px" style={{ background: "var(--accent-deep)", opacity: 0.55 }} />
            {STAGES.map((st) => (
              <div key={st.id} className="relative flex flex-col gap-[7px] rounded-[6px] border p-[16px]" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
                <span className="absolute top-[22px] left-[-22px] block h-[9px] w-[9px] rounded-full" style={{ background: "var(--accent-deep)" }} />
                <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
                  <span className="mono" style={{ color: "var(--accent-deep)", fontSize: 11, letterSpacing: ".1em" }}>
                    {st.num} // {st.title}
                  </span>
                  <span className="mono" style={{ color: "var(--muted)", fontSize: 9.5 }}>
                    {st.subtitle}
                  </span>
                </div>
                <p className="body-s">{st.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
