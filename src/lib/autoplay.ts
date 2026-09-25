/**
 * PROMPT 24 — Services "autoplay-first" coordination.
 *
 * Every service demo demonstrates itself the first time it becomes the
 * active tab in the viewport; nothing has to be clicked to see the idea.
 * Two pieces of shared state make that work across components:
 *
 *   played   which slugs have already shown their first-view preview this
 *            page visit (a preview never repeats, and never fights a
 *            returning visitor's own input)
 *   done     a tiny bus: a demo announces when its preview has finished, so
 *            the idle tab cycle can move on at a natural beat instead of on
 *            a blind timer
 *
 * The moment the visitor touches the Services section the cycle is stopped
 * permanently (see Chapters) — autoplay only ever runs while ignored.
 */

type DoneFn = (slug: string) => void;

const played = new Set<string>();
const listeners = new Set<DoneFn>();

/** True once this service has demonstrated itself during this page visit. */
export const previewPlayed = (slug: string): boolean => played.has(slug);

/** Mark a preview as shown (used when a demo starts its own first-view run). */
export const markPreviewPlayed = (slug: string): void => {
  played.add(slug);
};

/** A demo finished its first-view preview. Marks it played and notifies. */
export const announcePreviewDone = (slug: string): void => {
  played.add(slug);
  listeners.forEach((fn) => fn(slug));
};

export const onPreviewDone = (fn: DoneFn): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/** Called on page mount: a fresh visit gets a fresh round of previews. */
export const resetPreviews = (): void => {
  played.clear();
};

/* ------------------------------------------------------------------ */
/* Idle tab cycling                                                     */
/* ------------------------------------------------------------------ */

/** Minimum time a tab holds before the idle cycle advances. */
export const IDLE_ADVANCE_MS = 6000;

/**
 * Longest a tab is ever given. Generous on purpose: the normal exit is the
 * demo's own "done" signal (see onPreviewDone), this is only the safety net
 * for a preview that never reports back.
 */
const PREVIEW_HOLD: Record<string, number> = {
  "video-editing": 7000, // ~4.6s auto-scrub
  "web-development": 7000, // ~3.4s build sequence
  "ai-chatbots": 7000, // ~1.5s pause + ~3s reply
  "ai-automation": 16000, // manual run (~9.7s) + beat + automated run (~1.7s)
};

export const holdFor = (slug: string): number =>
  Math.max(IDLE_ADVANCE_MS, PREVIEW_HOLD[slug] ?? IDLE_ADVANCE_MS);

/** Beat between "preview finished" and the idle cycle moving on. */
export const DONE_BEAT_MS = 1100;
