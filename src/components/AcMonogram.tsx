import React from "react";

export interface AcMonogramProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** When true, renders directly on dark surfaces using screen mix-blend */
  onDark?: boolean;
}

/**
 * ARCHÉ — AC Monogram Brand Symbol
 *
 * Source artwork referenced directly as public asset `/arche logo.jpeg`:
 * - Native artwork aspect ratio: 1400w / 1181h = 1.1854:1
 * - Preserves 100% of original geometry, stroke weights, neon lime arc, ivory ribbons, and textures.
 * - Static wherever it appears outside the preloader.
 */
export function AcMonogram({
  size = 20,
  className = "",
  style,
  onDark = false,
}: AcMonogramProps) {
  const width = Math.round(size * 1.1854);
  const height = size;

  // On dark surfaces (like footer or preloader), screen mix-blend mode enables the dark charcoal
  // ground of the image to seamlessly blend with the dark page canvas.
  // On light surfaces (like the header), a subtle dark pill container preserves the glowing neon
  // colors and ivory ribbons without altering any pixels of the source artwork.
  return (
    <span
      className={`ac-monogram-wrap inline-flex items-center justify-center select-none ${
        onDark ? "" : "bg-[#0c0c0d] rounded-[5px] px-[3px] py-[2px] shadow-sm"
      } ${className}`}
      style={{
        verticalAlign: "middle",
        ...style,
      }}
      aria-hidden="true"
    >
      <span
        className="relative inline-block overflow-hidden"
        style={{
          width,
          height,
        }}
      >
        <img
          src="/arche%20logo.jpeg"
          alt="Arche AC Monogram"
          className="absolute pointer-events-none max-w-none select-none"
          style={{
            width: `${(2048 / 1400) * 100}%`,
            height: "auto",
            left: `${(-368 / 1400) * 100}%`,
            top: `${(-429 / 1400) * 100}%`,
            mixBlendMode: "screen",
          }}
        />
      </span>
    </span>
  );
}
