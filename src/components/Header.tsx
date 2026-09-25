import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./Wordmark";
import { siteContent, services } from "../data/site";
import { Link, navigate, useRoute } from "../lib/router";
import { gsap } from "../lib/gsap";

export function Header() {
  const nav = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [svcOpen, setSvcOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const last = useRef(0);
  const route = useRoute();

  // The nav is a fixed anchor: it appears instantly, fully formed (no load animation).

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      if (nav.current && !open) {
        const hide = y > 260 && y > last.current;
        gsap.to(nav.current, {
          yPercent: hide ? -110 : 0,
          duration: 0.55,
          ease: "expo.out",
          overwrite: true,
        });
        if (hide) setSvcOpen(false);
      }
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // close everything on route change
  useEffect(() => {
    setOpen(false);
    setSvcOpen(false);
  }, [route]);

  /*
   * PROMPT 20 — nav hover preview → Services tab.
   * A thumbnail click lands on the Services section with that service's
   * tab already committed (sessionStorage carries it across a route
   * change; the event covers same-page jumps).
   */
  const gotoService = (slug: string) => {
    setSvcOpen(false);
    try {
      sessionStorage.setItem("arche:svcTab", slug);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("arche:select-service", { detail: slug }));
    if (route !== "/") {
      navigate("/");
    } else {
      document.getElementById("services-home")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const { links, cta } = siteContent.nav;
  const active = (to: string) =>
    to === "/" ? route === "/" : route === to || route.startsWith(`${to}/`);

  return (
    <>
      <nav
        ref={nav}
        className="fixed top-0 left-0 z-[100] w-full"
        style={{
          background: solid ? "rgba(244,242,237,0.82)" : "transparent",
          backdropFilter: solid ? "blur(14px)" : "none",
          borderBottom: `1px solid ${solid ? "var(--line)" : "transparent"}`,
          transition: "background .5s var(--e-out), border-color .5s var(--e-out)",
        }}
        onMouseLeave={() => setSvcOpen(false)}
      >
        <div className="wrap flex items-center justify-between py-[16px]">
          <Link to="/" className="relative z-[110]">
            <Wordmark />
          </Link>

          {/* desktop */}
          <div className="hidden items-center gap-[34px] md:flex">
            {links.map((l) =>
              l.label === "Services" ? (
                <button
                  key={l.label}
                  className="mono mono-fg relative flex items-center gap-[7px]"
                  aria-expanded={svcOpen}
                  onMouseEnter={() => setSvcOpen(true)}
                  onClick={() => setSvcOpen((v) => !v)}
                >
                  {l.label}
                  <span
                    style={{
                      display: "inline-block",
                      transition: "transform .4s var(--e-out)",
                      transform: svcOpen ? "rotate(45deg)" : "none",
                      fontSize: 13,
                    }}
                  >
                    +
                  </span>
                  <ActiveDot on={active(l.to)} />
                </button>
              ) : (
                <Link key={l.label} to={l.to} className="mono mono-fg relative">
                  <span className="roll" style={{ height: 14 }}>
                    <span>{l.label}</span>
                    <span aria-hidden style={{ color: "var(--accent-deep)" }}>
                      {l.label}
                    </span>
                  </span>
                  <ActiveDot on={active(l.to)} />
                </Link>
              )
            )}
            <Link to={cta.to} className="btn" cursor="START" data-magnetic>
              {cta.label} <span className="arw">→</span>
            </Link>
          </div>

          {/* mobile toggle */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative z-[110] flex h-[38px] w-[38px] flex-col items-center justify-center gap-[6px] md:hidden"
          >
            <span
              className="block h-[1.5px] w-[22px]"
              style={{
                background: "var(--fg)",
                transition: "transform .45s var(--e-out)",
                transform: open ? "translateY(3.75px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block h-[1.5px] w-[22px]"
              style={{
                background: "var(--fg)",
                transition: "transform .45s var(--e-out)",
                transform: open ? "translateY(-3.75px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>

        {/* services drawer (desktop) — live idle previews; a thumbnail
            click jumps to that service's tab in the Services section */}
        <div
          className="hidden overflow-hidden md:block"
          style={{
            maxHeight: svcOpen ? 340 : 0,
            transition: "max-height .6s var(--e-inout)",
            background: "rgba(244,242,237,0.94)",
            backdropFilter: "blur(14px)",
            borderBottom: svcOpen ? "1px solid var(--line)" : "none",
          }}
        >
          <div className="wrap grid grid-cols-4 gap-[18px] py-[26px]">
            {services.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => gotoService(s.slug)}
                className="group flex flex-col gap-[8px] border-t pt-[14px] text-left"
                style={{
                  borderColor: "var(--line)",
                  opacity: svcOpen ? 1 : 0,
                  transform: svcOpen ? "translateY(0)" : "translateY(10px)",
                  transition: `opacity .45s var(--e-out) ${80 + i * 55}ms, transform .45s var(--e-out) ${80 + i * 55}ms`,
                }}
                data-cursor="OPEN"
              >
                <span className="mono">{s.n}</span>
                <span className="d4 transition-colors duration-300 group-hover:text-[var(--accent-deep)]">
                  {s.title}
                </span>
                <span className="body-s">{s.tagline}</span>
                {svcOpen && <ServicePreview slug={s.slug} />}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* mobile overlay */}
      <div
        className="fixed inset-0 z-[99] md:hidden"
        aria-hidden={!open}
        style={{
          background: "var(--bg)",
          pointerEvents: open ? "auto" : "none",
          clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
          transition: "clip-path .7s var(--e-inout)",
        }}
      >
        <div className="wrap flex h-full flex-col justify-between overflow-y-auto pt-[96px] pb-[30px]">
          <div className="flex flex-col">
            {links
              .filter((l) => l.label !== "Services")
              .map((l, i) => (
                <MobileItem key={l.label} open={open} i={i}>
                  <Link to={l.to} className="d3 block border-b py-[16px]" style={{ borderColor: "var(--line)" }}>
                    {l.label}
                  </Link>
                </MobileItem>
              ))}
            <MobileItem open={open} i={2}>
              <p className="mono mt-[26px] mb-[6px]">Services</p>
            </MobileItem>
            {services.map((s, i) => (
              <MobileItem key={s.slug} open={open} i={3 + i}>
                <Link
                  to={`/services/${s.slug}`}
                  className="flex items-baseline gap-[14px] border-b py-[13px]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span className="mono mono-a">{s.n}</span>
                  <span className="d4">{s.title}</span>
                </Link>
              </MobileItem>
            ))}
          </div>
          <div className="mt-[26px] flex flex-col gap-[14px]">
            <Link to={cta.to} className="btn w-full justify-center" data-magnetic>
              {cta.label} <span className="arw">→</span>
            </Link>
            <p className="mono">{siteContent.brand.discipline}</p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * PROMPT 20 — live idle preview for the nav drawer. Each service gets a
 * small looping vignette of its idle state — enough motion to preview,
 * never the full interactive demo. Mounted only while the drawer is open.
 */
function ServicePreview({ slug }: { slug: string }) {
  if (slug === "video-editing") {
    return (
      <span className="relative mt-[4px] block h-[30px] w-full max-w-[96px] overflow-hidden rounded-[3px] border" style={{ borderColor: "var(--line)" }} aria-hidden>
        <span className="absolute inset-0 flex items-center justify-center gap-[2px]">
          {[6, 11, 8, 15, 10, 17, 12, 9, 14, 7].map((h, i) => (
            <span
              key={i}
              className="tv-bar block w-[2px] rounded-full"
              style={{ height: h, background: i === 5 ? "var(--accent-deep)" : "var(--line)", animationDelay: `${i * 80}ms` }}
            />
          ))}
        </span>
        <span className="tv-head absolute top-0 bottom-0 w-px" style={{ background: "var(--accent)" }} />
      </span>
    );
  }
  if (slug === "web-development") {
    return (
      <span className="mt-[4px] flex h-[30px] w-full max-w-[96px] flex-col justify-center gap-[3px]" aria-hidden>
        <span className="tv-block-1 block h-[4px] w-[60%] rounded-full" style={{ background: "var(--line)" }} />
        <span className="tv-block-2 block h-[9px] w-[80%] rounded-[2px]" style={{ background: "var(--line)" }} />
        <span className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="tv-block-3 block h-[8px] flex-1 rounded-[2px]"
              style={{ background: i === 1 ? "var(--accent-deep)" : "var(--line)", animationDelay: `${i * 120}ms`, opacity: i === 1 ? 0.6 : 1 }}
            />
          ))}
        </span>
      </span>
    );
  }
  if (slug === "ai-chatbots") {
    return (
      <span className="mt-[4px] flex h-[30px] w-full max-w-[96px] flex-col justify-center gap-[4px]" aria-hidden>
        <span className="tv-q block h-[7px] w-[55%] rounded-full" style={{ background: "var(--line)" }} />
        <span className="tv-a ml-auto block h-[7px] w-[70%] rounded-full" style={{ background: "var(--accent-deep)" }} />
        <span className="tv-q block h-[7px] w-[40%] rounded-full" style={{ background: "var(--line)", animationDelay: ".9s" }} />
      </span>
    );
  }
  return (
    <span className="relative mt-[4px] block h-[30px] w-full max-w-[96px]" aria-hidden>
      <svg viewBox="0 0 96 30" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M 12 6 L 84 6 L 84 24 L 12 24 Z" stroke="var(--line)" strokeWidth="1" />
        {[
          [12, 6],
          [84, 6],
          [84, 24],
          [12, 24],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.4" fill="var(--bg)" stroke={i === 2 ? "var(--accent-deep)" : "var(--fg)"} strokeWidth="1" />
        ))}
        <circle className="tv-runner" r="2" fill="var(--accent)" style={{ offsetPath: 'path("M 12 6 L 84 6 L 84 24 L 12 24 Z")' }} />
      </svg>
    </span>
  );
}

function ActiveDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        bottom: -9,
        width: 4,
        height: 4,
        borderRadius: 99,
        background: "var(--accent-deep)",
        transform: `translateX(-50%) scale(${on ? 1 : 0})`,
        transition: "transform .4s var(--e-out)",
      }}
    />
  );
}

function MobileItem({ open, i, children }: { open: boolean; i: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(16px)",
        transition: `opacity .5s var(--e-out) ${120 + i * 50}ms, transform .5s var(--e-out) ${120 + i * 50}ms`,
      }}
    >
      {children}
    </div>
  );
}
