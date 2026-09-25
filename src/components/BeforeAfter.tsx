import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

/**
 * Draggable system comparison.
 *
 * Left of the handle: one trigger doing the same work. Right of the handle:
 * the manual hand-off chain. Dragging RIGHT routes the event automatically —
 * the connected side grows, the hand-offs disappear, and both counters count
 * down live under the pointer. Metrics and the automated pipeline are a pure
 * read-out of the handle position, so the comparison is real, not labelled.
 *
 * PROMPT 24: the handle says what it does before the first drag, and the two
 * counters animate (they count, they do not jump) while it is being dragged.
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

export function BeforeAfter() {
  const [p, setP] = useState(0.5); // handle position — also how much is automated
  const [touched, setTouched] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const handRef = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const shown = useRef({ minutes: MANUAL_MINUTES / 2, handoffs: MANUAL_HANDOFFS / 2 });

  const automated = p; // 0 = all manual, 1 = fully routed
  const hot = automated > 0.5;

  /** Write both counters straight to the DOM: they follow the handle every frame. */
  const paint = () => {
    if (timeRef.current) timeRef.current.textContent = fmtTime(shown.current.minutes);
    if (handRef.current) {
      const next = String(Math.max(0, Math.round(shown.current.handoffs)));
      if (handRef.current.textContent !== next) {
        handRef.current.textContent = next;
        // retrigger the tick so a changing hand-off count is visibly live
        handRef.current.classList.remove("ba-tick");
        void handRef.current.offsetWidth;
        handRef.current.classList.add("ba-tick");
      }
    }
  };

  useEffect(() => {
    const target = {
      minutes: MANUAL_MINUTES * (1 - automated),
      handoffs: MANUAL_HANDOFFS * (1 - automated),
    };
    if (prefersReducedMotion()) {
      shown.current = target;
      paint();
      return;
    }
    // Tight while dragging (1:1 with the hand), eased when it settles.
    const tween = gsap.to(shown.current, {
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

  const setFrom = (clientX: number) => {
    const b = box.current?.getBoundingClientRect();
    if (b) setP(clamp((clientX - b.left) / b.width));
  };

  const grab = (clientX: number) => {
    dragging.current = true;
    setTouched(true);
    setFrom(clientX);
  };

  const lit = Math.ceil(automated * AUTO.length);

  return (
    <section className="w-full pb-[clamp(56px,7vw,110px)]">
      <div className="wrap">
        <div className="mb-[20px] flex flex-wrap items-end justify-between gap-[12px]">
          <h3 className="d3 max-w-[20ch]" data-r="mask">
            Drag across. Watch the hand-offs disappear.
          </h3>
          <div className="flex gap-[22px]">
            <Metric k="Handling time" vRef={timeRef} initial={fmtTime(shown.current.minutes)} hot={hot} />
            <Metric k="Hand-offs" vRef={handRef} initial={String(Math.round(shown.current.handoffs))} hot={hot} />
          </div>
        </div>

        <div
          ref={box}
          className="relative h-[clamp(260px,34vw,380px)] w-full cursor-ew-resize overflow-hidden rounded-[6px] border select-none"
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
              Connected
            </p>
            <div className="flex max-w-[660px] flex-wrap items-center gap-[8px]">
              {AUTO.map((a, i) => {
                const on = i < lit;
                return (
                  <span key={a} className="flex items-center gap-[8px]">
                    <span
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
                      <span className="mono" style={{ color: on ? "var(--accent-deep)" : "var(--faint)" }}>
                        →
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
            <p className="body-s absolute bottom-[clamp(16px,2vw,28px)] max-w-[34ch]">
              One event. Every system updated. The person only sees what needs judgement.
            </p>
          </div>

          {/* MANUAL layer — opaque, clipped to the right of the handle */}
          <div
            className="absolute inset-0 p-[clamp(16px,2vw,28px)]"
            style={{ background: "var(--bg-2)", clipPath: `inset(0 0 0 ${p * 100}%)` }}
          >
            <p className="mono mb-[14px] text-right">Manual</p>
            <div className="flex flex-wrap justify-end gap-[8px]">
              {MANUAL.map((m, i) => (
                <span
                  key={m}
                  className="flex items-center gap-[8px] rounded-full border px-[12px] py-[7px]"
                  style={{
                    borderColor: "var(--line)",
                    background: "var(--card)",
                    transform: `translateY(${(i % 2) * 10}px) rotate(${((i * 7) % 5) - 2}deg)`,
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

          {/* handle */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Compare the manual chain with the connected system. Drag right to route the event automatically."
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(automated * 100)}
            aria-valuetext={`${Math.round(automated * 100)}% routed automatically — handling time ${fmtTime(
              MANUAL_MINUTES * (1 - automated)
            )}, ${Math.max(0, Math.round(MANUAL_HANDOFFS * (1 - automated)))} hand-offs`}
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
      <span className="mono">{k}</span>
      <span
        ref={vRef}
        className="ba-metric numeral text-[clamp(22px,2.4vw,34px)]"
        style={{ color: hot ? "var(--accent-deep)" : "var(--fg)" }}
      >
        {initial}
      </span>
    </div>
  );
}
