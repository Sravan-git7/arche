import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { services, siteContent } from "../data/site";
import { ServiceStage } from "./SystemStage";
import { Link } from "../lib/router";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { emitThread } from "../lib/threadBus";
import { hasFinePointer } from "../lib/interact";
import { DONE_BEAT_MS, IDLE_ADVANCE_MS, holdFor, onPreviewDone, previewPlayed } from "../lib/autoplay";

/**
 * SERVICES — shared shell, normal scroll (not pinned).
 *
 *  left   number · title · tagline · arc chips · Explore link   (unchanged)
 *  right  a live stage frame; each tab brings its own product
 *  bottom tab rail with connecting line — the arrival point of the
 *         shared thread from the Problem section
 *
 * Tabs commit on click (or the number badge, which advances).
 * On desktop, resting on a tab for >400ms previews it in the stage
 * without committing. Mobile: swipeable strip, tap commits.
 * The whole module opens once from the centre as it first enters.
 *
 * PROMPT 24 — autoplay-first. A visitor who only scrolls still sees all
 * four services demonstrate themselves: each tab runs its own first-view
 * preview (owned by the stage), and if nothing in this section has been
 * touched ~6s after it enters the viewport the tabs advance on their own,
 * once around, then hold. Any interaction — tab click, click inside a demo,
 * a hover-preview — ends the tour immediately and for the rest of the visit.
 */
const HOVER_MS = 400;

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
  const [touring, setTouring] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(() => new Set([services[0].slug]));

  /* ---- idle tour state (Prompt 24) ---- */
  const touched = useRef(false); // visitor took control — permanently
  const autoTimer = useRef(0);
  const autoOff = useRef<(() => void) | null>(null);
  const autoSteps = useRef(0); // tabs the tour has advanced through
  const indexRef = useRef(0);
  indexRef.current = index;
  const advanceRef = useRef<() => void>(() => {});

  const intro = siteContent.servicesIntro;
  const s = services[index];

  const clearAutoTimer = () => {
    if (autoTimer.current) {
      window.clearTimeout(autoTimer.current);
      autoTimer.current = 0;
    }
    autoOff.current?.();
    autoOff.current = null;
  };

  /** The visitor engaged with anything here: autoplay stops for this visit. */
  const takeControl = () => {
    if (touched.current) return;
    touched.current = true;
    clearAutoTimer();
    setTouring(false);
  };

  advanceRef.current = () => {
    clearAutoTimer();
    autoSteps.current += 1;
    select((indexRef.current + 1) % services.length);
  };

  const select = (i: number) => {
    window.clearTimeout(hoverTimer.current);
    setPreview(null);
    setIndex(i);
    setVisited((v) => (v.has(services[i].slug) ? v : new Set(v).add(services[i].slug)));
  };

  const hoverStart = (i: number) => {
    if (!hasFinePointer() || i === index) return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      // Resting on another tab is engagement: the tour hands over.
      takeControl();
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
      clearAutoTimer();
    },
    []
  );

  /*
   * The idle tour itself. Re-armed for whichever tab is current, only while
   * the section is on screen and untouched, and only until all four tabs have
   * been shown once — then it holds on the last one and never moves again.
   * A demo reporting "preview done" shortens the wait to a natural beat.
   */
  useEffect(() => {
    if (!inView || touched.current || prefersReducedMotion()) return;
    if (autoSteps.current >= services.length - 1) {
      setTouring(false);
      return;
    }
    const slug = services[index].slug;
    const startedAt = performance.now();
    setTouring(true);

    const fire = () => advanceRef.current();
    // A tab whose preview already ran (visitor scrolled away and back) just
    // holds for the idle beat — nothing is going to report "done" again.
    autoTimer.current = window.setTimeout(fire, previewPlayed(slug) ? IDLE_ADVANCE_MS : holdFor(slug));
    autoOff.current = onPreviewDone((done) => {
      if (done !== slug || !autoTimer.current) return;
      const elapsed = performance.now() - startedAt;
      window.clearTimeout(autoTimer.current);
      autoTimer.current = window.setTimeout(fire, Math.max(DONE_BEAT_MS, IDLE_ADVANCE_MS - elapsed));
    });

    return () => {
      clearAutoTimer();
      setTouring(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, index]);

  /*
   * PROMPT 20 — nav hover-preview handoff. A nav thumbnail click either
   * fires the select-service event (same-page jump) or stashes the slug
   * in sessionStorage (cross-route). Either way the tab commits here and
   * the section scrolls into view.
   */
  useEffect(() => {
    const apply = (slug: string, andScroll: boolean) => {
      const i = services.findIndex((s) => s.slug === slug);
      if (i < 0) return;
      // Choosing a service from the nav is explicit intent: no idle tour.
      takeControl();
      select(i);
      if (andScroll) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // stages only animate while the section is on screen
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // one-time clip-path reveal, opening from the centre
  useLayoutEffect(() => {
    const m = moduleRef.current;
    if (!m || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.set(m, { clipPath: "inset(50% 50% 50% 50% round 6px)" });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 88%",
        once: true,
        onEnter: () =>
          gsap.to(m, {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            duration: 1,
            ease: "expo.inOut",
            onComplete: () => gsap.set(m, { clearProps: "clipPath" }),
          }),
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // left column follows the committed tab
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
    if (prefersReducedMotion() || !copy.current) return;
    gsap.fromTo(
      copy.current.querySelectorAll("[data-m]"),
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power3.out", overwrite: true }
    );
  }, [index]);

  return (
    <section
      id="services-home"
      ref={root}
      className="relative w-full py-[clamp(56px,8vh,96px)]"
      onPointerDown={takeControl}
      onKeyDown={takeControl}
    >
      <div ref={moduleRef} className="wrap flex flex-col">
        {/* header */}
        <div className="order-0 flex items-end justify-between gap-[16px] border-b pb-[14px]" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-col gap-[4px] min-[900px]:flex-row min-[900px]:items-baseline min-[900px]:gap-[16px]">
            <span className="mono mono-a">{intro.label}</span>
            <span className="d4 max-w-[32ch]">{intro.statement}</span>
          </div>
          <span className="mono flex-none">{s.n} / {String(services.length).padStart(2, "0")}</span>
        </div>

        {/* copy + stage */}
        <div className="order-2 grid items-center gap-[clamp(18px,2.8vw,48px)] py-[clamp(20px,3vh,32px)] min-[900px]:grid-cols-12">
          <div ref={copy} className="flex flex-col gap-[14px] min-[900px]:col-span-5">
            <div className="flex flex-col gap-[2px]">
              <button
                type="button"
                className="self-start"
                onClick={() => select((index + 1) % services.length)}
                aria-label={`Service ${s.n} of ${services.length} — show next service`}
                data-cursor="NEXT"
              >
                <span data-m className="numeral outline-t block" style={{ fontSize: "clamp(48px,5.5vw,88px)" }}>
                  {s.n}
                </span>
              </button>
              <h3 data-m className="d2" style={{ fontSize: "clamp(28px,3.5vw,54px)" }}>
                {s.title}
              </h3>
            </div>
            <p data-m className="body max-w-[38ch]">
              {s.tagline}
            </p>
            <div data-m className="flex flex-wrap items-center gap-[8px]">
              {s.arc.map((a, k) => (
                <span key={a} className="flex items-center gap-[8px]">
                  <span
                    className="mono"
                    style={{
                      padding: "5px 11px",
                      border: `1px solid ${k === s.arc.length - 1 ? "var(--accent-deep)" : "var(--line)"}`,
                      borderRadius: 999,
                      color: k === s.arc.length - 1 ? "var(--accent-deep)" : "var(--muted)",
                    }}
                  >
                    {a}
                  </span>
                  {k < s.arc.length - 1 && <span className="mono">→</span>}
                </span>
              ))}
            </div>
            <div data-m>
              <Link
                to={`/services/${s.slug}`}
                className="btn btn-ghost mt-[4px]"
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
                Explore {s.title} <span className="arw">→</span>
              </Link>
            </div>
          </div>

          <div className="relative min-[900px]:col-span-7">
            <ServiceStage
              slug={s.slug}
              previewSlug={preview !== null ? services[preview].slug : null}
              active={inView}
              visited={visited}
            />
          </div>
        </div>

        {/* tab rail — the shared thread's arrival point */}
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
          >
            {services.map((sv, i) => (
              <button
                key={sv.slug}
                type="button"
                role="tab"
                data-i={i}
                data-thread-slot="services"
                data-active={i === index ? "1" : "0"}
                data-preview={preview === i ? "1" : "0"}
                aria-selected={i === index}
                onClick={() => select(i)}
                onMouseEnter={() => hoverStart(i)}
                onFocus={() => hoverEnd()}
                className="svc-tab flex h-[34px] flex-none snap-center items-center justify-center min-[900px]:min-w-[clamp(126px,12.5vw,176px)]"
                data-cursor={i === index ? undefined : "OPEN"}
              >
                <span className="svc-tab-pill">
                  <span className="svc-tab-dot" />
                  <span className="mono whitespace-nowrap">{sv.n} {sv.title}</span>
                </span>
              </button>
            ))}
          </div>
          <span className="relative hidden h-px flex-1 overflow-hidden min-[900px]:block" style={{ background: "var(--line)" }}>
            <span
              className="absolute inset-0 origin-left"
              style={{
                background: "var(--accent-deep)",
                transform: `scaleX(${index / (services.length - 1)})`,
                transition: "transform .6s var(--e-out)",
              }}
            />
          </span>
          <span className="mono hidden flex-none min-[900px]:block" aria-live="polite">
            {preview !== null ? "Previewing" : touring ? "Auto-tour · click to take over" : "Select a service"}
          </span>
        </div>
      </div>
    </section>
  );
}
