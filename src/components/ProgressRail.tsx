import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";

/**
 * "Where am I?" — a quiet chapter indicator built from the recurring lime
 * signal node. Chapters are any element with `data-chapter`. Desktop only.
 */
export function ProgressRail() {
  const [idx, setIdx] = useState(0);
  const [labels, setLabels] = useState<string[]>([]);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let triggers: ScrollTrigger[] = [];
    const t = window.setTimeout(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
      setLabels(els.map((e) => e.dataset.chapter || ""));
      triggers = els.map((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          refreshPriority: -1,
          onToggle: (s) => s.isActive && setIdx(i),
        })
      );
      triggers.push(
        ScrollTrigger.create({
          start: 0,
          end: "max",
          refreshPriority: -1,
          onUpdate: (s) => bar.current && gsap.set(bar.current, { scaleY: s.progress }),
        })
      );
      ScrollTrigger.refresh();
    }, 500);
    return () => {
      window.clearTimeout(t);
      triggers.forEach((tr) => tr.kill());
    };
  }, []);

  if (!labels.length) return null;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      {/* signal node + progress track (keeps true lime colour) */}
      <div className="pointer-events-none fixed bottom-[22px] left-[18px] z-[60] hidden h-[72px] w-[6px] flex-col items-center lg:flex" aria-hidden>
        <span className="signal-dot relative z-[1] flex-none" />
        <span className="relative mt-[6px] w-px flex-1 overflow-hidden" style={{ background: "rgba(128,128,128,.35)" }}>
          <span ref={bar} className="absolute inset-0 origin-top" style={{ background: "var(--accent-deep)", transform: "scaleY(0)" }} />
        </span>
      </div>
      {/* label blends against the page, so it reads on light and dark sections */}
      <div
        className="pointer-events-none fixed bottom-[18px] left-[34px] z-[60] hidden flex-col gap-[2px] rounded-[4px] px-[8px] py-[5px] lg:flex"
        style={{ color: "var(--fg)", background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(8px)", border: "1px solid var(--line)" }}
        aria-hidden
      >
        <span className="font-mono text-[10px] tracking-[.14em]">
          {pad(idx + 1)} / {pad(labels.length)}
        </span>
        <span key={idx} className="demo-in font-mono text-[10px] tracking-[.14em] uppercase" style={{ opacity: 0.75 }}>
          {labels[idx]}
        </span>
      </div>
    </>
  );
}
