/**
 * PROMPT 13 / 24 — the 3D System Model's rail geometry.
 *
 * Pure maths, kept apart from the component so it can be reasoned about (and
 * verified) on its own: given a scroll progress and a scene box, where does
 * each cluster appear, how big is it, and how visible is it?
 *
 * Five clusters sit at even intervals along ONE depth axis. The camera
 * travels that axis, so a cluster's distance from the camera is simply
 * `focus + (i - p * 4) * step`, and everything else follows from the
 * pinhole projection `scale = focal / distance`.
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
    ox: -1,
    oy: -0.55,
  },
  {
    id: "intelligence",
    num: "02",
    title: "INTELLIGENCE",
    subtitle: "Context Resolution",
    label: "AI AGENT — reads intent, resolves context & plans action.",
    ox: 0.94,
    oy: 0.5,
  },
  {
    id: "system",
    num: "03",
    title: "SYSTEM",
    subtitle: "Kernel & State",
    label: "SYSTEM KERNEL — orchestrates workflows, state logic & fallbacks.",
    ox: -0.88,
    oy: 0.44,
  },
  {
    id: "action",
    num: "04",
    title: "ACTION",
    subtitle: "Execution Path",
    label: "EXECUTION PATH — triggers tool calls, API routes & automated tasks.",
    ox: 0.96,
    oy: -0.52,
  },
  {
    id: "output",
    num: "05",
    title: "OUTPUT",
    subtitle: "Verified Deliverable",
    label: "DELIVERABLE — verified output, lead capture or clean story edit.",
    ox: -0.18,
    oy: -0.06,
  },
];

/** Index of the last cluster (the rail runs 0 → LAST). */
export const LAST = STAGES.length - 1;

/** Rail geometry, in world units / pixels. */
export const RAIL = {
  step: 260, // distance between clusters along the depth axis
  focal: 520, // perspective focal length (px)
  focus: 520, // camera → active cluster distance, i.e. scale exactly 1.0
  near: 330, // closer than this and the cluster is gone (already faded out)
};

/** Base size of a cluster plane, before perspective scaling. */
export const CARD = { w: 168, h: 104 };

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
export function project(i: number, p: number, box: { w: number; h: number }): RailPoint {
  const st = STAGES[i];
  // Signed distance from the camera's focus point, measured in stages:
  // negative = the camera has passed it, 0 = in focus, positive = ahead.
  const d = i - p * LAST;
  const rel = RAIL.focus + d * RAIL.step;
  const scale = RAIL.focal / Math.max(RAIL.near - 40, rel);

  // Passed clusters swing outward as they grow, so they leave the frame
  // instead of sliding over whatever is now in focus.
  const spread = 1 + Math.max(0, -d) * 1.45;
  const offX = Math.min(box.w * 0.17, 150);
  const offY = Math.min(box.h * 0.15, 78);

  const x = box.w / 2 + st.ox * offX * spread * scale;
  const y = box.h / 2 + st.oy * offY * spread * scale;

  // One cluster is ever in focus; the ones behind fade fast (they are also
  // the ones growing), the ones ahead stay faint but present.
  let opacity: number;
  if (d >= 0) opacity = d < 0.4 ? 1 : Math.max(0.2, 1 - (d - 0.4) * 0.32);
  else opacity = d > -0.35 ? 1 - (-d / 0.35) * 0.55 : Math.max(0, 0.45 - (-d - 0.35) * 1.6);

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
