import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { projects, type Project } from "../data/projects";
import { services } from "../data/site";
import { Link } from "../lib/router";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";
import { SpotlightCard } from "./SpotlightCard";
import { attachCardTilt } from "../motion/cardTilt";
import { SlotButton } from "./SlotButton";

const RATIO: Record<Project["ratio"], string> = {
  tall: "4 / 5",
  wide: "16 / 10",
  square: "1 / 1",
};

export type HonestyTag = "INTERNAL BUILD" | "CONCEPT" | "EXPERIMENT";

export function getHonestyTag(status: string): HonestyTag {
  if (status === "Arche Lab" || status === "Internal Project" || status === "Internal Build") return "INTERNAL BUILD";
  if (status === "Concept") return "CONCEPT";
  return "EXPERIMENT";
}

/**
 * PROMPT 11 — Work Section (Editorial, Honest Evidence)
 *
 * Visual Composition:
 *   Near full-bleed project frames stacked vertically. Each features a prominent project number,
 *   title, summary, and a required Honesty Tag (INTERNAL BUILD / CONCEPT / EXPERIMENT).
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
  // + Cursor glow spotlight tracked via CSS custom props
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
    // Glow spotlight: track pointer position as percentages
    const px = ((e.clientX - b.left) / b.width) * 100;
    const py = ((e.clientY - b.top) / b.height) * 100;
    frameRef.current.style.setProperty("--glow-x", `${px}%`);
    frameRef.current.style.setProperty("--glow-y", `${py}%`);
  };

  const onPointerLeave = () => {
    qx.current?.(0);
    qy.current?.(0);
    // Reset glow
    if (frameRef.current) {
      frameRef.current.style.setProperty("--glow-x", "50%");
      frameRef.current.style.setProperty("--glow-y", "50%");
    }
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
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setExpanded((value) => !value); } }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Close" : "Open"} ${p.name} details`}
          data-cursor="hover"
          style={{ "--glow-x": "50%", "--glow-y": "50%" } as React.CSSProperties}
        >
          {/* Cursor spotlight glow */}
          <div
            className="project-glow pointer-events-none absolute inset-0 z-[3] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: "radial-gradient(circle 180px at var(--glow-x) var(--glow-y), color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)",
            }}
            aria-hidden
          />
          <div style={{ aspectRatio: RATIO[p.ratio], borderRadius: 6, overflow: "hidden" }}>
            <img
              ref={imgRef}
              src={p.img}
              alt={`${p.name} — ${p.serviceLabel}`}
              loading="lazy"
              decoding="async"
              className="h-[116%] w-[110%] max-w-none -translate-x-[5%] object-cover transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
              style={{ transitionTimingFunction: "var(--e-out)", willChange: "transform, filter" }}
            />
          </div>

          {/* Fixed Metadata Overlay 1: Prominent Honesty Tag */}
          <div className="pointer-events-none absolute top-[14px] left-[14px] z-[10] flex items-center gap-[8px]">
            <span
              className="mono rounded-full px-[12px] py-[6px] font-medium tracking-[0.14em]"
              style={{
                background: "rgba(12, 12, 13, 0.84)",
                color: tag === "EXPERIMENT" ? "#c8f14f" : "#f4f2ed",
                border: `1px ${tag === "EXPERIMENT" ? "dashed" : "solid"} rgba(244, 242, 237, 0.22)`,
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
                className="font-extrabold tracking-tight select-none transition-[translate] duration-700 group-hover:translate-x-[10px]"
                style={{
                  fontSize: "clamp(44px,6.5vw,96px)",
                  transitionTimingFunction: "var(--e-out)",
                  background:
                    "linear-gradient(180deg, rgba(244,241,224,0.65) 0%, rgba(146,153,141,0.22) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontFamily: "'Inter Tight', sans-serif",
                  lineHeight: 1,
                }}
              >
                {p.n}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-[#9CA496]" data-r="meta">
                {p.serviceLabel} · {p.year}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleExpand}
              aria-expanded={expanded}
              className="font-mono text-[11px] uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/15 text-[#D4D9CD] hover:text-[#9EE41A] hover:border-[#9EE41A]/50 transition-all cursor-pointer"
              data-cursor="hover"
            >
              {expanded ? "Close Detail ×" : "Case View +"}
            </button>
          </div>

          <h3 className="text-[clamp(1.75rem,2.8vw,2.5rem)] font-bold tracking-tight leading-[1.1]" data-r="mask" data-r-delay="40">
            <span className="shiny-ink-text">{p.name}</span>
          </h3>

          <p className="text-[16px] leading-relaxed text-[#D2D8CC] max-w-[48ch]" data-r="meta" data-r-delay="110">
            {p.summary}
          </p>

          <p className="font-mono text-[11px] text-[#9CA496] tracking-wide" data-r="meta" data-r-delay="150">
            {p.scope.join(" · ")}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <SlotButton
              onClick={toggleExpand}
              variant="hero-primary"
              arrow="right"
              className="!h-[40px] !px-5 !text-[11.5px] !font-bold"
            >
              {expanded ? "Collapse Details" : "Expand Case View"}
            </SlotButton>
            <SlotButton
              to={`/services/${p.service}`}
              variant="smoked-glass"
              arrow="right"
              className="!h-[40px] !px-5 !text-[11.5px]"
            >
              Explore Service
            </SlotButton>
          </div>
        </div>
      </div>

      {/* In-Place Expanded Case View Drawer */}
      {expanded && (
        <div
          className="demo-in mt-4 overflow-hidden rounded-xl border border-white/15 p-[clamp(20px,3vw,36px)] backdrop-blur-md shadow-2xl"
          style={{ background: "rgba(18, 26, 17, 0.92)" }}
        >
          <div className="flex items-start justify-between gap-[16px] border-b border-white/10 pb-[16px]">
            <div>
              <div className="flex items-center gap-[10px] mb-[6px]">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-[#9EE41A] uppercase">{tag}</span>
                <span className="text-[#9CA496]">·</span>
                <span className="font-mono text-[11px] text-[#F4F1E0] tracking-wider uppercase">{p.name}</span>
              </div>
              <h4 className="text-xl font-bold tracking-tight text-[#F4F1E0]">System Specification & Scope</h4>
            </div>
            <button
              type="button"
              className="font-mono text-xs uppercase tracking-wider text-[#D4D9CD] hover:text-[#9EE41A] transition-colors"
              onClick={() => setExpanded(false)}
            >
              Close ×
            </button>
          </div>

          <div className="mt-[20px] grid gap-[24px] md:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider font-semibold text-[#9EE41A] mb-2">Architecture</p>
              <p className="text-sm leading-relaxed text-[#D2D8CC]">
                An example of a self-contained module and how it could connect to a wider business workflow.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider font-semibold text-[#9EE41A] mb-2">Honesty Verification</p>
              <p className="text-sm leading-relaxed text-[#D2D8CC]">
                Classified as <strong className="text-[#F4F1E0] font-semibold">{tag}</strong>. Self-initiated work or a concept — not a client case study, testimonial or claimed result.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider font-semibold text-[#9EE41A] mb-2">Execution Stack</p>
              <div className="flex flex-wrap gap-[6px] mt-2">
                {p.scope.map((s) => (
                  <span
                    key={s}
                    className="font-mono text-[11px] rounded-full border border-white/15 bg-white/[0.06] text-[#F4F1E0] px-3 py-1"
                  >
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

export function WorkCarousel({ items }: { items: Project[] }) {
  const [startIndex, setStartIndex] = useState(0);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const visibleCount = 3;
  const maxIndex = Math.max(0, items.length - visibleCount);

  const prev = () => setStartIndex((i) => Math.max(0, i - 1));
  const next = () => setStartIndex((i) => Math.min(maxIndex, i + 1));

  const visibleItems = items.slice(startIndex, startIndex + visibleCount);

  // Attach weighted 3D card tilt & push physics to work cards + entrance motion
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll<HTMLElement>(".frosted-crystal");
    const thumbnails = gridRef.current.querySelectorAll<HTMLElement>(".work-thumbnail-frame");
    const cleanups: (() => void)[] = [];
    cards.forEach((c) => cleanups.push(attachCardTilt(c)));

    if (!prefersReducedMotion()) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          cards,
          { x: 28, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );

        gsap.fromTo(
          thumbnails,
          { clipPath: "inset(12% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 0.85,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }, gridRef);

      cleanups.push(() => ctx.revert());
    }

    return () => cleanups.forEach((c) => c());
  }, [startIndex]);

  return (
    <div className="w-full">
      {/* Carousel Controls Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#92998D] uppercase tracking-wider font-semibold">
            SHOWCASE · {String(startIndex + 1).padStart(2, "0")}–{String(Math.min(items.length, startIndex + visibleCount)).padStart(2, "0")} OF {String(items.length).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={startIndex === 0}
            data-cursor="hover"
            aria-label="Previous work slide"
            className="btn-tactile w-10 h-10 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md flex items-center justify-center text-[#F4F1E0] hover:bg-white/[0.12] hover:border-[#9EE41A]/70 hover:text-[#9EE41A] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            disabled={startIndex >= maxIndex}
            data-cursor="hover"
            aria-label="Next work slide"
            className="btn-tactile w-10 h-10 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md flex items-center justify-center text-[#F4F1E0] hover:bg-white/[0.12] hover:border-[#9EE41A]/70 hover:text-[#9EE41A] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* 3-Up Carousel Grid */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleItems.map((p) => {
          const tag = getHonestyTag(p.status);
          const isExpanded = expandedSlug === p.slug;

          return (
            <SpotlightCard
              key={p.slug}
              data-cursor="hover"
              className="smoked-cypress-glass arche-glow-card shiny-border group relative flex flex-col justify-between p-5 rounded-2xl transition-all"
            >
              <div>
                {/* Recessed Dark Smoked Glass Tray wrapping Media Thumbnail */}
                <div
                  data-cursor="view"
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 p-1 cursor-pointer"
                  style={{
                    background: "rgba(18, 26, 17, 0.70)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 8px 24px -6px rgba(0, 0, 0, 0.55)",
                  }}
                >
                  <div
                    className="work-thumbnail-frame relative h-full w-full overflow-hidden rounded-lg bg-black/40 dark-console-frame"
                    style={{
                      boxShadow: "0 24px 48px -16px rgba(0, 0, 0, 0.75)",
                    }}
                  >
                    <img
                      src={p.img}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />

                    {/* Smoked-Glass LIVE Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 text-white border border-white/15 backdrop-blur-md shadow-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9EE41A] opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#9EE41A]" />
                      </span>
                      <span className="font-mono text-[9px] font-semibold tracking-widest text-[#9EE41A]">
                        LIVE
                      </span>
                    </div>

                    {/* Honesty Pill Tag */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="px-2 py-0.5 rounded-full bg-black/80 text-[#F4F4EE] border border-white/10 backdrop-blur-md font-mono text-[9px] tracking-wider uppercase">
                        {tag}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta Header */}
                <div className="mt-4 flex items-center justify-between text-[#9CA496] font-mono text-[11.5px] font-semibold tracking-wider uppercase">
                  <span>{p.n} · {p.serviceLabel}</span>
                  <span>{p.year}</span>
                </div>

                {/* Project Title */}
                <h3 className="mt-2 text-xl sm:text-[22px] font-bold tracking-tight text-[#F4F1E0] group-hover:text-[#9EE41A] transition-colors">
                  {p.name}
                </h3>

                {/* Summary */}
                <p className="mt-2 text-[14.5px] font-normal text-[#C4CBC0] leading-relaxed line-clamp-2">
                  {p.summary}
                </p>

                {/* Single-line clean muted scope caption */}
                <p className="mt-3 font-mono text-[11px] text-[#92998D] tracking-wide">
                  {p.scope.slice(0, 3).join(" · ")}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpandedSlug(isExpanded ? null : p.slug)}
                  data-cursor="hover"
                  className="font-mono text-[11.5px] font-semibold tracking-wider uppercase text-[#D4D9CD] hover:text-[#9EE41A] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>{isExpanded ? "Hide Spec" : "View Spec"}</span>
                  <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                </button>

                <div className="action-circle !bg-white/5 !border-white/15 !text-white group-hover:!border-[#9EE41A] group-hover:!text-[#9EE41A]">
                  <span className="action-circle-icon text-sm">↗</span>
                </div>
              </div>

              {/* In-Card Spec Overlay if expanded */}
              {isExpanded && (
                <div className="mt-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-[13px] text-[#C4CBC0] font-normal space-y-1.5">
                  <p className="font-mono text-[11.5px] font-bold uppercase text-[#F4F1E0]">
                    System Architecture · {tag}
                  </p>
                  <p className="text-[13px] leading-relaxed text-[#C4CBC0]">
                    Designed as a modular capability within Arché&apos;s single operating model.
                  </p>
                  <Link
                    to={`/services/${p.service}`}
                    className="inline-block mt-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#9EE41A] hover:underline"
                  >
                    Explore Service Pipeline →
                  </Link>
                </div>
              )}
            </SpotlightCard>
          );
        })}
      </div>
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
  const filtered = projects.filter((p) => active === "all" || p.service === active);

  // When limit is set (e.g. Home page 3-up showcase), render horizontal 3-up carousel
  if (!showFilters || limit) {
    return <WorkCarousel items={filtered} />;
  }

  const list = filtered.slice(0, limit || 99);

  return (
    <div>
      {showFilters && !filter && (
        <div className="mb-[clamp(24px,3vw,48px)] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive("all")}
            className={`font-mono text-[11px] tracking-wider uppercase px-4 py-2 rounded-full transition-all duration-300 cursor-pointer ${
              active === "all"
                ? "bg-[#F4F1E0] text-[#11120F] font-bold shadow-[0_0_16px_rgba(244,241,224,0.30)] border border-[#F4F1E0]"
                : "bg-white/[0.06] text-[#D2D8CC] border border-white/15 hover:bg-white/[0.12] hover:text-white hover:border-white/30"
            }`}
          >
            All Work ({projects.length})
          </button>
          {services.map((s) => {
            const count = projects.filter((p) => p.service === s.slug).length;
            const isSelected = active === s.slug;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => setActive(s.slug)}
                className={`font-mono text-[11px] tracking-wider uppercase px-4 py-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-[#F4F1E0] text-[#11120F] font-bold shadow-[0_0_16px_rgba(244,241,224,0.30)] border border-[#F4F1E0]"
                    : "bg-white/[0.06] text-[#D2D8CC] border border-white/15 hover:bg-white/[0.12] hover:text-white hover:border-white/30"
                }`}
              >
                {s.title} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
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
