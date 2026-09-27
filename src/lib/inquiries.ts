/**
 * PROMPT 37 — inquiry delivery (the real pipeline behind the Contact flow).
 *
 * Before this file existed, the guided Contact flow wrote submissions to
 * the visitor's OWN localStorage and showed "REQUEST RECEIVED" 250ms
 * later — nothing ever reached the studio. Every lead was silently lost.
 *
 * The delivery service selected for Arche is Web3Forms. It is designed for
 * browser-side submission: its public Access Key identifies the inbox to
 * receive the enquiry; it is not a secret server credential. Wiring is a
 * one-time owner task:
 *
 *   1. Create / verify a free form at https://web3forms.com.
 *   2. Copy its Access Key (a UUID), tied to hello@arche.studio.
 *   3. Set VITE_WEB3FORMS_ACCESS_KEY in the deploy/build environment
 *      (preferred), or paste it into WEB3FORMS_ACCESS_KEY below.
 *   4. Rebuild. "REQUEST RECEIVED" then appears only after Web3Forms
 *      returns BOTH an HTTP success response AND { success: true }.
 *
 * Until an access key is configured, the flow is honest about it: it offers
 * a pre-filled direct-email fallback rather than pretending anything was
 * received. See https://docs.web3forms.com/getting-started/api-reference
 * for the documented browser JSON endpoint and response contract.
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

/**
 * ← OPTIONAL: paste the Web3Forms access key here. Prefer the environment
 * variable below so production configuration stays outside the codebase.
 */
const WEB3FORMS_ACCESS_KEY = "";
const WEB3FORMS_SUBMIT_URL = "https://api.web3forms.com/submit";

type ViteEnv = { env?: Record<string, string | undefined> };

/** The public Web3Forms key, supplied by the site owner at build time. */
export function web3FormsAccessKey(): string {
  const env = (import.meta as unknown as ViteEnv).env;
  return (WEB3FORMS_ACCESS_KEY || env?.VITE_WEB3FORMS_ACCESS_KEY || "").trim();
}

/**
 * An override is intentionally supported for automated verification only.
 * Production defaults to Web3Forms' documented HTTPS endpoint.
 */
function web3FormsSubmitUrl(): string {
  const env = (import.meta as unknown as ViteEnv).env;
  return (env?.VITE_WEB3FORMS_SUBMIT_URL || WEB3FORMS_SUBMIT_URL).trim();
}

/**
 * POST the complete inquiry to Web3Forms' client-side JSON API. A 2xx on
 * its own is deliberately insufficient: Web3Forms' documented payload must
 * also say `success: true`, otherwise Contact renders the honest failure
 * path and never calls the enquiry received state.
 */
export async function submitInquiry(p: InquiryPayload): Promise<SendResult> {
  const accessKey = web3FormsAccessKey();
  if (!accessKey) return { ok: false, reason: "unconfigured" };

  const body: Record<string, string> = {
    access_key: accessKey,
    subject: `New Arche inquiry — ${p.building}`,
    // Web3Forms uses email/replyto to make replies go directly to the lead.
    email: p.email,
    replyto: p.email,
    name: p.name,
    building: p.building,
    what_needs_to_change: p.whatNeedsToChange,
    timeline: p.timeline,
    source: "Arche guided contact flow",
  };
  if (p.company?.trim()) body.company = p.company.trim();
  if (p.askArcheSignal) body.ask_arche_signal = p.askArcheSignal;

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(web3FormsSubmitUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    // A malformed/empty 2xx response must not produce a false confirmation.
    let result: { success?: boolean } | undefined;
    try {
      result = (await res.json()) as { success?: boolean };
    } catch {
      /* treated as rejected below */
    }
    if (res.ok && result?.success === true) return { ok: true };
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
