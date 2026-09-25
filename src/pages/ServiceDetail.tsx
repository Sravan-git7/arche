import { services } from "../data/site";
import { projectsByService } from "../data/projects";
import { ProjectRow } from "../components/WorkIndex";
import { SCENES } from "../components/Scenes";
import { FinalCTA } from "../components/Sections";
import { Link, usePage, navigate } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";
import { useEffect, useState } from "react";

/**
 * Service pages share one data-driven structure but each opens with its
 * own scene instrument and arc — the mechanics of the service itself.
 */
export function ServiceDetail({ slug }: { slug: string }) {
  const s = services.find((x) => x.slug === slug);
  usePage(s ? s.seo.title : "Arche");
  useReveal();
  useParallax();
  const [sceneOn, setSceneOn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSceneOn(true), 500);
    return () => clearTimeout(t);
  }, [slug]);

  if (!s) {
    return (
      <section className="flex min-h-[70svh] w-full items-center">
        <div className="wrap">
          <h1 className="d2">Not found.</h1>
          <Link to="/services" className="btn mt-[20px]">
            All services
          </Link>
        </div>
      </section>
    );
  }

  const Scene = SCENES[s.slug];
  const related = projectsByService(s.slug);
  const others = services.filter((x) => x.slug !== s.slug);

  return (
    <>
      {/* hero */}
      <section className="w-full pt-[130px] pb-[clamp(40px,5vw,80px)]">
        <div className="wrap">
          <div className="mb-[22px] flex items-center gap-[12px]">
            <Link to="/services" className="mono lnk">
              Services
            </Link>
            <span className="mono">/</span>
            <span className="mono mono-fg">{s.title}</span>
          </div>

          <div className="grid items-end gap-[clamp(26px,4vw,64px)] md:grid-cols-12">
            <div className="md:col-span-6">
              <span className="numeral outline-t block" style={{ fontSize: "clamp(64px,8vw,140px)" }} aria-hidden>
                {s.n}
              </span>
              <h1 className="d1" style={{ fontSize: "clamp(40px,6.4vw,104px)" }} data-r="mask">
                {s.title}
              </h1>
              <p className="d4 mt-[18px] max-w-[26ch]" data-r="meta" data-r-delay="100" style={{ color: "var(--muted)" }}>
                {s.tagline}
              </p>
            </div>
            <div className="md:col-span-6">
              <div
                className="relative overflow-hidden px-[clamp(10px,1.4vw,22px)] py-[clamp(14px,1.8vw,28px)]"
                style={{ background: "var(--bg-2)", borderRadius: 4 }}
                data-r="fade"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-[14px] pt-[12px]">
                  <span className="mono">{s.arc[0]}</span>
                  <span className="mono mono-a">● {s.arc[s.arc.length - 1]}</span>
                </div>
                <Scene active={sceneOn} />
              </div>
            </div>
          </div>

          {/* arc + description */}
          <div className="mt-[clamp(30px,4vw,56px)] grid gap-[24px] border-t pt-[24px] md:grid-cols-12" style={{ borderColor: "var(--line)" }}>
            <div className="flex flex-wrap items-center gap-[8px] md:col-span-5" data-r="meta">
              {s.arc.map((a, k) => (
                <span key={a} className="flex items-center gap-[8px]">
                  <span
                    className="mono"
                    style={{
                      padding: "5px 11px",
                      border: `1px solid ${k === s.arc.length - 1 ? "var(--accent-deep)" : "var(--line)"}`,
                      borderRadius: 999,
                      color: k === s.arc.length - 1 ? "var(--accent-deep)" : "var(--muted)",
                    }}
                  >
                    {a}
                  </span>
                  {k < s.arc.length - 1 && <span className="mono">→</span>}
                </span>
              ))}
            </div>
            <p className="body md:col-span-7" data-r="meta" data-r-delay="80">
              {s.desc}
            </p>
          </div>
        </div>
      </section>

      {/* problems */}
      <section className="w-full py-[clamp(50px,6vw,90px)]" style={{ background: "var(--bg-2)" }}>
        <div className="wrap grid gap-[24px] md:grid-cols-12">
          <p className="mono mono-a md:col-span-3">What this solves</p>
          <div className="grid gap-px sm:grid-cols-2 md:col-span-9" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
            {s.problems.map((pr, i) => (
              <div key={pr} className="flex items-start gap-[12px] p-[18px]" style={{ background: "var(--bg-2)" }} data-r="meta" data-r-delay={i * 70}>
                <span className="mono mono-a pt-[2px]">×</span>
                <p className="body">{pr}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* offerings */}
      <section className="w-full py-[clamp(60px,8vw,120px)]">
        <div className="wrap">
          <p className="mono mono-a mb-[12px]">What we create</p>
          <h2 className="d2 mb-[clamp(28px,3.6vw,56px)] max-w-[16ch]" data-r="mask">
            The work, precisely scoped.
          </h2>
          <div className="flex flex-col">
            {s.offerings.map((o, i) => (
              <div key={o.k} className="grid gap-[10px] border-t py-[clamp(18px,2.2vw,30px)] md:grid-cols-12" style={{ borderColor: "var(--line)" }}>
                <span className="mono pt-[6px] md:col-span-1" data-r="meta">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="d3 md:col-span-5" data-r="mask" data-r-delay="40">
                  {o.k}
                </h3>
                <p className="body max-w-[46ch] md:col-span-6" data-r="meta" data-r-delay="100">
                  {o.v}
                </p>
              </div>
            ))}
            <span className="block h-px w-full" style={{ background: "var(--line)" }} />
          </div>
        </div>
      </section>

      {/* process + deliverables */}
      <section className="on-ink w-full py-[clamp(60px,8vw,120px)]">
        <div className="wrap grid gap-[clamp(32px,5vw,90px)] md:grid-cols-2">
          <div>
            <p className="mono mb-[18px]" style={{ color: "var(--accent-deep)" }}>
              How it runs
            </p>
            <div className="flex flex-col">
              {s.process.map((st, i) => (
                <div key={st.k} className="flex gap-[18px] border-t py-[18px]" style={{ borderColor: "var(--line)" }} data-r="meta" data-r-delay={i * 70}>
                  <span className="mono" style={{ width: 26, color: "var(--accent-deep)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="d4">{st.k}</h3>
                    <p className="body-s mt-[4px]">{st.v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mono mb-[18px]" style={{ color: "var(--accent-deep)" }}>
              What you receive
            </p>
            <ul className="m-0 flex list-none flex-col p-0">
              {s.deliverables.map((d, i) => (
                <li key={d} className="flex items-start gap-[12px] border-t py-[16px]" style={{ borderColor: "var(--line)" }} data-r="meta" data-r-delay={i * 70}>
                  <span className="mono" style={{ color: "var(--accent-deep)" }}>
                    ✓
                  </span>
                  <p className="body">{d}</p>
                </li>
              ))}
            </ul>
            <p className="mono mt-[20px]" data-r="meta">
              {s.turnaround}
            </p>
          </div>
        </div>
      </section>

      {/* packages */}
      <section className="w-full py-[clamp(60px,8vw,120px)]">
        <div className="wrap">
          <p className="mono mono-a mb-[12px]">Engagement</p>
          <h2 className="d2 mb-[clamp(26px,3.4vw,50px)] max-w-[18ch]" data-r="mask">
            Defined starting scopes, quoted to fit.
          </h2>
          <div className="grid gap-[16px] md:grid-cols-3">
            {s.packages.map((p, i) => (
              <div key={p.name} className="flex flex-col gap-[16px] border p-[clamp(18px,2vw,28px)]" style={{ borderColor: "var(--line)", background: "var(--card)", borderRadius: 6 }} data-r="meta" data-r-delay={i * 90}>
                <div className="flex items-baseline justify-between">
                  <h3 className="d4">{p.name}</h3>
                  <span className="mono mono-a">Starting scope</span>
                </div>
                <div>
                  <span className="d3">{p.price}</span>
                  <span className="mono ml-[8px]">{p.unit}</span>
                </div>
                <ul className="m-0 flex list-none flex-col gap-[8px] p-0">
                  {p.includes.map((inc) => (
                    <li key={inc} className="body-s flex items-start gap-[8px]">
                      <span className="mono mono-a">—</span> {inc}
                    </li>
                  ))}
                </ul>
                <button
                  className="btn mt-auto"
                  data-cursor="START"
                  onClick={() => {
                    try {
                      sessionStorage.setItem("arche:prefill", JSON.stringify({ service: s.slug, pkg: p.name }));
                    } catch {
                      /* fine */
                    }
                    navigate("/contact");
                  }}
                >
                  Request this package <span className="arw">→</span>
                </button>
                {p.deposit && <p className="mono">Deposit to schedule: {p.deposit}</p>}
              </div>
            ))}
            {/* custom */}
            <div className="flex flex-col gap-[16px] border border-dashed p-[clamp(18px,2vw,28px)]" style={{ borderColor: "var(--faint)", borderRadius: 6 }} data-r="meta" data-r-delay={s.packages.length * 90}>
              <div className="flex items-baseline justify-between">
                <h3 className="d4">Custom project</h3>
                <span className="mono">Quoted</span>
              </div>
              <p className="body">
                Larger scope, integrations, or something that doesn't fit a package. Scope, timeline and investment in writing before anything starts.
              </p>
              <button
                className="btn btn-ghost mt-auto"
                data-cursor="START"
                onClick={() => {
                  try {
                    sessionStorage.setItem("arche:prefill", JSON.stringify({ service: s.slug, pkg: "Custom" }));
                  } catch {
                    /* fine */
                  }
                  navigate("/contact");
                }}
              >
                Request a custom quote <span className="arw">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* selected work */}
      <section className="w-full pb-[clamp(60px,8vw,120px)]">
        <div className="wrap">
          <div className="mb-[10px] flex items-end justify-between">
            <div>
              <p className="mono mono-a mb-[10px]">Selected work</p>
              <h2 className="d3" data-r="mask">
                {s.title} in practice.
              </h2>
            </div>
            <Link to="/work" className="mono mono-fg lnk">
              All work →
            </Link>
          </div>
          <div className="flex flex-col">
            {related.map((p, i) => (
              <ProjectRow key={p.slug} p={p} i={i} />
            ))}
          </div>
          <span className="block h-px w-full" style={{ background: "var(--line)" }} />
        </div>
      </section>

      {/* other services */}
      <section className="w-full pb-[clamp(60px,8vw,110px)]">
        <div className="wrap">
          <p className="mono mono-a mb-[16px]">Other services</p>
          <div className="grid gap-px sm:grid-cols-3" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
            {others.map((o) => (
              <Link key={o.slug} to={`/services/${o.slug}`} className="group flex flex-col gap-[8px] p-[18px]" style={{ background: "var(--bg)" }} cursor="OPEN">
                <span className="mono">{o.n}</span>
                <span className="d4 transition-colors duration-300 group-hover:text-[var(--accent-deep)]">{o.title}</span>
                <span className="body-s">{o.tagline}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
