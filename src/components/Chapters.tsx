import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { oneRailStore } from "../lib/oneRailState";
import { SlotButton } from "./SlotButton";

import { VideoEditingDemo } from "./VideoEditingDemo";
import { WebDevDemo } from "./WebDevDemo";
import { AgentDemo } from "./AgentDemo";
import { AutomationDemo } from "./AutomationDemo";

interface ServiceCardData {
  id: string;
  n: string;
  title: string;
  roomName: string;
  headline: string;
  desc: string;
  slug: string;
  highlights: string[];
  coordinate: string;
}

const SERVICE_CARDS: ServiceCardData[] = [
  {
    id: "video-editing",
    n: "01",
    title: "Video Editing",
    roomName: "VIDEO EDITING",
    headline: "Video Editing",
    desc: "Every frame has a story. Let's make it worth watching. Engineered from raw 4K camera footage to cinema-grade master delivery.",
    slug: "video-editing",
    highlights: ["4K Cinema Master Grades", "60fps Native Playback", "Sub-frame Sound Design"],
    coordinate: "03 · SERVICES",
  },
  {
    id: "web-development",
    n: "02",
    title: "Web Development",
    roomName: "WEB DEVELOPMENT",
    headline: "Web Development",
    desc: "Fast, bespoke websites engineered to convert. High-craft digital flagships with sub-35ms interaction speed.",
    slug: "web-development",
    highlights: ["Architectural Layout Systems", "Sub-35ms Interaction", "Fluid Spatial Responsive Canvas"],
    coordinate: "03 · SERVICES",
  },
  {
    id: "ai-chatbots",
    n: "03",
    title: "AI Chatbots",
    roomName: "AI CHATBOTS",
    headline: "AI Chatbots",
    desc: "Intelligent agents that qualify leads, book calls, and handle support 24/7. Zero latency, rules-backed reasoning.",
    slug: "ai-chatbots",
    highlights: ["INSTANT LEAD ROUTING", "Multi-tool Function Calling", "24/7 Autonomous Booking"],
    coordinate: "03 · SERVICES",
  },
  {
    id: "ai-automation",
    n: "04",
    title: "AI Automation",
    roomName: "AI AUTOMATION",
    headline: "AI Automation",
    desc: "End-to-end workflows that connect your stack and eliminate repetitive ops. Real-time sync across all your tools.",
    slug: "ai-automation",
    highlights: ["Bi-directional Sheet & CRM Sync", "Automated Slack & Inbox Triage", "Zero Manual Touchpoints"],
    coordinate: "03 · SERVICES",
  },
];

const STEPPED_TOPS = ["78px", "108px", "138px", "168px"];

export function Chapters() {
  const rootRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [cardInView, setCardInView] = useState<boolean[]>([false, false, false, false]);
  const [cardRunKeys, setCardRunKeys] = useState<number[]>([0, 0, 0, 0]);

  // Viewport-gated IntersectionObserver (threshold: 0.35) with 220ms settling delay
  useEffect(() => {
    const cards = cardRefs.current;
    const settleTimers: (number | null)[] = [null, null, null, null];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = cards.findIndex((c) => c === entry.target);
          if (idx === -1) return;

          if (entry.isIntersecting) {
            if (settleTimers[idx]) window.clearTimeout(settleTimers[idx]!);
            settleTimers[idx] = window.setTimeout(() => {
              setCardInView((prev) => {
                const next = [...prev];
                next[idx] = true;
                return next;
              });
              setCardRunKeys((prev) => {
                const next = [...prev];
                next[idx] = next[idx] + 1;
                return next;
              });
            }, 220); // 220ms viewport settling delay before play
          } else {
            if (settleTimers[idx]) {
              window.clearTimeout(settleTimers[idx]!);
              settleTimers[idx] = null;
            }
            setCardInView((prev) => {
              if (!prev[idx]) return prev;
              const next = [...prev];
              next[idx] = false;
              return next;
            });
          }
        });
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    cards.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      observer.disconnect();
      settleTimers.forEach((t) => t && window.clearTimeout(t));
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    // Presence trigger for Left-Edge Rail HUD
    const stPresence = ScrollTrigger.create({
      trigger: root,
      start: "top 70%",
      end: "bottom 30%",
      onEnter: () => {
        oneRailStore.setChapter(2, "SERVICES", 0, "03 · SERVICES");
      },
      onEnterBack: () => {
        oneRailStore.setChapter(2, "SERVICES", 1, "03 · SERVICES");
      },
    });

    if (prefersReducedMotion() || window.innerWidth < 1024) {
      return () => stPresence.kill();
    }

    const ctx = gsap.context(() => {
      // For each card (except the last), as the next card scrolls up over it into stepped sticky position,
      // visibly animate Card N receding into depth: scale 1.0 -> 0.955 -> 0.92, body opacity 1.0 -> 0.25, brightness 1.0 -> 0.96
      cards.forEach((card, i) => {
        if (i < cards.length - 1) {
          const nextCard = cards[i + 1];
          if (!nextCard) return;

          ScrollTrigger.create({
            trigger: nextCard,
            start: "top 80%",
            end: `top ${STEPPED_TOPS[i + 1]}`,
            scrub: 0.6,
            onUpdate: (self) => {
              const p = self.progress;
              const scaleVal = 1.0 - p * 0.08; // 1.0 -> 0.92
              const bodyOpacityVal = 1.0 - p * 0.75; // 1.0 -> 0.25
              const brightnessVal = 1.0 - p * 0.04; // 1.0 -> 0.96
              gsap.set(card, {
                scale: scaleVal,
                transformOrigin: "center top",
              });
              const body = card.querySelector<HTMLElement>(".service-card-body");
              if (body) {
                gsap.set(body, {
                  opacity: bodyOpacityVal,
                  filter: `brightness(${brightnessVal})`,
                });
              }
            },
          });
        }

        // Section chapter coordinate updater for OneRail telemetry
        ScrollTrigger.create({
          trigger: card,
          start: "top center",
          end: "bottom center",
          onEnter: () => {
            oneRailStore.setChapter(2, "SERVICES", i / 3, "03 · SERVICES");
          },
          onEnterBack: () => {
            oneRailStore.setChapter(2, "SERVICES", i / 3, "03 · SERVICES");
          },
        });
      });
    }, root);

    return () => {
      stPresence.kill();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="services"
      className="relative w-full bg-transparent text-[#F4F1E0] pt-12 pb-6 px-4 sm:px-6 md:px-12 select-none overflow-x-clip"
    >
      <div className="relative z-10 w-full max-w-[1240px] mx-auto">
        {/* =========================================================
            SERVICES SECTION HEADER
            ========================================================= */}
        <div className="mb-8 md:mb-10 text-center max-w-[860px] mx-auto">
          {/* Frosted-Glass Eyebrow Pill Box */}
          <div className="mb-4 flex justify-center">
            <div className="glass-eyebrow-pill">
              <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
                CAPABILITIES · 04 CONNECTED VERTICALS
              </span>
            </div>
          </div>

          <h2
            className="text-[clamp(2.75rem,5vw,4.5rem)] font-bold tracking-[-0.038em] leading-[0.98] mb-4 text-[#F4F1E0]"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontVariationSettings: "'wght' 700",
              fontWeight: 700,
              color: "#F4F1E0",
              textShadow: "none",
            }}
          >
            <span className="block text-[#F4F1E0]">
              <span className="shiny-ink-text">Four verticals.</span>
            </span>
            <span className="block mt-1 text-[#92998D]">
              <span className="headline-secondary-shine">Built as one system.</span>
            </span>
          </h2>

          <p className="text-[clamp(15px,1.25vw,18px)] text-[#C9CEC3] max-w-[54ch] mx-auto leading-relaxed font-sans">
            Cinema film, interactive web, autonomous AI agents, and operational automation. Engineered as connected components that multiply impact.
          </p>
        </div>

        {/* =========================================================
            4 FULL-WIDTH STEPPED-DECK ARCHITECTURAL SAGE-LIME CARDS
            - Stepped sticky tops: 78px, 108px, 138px, 168px (30px gap)
            - Upward separation shadows so incoming cards float in front
            - Compact space-y-[10vh] pacing and pb-[6vh] runway
            ========================================================= */}
        <div className="relative flex flex-col space-y-[10vh] pb-[6vh]">
          {SERVICE_CARDS.map((svc, idx) => (
            <div
              key={svc.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              style={{
                position: "sticky",
                top: STEPPED_TOPS[idx],
                zIndex: (idx + 1) * 10,
                background: "#F4F1E0",
                border: "1px solid rgba(24, 36, 22, 0.12)",
                boxShadow:
                  idx === 0
                    ? "inset 0 1px 0 rgba(255, 253, 244, 0.92), 0 20px 44px -14px rgba(24, 36, 22, 0.24), 0 4px 12px -2px rgba(24, 36, 22, 0.10)"
                    : "inset 0 1px 0 rgba(255, 253, 244, 0.92), 0 -14px 36px -10px rgba(24, 36, 22, 0.14), 0 20px 44px -14px rgba(24, 36, 22, 0.24)",
              }}
              className="sticky-service-card frosted-ivory-card arche-glow-card shiny-border w-full max-w-[1220px] mx-auto rounded-[28px] p-6 sm:p-8 lg:p-10 transition-all duration-300 flex flex-col gap-8"
            >
              {/* Card Header Top Row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#182416]/[0.08]">
                <div>
                  <div className="flex items-center gap-2 mb-2 font-mono text-[12px] font-bold tracking-widest text-[#2E322B] uppercase">
                    <span className="text-[#0B0C0A] font-bold">{svc.n} ·</span>
                    <span>{svc.roomName}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.025em] leading-[1.15] text-[#0B0C0A]">
                    {svc.headline}
                  </h3>

                  <p className="text-[16px] text-[#1C1E1A] font-medium max-w-[58ch] leading-[1.6] mt-2">
                    {svc.desc}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-2 font-sans text-[13.5px] font-semibold text-[#1C1E1A]">
                    {svc.highlights.map((h, i) => (
                      <span key={h} className="inline-flex items-center gap-2">
                        {i > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#72B314]" />}
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>

                  <SlotButton
                    to={`/services/${svc.slug}`}
                    variant="primary"
                    arrow="right"
                    className="!px-4 !py-2 !text-[11px]"
                  >
                    Details
                  </SlotButton>
                </div>
              </div>

              {/* Inner Service Card Body (dimmed to 0.15 on recession) */}
              <div className="service-card-body flex flex-col gap-8 transition-opacity duration-300">
                {/* Inner Live Interactive Demo Canvas Tray on Soft Alabaster #E5E7DC */}
                <div className="w-full rounded-2xl bg-[#E5E7DC] border border-[#141413]/[0.08] overflow-hidden shadow-[0_4px_16px_-4px_rgba(20,20,19,0.05)]">
                  {idx === 0 && (
                    <VideoEditingDemo
                      active={cardInView[0]}
                      isInView={cardInView[0]}
                      runKey={cardRunKeys[0]}
                    />
                  )}
                  {idx === 1 && (
                    <WebDevDemo
                      active={cardInView[1]}
                      isInView={cardInView[1]}
                      runKey={cardRunKeys[1]}
                    />
                  )}
                  {idx === 2 && (
                    <AgentDemo
                      active={cardInView[2]}
                      isInView={cardInView[2]}
                      runKey={cardRunKeys[2]}
                    />
                  )}
                  {idx === 3 && (
                    <AutomationDemo
                      active={cardInView[3]}
                      isInView={cardInView[3]}
                      runKey={cardRunKeys[3]}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
