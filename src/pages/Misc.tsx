import { services } from "../data/site";
import { WorkIndex } from "../components/WorkIndex";
import { SCENES } from "../components/Scenes";
import { FinalCTA } from "../components/Sections";
import { Link, usePage } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";
import { useEffect, useRef, useState } from "react";

/* ================= /services — services index ============ */
export function ServicesIndex() {
  usePage("Services — Arche");
  useReveal();
  useParallax();

  return (
    <>
      <section className="w-full pt-[130px] pb-[clamp(40px,5vw,70px)]">
        <div className="wrap">
          <p className="mono mono-a mb-[14px]">Services</p>
          <h1 className="d1 max-w-[14ch]" data-r="mask">
            Systems built around how your business actually works.
          </h1>
          <p className="body mt-[22px] max-w-[54ch]" data-r="meta" data-r-delay="120">
            From automation and AI agents to websites and video, Arche builds the systems that
            remove friction, create leverage and help businesses move faster.
          </p>
        </div>
      </section>

      <section className="w-full pb-[clamp(60px,8vw,120px)]">
        <div className="wrap flex flex-col gap-[clamp(28px,3.6vw,56px)]">
          {services.map((s, i) => (
            <ServiceCard key={s.slug} slug={s.slug} flip={i % 2 === 1} />
          ))}
        </div>
      </section>

      <FinalCTA />
    </>
  );
}

function ServiceCard({ slug, flip }: { slug: string; flip: boolean }) {
  const s = services.find((x) => x.slug === slug)!;
  const Scene = SCENES[slug];
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`grid items-center gap-[clamp(22px,3vw,56px)] border-t pt-[clamp(26px,3.4vw,50px)] md:grid-cols-2 ${flip ? "md:[&>*:first-child]:order-2" : ""}`}
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex flex-col gap-[16px]">
        <div className="flex items-baseline gap-[14px]">
          <span className="numeral outline-t" style={{ fontSize: "clamp(44px,5vw,84px)" }}>
            {s.n}
          </span>
          <h2 className="d2" style={{ fontSize: "clamp(28px,3.4vw,54px)" }} data-r="mask">
            {s.title}
          </h2>
        </div>
        <p className="body max-w-[46ch]" data-r="meta" data-r-delay="80">
          {s.tagline} {s.desc}
        </p>
        <Link to={`/services/${s.slug}`} className="btn self-start" cursor="OPEN">
          Explore {s.title} <span className="arw">→</span>
        </Link>
      </div>
      <div className="border p-[clamp(14px,1.6vw,26px)]" style={{ borderColor: "var(--line)", background: "var(--card)", borderRadius: 6 }} data-r="fade">
        <Scene active={active} />
      </div>
    </div>
  );
}

/* ================= /work — the portfolio index ====================== */
export function WorkPage() {
  usePage("Work — Arche");
  useReveal();
  useParallax();

  return (
    <>
      <section className="w-full pt-[130px] pb-[clamp(30px,4vw,60px)]">
        <div className="wrap">
          <p className="mono mono-a mb-[14px]">Arche Labs</p>
          <h1 className="d1 max-w-[14ch]" data-r="mask">
            What the thinking looks like.
          </h1>
          <p className="body mt-[22px] max-w-[54ch]" data-r="meta" data-r-delay="120">
            Internal builds, prototypes and experiments — labelled honestly. Not client case
            studies. Each one shows how a capability is designed to operate.
          </p>
        </div>
      </section>

      <section className="w-full pb-[clamp(60px,8vw,120px)]">
        <div className="wrap">
          <WorkIndex />
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
