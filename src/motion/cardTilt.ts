import { gsap, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";

/**
 * Weighted 3D card tilt & push physics on hover with true physical depth.
 * Desktop fine pointer only; disabled on touch and reduced motion.
 * - transform-style: preserve-3d on the card plate with subtle translateZ(10px) on inner headings/icons
 * - rotateX: -py * 6deg, rotateY: px * 6deg (with transformPerspective: 850)
 * - scale: 1.012, y: -4px
 * - gsap.quickTo with duration: 0.32, ease: "power3.out"
 * - Dynamic weighted shadow shifting opposite to the tilted corner + subtle #9EE41A border glint (1.5px)
 * - Smooth spring back to rest on pointerleave
 * - Stacked Services cards (.sticky-service-card) are strictly excluded to preserve stable scroll/click pinning.
 */
export function attachCardTilt(el: HTMLElement | null): () => void {
  if (!el || prefersReducedMotion() || !hasFinePointer()) {
    return () => {};
  }

  // Never tilt stacked service cards or smoked glass surfaces
  if (
    el.classList.contains("sticky-service-card") ||
    el.closest(".sticky-service-card") ||
    el.classList.contains("smoked-cypress-glass") ||
    el.closest(".smoked-cypress-glass")
  ) {
    return () => {};
  }

  el.classList.add("tilt-card", "weighted-card");
  gsap.set(el, { transformPerspective: 850, transformStyle: "preserve-3d" });

  const qRotX = gsap.quickTo(el, "rotateX", { duration: 0.32, ease: "power3.out" });
  const qRotY = gsap.quickTo(el, "rotateY", { duration: 0.32, ease: "power3.out" });
  const qY = gsap.quickTo(el, "y", { duration: 0.32, ease: "power3.out" });
  const qScale = gsap.quickTo(el, "scale", { duration: 0.32, ease: "power3.out" });

  const onPointerMove = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track --mx, --my for 1.5px subtle #9EE41A cursor-tracking border glint
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);

    // Normalized px, py from -0.5 to +0.5 from center
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;

    // Weighted corner press: pressing down on a corner tilts that corner inward
    qRotX(-py * 6);
    qRotY(px * 6);
    qScale(1.012);
    qY(-4);

    // Dynamic weighted shadow shifting opposite to the tilted corner
    const shadowX = Math.round(-px * 18);
    const shadowY = Math.round(-py * 18 + 16);
    el.style.boxShadow = `inset 0 1px 0 rgba(255, 253, 244, 0.92), ${shadowX}px ${shadowY}px 36px -12px rgba(20, 20, 19, 0.14)`;
  };

  const onPointerLeave = () => {
    qRotX(0);
    qRotY(0);
    qScale(1);
    qY(0);
    el.style.boxShadow = "";
    el.style.setProperty("--mx", "-999px");
    el.style.setProperty("--my", "-999px");
  };

  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerleave", onPointerLeave);

  return () => {
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerleave", onPointerLeave);
  };
}
