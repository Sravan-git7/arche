import React from "react";

export interface AcMonogramProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  onDark?: boolean;
  badge?: boolean;
}

/**
 * ARCHÉ — AC Monogram Brand Symbol
 * Renders the clean original AC mark crisply.
 * Supports obsidian rounded badge mode (w-8 h-8 rounded-[10px] bg-[#141413] border border-[#9EE41A]/25)
 * for 100% visibility across light and dark surfaces.
 */
export function AcMonogram({
  size = 24,
  className = "",
  style,
  onDark = false,
  badge = false,
}: AcMonogramProps) {
  if (badge) {
    const badgeSize = size >= 28 ? Math.round(size * 1.15) : 32;
    const innerSize = Math.round(badgeSize * 0.625);
    const innerWidth = Math.round(innerSize * (310 / 234));

    return (
      <div
        className={`ac-monogram-badge rounded-[10px] bg-[#141413] flex items-center justify-center shadow-sm border border-[#9EE41A]/25 flex-shrink-0 select-none ${className}`}
        style={{
          width: badgeSize,
          height: badgeSize,
          ...style,
        }}
        aria-label="Arche Monogram Badge"
      >
        <div
          className="relative select-none flex-shrink-0"
          style={{
            height: innerSize,
            width: innerWidth,
          }}
        >
          {/* Layer A: Warm cream-ivory A on dark */}
          <img
            src="/arche-logo-a.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            loading="eager"
          />
          {/* Layer C: Bright surgical lime C */}
          <img
            src="/arche-logo-c.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            style={{ filter: "contrast(1.2) brightness(0.95)" }}
            loading="eager"
          />
          {/* Layer Dot: Central surgical lime circular bead */}
          <img
            src="/arche-logo-dot.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  // Height = size (e.g. 24px = h-6), Width is proportional (310 / 234 * 24 = ~32px)
  const width = Math.round(size * (310 / 234));

  return (
    <div
      className={`ac-monogram relative select-none flex-shrink-0 inline-block align-middle ${className}`}
      style={{
        height: size,
        width,
        ...style,
      }}
      aria-label="Arche Monogram"
    >
      {/* Layer A: Monogram Letter A in deep charcoal #141413 on light, ivory on dark */}
      <img
        src="/arche-logo-a.png"
        alt=""
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        style={{
          filter: onDark ? "none" : "brightness(0.08)",
        }}
        loading="eager"
      />
      {/* Layer C: Monogram Letter C with bright surgical lime arc */}
      <img
        src="/arche-logo-c.png"
        alt=""
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        style={{
          filter: onDark ? "none" : "contrast(1.2) brightness(0.95)",
        }}
        loading="eager"
      />
      {/* Layer Dot: Central surgical lime circular bead */}
      <img
        src="/arche-logo-dot.png"
        alt=""
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        loading="eager"
      />
    </div>
  );
}
