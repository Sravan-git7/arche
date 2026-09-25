/**
 * Tiny pub/sub used to keep the shared-element thread (hero signal → problem
 * diagram → services tabs) in sync with the sections that own its anchors.
 * Sections emit on scroll/state change; the thread re-positions on each emit.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeThread(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitThread(): void {
  listeners.forEach((fn) => fn());
}
