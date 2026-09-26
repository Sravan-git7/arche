import { useEffect, useState } from "react";
import { services, type Service } from "../data/site";
import { projectsByService } from "../data/projects";
import { ProjectRow } from "../components/WorkIndex";
import { SCENES } from "../components/Scenes";
import { ServicePricing, serviceToBuildOption } from "../components/ServicePricing";
import { Link, usePage, navigate } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";

/**
 * Dedicated, unhurried service pages.
 * Each of the four services hosts:
 *   1. Full interactive instrument demo with dedicated space to test
 *   2. "How it works" breakdown in Arche's voice
 *   3. "What's typically included" deliverables list
 *   4. Dedicated transparent pricing & starting scopes
 *   5. Pre-filled CTA linking directly into Contact
 */
export function ServiceDetail({ slug }: { slug: string }) {
  const s = services.find((x) => x.slug === slug);
  usePage(s ? `${s.title} — Arche` : "Arche");
  useReveal();
  useParallax();
  const [sceneActive, setSceneActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSceneActive(true), 300);
    return () => clearTimeout(t);
  }, [slug]);

  if (!s) {
    return (
      <section className="flex min-h-[70svh] w-full items-center">
        <div className="wrap">
          <h1 className="d2">Service not found.</h1>
          <p className="body mt-[16px] text-[var(--muted)]">
            The requested service page does not exist or has moved.
          </p>
          <Link to="/services" className="btn mt-[24px]">
            All services <span className="arw">→</span>
          </Link>
        </div>
      </section>
    );
  }

  const Scene = SCENES[s.slug];
  const related = projectsByService(s.slug);
  const others = services.filter((x) => x.slug !== s.slug);

  const handleStartProject = () => {
    try {
      const buildOption = serviceToBuildOption[s.slug] || "Other";
      sessionStorage.setItem(
        "arche:prefill",
        JSON.stringify({
          service: s.slug,
          build: buildOption,
        })
      );
    } catch {
      /* ignore */
    }
    navigate("/contact");
  };

  const getDemoSubtitle = (serviceSlug: string) => {
    switch (serviceSlug) {
      case "video-editing":
        return "Scrub the playhead across the 7 production stages from raw camera footage to final master delivery.";
      case "web-development":
        return "Test the interactive build layers — from information architecture to live conversion and CRM lead dispatch.";
      case "ai-chatbots":
        return "Ask sample inquiries to observe grounded retrieval reasoning, tool execution, and automated escalation.";
      case "ai-automation":
        return "Compare manual multi-step repetition against the autonomous pipeline runner and observe the eliminated hand-offs.";
      default:
        return "Test the interactive model in real time.";
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------ */}
      {/* 1. HERO SECTION                                              */}
      {/* ------------------------------------------------------------ */}
      <section className="w-full pt-[130px] pb-[clamp(40px,5vw,70px)]">
        <div className="wrap">
          {/* Breadcrumb */}
          <div className="mb-[24px] flex items-center gap-[10px]">
            <Link to="/services" className="mono lnk text-[12px]">
              Services
            </Link>
            <span className="mono text-[var(--faint)]">/</span>
            <span className="mono mono-fg text-[12px]">{s.title}</span>
          </div>

          <div className="grid gap-[clamp(28px,4vw,60px)] md:grid-cols-12 items-start">
            <div className="md:col-span-7">
              <span className="numeral outline-t block mb-[8px]" style={{ fontSize: "clamp(56px,7vw,110px)" }} aria-hidden>
                {s.n}
              </span>
              <h1 className="d1 text-[clamp(40px,6.2vw,96px)]" data-r="mask">
                {s.title}
              </h1>
              <p className="d4 mt-[20px] max-w-[34ch] text-[var(--muted)]" data-r="meta" data-r-delay="80">
                {s.tagline}
              </p>

              {/* Transformation Arc */}
              <div className="mt-[28px] flex flex-wrap items-center gap-[10px]" data-r="meta" data-r-delay="120">
                {s.arc.map((a, k) => (
                  <span key={a} className="flex items-center gap-[10px]">
                    <span
                      className="mono text-[11px]"
                      style={{
                        padding: "6px 14px",
                        border: `1px solid ${k === s.arc.length - 1 ? "var(--accent-deep)" : "var(--line)"}`,
                        borderRadius: 999,
                        background: k === s.arc.length - 1 ? "rgba(127, 174, 0, 0.08)" : "var(--bg)",
                        color: k === s.arc.length - 1 ? "var(--accent-deep)" : "var(--muted)",
                        fontWeight: k === s.arc.length - 1 ? 600 : 400,
                      }}
                    >
                      {a}
                    </span>
                    {k < s.arc.length - 1 && <span className="mono text-[var(--muted)]">→</span>}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col justify-between h-full pt-[8px]">
              <p className="body text-[var(--fg)] leading-relaxed" data-r="meta">
                {s.desc}
              </p>

              <div className="mt-[32px] flex flex-wrap items-center gap-[14px]">
                <button
                  type="button"
                  className="btn btn-primary"
                  data-cursor="START"
                  onClick={handleStartProject}
                >
                  Start a {s.title} Project <span className="arw">→</span>
                </button>
                <a
                  href="#pricing"
                  className="btn btn-ghost"
                  data-cursor="CLICK"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  View Scopes & Pricing ↓
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 2. DEDICATED UNHURRIED INTERACTIVE DEMO STAGE                */}
      {/* ------------------------------------------------------------ */}
      <section className="w-full py-[clamp(50px,6vw,90px)]" style={{ background: "var(--bg-2)" }}>
        <div className="wrap">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] mb-[clamp(24px,3vw,36px)]">
            <div>
              <p className="mono mono-a mb-[10px]">Interactive Instrument</p>
              <h2 className="d2 max-w-[16ch]" data-r="mask">
                Try the {s.title} engine.
              </h2>
            </div>
            <p className="mono text-[11px] max-w-[48ch] text-[var(--muted)]">
              {getDemoSubtitle(s.slug)}
            </p>
          </div>

          {/* Expanded Demo Frame */}
          <div
            className="relative overflow-hidden rounded-[8px] border p-[clamp(16px,2vw,32px)] shadow-sm"
            style={{ borderColor: "var(--line)", background: "var(--bg)" }}
            data-r="fade"
          >
            {/* Stage Header Info */}
            <div className="mb-[20px] flex items-center justify-between border-b pb-[12px]" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-[10px]">
                <span className="block h-[7px] w-[7px] rounded-full bg-[var(--accent-deep)]" />
                <span className="mono text-[11px] font-semibold text-[var(--fg)]">
                  {s.n} · {s.title.toUpperCase()} DEMO
                </span>
              </div>
              <span className="mono text-[10px] text-[var(--muted)]">
                {s.arc.join(" → ")}
              </span>
            </div>

            {/* The Live Interactive Scene */}
            <div className="min-h-[280px]">
              <Scene active={sceneActive} />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 3. WHAT THIS SOLVES (THE FRICTION & PROBLEMS)               */}
      {/* ------------------------------------------------------------ */}
      <section className="w-full py-[clamp(60px,7vw,110px)]">
        <div className="wrap">
          <div className="mb-[clamp(28px,3.5vw,48px)] max-w-[620px]">
            <p className="mono mono-a mb-[10px]">What this solves</p>
            <h2 className="d2 max-w-[16ch]" data-r="mask">
              Friction removed at the source.
            </h2>
          </div>

          <div
            className="grid gap-px sm:grid-cols-2 rounded-[6px] overflow-hidden"
            style={{ background: "var(--line)", border: "1px solid var(--line)" }}
          >
            {s.problems.map((pr, i) => (
              <div
                key={pr}
                className="flex items-start gap-[14px] p-[clamp(20px,2.5vw,32px)]"
                style={{ background: "var(--bg)" }}
                data-r="meta"
                data-r-delay={i * 70}
              >
                <span className="mono text-[13px] font-bold text-[var(--accent-deep)] pt-[2px]">
                  0{i + 1}
                </span>
                <div>
                  <p className="d4 font-normal text-[var(--fg)] leading-snug">
                    {pr}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 4. HOW IT WORKS (3–4 STEPS IN ARCHE'S VOICE)                 */}
      {/* ------------------------------------------------------------ */}
      <section className="on-ink w-full py-[clamp(70px,8vw,130px)]">
        <div className="wrap grid gap-[clamp(36px,5vw,80px)] md:grid-cols-12">
          {/* Left: How it runs */}
          <div className="md:col-span-7">
            <p className="mono mb-[14px]" style={{ color: "var(--accent-deep)" }}>
              How it works
            </p>
            <h2 className="d2 mb-[32px] max-w-[16ch]" data-r="mask">
              A deliberate, phased sequence.
            </h2>

            <div className="flex flex-col">
              {s.process.map((st, i) => (
                <div
                  key={st.k}
                  className="flex gap-[20px] border-t py-[24px]"
                  style={{ borderColor: "var(--line)" }}
                  data-r="meta"
                  data-r-delay={i * 70}
                >
                  <span className="mono text-[13px] font-semibold" style={{ width: 32, color: "var(--accent-deep)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="d4 text-[clamp(18px,2vw,24px)] font-medium text-[var(--fg)]">
                      {st.k}
                    </h3>
                    <p className="body-s mt-[8px] text-[var(--muted)] leading-relaxed max-w-[48ch]">
                      {st.v}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: What you receive / Deliverables */}
          <div className="md:col-span-5 md:border-l md:pl-[clamp(24px,3.5vw,50px)]" style={{ borderColor: "var(--line)" }}>
            <p className="mono mb-[14px]" style={{ color: "var(--accent-deep)" }}>
              What you receive
            </p>
            <h2 className="d3 mb-[28px]" data-r="mask">
              Scope-based deliverables.
            </h2>

            <ul className="m-0 flex list-none flex-col gap-[14px] p-0 mb-[32px]">
              {s.deliverables.map((d, i) => (
                <li
                  key={d}
                  className="flex items-start gap-[12px] border-t pt-[14px]"
                  style={{ borderColor: "var(--line)" }}
                  data-r="meta"
                  data-r-delay={i * 60}
                >
                  <span className="mono text-[var(--accent-deep)] font-bold">✓</span>
                  <p className="body-s text-[var(--fg)] leading-snug">{d}</p>
                </li>
              ))}
            </ul>

            <div className="rounded-[6px] border p-[16px_20px]" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <span className="mono text-[10px] uppercase tracking-wider block mb-[4px]" style={{ color: "var(--accent-deep)" }}>
                Timeline & SLA
              </span>
              <p className="mono text-[12px] text-[var(--fg)]">
                {s.turnaround}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 5. PRICING & STARTING SCOPES BLOCK (PROMPT 27 INTEGRATION)   */}
      {/* ------------------------------------------------------------ */}
      <div id="pricing">
        <ServicePricing slug={s.slug} />
      </div>

      {/* ------------------------------------------------------------ */}
      {/* 6. SELECTED WORK IN PRACTICE                                 */}
      {/* ------------------------------------------------------------ */}
      {related.length > 0 && (
        <section className="w-full py-[clamp(60px,7vw,110px)]">
          <div className="wrap">
            <div className="mb-[24px] flex items-end justify-between border-b pb-[14px]" style={{ borderColor: "var(--line)" }}>
              <div>
                <p className="mono mono-a mb-[8px]">Selected work</p>
                <h2 className="d3" data-r="mask">
                  {s.title} in practice.
                </h2>
              </div>
              <Link to="/work" className="mono lnk text-[12px]" cursor="VIEW">
                All work →
              </Link>
            </div>

            <div className="flex flex-col">
              {related.map((p, i) => (
                <ProjectRow key={p.slug} p={p} i={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/* 7. OTHER SERVICES                                            */}
      {/* ------------------------------------------------------------ */}
      <section className="w-full pb-[clamp(60px,8vw,110px)]">
        <div className="wrap">
          <div className="mb-[20px] flex items-baseline justify-between">
            <p className="mono mono-a">Other services</p>
            <Link to="/services" className="mono lnk text-[12px]">
              View all services →
            </Link>
          </div>

          <div
            className="grid gap-px sm:grid-cols-3 rounded-[6px] overflow-hidden"
            style={{ background: "var(--line)", border: "1px solid var(--line)" }}
          >
            {others.map((o) => (
              <Link
                key={o.slug}
                to={`/services/${o.slug}`}
                className="group flex flex-col justify-between gap-[16px] p-[clamp(20px,2.2vw,30px)] transition-all duration-300"
                style={{ background: "var(--bg)" }}
                cursor="OPEN"
              >
                <div>
                  <span className="mono text-[11px] block text-[var(--muted)] mb-[8px]">{o.n}</span>
                  <span className="d4 block transition-colors duration-300 group-hover:text-[var(--accent-deep)] font-medium">
                    {o.title}
                  </span>
                  <span className="body-s text-[var(--muted)] block mt-[6px] leading-snug">
                    {o.tagline}
                  </span>
                </div>
                <span className="mono text-[11px] text-[var(--accent-deep)] group-hover:translate-x-1 transition-transform inline-flex items-center gap-[4px]">
                  Explore {o.short} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 8. DEDICATED PREFILLED CTA FOOTER                           */}
      {/* ------------------------------------------------------------ */}
      <section className="w-full py-[clamp(60px,8vw,120px)] border-t" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
        <div className="wrap flex flex-col items-center text-center max-w-[720px]">
          <p className="mono mono-a mb-[14px]">Ready to begin?</p>
          <h2 className="d2 max-w-[14ch]" data-r="mask">
            Start your {s.title} build.
          </h2>
          <p className="body mt-[16px] text-[var(--muted)] leading-relaxed">
            Every engagement starts with one conversation. Tell us where the friction is, and we'll draft an honest scope and roadmap.
          </p>
          <button
            type="button"
            className="btn btn-primary mt-[28px] text-[13px] py-[12px] px-[24px]"
            data-cursor="START"
            onClick={handleStartProject}
          >
            Start a {s.title} Project <span className="arw">→</span>
          </button>
        </div>
      </section>
    </>
  );
}
