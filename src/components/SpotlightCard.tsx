import React, { useRef, useCallback } from "react";
import { hasFinePointer } from "../lib/interact";

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  glow?: boolean;
  active?: boolean;
}

/**
 * Reusable SpotlightCard primitive.
 * Tracks pointer coordinates (--mx, --my) relative to the card
 * via throttled requestAnimationFrame, rendering crisp #9EE41A border
 * glow + inner translucent radial wash.
 * Coarse pointers/touch devices bypass tracking automatically.
 */
export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  ({ children, className = "", as: Component = "div", glow = true, active = false, style, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!glow || !hasFinePointer()) return;
        const el = internalRef.current;
        if (!el) return;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          el.style.setProperty("--mx", `${x}px`);
          el.style.setProperty("--my", `${y}px`);
        });
      },
      [glow]
    );

    const handlePointerLeave = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      el.style.setProperty("--mx", "-999px");
      el.style.setProperty("--my", "-999px");
    }, []);

    return (
      <Component
        ref={setRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        data-active={active ? "true" : undefined}
        className={`${glow ? "frosted-crystal arche-glow-card shiny-border" : ""} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

SpotlightCard.displayName = "SpotlightCard";
