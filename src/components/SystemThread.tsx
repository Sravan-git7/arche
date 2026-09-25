import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { subscribeThread } from "../lib/threadBus";
import { services } from "../data/site";

/**
 * The shared-element thread.
 *
 * Four nodes are rendered exactly once, in a fixed layer. They are anchored
 * to two sets of invisible slots:
 *   [data-thread-slot="problem"]  — the compact diagram at the end of Problem
 *   [data-thread-slot="services"] — the four tab labels in Services
 *
 * Scroll progress between the two anchor sets drives a true shared-element
 * transform: same DOM nodes, repositioned, rescaled and relabelled. Nothing
 * is unmounted or swapped, so a single lime dot can be traced from the hero,
 * through the problem resolution, into becoming a Services tab.
 */

/** Must match ProblemSystem's morph thresholds. */
const MORPH_IN = 0.86;

/** Seconds for the eased fan-out when not scrubbing (reduced-motion fallback). */
const FAN_MS = 700;

type TThread = {
  root: HTMLElement;
  body: HTMLDivElement;
  dot: HTMLSpanElement;
  svc: HTMLSpanElement;
  cmp: HTMLSpanElement;
};

export function SystemThread() {
  const layer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = layer.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia("(min-width: 900px)").matches) return; // desktop only

    const nodes: TThread[] = Array.from(el.querySelectorAll<HTMLElement>(".tn")).map((root) => ({
      root,
      body: root.querySelector<HTMLDivElement>(".tn-body")!,
      dot: root.querySelector<HTMLSpanElement>(".tn-dot")!,
      svc: root.querySelector<HTMLSpanElement>(".tn-svc")!,
      cmp: root.querySelector<HTMLSpanElement>(".tn-cmp")!,
    }));

    const problemSlots = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-thread-slot="problem"]'));
    const serviceSlots = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-thread-slot="services"]'));

    let blend = 0;
    let problemP = 0;
    let raf = 0;

    const apply = () => {
      raf = 0;
      readProblem();
      const ps = problemSlots();
      const ss = serviceSlots();
      if (!ps.length || !ss.length) {
        el.style.opacity = "0";
        return;
      }

      // Hand-off: while travelling, the real tabs are hidden and the thread is
      // the only visible copy. At arrival the thread pill sits exactly on the
      // tab's pill, so the tab takes over invisibly and the section can scroll
      // (and be clicked) normally.
      const arrived = blend >= 0.999;
      const rail = document.querySelector<HTMLElement>("[data-thread-rail]");
      if (rail) {
        const next = arrived ? "done" : "travel";
        if (rail.dataset.handoff !== next) rail.dataset.handoff = next;
      }

      // Visible from the problem's compact-diagram state until arrival.
      const on = !arrived && (problemP >= MORPH_IN || blend > 0.001);
      el.style.opacity = on ? "1" : "0";
      if (!on) return;

      nodes.forEach((n, i) => {
        const a = ps[i]?.getBoundingClientRect();
        const b = ss[i]?.getBoundingClientRect();
        if (!a || !b) return;

        const ax = a.left + a.width / 2;
        const ay = a.top + a.height / 2;
        const bx = b.left + b.width / 2;
        const by = b.top + b.height / 2;
        const x = ax + (bx - ax) * blend;
        const y = ay + (by - ay) * blend;

        // The circle grows into a pill with the exact geometry of the real tab
        // (dot centred 13px in, label at 28px). Width is read from the real
        // pill's layout box, so the hand-off is exact regardless of font metrics.
        const pill = ss[i].querySelector<HTMLElement>(".svc-tab-pill");
        const targetW = pill ? pill.offsetWidth : 28 + n.svc.scrollWidth + 13;
        const targetH = pill ? pill.offsetHeight : b.height;
        const h = 36 + (targetH - 36) * blend;
        const padX = 13 * blend;
        const w = 36 + (targetW - 36) * blend;

        n.root.style.transform = `translate(${x}px, ${y}px)`;
        n.body.style.width = `${w}px`;
        n.body.style.height = `${h}px`;

        const dotX = w / 2 + (padX - w / 2) * blend;
        n.dot.style.left = `${dotX}px`;
        n.svc.style.left = `${dotX + 15}px`;
        n.svc.style.opacity = String(blend);
        n.cmp.style.opacity = String(1 - blend);

        const active = ss[i].dataset.active === "1";
        n.svc.style.color = active ? "var(--accent-deep)" : "var(--fg)";
        n.body.style.borderColor = active ? "var(--accent-deep)" : "var(--line)";
        n.dot.style.background = active ? "var(--accent-deep)" : "var(--faint)";
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const readProblem = () => {
      const pin = ScrollTrigger.getById("problem-pin");
      if (pin) problemP = pin.progress;
    };
    readProblem();

    const ctx = gsap.context(() => {

      // The boundary: fan out as Services arrives, completing as it pins.
      // String-based bounds — recomputed by ScrollTrigger on every refresh, so
      // the Problem pin-spacer changing layout can never leave them stale.
      const servicesSection = document.getElementById("services-home");
      ScrollTrigger.create({
        id: "thread-fanout",
        trigger: servicesSection,
        start: "top 62%",
        end: "top top",
        onUpdate: (self) => {
          blend = self.progress;
          schedule();
        },
        onRefresh: (self) => {
          blend = self.progress;
          schedule();
        },
      });
    }, el);

    const unsub = subscribeThread(schedule);
    const onRefresh = () => schedule();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    apply();

    return () => {
      unsub();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      if (raf) cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={layer}
      className="pointer-events-none fixed inset-0 z-[45]"
      style={{ opacity: 0, contain: "layout style" }}
      aria-hidden
    >
      {services.map((s) => (
        <div key={s.slug} className="tn absolute top-0 left-0" style={{ willChange: "transform" }}>
          <div className="tn-inner absolute" style={{ transform: "translate(-50%,-50%)" }}>
            <div
              className="tn-body relative flex-none items-center"
              style={{
                width: 36,
                height: 36,
                paddingLeft: 0,
                paddingRight: 0,
                borderRadius: 999,
                border: "1px solid var(--line)",
                background: "var(--card)",
                transition: "border-color .3s var(--e-out)",
              }}
            >
              <span
                className="tn-dot absolute top-1/2 block rounded-full"
                style={{
                  left: 18,
                  width: 6,
                  height: 6,
                  marginTop: -3,
                  marginLeft: -3,
                  background: "var(--faint)",
                }}
              />
              <span
                className="tn-svc mono absolute top-1/2 -translate-y-1/2 whitespace-nowrap"
                style={{ left: 28, opacity: 0 }}
              >
                {s.n} {s.title}
              </span>
            </div>
            <span
              className="tn-cmp mono mono-fg absolute whitespace-nowrap"
              style={{ top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", opacity: 1 }}
            />
          </div>
        </div>
      ))}
      <style>{`
        @media (prefers-reduced-motion: reduce) { .tn { display: none } }
      `}</style>
      <span className="hidden" data-fan={FAN_MS} />
    </div>
  );
}
