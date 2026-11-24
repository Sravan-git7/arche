import { useEffect } from "react";
import { STUDIO_INFO } from "../data/services";
import { SERVICE_DETAILS } from "../data/serviceDetails";
import { DownloadButton } from "../components/DownloadButton";
import { Link, usePage } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";
import { attachCardTilt } from "../motion/cardTilt";

const BENTO_VERTICALS = [
  SERVICE_DETAILS["video-editing"],
  SERVICE_DETAILS["web-development"],
  SERVICE_DETAILS["ai-chatbots"],
  SERVICE_DETAILS["ai-automation"],
];

export function ServicesIndexPage() {
  usePage("Services & Capabilities | ARCHE Creative Studios");
  useReveal();
  useParallax();

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".weighted-card").forEach((el) => {
      cleanups.push(attachCardTilt(el));
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* 1. HERO OVERVIEW SECTION (pt-28 md:pt-32 clearing floating nav)   */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative w-full pt-28 md:pt-32 pb-12 md:pb-16 border-b border-[#141413]/[0.08]">
        <div className="wrap">
          {/* Frosted-Glass Eyebrow Pill Box */}
          <div className="mb-4 inline-block">
            <div className="glass-eyebrow-pill">
              <span className="h-[5px] w-[5px] rounded-full bg-[#84CC16] shadow-[0_0_8px_#84CC16] flex-shrink-0" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#232620]">
                ARCHÉ CREATIVE STUDIOS // CAPABILITIES
              </span>
            </div>
          </div>

          <h1 className="text-[clamp(2.75rem,5.2vw,4.5rem)] font-bold tracking-[-0.038em] leading-[0.98] text-[#11120F] max-w-[20ch]">
            <span className="shiny-ink-text">The Connected System.</span> <br />
            <span className="headline-secondary-shine">04 Core Verticals.</span>
          </h1>

          <p
            className="mt-5 max-w-[62ch] text-[#484C45] text-[clamp(16px,1.5vw,19.5px)] leading-relaxed font-sans"
            data-r="meta"
          >
            From cinematic video editing and sub-35ms web architecture to document-grounded AI chatbots and autonomous multi-app pipelines, Arché engineers all four disciplines as one continuous system.
          </p>

          {/* Prominent Catalogue Download Banner */}
          <div
            className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-[24px] border border-[#141413]/[0.10] bg-[#F4F1E0]/95 backdrop-blur-md p-6 sm:p-8 shadow-sm weighted-card"
            data-r="meta"
            data-r-delay="200"
          >
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#72B314] font-bold">
                  STUDIO ARCHITECTURE GUIDE
                </span>
                <span className="h-1 w-1 rounded-full bg-[#141413]/30" />
                <span className="font-mono text-[10px] text-[#595C56]">4 Verticals · Pricing · Scope Frameworks</span>
              </div>
              <h3 className="font-bold text-lg text-[#141413]">
                The Complete Arché Service &amp; Pricing Catalogue
              </h3>
              <p className="text-xs text-[#595C56] mt-1 max-w-[56ch] leading-relaxed">
                Download our comprehensive PDF guide containing full tier breakdowns, deliverables, turnaround schedules, and commercial terms.
              </p>
            </div>

            <DownloadButton
              filename={STUDIO_INFO.completeCataloguePdf}
              label="Download Complete Catalogue"
              variant="primary"
              className="py-3 px-6 text-xs font-semibold"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. CLEAN 2x2 HAIRLINE-DIVIDED #F4F1E0 BENTO DIRECTORY            */}
      {/* ---------------------------------------------------------------- */}
      <section className="w-full py-16 md:py-24 bg-transparent">
        <div className="wrap">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="glass-eyebrow-pill mb-2">
                <span className="h-[4px] w-[4px] rounded-full bg-[#84CC16]" />
                <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#232620]">
                  SELECT A VERTICAL
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#11120F]">
                <span className="shiny-ink-text">Explore dedicated</span>{" "}
                <span className="headline-secondary-shine">service deep-dives.</span>
              </h2>
            </div>
            <p className="font-mono text-xs text-[#595C56]">
              Detailed scope, live interactive stages, and INR tiers
            </p>
          </div>

          {/* 2x2 Grid of Bento Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {BENTO_VERTICALS.map((service) => (
              <Link
                key={service.slug}
                to={`/services/${service.slug}`}
                className="rounded-[28px] p-7 sm:p-9 bg-[#F4F1E0] border border-[#141413]/[0.10] shadow-[0_12px_36px_rgba(20,20,19,0.04)] hover:border-[#72B314]/40 hover:shadow-[0_20px_54px_rgba(20,20,19,0.08)] flex flex-col justify-between transition-all group weighted-card relative"
              >
                <div>
                  {/* Top Bar with Numeral and Category */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#141413]/[0.08]">
                    <div className="flex items-center gap-3">
                      <span
                        className="font-mono font-extrabold text-2xl leading-none"
                        style={{
                          background: "linear-gradient(180deg, #090A08 0%, #242721 45%, #7E8479 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {service.n}
                      </span>
                      <span className="font-mono text-[10.5px] font-bold tracking-widest text-[#72B314] uppercase">
                        {service.categoryTag}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#E5E2D0] group-hover:bg-[#141413] flex items-center justify-center transition-colors shadow-sm">
                      <span className="font-mono text-xs text-[#141413] group-hover:text-[#9EE41A] transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transform">
                        ↗
                      </span>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-2xl font-bold text-[#141413] mt-5 group-hover:text-[#72B314] transition-colors tracking-tight">
                    {service.title}
                  </h3>

                  <p className="mt-2.5 text-sm text-[#484C45] leading-relaxed">
                    {service.valuePromise}
                  </p>

                  {/* Highlights Pill Cluster */}
                  <div className="mt-6 pt-4 border-t border-[#141413]/[0.06] flex flex-col gap-2">
                    <span className="font-mono text-[10px] text-[#595C56] uppercase tracking-wider font-semibold">
                      Key Deliverables:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#141413]/85">
                      {service.whatsIncludedCard.deliverables.slice(0, 4).map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[#72B314] font-bold">✓</span>
                          <span className="truncate">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Starting Rate & Explore Button */}
                <div className="mt-8 pt-4 border-t border-[#141413]/[0.08] flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#595C56] uppercase block">
                      Starting Investment
                    </span>
                    <span className="font-mono text-sm font-bold text-[#141413]">
                      From {service.whatsIncludedCard.startingAt}{" "}
                      <span className="text-[11px] font-normal text-[#595C56]">
                        {service.whatsIncludedCard.unit}
                      </span>
                    </span>
                  </div>

                  <span className="font-mono text-xs font-semibold text-[#141413] group-hover:text-[#72B314] flex items-center gap-1">
                    <span>Explore Deep Dive</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3. GENERAL DISCLAIMER & INQUIRY CTA                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="w-full border-t border-[#141413]/[0.08] py-12 bg-transparent">
        <div className="wrap flex flex-col md:flex-row items-baseline justify-between gap-6">
          <div className="max-w-[720px]">
            <p className="font-mono text-[11px] text-[#72B314] uppercase tracking-wider font-semibold mb-2">
              ● Transparency &amp; Scope
            </p>
            <p className="text-xs sm:text-sm text-[#595C56] leading-relaxed">
              {STUDIO_INFO.generalDisclaimer}
            </p>
          </div>
          <Link
            to="/contact"
            className="h-11 px-6 rounded-full bg-[#141413] text-[#FBFBF6] hover:text-[#9EE41A] font-sans text-xs font-semibold flex items-center gap-2 transition-all self-start md:self-auto shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Start a Project</span>
            <span className="font-mono">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
