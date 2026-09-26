/**
 * PROMPT 13 / 24 / 29 — the 3D System Model's rail geometry.
 *
 * Five clusters sit at even intervals along ONE depth axis. The camera
 * travels that axis, so a cluster's distance from the camera is simply
 * `focus + (i - p * 4) * step`, and everything else follows from the
 * pinhole projection `scale = focal / distance`.
 *
 * PROMPT 29 — Increased breathing room, unhurried depth pacing, and
 * de-cluttered cluster offsets so stage 3 (SYSTEM) has ample whitespace.
 */

export type StageDef = {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  label: string;
  /** Offset off the depth axis, in rail units (x: sideways, y: vertical). */
  ox: number;
  oy: number;
};

export const STAGES: StageDef[] = [
  {
    id: "input",
    num: "01",
    title: "INPUT",
    subtitle: "Raw Ingestion",
    label: "RAW SIGNAL — ingests inbound unstructured data, events & requests.",
    ox: -0.88,
    oy: -0.44,
  },
  {
    id: "intelligence",
    num: "02",
    title: "INTELLIGENCE",
    subtitle: "Context Resolution",
    label: "AI AGENT — reads intent, resolves context & plans action.",
    ox: 0.82,
    oy: 0.38,
  },
  {
    id: "system",
    num: "03",
    title: "SYSTEM",
    subtitle: "Kernel & State",
    label: "SYSTEM KERNEL — orchestrates workflows, state logic & fallbacks.",
    ox: -0.68,
    oy: 0.32,
  },
  {
    id: "action",
    num: "04",
    title: "ACTION",
    subtitle: "Execution Path",
    label: "EXECUTION PATH — triggers tool calls, API routes & automated tasks.",
    ox: 0.82,
    oy: -0.40,
  },
  {
    id: "output",
    num: "05",
    title: "OUTPUT",
    subtitle: "Verified Deliverable",
    label: "DELIVERABLE — verified output, lead capture or clean story edit.",
    ox: -0.10,
    oy: -0.04,
  },
];

/** Index of the last cluster (the rail runs 0 → LAST). */
export const LAST = STAGES.length - 1;

/** Rail geometry, in world units / pixels. */
export const RAIL = {
  step: 280, // distance between clusters along the depth axis
  focal: 560, // perspective focal length (px)
  focus: 560, // camera → active cluster distance, i.e. scale exactly 1.0
  near: 350, // closer than this and the cluster is gone (already faded out)
};

/** Base size of a cluster plane, before perspective scaling. */
export const CARD = { w: 172, h: 106 };

export type RailPoint = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  /** Distance from the camera along the rail. */
  rel: number;
  visible: boolean;
  z: number;
};

/**
 * Where cluster `i` appears when the camera has travelled `p` (0..1) of the
 * rail, inside a scene box of `box` pixels. Pure function — the scene is a
 * deterministic read-out of scroll progress.
 */
export function project(
  i: number,
  p: number,
  box: { w: number; h: number },
  drift: { x: number; y: number } = { x: 0, y: 0 }
): RailPoint {
  const st = STAGES[i];
  // Signed distance from the camera's focus point, measured in stages:
  // negative = the camera has passed it, 0 = in focus, positive = ahead.
  const d = i - p * LAST;
  const rel = RAIL.focus + d * RAIL.step;
  const scale = RAIL.focal / Math.max(RAIL.near - 40, rel);

  // Passed clusters swing outward as they grow, so they leave the frame
  // instead of sliding over whatever is now in focus.
  const spread = 1 + Math.max(0, -d) * 1.5;
  const offX = Math.min(box.w * 0.16, 140);
  const offY = Math.min(box.h * 0.14, 72);

  // Apply camera drift/sway to spatial positions
  const x = box.w / 2 + (st.ox * offX * spread + drift.x * (1 - Math.abs(d) * 0.2)) * scale;
  const y = box.h / 2 + (st.oy * offY * spread + drift.y * (1 - Math.abs(d) * 0.2)) * scale;

  // One cluster is ever in focus; the ones behind fade fast (they are also
  // the ones growing), the ones ahead stay faint but present.
  let opacity: number;
  if (d >= 0) opacity = d < 0.38 ? 1 : Math.max(0.2, 1 - (d - 0.38) * 0.32);
  else opacity = d > -0.32 ? 1 - (-d / 0.32) * 0.55 : Math.max(0, 0.45 - (-d - 0.32) * 1.6);

  return {
    x,
    y,
    scale,
    opacity,
    rel,
    visible: opacity > 0.02,
    z: Math.max(2, Math.min(20, Math.round(20 - rel / 100))),
  };
}

/** 0 → 1 draw progress of the connector leaving cluster `i`. */
export const linkProgress = (i: number, p: number) => Math.max(0, Math.min(1, p * LAST - i));

/** Which cluster is in focus at progress p. */
export const focusIndex = (p: number) => Math.min(LAST, Math.max(0, Math.round(p * LAST)));

/** Scroll progress at which the rail pulls back and converges. */
export const CONVERGE_AT = 0.9;
