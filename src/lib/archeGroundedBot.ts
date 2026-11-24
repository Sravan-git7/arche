/**
 * Arché Grounded Chatbot Engine
 *
 * 100% free, zero-cost, offline-capable smart intent & keyword matcher
 * grounded strictly in verified Arché data from src/lib/archeKnowledge.ts.
 *
 * Directly wired to real repo pricing, services & work data (INR rates, turnarounds,
 * revision counts, add-ons). Never invents fake pricing ($5k–$10k) or generic fallbacks.
 *
 * Securely queries /api/chat serverless proxy where GEMINI_API_KEY is protected,
 * with automatic zero-delay fallback to the offline deterministic engine.
 */

import {
  matchRepoKnowledge,
  type KnowledgeResponse,
  type ChatHistoryItem,
} from "./archeKnowledge";
import { STUDIO_INFO } from "../data/services";

export interface BotResponse extends KnowledgeResponse {}

export const ARCHE_STUDIO_FACTS = {
  name: STUDIO_INFO.name,
  tagline: "Technology Meets Creativity · Systems that make businesses win.",
  location: "Hyderabad, India",
  email: STUDIO_INFO.email,
  phone: STUDIO_INFO.phone,
  whatsappUrl: STUDIO_INFO.whatsappHref,
};

/**
 * Smart offline intent matcher grounded strictly in Arché verified repo data.
 */
export function matchGroundedIntent(
  rawQuery: string,
  history?: ChatHistoryItem[]
): BotResponse {
  return matchRepoKnowledge(rawQuery, history);
}

/**
 * Async Chatbot Query:
 * 1. Queries our secure serverless proxy endpoint `/api/chat` (where GEMINI_API_KEY / GROQ_API_KEY
 *    are protected on the server and NEVER exposed to frontend bundles).
 * 2. If `/api/chat` is unavailable (e.g. running plain `vite dev` locally without serverless
 *    functions or before configuring server env vars), seamlessly and instantly falls back
 *    to our deterministic grounded engine in archeKnowledge.ts.
 */
export async function askArcheChatbot(
  query: string,
  history?: ChatHistoryItem[]
): Promise<BotResponse> {
  const defaultActions = [
    { label: "View All Pricing →", href: "#/pricing" },
    { label: "Start a Project →", href: "#/contact" },
    { label: "WhatsApp Studio Line →", href: STUDIO_INFO.whatsappHref, isExternal: true },
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, messages: history }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const replyText = data?.reply || data?.text;
      if (replyText && typeof replyText === "string" && replyText.trim()) {
        return {
          text: replyText.trim(),
          actions: data.actions || defaultActions,
        };
      }
    }
  } catch {
    // Graceful fallback to offline deterministic knowledge engine
  }

  // Instant deterministic grounded engine fallback
  return matchRepoKnowledge(query, history);
}
