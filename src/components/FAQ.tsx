import { useEffect, useRef, useState } from "react";
import { siteContent } from "../data/site";
import { Link } from "../lib/router";
import { gsap, prefersReducedMotion } from "../lib/gsap";

function Item({
  n,
  q,
  a,
  open,
  onToggle,
}: {
  n: string;
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const p = panel.current;
    const i = inner.current;
    if (!p || !i) return;

    if (first.current) {
      first.current = false;
      gsap.set(p, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
      gsap.set(bar.current, { scaleX: open ? 1 : 0 });
      return;
    }
    if (prefersReducedMotion()) {
      gsap.set(p, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
      return;
    }

    gsap.killTweensOf(p);
    if (open) {
      gsap.fromTo(
        p,
        { height: 0, opacity: 0 },
        { height: i.offsetHeight, opacity: 1, duration: 0.6, ease: "expo.out", onComplete: () => gsap.set(p, { height: "auto" }) }
      );
      gsap.fromTo(i.querySelectorAll(".faq-a"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, delay: 0.07, ease: "power3.out" });
    } else {
      gsap.to(p, { height: 0, opacity: 0, duration: 0.42, ease: "power2.inOut" });
    }
    gsap.to(bar.current, { scaleX: open ? 1 : 0, duration: 0.5, ease: "expo.out" });
  }, [open]);

  return (
    <div
      className="relative rounded-[4px]"
      style={{
        transform: open ? "translateX(6px)" : "none",
        background: open ? "var(--bg)" : "transparent",
        transition: "transform .5s var(--e-out), background .5s var(--e-out)",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-start gap-[16px] border-t py-[clamp(16px,1.9vw,24px)] text-left md:gap-[36px]"
        style={{ borderColor: "var(--line)" }}
      >
        <span className="mono flex-none pt-[6px]" style={{ width: 26, color: open ? "var(--accent-deep)" : "var(--faint)", transition: "color .4s" }}>
          {n}
        </span>
        <h3 className="d4 flex-1" style={{ maxWidth: "26ch", color: open ? "var(--fg)" : "var(--muted)", transition: "color .4s" }}>
          {q}
        </h3>
        <span className="relative mt-[8px] block h-[11px] w-[11px] flex-none">
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2" style={{ background: "var(--fg)" }} />
          <span
            className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2"
            style={{
              background: "var(--fg)",
              transform: `translateY(-50%) rotate(${open ? 0 : 90}deg)`,
              transition: "transform .5s var(--e-out)",
            }}
          />
        </span>
      </button>
      <span ref={bar} className="absolute top-0 left-0 block h-px w-full origin-left" style={{ background: "var(--accent-deep)" }} />
      <div ref={panel} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <div ref={inner} className="pb-[24px] md:pl-[78px]">
          <p className="faq-a body max-w-[62ch]">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const { label, statement, items } = siteContent.faq;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="w-full py-[clamp(70px,9vw,140px)]" style={{ background: "var(--bg-2)" }}>
      <div className="wrap grid gap-[clamp(28px,4vw,64px)] lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[110px]">
            <p className="mono mono-a mb-[12px]">{label}</p>
            <h2 className="d2 mb-[20px] max-w-[10ch]" data-r="mask">
              {statement}
            </h2>
            <p className="body mb-[24px] max-w-[34ch]" data-r="meta" data-r-delay="100">
              Anything unanswered? Ask us directly — you'll hear back within a working day.
            </p>
            <Link to="/contact" className="btn" cursor="START">
              Start a project <span className="arw">→</span>
            </Link>
          </div>
        </div>
        <div className="lg:col-span-8">
          {items.map((it, i) => (
            <Item key={it.q} n={String(i + 1).padStart(2, "0")} q={it.q} a={it.a} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
          <span className="block h-px w-full" style={{ background: "var(--line)" }} />
        </div>
      </div>
    </section>
  );
}
