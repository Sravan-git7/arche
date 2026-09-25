/**
 * Arche content model. Everything the UI renders is data-driven so
 * services, projects and copy can evolve without rebuilding components.
 * Current commercial offering is deliberately limited to four services;
 * Other capabilities may expand later — never presented as current offerings.
 */

export type ServicePackage = {
  name: string;
  price: string;
  unit: string;
  includes: string[];
  deposit?: string;
};

export type Service = {
  slug: string;
  n: string;
  title: string;
  short: string;
  tagline: string;
  arc: [string, string, string]; // the transformation arc
  desc: string;
  problems: string[];
  offerings: { k: string; v: string }[];
  process: { k: string; v: string }[];
  deliverables: string[];
  turnaround: string;
  packages: ServicePackage[];
  seo: { title: string; desc: string };
};

export const services: Service[] = [
  {
    slug: "video-editing",
    n: "01",
    title: "Video Editing",
    short: "Video",
    tagline: "Raw material, cut into content that holds attention.",
    arc: ["RAW", "DECISIONS", "CONTENT"],
    desc: "We take unstructured footage and make deliberate editorial decisions — what stays, what goes, and in what order — until the material becomes content built to perform.",
    problems: [
      "Hours of footage, no publishing rhythm",
      "Content that loses viewers in the first seconds",
      "Inconsistent pacing, grading and sound across posts",
      "Long-form assets never repurposed into short-form",
    ],
    offerings: [
      { k: "Short-form", v: "Reels, Shorts and TikTok edits cut for retention." },
      { k: "Long-form", v: "YouTube videos, podcasts and talks with narrative structure." },
      { k: "Repurposing", v: "One recording turned into a month of publishable assets." },
      { k: "Motion & finishing", v: "Titles, captions, grading and sound polish." },
    ],
    process: [
      { k: "Ingest", v: "We review every frame of the raw material." },
      { k: "Select", v: "Usable footage is kept. The rest is deliberately rejected." },
      { k: "Assemble", v: "The sequence is built and tightened on the timeline." },
      { k: "Finish", v: "Grade, captions, sound and delivery formats." },
    ],
    deliverables: [
      "Edited masters in every aspect ratio you publish",
      "Captioned versions and thumbnails on request",
      "Project files and organized source archive",
      "Revision rounds defined up front",
    ],
    turnaround: "Typical turnaround: 2–5 working days per edit, defined per engagement.",
    packages: [
      {
        name: "Short-form pack",
        price: "Custom quote",
        unit: "scope-based",
        includes: ["8 short-form edits", "Captions + grading", "2 revision rounds each", "48h average turnaround"],
      },
      {
        name: "Long-form",
        price: "Custom quote",
        unit: "scope-based",
        includes: ["Up to 15 min final cut", "Narrative structure pass", "Grade + sound polish", "1 short-form cutdown"],
      },
    ],
    seo: {
      title: "Video Editing — Arche",
      desc: "Editorial video editing for short-form and long-form content: selection, structure, grading and finishing, built to hold attention.",
    },
  },
  {
    slug: "web-development",
    n: "02",
    title: "Web Development",
    short: "Web",
    tagline: "Fragments, assembled into an experience that converts.",
    arc: ["FRAGMENTS", "EXPERIENCE", "LEAD"],
    desc: "We design and build websites as operating systems for the business — structure first, then interface, then the interactions that move a visitor from arrival to action.",
    problems: [
      "A website that looks fine but produces nothing",
      "No clear hierarchy — visitors don't know where to go",
      "Slow, heavy pages that lose traffic before they load",
      "A brand that reads as a template, not a company",
    ],
    offerings: [
      { k: "Marketing sites", v: "Editorial, fast, built around one conversion path." },
      { k: "Landing pages", v: "Single-purpose pages engineered for a campaign." },
      { k: "Web experiences", v: "Interactive, motion-driven presentations of a product." },
      { k: "Rebuilds", v: "Existing sites redesigned and rebuilt for speed and clarity." },
    ],
    process: [
      { k: "Structure", v: "Information structure before any visual design." },
      { k: "Design", v: "Typography, layout and motion designed as one system." },
      { k: "Build", v: "Hand-built front-end — no page-builder bloat." },
      { k: "Ship", v: "Performance pass, analytics, launch and handover." },
    ],
    deliverables: [
      "Production site, deployed and handed over",
      "Design source files and component documentation",
      "Performance budget met and verified",
      "Post-launch support window",
    ],
    turnaround: "Landing pages from 2 weeks. Full sites typically 4–8 weeks.",
    packages: [
      {
        name: "Landing page",
        price: "Custom quote",
        unit: "scope-based",
        includes: ["One conversion-focused page", "Custom design + motion", "Copy structure support", "2-week delivery"],
      },
    ],
    seo: {
      title: "Web Development — Arche",
      desc: "Custom-built marketing sites, landing pages and web experiences — structure, interface and motion engineered for conversion.",
    },
  },
  {
    slug: "ai-chatbots",
    n: "03",
    title: "AI Chatbots",
    short: "Chatbots",
    tagline: "Conversations that actually get somewhere.",
    arc: ["QUESTION", "REASONING", "ACTION"],
    desc: "We build conversational systems that understand a request, reason over your real knowledge, and resolve it — answering, qualifying, booking or escalating with context attached.",
    problems: [
      "Support queues full of repeated questions",
      "Leads arriving at 2am and going cold by morning",
      "Knowledge spread across docs nobody can search",
      "A widget that frustrates more than it helps",
    ],
    offerings: [
      { k: "Support agents", v: "Grounded in your docs, escalating with full context." },
      { k: "Lead qualification", v: "Conversations that capture, score and route inquiries." },
      { k: "Knowledge assistants", v: "Internal Q&A over your company's real information." },
      { k: "Action-taking bots", v: "Booking, lookups and updates through your tools." },
    ],
    process: [
      { k: "Ground", v: "Your knowledge is structured into a reliable source." },
      { k: "Design", v: "Conversation flows, tone and guardrails are defined." },
      { k: "Build", v: "The agent is implemented and connected to your stack." },
      { k: "Tune", v: "Real conversations reviewed, behaviour refined." },
    ],
    deliverables: [
      "Deployed conversational agent",
      "Grounded knowledge base with update path",
      "Guardrails and escalation rules",
      "Conversation review and tuning cycle",
    ],
    turnaround: "First working agent typically in 2–3 weeks.",
    packages: [
      {
        name: "Support agent",
        price: "Custom quote",
        unit: "scope-based",
        includes: ["Grounded on your content", "Website embed", "Escalation to human inbox", "30-day tuning window"],
      },
    ],
    seo: {
      title: "AI Chatbots — Arche",
      desc: "AI chat agents for support, lead qualification and internal knowledge — grounded in your real content, built to resolve, not deflect.",
    },
  },
  {
    slug: "ai-automation",
    n: "04",
    title: "AI Automation",
    short: "Automation",
    tagline: "Manual repetition, replaced by autonomous workflow.",
    arc: ["TRIGGER", "DECIDE", "RESULT"],
    desc: "We find the work your team repeats every week, then build the automated workflow that does it instead — connected to the tools you already run, with AI applied where judgement is needed.",
    problems: [
      "Hours lost to copy-paste between tools",
      "Leads that wait days for a first response",
      "Reports assembled by hand every week",
      "Processes that live in one person's head",
    ],
    offerings: [
      { k: "Workflow automation", v: "Multi-step processes that run without supervision." },
      { k: "Tool integration", v: "CRMs, sheets, inboxes and APIs connected into one flow." },
      { k: "AI decision steps", v: "Classification, extraction and routing inside the flow." },
      { k: "Internal tools", v: "Small interfaces where a human stays in the loop." },
    ],
    process: [
      { k: "Map", v: "We document the manual process exactly as it runs today." },
      { k: "Design", v: "The automated path is designed end-to-end, with fallbacks." },
      { k: "Build", v: "The workflow is implemented and tested against real cases." },
      { k: "Run", v: "Monitored rollout, then handover with documentation." },
    ],
    deliverables: [
      "Documented automation blueprint",
      "Implemented, tested workflows",
      "Error handling and human-fallback paths",
      "Monitoring and a support window",
    ],
    turnaround: "First workflow typically live in 2–4 weeks.",
    packages: [
      {
        name: "Automation audit",
        price: "Custom quote",
        unit: "scope-based",
        includes: ["Process mapping session", "Automation opportunity report", "Priority roadmap", "Fixed quote for build phase"],
      },
    ],
    seo: {
      title: "AI Automation — Arche",
      desc: "AI-powered workflow automation: manual, repetitive processes mapped and rebuilt as autonomous workflows connected to your existing tools.",
    },
  },
];

export const siteContent = {
  brand: {
    name: "Arche",
    line: "We don't sell services. We build systems.",
    discipline: "Video · Web · AI Chat · Automation",
  },

  nav: {
    links: [
      { label: "Work", to: "/work" },
      { label: "Services", to: "/services" },
      { label: "Contact", to: "/contact" },
    ],
    cta: { label: "Start a Project", to: "/contact" },
  },

  hero: {
    kicker: "AI + Digital Systems Studio",
    statement: "Systems that make businesses work better.",
    sub: "Arche is a digital systems studio. Today we build four things — video, websites, AI chat agents and automation — each one a way in. Over time they can connect.",
    ctaPrimary: { label: "Start a Project", to: "/contact" },
    ctaSecondary: { label: "View work", to: "/work" },
  },

  whatWeDo: {
    label: "The problem",
    lineA: "Most businesses don't have a tool problem.",
    lineB: "They have a connection problem.",
    body: "Content, website, leads, conversations and operations live in different places. Arche starts where the friction is — then connects what already exists and builds what's missing.",
  },

  servicesIntro: {
    label: "Services",
    statement: "Every business starts somewhere.",
    body: "Four entry points. Each one is built properly on its own. Together they can become the system that runs the business.",
  },

  process: {
    label: "How we work",
    statement: "From first conversation to a system that keeps improving.",
    steps: [
      { n: "01", k: "Discover", v: "Understand the business and where work is lost." },
      { n: "02", k: "Design", v: "Map the system before anything is built." },
      { n: "03", k: "Build", v: "Production-grade implementation, no shortcuts." },
      { n: "04", k: "Connect", v: "Join the new piece to the tools you already run — so nothing is orphaned." },
      { n: "05", k: "Launch", v: "Ship, measure, verify against real usage." },
      { n: "06", k: "Evolve", v: "Improve continuously as the business changes." },
    ],
  },

  faq: {
    label: "FAQ",
    statement: "Working with Arche.",
    items: [
      {
        q: "What does Arche do?",
        a: "We build digital systems. Today that means four things: video editing, websites, AI chat agents and automation. You can hire us for one. Over time they can connect.",
      },
      {
        q: "Which services are currently available?",
        a: "Exactly four: video editing, web development, AI chatbots and AI automation. That's the current offering — focused so each one ships to a high standard.",
      },
      {
        q: "Can I hire Arche for only one service?",
        a: "Yes. Most engagements start with a single service. You don't need everything at once — start where the friction is.",
      },
      {
        q: "Who do you work with?",
        a: "Small and growing teams who feel the cost of disconnected tools. We're a studio, not a consultancy with a hundred people — which is why the work stays close to the people who design it.",
      },
      {
        q: "Can you work with our existing tools?",
        a: "That's the point of Connect. We extend the CRMs, inboxes, sheets and APIs you already run rather than replacing them.",
      },
      {
        q: "How is pricing determined?",
        a: "Some work has a defined package. Custom work is quoted after a short conversation — scope, timeline and investment in writing before anything starts.",
      },
      {
        q: "How long does a project take?",
        a: "Edits ship in days. Landing pages in about two weeks. Sites, automations and agents typically two to eight weeks depending on scope. Every quote includes a timeline.",
      },
      {
        q: "What happens after I submit an inquiry?",
        a: "You'll get a reply within one working day. For packages we confirm scope and schedule. For custom work we book a short call, then send a written proposal.",
      },
      {
        q: "Do you provide support after launch?",
        a: "Yes. Every build includes a support window. Most clients continue with a light maintenance or iteration arrangement afterwards — that's the Evolve step.",
      },
    ],
  },

  contact: {
    label: "Start a project",
    closing: "Let's build what runs your business.",
    desc: "Tell us where the friction is. You'll hear back within one working day.",
    email: "hello@arche.studio",
    budgets: ["< $500", "$500 – $2k", "$2k – $10k", "$10k +", "Not sure yet"],
    timelines: ["As soon as possible", "Within a month", "This quarter", "Exploring"],
    channels: ["Email", "WhatsApp", "Video call"],
  },

  footer: {
    cols: [
      { t: "Studio", l: [{ label: "Work", to: "/work" }, { label: "Services", to: "/services" }, { label: "Contact", to: "/contact" }] },
      {
        t: "Services",
        l: [
          { label: "Video Editing", to: "/services/video-editing" },
          { label: "Web Development", to: "/services/web-development" },
          { label: "AI Chatbots", to: "/services/ai-chatbots" },
          { label: "AI Automation", to: "/services/ai-automation" },
        ],
      },
    ],
    social: [],
    legal: "© 2026 Arche. All rights reserved.",
    note: "Video · Web · AI Chat · Automation",
  },
};
