import { useRef, useState } from "react";

/**
 * Draggable system comparison. Left of the handle: the manual hand-off chain.
 * Right of the handle: one trigger doing the same work. Metrics and the
 * automated pipeline update live with the handle position.
 */
const MANUAL = ["Email arrives", "Copy details", "Paste to sheet", "Update CRM", "Write reply", "Create task", "Tell the team"];
const AUTO = ["One trigger", "AI reads", "CRM", "Slack", "Task", "Response"];

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function BeforeAfter() {
  const [p, setP] = useState(0.7); // handle position (0 = left edge)
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const r = 1 - p; // how much of the connected state is revealed
  const lit = Math.ceil(r * AUTO.length);
  const minutes = 12 * (1 - r);
  const time = r > 0.97 ? "0:04" : `${Math.floor(minutes)}:${String(Math.round((minutes % 1) * 60)).padStart(2, "0")}`;
  const handoffs = Math.round(7 * (1 - r));

  const setFrom = (clientX: number) => {
    const b = box.current?.getBoundingClientRect();
    if (b) setP(clamp((clientX - b.left) / b.width));
  };

  return (
    <section className="w-full pb-[clamp(56px,7vw,110px)]">
      <div className="wrap">
        <div className="mb-[20px] flex flex-wrap items-end justify-between gap-[12px]">
          <h3 className="d3 max-w-[20ch]" data-r="mask">
            Drag across. Watch the hand-offs disappear.
          </h3>
          <div className="flex gap-[22px]">
            <Metric k="Handling time" v={time} hot={r > 0.5} />
            <Metric k="Hand-offs" v={String(handoffs)} hot={r > 0.5} />
          </div>
        </div>

        <div
          ref={box}
          className="relative h-[clamp(260px,34vw,380px)] w-full cursor-ew-resize overflow-hidden rounded-[6px] border select-none"
          style={{ borderColor: "var(--line)", touchAction: "pan-y" }}
          data-cursor="DRAG"
          onPointerDown={(e) => {
            dragging.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setFrom(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && setFrom(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          {/* MANUAL layer */}
          <div className="absolute inset-0 p-[clamp(16px,2vw,28px)]" style={{ background: "var(--bg-2)" }}>
            <p className="mono mb-[14px]">Manual</p>
            <div className="flex max-w-[640px] flex-wrap gap-[8px]">
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
                  <span className="mono" style={{ fontSize: 9 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[13px] tracking-[-.02em]">{m}</span>
                </span>
              ))}
            </div>
            <p className="body-s absolute bottom-[clamp(16px,2vw,28px)] max-w-[34ch]">
              A person carries the same information between five tools, every time.
            </p>
          </div>

          {/* CONNECTED layer — revealed right of the handle */}
          <div
            className="on-ink absolute inset-0 p-[clamp(16px,2vw,28px)]"
            style={{ clipPath: `inset(0 0 0 ${p * 100}%)` }}
          >
            <p className="mono mb-[14px] text-right" style={{ color: "var(--accent-deep)" }}>Connected</p>
            <div className="flex flex-wrap items-center justify-end gap-[8px]">
              {AUTO.map((a, i) => {
                const on = i < lit;
                return (
                  <span key={a} className="flex items-center gap-[8px]">
                    <span
                      className="rounded-full border px-[12px] py-[7px] text-[13px] tracking-[-.02em]"
                      style={{
                        borderColor: on ? "var(--accent-deep)" : "var(--line)",
                        color: on ? "var(--fg)" : "var(--faint)",
                        transition: "all .35s var(--e-out)",
                      }}
                    >
                      {a}
                    </span>
                    {i < AUTO.length - 1 && (
                      <span className="mono" style={{ color: on ? "var(--accent-deep)" : "var(--faint)" }}>→</span>
                    )}
                  </span>
                );
              })}
            </div>
            <p className="body-s absolute right-[clamp(16px,2vw,28px)] bottom-[clamp(16px,2vw,28px)] max-w-[34ch] text-right">
              One event. Every system updated. The person only sees what needs judgement.
            </p>
          </div>

          {/* handle */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Compare manual and connected workflow"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(r * 100)}
            className="absolute top-0 bottom-0 z-[3] w-[2px] outline-none"
            style={{ left: `${p * 100}%`, background: "var(--accent-deep)", transform: "translateX(-1px)" }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setP((v) => clamp(v - 0.05));
              if (e.key === "ArrowRight") setP((v) => clamp(v + 0.05));
            }}
          >
            <span
              className="absolute top-1/2 left-1/2 grid h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
              style={{ background: "var(--fg)", color: "var(--bg)", boxShadow: "0 0 0 6px color-mix(in srgb, var(--accent-deep) 22%, transparent)" }}
            >
              <span className="font-mono text-[12px]">⟷</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ k, v, hot }: { k: string; v: string; hot: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <span className="mono">{k}</span>
      <span className="numeral text-[clamp(22px,2.4vw,34px)]" style={{ color: hot ? "var(--accent-deep)" : "var(--fg)", transition: "color .3s" }}>
        {v}
      </span>
    </div>
  );
}
