import { gsap } from "./gsap";

type Service = "video-editing" | "web-development" | "ai-automation" | "ai-chatbots";
type Formation = "layers" | "network" | "focus" | "timeline";
type Entry = "top" | "bottom" | "left" | "right";

type Direction = {
  name: string;
  formation: Formation;
  entry: Entry;
  trace: "rail" | "branch" | "converge" | "sequence";
  reverse?: boolean;
  tilt: number;
  ease: string;
};

/** The service order is deliberately unchanged. Each directed pair has its
 * own intermediate composition; the four main handoffs have particularly
 * different geometry, not merely a different direction of the same fade. */
const DIRECTIONS: Record<string, Direction> = {
  "video-editing>web-development": { name: "edit-to-interface", formation: "layers", entry: "bottom", trace: "rail", tilt: 18, ease: "power2.inOut" },
  "video-editing>ai-automation": { name: "tracks-to-routing", formation: "network", entry: "left", trace: "branch", tilt: -9, ease: "power2.inOut" },
  "video-editing>ai-chatbots": { name: "frames-to-intent", formation: "focus", entry: "bottom", trace: "converge", tilt: 10, ease: "power3.inOut" },
  "web-development>video-editing": { name: "interface-to-edit", formation: "timeline", entry: "top", trace: "sequence", reverse: true, tilt: -12, ease: "power2.inOut" },
  "web-development>ai-automation": { name: "interface-to-workflow", formation: "network", entry: "left", trace: "branch", tilt: 8, ease: "power3.inOut" },
  "web-development>ai-chatbots": { name: "interface-to-question", formation: "focus", entry: "right", trace: "converge", tilt: -7, ease: "power2.inOut" },
  "ai-automation>video-editing": { name: "workflow-to-edit", formation: "timeline", entry: "left", trace: "sequence", tilt: 8, ease: "power2.inOut" },
  "ai-automation>web-development": { name: "workflow-to-interface", formation: "layers", entry: "right", trace: "branch", reverse: true, tilt: -14, ease: "power3.inOut" },
  "ai-automation>ai-chatbots": { name: "workflow-to-intelligence", formation: "focus", entry: "left", trace: "converge", tilt: 11, ease: "power4.inOut" },
  "ai-chatbots>video-editing": { name: "output-to-timeline", formation: "timeline", entry: "bottom", trace: "sequence", tilt: -10, ease: "power2.inOut" },
  "ai-chatbots>web-development": { name: "intent-to-interface", formation: "layers", entry: "top", trace: "rail", reverse: true, tilt: 12, ease: "power3.inOut" },
  "ai-chatbots>ai-automation": { name: "intent-to-routing", formation: "network", entry: "right", trace: "branch", reverse: true, tilt: -8, ease: "power3.inOut" },
};

// Each visual grammar has its own beat: editorial layers cut in quickly,
// routing builds node by node, intelligence converges almost together, and
// the returning timeline resolves as a sequence rather than a simultaneous pop.
const RHYTHMS: Record<Formation, { tempo: number; step: number; traceAt: number }> = {
  layers: { tempo: .98, step: .018, traceAt: .23 },
  network: { tempo: 1.04, step: .024, traceAt: .20 },
  focus: { tempo: .92, step: .008, traceAt: .26 },
  timeline: { tempo: 1.02, step: .020, traceAt: .19 },
};

const FEATURES: Record<Service, string> = {
  "video-editing": ".edit-stages button",
  "web-development": ".web-phase-rail button, .web-blueprint-hero, .web-blueprint-block, .web-site-content > div",
  "ai-automation": ".workflow-step",
  "ai-chatbots": ".agent-experience-conversation, .agent-route > span, .agent-suggestions button",
};

// These are the supporting parts of the *existing* demo. The feature nodes
// remain visible as they reorganise; only their surrounding context recedes.
const SUPPORT: Record<Service, string> = {
  "video-editing": ".edit-demo-head, .edit-preview, .edit-timeline-label, .edit-scrub",
  "web-development": ".web-mini-top, .web-blueprint-label, .web-blueprint > p, .web-site-nav, .web-experience-footer",
  "ai-automation": ".workflow-toolbar, .workflow-column-label, .workflow-records, .workflow-footer",
  "ai-chatbots": ".agent-experience-head, .agent-disclosure, .agent-experience-form",
};

type Rect = { cx: number; cy: number; width: number; height: number };
type Point = { x: number; y: number; width: number; height: number };

export type ServiceFilmCapture = {
  shell: HTMLElement;
  snapshot: HTMLElement;
  from: Service;
  to: Service;
  oldHeight: number;
  dispose: () => void;
};
export type ServiceFilmControl = { finish: () => void; cancel: () => void };

const isService = (slug: string): slug is Service => Object.prototype.hasOwnProperty.call(FEATURES, slug);

function copyScrollPositions(source: HTMLElement, clone: HTMLElement) {
  const originals = [source, ...source.querySelectorAll<HTMLElement>("*")];
  const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  originals.forEach((el, i) => {
    if (el.scrollLeft || el.scrollTop) {
      copies[i].scrollLeft = el.scrollLeft;
      copies[i].scrollTop = el.scrollTop;
    }
  });
}

/** Hold a non-interactive visual copy of the actual outgoing demo for one
 * transition. The new demo mounts immediately below it, so the selected tab,
 * accessible panel and interactive state never wait for the animation. */
export function captureServiceFilm(shell: HTMLElement, layer: HTMLElement, from: string, to: string): ServiceFilmCapture | null {
  if (!isService(from) || !isService(to) || from === to) return null;
  const rect = layer.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const snapshot = layer.cloneNode(true) as HTMLElement;
  snapshot.classList.add("svc-film-snapshot");
  snapshot.inert = true;
  snapshot.setAttribute("aria-hidden", "true");
  snapshot.removeAttribute("id");
  snapshot.querySelectorAll("[id], [for]").forEach((el) => { el.removeAttribute("id"); el.removeAttribute("for"); });
  snapshot.querySelectorAll("a, button, input, textarea, select, [tabindex]").forEach((el) => el.setAttribute("tabindex", "-1"));
  Object.assign(snapshot.style, {
    position: "absolute", left: "0", top: "0", width: `${rect.width}px`, height: `${rect.height}px`,
    minHeight: "0", pointerEvents: "none", zIndex: "3", margin: "0", overflow: "visible",
  });
  shell.appendChild(snapshot);
  copyScrollPositions(layer, snapshot);
  return { shell, snapshot, from, to, oldHeight: rect.height, dispose: () => snapshot.remove() };
}

function rectOf(el: Element, shellRect: DOMRect): Rect {
  const r = el.getBoundingClientRect();
  return { cx: r.left - shellRect.left + r.width / 2, cy: r.top - shellRect.top + r.height / 2, width: r.width, height: r.height };
}

// Don't pull a completely scrolled-out timeline item into the transition.
// Partially visible items are retained, as they are part of the current view.
function visibleFeature(el: HTMLElement, root: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.width <= 1 || r.height <= 1) return false;
  let parent = el.parentElement;
  while (parent && parent !== root) {
    const style = getComputedStyle(parent);
    const clipX = /(hidden|auto|scroll|clip)/.test(style.overflowX);
    const clipY = /(hidden|auto|scroll|clip)/.test(style.overflowY);
    if (clipX || clipY) {
      const p = parent.getBoundingClientRect();
      if ((clipX && (r.right <= p.left || r.left >= p.right)) || (clipY && (r.bottom <= p.top || r.top >= p.bottom))) return false;
    }
    parent = parent.parentElement;
  }
  return true;
}

function formationPoints(kind: Formation, count: number, width: number, height: number, reverse: boolean): Point[] {
  const n = Math.max(1, count);
  return Array.from({ length: n }, (_, index) => {
    const i = reverse ? n - index - 1 : index;
    const t = n === 1 ? 0.5 : i / (n - 1);
    switch (kind) {
      case "layers":
        return { x: width * (0.50 + (t - 0.5) * 0.08), y: height * (0.29 + t * 0.38), width: width * (0.60 - t * 0.12), height: Math.max(8, height * 0.035) };
      case "network": {
        const points = [[.18,.48], [.32,.30], [.32,.66], [.50,.48], [.68,.30], [.68,.66], [.82,.48]];
        const p = points[Math.round(t * (points.length - 1))];
        return { x: width * p[0], y: height * p[1], width: 18, height: 18 };
      }
      case "focus":
        return { x: width * 0.50 + (i - (n - 1) / 2) * 5, y: height * 0.47 + (i % 2 ? 5 : -5), width: 22, height: 22 };
      case "timeline":
        return { x: width * (0.16 + 0.68 * ((i + 0.5) / n)), y: height * (0.69 + (i % 2 ? 0.012 : 0)), width: Math.max(20, width * 0.65 / n), height: 15 };
    }
  });
}

/** Make direct text in a cloned item separately fadeable without changing
 * the original demo's DOM or state. */
function wrapSnapshotText(el: HTMLElement) {
  Array.from(el.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return;
    const span = document.createElement("span");
    span.textContent = node.textContent;
    node.replaceWith(span);
  });
}

// Unlike clip-path, a CSS mask does not change hit testing. A touch or focus
// on an incoming control can therefore finish the film on the first attempt.
function revealMask(entry: Entry, percent: number) {
  const direction = { top: "bottom", bottom: "top", left: "right", right: "left" }[entry];
  return `linear-gradient(to ${direction}, #000 ${percent}%, transparent ${percent + 12}%)`;
}

const SVG_NS = "http://www.w3.org/2000/svg";
function makeTrace(shell: HTMLElement, plan: Direction, points: Point[], width: number, height: number) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("svc-film-trace");
  // The shell can change height on mobile. Keep one SVG unit equal to one
  // measured CSS pixel instead of stretching the route during that resize.
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  shell.appendChild(svg);

  const middle = points[Math.floor(points.length / 2)] ?? { x: width / 2, y: height / 2 };
  let routes: string[];
  if (plan.trace === "branch") {
    const list = [...points].sort((a, b) => a.x - b.x);
    routes = [list.map((p, i) => i ? `H${p.x} V${p.y}` : `M${p.x} ${p.y}`).join(" ")];
  } else if (plan.trace === "converge") {
    // Two signals approach the same point; neither jumps between subpaths.
    routes = [`M${width * .16} ${height * .47} H${middle.x}`, `M${width * .84} ${height * .47} H${middle.x}`];
  } else if (plan.trace === "sequence") {
    routes = [`M${width * .13} ${height * .69} H${width * .87}`];
  } else {
    routes = [`M${width * .14} ${height * .47} H${width * .86}`];
  }
  const paths = routes.map((d) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--accent-deep)");
    path.setAttribute("stroke-width", "1.25");
    path.setAttribute("pathLength", "1");
    path.setAttribute("stroke-dasharray", "1");
    path.setAttribute("stroke-dashoffset", "1");
    svg.appendChild(path);
    return path;
  });
  const dots = paths.map(() => {
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("r", "3");
    dot.setAttribute("fill", "var(--accent-deep)");
    dot.setAttribute("opacity", "0");
    svg.appendChild(dot);
    return dot;
  });
  return { svg, paths, dots };
}

/** Turn real outgoing interface parts into the incoming interface's parts.
 * The temporary snapshot is inert and short-lived; interrupting a film reverts
 * every inline transform before the next one measures its geometry. */
export function playServiceFilm(capture: ServiceFilmCapture, incoming: HTMLElement, onComplete: () => void): ServiceFilmControl | null {
  const { shell, snapshot, from, to, oldHeight } = capture;
  const plan = DIRECTIONS[`${from}>${to}`];
  const shellRect = shell.getBoundingClientRect();
  const newHeight = incoming.getBoundingClientRect().height;
  const mobile = window.matchMedia("(max-width: 899px), (pointer: coarse)").matches;
  const speed = mobile ? 0.68 : 1;
  const maximum = mobile ? 5 : 7;
  const allSources = Array.from(snapshot.querySelectorAll<HTMLElement>(FEATURES[from]));
  const source = allSources.filter((el) => visibleFeature(el, snapshot)).slice(0, maximum);
  const targets = Array.from(incoming.querySelectorAll<HTMLElement>(FEATURES[to]))
    .filter((el) => visibleFeature(el, incoming)).slice(0, maximum);
  const sourceRects = source.map((el) => rectOf(el, shellRect));
  const targetRects = targets.map((el) => rectOf(el, shellRect));
  const width = shellRect.width;
  if (!plan || !source.length || !targets.length || !width || !newHeight) {
    capture.dispose();
    return null;
  }
  const height = Math.min(Math.max(oldHeight, newHeight), mobile ? 460 : Math.max(oldHeight, newHeight));
  const points = formationPoints(plan.formation, source.length, width, height, !!plan.reverse);
  const trace = makeTrace(shell, plan, points, width, height);
  source.forEach(wrapSnapshotText);

  let timeline: gsap.core.Timeline | null = null;
  let context: gsap.Context | null = null;
  let finished = false;
  const cleanup = () => {
    if (finished) return;
    finished = true;
    window.removeEventListener("resize", cleanup);
    document.removeEventListener("visibilitychange", onVisibility);
    context?.revert();
    trace.svg.remove();
    capture.dispose();
    delete shell.dataset.film;
    onComplete();
  };

  const onVisibility = () => { if (document.visibilityState !== "visible") cleanup(); };
  window.addEventListener("resize", cleanup);
  document.addEventListener("visibilitychange", onVisibility);
  shell.dataset.film = plan.name;
  // Create the context before adding work so a partially unsupported effect
  // can still revert any styles it managed to apply before failing.
  context = gsap.context(() => {}, shell);
  try {
    context.add(() => {
      // Features can leave a clipped timeline, website frame or workflow list;
      // the stage itself remains the clipping boundary.
      const ancestors = new Set<HTMLElement>();
      source.forEach((el) => {
        let parent = el.parentElement;
        while (parent && parent !== snapshot) { ancestors.add(parent); parent = parent.parentElement; }
      });
      // Preserve a visitor's scrolled timeline position when releasing its
      // clip; otherwise changing overflow would snap the clone back to zero.
      const clipped = [...ancestors].map((el) => ({ el, style: getComputedStyle(el), x: el.scrollLeft, y: el.scrollTop }))
        .filter(({ style }) => /(hidden|auto|scroll|clip)/.test(`${style.overflowX} ${style.overflowY}`));
      clipped.forEach(({ el, x, y }) => {
        gsap.set(el, { overflow: "visible" });
        if (x || y) gsap.set(el.children, {
          x: (_i: number, child: HTMLElement) => Number(gsap.getProperty(child, "x")) - x,
          y: (_i: number, child: HTMLElement) => Number(gsap.getProperty(child, "y")) - y,
        });
      });
      gsap.set(snapshot, { perspective: mobile ? 0 : 1100, transformStyle: "preserve-3d" });
      gsap.set(source, { transformOrigin: "50% 50%", force3D: true, position: "relative", zIndex: 4 });
      const basePositions = source.map((el) => ({ x: Number(gsap.getProperty(el, "x")) || 0, y: Number(gsap.getProperty(el, "y")) || 0 }));
      gsap.set(targets, { opacity: 0 });
      const canMask = typeof CSS !== "undefined" && CSS.supports("mask-image", "linear-gradient(to right, black, transparent)");
      gsap.set(incoming, { opacity: 0.12, ...(canMask ? { maskImage: revealMask(plan.entry, -12) } : {}) });
      if (Math.abs(oldHeight - newHeight) > 1) gsap.set(shell, { height: oldHeight, overflow: "hidden" });

      timeline = gsap.timeline({ onComplete: cleanup });
      const rhythm = RHYTHMS[plan.formation];
      const t = (seconds: number) => seconds * speed * rhythm.tempo;
      const supports = snapshot.querySelectorAll<HTMLElement>(SUPPORT[from]);
      const remainder = allSources.filter((el) => !source.includes(el));
      const featureChildren = source.flatMap((el) => Array.from(el.children));
      timeline.to([...supports, ...remainder], { opacity: 0, y: plan.entry === "bottom" ? -8 : 8, duration: t(.24), ease: "power2.in" }, t(.06));
      timeline.to(featureChildren, { opacity: 0, duration: t(.12), stagger: t(.006), ease: "power1.in" }, t(.07));
      timeline.to(source, { backgroundColor: "rgba(244,242,237,.95)", boxShadow: "inset 0 0 0 1px rgba(99,128,43,.45)", duration: t(.17), stagger: t(.012), ease: "power2.out" }, t(.08));

      // Anticipation for editing: the real playhead is left untouched. A
      // transient signal runs along its current track in the inert snapshot.
      const scrub = from === "video-editing" ? snapshot.querySelector<HTMLInputElement>(".edit-scrub input") : null;
      if (scrub) {
        const r = rectOf(scrub, shellRect);
        const min = Number(scrub.min || 0), max = Number(scrub.max || 100);
        const progress = max > min ? Math.max(0, Math.min(1, (Number(scrub.value) - min) / (max - min))) : 0;
        const dot = document.createElementNS(SVG_NS, "circle");
        dot.setAttribute("r", "3.5");
        dot.setAttribute("fill", "var(--accent-deep)");
        dot.setAttribute("cx", String(r.cx - r.width / 2 + r.width * progress));
        dot.setAttribute("cy", String(r.cy));
        trace.svg.appendChild(dot);
        timeline.to(dot, { attr: { cx: r.cx + r.width / 2 }, duration: t(.22), ease: "power2.in" }, 0);
        timeline.to(dot, { opacity: 0, duration: t(.08) }, t(.20));
      }

      source.forEach((el, i) => {
        const r = sourceRects[i];
        const p = points[i];
        timeline!.to(el, {
          x: basePositions[i].x + p.x - r.cx, y: basePositions[i].y + p.y - r.cy,
          scaleX: p.width / r.width, scaleY: p.height / r.height,
          rotationX: mobile ? 0 : plan.tilt, rotationY: mobile ? 0 : plan.tilt * .35,
          borderRadius: plan.formation === "network" || plan.formation === "focus" ? "50%" : "2px",
          duration: t(.30), ease: plan.ease,
        }, t(.13 + i * rhythm.step));
      });

      timeline.to(trace.paths, { attr: { "stroke-dashoffset": 0 }, duration: t(.25), ease: "power2.inOut" }, t(rhythm.traceAt));
      const travel = { p: 0 };
      const lengths = trace.paths.map((path) => {
        try { return path.getTotalLength(); } catch { return 0; }
      });
      timeline.to(trace.dots, { opacity: 1, duration: t(.04) }, t(rhythm.traceAt + .02));
      timeline.to(travel, {
        p: 1, duration: t(.30), ease: "power2.inOut",
        onUpdate: () => {
          trace.paths.forEach((path, i) => {
            try {
              const point = path.getPointAtLength(lengths[i] * travel.p);
              trace.dots[i].setAttribute("cx", String(point.x)); trace.dots[i].setAttribute("cy", String(point.y));
            } catch { /* The interface remains usable if SVG path measurement is unavailable. */ }
          });
        },
      }, t(rhythm.traceAt + .02));
      timeline.to(trace.dots, { opacity: 0, duration: t(.08) }, t(rhythm.traceAt + .31));

      if (Math.abs(oldHeight - newHeight) > 1) timeline.to(shell, { height: newHeight, duration: t(.52), ease: "power2.inOut" }, 0);
      timeline.to(incoming, { opacity: 1, ...(canMask ? { maskImage: revealMask(plan.entry, 100) } : {}), duration: t(.38), ease: "power3.out" }, t(.27));
      // Let the new environment emerge behind the moving fragments instead of
      // leaving an empty frame between states. Its controls are already live.
      timeline.to(snapshot, { opacity: 0, duration: t(.39), ease: "none" }, t(.34));
      source.forEach((el, i) => {
        if (!targetRects.length) return;
        const r = sourceRects[i];
        const destination = targetRects[Math.round(i * (targetRects.length - 1) / Math.max(1, source.length - 1))];
        timeline!.to(el, {
          x: basePositions[i].x + destination.cx - r.cx, y: basePositions[i].y + destination.cy - r.cy,
          scaleX: destination.width / r.width, scaleY: destination.height / r.height,
          rotationX: 0, rotationY: 0, borderRadius: "2px",
          duration: t(.30), ease: "power3.inOut",
        }, t(.43 + i * rhythm.step * .65));
      });
      timeline.to(targets, { opacity: 1, duration: t(.20), stagger: t(rhythm.step * .55), ease: "power2.out" }, t(.48));
      timeline.to(source, { opacity: 0, duration: t(.12), stagger: t(.006), ease: "power1.out" }, t(.67));
      timeline.to(trace.svg, { opacity: 0, duration: t(.16), ease: "power2.out" }, t(.60));
    });
  } catch {
    cleanup();
    return null;
  }

  return {
    finish: () => { if (!finished) timeline?.progress(1); },
    cancel: cleanup,
  };
}
