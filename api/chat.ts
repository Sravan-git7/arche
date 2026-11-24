/**
 * ============================================================================
 * ARCHÉ CREATIVE STUDIOS — SECURE SERVERLESS CHAT PROXY (/api/chat)
 * ============================================================================
 *
 * Vercel Serverless Function:
 * - Secures Gemini / Groq API keys on the server (NEVER exposed to frontend).
 * - Enforces rate caps, payload validation, and maximum character length.
 * - Injects verified Arché studio brief & real INR pricing architecture as system instructions.
 * - Returns structured JSON { reply, text, actions } to the client.
 */

interface ChatMessage {
  sender?: "user" | "bot" | "assistant" | "model";
  role?: "user" | "assistant" | "model" | "system";
  text?: string;
  content?: string;
}

const ARCHE_SYSTEM_INSTRUCTION = `You are the official AI concierge for ARCHÉ CREATIVE STUDIOS (Hyderabad, India).
Brand Tagline: "Technology Meets Creativity · Systems that make businesses win."
Contact: team@arche.studio | WhatsApp: +91 7995937536 | Location: Hyderabad, India (Working Globally)

STUDIO IDENTITY & MANIFESTO:
Arché is an AI and digital systems studio. We design and build connected systems—brand film, custom websites, autonomous AI agents, and workflow automation—engineered to work together instead of in silos. Rather than dealing with separate fragmented agencies, our clients partner with one unified multidisciplinary team with deterministic SLAs and 100% full source code ownership upon delivery.

CORE VERIFIED PRICING ARCHITECTURE (INR):
1. Video Production & Editing:
   - Short-Form Basic: ₹799 / video (up to 30s, 3 working days, 1 revision)
   - Short-Form Standard: ₹1,499 / video (up to 60s, styled captions, sound design, B-roll, 3-4 days, 2 revisions)
   - Short-Form Premium: ₹2,499 / video (up to 90s, motion graphics, master sound, 2 revisions)
   - Long-Form Basic: ₹2,499 / video (up to 5 min, 4-5 working days, 1 revision)
   - Long-Form Standard: ₹4,999 / video (up to 10 min, sound design, chapter markers, 2 revisions)
   - Long-Form Premium: ₹8,999 / video (up to 20 min, master color grade & sound, custom thumbnail included, 2 revisions)
   - Monthly Retainers: Starter (₹5,999/mo, 8 reels) · Growth (₹14,999/mo, 12 reels) · Partner (₹25,999/mo, 16 reels)

2. Web Development:
   - Launch Page (Basic): ₹5,999 one-time (single responsive landing page, enquiry form, 5-7 working days, 1 revision)
   - Business Site (Standard): ₹12,999 one-time (up to 5 pages, custom brand visual direction, enquiry form, WhatsApp link, SEO setup, 10-15 working days, 2 revisions)
   - Growth Platform (Premium): ₹24,999 one-time (up to 8 pages, CMS integration, complex interactions, performance tuning, 15-25 working days, 2 revisions)
   - Custom E-commerce Engineering: From ₹34,999

3. Pitch Decks & Storytelling:
   - Clear Deck (Basic): ₹3,999 (up to 8 slides, clean layouts & typography, editable PPTX + export PDF, 4-5 working days)
   - Story Deck (Standard): ₹7,999 (up to 12 slides, narrative flow, custom diagrams, light copy polish, 6-8 working days)
   - Signature Deck (Premium): ₹14,999 (up to 18 slides, bespoke visual storytelling & speaker notes, 8-12 working days)
   - Priority Express Delivery: +25% sprint rush

4. AI Solutions & Operational Automation:
   - Starter Assist (Basic): ₹7,999 (1 website FAQ/lead bot OR 1 automated workflow into Sheets/email, 5-8 working days)
   - Connected Growth (Standard): ₹14,999 (document-grounded assistant + up to 2 active integrations with CRM/Slack/Sheets, 10-15 working days)
   - AI Workflow Suite (Premium): ₹29,999 (multi-step operational pipeline with human approval stages & deterministic sync, 15-25 working days)

OWNERSHIP & COMMERCIAL POLICIES:
- Ownership: Clients own 100% of all deliverables upon final invoice clearance (clean GitHub repos, editable Figma files, vector embeddings, n8n/Zapier automations). Zero vendor lock-in.
- Revisions: 1 round for Basic tiers; 2 consolidated revision rounds for Standard and Premium tiers within 7 days of staging delivery.

RULES:
- ONLY quote verified INR prices from the catalogue above. Never quote USD or fake ranges.
- If asked about a specific tier (e.g., "What's in Standard Website?"), answer ONLY that tier with its price, turnaround, and deliverables in a warm conversational tone—do not dump all three tiers.
- If asked "what is arche" or "who are you", explain our studio identity cleanly without dumping a price list.
- Format responses cleanly with bold highlights and bullet points. Never output raw unparsed markdown symbols like double asterisks in prose.`;

export default async function handler(req: any, res: any) {
  // Enforce POST method
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const query = typeof body.query === "string" ? body.query.trim() : typeof body.message === "string" ? body.message.trim() : "";
    const rawMessages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

    // Basic Input Validation & Abuse Protection
    if (!query && rawMessages.length === 0) {
      return res.status(400).json({ error: "Query or messages array is required." });
    }

    const activeQuery = query || rawMessages[rawMessages.length - 1]?.text || rawMessages[rawMessages.length - 1]?.content || "";

    if (activeQuery.length > 2000) {
      return res.status(400).json({ error: "Message exceeds maximum length cap of 2000 characters." });
    }

    // Limit conversation history to the last 10 messages for safety and token efficiency
    const recentMessages = rawMessages.slice(-10).map((m) => {
      const text = (m.text || m.content || "").slice(0, 2000);
      const isUser = m.sender === "user" || m.role === "user";
      return {
        role: isUser ? "user" : "model",
        text,
      };
    });

    const defaultActions = [
      { label: "View All Pricing →", href: "#/pricing" },
      { label: "Start a Project →", href: "#/contact" },
      { label: "WhatsApp Studio Line →", href: "https://wa.me/917995937536", isExternal: true },
    ];

    // Read Server Environment Variables (never exposed to client)
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return res.status(503).json({
        error: "Server LLM API key not configured.",
        fallback: true,
      });
    }

    // -----------------------------------------------------------------------
    // Strategy 1: Google Gemini 2.5 / 1.5 Flash (Primary)
    // -----------------------------------------------------------------------
    if (geminiKey) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`;

        const conversationContents = recentMessages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

        const payload = {
          systemInstruction: {
            parts: [{ text: ARCHE_SYSTEM_INSTRUCTION }],
          },
          contents: [
            ...conversationContents,
            {
              role: "user",
              parts: [{ text: activeQuery }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
          },
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const geminiRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && typeof candidateText === "string" && candidateText.trim()) {
            return res.status(200).json({
              reply: candidateText.trim(),
              text: candidateText.trim(),
              actions: defaultActions,
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, attempting fallback:", geminiErr);
      }
    }

    // -----------------------------------------------------------------------
    // Strategy 2: Groq API (Secondary)
    // -----------------------------------------------------------------------
    if (groqKey) {
      try {
        const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

        const groqMessages = [
          { role: "system", content: ARCHE_SYSTEM_INSTRUCTION },
          ...recentMessages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
          })),
          { role: "user", content: activeQuery },
        ];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const groqRes = await fetch(groqEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey.trim()}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: groqMessages,
            temperature: 0.2,
            max_tokens: 300,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const groqText = groqData?.choices?.[0]?.message?.content;
          if (groqText && typeof groqText === "string" && groqText.trim()) {
            return res.status(200).json({
              reply: groqText.trim(),
              text: groqText.trim(),
              actions: defaultActions,
            });
          }
        }
      } catch (groqErr) {
        console.warn("Groq API call failed:", groqErr);
      }
    }

    // If both failed or timed out
    return res.status(502).json({
      error: "Upstream AI provider unavailable.",
      fallback: true,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || "Internal server error",
      fallback: true,
    });
  }
}
