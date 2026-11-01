import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { services, siteContent } from "../data/site";
import { ServiceStage } from "./SystemStage";
import { Link } from "../lib/router";
import { gsap, ScrollTrigger, prefersReducedMotion, onMotionPreferenceChange } from "../lib/gsap";
import { emitThread } from "../lib/threadBus";
import { hasFinePointer } from "../lib/interact";
import { onPreviewDone } from "../lib/autoplay";
import { digitRoll } from "../motion/helpers";

/**
 * SERVICES ΓÇö shared shell.
 *
 *  left   number ┬╖ title ┬╖ tagline ┬╖ arc chips ┬╖ Explore link   (unchanged)
 *  right  a live stage frame; each tab brings its own product
 *  bottom tab rail with connecting line ΓÇö the arrival point of the
 *         shared thread from the Problem section
 */
const HOVER_MS = 400;

const N = services.length;

/** Pin length: 340vh (85vh per service across 4 services). */
const pinDistance = () => Math.round(window.innerHeight * 3.4);

export type ShowcaseMode = "AUTO" | "MANUAL";

export const SHOWCASE_CONFIG = {
  /** Dwell time after a demo's showcase completes before advancing (ms) */
  dwellAfterShowcaseMs: 1800,
  /** Dwell time when prefersReducedMotion is enabled (ms) */
  reducedMotionDwellMs: 4000,
  /**
   * Safety timeout per service in case a preview signal is delayed or already marked played.
   * Generous enough for full showcase + margin.
   */
  safetyTimeoutMs: {
    "video-editing": 7500,
    "web-development": 7000,
    "ai-chatbots": 7500,
    "ai-automation": 13000,
  } as Record<string, number>,
} as const;

export function Chapters() {
  const root = useRef<HTMLElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef(0);
  const firstIndex = useRef(true);

  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(() => new Set([services[0].slug]));
  const [showcaseMode, setShowcaseMode] = useState<ShowcaseMode>("AUTO");

  /* ---- pinned scroll state ΓÇö desktop only ---- */
  const [pinned, setPinned] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches && !prefersReducedMotion()
  );
  const [pinOn, setPinOn] = useState(false);
  const pinSt = useRef<ScrollTrigger | null>(null);
  const prevIndexRef = useRef(0);

  const numeralFillRef = useRef<HTMLSpanElement>(null);
  const counterNumRef = useRef<HTMLSpanElement>(null);
  const progressLineRef = useRef<HTMLSpanElement>(null);
  const headerStatementRef = useRef<HTMLSpanElement>(null);

  // Demo autoplay is event-synchronized with morph completion (single source of truth)
  const [demoActive, setDemoActive] = useState(true);

  const indexRef = useRef(0);
  indexRef.current = index;
  const targetIndexRef = useRef(0);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const showcaseModeRef = useRef<ShowcaseMode>("AUTO");
  showcaseModeRef.current = showcaseMode;
  const advanceTimerRef = useRef<number>(0);
  const previewDoneUnsubRef = useRef<(() => void) | null>(null);
  const inViewRef = useRef(false);
  inViewRef.current = inView;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => setPinned(mq.matches && !prefersReducedMotion());
    mq.addEventListener("change", sync);
    const unsubs = onMotionPreferenceChange(sync);
    return () => {
      mq.removeEventListener("change", sync);
      unsubs();
    };
  }, []);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = 0;
    }
    if (previewDoneUnsubRef.current) {
      previewDoneUnsubRef.current();
      previewDoneUnsubRef.current = null;
    }
  };

  /** Arms automatic progression to the next service upon showcase completion + dwell */
  const armAutoAdvance = (serviceSlug: string) => {
    clearAdvanceTimer();
    if (showcaseModeRef.current !== "AUTO" || !inViewRef.current) return;

    const triggerNext = () => {
      clearAdvanceTimer();
      if (showcaseModeRef.current !== "AUTO" || !inViewRef.current) return;
      const nextIdx = (indexRef.current + 1) % services.length;
      transitionToService(nextIdx);
    };

    if (prefersReducedMotion()) {
      advanceTimerRef.current = window.setTimeout(triggerNext, SHOWCASE_CONFIG.reducedMotionDwellMs);
      return;
    }

    const safetyMs = SHOWCASE_CONFIG.safetyTimeoutMs[serviceSlug] ?? 8000;
    advanceTimerRef.current = window.setTimeout(triggerNext, safetyMs);

    previewDoneUnsubRef.current = onPreviewDone((doneSlug) => {
      if (doneSlug !== serviceSlug) return;
      if (showcaseModeRef.current !== "AUTO") {
        clearAdvanceTimer();
        return;
      }
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
      }
      advanceTimerRef.current = window.setTimeout(triggerNext, SHOWCASE_CONFIG.dwellAfterShowcaseMs);
    });
  };

  const handleStageSettled = (settledSlug: string) => {
    const currentTarget = services[targetIndexRef.current]?.slug;
    const currentIndex = services[indexRef.current]?.slug;
    if (currentTarget === settledSlug || currentIndex === settledSlug) {
      setDemoActive(true);
      if (showcaseModeRef.current === "AUTO") {
        armAutoAdvance(settledSlug);
      }
    }
  };

  const intro = siteContent.servicesIntro;
  const s = services[index];

  /** Orchestrates outgoing elements exit then incoming elements entrance */
  const transitionToService = (newIndex: number) => {
    if (newIndex === targetIndexRef.current && newIndex === indexRef.current) return;
    setDemoActive(false);
    const oldIndex = indexRef.current;
    prevIndexRef.current = oldIndex;
    targetIndexRef.current = newIndex;

    // Active service rail dot gets one ring pulse per activation (Scale 1 -> 1.8, Opacity 0.6 -> 0, 0.7s)
    const targetSlug = services[newIndex].slug;
    const activeDotRing = document.querySelector<HTMLElement>(`[data-rail-dot="${targetSlug}"] .rail-pulse-ring`);
    if (activeDotRing) {
      gsap.fromTo(activeDotRing, { scale: 1, opacity: 0.6 }, { scale: 1.8, opacity: 0, duration: 0.7, ease: "power2.out" });
    }

    if (prefersReducedMotion()) {
      setIndex(newIndex);
      setVisited((v) => (v.has(services[newIndex].slug) ? v : new Set(v).add(services[newIndex].slug)));
      return;
    }

    // 1. Leaving service: outgoing elements exit (yPercent: -40, opacity: 0, duration: 0.35s, stagger: 0.04s)
    const copyEl = copy.current;
    if (copyEl) {
      const outgoingEls = Array.from(copyEl.querySelectorAll(".svc-title-word, .svc-desc, .svc-tag-item, .btn"));
      gsap.to(outgoingEls, {
        yPercent: -40,
        opacity: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: () => {
          // Guard against stale closures if another transition started
          if (targetIndexRef.current !== newIndex) return;

          // 2. Commit new service state
          setIndex(newIndex);
          setVisited((v) => (v.has(services[newIndex].slug) ? v : new Set(v).add(services[newIndex].slug)));

          // Roll counter digit
          if (counterNumRef.current) {
            digitRoll(counterNumRef.current, services[oldIndex].n, services[newIndex].n, {
              duration: 0.6,
              ease: "power2.out",
            });
          }

          // 3. Active service entrance: incoming elements enter without overlap
          requestAnimationFrame(() => {
            const freshCopy = copy.current;
            if (!freshCopy) return;

            // Numeral fills with lime using clip-path wipe from bottom to top over 0.8s
            if (numeralFillRef.current) {
              gsap.fromTo(
                numeralFillRef.current,
                { clipPath: "inset(100% 0% 0% 0%)" },
                { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power2.out" }
              );
            }

            // Title lines reveal through masks over 0.8s, stagger 0.08s
            const freshWords = freshCopy.querySelectorAll(".svc-title-word");
            gsap.fromTo(
              freshWords,
              { yPercent: 100, opacity: 1 },
              { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
            );

            // Description lines reveal
            const freshDesc = freshCopy.querySelector(".svc-desc");
            if (freshDesc) {
              gsap.fromTo(
                freshDesc,
                { yPercent: 100, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
              );
            }

            // Three tags rise with stagger 0.06s
            const freshTags = freshCopy.querySelectorAll(".svc-tag-item");
            gsap.fromTo(
              freshTags,
              { y: 16, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power2.out" }
            );

            // EXPLORE button fades in last
            const freshBtn = freshCopy.querySelector(".btn");
            if (freshBtn) {
              gsap.fromTo(
                freshBtn,
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 0.4, delay: 0.3, ease: "power2.out" }
              );
            }
          });
        },
      });
    } else {
      setIndex(newIndex);
      setVisited((v) => (v.has(services[newIndex].slug) ? v : new Set(v).add(services[newIndex].slug)));
    }
  };

  /** Manual selection: cancels automatic progression and locks selected service indefinitely */
  const selectFromUser = (newIndex: number) => {
    clearAdvanceTimer();
    setShowcaseMode("MANUAL");
    showcaseModeRef.current = "MANUAL";

    if (newIndex === indexRef.current && newIndex === targetIndexRef.current) {
      return;
    }

    transitionToService(newIndex);
  };
  const selectFromUserRef = useRef(selectFromUser);
  selectFromUserRef.current = selectFromUser;

  const pinOnRef = useRef(false);
  pinOnRef.current = pinOn;

  const hoverStart = (i: number) => {
    if (!hasFinePointer() || i === index || pinOn) return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      if (pinOnRef.current) return;
      if (indexRef.current === i) return;
      setPreview(i);
    }, HOVER_MS);
  };
  const hoverEnd = () => {
    window.clearTimeout(hoverTimer.current);
    setPreview(null);
  };

  useEffect(
    () => () => {
      window.clearTimeout(hoverTimer.current);
      clearAdvanceTimer();
    },
    []
  );

  /*
   * Nav hover-preview handoff. A nav thumbnail click either
   * fires the select-service event (same-page jump) or stashes the slug
   * in sessionStorage (cross-route).
   */
  useEffect(() => {
    const apply = (slug: string, andScroll: boolean) => {
      const i = services.findIndex((sv) => sv.slug === slug);
      if (i < 0) return;
      selectFromUserRef.current(i);
      if (andScroll && !pinnedRef.current) {
        window.setTimeout(() => {
          document.getElementById("services-home")?.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
        }, 180);
      }
    };
    const onEv = (e: Event) => apply((e as CustomEvent).detail, false);
    window.addEventListener("arche:select-service", onEv);
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem("arche:svcTab");
      sessionStorage.removeItem("arche:svcTab");
    } catch {
      /* ignore */
    }
    if (pending) apply(pending, true);
    return () => window.removeEventListener("arche:select-service", onEv);
  }, []);

  // Viewport observer: stages animate and autonomous progression runs while on screen
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0].isIntersecting;
        setInView(isVisible);
        inViewRef.current = isVisible;
        if (isVisible) {
          if (showcaseModeRef.current === "AUTO") {
            armAutoAdvance(services[indexRef.current].slug);
          }
        } else {
          clearAdvanceTimer();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearAdvanceTimer();
    };
  }, []);

  /*
   * Pinned scroll container (desktop, motion OK).
   * Pin keeps page navigation stable and predictable.
   * Service selection is autonomous or locked; scrolling does NOT change active service.
   */
  useLayoutEffect(() => {
    if (!pinned) {
      pinSt.current = null;
      setPinOn(false);
      return;
    }
    const sec = root.current;
    if (!sec) return;

    const fitStage = () => {
      const h = Math.min(440, Math.max(300, Math.round(window.innerHeight - 350)));
      sec.style.setProperty("--svc-stage-h", `${h}px`);
    };
    fitStage();

    const ctx = gsap.context(() => {
      pinSt.current = ScrollTrigger.create({
        id: "services-pin",
        trigger: sec,
        start: "top top",
        end: () => `+=${pinDistance()}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: () => fitStage(),
        onToggle: (self) => setPinOn(self.isActive),
      });
      setPinOn(pinSt.current.isActive);
    }, sec);

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        fitStage();
        ScrollTrigger.refresh();
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ctx.revert();
      pinSt.current = null;
      setPinOn(false);
    };
  }, [pinned]);

  // left column follows the committed tab on mobile / unpinned
  useEffect(() => {
    emitThread();
    if (firstIndex.current) {
      firstIndex.current = false;
      return;
    }
    // keep the active tab centred in the mobile strip
    const st = strip.current;
    const tab = st?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    if (st && tab && st.scrollWidth > st.clientWidth) {
      st.scrollTo({ left: tab.offsetLeft - (st.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [index]);

  return (
    <section
      id="services-home"
      ref={root}
      className={
        pinned
          ? "relative w-full pt-[86px] pb-[clamp(24px,4vh,48px)] min-[900px]:-mt-[30vh]"
          : "relative w-full py-[clamp(56px,8vh,96px)]"
      }
    >
      <div ref={moduleRef} className="wrap flex flex-col">
        {/* header */}
        <div className="order-0 flex items-end justify-between gap-[16px] border-b pb-[14px]" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-col gap-[4px] min-[900px]:flex-row min-[900px]:items-baseline min-[900px]:gap-[16px]">
            <span className="mono mono-a">{intro.label}</span>
            <span className="overflow-hidden inline-block">
              <span ref={headerStatementRef} className="d4 max-w-[32ch] inline-block">{intro.statement}</span>
            </span>
          </div>
          <span className="mono flex-none"><span ref={counterNumRef} className="inline-block">{s.n}</span> / {String(services.length).padStart(2, "0")}</span>
        </div>

        {/* copy + stage: Rebalanced layout with stretched left column vertically distributed between content group and bottom CTA */}
        <div className="order-2 grid items-start gap-[clamp(28px,3.5vw,48px)] py-[clamp(20px,3vh,32px)] min-[900px]:items-stretch min-[900px]:grid-cols-[clamp(340px,28vw,410px)_minmax(0,1fr)]">
          <div ref={copy} className="flex min-w-0 flex-col min-[900px]:h-full min-[900px]:justify-between min-[900px]:pt-[2px] min-[900px]:pb-[12px]">
            {/* PRIMARY GROUP 1: CONTENT GROUP (Service Number, Title, Description, Process Tags) */}
            <div className="flex flex-col">
              {/* Service Number */}
              <button
                type="button"
                className="self-start cursor-pointer bg-transparent border-0 p-0 text-left"
                style={{ marginBottom: "clamp(12px, 1.4vw, 16px)" }}
                onClick={() => selectFromUser((index + 1) % N)}
                aria-label={`Service ${s.n} of ${services.length} ΓÇö show next service`}
                data-cursor="NEXT"
              >
                <span className="relative block select-none" style={{ fontSize: "clamp(46px,5vw,78px)", lineHeight: 1 }}>
                  <span className="numeral outline-t block">
                    {s.n}
                  </span>
                  <span
                    ref={numeralFillRef}
                    className="numeral absolute inset-0 block"
                    style={{
                      color: "var(--accent-deep)",
                      WebkitTextStroke: "0px transparent",
                      clipPath: "inset(0% 0% 0% 0%)",
                    }}
                    aria-hidden
                  >
                    {s.n}
                  </span>
                </span>
              </button>

              {/* Service Title */}
              <h3
                className="d2"
                style={{
                  fontSize: "clamp(26px,3.2vw,48px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.035em",
                  marginBottom: "clamp(18px, 1.8vw, 22px)",
                }}
              >
                {s.title.split(" ").map((w, idx) => (
                  <span key={idx} className="inline-block overflow-hidden mr-[0.28em] align-top pb-[0.05em] -mb-[0.05em]">
                    <span className="svc-title-word inline-block">{w}</span>
                  </span>
                ))}
              </h3>

              {/* Description */}
              <div className="overflow-hidden" style={{ marginBottom: "clamp(22px, 2.2vw, 26px)" }}>
                <p className="svc-desc body max-w-[36ch]" style={{ lineHeight: 1.55 }}>
                  {s.tagline}
                </p>
              </div>

              {/* Process Tags */}
              <div
                className="flex flex-wrap items-center gap-x-[clamp(6px,0.9vw,10px)] gap-y-[8px] mb-[clamp(24px,3vh,30px)] min-[900px]:mb-0"
              >
                {s.arc.map((a, k) => (
                  <span key={a} className="svc-tag-item flex items-center gap-[clamp(6px,0.9vw,10px)] flex-none">
                    <span
                      className="mono"
                      style={{
                        padding: "5px 11px",
                        border: `1px solid ${k === s.arc.length - 1 ? "var(--accent-deep)" : "var(--line)"}`,
                        borderRadius: 999,
                        color: k === s.arc.length - 1 ? "var(--accent-ink)" : "var(--muted)",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a}
                    </span>
                    {k < s.arc.length - 1 && (
                      <span className="mono select-none" style={{ color: "var(--faint)", lineHeight: 1 }} aria-hidden>
                        ΓåÆ
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* PRIMARY GROUP 2: EXPLORE CTA */}
            <div className="svc-btn-wrap">
              <Link
                to={`/services/${s.slug}`}
                className="btn btn-ghost"
                cursor="OPEN"
                onNavigate={() => {
                  const stage = document.getElementById("services-stage");
                  if (stage && !prefersReducedMotion()) {
                    gsap.to(stage, {
                      scale: 1.04,
                      opacity: 0.9,
                      duration: 0.35,
                      ease: "power2.out",
                    });
                  }
                }}
              >
                Explore {s.title} <span className="arw">ΓåÆ</span>
              </Link>
            </div>
          </div>

          <div className="relative min-w-0 w-full">
            <ServiceStage
              slug={s.slug}
              previewSlug={preview !== null ? services[preview].slug : null}
              active={(inView || pinOn) && demoActive}
              visited={visited}
              onSelect={selectFromUser}
              onStageSettled={handleStageSettled}
            />
          </div>
        </div>

        {/* tab rail ΓÇö the shared thread's arrival point */}
        <div
          className="order-1 flex items-center gap-[clamp(10px,1.2vw,16px)] pt-[14px] min-[900px]:order-3 min-[900px]:border-t"
          style={{ borderColor: "var(--line)" }}
        >
          <div
            ref={strip}
            data-thread-rail
            role="tablist"
            aria-label="Services"
            className="svc-rail hide-scroll -mx-[var(--gut)] flex snap-x snap-mandatory gap-[8px] overflow-x-auto px-[var(--gut)] min-[900px]:mx-0 min-[900px]:gap-[clamp(10px,1.2vw,16px)] min-[900px]:overflow-visible min-[900px]:px-0"
            onMouseLeave={hoverEnd}
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
              e.preventDefault();
              const next = e.key === "Home" ? 0 : e.key === "End" ? N - 1 : (index + (e.key === "ArrowRight" ? 1 : -1) + N) % N;
              selectFromUser(next);
              strip.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}
          >
            {services.map((sv, i) => (
              <button
                key={sv.slug}
                type="button"
                role="tab"
                id={`svc-tab-${sv.slug}`}
                aria-controls="services-stage"
                data-i={i}
                data-thread-slot="services"
                data-active={i === index ? "1" : "0"}
                data-preview={preview === i ? "1" : "0"}
                aria-selected={i === index}
                onClick={() => selectFromUser(i)}
                onMouseEnter={() => hoverStart(i)}
                onFocus={() => hoverEnd()}
                className="svc-tab flex h-[34px] flex-none snap-center items-center justify-center min-[900px]:min-w-[clamp(126px,12.5vw,176px)]"
                data-cursor={i === index ? undefined : "OPEN"}
              >
                <span className="svc-tab-pill relative overflow-hidden">
                  <span
                    className="svc-tab-border pointer-events-none absolute inset-0 rounded-[999px] border border-[var(--accent-deep)]"
                    style={{
                      opacity: i === index ? 1 : 0,
                      clipPath: i === index ? "inset(0% 0% 0% 0%)" : "inset(0% 100% 0% 0%)",
                    }}
                  />
                  <span className="svc-tab-dot" />
                  <span className="mono whitespace-nowrap">{sv.n} {sv.title}</span>
                </span>
              </button>
            ))}
          </div>
          <span className="relative hidden h-px flex-1 overflow-hidden min-[900px]:block" style={{ background: "var(--line)" }}>
            <span
              ref={progressLineRef}
              className="absolute inset-0 origin-left"
              style={{
                background: "var(--accent-deep)",
                transform: `scaleX(${index / (services.length - 1)})`,
                transition: "transform .6s var(--e-out)",
              }}
            />
          </span>
          <span className="mono hidden flex-none min-[900px]:block" aria-live="polite">
            {preview !== null
              ? "Previewing"
              : showcaseMode === "AUTO"
                ? `Showcase ┬╖ ${s.n} / ${String(N).padStart(2, "0")} ┬╖ auto`
                : `Service ${s.n} / ${String(N).padStart(2, "0")} ┬╖ locked`}
          </span>
        </div>
      </div>
    </section>
  );
}

