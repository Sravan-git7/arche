import fs from 'fs';

const p = JSON.parse(fs.readFileSync('scripts/accurate_divided_paths.json', 'utf-8'));

const tsxContent = `import React from "react";

export interface AcMonogramProps {
  size?: number;
  className?: string;
  limeColor?: string;
  ivoryColor?: string;
  style?: React.CSSProperties;
}

/**
 * ARCHÉ — AC Monogram Brand Symbol
 *
 * Geometric vector reproduction faithful to D:\\arche\\public\\arche logo.jpeg:
 * - Layer A (.ac-layer-a): Interwoven letter A on the left (x: 0..54), with outer contour and inner counter.
 * - Layer C (.ac-layer-c): Interwoven letter C on the right (x: 54..100) with upper lime arc and lower ivory arc.
 * - Layer Dot (.ac-layer-dot): Central lime circular bead at (75.0, 44.2).
 *
 * Surface contrast treatments:
 * - Dark surfaces (.on-ink / footer / preloader): Ivory (#f4f2ed) and electric lime (#c8f14f).
 * - Light surfaces (sticky header): Dark ink (#0c0c0d) and deep accent-ink (#476300).
 */
export function AcMonogram({
  size = 20,
  className = "",
  limeColor,
  ivoryColor,
  style,
}: AcMonogramProps) {
  // Native aspect ratio: 100 wide x 76 high (1.315:1)
  const width = Math.round(size * 1.315);
  const height = size;

  // Resolved colors with theme fallbacks
  const lime = limeColor || "var(--accent-ink, #c8f14f)";
  const ivory = ivoryColor || "currentColor";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={\`ac-monogram \${className}\`}
      style={{ overflow: "visible", display: "inline-block", verticalAlign: "middle", ...style }}
      aria-hidden="true"
    >
      {/* Layer 1: Monogram Letter A (Left Half, x: 0..54) */}
      <g className="ac-layer-a" fill={ivory} fillRule="evenodd">
        <path
          className="ac-path-a"
          d="${p.pathA}"
        />
      </g>

      {/* Layer 2: Monogram Letter C (Right Half, x: 54..100) */}
      <g className="ac-layer-c" fillRule="evenodd">
        {/* Upper Lime Arc of C */}
        <path
          className="ac-path-c-lime"
          fill={lime}
          d="${p.pathCLime}"
        />
        {/* Lower Ivory Arc of C */}
        <path
          className="ac-path-c-ivory"
          fill={ivory}
          d="${p.pathCIvory}"
        />
      </g>

      {/* Layer 3: Central Lime Dot */}
      <g className="ac-layer-dot">
        <circle
          className="ac-path-dot"
          cx="${p.dot.cx}"
          cy="${p.dot.cy}"
          r="${p.dot.r}"
          fill={lime}
        />
      </g>
    </svg>
  );
}
`;

fs.writeFileSync('src/components/AcMonogram.tsx', tsxContent, 'utf-8');
console.log('Successfully updated src/components/AcMonogram.tsx!');
