import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

export type SlabRole = "engine" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "grain" | "signal";

/** Priority order when capping at maximum 6 simultaneous morph ghosts */
const ROLE_PRIORITY: SlabRole[] = ["engine", "s2", "s1", "s3", "s4", "s5", "s6", "grain"];
const MAX_GHOSTS = 6;

const GENERIC_MORPH_DUR = 0.8; // Generic morph duration: 0.8s
const RETARGET_DUR = 0.7; // Retarget duration: exactly 0.7s
const ROLE_STAGGER = 0.05; // Role stagger: 0.05s

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: string;
}

/** Get bounding box relative to stage container */
function getRelativeRect(el: Element, container: HTMLElement): Rect {
  const cRect = container.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  return {
    left: eRect.left - cRect.left,
    top: eRect.top - cRect.top,
    width: Math.max(eRect.width, 1),
    height: Math.max(eRect.height, 1),
    borderRadius: cs.borderRadius || "4px",
  };
}

/** Sanitize cloned elements to prevent accessibility, focus, and pointer events leaks */
function sanitizeGhostClone(clone: HTMLElement): void {
  clone.removeAttribute("id");
  clone.removeAttribute("role");
  clone.removeAttribute("aria-label");
  clone.removeAttribute("aria-labelledby");
  clone.removeAttribute("aria-describedby");
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("tabindex", "-1");
  clone.style.pointerEvents = "none";
  clone.style.userSelect = "none";

  const interactives = clone.querySelectorAll<HTMLElement>("button, input, textarea, select, a");
  interactives.forEach((el) => {
    el.setAttribute("tabindex", "-1");
    el.setAttribute("aria-hidden", "true");
    el.removeAttribute("id");
    el.style.pointerEvents = "none";
    if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement) {
      el.disabled = true;
    }
  });
}

/** Quadratic Bezier calculation with 18% perpendicular offset */
function getArcPoint(
  p: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number }
): { x: number; y: number } {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return { x: p0.x, y: p0.y };

  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;

  // Normal vector perpendicular to chord pointing upward
  let nx = -dy / dist;
  let ny = dx / dist;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const h = 0.18 * dist;
  const cx = mx + h * nx;
  const cy = my + h * ny;

  const inv = 1 - p;
  const x = inv * inv * p0.x + 2 * inv * p * cx + p * p * p1.x;
  const y = inv * inv * p0.y + 2 * inv * p * cy + p * p * p1.y;
  return { x, y };
}

interface ServiceTransitionProps {
  currentSlug: string;
  targetSlug: string;
  stageContainerRef: React.RefObject<HTMLDivElement | null>;
  renderStage: (slug: string, active: boolean) => ReactElement;
  onTransitionComplete: (slug: string) => void;
  isAutoplayReady: boolean;
}

export function ServiceTransitionLayer({
  currentSlug,
  targetSlug,
  stageContainerRef,
  renderStage,
  onTransitionComplete,
}: ServiceTransitionProps) {
  const [activeSlug, setActiveSlug] = useState(currentSlug);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [outgoingSlug, setOutgoingSlug] = useState<string | null>(null);
  const [incomingSlug, setIncomingSlug] = useState<string | null>(null);

  const morphLayerRef = useRef<HTMLDivElement>(null);
  const outgoingMountRef = useRef<HTMLDivElement>(null);
  const incomingMountRef = useRef<HTMLDivElement>(null);
  const signalDotRef = useRef<HTMLDivElement>(null);

  const currentTimeline = useRef<gsap.core.Timeline | null>(null);
  const isRetargeting = useRef<boolean>(false);
  const lastRequestTime = useRef<number>(0);
  const requestCount = useRef<number>(0);
  const targetSlugRef = useRef(targetSlug);
  targetSlugRef.current = targetSlug;
  const isTransitioningRef = useRef(isTransitioning);
  isTransitioningRef.current = isTransitioning;
  const onTransitionCompleteRef = useRef(onTransitionComplete);
  onTransitionCompleteRef.current = onTransitionComplete;

  // Window resize handler: clean settle on resize mid-flight
  useEffect(() => {
    const handleResize = () => {
      if (isTransitioningRef.current) {
        if (currentTimeline.current) {
          currentTimeline.current.kill();
          currentTimeline.current = null;
        }
        if (morphLayerRef.current) {
          morphLayerRef.current.innerHTML = "";
        }
        if (signalDotRef.current) {
          gsap.set(signalDotRef.current, { display: "none", opacity: 0 });
        }
        if (incomingMountRef.current) {
          incomingMountRef.current.style.visibility = "visible";
        }
        if (outgoingMountRef.current) {
          outgoingMountRef.current.style.visibility = "hidden";
        }
        const finalTarget = targetSlugRef.current;
        setActiveSlug(finalTarget);
        setIsTransitioning(false);
        setOutgoingSlug(null);
        setIncomingSlug(null);
        isRetargeting.current = false;
        onTransitionCompleteRef.current(finalTarget);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (currentTimeline.current) {
        currentTimeline.current.kill();
        currentTimeline.current = null;
      }
      if (morphLayerRef.current) {
        morphLayerRef.current.innerHTML = "";
      }
      if (signalDotRef.current) {
        gsap.set(signalDotRef.current, { display: "none", opacity: 0 });
      }
    };
  }, []);

  // Monitor targetSlug changes
  useEffect(() => {
    if (targetSlug === activeSlug && !isTransitioning) return;

    if (prefersReducedMotion()) {
      if (currentTimeline.current) {
        currentTimeline.current.kill();
        currentTimeline.current = null;
      }
      if (morphLayerRef.current) {
        morphLayerRef.current.innerHTML = "";
      }
      setActiveSlug(targetSlug);
      setIsTransitioning(false);
      setOutgoingSlug(null);
      setIncomingSlug(null);
      onTransitionComplete(targetSlug);
      return;
    }

    const now = performance.now();
    if (now - lastRequestTime.current < 400) {
      requestCount.current += 1;
    } else {
      requestCount.current = 1;
    }
    lastRequestTime.current = now;

    // Check if an in-flight morph is being interrupted
    if (isTransitioning && currentTimeline.current) {
      // True mid-flight retargeting!
      isRetargeting.current = true;
      setIncomingSlug(targetSlug);
      return;
    }

    // Normal transition start
    isRetargeting.current = false;
    setOutgoingSlug(activeSlug);
    setIncomingSlug(targetSlug);
    setIsTransitioning(true);
  }, [targetSlug, activeSlug, isTransitioning, onTransitionComplete]);

  // Execute or retarget morph when staging mounts are ready
  useLayoutEffect(() => {
    if (!isTransitioning || !outgoingSlug || !incomingSlug) return;

    const stageEl = stageContainerRef.current;
    const morphLayer = morphLayerRef.current;
    const outMount = outgoingMountRef.current;
    const inMount = incomingMountRef.current;
    const sigDot = signalDotRef.current;

    if (!stageEl || !morphLayer || !outMount || !inMount) {
      // Safety fallback
      setActiveSlug(incomingSlug);
      setIsTransitioning(false);
      onTransitionComplete(incomingSlug);
      return;
    }

    const isRetarget = isRetargeting.current;
    const durationSec = isRetarget ? RETARGET_DUR : GENERIC_MORPH_DUR;
    const targetEase =
      incomingSlug === "video-editing"
        ? "power3.inOut"
        : incomingSlug === "web-development"
          ? "power2.out"
          : incomingSlug === "ai-automation"
            ? "power3.inOut"
            : "power2.out";
    const ease = isRetarget ? "power3.out" : targetEase;

    // 1. Identify and prioritize roles for up to 6 simultaneous ghosts
    const availableRoles: SlabRole[] = [];
    ROLE_PRIORITY.forEach((role) => {
      const fromEl = outMount.querySelector(`[data-slab="${role}"]`);
      const toEl = inMount.querySelector(`[data-slab="${role}"]`);
      if (fromEl || toEl) {
        availableRoles.push(role);
      }
    });

    // Enforce max 6 simultaneous morph ghosts
    const rolesToMorph = availableRoles.slice(0, MAX_GHOSTS);

    // 2. Measure or retarget ghosts
    interface GhostData {
      role: SlabRole;
      ghostEl: HTMLDivElement;
      startLeft: number;
      startTop: number;
      startWidth: number;
      startHeight: number;
      targetRect: Rect;
    }

    const ghostEntries: GhostData[] = [];

    if (isRetarget) {
      // FREEZE active timeline immediately
      if (currentTimeline.current) {
        currentTimeline.current.kill();
        currentTimeline.current = null;
      }

      // Capture live visual state of each active ghost
      const activeGhosts = Array.from(morphLayer.querySelectorAll<HTMLDivElement>("[data-ghost-role]"));
      const ghostMap = new Map<string, HTMLDivElement>();
      activeGhosts.forEach((g) => {
        const r = g.getAttribute("data-ghost-role");
        if (r) ghostMap.set(r, g);
      });

      rolesToMorph.forEach((role) => {
        let ghostEl = ghostMap.get(role);
        const toEl = inMount.querySelector(`[data-slab="${role}"]`);

        let targetRect: Rect;
        if (toEl && toEl.isConnected && toEl.getBoundingClientRect().width > 0) {
          targetRect = getRelativeRect(toEl, stageEl);
        } else {
          // Intentional fallback: dock to container center
          const containerCard = inMount.querySelector('[data-slab="s2"]') || inMount;
          const cRect = getRelativeRect(containerCard, stageEl);
          targetRect = {
            left: cRect.left + cRect.width * 0.4,
            top: cRect.top + cRect.height * 0.4,
            width: 48,
            height: 24,
            borderRadius: "4px",
          };
        }

        if (ghostEl) {
          // Live transform capture
          const curX = Number(gsap.getProperty(ghostEl, "x")) || 0;
          const curY = Number(gsap.getProperty(ghostEl, "y")) || 0;
          const curScaleX = Number(gsap.getProperty(ghostEl, "scaleX")) || 1;
          const curScaleY = Number(gsap.getProperty(ghostEl, "scaleY")) || 1;
          const curBorderRadius = window.getComputedStyle(ghostEl).borderRadius || "4px";

          const baseLeft = parseFloat(ghostEl.style.left) || 0;
          const baseTop = parseFloat(ghostEl.style.top) || 0;
          const baseWidth = parseFloat(ghostEl.style.width) || 1;
          const baseHeight = parseFloat(ghostEl.style.height) || 1;

          const renderedLeft = baseLeft + curX;
          const renderedTop = baseTop + curY;
          const renderedWidth = Math.max(1, baseWidth * curScaleX);
          const renderedHeight = Math.max(1, baseHeight * curScaleY);

          // Reset element base style to current rendered visual position
          ghostEl.style.left = `${renderedLeft}px`;
          ghostEl.style.top = `${renderedTop}px`;
          ghostEl.style.width = `${renderedWidth}px`;
          ghostEl.style.height = `${renderedHeight}px`;
          ghostEl.style.borderRadius = curBorderRadius;
          gsap.set(ghostEl, { x: 0, y: 0, scaleX: 1, scaleY: 1 });

          // Update content clones: promote in-content to out-content, add new target content
          const outClone = ghostEl.querySelector<HTMLElement>(".ghost-out-content");
          const inClone = ghostEl.querySelector<HTMLElement>(".ghost-in-content");
          if (inClone && outClone) {
            const inOp = Number(gsap.getProperty(inClone, "opacity")) || 0;
            if (inOp > 0.3) {
              outClone.innerHTML = inClone.innerHTML;
            }
          }
          if (outClone) {
            gsap.set(outClone, { opacity: 1 });
          }

          if (inClone && toEl) {
            inClone.innerHTML = "";
            const freshClone = toEl.cloneNode(true) as HTMLElement;
            sanitizeGhostClone(freshClone);
            freshClone.style.width = "100%";
            freshClone.style.height = "100%";
            freshClone.style.pointerEvents = "none";
            inClone.appendChild(freshClone);
            gsap.set(inClone, { opacity: 0 });
          }

          ghostEntries.push({
            role,
            ghostEl,
            startLeft: renderedLeft,
            startTop: renderedTop,
            startWidth: renderedWidth,
            startHeight: renderedHeight,
            targetRect,
          });
        }
      });
    } else {
      // Fresh transition: clear morph layer and build new ghosts
      morphLayer.innerHTML = "";

      rolesToMorph.forEach((role) => {
        const fromEl = outMount.querySelector(`[data-slab="${role}"]`);
        const toEl = inMount.querySelector(`[data-slab="${role}"]`);

        let fromRect: Rect;
        let toRect: Rect;

        if (fromEl && toEl) {
          fromRect = getRelativeRect(fromEl, stageEl);
          toRect = getRelativeRect(toEl, stageEl);
        } else if (fromEl && !toEl) {
          fromRect = getRelativeRect(fromEl, stageEl);
          // Intentional fallback: dock to container center
          const containerCard = inMount.querySelector('[data-slab="s2"]') || inMount;
          const cRect = getRelativeRect(containerCard, stageEl);
          toRect = {
            left: cRect.left + cRect.width * 0.4,
            top: cRect.top + cRect.height * 0.4,
            width: 48,
            height: 24,
            borderRadius: "4px",
          };
        } else {
          toRect = getRelativeRect(toEl!, stageEl);
          const containerCard = outMount.querySelector('[data-slab="s2"]') || outMount;
          const cRect = getRelativeRect(containerCard, stageEl);
          fromRect = {
            left: cRect.left + cRect.width * 0.4,
            top: cRect.top + cRect.height * 0.4,
            width: 48,
            height: 24,
            borderRadius: "4px",
          };
        }

        // Create ghost element
        const ghost = document.createElement("div");
        ghost.setAttribute("data-ghost-role", role);
        ghost.className = "absolute pointer-events-none overflow-hidden";
        ghost.style.left = `${fromRect.left}px`;
        ghost.style.top = `${fromRect.top}px`;
        ghost.style.width = `${fromRect.width}px`;
        ghost.style.height = `${fromRect.height}px`;
        ghost.style.borderRadius = fromRect.borderRadius;
        ghost.style.transformOrigin = "0 0";
        ghost.style.contain = "layout paint style";
        ghost.style.willChange = "transform, opacity, border-radius, filter";

        if (role === "engine") {
          ghost.style.background = "#0c0c0d";
          ghost.style.border = "1px solid var(--line)";
          ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
        } else if (role === "grain") {
          ghost.style.opacity = "0.7";
        } else {
          ghost.style.background = "var(--card)";
          ghost.style.border = "1px solid var(--line)";
        }

        // Outgoing content clone
        const outWrap = document.createElement("div");
        outWrap.className = "ghost-out-content absolute inset-0 overflow-hidden";
        if (fromEl) {
          const outClone = fromEl.cloneNode(true) as HTMLElement;
          sanitizeGhostClone(outClone);
          outClone.style.width = "100%";
          outClone.style.height = "100%";
          outWrap.appendChild(outClone);
        }
        ghost.appendChild(outWrap);

        // Incoming content clone
        const inWrap = document.createElement("div");
        inWrap.className = "ghost-in-content absolute inset-0 overflow-hidden";
        inWrap.style.opacity = "0";
        if (toEl) {
          const inClone = toEl.cloneNode(true) as HTMLElement;
          sanitizeGhostClone(inClone);
          inClone.style.width = "100%";
          inClone.style.height = "100%";
          inWrap.appendChild(inClone);
        }
        ghost.appendChild(inWrap);

        morphLayer.appendChild(ghost);
        ghostEntries.push({
          role,
          ghostEl: ghost,
          startLeft: fromRect.left,
          startTop: fromRect.top,
          startWidth: fromRect.width,
          startHeight: fromRect.height,
          targetRect: toRect,
        });
      });

      // Outgoing mount is hidden immediately so ghosts cover it
      outMount.style.visibility = "hidden";
    }

    // 3. Build GSAP timeline
    const tl = gsap.timeline({
      onComplete: () => {
        inMount.style.visibility = "visible";
        morphLayer.innerHTML = "";
        if (sigDot) {
          gsap.set(sigDot, { display: "none", opacity: 0 });
        }
        setActiveSlug(incomingSlug);
        setIsTransitioning(false);
        setOutgoingSlug(null);
        setIncomingSlug(null);
        isRetargeting.current = false;
        currentTimeline.current = null;
        onTransitionComplete(incomingSlug);
      },
    });

    currentTimeline.current = tl;

    // Animate each ghost
    ghostEntries.forEach(({ ghostEl, startLeft, startTop, startWidth, startHeight, targetRect }, idx) => {
      const dx = targetRect.left - startLeft;
      const dy = targetRect.top - startTop;
      const sx = startWidth > 0 ? targetRect.width / startWidth : 1;
      const sy = startHeight > 0 ? targetRect.height / startHeight : 1;

      // Role stagger: 0.05s
      const roleDelay = idx * ROLE_STAGGER;

      // 1. Move, scale, and border-radius
      tl.to(
        ghostEl,
        {
          x: dx,
          y: dy,
          scaleX: sx,
          scaleY: sy,
          borderRadius: targetRect.borderRadius,
          duration: durationSec,
          ease,
        },
        roleDelay
      );

      // 2. Mid-flight content swap (between 35% and 65%) with blur dip <= 250ms
      const swapWindowDur = Math.min(durationSec * 0.3, 0.25);
      const halfSwap = swapWindowDur / 2;
      const swapStart = roleDelay + durationSec * 0.35;
      const swapMid = swapStart + halfSwap;
      const swapEnd = swapStart + swapWindowDur;

      const outClone = ghostEl.querySelector<HTMLElement>(".ghost-out-content");
      const inClone = ghostEl.querySelector<HTMLElement>(".ghost-in-content");

      // Blur in (max 6px) and subtle opacity dip
      tl.to(ghostEl, { filter: "blur(6px)", opacity: 0.82, duration: halfSwap }, swapStart);

      // Crossfade content
      if (outClone && inClone) {
        tl.to(outClone, { opacity: 0, duration: halfSwap }, swapStart);
        tl.to(inClone, { opacity: 1, duration: halfSwap }, swapMid);
      }

      // Blur out back to crisp
      tl.to(ghostEl, { filter: "blur(0px)", opacity: 1, duration: halfSwap }, swapEnd - halfSwap);
    });

    // 4. Animate Traveling Signal Dot along quadratic arc (18% perpendicular offset)
    const fromRailDot = stageEl.parentElement?.querySelector(`[data-rail-dot="${outgoingSlug}"]`);
    const toRailDot = stageEl.parentElement?.querySelector(`[data-rail-dot="${incomingSlug}"]`);

    if (fromRailDot && toRailDot && sigDot) {
      const cRect = stageEl.getBoundingClientRect();
      const tR = toRailDot.getBoundingClientRect();
      const endPt = {
        x: tR.left - cRect.left + tR.width / 2,
        y: tR.top - cRect.top + tR.height / 2,
      };

      let startPt: { x: number; y: number };
      if (isRetarget) {
        startPt = {
          x: Number(gsap.getProperty(sigDot, "x")) || endPt.x,
          y: Number(gsap.getProperty(sigDot, "y")) || endPt.y,
        };
      } else {
        const fR = fromRailDot.getBoundingClientRect();
        startPt = {
          x: fR.left - cRect.left + fR.width / 2,
          y: fR.top - cRect.top + fR.height / 2,
        };
        gsap.set(sigDot, { display: "block", x: startPt.x, y: startPt.y, opacity: 1 });
      }

      const arcObj = { p: 0 };
      tl.to(
        arcObj,
        {
          p: 1,
          duration: durationSec * 0.95,
          ease: "power2.inOut",
          onUpdate: () => {
            const pt = getArcPoint(arcObj.p, startPt, endPt);
            gsap.set(sigDot, { x: pt.x, y: pt.y });
          },
          onComplete: () => {
            // Pulse destination rail dot ring
            const pulseRing = toRailDot.querySelector<HTMLElement>(".rail-pulse-ring");
            if (pulseRing) {
              gsap.fromTo(pulseRing, { scale: 1, opacity: 0.6 }, { scale: 1.8, opacity: 0, duration: 0.7, ease: "power2.out" });
            }
            gsap.to(sigDot, { opacity: 0, duration: 0.15, onComplete: () => gsap.set(sigDot, { display: "none" }) });
          },
        },
        0.02
      );
    }

    return () => {
      if (tl) {
        tl.kill();
      }
      if (morphLayerRef.current) {
        morphLayerRef.current.innerHTML = "";
      }
    };
  }, [isTransitioning, outgoingSlug, incomingSlug, onTransitionComplete, stageContainerRef]);

  return (
    <div className="relative w-full h-full">
      {/* Morph Ghost Layer */}
      <div
        ref={morphLayerRef}
        className="pointer-events-none absolute inset-0 z-[20] overflow-hidden"
        style={{ contain: "layout paint style" }}
        aria-hidden="true"
      />

      {/* Traveling Signal Dot */}
      <div
        ref={signalDotRef}
        className="pointer-events-none absolute z-[25] h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full hidden"
        style={{
          background: "var(--accent)",
          boxShadow: "0 0 12px var(--accent)",
        }}
        aria-hidden="true"
      />

      {/* Staging Containers: mount both outgoing and incoming during transition */}
      {isTransitioning && outgoingSlug && incomingSlug ? (
        <>
          <div ref={outgoingMountRef} className="relative w-full h-full">
            {renderStage(outgoingSlug, false)}
          </div>
          <div
            ref={incomingMountRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ visibility: "hidden" }}
          >
            {renderStage(incomingSlug, false)}
          </div>
        </>
      ) : (
        /* Settle state: single active stage with autoplay enabled */
        <div className="relative w-full h-full">
          {renderStage(activeSlug, true)}
        </div>
      )}
    </div>
  );
}
