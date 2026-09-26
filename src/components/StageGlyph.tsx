import type { ReactNode } from "react";

/**
 * PROMPT 35 — the System Model's stage identities.
 *
 * One distinct line-and-node glyph per stage, built from the site's own
 * geometry language (2px round strokes, signal nodes, dash-flow motion) —
 * not clipart, not a generic card reused five times:
 *
 *   input        3 signals converging into a socket bracket, chevron riding in
 *   intelligence hub & spoke — a core node with five satellites and a web
 *   system       the kernel: dashed octagon, 8 spokes, twin diamonds, cross —
 *                deliberately the densest shape on the rail
 *   action       a dispatch bracket fanning out three signals with arrowheads
 *   output       a sealed check inside a ring, three verification nodes, a
 *                slowly rotating scan arc while in focus
 *
 * Strokes and nodes use `currentColor` so the rail drives the ink per focus
 * state (accent when focused, faint when distant). `animate` gates the
 * motion marks — they only run while the stage is in the camera's focus.
 */
const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function StageGlyph({ id, animate = false, className }: { id: string; animate?: boolean; className?: string }) {
  const flow = animate ? "glyph-flow" : undefined;

  let body: ReactNode;
  switch (id) {
    case "input":
      body = (
        <>
          {/* three inbound signals converging to one */}
          <path {...S} d="M4 14 H52 L78 27" className={flow} />
          <path {...S} d="M4 32 H78" className={flow} />
          <path {...S} d="M4 50 H52 L78 37" className={flow} />
          {/* direction chevron riding the centre line */}
          <path {...S} d="M25 26 l8 6 -8 6" />
          {/* the intake node */}
          <circle cx="84" cy="32" r="4" fill="currentColor" stroke="none" />
          {/* socket bracket, open to the inbound side */}
          <path {...S} d="M104 16 H92 V48 H104" />
        </>
      );
      break;
    case "intelligence": {
      const satellites: [number, number][] = [
        [24, 12],
        [98, 9],
        [114, 42],
        [74, 57],
        [10, 44],
      ];
      body = (
        <>
          {/* spokes: core → every satellite */}
          <path {...S} strokeWidth={1.6} d={satellites.map(([x, y]) => `M62 32 L${x} ${y}`).join(" ")} />
          {/* the web: satellites resolving against each other */}
          <path {...S} strokeWidth={1.3} d="M24 12 L10 44 M98 9 L114 42 M114 42 L74 57" />
          <circle cx="62" cy="32" r="5" fill="currentColor" stroke="none" />
          {satellites.map(([x, y]) => (
            <circle key={`${x}-${y}`} {...S} strokeWidth={1.6} cx={x} cy={y} r="3" />
          ))}
        </>
      );
      break;
    }
    case "system": {
      const ring: [number, number][] = [
        [62, 4],
        [97, 8],
        [118, 32],
        [97, 56],
        [62, 60],
        [27, 56],
        [6, 32],
        [27, 8],
      ];
      body = (
        <>
          {/* the kernel's boundary — dashed perimeter, the sparsest line */}
          <path {...S} strokeWidth={1.3} strokeDasharray="4 7" d="M62 4 L97 8 L118 32 L97 56 L62 60 L27 56 L6 32 L27 8 Z" />
          {/* eight spokes from the core to every node */}
          <path {...S} strokeWidth={1.5} d={ring.map(([x, y]) => `M62 32 L${x} ${y}`).join(" ")} />
          {/* twin interlocking diamonds + cross: the state core */}
          <path {...S} d="M62 16 L78 32 L62 48 L46 32 Z" />
          <path {...S} strokeWidth={1.5} d="M62 24 L70 32 L62 40 L54 32 Z" />
          <path {...S} strokeWidth={1.3} d="M62 16 V48 M46 32 H78" />
          {ring.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.3" fill="currentColor" stroke="none" />
          ))}
          <circle cx="62" cy="32" r="3.6" fill="currentColor" stroke="none" />
        </>
      );
      break;
    }
    case "action":
      body = (
        <>
          {/* dispatch bracket, open to the outbound side */}
          <path {...S} d="M32 16 H20 V48 H32" />
          {/* the dispatch node */}
          <circle cx="40" cy="32" r="4" fill="currentColor" stroke="none" />
          {/* three signals fanning out */}
          <path {...S} d="M44 32 H72 L114 13" className={flow} />
          <path {...S} d="M44 32 H114" className={flow} />
          <path {...S} d="M44 32 H72 L114 51" className={flow} />
          {/* arrowheads at every delivered end */}
          <path {...S} strokeWidth={1.7} d="M107 23 L114 13 L102 12" />
          <path {...S} strokeWidth={1.7} d="M104 26 L114 32 L104 38" />
          <path {...S} strokeWidth={1.7} d="M107 41 L114 51 L102 52" />
        </>
      );
      break;
    case "output":
      body = (
        <>
          {/* verification scan — one arc circling the seal while in focus */}
          <g className={animate ? "glyph-scan" : undefined} opacity={animate ? 1 : 0}>
            <circle {...S} strokeWidth={2} strokeDasharray="14 149.4" cx="62" cy="32" r="26" />
          </g>
          <circle {...S} cx="62" cy="32" r="20" />
          {/* the completed mark */}
          <path {...S} strokeWidth={2.6} d="M51 33 L59 41 L74 23" />
          {/* three verification nodes on the seal */}
          <circle cx="62" cy="12" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="79.3" cy="42" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="44.7" cy="42" r="2.4" fill="currentColor" stroke="none" />
        </>
      );
      break;
    default:
      body = null;
  }

  return (
    <svg viewBox="0 0 124 64" className={className} data-glyph={id} aria-hidden preserveAspectRatio="xMidYMid meet">
      {body}
    </svg>
  );
}
