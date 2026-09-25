import { useLayoutEffect, useRef, useState } from "react";
import { projects, type Project } from "../data/projects";
import { services } from "../data/site";
import { Link } from "../lib/router";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";

const RATIO: Record<Project["ratio"], string> = {
  tall: "4 / 5",
  wide: "16 / 10",
  square: "1 / 1",
};

export type HonestyTag = "CLIENT WORK" | "INTERNAL BUILD" | "CONCEPT" | "EXPERIMENT";

export function getHonestyTag(status: string): HonestyTag {
  if (status === "Confidential Project" || status === "Client Work") return "CLIENT WORK";
  if (status === "Arche Lab" || status === "Internal Project" || status === "Internal Build") return "INTERNAL BUILD";
  if (status === "Concept") return "CONCEPT";
  return "EXPERIMENT";
}

/**
 * PROMPT 11 — Work Section (Editorial, Honest Evidence)
 *
 * Visual Composition:
 *   Near full-bleed project frames stacked vertically. Each features a prominent project number,
 *   title, summary, and a required Honesty Tag (CLIENT WORK / INTERNAL BUILD / CONCEPT / EXPERIMENT).
 *
 * Animation Choreography:
 *   - Clip-path wipes on viewport entry (alternating: Left-to-Right, Top-to-Bottom, Center-Out, Bottom-to-Top).
 *   - Desktop hover: Image content drifts at half pointer displacement speed under fixed metadata overlay.
 *   - Final project frame: Brightness/contrast shift as it nears Labs section.
 *   - Click/Tap: Expands in-place to reveal deep system details without broken navigation.
 */
export function ProjectRow({ p, i, isLast = false }: { p: Project; i: number; isLast?: boolean }) {
  const flip = i % 2 === 1;
  const widths = ["md:w-[54%]", "md:w-[48%]", "md:w-[58%]", "md:w-[50%]"];
  const [expanded, setExpanded] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const qx = useRef<((v: number) => void) | null>(null);
  const qy = useRef<((v: number) => void) | null>(null);

  const tag = getHonestyTag(p.status);

  // 1. Clip-Path Wipe Entry Reveal (alternating direction per project)
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el || prefersReducedMotion()) return;

    const wipes = [
      { from: "inset(0 100% 0 0)", to: "inset(0 0% 0 0)" },       // Left to Right
      { from: "inset(100% 0 0 0)", to: "inset(0% 0 0 0)" },       // Top to Bottom
      { from: "inset(50% 50% 50% 50%)", to: "inset(0% 0% 0% 0%)" },// Center Out
      { from: "inset(0 0 100% 0)", to: "inset(0 0 0% 0)" },       // Bottom to Top
    ];
    const w = wipes[i % wipes.length];

    const ctx = gsap.context(() => {
      gsap.set(el, { clipPath: w.from });
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(el, {
            clipPath: w.to,
            duration: 1.1,
            ease: "expo.out",
            onComplete: () => {
              gsap.set(el, { clearProps: "clipPath" });
            },
          });
        },
      });
    }, el);

    return () => ctx.revert();
  }, [i]);

  // 2. Final Project Frame Darkening (brightness/contrast shift as it nears Labs)
  useLayoutEffect(() => {
    if (!isLast || !imgRef.current || !frameRef.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: frameRef.current,
        start: "center center",
        end: "bottom 10%",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const brightness = 1 - progress * 0.35; // 1.0 -> 0.65
          const contrast = 1 + progress * 0.2;    // 1.0 -> 1.20
          if (imgRef.current) {
            imgRef.current.style.filter = `brightness(${brightness}) contrast(${contrast})`;
          }
        },
      });
    }, frameRef.current);

    return () => ctx.revert();
  }, [isLast]);

  // 3. Desktop Pointer Drift (image content shifts at half pointer speed under fixed overlay)
  const onPointerMove = (e: React.PointerEvent) => {
    if (!imgRef.current || !frameRef.current || !hasFinePointer() || prefersReducedMotion()) return;
    if (!qx.current) {
      qx.current = gsap.quickTo(imgRef.current, "x", { duration: 0.7, ease: "power3.out" });
      qy.current = gsap.quickTo(imgRef.current, "y", { duration: 0.7, ease: "power3.out" });
    }
    const b = frameRef.current.getBoundingClientRect();
    const nx = (e.clientX - b.left) / b.width - 0.5;
    const ny = (e.clientY - b.top) / b.height - 0.5;
    qx.current(-nx * 34);
    qy.current!(-ny * 24);
  };

  const onPointerLeave = () => {
    qx.current?.(0);
    qy.current?.(0);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setExpanded((prev) => !prev);
  };

  return (
    <div
      className="group relative flex flex-col gap-[24px] border-t py-[clamp(36px,5vw,76px)]"
      style={{ borderColor: "var(--line)" }}
    >
      <div className={`flex flex-col gap-[24px] md:flex-row md:items-center md:gap-[clamp(28px,4vw,80px)] ${flip ? "md:flex-row-reverse" : ""}`}>
        {/* Project Image Frame */}
        <div
          ref={frameRef}
          className={`relative w-full cursor-pointer overflow-hidden rounded-[6px] ${widths[i % widths.length]}`}
          data-r="clip"
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onClick={toggleExpand}
          data-cursor={expanded ? "CLOSE" : "EXPAND"}
          {...(i === 0 ? { "data-work-first-frame": "1" } : {})}
        >
          <div style={{ aspectRatio: RATIO[p.ratio], borderRadius: 6, overflow: "hidden" }}>
            <img
              ref={imgRef}
              src={p.img}
              alt={`${p.name} — ${p.serviceLabel}`}
              loading="lazy"
              decoding="async"
              className="h-[116%] w-[110%] max-w-none -translate-x-[5%] object-cover transition-[scale,filter] duration-[900ms] group-hover:scale-[1.04]"
              style={{ transitionTimingFunction: "var(--e-out)", willChange: "transform, filter" }}
            />
          </div>

          {/* Fixed Metadata Overlay 1: Prominent Honesty Tag */}
          <div className="pointer-events-none absolute top-[14px] left-[14px] z-[10] flex items-center gap-[8px]">
            <span
              className="mono rounded-full px-[12px] py-[6px] font-medium tracking-[0.14em]"
              style={{
                background: "rgba(12, 12, 13, 0.84)",
                color: tag === "CLIENT WORK" || tag === "EXPERIMENT" ? "#c8f14f" : "#f4f2ed",
                border: `1px ${tag === "EXPERIMENT" ? "dashed" : "solid"} ${tag === "CLIENT WORK" ? "var(--accent-deep)" : "rgba(244, 242, 237, 0.22)"}`,
                backdropFilter: "blur(8px)",
                fontSize: "10px",
              }}
            >
              {tag}
            </span>
          </div>

          {/* Fixed Metadata Overlay 2: Proof Sequence Chain */}
          <ProjectProof service={p.service} />
        </div>

        {/* Project Content */}
        <div className="flex flex-1 flex-col gap-[14px]">
          <div className="flex items-baseline justify-between gap-[14px]">
            <div className="flex items-baseline gap-[14px]">
              <span
                className="numeral outline-t transition-[translate] duration-700 group-hover:translate-x-[10px]"
                style={{ fontSize: "clamp(44px,6.5vw,96px)", transitionTimingFunction: "var(--e-out)" }}
              >
                {p.n}
              </span>
              <span className="mono" data-r="meta">
                {p.serviceLabel} · {p.year}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleExpand}
              className="mono btn btn-ghost text-[10px]"
              data-cursor={expanded ? "CLOSE" : "EXPAND"}
            >
              {expanded ? "Close detail ×" : "Case view +"}
            </button>
          </div>

          <h3 className="d3" data-r="mask" data-r-delay="40">
            {p.name}
          </h3>

          <p className="body max-w-[46ch]" data-r="meta" data-r-delay="110">
            {p.summary}
          </p>

          <div className="flex flex-wrap items-center gap-[6px]" data-r="meta" data-r-delay="150">
            {p.scope.map((s) => (
              <span
                key={s}
                className="mono"
                style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "4px 11px" }}
              >
                {s}
              </span>
            ))}
          </div>

          <div className="mt-[4px] flex items-center gap-[16px]">
            <button
              type="button"
              onClick={toggleExpand}
              className="mono mono-fg inline-flex items-center gap-[8px] transition-colors duration-500 group-hover:text-[var(--accent-deep)]"
            >
              {expanded ? "Collapse details" : "Expand case view"}
              <span className={`inline-block transition-transform duration-500 ${expanded ? "rotate-90" : "group-hover:translate-x-[5px]"}`}>
                →
              </span>
            </button>
            <Link to={`/services/${p.service}`} className="mono lnk text-[10.5px]">
              Explore service →
            </Link>
          </div>
        </div>
      </div>

      {/* In-Place Expanded Case View Drawer */}
      {expanded && (
        <div
          className="demo-in mt-[12px] overflow-hidden rounded-[6px] border p-[clamp(20px,3vw,36px)]"
          style={{ borderColor: "var(--accent-deep)", background: "var(--bg-2)" }}
        >
          <div className="flex items-start justify-between gap-[16px] border-b pb-[16px]" style={{ borderColor: "var(--line)" }}>
            <div>
              <div className="flex items-center gap-[10px] mb-[6px]">
                <span className="mono mono-a">{tag}</span>
                <span className="mono">·</span>
                <span className="mono mono-fg">{p.name}</span>
              </div>
              <h4 className="d4">System Specification & Scope</h4>
            </div>
            <button type="button" className="mono lnk" onClick={() => setExpanded(false)}>
              Close ×
            </button>
          </div>

          <div className="mt-[20px] grid gap-[24px] md:grid-cols-3">
            <div>
              <p className="mono mb-[6px]" style={{ color: "var(--accent-deep)" }}>Architecture</p>
              <p className="body-s">
                Designed to operate as a self-contained module within Arche's pipeline. Integrates directly into target business workflows.
              </p>
            </div>
            <div>
              <p className="mono mb-[6px]" style={{ color: "var(--accent-deep)" }}>Honesty Verification</p>
              <p className="body-s">
                Classified as <strong className="text-[var(--fg)]">{tag}</strong>. No vanity metrics or fabricated client names — evidence validated through functional code.
              </p>
            </div>
            <div>
              <p className="mono mb-[6px]" style={{ color: "var(--accent-deep)" }}>Execution Stack</p>
              <div className="flex flex-wrap gap-[6px] mt-[6px]">
                {p.scope.map((s) => (
                  <span key={s} className="mono rounded-full border px-[8px] py-[3px]" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectProof({ service }: { service: string }) {
  const detail =
    service === "video-editing"
      ? ["RAW", "CUT", "STORY"]
      : service === "web-development"
        ? ["VISITOR", "ACTION", "LEAD"]
        : service === "ai-chatbots"
          ? ["QUESTION", "CONTEXT", "ACTION"]
          : ["EVENT", "ROUTE", "DONE"];

  return (
    <div
      className="pointer-events-none absolute inset-x-[14px] bottom-[14px] z-[10] flex translate-y-[8px] items-center gap-[7px] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
      style={{ transitionTimingFunction: "var(--e-out)" }}
    >
      {detail.map((d, i) => (
        <span key={d} className="flex items-center gap-[7px]" style={{ transitionDelay: `${i * 60}ms` }}>
          <span
            className="mono rounded-full px-[9px] py-[5px]"
            style={{
              background: "rgba(12, 12, 13, 0.82)",
              color: i === detail.length - 1 ? "#c8f14f" : "#f4f2ed",
              backdropFilter: "blur(6px)",
            }}
          >
            {d}
          </span>
          {i < detail.length - 1 && <span className="mono" style={{ color: "#c8f14f" }}>→</span>}
        </span>
      ))}
    </div>
  );
}

export function WorkIndex({
  filter,
  limit,
  showFilters = true,
}: {
  filter?: string;
  limit?: number;
  showFilters?: boolean;
}) {
  const [active, setActive] = useState(filter || "all");
  const list = projects.filter((p) => active === "all" || p.service === active).slice(0, limit || 99);

  return (
    <div>
      {showFilters && !filter && (
        <div className="mb-[clamp(24px,3vw,48px)] flex flex-wrap gap-[8px]">
          <button className="chip" data-on={active === "all" ? "1" : "0"} onClick={() => setActive("all")}>
            All Work
          </button>
          {services.map((s) => (
            <button key={s.slug} className="chip" data-on={active === s.slug ? "1" : "0"} onClick={() => setActive(s.slug)}>
              {s.title}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col">
        {list.map((p, i) => (
          <ProjectRow key={p.slug} p={p} i={i} isLast={i === list.length - 1} />
        ))}
      </div>
      <span className="block h-px w-full" style={{ background: "var(--line)" }} />
    </div>
  );
}
