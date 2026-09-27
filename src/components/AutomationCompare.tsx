import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

/**
 * AI AUTOMATION deep-dive (PROMPT 34) — the relocated drag comparison.
 *
 * This interaction lived on the homepage as "BeforeAfter" — the third
 * "drag to show connection" in the main scroll. It now has exactly one
 * home: the AI Automation service page, reworked into a deeper instrument:
 *
 *   - the connected pipeline actually routes the event: a live token
 *     travels the node chain as you drag, arrows complete as the systems
 *     on either side light up
 *   - manual hand-offs don't just clip away at the handle's edge — each
 *     chip dissolves (fade + drift + shrink) as the handle reaches it,
 *     so "watch the hand-offs disappear" is literally true
 *   - a third live counter, "systems updated", joins handling time and
 *     hand-offs, and a status line narrates the measurement under the box
 *
 * The handle position is the single source of truth — every read-out on
 * both sides of it is a pure function of the drag, so the comparison is
 * real, not labelled.
 */
const MANUAL = ["Email arrives", "Copy details", "Paste to sheet", "Update CRM", "Write reply", "Create task", "Tell the team"];
const AUTO = ["One trigger", "AI reads", "CRM", "Slack", "Task", "Response"];

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Full manual load, and what is left once everything is routed. */
const MANUAL_MINUTES = 12;
const MANUAL_HANDOFFS = 7;
const AUTOMATED_SECONDS = 4; // a person still sees the exceptions

const fmtTime = (minutes: number) => {
  const secs = Math.max(AUTOMATED_SECONDS, Math.round(minutes * 60));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
};

/** The live narration under the box — a pure function of routing progress. */
const readout = (t: number) => {
  const pct = Math.round(t * 100);
  const gone = Math.round(MANUAL_HANDOFFS * t);
  const sys = Math.round(AUTO.length * t);
  if (t >= 0.995) return `100% routed — one event, ${AUTO.length} systems updated, end to end in ${AUTOMATED_SECONDS}s.`;
  if (t <= 0.005) return `0% routed — ${MANUAL_HANDOFFS} hand-offs, carried by hand, every time.`;
  return `${pct}% routed — ${gone} hand-off${gone === 1 ? "" : "s"} gone · ${sys} of ${AUTO.length} systems updated.`;
};

export function AutomationCompare() {
  const [p, setP] = useState(0.5); // handle position — also how much is automated
  const [touched, setTouched] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const handRef = useRef<HTMLSpanElement>(null);
  const sysRef = useRef<HTMLSpanElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);
  const tokenRef = useRef<HTMLSpanElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dragging = useRef(false);

  /** Tweened read-outs — everything the pointer drives is written straight
      to the DOM from here, so counters/token/chips follow the hand 1:1. */
  const vis = useRef({ minutes: MANUAL_MINUTES / 2, handoffs: MANUAL_HANDOFFS / 2, systems: AUTO.length / 2, t: 0.5 });

  /** Measured geometry: node centres (for the token path) and each chip's
      centre as a fraction of the box width (for the dissolve band). */
  const geo = useRef({ nodes: [] as { x: number; y: number }[], chips: [] as number[] });

  const automated = p; // 0 = all manual, 1 = fully routed
  const hot = automated > 0.5;
  const lit = Math.ceil(automated * AUTO.length);
  const settled = p >= 0.999;

  const tokenPos = (t: number) => {
    const ns = geo.current.nodes;
    if (ns.length < 2) return { x: 0, y: 0 };
    const span = clamp(t) * (ns.length - 1);
    const i = Math.min(ns.length - 2, Math.floor(span));
    const f = span - i;
    const a = ns[i];
    const b = ns[Math.min(ns.length - 1, i + 1)];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  };

  /** Write every live read-out straight to the DOM — called by the tween. */
  const paint = () => {
    const v = vis.current;
    if (timeRef.current) timeRef.current.textContent = fmtTime(v.minutes);
    const setTick = (el: HTMLSpanElement | null, text: string) => {
      if (!el || el.textContent === text) return;
      el.textContent = text;
      el.classList.remove("ba-tick");
      void el.offsetWidth;
      el.classList.add("ba-tick");
    };
    setTick(handRef.current, String(Math.max(0, Math.round(v.handoffs))));
    setTick(sysRef.current, String(Math.max(0, Math.round(v.systems))));
    if (readRef.current) readRef.current.textContent = readout(v.t);

    // the event token travels the pipeline
    if (tokenRef.current) {
      const pos = tokenPos(v.t);
      tokenRef.current.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`;
    }

    // each manual chip dissolves in a band just before the handle reaches it
    chipRefs.current.forEach((el, i) => {
      if (!el) return;
      const op = clamp((geo.current.chips[i] - v.t) / 0.09);
      el.style.opacity = String(op);
      el.style.transform = `translateY(${(i % 2) * 10 - (1 - op) * 16}px) rotate(${((i * 7) % 5) - 2}deg) scale(${0.9 + 0.1 * op})`;
    });
  };

  useEffect(() => {
    const target = {
      minutes: MANUAL_MINUTES * (1 - automated),
      handoffs: MANUAL_HANDOFFS * (1 - automated),
      systems: automated * AUTO.length,
      t: automated,
    };
    if (prefersReducedMotion()) {
      vis.current = target;
      paint();
      return;
    }
    // Tight while dragging (1:1 with the hand), eased when it settles.
    const tween = gsap.to(vis.current, {
      ...target,
      duration: dragging.current ? 0.14 : 0.5,
      ease: "power2.out",
      onUpdate: paint,
      onComplete: paint,
    });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  useEffect(() => {
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure node centres + chip positions; re-measure on resize.
  useLayoutEffect(() => {
    const measure = () => {
      const b = box.current?.getBoundingClientRect();
      if (!b || b.width === 0) return;
      geo.current.nodes = nodeRefs.current
        .filter((el): el is HTMLSpanElement => el !== null)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
        });
      geo.current.chips = chipRefs.current.map((el) => {
        const r = el!.getBoundingClientRect();
        return (r.left + r.width / 2 - b.left) / b.width;
      });
      paint();
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFrom = (clientX: number) => {
    const b = box.current?.getBoundingClientRect();
    if (b) setP(clamp((clientX - b.left) / b.width));
  };

  const grab = (clientX: number) => {
    dragging.current = true;
    setTouched(true);
    setFrom(clientX);
  };

  return (
    <section className="w-full py-[clamp(60px,7vw,110px)]">
      <div className="wrap">
        <div className="mb-[20px] flex flex-wrap items-end justify-between gap-[12px]">
          <div>
            <p className="mono mono-a mb-[8px]">The difference, measured</p>
            <h3 className="d3 max-w-[22ch]" data-r="mask">
              Drag across. Watch the hand-offs disappear.
            </h3>
          </div>
          <div className="flex gap-[22px]">
            <Metric k="Handling time" vRef={timeRef} initial={fmtTime(vis.current.minutes)} hot={hot} />
            <Metric k="Hand-offs" vRef={handRef} initial={String(Math.round(vis.current.handoffs))} hot={hot} />
            <Metric k="Systems updated" vRef={sysRef} initial={String(Math.round(vis.current.systems))} hot={hot} />
          </div>
        </div>

        <div
          ref={box}
          className="relative h-[clamp(300px,36vw,430px)] w-full cursor-ew-resize overflow-hidden rounded-[6px] border select-none"
          style={{ borderColor: "var(--line)", touchAction: "pan-y" }}
          data-cursor="DRAG"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            grab(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && setFrom(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          {/* CONNECTED layer — the ground truth underneath, revealed on the left */}
          <div className="on-ink absolute inset-0 p-[clamp(16px,2vw,28px)]">
            <p className="mono mb-[14px]" style={{ color: "var(--accent-deep)" }}>
              Connected · one trigger
            </p>
            <div className="relative flex max-w-[680px] flex-wrap items-center gap-[8px]">
              {AUTO.map((a, i) => {
                const on = i < lit;
                return (
                  <span key={a} className="flex items-center gap-[8px]">
                    <span
                      ref={(el) => {
                        nodeRefs.current[i] = el;
                      }}
                      className="rounded-full border px-[12px] py-[7px] text-[13px] tracking-[-.02em]"
                      style={{
                        borderColor: on ? "var(--accent-deep)" : "var(--line)",
                        color: on ? "var(--fg)" : "var(--faint)",
                        background: on ? "color-mix(in srgb, var(--accent-deep) 12%, transparent)" : "transparent",
                        transition: "all .35s var(--e-out)",
                      }}
                    >
                      {a}
                    </span>
                    {i < AUTO.length - 1 && (
                      <span className="mono" style={{ color: i + 1 < lit ? "var(--accent-deep)" : "var(--faint)", transition: "color .35s var(--e-out)" }}>
                        →
                      </span>
                    )}
              </span>
            );
          })}
            </div>
            <p className="body-s absolute bottom-[clamp(16px,2vw,28px)] left-[clamp(16px,2vw,28px)] max-w-[34ch]">
              One event. Every system updated. The person only sees what needs judgement.
            </p>
          </div>

          {/* MANUAL layer — opaque, clipped to the right of the handle.
              The chips dissolve on their own in the band before the clip
              arrives, so each hand-off visibly disappears. */}
          <div
            className="absolute inset-0 p-[clamp(16px,2vw,28px)]"
            style={{ background: "var(--bg-2)", clipPath: `inset(0 0 0 ${p * 100}%)` }}
          >
            <p className="mono mb-[14px] text-right" style={{ color: "var(--faint)" }}>
              Manual · {MANUAL_HANDOFFS} hand-offs
            </p>
            <div className="flex flex-wrap justify-end gap-[8px]">
              {MANUAL.map((m, i) => (
                <span
                  key={m}
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  data-chip
                  className="flex items-center gap-[8px] rounded-full border px-[12px] py-[7px]"
                  style={{
                    borderColor: "var(--line)",
                    background: "var(--card)",
                    willChange: "opacity, transform",
                  }}
                >
                  <span className="mono" style={{ fontSize: 9 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] tracking-[-.02em]">{m}</span>
                </span>
              ))}
            </div>
            <p className="body-s absolute right-[clamp(16px,2vw,28px)] bottom-[clamp(16px,2vw,28px)] max-w-[34ch] text-right">
              A person carries the same information between five tools, every time.
            </p>
          </div>

          {/* the event itself — a live token that travels the chain as it is
              routed. Box-anchored so its measured node-centre coordinates
              map 1:1. Sits above both layers, below the handle. */}
          <span
            ref={tokenRef}
            className="pointer-events-none absolute top-0 left-0 z-[2] grid place-items-center"
            aria-hidden
            style={{ willChange: "transform" }}
          >
            <span
              className="block h-[11px] w-[11px] rounded-full"
              style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent-deep), 0 0 4px var(--accent)" }}
            />
            {settled && <span className="ba-settle absolute h-[11px] w-[11px] rounded-full" />}
          </span>

          {/* handle */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Route one event between the manual chain and the connected system. Drag right to automate it."
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(automated * 100)}
            aria-valuetext={`${Math.round(automated * 100)}% routed automatically — handling time ${fmtTime(
              MANUAL_MINUTES * (1 - automated)
            )}, ${Math.max(0, Math.round(MANUAL_HANDOFFS * (1 - automated)))} hand-offs, ${Math.round(
              automated * AUTO.length
            )} of ${AUTO.length} systems updated`}
            className="absolute top-0 bottom-0 z-[3] w-[2px] outline-none"
            style={{ left: `${p * 100}%`, background: "var(--accent-deep)", transform: "translateX(-1px)" }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                setTouched(true);
                setP((v) => clamp(v - 0.05));
              }
              if (e.key === "ArrowRight") {
                setTouched(true);
                setP((v) => clamp(v + 0.05));
              }
            }}
          >
            <span
              className="absolute top-1/2 left-1/2 grid h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
              style={{ background: "var(--fg)", color: "var(--bg)", boxShadow: "0 0 0 6px color-mix(in srgb, var(--accent-deep) 22%, transparent)" }}
            >
              <span className="font-mono text-[12px]">⟷</span>
            </span>

            {/* the invitation — until the visitor actually drags. The outer
                span owns the centring, the inner one owns the nudge, so the
                animation can never fight the transform that positions it. */}
            {!touched && (
              <span className="pointer-events-none absolute top-[calc(50%+34px)] left-1/2 -translate-x-1/2">
                <span
                  className="ba-hint flex items-center gap-[7px] rounded-full border px-[11px] py-[6px]"
                  style={{
                    borderColor: "var(--accent-deep)",
                    background: "var(--bg)",
                    color: "var(--fg)",
                    whiteSpace: "nowrap",
                    boxShadow: "0 10px 24px -18px rgba(12,12,13,0.8)",
                  }}
                >
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".1em" }}>
                    DRAG RIGHT TO ROUTE THE EVENT AUTOMATICALLY
                  </span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--accent-deep)" }}>
                    →
                  </span>
                </span>
              </span>
            )}
          </div>
        </div>

        <p className="mono mt-[12px] flex items-center gap-[8px]" aria-live="polite">
          <span className="signal-dot flex-none" style={{ width: 5, height: 5 }} />
          <span ref={readRef} style={{ color: "var(--muted)" }}>
            {readout(0.5)}
          </span>
        </p>
      </div>
    </section>
  );
}

function Metric({
  k,
  vRef,
  initial,
  hot,
}: {
  k: string;
  vRef: RefObject<HTMLSpanElement | null>;
  initial: string;
  hot: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="mono" style={{ color: "var(--faint)" }}>
        {k}
      </span>
      <span
        ref={vRef}
        className="ba-metric numeral text-[clamp(20px,2.2vw,30px)]"
        style={{ color: hot ? "var(--accent-deep)" : "var(--fg)" }}
      >
        {initial}
      </span>
    </div>
  );
}
