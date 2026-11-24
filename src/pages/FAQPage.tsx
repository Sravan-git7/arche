import { useEffect, useRef, useState, useMemo } from "react";
import { usePage } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";
import { attachCardTilt } from "../motion/cardTilt";
import { ArcheConcierge } from "../components/ArcheConcierge";
import { STUDIO_INFO } from "../data/services";
import { gsap, prefersReducedMotion } from "../lib/gsap";

export type FAQCategory =
  | "All"
  | "Pricing & Scope"
  | "Process & Timelines"
  | "AI & Integrations"
  | "Ownership & Support";

export interface FAQItem {
  n: string;
  category: FAQCategory;
  q: string;
  a: string;
}

export const FULL_FAQ_DATA: FAQItem[] = [
  {
    n: "01",
    category: "AI & Integrations",
    q: "What makes Arché different from hiring separate agencies?",
    a: "Traditional agencies sell isolated deliverables—a video editor who doesn't understand your web stack, a web shop that doesn't touch automation, and an AI consultant who doesn't understand brand tone. Arché designs cinema film, interactive web flagships, autonomous AI agents, and operational automation as one connected system. Data flows with zero friction, attribution is 100% deterministic, and you deal with a single multidisciplinary team.",
  },
  {
    n: "02",
    category: "Pricing & Scope",
    q: "Can we start with just one vertical (e.g., Video or Web) before expanding?",
    a: "Yes, absolutely. Many clients start with a single vertical—such as a Short-Form Video plan (from ₹799/video) or a Standard Website (₹12,999)—and expand into connected AI agents, pitch decks, and operational workflows as momentum compounds. Every vertical is engineered with modular architecture so future integrations connect seamlessly.",
  },
  {
    n: "03",
    category: "Pricing & Scope",
    q: "How does INR pricing work, and are there hidden fees?",
    a: "All rates are published upfront with complete transparency at our Pricing page. Video editing starts at ₹799/video (short-form) and ₹2,499/video (long-form). Pitch decks start at ₹3,999. Web development starts at ₹5,999, and AI solutions start at ₹7,999. What you see is what you pay. There are zero surprise agency markups, and priority sprint delivery is available at +25%.",
  },
  {
    n: "04",
    category: "Process & Timelines",
    q: "What are typical turnaround times and how do revision rounds work?",
    a: "Short-form videos deliver in 48–72 hours; pitch decks in 4–5 working days; standard websites in 10–15 days; and AI automations in 5–10 days. Every package includes 2 structured revision rounds within 7 business days of delivery. Because we build from clear blueprints and weekly staging links, revisions are fast and focused.",
  },
  {
    n: "05",
    category: "AI & Integrations",
    q: "Can your AI agents connect to our existing CRM, Calendar, Sheets, and WhatsApp?",
    a: "Yes. We integrate directly with HubSpot, Salesforce, Supabase, Google Calendar, Google Sheets, WhatsApp Business API, Slack, and Stripe via dual-write sync grids and multi-tool function calling. Leads captured by our AI agents qualify automatically and sync into your CRM in real time with zero data drift.",
  },
  {
    n: "06",
    category: "Ownership & Support",
    q: "Who owns the final code, raw design files, prompts, and workflows?",
    a: "You do—100%. Upon final project delivery and invoice clearance, full intellectual property and source code ownership transfers completely to you. This includes raw Figma files, clean GitHub repositories, system prompts, vector embeddings, and workflow automations. Zero vendor lock-in, ever.",
  },
  {
    n: "07",
    category: "Process & Timelines",
    q: "Do you work with clients outside India / internationally?",
    a: "Yes. Arché is based in Hyderabad, India, but partners with ambitious founders, creators, and brands globally across the US, UK, Europe, UAE, and Singapore. We operate with seamless asynchronous updates, weekly staging demos, and flexible time-zone overlapping calls.",
  },
  {
    n: "08",
    category: "Ownership & Support",
    q: "What happens after launch—do you offer ongoing retainers or maintenance?",
    a: "Yes. We offer continuous monthly optimization retainers across all verticals: Short-Form Video Retainers from ₹5,999/month (8 reels), Web Maintenance & Care from ₹2,499/month, and AI Optimization retainers. Every engagement also includes complete documentation and 14 days of complimentary post-launch support.",
  },
];

export const STUDIO_GUARANTEES = [
  {
    n: "01",
    title: "100% IP & Source Ownership",
    desc: "All source code, Figma designs, prompts, and automations transfer directly to you upon delivery.",
  },
  {
    n: "02",
    title: "Transparent INR Scopes",
    desc: "Fixed, published rates with itemized deliverables. Zero hidden agency markups or surprises.",
  },
  {
    n: "03",
    title: "Structured Revision Rounds",
    desc: "Guaranteed two rigorous revision cycles with weekly staging links and deterministic SLAs.",
  },
  {
    n: "04",
    title: "Direct Builder Access",
    desc: "Collaborate directly with senior engineers and directors. Zero middle-management bloat.",
  },
];

const CATEGORIES: FAQCategory[] = [
  "All",
  "Pricing & Scope",
  "Process & Timelines",
  "AI & Integrations",
  "Ownership & Support",
];

function AccordionRow({
  item,
  open,
  onToggle,
}: {
  item: FAQItem;
  open: boolean;
  onToggle: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return attachCardTilt(rowRef.current);
  }, []);

  return (
    <div
      ref={rowRef}
      data-cursor="hover"
      data-active={open ? "true" : undefined}
      className={`faq-card frosted-ivory-card arche-glow-card shiny-border rounded-2xl transition-all duration-300 ${
        open
          ? "shadow-[0_18px_44px_rgba(20,20,19,0.12)] -translate-y-0.5 bg-[#F4F1E0]"
          : "hover:shadow-[0_8px_24px_rgba(20,20,19,0.05)] bg-[#F4F1E0]/90"
      }`}
      style={{
        borderLeft: open ? "3px solid #72B314" : "3px solid transparent",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-answer-${item.n}`}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#9EE41A]"
      >
        <div className="flex items-center gap-3 sm:gap-5 flex-1">
          <span className="font-mono text-sm font-bold text-[#2E322B] w-7 flex-shrink-0">
            {item.n}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5B8F0E] font-bold">
              {item.category}
            </span>
            <h3
              className={`text-lg sm:text-xl font-bold tracking-tight transition-colors duration-200 ${
                open ? "text-[#0B0C0A]" : "text-[#0B0C0A]/95 hover:text-[#0B0C0A]"
              }`}
            >
              {item.q}
            </h3>
          </div>
        </div>

        {/* Rotating + icon */}
        <span
          className={`action-circle flex-shrink-0 ${
            open
              ? "!bg-[#141413] !text-[#9EE41A] !border-[#141413] shadow-[0_0_12px_rgba(20,20,19,0.25)]"
              : ""
          }`}
        >
          <span
            className={`action-circle-icon text-base font-bold leading-none transition-transform duration-200 ${
              open ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        </span>
      </button>

      {open && (
        <div
          id={`faq-answer-${item.n}`}
          className="px-5 pb-5 pt-1 sm:px-6 sm:pb-6 pl-14 sm:pl-16 border-t border-[#141413]/[0.08]"
        >
          <p className="text-[15.5px] sm:text-[16px] text-[#1C1E1A] leading-[1.6] font-medium max-w-[66ch]">
            {item.a}
          </p>
          {item.q.includes("pricing") && (
            <div className="mt-3.5">
              <a
                href="#/pricing"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#0B0C0A] hover:text-[#72B314] transition-colors"
              >
                <span>Explore Full Pricing Architecture</span>
                <span>→</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FAQPage() {
  usePage("Agency Knowledge & AI Concierge Hub | ARCHE Creative Studios");
  useReveal();
  useParallax();

  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  // Filtered FAQ Items
  const filteredItems = useMemo(() => {
    return FULL_FAQ_DATA.filter((item) => {
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  const guaranteesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guaranteesRef.current || prefersReducedMotion()) return;
    const cards = guaranteesRef.current.querySelectorAll(".guarantee-card");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { y: 36, rotateX: 8, opacity: 0 },
        {
          y: 0,
          rotateX: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: guaranteesRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, guaranteesRef);

    return () => ctx.revert();
  }, []);

  // Generate valid FAQPage JSON-LD schema for SEO
  const faqSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FULL_FAQ_DATA.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Inject FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section
        id="faq-hub"
        className="relative w-full bg-transparent text-[#F4F1E0] select-none pt-32 md:pt-36 pb-20 px-4 sm:px-6 md:px-12"
      >
        <div className="relative z-10 w-full max-w-[1240px] mx-auto flex flex-col gap-14 md:gap-18">
          {/* =========================================================
              HEADER & EYEBROW BLOCK
              ========================================================= */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="mb-4">
                <div className="glass-eyebrow-pill">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
                    ARCHÉ CREATIVE STUDIOS · KNOWLEDGE &amp; AI CONCIERGE
                  </span>
                </div>
              </div>

              <h1
                className="text-[clamp(2.5rem,4.5vw,4.25rem)] font-display font-bold tracking-[-0.038em] leading-[0.98] text-[#F4F1E0]"
                style={{
                  fontFamily: "'Inter Tight', sans-serif",
                  fontVariationSettings: "'wght' 700",
                  fontWeight: 700,
                  color: "#F4F1E0",
                  textShadow: "none",
                }}
              >
                <span className="block text-[#F4F1E0]">
                  <span className="shiny-ink-text">Clear answers.</span>
                </span>
                <span className="block mt-1 text-[#92998D]">
                  <span className="headline-secondary-shine">Zero ambiguity.</span>
                </span>
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#C9CEC3] max-w-[44ch] leading-relaxed">
              Search our complete agency knowledge base or interact directly with our AI Concierge grounded in live INR rates, scopes, and turnaround SLAs.
            </p>
          </div>

          {/* =========================================================
              VERTICAL STACK:
              1. Full-Width ArcheConcierge AI Engine on Top (max-w-[1160px] mx-auto w-full)
              2. Search + Categories + Accordions below (max-w-[980px] mx-auto w-full)
              ========================================================= */}
          <div className="w-full max-w-[1160px] mx-auto flex flex-col gap-16">
            {/* TOP BLOCK: Full-Width Flagship ArcheConcierge AI Assistant */}
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-[6px] w-[6px] rounded-full bg-[#72B314] animate-pulse" />
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#F4F1E0]">
                    Arché Studio Concierge · Grounded AI Engine
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#92998D]">
                  Real-Time Rates &amp; Scopes
                </span>
              </div>

              {/* Embedded Flagship Concierge Component (full container width) */}
              <ArcheConcierge />
            </div>

            {/* BOTTOM BLOCK: Search + Category Pills + Categorized Accordions */}
            <div className="w-full max-w-[980px] mx-auto flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#72B314] shadow-[0_0_8px_#72B314] flex-shrink-0" />
                  <h2 className="text-3xl md:text-4xl font-bold text-[#F4F1E0] tracking-tight">
                    Frequently Asked Questions
                  </h2>
                </div>
                <p className="text-base text-[#D4D9CD] leading-relaxed max-w-[62ch]">
                  Filter by category or search verified answers covering contracts, delivery SLAs, and system integrations.
                </p>
              </div>

              {/* Search Input Bar */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#2E322B] pointer-events-none">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pricing, timelines, AI, revisions, CRM, ownership..."
                  className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#F4F1E0] text-[#0B0C0A] placeholder-[#2E322B]/75 text-base sm:text-[15px] font-medium border border-[#141413]/15 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#72B314]/50 focus:border-[#72B314] transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 p-1 text-[#2E322B] hover:text-[#0B0C0A] cursor-pointer"
                    title="Clear search"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Category Filter Pills (flex-wrap for zero horizontal scrollbars) */}
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-[0.97] ${
                      selectedCategory === cat
                        ? "bg-[#0B0C0A] text-[#FBFBF6] shadow-sm border border-[#0B0C0A]"
                        : "bg-[#F4F1E0] text-[#1C1E1A] hover:bg-white hover:text-[#0B0C0A] border border-[#141413]/12"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Accordion Count & State Indicator */}
              <div className="flex items-center justify-between px-1 text-[13px] font-mono text-[#2E322B] font-semibold">
                <span>
                  Showing {filteredItems.length} of {FULL_FAQ_DATA.length} answers
                </span>
                {selectedCategory !== "All" && (
                  <span className="text-[#72B314] font-bold">Category: {selectedCategory}</span>
                )}
              </div>

              {/* Accordion List */}
              <div className="flex flex-col gap-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => (
                    <AccordionRow
                      key={item.n}
                      item={item}
                      open={openIdx === idx}
                      onToggle={() => toggle(idx)}
                    />
                  ))
                ) : (
                  <div className="p-8 rounded-2xl bg-[#F4F1E0] border border-[#141413]/15 text-center">
                    <p className="font-sans text-[15.5px] font-medium text-[#1C1E1A]">
                      No answers matching "{searchQuery}". Try asking our AI Assistant above!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                      }}
                      className="mt-3 text-xs font-mono font-bold text-[#72B314] hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================
              4-PILLAR COMMERCIAL GUARANTEES STRIP
              ========================================================= */}
          <div
            ref={guaranteesRef}
            className="flex flex-col gap-5 pt-6 border-t border-white/10"
            style={{ perspective: "1000px" }}
          >
            <div className="mb-2">
              <div className="glass-eyebrow-pill">
                <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
                  The Studio Standard · 04 Commercial Guarantees
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {STUDIO_GUARANTEES.map((g) => (
                <div
                  key={g.n}
                  className="guarantee-card frosted-ivory-card arche-glow-card shiny-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200"
                  style={{
                    background: "#F4F1E0",
                    border: "1px solid rgba(20, 20, 19, 0.12)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255, 253, 244, 0.92), 0 4px 16px -4px rgba(20, 20, 19, 0.04)",
                  }}
                >
                  <div>
                    <span className="font-mono text-[13px] font-bold text-[#2E322B]">
                      {g.n} ·
                    </span>
                    <h4 className="text-[18px] sm:text-[19px] font-bold text-[#0B0C0A] tracking-tight mt-1.5 mb-2 leading-snug">
                      {g.title}
                    </h4>
                    <p className="text-[15px] font-medium text-[#1C1E1A] leading-relaxed">
                      {g.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================
              DIRECT HUMAN ESCALATION BAR
              ========================================================= */}
          <div
            className="frosted-ivory-card arche-glow-card shiny-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{
              background: "#F4F1E0",
              border: "1px solid rgba(20, 20, 19, 0.12)",
              boxShadow:
                "inset 0 1px 0 rgba(255, 253, 244, 0.92), 0 10px 28px -10px rgba(20, 20, 19, 0.08)",
            }}
          >
            <div className="flex flex-col gap-1.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#72B314] animate-pulse" />
                <h3 className="text-[20px] md:text-[22px] font-bold text-[#0B0C0A] tracking-tight">
                  Still have a specific question?
                </h3>
              </div>
              <p className="text-[15px] font-medium text-[#1C1E1A] max-w-[48ch] leading-relaxed">
                Talk directly with the senior engineers and creative directors building your system.
              </p>
              <span className="font-mono text-[13.5px] font-semibold text-[#2E322B] mt-0.5">
                Replies within 1 working day · Zero sales pressure
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141413] text-[#FBFBF6] font-mono text-xs font-semibold uppercase tracking-wider hover:bg-[#232620] hover:text-[#9EE41A] active:scale-[0.97] transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span>Start a Project</span>
                <span>→</span>
              </a>

              <a
                href={STUDIO_INFO.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#141413] border border-[#141413]/15 font-mono text-xs font-semibold tracking-wide hover:border-[#72B314] hover:text-[#72B314] active:scale-[0.97] transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-[#25D366]" />
                <span>WhatsApp Team</span>
              </a>

              <a
                href={`mailto:${STUDIO_INFO.email}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/70 text-[#141413] border border-[#141413]/15 hover:border-[#141413]/40 hover:bg-white font-mono text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-[0.97] cursor-pointer"
              >
                <span>Email Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
