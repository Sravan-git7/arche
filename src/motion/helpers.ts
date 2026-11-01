import { gsap, SplitText } from "./gsap";
import { DUR, EASE, STAGGER } from "./tokens";

/* ========================================================================
   1. revealLines(el, opts)
   Split text into lines using SplitText.
   Place each line inside an overflow-hidden mask.
   Animate yPercent: 110 to 0 over 1.0s with ease: "expo.out" and 0.08s stagger.
   Support automatic re-splitting on resize without visible flash.
   Revert SplitText instances during cleanup.
   ======================================================================== */

export interface RevealLinesOptions {
  duration?: number;
  ease?: string;
  stagger?: number;
  delay?: number;
  scrollTrigger?: gsap.DOMTarget | ScrollTrigger.Vars;
  onComplete?: () => void;
}

export function revealLines(
  target: HTMLElement | string,
  opts?: RevealLinesOptions
) {
  if (typeof window === "undefined") {
    return {
      timeline: gsap.timeline(),
      splits: [],
      revert: () => {},
    };
  }

  const elements = typeof target === "string"
    ? Array.from(document.querySelectorAll<HTMLElement>(target))
    : [target];

  if (!elements.length) {
    return {
      timeline: gsap.timeline(),
      splits: [],
      revert: () => {},
    };
  }

  const splits: SplitText[] = [];
  const tl = gsap.timeline({
    delay: opts?.delay ?? 0,
    scrollTrigger: opts?.scrollTrigger,
    onComplete: opts?.onComplete,
  });

  elements.forEach((el) => {
    let split: SplitText;
    try {
      split = new SplitText(el, {
        type: "lines",
        mask: "lines",
        linesClass: "reveal-line",
        autoSplit: true,
      });
    } catch {
      split = new SplitText(el, {
        type: "lines",
        linesClass: "reveal-line",
      });
    }

    // Ensure lines are placed inside an overflow-hidden mask
    if (!split.masks || !split.masks.length) {
      split.lines.forEach((line) => {
        const parent = line.parentElement;
        if (!parent || !parent.classList.contains("reveal-line-mask")) {
          const mask = document.createElement("div");
          mask.className = "reveal-line-mask";
          mask.style.overflow = "hidden";
          mask.style.display = "block";
          line.parentNode?.insertBefore(mask, line);
          mask.appendChild(line);
        }
      });
    }

    splits.push(split);

    tl.fromTo(
      split.lines,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: opts?.duration ?? DUR.reveal, // 1.0s
        ease: opts?.ease ?? EASE.reveal,       // "expo.out"
        stagger: opts?.stagger ?? STAGGER.line, // 0.08s
      },
      0
    );
  });

  // Re-split on window resize without visible flash
  let resizeTimer: number;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      splits.forEach((split) => {
        const isComplete = tl.progress() === 1;
        split.split({
          type: "lines",
          mask: "lines",
          linesClass: "reveal-line",
        });
        if (isComplete) {
          gsap.set(split.lines, { yPercent: 0 });
        }
      });
    }, 150);
  };

  window.addEventListener("resize", onResize, { passive: true });

  const revert = () => {
    window.removeEventListener("resize", onResize);
    window.clearTimeout(resizeTimer);
    tl.kill();
    splits.forEach((s) => s.revert());
  };

  return {
    timeline: tl,
    splits,
    revert,
  };
}

/* ========================================================================
   2. drawPath(el, opts)
   Animate SVG paths from 0% to 100% using DrawSVG.
   ======================================================================== */

export interface DrawPathOptions {
  duration?: number;
  ease?: string;
  delay?: number;
  stagger?: number;
  scrollTrigger?: gsap.DOMTarget | ScrollTrigger.Vars;
  onComplete?: () => void;
  [key: string]: any;
}

export function drawPath(
  el: gsap.DOMTarget,
  opts?: DrawPathOptions
) {
  return gsap.fromTo(
    el,
    { drawSVG: "0%" },
    {
      drawSVG: "100%",
      duration: opts?.duration ?? DUR.base, // 0.6s
      ease: opts?.ease ?? EASE.soft,       // "power3.out"
      delay: opts?.delay ?? 0,
      stagger: opts?.stagger ?? 0,
      scrollTrigger: opts?.scrollTrigger,
      onComplete: opts?.onComplete,
      ...opts,
    }
  );
}

/* ========================================================================
   3. digitRoll(el, from, to, opts?)
   Roll a number through a masked column of digits.
   ======================================================================== */

export interface DigitRollOptions {
  duration?: number;
  ease?: string;
  delay?: number;
  stagger?: number;
  onComplete?: () => void;
}

export function digitRoll(
  el: HTMLElement | null,
  from: number | string,
  to: number | string,
  opts?: DigitRollOptions
) {
  if (!el || typeof window === "undefined") {
    return {
      timeline: gsap.timeline(),
      revert: () => {},
    };
  }

  const sFrom = String(from);
  const sTo = String(to);
  const originalHtml = el.innerHTML;
  const originalAriaLabel = el.getAttribute("aria-label");

  el.setAttribute("aria-label", sTo);

  // Clear container and set layout for rolling columns
  el.innerHTML = "";
  el.style.display = "inline-flex";
  el.style.alignItems = "center";

  const tl = gsap.timeline({
    delay: opts?.delay ?? 0,
    onComplete: opts?.onComplete,
  });

  const columns: HTMLElement[] = [];
  const maxLen = Math.max(sFrom.length, sTo.length);
  const padFrom = sFrom.padStart(maxLen, "0");
  const padTo = sTo.padStart(maxLen, "0");

  for (let idx = 0; idx < maxLen; idx++) {
    const cFrom = padFrom[idx];
    const cTo = padTo[idx];

    // If both are digits, create a digit roll column
    if (/\d/.test(cFrom) && /\d/.test(cTo)) {
      const nFrom = parseInt(cFrom, 10);
      const nTo = parseInt(cTo, 10);

      // Generate sequence of digits
      const digits: number[] = [];
      if (nFrom <= nTo) {
        for (let d = nFrom; d <= nTo; d++) digits.push(d);
      } else {
        // Roll through 9 then 0 to target
        for (let d = nFrom; d <= 9; d++) digits.push(d);
        for (let d = 0; d <= nTo; d++) digits.push(d);
      }

      // Outer mask
      const mask = document.createElement("span");
      mask.className = "digit-mask";
      mask.setAttribute("aria-hidden", "true");
      mask.style.display = "inline-block";
      mask.style.overflow = "hidden";
      mask.style.verticalAlign = "top";
      mask.style.height = "1em";
      mask.style.lineHeight = "1em";

      // Inner column
      const col = document.createElement("span");
      col.className = "digit-col";
      col.style.display = "inline-flex";
      col.style.flexDirection = "column";
      col.style.lineHeight = "1em";

      digits.forEach((digit) => {
        const item = document.createElement("span");
        item.style.display = "block";
        item.style.height = "1em";
        item.style.lineHeight = "1em";
        item.style.textAlign = "center";
        item.textContent = String(digit);
        col.appendChild(item);
      });

      mask.appendChild(col);
      el.appendChild(mask);
      columns.push(col);

      const targetOffset = -((digits.length - 1) / digits.length) * 100;

      tl.fromTo(
        col,
        { yPercent: 0 },
        {
          yPercent: targetOffset,
          duration: opts?.duration ?? DUR.base, // 0.6s
          ease: opts?.ease ?? EASE.soft,       // "power3.out"
        },
        idx * (opts?.stagger ?? STAGGER.word)   // 0.04s stagger
      );
    } else {
      // Non-digit character (e.g. '.', '/', ':')
      const span = document.createElement("span");
      span.textContent = cTo;
      span.style.display = "inline-block";
      span.style.lineHeight = "1em";
      el.appendChild(span);
    }
  }

  const revert = () => {
    tl.kill();
    el.innerHTML = originalHtml;
    if (originalAriaLabel !== null) {
      el.setAttribute("aria-label", originalAriaLabel);
    } else {
      el.removeAttribute("aria-label");
    }
  };

  return {
    timeline: tl,
    revert,
  };
}

/* ========================================================================
   4. magnetic(el, { strength })
   - Activate when the pointer moves within 90px.
   - Translate the element by 0.28 of the pointer offset.
   - Translate its inner text by 0.12 of the pointer offset.
   - On pointer leave, return to original position using elastic.out(1, 0.5) over 0.6s.
   - No-op on touch devices.
   ======================================================================== */

export interface MagneticOptions {
  strength?: number;
}

export function magnetic(
  el: HTMLElement | null,
  options?: MagneticOptions
): () => void {
  if (!el || typeof window === "undefined") return () => {};

  // No-op on touch devices
  const isFinePointer =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  if (!isFinePointer) return () => {};

  const strength = options?.strength ?? 1;
  const THRESHOLD = 90; // Activate when pointer is within 90px

  const inner =
    el.querySelector<HTMLElement>("span, p, .btn-text") ||
    (el.firstElementChild as HTMLElement) ||
    null;

  let isWithin = false;

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Distance from the pointer to the element's bounding box edge
    const edgeX = Math.max(rect.left - e.clientX, e.clientX - rect.right, 0);
    const edgeY = Math.max(rect.top - e.clientY, e.clientY - rect.bottom, 0);
    const distToEdge = Math.hypot(edgeX, edgeY);

    if (distToEdge <= THRESHOLD) {
      isWithin = true;
      const targetX = dx * 0.28 * strength;
      const targetY = dy * 0.28 * strength;

      gsap.to(el, {
        x: targetX,
        y: targetY,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });

      if (inner) {
        gsap.to(inner, {
          x: dx * 0.12 * strength,
          y: dy * 0.12 * strength,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    } else if (isWithin) {
      // Exited 90px threshold
      reset();
    }
  };

  const reset = () => {
    isWithin = false;
    gsap.to(el, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)",
      overwrite: "auto",
    });

    if (inner) {
      gsap.to(inner, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
        overwrite: "auto",
      });
    }
  };

  const onPointerLeave = () => {
    if (isWithin) reset();
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  el.addEventListener("pointerleave", onPointerLeave, { passive: true });

  return () => {
    window.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerleave", onPointerLeave);
    gsap.killTweensOf(el);
    if (inner) gsap.killTweensOf(inner);
    gsap.set(el, { x: 0, y: 0 });
    if (inner) gsap.set(inner, { x: 0, y: 0 });
  };
}
