import { useState, useEffect } from "react";
import {
  servicesData,
  STUDIO_INFO,
  type PackageItem,
  type ServiceData,
} from "../data/services";
import { DownloadButton } from "../components/DownloadButton";
import { Link, usePage, navigate } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";
import { prefersReducedMotion } from "../lib/gsap";
import { attachCardTilt } from "../motion/cardTilt";
import { SlotButton } from "../components/SlotButton";

export function PricingPage() {
  usePage("Pricing & Investment | ARCHE Creative Studios");
  useReveal();
  useParallax();

  const [activeVertical, setActiveVertical] = useState<string>("all");

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".weighted-card").forEach((el) => {
      cleanups.push(attachCardTilt(el));
    });
    return () => cleanups.forEach((c) => c());
  }, [activeVertical]);

  const handleSelectPackage = (serviceSlug: string, packageName?: string) => {
    try {
      const buildMap: Record<string, string> = {
        "web-development": "Website",
        "video-editing": "Video",
        "video-production": "Video",
        "ai-chatbots": "AI Agent",
        "ai-automation": "Automation",
        "ai-solutions-automation": "Automation",
        "pitch-decks-storytelling": "Pitch Deck",
      };
      const build =
        buildMap[serviceSlug] ||
        (serviceSlug.toLowerCase().includes("web") ? "Website" : "System");
      sessionStorage.setItem(
        "arche:prefill",
        JSON.stringify({
          service: serviceSlug,
          build,
          pkg: packageName || "Standard Package",
        })
      );
    } catch {
      /* ignore storage restrictions */
    }
    navigate("/contact");
  };

  const filteredServices =
    activeVertical === "all"
      ? servicesData
      : servicesData.filter((s) => s.slug === activeVertical);

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* 1. HERO HEADER SECTION (Clean pt-32 padding clearing Navbar)     */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative w-full pt-32 md:pt-36 pb-12 md:pb-16 border-b border-white/10">
        <div className="wrap">
          {/* Breadcrumbs */}
          <div className="mb-4 flex items-center gap-2">
            <Link to="/" className="font-mono text-xs text-[#92998D] hover:text-[#F4F1E0] transition-colors">
              Home
            </Link>
            <span className="font-mono text-xs text-white/30">/</span>
            <span className="font-mono text-xs font-semibold text-[#F4F1E0]">Pricing & Investment</span>
          </div>

          <div className="max-w-[920px]">
            {/* Frosted-Glass Eyebrow Pill Box */}
            <div className="mb-4">
              <div className="glass-eyebrow-pill">
                <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
                  ARCHÉ CREATIVE STUDIOS · INVESTMENT ARCHITECTURE
                </span>
              </div>
            </div>

            {/* Sculpted Two-Tone Display Headline */}
            <h1 className="text-[clamp(2.75rem,5.2vw,4.5rem)] font-bold tracking-[-0.038em] leading-[0.98] text-[#F4F1E0]">
              <span className="block">
                <span className="shiny-ink-text">Transparent Rates.</span>
              </span>
              <span className="block mt-1">
                <span className="headline-secondary-shine">Honest Scopes. Zero Surprises.</span>
              </span>
            </h1>

            <p className="mt-5 max-w-[64ch] text-[#C9CEC3] text-[clamp(15px,1.2vw,17.5px)] leading-relaxed font-sans font-normal">
              Every project is backed by clearly defined packages, fixed turnaround times,
              and concrete deliverables. All rates are proposed in Indian Rupees (INR) with zero hidden fees or agency bloat.
            </p>

            <p className="mt-3.5 font-mono text-[11.5px] text-[#92998D]">
              * Proposed launch pricing in INR. Confirmed scopes and commercial terms are issued in your tailored written proposal.
            </p>
          </div>

          {/* Action Row: Catalogue Download + Quick Jump */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <DownloadButton
              filename={STUDIO_INFO.completeCataloguePdf}
              label="Download Complete Service Catalogue"
              variant="primary"
            />
            <SlotButton
              to="/contact"
              variant="smoked-glass"
              arrow="right"
              className="!px-5 !py-2.5 !text-[12px] !font-medium !tracking-[0.06em]"
            >
              Request Custom Scope
            </SlotButton>
          </div>

          {/* Vertical Filter Pills Bar */}
          <div className="mt-10 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveVertical("all")}
              className={`rounded-full px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer ${
                activeVertical === "all"
                  ? "bg-[#141413] text-[#9EE41A] border border-[#9EE41A]/60 shadow-[0_0_16px_rgba(158,228,26,0.25)]"
                  : "bg-white/[0.06] text-[#F4F1E0] border border-white/15 hover:border-[#9EE41A]/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              All Verticals ({servicesData.length})
            </button>
            {servicesData.map((s) => (
              <button
                key={s.slug}
                onClick={() => {
                  setActiveVertical(s.slug);
                  if (activeVertical === s.slug) {
                    document.getElementById(s.slug)?.scrollIntoView({
                      behavior: prefersReducedMotion() ? "auto" : "smooth",
                    });
                  }
                }}
                className={`rounded-full px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer ${
                  activeVertical === s.slug
                    ? "bg-[#141413] text-[#9EE41A] border border-[#9EE41A]/60 shadow-[0_0_16px_rgba(158,228,26,0.25)]"
                    : "bg-white/[0.06] text-[#F4F1E0] border border-white/15 hover:border-[#9EE41A]/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-[#84CC16] font-bold mr-1.5">{s.n}</span>
                {s.title} · from {s.startingPrice}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. SERVICES PRICING SECTIONS (Sticky 01-04 Layout)               */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col divide-y divide-[#141413]/[0.08]">
        {filteredServices.map((service) => (
          <ServicePricingBlock
            key={service.slug}
            service={service}
            onSelectPackage={(pkgName) =>
              handleSelectPackage(service.slug, pkgName)
            }
          />
        ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 3. STUDIO PRICING PRINCIPLES & COMMERCIAL TERMS                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="w-full py-16 md:py-24 border-t border-white/10 bg-transparent">
        <div className="wrap grid gap-12 lg:grid-cols-12 items-start">
          {/* Left Column: Heading & Disclaimer */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <div className="glass-eyebrow-pill">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
                    COMMERCIAL ARCHITECTURE
                  </span>
                </div>
              </div>
              <h2 className="text-[clamp(2rem,3.2vw,3rem)] font-bold tracking-tight text-[#F4F1E0] leading-tight">
                How we price and operate.
              </h2>
              <p className="mt-4 text-[#D4D9CD] text-base leading-relaxed max-w-[42ch]">
                We operate as a modern creative technology studio, not a bloated agency or an open-ended hourly shop.
              </p>
            </div>

            <div className="mt-8 rounded-2xl weighted-card p-6 sm:p-7 bg-[rgba(244,241,224,0.92)] border border-[#141413]/12 shadow-sm backdrop-blur-md">
              <span className="font-sans text-[13px] uppercase tracking-wider text-[#5B8F0E] font-bold block mb-2.5">
                ● Scope Notice
              </span>
              <p className="font-sans text-[14px] font-medium text-[#1C1E1A] leading-[1.6]">
                {STUDIO_INFO.generalDisclaimer}
              </p>
            </div>
          </div>

          {/* Right Column: Key Principles */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="weighted-card p-6 sm:p-7 rounded-2xl bg-[rgba(244,241,224,0.92)] border border-[#141413]/12 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="font-mono text-[13.5px] text-[#5B8F0E] font-bold">01</span>
                <h3 className="text-[20px] font-bold text-[#0B0C0A] tracking-tight">Fixed Milestones & Defined Deliverables</h3>
              </div>
              <p className="text-[15.5px] font-medium text-[#1C1E1A] leading-[1.6]">
                Before any production sprint or development starts, you receive an exact technical scope with deliverables, duration limits, revision allowances, and total investment in writing.
              </p>
            </div>

            <div className="weighted-card p-6 sm:p-7 rounded-2xl bg-[rgba(244,241,224,0.92)] border border-[#141413]/12 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="font-mono text-[13.5px] text-[#5B8F0E] font-bold">02</span>
                <h3 className="text-[20px] font-bold text-[#0B0C0A] tracking-tight">50% Commitment Deposit</h3>
              </div>
              <p className="text-[15.5px] font-medium text-[#1C1E1A] leading-[1.6]">
                Engagements require a 50% deposit to lock the production timeline, with the remaining balance due upon final milestone approval and before export handoff or deployment.
              </p>
            </div>

            <div className="weighted-card p-6 sm:p-7 rounded-2xl bg-[rgba(244,241,224,0.92)] border border-[#141413]/12 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="font-mono text-[13.5px] text-[#5B8F0E] font-bold">03</span>
                <h3 className="text-[20px] font-bold text-[#0B0C0A] tracking-tight">Structured Revision Passes</h3>
              </div>
              <p className="text-[15.5px] font-medium text-[#1C1E1A] leading-[1.6]">
                Every tier includes consolidated revision rounds to polish timing, copy, visual styling and grading. Additional rounds or scope changes are quoted upfront at standard add-on rates.
              </p>
            </div>

            <div className="weighted-card p-6 sm:p-7 rounded-2xl bg-[rgba(244,241,224,0.92)] border border-[#141413]/12 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="font-mono text-[13.5px] text-[#5B8F0E] font-bold">04</span>
                <h3 className="text-[20px] font-bold text-[#0B0C0A] tracking-tight">Start Single, Scale & Connect</h3>
              </div>
              <p className="text-[15.5px] font-medium text-[#1C1E1A] leading-[1.6]">
                Start with a single vertical — whether a batch of high-retention reels, an investor pitch deck, a marketing website, or an AI assistant. As your business grows, our systems integrate seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 4. BOTTOM ACTION BANNER                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="w-full py-14 md:py-20 border-t border-white/10 bg-transparent">
        <div className="wrap flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="font-mono text-[11px] text-[#84CC16] font-bold uppercase tracking-wider block mb-1">
              Ready to collaborate?
            </span>
            <h3 className="text-[clamp(22px,2.5vw,30px)] font-bold text-[#F4F1E0]">Have a custom requirement or enterprise scope?</h3>
            <p className="text-sm text-[#D4D9CD] mt-1.5 max-w-[52ch]">
              We prepare custom scopes and tailored retained partnerships within one working day.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#141413] text-[#FBFBF6] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider hover:border-[#9EE41A] hover:shadow-[0_0_20px_rgba(158,228,26,0.25)] transition-all duration-300"
            >
              <span>Start a Project</span>
              <span className="text-xs">→</span>
            </Link>
            <DownloadButton
              filename={STUDIO_INFO.completeCataloguePdf}
              label="Download Catalogue (PDF)"
              variant="ghost"
            />
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Service vertical pricing block rendering all packages, specialist services,
 * retainers, and add-ons for a vertical with Sticky Left 01-04 Numeral.
 */
function ServicePricingBlock({
  service,
  onSelectPackage,
}: {
  service: ServiceData;
  onSelectPackage: (pkgName: string) => void;
}) {
  return (
    <section id={service.slug} className="w-full py-16 md:py-24 scroll-mt-28">
      <div className="wrap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* =========================================================
              LEFT STICKY COLUMN (01-04 Giant Numeral & Description)
              ========================================================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 self-start flex flex-col">
            {/* Giant Metallic Vertical-Shine Numeral */}
            <div className="mb-2">
              <span
                className="process-numeral-shine text-[clamp(5.5rem,8vw,7.5rem)] font-extrabold tracking-[-0.05em] leading-[0.9] block select-none"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #C8CEC2 55%, #585E54 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {service.n}
              </span>
            </div>

            {/* Razor-thin 2px #9EE41A progress underline */}
            <div className="h-[2px] w-20 bg-[#9EE41A] rounded-full shadow-[0_0_8px_#9EE41A] mb-5" />

            {/* Vertical Subtitle & Title */}
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#92998D] block mb-1">
              VERTICAL {service.n} · {service.short.toUpperCase()}
            </span>
            <h2 className="text-[clamp(24px,2.5vw,34px)] font-bold tracking-tight text-[#F4F1E0] leading-tight mb-3">
              {service.title}
            </h2>

            {/* Concise 2-line Description */}
            <p className="text-sm sm:text-base text-[#D4D9CD] leading-relaxed max-w-[38ch] mb-6 font-sans">
              {service.description}
            </p>

            {/* Action Links */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <SlotButton
                to={`/services/${service.slug}`}
                variant="smoked-glass"
                arrow="right"
                className="!px-4 !py-2 !text-[11px] !font-semibold !tracking-[0.08em]"
              >
                Explore Overview
              </SlotButton>
              <DownloadButton
                filename={service.pdfFilename}
                label="Download Guide (PDF)"
                variant="ghost"
              />
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN (Right-Side Tier Cards & Specialist Services)
              ========================================================= */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* Package Groups */}
            {service.packageGroups.map((group, gIdx) => (
              <div key={gIdx} className="flex flex-col gap-5">
                {/* Group Header */}
                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-mono text-[13px] uppercase tracking-[0.14em] text-[#F4F1E0] font-bold">
                      {group.groupTitle}
                    </h3>
                    {group.groupSubtitle && (
                      <p className="font-mono text-[11px] text-[#D4D9CD] mt-0.5">
                        {group.groupSubtitle}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-[10.5px] font-semibold text-[#84CC16]">
                    {group.packages.length} tier{group.packages.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Packages Grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.packages.map((pkg) => (
                    <PricingCard
                      key={pkg.id}
                      pkg={pkg}
                      onSelect={() => onSelectPackage(pkg.name)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Specialist Services & Add-Ons Grid */}
            {(service.specialistServices?.length || service.addOns?.length) && (
              <div className="grid gap-6 lg:grid-cols-12 mt-2">
                {/* Specialist Services */}
                {service.specialistServices && service.specialistServices.length > 0 && (
                  <div className={`rounded-2xl weighted-card p-6 bg-[rgba(244,241,224,0.92)] border border-[#141413]/12 shadow-sm backdrop-blur-md ${service.addOns ? "lg:col-span-7" : "lg:col-span-12"}`}>
                    <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-3 mb-4">
                      <h4 className="font-sans text-[13px] uppercase tracking-wider text-[#0B0C0A] font-bold">
                        Specialist Scopes
                      </h4>
                      <span className="font-mono text-[11px] font-semibold text-[#2E322B]">Per Request</span>
                    </div>
                    <div className="divide-y divide-[#141413]/[0.08]">
                      {service.specialistServices.map((sp, sIdx) => (
                        <div
                          key={sIdx}
                          className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5"
                        >
                          <div>
                            <span className="text-[15.5px] font-bold text-[#0B0C0A] block">{sp.name}</span>
                            {sp.description && (
                              <span className="text-[14px] font-medium text-[#1C1E1A] block mt-0.5">
                                {sp.description}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[13.5px] font-bold text-[#0B0C0A] whitespace-nowrap bg-[rgba(20,20,19,0.06)] px-2.5 py-1 rounded border border-[#141413]/[0.08]">
                            {sp.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-Ons */}
                {service.addOns && service.addOns.length > 0 && (
                  <div className={`rounded-2xl weighted-card p-6 bg-[rgba(244,241,224,0.92)] border border-[#141413]/12 shadow-sm backdrop-blur-md ${service.specialistServices ? "lg:col-span-5" : "lg:col-span-12"}`}>
                    <div className="flex items-center justify-between border-b border-[#141413]/[0.08] pb-3 mb-4">
                      <h4 className="font-sans text-[13px] uppercase tracking-wider text-[#0B0C0A] font-bold">
                        Add-On Options
                      </h4>
                      <span className="font-mono text-[11px] font-semibold text-[#2E322B]">Per Project</span>
                    </div>
                    <div className="divide-y divide-[#141413]/[0.08]">
                      {service.addOns.map((ao, aIdx) => (
                        <div
                          key={aIdx}
                          className="py-2.5 flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-[#1C1E1A] font-semibold text-[14.5px]">{ao.name}</span>
                          <span className="font-mono font-bold text-[13.5px] text-[#0B0C0A] whitespace-nowrap bg-[rgba(20,20,19,0.06)] px-2.5 py-1 rounded border border-[#141413]/[0.08]">
                            {ao.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="pt-2 border-t border-[#0B0C0A]/[0.08]">
              <p className="font-mono text-[12px] font-semibold text-[#2E322B]">
                * {service.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Individual package pricing card component with unclipped Popular badge,
 * hairline deliverable dividers, and anchored slot-roll pill CTA button.
 */
function PricingCard({
  pkg,
  onSelect,
}: {
  pkg: PackageItem;
  onSelect: () => void;
}) {
  return (
    <div
      data-cursor="hover"
      className={`weighted-card group relative flex flex-col justify-between rounded-2xl border p-6 sm:p-7 transition-all duration-300 bg-[rgba(244,241,224,0.92)] backdrop-blur-[14px] shadow-[inset_0_1px_0_rgba(255,253,244,0.92),0_4px_16px_-4px_rgba(20,20,19,0.06)] ${
        pkg.popular
          ? "!border-[#9EE41A] shadow-[0_0_24px_rgba(158,228,26,0.18)]"
          : "border-[#141413]/12 hover:border-[#141413]/25"
      }`}
    >
      <div>
        {/* Header Row: Package Title + Unclipped POPULAR badge inside row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h4 className="text-[20px] font-bold tracking-tight text-[#0B0C0A]">
              {pkg.name}
            </h4>
            {pkg.tagline && (
              <p className="font-sans text-[13px] font-medium text-[#2E322B] mt-0.5">
                {pkg.tagline}
              </p>
            )}
          </div>
          {pkg.popular && (
            <span className="popular-badge flex-shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] bg-[#9EE41A] text-[#0B0C0A] border border-[#72B314]/30 shadow-sm">
              Popular
            </span>
          )}
        </div>

        {/* Pricing Line */}
        <div className="mt-4 mb-3 flex items-baseline gap-1.5">
          <span className="font-mono text-[clamp(28px,3vw,36px)] font-bold text-[#0B0C0A] tracking-tight">
            {pkg.price}
          </span>
          <span className="font-mono text-[12.5px] font-semibold text-[#2E322B]">
            / {pkg.unit}
          </span>
        </div>

        {/* Summary */}
        <p className="text-[15.5px] text-[#1C1E1A] font-medium min-h-[42px] leading-[1.6] mb-4 font-sans">
          {pkg.summary}
        </p>

        {/* Meta Badges: Turnaround & Revisions */}
        {(pkg.turnaround || pkg.revisions) && (
          <div className="flex flex-wrap gap-2 border-y border-[#141413]/[0.08] py-2.5 mb-4">
            {pkg.turnaround && (
              <span className="font-mono text-[11.5px] font-semibold text-[#1C1E1A] bg-[rgba(20,20,19,0.06)] px-2.5 py-1 rounded-md border border-[#141413]/[0.08]">
                ⏱ {pkg.turnaround}
              </span>
            )}
            {pkg.revisions && (
              <span className="font-mono text-[11.5px] font-semibold text-[#1C1E1A] bg-[rgba(20,20,19,0.06)] px-2.5 py-1 rounded-md border border-[#141413]/[0.08]">
                ↺ {pkg.revisions}
              </span>
            )}
          </div>
        )}

        {/* Deliverables with 1px solid rgba(20, 20, 19, 0.08) hairline dividers */}
        <div className="mt-4">
          <span className="font-sans text-[12.5px] uppercase tracking-[0.14em] text-[#2E322B] font-bold block mb-2.5">
            What's Included:
          </span>
          <ul className="flex flex-col divide-y divide-[#141413]/[0.08]">
            {pkg.features.map((feat, fIdx) => (
              <li
                key={fIdx}
                className="deliverable-row py-2.5 flex items-start gap-2.5 text-[14px] sm:text-[14.5px] text-[#1C1E1A] font-medium leading-snug"
              >
                <span className="h-4 w-4 rounded-full bg-[#84CC16]/20 border border-[#84CC16]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="h-2.5 w-2.5 text-[#4D7A0A]"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2.5 6.5 4.5 8.5 9.5 3.5" />
                  </svg>
                </span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Full-width anchored slot-roll pill CTA button */}
      <div className="mt-6 pt-4 border-t border-[#141413]/[0.08]">
        <button
          onClick={onSelect}
          className="group relative w-full inline-flex items-center justify-center rounded-full bg-[#141413] text-[#FBFBF6] py-3 px-5 font-mono text-xs uppercase tracking-wider font-semibold border border-[#141413] hover:border-[#9EE41A] hover:shadow-[0_0_20px_rgba(158,228,26,0.25)] transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98]"
        >
          {/* Internal diagonal specular sweep */}
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-0"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, rgba(158, 228, 26, 0.22) 50%, transparent 70%)",
            }}
            aria-hidden="true"
          />
          <span className="relative z-10 flex items-center gap-2">
            <span>Request this scope</span>
            <span className="text-[13px] transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
