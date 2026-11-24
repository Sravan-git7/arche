import { useEffect, useRef, useState } from "react";
import { Link, navigate } from "../lib/router";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { attachCardTilt } from "../motion/cardTilt";
import { getServiceDetail, type ServiceDetail } from "../data/serviceDetails";
import { projects, type Project } from "../data/projects";
import { WebDevInteractiveStage } from "./WebDevInteractiveStage";
import { VideoEditingDemo } from "./VideoEditingDemo";
import { AgentDemo } from "./AgentDemo";
import { AutomationDemo } from "./AutomationDemo";
import { SlotButton } from "./SlotButton";

interface ServiceDetailLayoutProps {
  slug: string;
}

export function ServiceDetailLayout({ slug }: ServiceDetailLayoutProps) {
  const service: ServiceDetail | undefined = getServiceDetail(slug);
  const containerRef = useRef<HTMLDivElement>(null);
  const problemWordsRef = useRef<HTMLDivElement>(null);
  const workRailRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Attach card tilt to all weighted cards on mount / slug change
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const timer = setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".weighted-card").forEach((el) => {
        cleanups.push(attachCardTilt(el));
      });
    }, 50);
    return () => {
      clearTimeout(timer);
      cleanups.forEach((c) => c());
    };
  }, [slug]);

  // Scroll-lit word-by-word animation via GSAP ScrollTrigger
  useEffect(() => {
    if (!problemWordsRef.current || prefersReducedMotion()) return;

    const words = problemWordsRef.current.querySelectorAll<HTMLElement>(".lit-word");
    if (!words.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { color: "#A8ADA3", opacity: 0.35 },
        {
          color: "#0D0E0C",
          opacity: 1,
          stagger: 0.04,
          ease: "none",
          scrollTrigger: {
            trigger: problemWordsRef.current,
            start: "top 75%",
            end: "bottom 45%",
            scrub: 0.6,
          },
        }
      );
    }, problemWordsRef);

    return () => ctx.revert();
  }, [slug]);

  // Filter projects for Chapter 4 Showcase Rail
  const matchingProjects: Project[] = projects.filter((p) => {
    if (slug === "video-editing" || slug === "video-production") {
      return p.service === "video-editing";
    }
    if (slug === "web-development" || slug === "web-dev") {
      return p.service === "web-development";
    }
    if (slug === "ai-chatbots") {
      return p.service === "ai-chatbots" || p.service === "ai-automation";
    }
    if (slug === "ai-automation" || slug === "ai-solutions-automation") {
      return p.service === "ai-automation";
    }
    return true;
  });

  // Fallback if fewer than 2 projects match
  const displayProjects = matchingProjects.length >= 2 ? matchingProjects : projects.slice(0, 4);

  const handleScrollWorkRail = (direction: "left" | "right") => {
    if (!workRailRef.current) return;
    const scrollAmount = workRailRef.current.clientWidth * 0.75;
    workRailRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleSelectPackage = (packageName: string) => {
    try {
      sessionStorage.setItem(
        "arche:prefill",
        JSON.stringify({
          service: service?.title,
          package: packageName,
        })
      );
    } catch {
      /* ignore */
    }
    navigate("/contact");
  };

  const handleScrollToPackages = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("packages");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!service) {
    return (
      <section className="flex min-h-[70svh] w-full items-center pt-32">
        <div className="wrap">
          <h1 className="text-3xl font-bold text-[#11120F]">Service not found.</h1>
          <p className="mt-3 text-[#595C56]">
            The requested service vertical does not exist or has moved.
          </p>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 mt-6 rounded-full bg-[#141413] text-[#FBFBF6] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider"
          >
            Explore All Services <span className="arw">→</span>
          </Link>
        </div>
      </section>
    );
  }

  // Render vertical-specific showcase component
  const renderInteractiveStage = () => {
    switch (service.slug) {
      case "web-development":
        return <WebDevInteractiveStage />;
      case "video-editing":
        return <VideoEditingDemo active isInView />;
      case "ai-chatbots":
        return <AgentDemo active isInView />;
      case "ai-automation":
        return <AutomationDemo active isInView />;
      default:
        return <WebDevInteractiveStage />;
    }
  };

  return (
    <div ref={containerRef} className="w-full relative">
      {/* ==================================================================== */}
      {/* CHAPTER 1: SERVICE HERO + INTERACTIVE LIVE STAGE                      */}
      {/* Top clearance pt-28 md:pt-32 well below floating navbar pill          */}
      {/* ==================================================================== */}
      <section className="relative w-full pt-28 md:pt-32 pb-16 md:pb-24 border-b border-[#141413]/[0.08]">
        <div className="wrap">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center gap-2">
            <Link
              to="/services"
              className="font-mono text-xs text-[#595C56] hover:text-[#141413] transition-colors"
            >
              Services
            </Link>
            <span className="font-mono text-xs text-[#141413]/30">/</span>
            <span className="font-mono text-xs font-semibold text-[#141413]">
              {service.shortName}
            </span>
          </div>

          {/* Centered Eyebrow, Headline, Value Promise */}
          <div className="max-w-[1020px] mx-auto text-center flex flex-col items-center">
            {/* Frosted-Glass Eyebrow Pill Box */}
            <div className="mb-5 inline-block">
              <div className="glass-eyebrow-pill">
                <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#232620]">
                  {service.eyebrow}
                </span>
              </div>
            </div>

            {/* Monumental Metallic Two-Tone Headline */}
            <h1 className="text-[clamp(2.4rem,5vw,4.25rem)] font-bold tracking-[-0.038em] leading-[1.04] text-[#11120F]">
              <span className="shiny-ink-text">{service.heroHeadline1}</span>{" "}
              <span className="headline-secondary-shine">{service.heroHeadline2}</span>
            </h1>

            {/* Concise Value Promise */}
            <p className="mt-5 max-w-[64ch] text-[#484C45] text-[clamp(16px,1.4vw,19px)] leading-relaxed font-sans">
              {service.valuePromise}
            </p>

            {/* Dual Kinetic CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <SlotButton
                to="/contact"
                variant="primary"
                arrow="right"
                className="!h-[48px] !px-7 !text-[13.5px] !font-semibold !bg-[#141413] !text-[#FBFBF6] hover:!shadow-[0_0_20px_rgba(158,228,26,0.35)] active:scale-95 transition-all"
              >
                Start a Project
              </SlotButton>
              <a
                href="#packages"
                onClick={handleScrollToPackages}
                className="h-[48px] px-6 rounded-full border border-[#141413]/15 hover:border-[#141413]/40 bg-[#F4F1E0]/70 hover:bg-[#F4F1E0] text-[#141413] font-sans text-[13.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>View INR Packages</span>
                <span className="text-xs font-mono text-[#72B314]">↓</span>
              </a>
            </div>
          </div>

          {/* Interactive Flagship Live Stage */}
          <div className="mt-12 md:mt-16 max-w-[1140px] mx-auto">
            {/* Stage header pill */}
            <div className="flex items-center justify-between pb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#9EE41A] animate-pulse" />
                <span className="font-mono text-[10.5px] font-bold tracking-widest uppercase text-[#595C56]">
                  {service.stageBadge}
                </span>
              </div>
              <span className="font-mono text-[10.5px] text-[#595C56]/80 hidden sm:inline">
                INTERACTIVE CONSOLE · 60FPS
              </span>
            </div>

            {/* Render Vertical Specific Demo */}
            {renderInteractiveStage()}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CHAPTER 2: SCROLL-LIT PROBLEM STATEMENT + STICKY "WHAT'S INCLUDED"    */}
      {/* 12-column split: Left 7 cols scroll-lit scrub, Right 5 cols sticky    */}
      {/* ==================================================================== */}
      <section className="relative w-full py-16 md:py-24 border-b border-[#141413]/[0.08]">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left 7 Columns: Scroll-Lit Problem Statement */}
            <div className="lg:col-span-7 flex flex-col justify-start">
              <div className="mb-4">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#72B314]">
                  • THE OPERATIONAL BOTTLENECK
                </span>
              </div>

              {/* Scroll-Lit Editorial Statement */}
              <div ref={problemWordsRef} className="py-2">
                <p className="font-display text-[clamp(1.75rem,3.2vw,2.65rem)] font-extrabold tracking-[-0.03em] leading-[1.18] select-none">
                  {service.problemStatement.leadWords.map((word, idx) => (
                    <span
                      key={idx}
                      className="lit-word inline-block mr-[0.28em] transition-colors duration-150 text-[#A8ADA3]"
                    >
                      {word}
                    </span>
                  ))}
                </p>
              </div>

              {/* Two Studio Paragraphs */}
              <div className="mt-8 flex flex-col gap-5 text-[#484C45] text-[clamp(15px,1.2vw,17.5px)] leading-relaxed font-sans">
                {service.problemStatement.bodyParagraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: Sticky "What's Included" Card */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
              <div className="rounded-[28px] p-6 sm:p-8 bg-[#F4F1E0] border border-[#141413]/[0.10] shadow-[0_16px_40px_rgba(20,20,19,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] weighted-card">
                {/* Eyebrow & Starting Price */}
                <div className="flex items-center justify-between pb-3 border-b border-[#141413]/[0.08]">
                  <div className="glass-eyebrow-pill !py-1 !px-3">
                    <span className="h-[4px] w-[4px] rounded-full bg-[#84CC16]" />
                    <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#232620]">
                      WHAT'S INCLUDED
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[11px] text-[#595C56] block">Starting from</span>
                    <span className="font-bold text-base text-[#141413]">
                      {service.whatsIncludedCard.startingAt}{" "}
                      <span className="text-xs font-normal text-[#595C56]">
                        {service.whatsIncludedCard.unit}
                      </span>
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[#141413] mt-4">
                  {service.shortName} Suite
                </h3>
                <p className="text-xs text-[#595C56] mt-1 leading-relaxed">
                  {service.whatsIncludedCard.summary}
                </p>

                {/* 6 Hairline-Divided Deliverables */}
                <div className="mt-6 flex flex-col divide-y divide-[#141413]/[0.08]">
                  {service.whatsIncludedCard.deliverables.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-[#141413] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg
                          className="w-2.5 h-2.5 text-[#9EE41A]"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.5 6.5L4.5 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-[#141413]">
                          {item.name}
                        </h4>
                        <p className="text-[11.5px] text-[#595C56] leading-snug mt-0.5">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full-width Kinetic CTA */}
                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPackage(service.whatsIncludedCard.title)}
                    className="w-full py-3.5 px-6 rounded-full bg-[#141413] text-[#F4F4EE] hover:text-[#9EE41A] font-bold text-center text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(20,20,19,0.18)] hover:shadow-[0_0_20px_rgba(158,228,26,0.35)] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Get Started →</span>
                  </button>
                  <p className="text-center font-mono text-[10.5px] text-[#595C56] mt-2.5">
                    Guaranteed turnaround · 100% transparent INR scope
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CHAPTER 3: "WHAT THIS MEANS FOR YOUR BUSINESS" — 3 OUTCOME CARDS      */}
      {/* 3 weighted #F4F1E0 cards with giant metallic numerals 01 02 03        */}
      {/* ==================================================================== */}
      <section className="relative w-full py-16 md:py-24 border-b border-[#141413]/[0.08]">
        <div className="wrap">
          {/* Header */}
          <div className="max-w-[760px] mb-12">
            <div className="glass-eyebrow-pill mb-3">
              <span className="h-[4px] w-[4px] rounded-full bg-[#84CC16]" />
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#232620]">
                TANGIBLE ROI
              </span>
            </div>
            <h2 className="text-[clamp(2.2rem,4vw,3.25rem)] font-bold tracking-[-0.035em] text-[#11120F] leading-[1.06]">
              <span className="shiny-ink-text">What this means</span>{" "}
              <span className="headline-secondary-shine">for your business.</span>
            </h2>
            <p className="mt-3 text-[#595C56] text-base leading-relaxed">
              Every deliverable is engineered to drive tangible operational velocity and measurable revenue dividends.
            </p>
          </div>

          {/* 3 Outcome Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {service.outcomes.map((outcome) => (
              <div
                key={outcome.n}
                className="rounded-[24px] p-7 sm:p-8 bg-[#F4F1E0] border border-[#141413]/[0.09] shadow-[0_12px_32px_rgba(20,20,19,0.04)] flex flex-col justify-between weighted-card group"
              >
                <div>
                  {/* Giant Metallic Vertical-Shine Numeral */}
                  <span
                    className="font-mono font-extrabold text-[clamp(3.2rem,5vw,4.5rem)] leading-none block select-none"
                    style={{
                      background: "linear-gradient(180deg, #090A08 0%, #242721 45%, #7E8479 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {outcome.n}
                  </span>

                  <h3 className="text-xl font-bold text-[#141413] mt-5 tracking-tight group-hover:text-[#72B314] transition-colors">
                    {outcome.title}
                  </h3>

                  <p className="mt-3 text-sm text-[#484C45] leading-relaxed">
                    {outcome.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#141413]/[0.08] flex items-center justify-between">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#72B314] font-semibold">
                    MEASURABLE DIVIDEND
                  </span>
                  <span className="font-mono text-xs text-[#141413]/40 group-hover:text-[#141413] group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CHAPTER 4: FILTERED WORK SHOWCASE RAIL                                */}
      {/* Relevant builds carousel with < > buttons and link to /work           */}
      {/* ==================================================================== */}
      <section className="relative w-full py-16 md:py-24 border-b border-[#141413]/[0.08]">
        <div className="wrap">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="glass-eyebrow-pill mb-2">
                <span className="h-[4px] w-[4px] rounded-full bg-[#84CC16]" />
                <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#232620]">
                  PROOF OF SYSTEM
                </span>
              </div>
              <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold tracking-tight text-[#11120F]">
                <span className="shiny-ink-text">Relevant builds</span>{" "}
                <span className="headline-secondary-shine">&amp; verified proofs.</span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/work"
                className="font-mono text-xs font-semibold text-[#141413] hover:text-[#72B314] transition-colors flex items-center gap-1 mr-2"
              >
                <span>See all work ({projects.length})</span>
                <span>→</span>
              </Link>
              <button
                type="button"
                onClick={() => handleScrollWorkRail("left")}
                aria-label="Scroll left"
                className="w-10 h-10 rounded-full bg-[#F4F1E0] border border-[#141413]/15 hover:border-[#141413]/40 flex items-center justify-center text-[#141413] hover:bg-[#ECE9D6] transition-all cursor-pointer shadow-sm active:scale-95"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => handleScrollWorkRail("right")}
                aria-label="Scroll right"
                className="w-10 h-10 rounded-full bg-[#F4F1E0] border border-[#141413]/15 hover:border-[#141413]/40 flex items-center justify-center text-[#141413] hover:bg-[#ECE9D6] transition-all cursor-pointer shadow-sm active:scale-95"
              >
                →
              </button>
            </div>
          </div>

          {/* Horizontal Rail */}
          <div
            ref={workRailRef}
            className="flex gap-6 overflow-x-auto scrollbar-none pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {displayProjects.map((p) => (
              <div
                key={p.slug}
                className="min-w-[280px] sm:min-w-[340px] md:min-w-[380px] snap-start rounded-[24px] p-5 bg-[#F4F1E0] border border-[#141413]/[0.09] shadow-[0_8px_24px_rgba(20,20,19,0.03)] flex flex-col justify-between weighted-card group"
              >
                <div>
                  {/* Media preview */}
                  <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#E2DFCD] mb-4 relative">
                    <img
                      src={p.img}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#141413]/85 backdrop-blur-md font-mono text-[9.5px] font-semibold text-[#9EE41A]">
                      {p.status}
                    </div>
                  </div>

                  {/* Service tag & year */}
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#595C56] mb-1.5">
                    <span className="uppercase tracking-wider font-semibold text-[#72B314]">
                      {p.serviceLabel}
                    </span>
                    <span>{p.year}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#141413] group-hover:text-[#72B314] transition-colors">
                    {p.name}
                  </h3>

                  <p className="mt-2 text-xs text-[#595C56] leading-relaxed line-clamp-3">
                    {p.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#141413]/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.scope.slice(0, 2).map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#E8E5D3] font-mono text-[9.5px] text-[#141413]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    to="/work"
                    className="font-mono text-xs font-semibold text-[#141413] group-hover:text-[#72B314] flex items-center gap-1"
                  >
                    <span>View build</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CHAPTER 5: "IS THIS RIGHT FOR YOU?" — STICKY-LEFT QUALIFIER           */}
      {/* 12-column split: Left 5 cols sticky, Right 7 cols checklist           */}
      {/* ==================================================================== */}
      <section className="relative w-full py-16 md:py-24 border-b border-[#141413]/[0.08]">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left 5 Cols Sticky */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
              <div className="glass-eyebrow-pill mb-3">
                <span className="h-[4px] w-[4px] rounded-full bg-[#84CC16]" />
                <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#232620]">
                  FIT &amp; QUALIFICATION
                </span>
              </div>

              <h2 className="text-[clamp(2.2rem,4vw,3.25rem)] font-bold tracking-[-0.035em] text-[#11120F] leading-[1.06]">
                <span className="shiny-ink-text">{service.qualifier.headlineLead}</span>{" "}
                <span className="headline-secondary-shine">{service.qualifier.headlineAccent}</span>
              </h2>

              <p className="mt-4 text-[#595C56] text-base leading-relaxed">
                {service.qualifier.leadIn}
              </p>

              <div className="mt-8">
                <SlotButton
                  to="/contact"
                  variant="primary"
                  arrow="right"
                  className="!h-[46px] !px-6 !text-[13px] !font-semibold !bg-[#141413] !text-[#FBFBF6]"
                >
                  Schedule Discovery Call
                </SlotButton>
              </div>
            </div>

            {/* Right 7 Cols: Checklist in Cream-Ivory Card */}
            <div className="lg:col-span-7">
              <div className="rounded-[28px] p-6 sm:p-8 bg-[#F4F1E0] border border-[#141413]/[0.10] shadow-[0_12px_32px_rgba(20,20,19,0.04)] divide-y divide-[#141413]/[0.08] weighted-card">
                {service.qualifier.checklist.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-[#141413] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg
                        className="w-3.5 h-3.5 text-[#9EE41A]"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6.5L4.5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-[14.5px] sm:text-[15.5px] text-[#141413] font-medium leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CHAPTER 6: REAL INR TIER COMPARISON TABLE (NO FAKE NUMBERS)           */}
      {/* Pulling exact rates, turnarounds, revisions from real pricingData      */}
      {/* ==================================================================== */}
      <section id="packages" className="relative w-full py-16 md:py-24 border-b border-[#141413]/[0.08]">
        <div className="wrap">
          {/* Section Header */}
          <div className="max-w-[780px] mb-12">
            <div className="glass-eyebrow-pill mb-3">
              <span className="h-[4px] w-[4px] rounded-full bg-[#84CC16]" />
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#232620]">
                INVESTMENT &amp; SCOPE
              </span>
            </div>
            <h2 className="text-[clamp(2.2rem,4vw,3.25rem)] font-bold tracking-[-0.035em] text-[#11120F] leading-[1.06]">
              <span className="shiny-ink-text">{service.tierComparison.sectionHeadline}</span>
            </h2>
            <p className="mt-3 text-[#595C56] text-base leading-relaxed">
              {service.tierComparison.sectionSubtitle}
            </p>
          </div>

          {/* Unified Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {service.tierComparison.tiers.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-[28px] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 weighted-card relative ${
                  tier.popular
                    ? "bg-[#F4F1E0] border-2 border-[#72B314]/60 shadow-[0_20px_48px_rgba(114,179,20,0.12)]"
                    : "bg-[#F4F1E0]/90 border border-[#141413]/[0.09] shadow-[0_12px_32px_rgba(20,20,19,0.04)]"
                }`}
              >
                {/* Popular Pill */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#141413] text-[#9EE41A] font-mono text-[10px] font-bold tracking-wider uppercase shadow-sm">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  {/* Tier Title & Tagline */}
                  <h3 className="text-xl font-bold text-[#141413]">{tier.name}</h3>
                  <p className="text-xs text-[#595C56] mt-1">{tier.tagline}</p>

                  {/* Price */}
                  <div className="mt-5 pb-5 border-b border-[#141413]/[0.08]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141413]">
                        {tier.price}
                      </span>
                      <span className="text-xs font-mono text-[#595C56]">/{tier.unit}</span>
                    </div>

                    {/* SLAs */}
                    <div className="mt-3 flex flex-col gap-1 font-mono text-[11px] text-[#595C56]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#72B314]">⏱</span>
                        <span>{tier.turnaround}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#72B314]">↺</span>
                        <span>{tier.revisions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="mt-5 flex flex-col gap-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#141413]/60 font-semibold">
                      INCLUDED IN SCOPE:
                    </span>
                    <ul className="flex flex-col gap-2 text-xs text-[#141413]/85">
                      {tier.deliverables.map((del, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#72B314] font-bold mt-0.5">✓</span>
                          <span>{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-8 pt-4 border-t border-[#141413]/[0.08]">
                  <button
                    type="button"
                    onClick={() => handleSelectPackage(tier.name)}
                    className={`w-full py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      tier.popular
                        ? "bg-[#141413] text-[#F4F4EE] hover:text-[#9EE41A] shadow-[0_4px_16px_rgba(20,20,19,0.2)]"
                        : "bg-[#E6E3D1] hover:bg-[#141413] text-[#141413] hover:text-[#F4F4EE]"
                    }`}
                  >
                    <span>Choose This Tier →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Note & Full Pricing Link */}
          <div className="mt-10 p-5 rounded-2xl bg-[#F4F1E0]/80 border border-[#141413]/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#595C56] font-mono">
              💡 {service.tierComparison.note}
            </p>
            <Link
              to="/pricing"
              className="font-mono text-xs font-semibold text-[#141413] hover:text-[#72B314] flex items-center gap-1 flex-shrink-0 transition-colors"
            >
              <span>See full pricing breakdown</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CHAPTER 7: SERVICE-SPECIFIC FAQ + "EXPLORE OUR OTHER SERVICES"        */}
      {/* Left questions + right 3-4 accordions; bottom 3 vertical cross-links  */}
      {/* ==================================================================== */}
      <section className="relative w-full py-16 md:py-24">
        <div className="wrap">
          {/* FAQ Accordions Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start mb-20">
            {/* Left 5 Cols Sticky Header */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
              <div className="glass-eyebrow-pill mb-3">
                <span className="h-[4px] w-[4px] rounded-full bg-[#84CC16]" />
                <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#232620]">
                  COMMON QUESTIONS
                </span>
              </div>
              <h2 className="text-[clamp(2.2rem,4vw,3.25rem)] font-bold tracking-[-0.035em] text-[#11120F] leading-[1.06]">
                <span className="shiny-ink-text">Clear answers.</span> <br />
                <span className="headline-secondary-shine">Zero ambiguity.</span>
              </h2>
              <p className="mt-4 text-[#595C56] text-base leading-relaxed">
                Everything you need to know about turnaround times, revisions, scope boundaries, and delivery protocols.
              </p>
              <div className="mt-6">
                <Link
                  to="/faq"
                  className="font-mono text-xs font-semibold text-[#141413] hover:text-[#72B314] flex items-center gap-1 transition-colors"
                >
                  <span>View comprehensive studio FAQ &amp; Arché AI →</span>
                </Link>
              </div>
            </div>

            {/* Right 7 Cols Accordions */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {service.faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl transition-all duration-200 border ${
                      isOpen
                        ? "bg-[#F4F1E0] border-[#141413]/15 shadow-sm"
                        : "bg-[#F4F1E0]/70 border-[#141413]/[0.07] hover:bg-[#F4F1E0]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <span className="font-bold text-[15px] sm:text-[16px] text-[#141413] leading-snug">
                        {faq.q}
                      </span>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-base font-bold transition-transform duration-200 flex-shrink-0 ${
                          isOpen
                            ? "bg-[#141413] text-[#9EE41A] rotate-45"
                            : "bg-[#E6E3D1] text-[#141413]"
                        }`}
                      >
                        +
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-[#484C45] leading-relaxed border-t border-[#141413]/[0.06]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explore Our Other Services Cross-Links */}
          <div className="pt-16 border-t border-[#141413]/[0.08]">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <div className="glass-eyebrow-pill mb-2">
                  <span className="h-[4px] w-[4px] rounded-full bg-[#84CC16]" />
                  <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#232620]">
                    THE CONNECTED SYSTEM
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#11120F]">
                  <span className="shiny-ink-text">Explore our other</span>{" "}
                  <span className="headline-secondary-shine">core services.</span>
                </h3>
              </div>
              <Link
                to="/services"
                className="font-mono text-xs font-semibold text-[#141413] hover:text-[#72B314] flex items-center gap-1"
              >
                <span>View all services (4)</span>
                <span>→</span>
              </Link>
            </div>

            {/* 3 Cross-Link Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {service.crossLinks.map((item) => (
                <Link
                  key={item.slug}
                  to={`/services/${item.slug}`}
                  className="rounded-[24px] p-6 sm:p-7 bg-[#F4F1E0] border border-[#141413]/[0.09] shadow-sm hover:border-[#72B314]/40 hover:shadow-[0_12px_32px_rgba(20,20,19,0.06)] flex flex-col justify-between transition-all group weighted-card"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#141413]/[0.08]">
                      <span className="font-mono text-[10px] font-bold text-[#72B314] uppercase tracking-wider">
                        SERVICE {item.n}
                      </span>
                      <span className="font-mono text-xs text-[#141413]/40 group-hover:text-[#72B314] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">
                        ↗
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-[#141413] mt-4 group-hover:text-[#72B314] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#595C56] mt-1.5 leading-relaxed">
                      {item.tagline}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#141413]/[0.08] flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#595C56]">From {item.startingAt}</span>
                    <span className="font-semibold text-[#141413] group-hover:text-[#72B314]">
                      Explore →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
