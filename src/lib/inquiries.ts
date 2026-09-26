/**
 * PROMPT 37 — inquiry delivery (the real pipeline behind the Contact flow).
 *
 * Before this file existed, the guided Contact flow wrote submissions to
 * the visitor's OWN localStorage and showed "REQUEST RECEIVED" 250ms
 * later — nothing ever reached the studio. Every lead was silently lost.
 *
 * This is now the single place a submission is sent. Wiring (one-time,
 * ~5 minutes, done by the site owner):
 *
 *   1. Sign up at https://formspree.io — the free tier is enough.
 *   2. Create a form; you'll get an endpoint like
 *      https://formspree.io/f/abcdwxyz
 *   3. Paste it into FORM_ENDPOINT below (or provide VITE_FORM_ENDPOINT
 *      in a .env file / build env for a deployment-specific override).
 *   4. Rebuild. "REQUEST RECEIVED" now only appears after a real 2xx
 *      response from the endpoint; any failed send shows an honest
 *      error with a pre-filled mailto fallback, so a lead can never be
 *      silently lost again.
 *
 * Until an endpoint is configured the flow is honest about it too: the
 * submit screen offers the pre-filled "email us directly" fallback
 * instead of pretending anything was received.
 */
export type InquiryPayload = {
  name: string;
  email: string;
  company?: string;
  building: string;
  whatNeedsToChange: string;
  timeline: string;
  askArcheSignal?: string;
};

export type SendResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "network" | "rejected"; status?: number };

/** ← PASTE THE FORMSPREE ENDPOINT HERE (e.g. "https://formspree.io/f/abcdwxyz") */
const FORM_ENDPOINT = "";

export function inquiryEndpoint(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return (FORM_ENDPOINT || env?.VITE_FORM_ENDPOINT || "").trim();
}

/**
 * POST the collected inquiry to the configured endpoint (Formspree's
 * client-side JSON API). Resolves with a real verdict — the caller must
 * treat anything other than { ok: true } as a failed delivery.
 */
export async function submitInquiry(p: InquiryPayload): Promise<SendResult> {
  const endpoint = inquiryEndpoint();
  if (!endpoint) return { ok: false, reason: "unconfigured" };

  const body: Record<string, string> = {
    _subject: `New inquiry — ${p.building}`,
    _replyto: p.email,
    name: p.name,
    email: p.email,
    building: p.building,
    what_needs_to_change: p.whatNeedsToChange,
    timeline: p.timeline,
    source: "guided contact flow",
  };
  if (p.company?.trim()) body.company = p.company.trim();
  if (p.askArcheSignal) body.ask_arche_signal = p.askArcheSignal;

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (res.ok) return { ok: true };
    return { ok: false, reason: "rejected", status: res.status };
  } catch {
    return { ok: false, reason: "network" };
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * The honest fallback: one mailto with EVERY collected field pre-filled
 * in the body, so even a failed (or unconfigured) send carries the full
 * inquiry to hello@arche.studio.
 */
export function mailtoFallback(studioEmail: string, p: InquiryPayload): string {
  const lines = [
    `Name: ${p.name}`,
    `Email: ${p.email}`,
    p.company?.trim() ? `Company: ${p.company.trim()}` : null,
    `Building: ${p.building}`,
    `What needs to change: ${p.whatNeedsToChange}`,
    `Timeline / scale: ${p.timeline}`,
    p.askArcheSignal ? `Signal from Ask Arche: ${p.askArcheSignal}` : null,
    "",
    "Sent from the Arche contact flow.",
  ].filter(Boolean);
  const subject = encodeURIComponent(`Project inquiry — ${p.building}`);
  return `mailto:${studioEmail}?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`;
}
