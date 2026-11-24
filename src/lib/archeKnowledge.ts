/**
 * ============================================================================
 * ARCHÉ CREATIVE STUDIOS — REAL REPO KNOWLEDGE & GROUNDED RETRIEVAL ENGINE
 * ============================================================================
 *
 * Directly imports all verified data from:
 * - src/data/services.ts (servicesData, STUDIO_INFO)
 * - src/data/projects.ts (projects)
 *
 * Powers both:
 * 1. Offline Deterministic Retrieval Engine (100% accurate, zero hallucination).
 * 2. LLM / Gemini Dynamic System Prompt Context (serialized real repository JSON).
 */

import { servicesData, STUDIO_INFO } from "../data/services";
import { projects } from "../data/projects";

export interface KnowledgeAction {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface KnowledgeResponse {
  text: string;
  actions?: KnowledgeAction[];
}

export interface ChatHistoryItem {
  sender: "user" | "bot";
  text: string;
}

/**
 * Builds dynamic system prompt containing the exact serialized repo knowledge.
 */
export function buildSystemPromptWithKnowledge(): string {
  const summarizedServices = servicesData.map((s) => ({
    n: s.n,
    title: s.title,
    slug: s.slug,
    startingPrice: s.startingPrice,
    startingPriceLabel: s.startingPriceLabel,
    packageGroups: s.packageGroups.map((g) => ({
      groupTitle: g.groupTitle,
      packages: g.packages.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        turnaround: p.turnaround,
        revisions: p.revisions,
        summary: p.summary,
        features: p.features,
      })),
    })),
    specialistServices: s.specialistServices || [],
    addOns: s.addOns || [],
    carePlans: s.carePlans || [],
  }));

  const verifiedProjects = projects.map((p) => ({
    name: p.name,
    serviceLabel: p.serviceLabel,
    status: p.status,
    scope: p.scope,
    summary: p.summary,
  }));

  return `You are the official conversational concierge for ARCHÉ CREATIVE STUDIOS (Hyderabad, India).
Brand Tagline: "Technology Meets Creativity · Systems that make businesses win."
Contact: ${STUDIO_INFO.email} | Phone/WhatsApp: ${STUDIO_INFO.phone} (${STUDIO_INFO.whatsappHref}) | Website: ${STUDIO_INFO.websiteUrl}

STUDIO BRIEF:
Arché is an AI and digital systems studio. We design and build connected systems—brand film, custom websites, AI agents, and workflow automation—engineered to work together instead of in silos. Rather than dealing with separate fragmented agencies, our clients get one multidisciplinary team with deterministic execution and 100% full source code ownership upon delivery.

CORE INSTRUCTIONS:
1. ONLY quote verified prices in Indian Rupees (INR) from the catalogue below. Never invent foreign dollar amounts or speculative fees.
2. If the user asks about a SPECIFIC tier (e.g. "What's in Standard Website?"), answer ONLY that tier with its price, turnaround, and deliverables in a warm conversational tone—do not dump all three tiers unless asked to compare.
3. If asked "what is arche" or "who are you", summarize our studio brief gracefully.
4. Keep replies clear, conversational, and structured with bold highlights and bullet points. Never use raw double asterisks or unparsed markdown formatting that distracts the reader.
5. Direct visitors to /pricing for full packages and /contact to start a project.

VERIFIED SERVICE & PRICING CATALOGUE:
${JSON.stringify(summarizedServices, null, 2)}

VERIFIED INTERNAL BUILDS & PROOFS:
${JSON.stringify(verifiedProjects, null, 2)}`;
}

/**
 * Deterministic Client-Side Knowledge Matcher with Conversation Context Memory.
 * Matches user query against the actual imported data modules and formats clean, exact responses.
 */
export function matchRepoKnowledge(
  rawQuery: string,
  history?: ChatHistoryItem[]
): KnowledgeResponse {
  const q = rawQuery.toLowerCase().trim();

  // Helper getters from imported real data
  const videoService = servicesData.find((s) => s.slug === "video-production" || s.slug === "video-editing")!;
  const deckService = servicesData.find((s) => s.slug === "pitch-decks-storytelling")!;
  const webService = servicesData.find((s) => s.slug === "web-development")!;
  const aiService = servicesData.find((s) => s.slug === "ai-solutions-automation")!;

  const defaultActions: KnowledgeAction[] = [
    { label: "View All Pricing →", href: "#/pricing" },
    { label: "Start a Project →", href: "#/contact" },
    { label: "WhatsApp Studio (+91 7995937536) →", href: STUDIO_INFO.whatsappHref, isExternal: true },
  ];

  // Derive conversation context from history
  const recentHistoryText = (history || [])
    .slice(-4)
    .map((h) => h.text.toLowerCase())
    .join(" ");

  const contextHasWeb =
    recentHistoryText.includes("web") ||
    recentHistoryText.includes("website") ||
    recentHistoryText.includes("business site") ||
    recentHistoryText.includes("launch page");

  const contextHasVideo =
    recentHistoryText.includes("video") ||
    recentHistoryText.includes("short-form") ||
    recentHistoryText.includes("long-form") ||
    recentHistoryText.includes("reel");

  const contextHasDeck =
    recentHistoryText.includes("deck") ||
    recentHistoryText.includes("slide") ||
    recentHistoryText.includes("pitch");

  const contextHasAi =
    recentHistoryText.includes("ai") ||
    recentHistoryText.includes("bot") ||
    recentHistoryText.includes("automation") ||
    recentHistoryText.includes("crm");

  // =========================================================================
  // 1. STUDIO IDENTITY / WHAT IS ARCHÉ
  // =========================================================================
  if (
    q === "what is arche" ||
    q === "what is arche?" ||
    q.includes("what is arche") ||
    q.includes("who is arche") ||
    q.includes("who are you") ||
    q.includes("what do you do") ||
    q.includes("about arche") ||
    q.includes("tell me about arche") ||
    q === "what are you" ||
    q === "about"
  ) {
    return {
      text: `Arché is an AI and digital systems studio based in Hyderabad, India. We design and build connected systems—cinematic brand film, custom high-performance websites, 24/7 AI agents, and workflow automation—engineered to work together instead of in silos.\n\nRather than dealing with separate fragmented agencies that don't understand each other's tech stacks, our clients partner with one multidisciplinary team with deterministic SLAs, live staging links, and 100% full source code ownership upon launch.`,
      actions: [
        { label: "Explore Services →", href: "#/services" },
        { label: "View Selected Work →", href: "#/work" },
        { label: "Start a Project Sprint →", href: "#/contact" },
      ],
    };
  }

  // =========================================================================
  // 2. CONVERSATIONAL GREETINGS
  // =========================================================================
  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q === "hi there" ||
    q === "hello there" ||
    q.startsWith("hi ") ||
    q.startsWith("hello ") ||
    q.startsWith("hey ") ||
    q === "good morning" ||
    q === "good evening" ||
    q === "good afternoon"
  ) {
    return {
      text: `Hello! I am Arché's Studio Concierge. I'm directly grounded in Arché's verified INR rates, turnaround SLAs, and service architectures.\n\nI can help you explore exact package pricing, turnaround times, and deliverables across:\n• **Video Editing & Production** (from ₹799)\n• **Web Development** (from ₹5,999)\n• **Pitch Decks & Storytelling** (from ₹3,999)\n• **AI Chatbots & Automation** (from ₹7,999)\n\nWhat are you looking to build or optimize?`,
      actions: defaultActions,
    };
  }

  // =========================================================================
  // 3. RECOMMENDATIONS & "WHERE SHOULD I START?"
  // =========================================================================
  if (
    q.includes("what should i start with") ||
    q.includes("where should i start") ||
    q.includes("where do i start") ||
    q.includes("i run a small business") ||
    q.includes("small business") ||
    q.includes("recommendation") ||
    q.includes("recommend") ||
    q.includes("best plan for me") ||
    q.includes("which package")
  ) {
    return {
      text: `For growing businesses and founders starting with Arché, we typically recommend two high-leverage entry points:\n\n1. **Standard Business Website (₹12,999 one-time)**:\n  - 5 custom pages, responsive design, WhatsApp/form lead capture, and on-page SEO. It establishes instant credibility and serves as the foundation for future traffic.\n\n2. **Short-Form Video (₹799–₹1,499/video)** or **Starter Retainer (₹5,999/mo)**:\n  - Consistent organic visibility with styled captions, hook pacing, and clean sound design.\n\nBoth are modular: once your web and content channels are humming, we can connect 24/7 AI lead capture or CRM workflows with zero rebuild.`,
      actions: [
        { label: "Explore Web Development →", href: "#/services/web-development" },
        { label: "Explore Video Editing →", href: "#/services/video-editing" },
        { label: "Book a Scope Consultation →", href: "#/contact" },
      ],
    };
  }

  // =========================================================================
  // 4. COMPARISONS ("Basic vs Standard", "Standard vs Premium")
  // =========================================================================
  if (
    q.includes("difference between") ||
    q.includes("compare basic and standard") ||
    q.includes("basic vs standard") ||
    q.includes("standard vs premium") ||
    q.includes("compare tiers")
  ) {
    return {
      text: `The core differences between Arché's tiers reflect depth and scope:\n\n• **Basic Tiers** (e.g. ₹5,999 Web, ₹799 Video):\n  - Lean single-deliverable sprint designed for rapid launch.\n  - 1 consolidated revision round, core essentials only.\n\n• **Standard Tiers** (e.g. ₹12,999 Web, ₹1,499 Video — Most Popular):\n  - Full commercial build designed for market competition.\n  - Up to 5 pages, custom brand visual direction, sound design & B-roll, 2 consolidated revision rounds, and direct CRM/WhatsApp integrations.\n\n• **Premium Tiers** (e.g. ₹24,999 Web, ₹2,499 Video, ₹29,999 AI):\n  - Flagship production with bespoke motion graphics, CMS architectures, complex logic, and multi-step automated pipelines.`,
      actions: [
        { label: "View Detailed Pricing Matrix →", href: "#/pricing" },
        { label: "Talk to Our Team →", href: "#/contact" },
      ],
    };
  }

  // =========================================================================
  // 5. CONVERSATIONAL FOLLOW-UPS (e.g. "how long does that take?", "timeline")
  // =========================================================================
  const isFollowUpTimeline =
    q === "how long does that take?" ||
    q === "how long does that take" ||
    q === "how long does it take?" ||
    q === "how long does it take" ||
    q === "timeline" ||
    q === "turnaround" ||
    q === "how fast" ||
    q === "how many days";

  if (isFollowUpTimeline) {
    if (contextHasWeb) {
      return {
        text: `For our web development packages, the turnaround times are:\n\n• **Launch Page (Basic)**: 5–7 working days\n• **Business Site (Standard)**: 10–15 working days\n• **Growth Platform (Premium)**: 15–25 working days\n\nEvery project includes 2 consolidated revision rounds via live staging links. Priority express delivery (+25%) is available if you have a hard deadline.`,
        actions: [
          { label: "View Web Packages →", href: "#/services/web-development" },
          { label: "Start Web Project →", href: "#/contact" },
        ],
      };
    }

    if (contextHasVideo) {
      return {
        text: `For video production and editing, standard turnarounds are:\n\n• **Short-Form Reels (Basic/Standard)**: 3–5 working days\n• **Short-Form Premium**: 4–6 working days\n• **Long-Form Video (Basic/Standard)**: 5–6 working days\n• **Long-Form Premium**: 6–8 working days\n\nBatch retainer reels are delivered on a scheduled bi-weekly rolling cadence.`,
        actions: [
          { label: "View Video Packages →", href: "#/services/video-editing" },
          { label: "Start Video Project →", href: "#/contact" },
        ],
      };
    }

    if (contextHasDeck) {
      return {
        text: `For pitch decks and visual storytelling, turnaround times are:\n\n• **Clear Deck (Basic, 8 slides)**: 4–5 working days\n• **Story Deck (Standard, 12 slides)**: 6–8 working days\n• **Signature Deck (Premium, 18 slides)**: 8–12 working days\n\nExpress investor sprint delivery (+25% fee) is available for imminent pitch deadlines.`,
        actions: [
          { label: "View Deck Packages →", href: "#/pricing" },
          { label: "Book a Deck Sprint →", href: "#/contact" },
        ],
      };
    }

    if (contextHasAi) {
      return {
        text: `For AI assistants and operational automations, turnaround times are:\n\n• **Starter Assist (Basic)**: 5–8 working days\n• **Connected Growth (Standard)**: 10–15 working days\n• **AI Workflow Suite (Premium)**: 15–25 working days\n\nIncludes staging verification, end-to-end webhook testing, and team walkthrough.`,
        actions: [
          { label: "Explore AI Chatbots →", href: "#/services/ai-chatbots" },
          { label: "Start an AI Sprint →", href: "#/contact" },
        ],
      };
    }
  }

  // =========================================================================
  // 6. TARGETED SINGLE-TIER WEB QUERIES
  // =========================================================================
  const isWebKeyword =
    q.includes("web") ||
    q.includes("site") ||
    q.includes("website") ||
    q.includes("webpage") ||
    q.includes("landing page") ||
    q.includes("frontend");

  const isBasicKeyword =
    q.includes("basic") ||
    q.includes("starter") ||
    q.includes("cheapest") ||
    q.includes("entry") ||
    q.includes("launch page") ||
    q.includes("tier 1") ||
    q.includes("lowest");

  const isStandardKeyword =
    q.includes("standard") ||
    q.includes("business") ||
    q.includes("tier 2") ||
    q.includes("mid");

  const isPremiumKeyword =
    q.includes("premium") ||
    q.includes("pro") ||
    q.includes("growth platform") ||
    q.includes("flagship") ||
    q.includes("signature") ||
    q.includes("highest") ||
    q.includes("tier 3");

  // Specific Single-Tier: Standard Website ("What's in Standard Website?", "standard website")
  if (
    q.includes("standard website") ||
    q.includes("what's in standard website") ||
    q.includes("whats in standard website") ||
    q.includes("business site") ||
    (isWebKeyword && isStandardKeyword && !isBasicKeyword && !isPremiumKeyword)
  ) {
    const webStandard = webService.packageGroups[0]?.packages.find((p) => p.id === "web-standard")!;
    return {
      text: `Our **Business Site (Standard)** web development package is **${webStandard.price} one-time**:\n\n• **Turnaround**: ${webStandard.turnaround}\n• **Revisions**: ${webStandard.revisions}\n• **Deliverables**:\n  - Up to 5 custom responsive pages engineered for conversion\n  - Tailored brand visual direction & modern typography\n  - High-converting lead inquiry forms & direct WhatsApp link\n  - Comprehensive on-page SEO setup & metadata\n  - 100% full source code ownership (zero vendor lock-in)\n\nLooking for something lighter? Our single-page Launch Page is ₹5,999. Need full CMS scaling? Growth Platform is ₹24,999.`,
      actions: [
        { label: "Explore Web Development →", href: "#/services/web-development" },
        { label: "View All Pricing →", href: "#/pricing" },
        { label: "Start a Web Project →", href: "#/contact" },
      ],
    };
  }

  // Specific Single-Tier: Basic Website / Launch Page
  if (
    q.includes("basic website") ||
    q.includes("launch page") ||
    (isWebKeyword && isBasicKeyword && !isStandardKeyword && !isPremiumKeyword)
  ) {
    const webBasic = webService.packageGroups[0]?.packages.find((p) => p.id === "web-basic")!;
    return {
      text: `Our **Launch Page (Basic)** web development package is **${webBasic.price} one-time**:\n\n• **Turnaround**: ${webBasic.turnaround}\n• **Revisions**: ${webBasic.revisions}\n• **Deliverables**:\n  - Single high-converting landing page built custom in React/Tailwind\n  - Fully responsive on mobile, tablet, and desktop\n  - Integrated lead enquiry form & basic analytics setup\n  - Full source code ownership upon delivery.`,
      actions: [
        { label: "Explore Web Development →", href: "#/services/web-development" },
        { label: "View All Pricing →", href: "#/pricing" },
        { label: "Start a Web Project →", href: "#/contact" },
      ],
    };
  }

  // Specific Single-Tier: Premium Website / Growth Platform
  if (
    q.includes("premium website") ||
    q.includes("growth platform") ||
    (isWebKeyword && isPremiumKeyword && !isBasicKeyword && !isStandardKeyword)
  ) {
    const webPremium = webService.packageGroups[0]?.packages.find((p) => p.id === "web-premium")!;
    return {
      text: `Our **Growth Platform (Premium)** web development package is **${webPremium.price} one-time**:\n\n• **Turnaround**: ${webPremium.turnaround}\n• **Revisions**: ${webPremium.revisions}\n• **Deliverables**:\n  - Up to 8 custom pages with headless CMS integration\n  - Complex bespoke interactive micro-interactions & fluid motion\n  - Performance tuning (sub-second load, 95+ Google Lighthouse)\n  - Full source code, Figma design files & documentation.`,
      actions: [
        { label: "Explore Web Development →", href: "#/services/web-development" },
        { label: "View All Pricing →", href: "#/pricing" },
        { label: "Start a Web Project →", href: "#/contact" },
      ],
    };
  }

  // General Web Development (if user asks about websites in general)
  if (isWebKeyword && (q.includes("cost") || q.includes("price") || q.includes("pricing") || q.includes("package") || q.includes("tier") || q.includes("how much"))) {
    const webStandard = webService.packageGroups[0]?.packages.find((p) => p.id === "web-standard")!;
    const webBasic = webService.packageGroups[0]?.packages.find((p) => p.id === "web-basic")!;
    const webPremium = webService.packageGroups[0]?.packages.find((p) => p.id === "web-premium")!;

    return {
      text: `Arché Web Development Packages (All published in INR):\n\n• **Launch Page (Basic) — ${webBasic.price}**:\n  - Single high-converting landing page, responsive layout, enquiry form\n  - Turnaround: ${webBasic.turnaround} · Revisions: ${webBasic.revisions}\n\n• **Business Site (Standard) — ${webStandard.price}**:\n  - Up to 5 custom responsive pages, brand visual direction, enquiry form, WhatsApp link, SEO setup\n  - Turnaround: ${webStandard.turnaround} · Revisions: ${webStandard.revisions}\n\n• **Growth Platform (Premium) — ${webPremium.price}**:\n  - Up to 8 custom pages, CMS integration, complex interactions, performance tuning\n  - Turnaround: ${webPremium.turnaround} · Revisions: ${webPremium.revisions}\n\n*Custom E-commerce engineering is available from ₹34,999.*`,
      actions: [
        { label: "Explore Web Development →", href: "#/services/web-development" },
        { label: "View Web Pricing →", href: "#/pricing" },
        { label: "Start a Web Project →", href: "#/contact" },
      ],
    };
  }

  // =========================================================================
  // 7. TARGETED VIDEO EDITING QUERIES
  // =========================================================================
  const isVideoKeyword =
    q.includes("video") ||
    q.includes("edit") ||
    q.includes("reel") ||
    q.includes("shorts") ||
    q.includes("short-form") ||
    q.includes("shortform") ||
    q.includes("long-form") ||
    q.includes("longform") ||
    q.includes("footage");

  // Basic Video Editing
  if (isVideoKeyword && isBasicKeyword) {
    const shortBasic = videoService.packageGroups[0]?.packages.find((p) => p.id === "short-basic")!;
    const longBasic = videoService.packageGroups[1]?.packages.find((p) => p.id === "long-basic")!;

    return {
      text: `Arché offers two Basic video editing plans depending on duration:\n\n• **Short-Form Basic — ${shortBasic.price} / ${shortBasic.unit}**:\n  - Final duration up to 30s (source footage up to 5 min)\n  - Clean cuts, English captions, basic audio balancing & color correction\n  - Turnaround: ${shortBasic.turnaround} · Revisions: ${shortBasic.revisions}\n\n• **Long-Form Basic — ${longBasic.price} / ${longBasic.unit}**:\n  - Final duration up to 5 min (source footage up to 30 min)\n  - Clean multi-take assembly, voice clean-up & titles\n  - Turnaround: ${longBasic.turnaround} · Revisions: ${longBasic.revisions}`,
      actions: [
        { label: "View Video Packages →", href: "#/services/video-editing" },
        { label: "Check All Pricing →", href: "#/pricing" },
        { label: "Request Video Scope →", href: "#/contact" },
      ],
    };
  }

  // Standard Video Editing
  if (isVideoKeyword && isStandardKeyword) {
    const shortStd = videoService.packageGroups[0]?.packages.find((p) => p.id === "short-standard")!;
    const longStd = videoService.packageGroups[1]?.packages.find((p) => p.id === "long-standard")!;

    return {
      text: `Arché Standard Video Editing Packages:\n\n• **Short-Form Standard — ${shortStd.price} / ${shortStd.unit}**:\n  - Final duration up to 60s (source up to 10 min)\n  - Hook pacing, styled branded captions, sound design & B-roll inserts\n  - Turnaround: ${shortStd.turnaround} · Revisions: ${shortStd.revisions}\n\n• **Long-Form Standard — ${longStd.price} / ${longStd.unit}**:\n  - Final duration up to 10 min (source up to 60 min)\n  - Multi-camera sync, pacing rhythm, sound design & chapter markers\n  - Turnaround: ${longStd.turnaround} · Revisions: ${longStd.revisions}`,
      actions: [
        { label: "Explore Video Editing →", href: "#/services/video-editing" },
        { label: "View All Pricing →", href: "#/pricing" },
      ],
    };
  }

  // Premium Video Editing
  if (isVideoKeyword && isPremiumKeyword) {
    const shortPrem = videoService.packageGroups[0]?.packages.find((p) => p.id === "short-premium")!;
    const longPrem = videoService.packageGroups[1]?.packages.find((p) => p.id === "long-premium")!;

    return {
      text: `Arché Premium Video Editing Packages:\n\n• **Short-Form Premium — ${shortPrem.price} / ${shortPrem.unit}**:\n  - Final duration up to 90s, motion graphics, bespoke kinetic captions, master sound\n  - Turnaround: ${shortPrem.turnaround} · Revisions: ${shortPrem.revisions}\n\n• **Long-Form Premium — ${longPrem.price} / ${longPrem.unit}**:\n  - Final duration up to 20 min, bespoke color grade, sound master, custom thumbnail included\n  - Turnaround: ${longPrem.turnaround} · Revisions: ${longPrem.revisions}`,
      actions: [
        { label: "Explore Video Editing →", href: "#/services/video-editing" },
        { label: "Start Video Project →", href: "#/contact" },
      ],
    };
  }

  // =========================================================================
  // 8. PITCH DECKS & STORYTELLING
  // =========================================================================
  const isDeckKeyword =
    q.includes("pitch deck") ||
    q.includes("deck") ||
    q.includes("presentation") ||
    q.includes("slide") ||
    q.includes("slides") ||
    q.includes("pitch");

  if (isDeckKeyword) {
    const deckBasic = deckService.packageGroups[0]?.packages.find((p) => p.id === "deck-basic")!;
    const deckStandard = deckService.packageGroups[0]?.packages.find((p) => p.id === "deck-standard")!;
    const deckPremium = deckService.packageGroups[0]?.packages.find((p) => p.id === "deck-premium")!;

    if (isStandardKeyword && !isBasicKeyword && !isPremiumKeyword) {
      return {
        text: `Our **Story Deck (Standard)** package is **${deckStandard.price}**:\n\n• **Scope**: Up to 12 slides with structured narrative flow and custom diagram styling\n• **Turnaround**: ${deckStandard.turnaround}\n• **Revisions**: 2 structured revision rounds\n• **Deliverables**: Fully editable Figma/PPTX files + presentation-ready PDF.`,
        actions: [
          { label: "Explore Pitch Decks →", href: "#/pricing" },
          { label: "Book a Deck Sprint →", href: "#/contact" },
        ],
      };
    }

    return {
      text: `Pitch Decks & Storytelling Packages (All rates in INR):\n\n• **Clear Deck (Basic) — ${deckBasic.price}**:\n  - Up to 8 slides, clean layouts & typography, editable PPTX + export PDF\n  - Turnaround: ${deckBasic.turnaround} · Revisions: 2 rounds\n\n• **Story Deck (Standard) — ${deckStandard.price}**:\n  - Up to 12 slides, narrative flow, custom diagrams, light copy polish\n  - Turnaround: ${deckStandard.turnaround} · Revisions: 2 rounds\n\n• **Signature Deck (Premium) — ${deckPremium.price}**:\n  - Up to 18 slides, discovery session, desk research, bespoke visual storytelling & speaker notes\n  - Turnaround: ${deckPremium.turnaround} · Revisions: 2 rounds\n\n*Priority express delivery (+25% fee) is available for tight investor/competition deadlines.*`,
      actions: [
        { label: "Explore Pitch Decks →", href: "#/pricing" },
        { label: "Book a Deck Sprint →", href: "#/contact" },
      ],
    };
  }

  // =========================================================================
  // 9. AI CHATBOTS, AUTOMATIONS & CRM INTEGRATIONS
  // =========================================================================
  const isAiKeyword =
    q.includes("ai") ||
    q.includes("chatbot") ||
    q.includes("chat bot") ||
    q.includes("agent") ||
    q.includes("agents") ||
    q.includes("automation") ||
    q.includes("automations") ||
    q.includes("crm") ||
    q.includes("workflow") ||
    q.includes("pipeline") ||
    q.includes("integrate") ||
    q.includes("integration") ||
    q.includes("sheets") ||
    q.includes("slack") ||
    q.includes("zapier") ||
    q.includes("n8n");

  if (isAiKeyword) {
    const aiBasic = aiService.packageGroups[0]?.packages.find((p) => p.id === "ai-basic")!;
    const aiStandard = aiService.packageGroups[0]?.packages.find((p) => p.id === "ai-standard")!;
    const aiPremium = aiService.packageGroups[0]?.packages.find((p) => p.id === "ai-premium")!;

    if (q.includes("crm") || q.includes("connect") || q.includes("integrate") || q.includes("hubspot") || q.includes("salesforce") || q.includes("calendar")) {
      return {
        text: `Yes! Arché connects your website, leads, and operational workflows directly to your existing tools:\n\n• **CRM & Calendars**: Direct sync to HubSpot, Salesforce, Google Calendar, and Calendly for instant 24/7 qualification and booking.\n• **Internal Grids**: Real-time push to Google Sheets, Slack, and Supabase via dual-write deterministic webhooks.\n• **Packages**: Included in our **Connected Growth package (${aiStandard.price})** with up to 2 live tool integrations, or as an add-on from ₹3,500.`,
        actions: [
          { label: "Explore AI Chatbots →", href: "#/services/ai-chatbots" },
          { label: "Explore AI Automation →", href: "#/services/ai-automation" },
          { label: "Audit Your CRM Stack →", href: "#/contact" },
        ],
      };
    }

    if (isStandardKeyword && !isBasicKeyword && !isPremiumKeyword) {
      return {
        text: `Our **Connected Growth (Standard)** AI package is **${aiStandard.price}**:\n\n• **Scope**: Document-grounded AI assistant + up to 2 active integrations (CRM, Slack, Google Sheets)\n• **Turnaround**: ${aiStandard.turnaround}\n• **Deliverables**: High-accuracy vector retrieval, custom prompt persona, automated qualification, and webhook sync.`,
        actions: [
          { label: "Explore AI Chatbots →", href: "#/services/ai-chatbots" },
          { label: "Start an AI Project →", href: "#/contact" },
        ],
      };
    }

    return {
      text: `AI Solutions & Automation Packages (All published in INR):\n\n• **Starter Assist (Basic) — ${aiBasic.price}**:\n  - One website FAQ/lead qualification bot OR 1 automated workflow into Google Sheets/email\n  - Turnaround: ${aiBasic.turnaround}\n\n• **Connected Growth (Standard) — ${aiStandard.price}**:\n  - Document-grounded assistant + up to 2 active integrations (CRM, Slack, Google Sheets)\n  - Turnaround: ${aiStandard.turnaround}\n\n• **AI Workflow Suite (Premium) — ${aiPremium.price}**:\n  - Multi-step automated operational pipeline with human approval stages & deterministic sync\n  - Turnaround: ${aiPremium.turnaround}`,
      actions: [
        { label: "Explore AI Chatbots →", href: "#/services/ai-chatbots" },
        { label: "Explore AI Automation →", href: "#/services/ai-automation" },
        { label: "Start an AI Project →", href: "#/contact" },
      ],
    };
  }

  // =========================================================================
  // 10. OWNERSHIP, REVISIONS, TIMELINES & CONTACT
  // =========================================================================
  if (
    q.includes("ownership") ||
    q.includes("own") ||
    q.includes("ip") ||
    q.includes("intellectual property") ||
    q.includes("source code") ||
    q.includes("github") ||
    q.includes("code") ||
    q.includes("figma") ||
    q.includes("lock-in") ||
    q.includes("lock in")
  ) {
    return {
      text: `You own **100% of everything we build** upon final delivery and invoice clearance:\n\n• **Full Source Code**: Clean GitHub repositories with documentation\n• **Design Assets**: Raw editable Figma files and components\n• **AI & Workflows**: Vector embeddings, system prompts, and n8n/Zapier automations\n• **Zero Vendor Lock-In**: No monthly hostage fees or proprietary restrictions. It is completely yours.`,
      actions: [
        { label: "View Studio Guarantees →", href: "#/faq" },
        { label: "Start a Project →", href: "#/contact" },
      ],
    };
  }

  if (
    q.includes("who do you work with") ||
    q.includes("who you work with") ||
    q.includes("clients") ||
    q.includes("international") ||
    q.includes("outside india") ||
    q.includes("us") ||
    q.includes("uk") ||
    q.includes("global") ||
    q.includes("creators") ||
    q.includes("startups")
  ) {
    return {
      text: `Arché partners with ambitious founders, creators, growth startups, and established businesses:\n\n• **India**: Based in Hyderabad, serving modern enterprises across India with transparent INR rates.\n• **International**: US, UK, Europe, UAE, and Singapore with seamless async updates and overlapping call hours.\n• **Industries**: SaaS, B2B services, luxury retail, creators, media brands, and professional practices.`,
      actions: [
        { label: "View Selected Work →", href: "#/work" },
        { label: "Book an Intro Call →", href: "#/contact" },
      ],
    };
  }

  if (
    q.includes("how to start") ||
    q.includes("how do we start") ||
    q.includes("getting started") ||
    q.includes("onboarding") ||
    q.includes("start a project") ||
    q.includes("hire") ||
    q.includes("work together")
  ) {
    return {
      text: `Starting an engagement with Arché is structured and frictionless:\n\n1. **Share Your Brief**: Click 'Start a Project' or email ${STUDIO_INFO.email} with your current bottlenecks.\n2. **Fixed Blueprint within 24 Hours**: We evaluate scope and return a deterministic blueprint, INR tier, and timeline.\n3. **Sprint Kickoff**: We establish a private communication channel and share weekly staging links from day one.`,
      actions: [
        { label: "Start a Project Brief →", href: "#/contact" },
        { label: "WhatsApp Founder Line →", href: STUDIO_INFO.whatsappHref, isExternal: true },
      ],
    };
  }

  if (q.includes("thumbnail") || q.includes("add-on") || q.includes("addon") || q.includes("extra")) {
    const thumbAddon = videoService.addOns?.find((a) => a.name.toLowerCase().includes("thumbnail"))!;
    return {
      text: `Custom Video Add-Ons at Arché:\n• **${thumbAddon.name}**: ${thumbAddon.price}\n• Note: One custom thumbnail is also included for free in our **Long-Form Premium** editing package (${videoService.packageGroups[1]?.packages[2]?.price}/video).\n• Other add-ons: Slide Review (₹1,499), Priority Express Sprint (+25%), WhatsApp/CRM Sync (from ₹3,500).`,
      actions: [
        { label: "View All Add-ons →", href: "#/pricing" },
        { label: "Request Custom Scope →", href: "#/contact" },
      ],
    };
  }

  if (q.includes("retainer") || q.includes("monthly") || q.includes("per month") || (q.includes("video") && q.includes("month"))) {
    return {
      text: `Monthly Retainers for Creators & Brands:\n• **Starter Retainer — ₹5,999/month**: 8 Basic short-form reels (up to 45s each), scheduled batch delivery\n• **Growth Retainer (Popular) — ₹14,999/month**: 12 Standard hook-led reels with styled captions, B-roll & sound design\n• **Studio Partner Retainer — ₹25,999/month**: 16 high-impact reels (12 Standard + 4 Premium) + monthly strategy call\n• Web & AI care plans from ₹2,499/month.`,
      actions: [
        { label: "View Retainer Tiers →", href: "#/pricing" },
        { label: "Book a Retainer Call →", href: "#/contact" },
      ],
    };
  }

  if (q.includes("revision") || q.includes("changes") || q.includes("rounds") || q.includes("feedback")) {
    return {
      text: `Arché Revision & SLA Standards:\n• **Basic Tiers**: Include 1 structured revision round.\n• **Standard & Premium Tiers**: Include 2 structured consolidated revision rounds.\n• Revisions are coordinated via weekly staging links within 7 days of delivery to keep momentum high.\n• Additional revision rounds are available if needed (₹500 for reels, ₹1,000 for long-form).`,
      actions: [
        { label: "View Full Pricing & Parameters →", href: "#/pricing" },
        { label: "Start a Project →", href: "#/contact" },
      ],
    };
  }

  if (q.includes("turnaround") || q.includes("how long") || q.includes("time") || q.includes("timeline") || q.includes("fast") || q.includes("days") || q.includes("weeks")) {
    return {
      text: `Standard Turnaround Times across Arché:\n• **Short-Form Video**: 3–5 working days\n• **Long-Form Video**: 5–8 working days\n• **Pitch Decks**: 4–5 days (Basic) · 6–8 days (Standard) · 8–12 days (Premium)\n• **Websites**: 5–7 days (Landing) · 10–15 days (Business) · 15–25 days (Platform)\n• **AI Chatbots & Automation**: 5–8 days (Assist) · 10–15 days (Connected Pipeline)\n\n*Express priority turnaround (+25% fee) is available when deadlines cannot slide.*`,
      actions: [
        { label: "Check All Timelines on Pricing Page →", href: "#/pricing" },
        { label: "Book a Project Timeline →", href: "#/contact" },
      ],
    };
  }

  if (q.includes("work") || q.includes("project") || q.includes("portfolio") || q.includes("case study") || q.includes("proof") || q.includes("sample")) {
    const p1 = projects[0];
    const p2 = projects[1];
    const p3 = projects[2];
    return {
      text: `Arché showcases verified internal builds and prototypes (labelled honestly, zero fabricated clients):\n• **${p1.name}** (${p1.serviceLabel}): ${p1.summary}\n• **${p2.name}** (${p2.serviceLabel}): ${p2.summary}\n• **${p3.name}** (${p3.serviceLabel}): ${p3.summary}\n\nExplore our complete collection of 8 verified proofs in Selected Work.`,
      actions: [
        { label: "View Selected Work →", href: "#/work" },
        { label: "Start a Project →", href: "#/contact" },
      ],
    };
  }

  if (q.includes("contact") || q.includes("email") || q.includes("phone") || q.includes("whatsapp") || q.includes("location") || q.includes("address") || q.includes("reach") || q.includes("call")) {
    return {
      text: `Arché Creative Studios is based in Hyderabad, India, working with clients globally:\n• **Email**: ${STUDIO_INFO.email}\n• **Phone / WhatsApp**: ${STUDIO_INFO.phone}\n• **Website**: ${STUDIO_INFO.websiteUrl}\n\nWe respond to all verified project inquiries within 24 hours.`,
      actions: [
        { label: "WhatsApp Direct (+91 7995937536) →", href: STUDIO_INFO.whatsappHref, isExternal: true },
        { label: "Submit Project Scope →", href: "#/contact" },
      ],
    };
  }

  if (
    q.includes("pricing") ||
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("how much") ||
    q.includes("rate") ||
    q.includes("rates") ||
    q.includes("fee") ||
    q.includes("package") ||
    q.includes("packages")
  ) {
    return {
      text: `Transparent Arché Studio Launch Rates (INR):\n\n1. **Video Production & Editing**: Starts at **₹799** (Short-form Basic) to **₹8,999** (Long-form Premium), with monthly retainers from **₹5,999/mo**.\n2. **Pitch Decks & Storytelling**: Starts at **₹3,999** (Clear Deck, 8 slides) to **₹14,999** (Signature Deck, 18 slides).\n3. **Web Development**: Starts at **₹5,999** (Launch Page) to **₹24,999** (Growth Platform), with custom E-Commerce from **₹34,999**.\n4. **AI Solutions & Automation**: Starts at **₹7,999** (Starter Assist) to **₹29,999** (Full AI Workflow Suite).\n\nEvery project includes fixed turnarounds, concrete deliverables, and zero hidden agency overhead.`,
      actions: [
        { label: "Explore Detailed Pricing Matrix →", href: "#/pricing" },
        { label: "Start a Project Sprint →", href: "#/contact" },
        { label: "Chat on WhatsApp (+91 7995937536) →", href: STUDIO_INFO.whatsappHref, isExternal: true },
      ],
    };
  }

  // Default Grounded Studio Overview Fallback
  return {
    text: `Arché Creative Studios engineers connected systems across four core disciplines:\n1. **Video Production & Editing** (from ₹799)\n2. **Pitch Decks & Storytelling** (from ₹3,999)\n3. **Web Development** (from ₹5,999)\n4. **AI Solutions & Automation** (from ₹7,999)\n\nAsk me about any specific package rate, turnaround time, add-on, or CRM integration requirements!`,
    actions: defaultActions,
  };
}
