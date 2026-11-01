import { gsap, ScrollTrigger } from "../motion/gsap";

/**
 * Single persistent "signal" dot system.
 *
 * API per Prompt 04:
 * - signal.rideAnchor(el) — follows an element's position.
 * - signal.travel(fromEl, toEl, scrollTriggerConfig) — moves the dot along
 *   a quadratic arc between two anchor elements, with the arc's control point
 *   offset by 18 percent of the distance perpendicular to the straight line,
 *   scrubbed to scroll.
 *
 * Anchors are elements with a data-signal attribute:
 * - hero-dot
 * - problem-website
 * - rail-1
 * - cta-pill
 * - nav-logo-dot
 *
 * Positions are measured on refresh (invalidateOnRefresh).
 * The signal may never be visible twice at once.
 */

export function getSignalAnchor(target: HTMLElement | string | null): HTMLElement | null {
  if (!target || typeof window === "undefined") return null;
  if (typeof target !== "string") return target;
  return (
    document.querySelector<HTMLElement>(`[data-signal="${target}"]`) ||
    document.querySelector<HTMLElement>(target)
  );
}

export function computeQuadraticArc(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  offsetPercent = 0.18
) {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const dist = Math.hypot(dx, dy) || 1;
  const midX = (p0.x + p1.x) / 2;
  const midY = (p0.y + p1.y) / 2;
  // Perpendicular vector (-dy, dx) normalized
  // Leftward/graceful inward arc toward page center
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const offset = dist * offsetPercent;
  const cx = midX + perpX * offset;
  const cy = midY + perpY * offset;

  return {
    p0,
    p1,
    c: { x: cx, y: cy },
    at: (t: number) => {
      const u = 1 - t;
      const x = u * u * p0.x + 2 * u * t * cx + t * t * p1.x;
      const y = u * u * p0.y + 2 * u * t * cy + t * t * p1.y;
      return { x, y };
    },
  };
}

let signalElement: HTMLElement | null = null;

export function registerSignalElement(el: HTMLElement | null) {
  signalElement = el;
}

export function getSignalElement(): HTMLElement | null {
  if (!signalElement && typeof document !== "undefined") {
    signalElement = document.getElementById("signal-dot");
  }
  return signalElement;
}

export const signal = {
  getElement: getSignalElement,

  rideAnchor(target: HTMLElement | string | null) {
    const el = getSignalAnchor(target);
    const dot = getSignalElement();
    if (!el || !dot) return;
    const r = el.getBoundingClientRect();
    gsap.set(dot, {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      opacity: 1,
    });
  },

  travel(
    fromTarget: HTMLElement | string | null,
    toTarget: HTMLElement | string | null,
    config?: ScrollTrigger.Vars
  ): ScrollTrigger | null {
    const dot = getSignalElement();
    if (typeof window === "undefined" || !dot) return null;

    let fromEl: HTMLElement | null = null;
    let toEl: HTMLElement | null = null;
    let arc: ReturnType<typeof computeQuadraticArc> | null = null;

    const measure = () => {
      fromEl = getSignalAnchor(fromTarget);
      toEl = getSignalAnchor(toTarget);
      if (!fromEl || !toEl) return null;

      // Measure resting document positions
      const rFrom = fromEl.getBoundingClientRect();
      const docFromX = rFrom.left + rFrom.width / 2 + window.scrollX;
      const docFromY = rFrom.top + rFrom.height / 2 + window.scrollY;

      // For toEl: check if inside pinned section (like #problem)
      const pinRoot = toEl.closest<HTMLElement>("#problem") || toEl.closest<HTMLElement>("[data-bridge-root]");
      let docToX = 0;
      let docToY = 0;

      if (pinRoot) {
        // Find relative offset inside pinRoot
        let offX = 0;
        let offY = 0;
        let c: HTMLElement | null = toEl;
        while (c && c !== pinRoot) {
          offX += c.offsetLeft;
          offY += c.offsetTop;
          c = c.offsetParent as HTMLElement | null;
        }
        offX += toEl.offsetWidth / 2;
        offY += toEl.offsetHeight / 2;

        const pinTrigger = ScrollTrigger.getById("problem-pin");
        const pinStart = pinTrigger ? pinTrigger.start : pinRoot.offsetTop;
        docToX = pinRoot.offsetLeft + offX;
        docToY = pinStart + offY;
      } else {
        const rTo = toEl.getBoundingClientRect();
        docToX = rTo.left + rTo.width / 2 + window.scrollX;
        docToY = rTo.top + rTo.height / 2 + window.scrollY;
      }

      arc = computeQuadraticArc({ x: docFromX, y: docFromY }, { x: docToX, y: docToY }, 0.18);
      return arc;
    };

    measure();

    const progressObj = { t: 0 };

    const st = ScrollTrigger.create({
      ...config,
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure();
      },
      onUpdate: (self) => {
        if (!arc && !measure()) return;
        const t = self.progress;
        progressObj.t = t;

        // Exactly one dot visible rule:
        if (t <= 0.005) {
          if (fromEl) fromEl.style.visibility = "";
          dot.style.opacity = "0";
        } else if (t >= 0.995) {
          if (fromEl) fromEl.style.visibility = "hidden";
          dot.style.opacity = "0";
        } else {
          if (fromEl) fromEl.style.visibility = "hidden";
          dot.style.opacity = "1";
          const pos = arc!.at(t);
          // Convert from document coordinates to fixed viewport coordinates
          const screenX = pos.x;
          const screenY = pos.y - window.scrollY;
          dot.style.transform = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0)`;
        }
      },
      onLeave: () => {
        dot.style.opacity = "0";
      },
      onLeaveBack: () => {
        dot.style.opacity = "0";
        if (fromEl) fromEl.style.visibility = "";
      },
    });

    return st;
  },
};
