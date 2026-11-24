import React from "react";
import { Link } from "../lib/router";

interface SlotButtonProps {
  to?: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary" | "lime" | "ghost" | "frosted-ivory";
  className?: string;
  children: string;
  arrow?: "right" | "down" | "up" | "none";
  magnetic?: boolean;
  dataCursor?: string;
  type?: "button" | "submit";
  ariaLabel?: string;
}

/**
 * Luxury Kinetic Slot-Roll Button (Emil Kowalski micro-interaction physics).
 * - Primary: Vertical slot-roll label + sliding arrow (translateX(3px)) + internal diagonal specular light sweep + active:scale-[0.96]
 * - Secondary: Crisp #9EE41A border ring illumination + gentle y: -2px lift + arrow micro-nudge
 */
export function SlotButton({
  to,
  onClick,
  variant = "primary",
  className = "",
  children,
  arrow = "right",
  magnetic = true,
  dataCursor = "hover",
  type = "button",
  ariaLabel,
}: SlotButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-[#141413] text-[#FBFBF6] border border-[#141413] hover:border-[#9EE41A]/60 hover:shadow-[0_0_24px_rgba(158,228,26,0.24)] active:scale-[0.96]";
      case "secondary":
      case "frosted-ivory":
        return "bg-[rgba(244,241,224,0.82)] text-[#141413] border border-[#141413]/12 backdrop-blur-md hover:-translate-y-[2px] hover:bg-[rgba(235,232,213,0.95)] hover:border-[#9EE41A] hover:shadow-[0_0_18px_rgba(158,228,26,0.28)] active:scale-[0.97]";
      case "lime":
        return "bg-[#9EE41A] text-[#141413] font-bold border border-[#9EE41A] hover:brightness-105 hover:shadow-[0_0_28px_rgba(158,228,26,0.45)] active:scale-[0.97]";
      case "ghost":
        return "bg-white/5 text-[#FBFBF6] border border-white/15 hover:bg-white/10 hover:border-white/30 active:scale-[0.97]";
      default:
        return "bg-[#141413] text-[#FBFBF6]";
    }
  };

  const baseStyles =
    "group relative inline-flex items-center justify-center rounded-full font-mono text-xs uppercase tracking-wider select-none cursor-pointer overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

  const content = (
    <>
      {/* Primary obsidian button: sleek internal diagonal specular light sweep */}
      {variant === "primary" && (
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-0"
          style={{
            background:
              "linear-gradient(110deg, transparent 30%, rgba(158, 228, 26, 0.22) 50%, transparent 70%)",
          }}
          aria-hidden="true"
        />
      )}

      {/* Slot-roll vertical text stack */}
      <span className="relative z-10 inline-flex flex-col h-[1.3em] overflow-hidden leading-tight font-medium">
        <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
          {children}
        </span>
        <span
          className="absolute top-0 left-0 inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-full group-hover:translate-y-0 text-inherit select-none"
          aria-hidden="true"
        >
          {children}
        </span>
      </span>

      {/* Kinetic Arrow */}
      {arrow !== "none" && (
        <span
          className={`relative z-10 inline-block ml-2 text-[13px] leading-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            arrow === "right"
              ? "group-hover:translate-x-[3px]"
              : arrow === "down"
              ? "group-hover:translate-y-[3px]"
              : "group-hover:-translate-y-[3px]"
          }`}
          aria-hidden="true"
        >
          {arrow === "right" ? "→" : arrow === "down" ? "↓" : "↑"}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        aria-label={ariaLabel || children}
        data-magnetic={magnetic ? "true" : undefined}
        data-cursor={dataCursor}
        className={`${baseStyles} ${getVariantStyles()} ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel || children}
      data-magnetic={magnetic ? "true" : undefined}
      data-cursor={dataCursor}
      className={`${baseStyles} ${getVariantStyles()} ${className}`}
    >
      {content}
    </button>
  );
}
