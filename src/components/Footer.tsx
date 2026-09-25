import { siteContent } from "../data/site";
import { Wordmark } from "./Wordmark";
import { Link } from "../lib/router";

export function Footer() {
  const f = siteContent.footer;

  return (
    <footer className="on-ink w-full border-t" style={{ borderColor: "var(--line)" }}>
      <div className="wrap py-[clamp(40px,4.6vw,70px)]">
        <div className="grid gap-[32px] md:grid-cols-12">
          <div className="flex flex-col gap-[12px] md:col-span-5">
            <Wordmark size={22} />
            <p className="mono max-w-[30ch]">{f.note}</p>
            <p className="body-s max-w-[36ch]">{siteContent.brand.line}</p>
          </div>

          {f.cols.map((col) => (
            <div key={col.t} className="flex flex-col gap-[12px] md:col-span-2">
              <p className="mono" style={{ color: "var(--accent-deep)" }}>
                {col.t}
              </p>
              <ul className="m-0 flex list-none flex-col gap-[7px] p-0">
                {col.l.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="body-s lnk">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-[12px] md:col-span-3">
            <p className="mono" style={{ color: "var(--accent-deep)" }}>
              Contact
            </p>
            <a href="mailto:hello@arche.studio" className="body-s lnk self-start">
              hello@arche.studio
            </a>
            <Link to="/contact" className="btn btn-ghost mt-[8px] self-start" cursor="START" style={{ borderColor: "var(--line)", color: "var(--fg)" }}>
              Start <span className="arw">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* oversized closing wordmark */}
      <div className="wrap overflow-hidden pb-[14px]">
        <span
          className="block w-full leading-none select-none"
          style={{
            fontSize: "clamp(64px,18vw,300px)",
            fontWeight: 600,
            letterSpacing: "-0.055em",
            color: "transparent",
            WebkitTextStroke: "1px var(--line)",
          }}
          aria-hidden
        >
          Arche
        </span>
      </div>

      <div className="wrap flex flex-wrap items-center justify-between gap-[10px] border-t py-[18px]" style={{ borderColor: "var(--line)" }}>
        <p className="mono">{f.legal}</p>
        <p className="mono">We build systems.</p>
      </div>
    </footer>
  );
}
