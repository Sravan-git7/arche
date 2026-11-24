import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { oneRailStore } from "../lib/oneRailState";
import { attachCardTilt } from "../motion/cardTilt";

export interface FAQItem {
  n: string;
  q: string;
  a: string;
}

export const HOMEPAGE_FAQS: FAQItem[] = [
  {
    n: "01",
    q: "What makes Arché's system approach different from hiring 4 separate agencies?",
    a: "Traditional agencies sell isolated deliverables—a video editor who doesn't understand your web stack, a web shop that doesn't touch automation, and an AI consultant who doesn't understand brand tone. Arché designs film, web flagships, autonomous agents, and CRM sync grids as one connected system. Data flows with zero friction, attribution is 100% deterministic, and you deal with a single elite multidisciplinary team.",
  },
  {
    n: "02",
    q: "Which services are currently available, and can we start with just one vertical?",
    a: "We provide four core capabilities: Video Editing, Bespoke Web Development, Autonomous AI Chatbots, and Operational AI Automation. Many clients start with a single vertical—such as a flagship website or an automated lead pipeline—and expand into a connected system as momentum compounds.",
  },
  {
    n: "03",
    q: "How fast is project turnaround from brief to deployment?",
    a: "Short-form video assets and master cuts deliver within 3–5 working days. Bespoke web flagships and AI agents typically deploy in 1–3 weeks. Operational automation pipelines run within 1–2 weeks. Because our architecture is blueprint-first, we eliminate endless revision cycles.",
  },
  {
    n: "04",
    q: "How does Arché integrate with our existing CRMs and tools?",
    a: "We work directly with your existing technology stack—including HubSpot, Salesforce, Supabase, Google Sheets, Slack, Stripe, and custom APIs. Our sync grids dual-write in real time with verified zero data drift.",
  },
  {
    n: "05",
    q: "What happens after launch? Do you provide maintenance and care plans?",
    a: "Every project includes full documentation, telemetry onboarding, and post-launch coverage. We offer continuous monthly optimization retainers covering server uptime, model prompt tuning, pipeline monitoring, and ongoing creative updates.",
  },
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
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    return attachCardTilt(rowRef.current);
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!panel || !inner) return;

    if (firstRender.current) {
      firstRender.current = false;
      gsap.set(panel, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(panel, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
      return;
    }

    gsap.killTweensOf(panel);
    if (open) {
      gsap.fromTo(
        panel,
        { height: 0, opacity: 0 },
        {
          height: inner.offsetHeight,
          opacity: 1,
          duration: 0.42,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(panel, { height: "auto" });
          },
        }
      );
    } else {
      gsap.to(panel, {
        height: 0,
        opacity: 0,
        duration: 0.32,
        ease: "power3.inOut",
      });
    }
  }, [open]);

  return (
    <div
      ref={rowRef}
      data-cursor="hover"
      data-active={open ? "true" : undefined}
      className={`faq-card frosted-ivory-card arche-glow-card shiny-border rounded-2xl transition-all duration-300 ${
        open
          ? "shadow-[0_18px_44px_rgba(20,20,19,0.12)] -translate-y-0.5 bg-[#F4F1E0]"
          : "hover:shadow-[0_8px_24px_rgba(20,20,19,0.05)] bg-[#F4F1E0]"
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
        className="w-full flex items-center justify-between p-6 sm:p-7 text-left gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#9EE41A]"
      >
        <div className="flex items-center gap-4 sm:gap-6 flex-1">
          <span className="font-mono text-xs font-semibold text-[#868A82] w-6 flex-shrink-0">
            {item.n}
          </span>
          <h3
            className={`text-base sm:text-lg lg:text-xl font-semibold tracking-tight transition-colors duration-200 ${
              open ? "text-[#141413]" : "text-[#141413]/85 hover:text-[#141413]"
            }`}
          >
            {item.q}
          </h3>
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

      <div
        id={`faq-answer-${item.n}`}
        ref={panelRef}
        aria-hidden={!open}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <div ref={innerRef} className="px-6 pb-6 pt-1 sm:px-7 sm:pb-7 pl-14 sm:pl-20">
          <p className="text-sm sm:text-base text-[#595C56] leading-relaxed max-w-[64ch]">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

const PRE_CTA_WORDS =
  "You've got a business to run, a brand to grow, and systems that should run themselves.".split(
    " "
  );

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const rootRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const preCtaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const heading = headingRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root,
        start: "top 60%",
        end: "bottom 30%",
        onEnter: () => {
          oneRailStore.setChapter(6, "FAQ", 0, "07 · FAQ");
        },
        onEnterBack: () => {
          oneRailStore.setChapter(6, "FAQ", 1, "07 · FAQ");
        },
      });

      if (heading && !prefersReducedMotion()) {
        const lines = heading.querySelectorAll(".editorial-line");
        gsap.fromTo(
          lines,
          { y: "105%", opacity: 0 },
          {
            y: "0%",
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: heading,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Pre-CTA editorial statement scrubbed word-by-word (#B4B9AE -> #0E100C via scrub: 0.5)
      if (preCtaRef.current && !prefersReducedMotion()) {
        const words = preCtaRef.current.querySelectorAll(".pre-cta-word");
        gsap.fromTo(
          words,
          { color: "#B4B9AE" },
          {
            color: "#0E100C",
            duration: 1,
            stagger: 0.04,
            ease: "none",
            scrollTrigger: {
              trigger: preCtaRef.current,
              start: "top 80%",
              end: "bottom 50%",
              scrub: 0.5,
            },
          }
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      ref={rootRef}
      id="faq"
      className="relative w-full bg-transparent text-[#0D0E0C] py-14 md:py-20 px-6 md:px-12 select-none overflow-x-clip border-t border-[#0D0E0C]/[0.08]"
    >
      <div className="relative z-10 w-full max-w-[1220px] mx-auto flex flex-col gap-16 md:gap-20">
        {/* =========================================================
            FAQ ACCORDION BLOCK (Clean 2-Column Minimal Architecture)
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Title Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 self-start">
            {/* Frosted-Glass Eyebrow Pill Box */}
            <div className="mb-4">
              <div className="glass-eyebrow-pill">
                <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#232620]">
                  QUESTIONS &amp; ANSWERS
                </span>
              </div>
            </div>

            <h2
              ref={headingRef}
              className="text-[clamp(2.75rem,5vw,4.5rem)] font-display font-bold tracking-[-0.038em] leading-[0.98] mb-5 text-[#11120F]"
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontVariationSettings: "'wght' 700",
                fontWeight: 700,
                color: "#11120F",
                textShadow: "none",
              }}
            >
              <span className="block overflow-hidden py-1">
                <span className="editorial-line block text-[#11120F]">
                  <span className="shiny-ink-text">Clear answers.</span>
                </span>
              </span>
              <span className="block overflow-hidden py-1">
                <span className="editorial-line block text-[#63685E]">
                  <span className="headline-secondary-shine">Zero ambiguity.</span>
                </span>
              </span>
            </h2>

            <p className="text-sm sm:text-base text-[#595C56] leading-relaxed max-w-[36ch]">
              Everything you need to know about our system architecture, turnaround SLAs, and collaborative model.
            </p>

            {/* Subtle Link to Full Knowledge Hub & AI Concierge */}
            <div className="mt-8 pt-5 border-t border-[#141413]/10">
              <a
                href="#/faq"
                className="group inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#141413] hover:text-[#72B314] transition-colors"
              >
                <span>View all FAQs &amp; Ask Arché AI</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>

          {/* Right Accordion Column (Clean 5-Item Stack) */}
          <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4">
            {HOMEPAGE_FAQS.map((item, idx) => (
              <AccordionRow
                key={item.n}
                item={item}
                open={openIdx === idx}
                onToggle={() => toggle(idx)}
              />
            ))}
          </div>
        </div>

        {/* =========================================================
            PRE-CTA EDITORIAL STATEMENT (Scrubbed Word-by-Word Reveal)
            ========================================================= */}
        <div ref={preCtaRef} className="max-w-[960px] mx-auto text-center px-4 my-2 sm:my-4">
          <p className="font-display text-[clamp(24px,3.4vw,42px)] font-bold tracking-[-0.035em] leading-[1.22] text-center">
            {PRE_CTA_WORDS.map((w, i) => (
              <span
                key={i}
                className="pre-cta-word inline-block mr-[0.28em] text-[#B4B9AE] will-change-[color]"
              >
                {w}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
