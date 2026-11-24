import { siteContent } from "../data/site";
import { Wordmark } from "./Wordmark";
import { Link } from "../lib/router";

export function Footer() {
  const f = siteContent.footer;

  return (
    <footer className="w-full bg-transparent text-[#0D0E0C] border-t border-[#0D0E0C]/[0.08] relative overflow-hidden">
      <div className="wrap py-[clamp(48px,5vw,80px)] relative z-10">
        <div className="grid gap-[36px] md:grid-cols-12">
          {/* Left Column: Wordmark + Strong Editorial Statement + Location Note */}
          <div className="flex flex-col gap-[18px] md:col-span-5">
            <Wordmark size={36} monogramScale={1.35} onDark={false} />
            <p className="text-[clamp(22px,2vw,26px)] font-bold tracking-tight text-[#0D0E0C] max-w-[380px] leading-[1.25]">
              Built for teams that refuse to stitch four agencies together.
            </p>
            <p className="mono max-w-[32ch] text-[#484C45] text-[13px]">{f.note}</p>
          </div>

          {f.cols.map((col) => (
            <div key={col.t} className="flex flex-col gap-[14px] md:col-span-2">
              <p className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#343832]">
                {col.t}
              </p>
              <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
                {col.l.map((l) => (
                  <li key={l.to + l.label}>
                    <Link
                      to={l.to}
                      className="text-[16px] sm:text-[17px] font-semibold text-[#0D0E0C] hover:text-[#484C45] transition-colors leading-snug inline-block"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-[14px] md:col-span-3">
            <p className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#343832]">
              Contact
            </p>
            <a
              href={`mailto:${siteContent.contact.email}`}
              className="text-[16px] sm:text-[17px] font-semibold text-[#0D0E0C] hover:text-[#484C45] transition-colors leading-snug self-start"
            >
              {siteContent.contact.email}
            </a>
            {siteContent.contact.phone && (
              <a
                href={`tel:${siteContent.contact.phone.replace(/\s+/g, "")}`}
                className="text-[16px] sm:text-[17px] font-semibold text-[#0D0E0C] hover:text-[#484C45] transition-colors leading-snug self-start"
              >
                {siteContent.contact.phone}
              </a>
            )}
            <Link
              to="/contact"
              className="btn btn-ghost mt-[10px] self-start border border-[#0D0E0C]/15 text-[#0D0E0C] hover:bg-[#0D0E0C] hover:text-[#FBFBF6] hover:border-[#0D0E0C] transition-colors font-semibold"
              data-cursor="START"
            >
              Start <span className="arw">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* oversized closing wordmark */}
      <div className="wrap relative overflow-hidden pb-[14px]">
        <span
          className="relative z-10 block w-full leading-none select-none uppercase font-display"
          style={{
            fontSize: "clamp(64px,18vw,300px)",
            fontWeight: 800,
            fontVariationSettings: "'wght' 800",
            letterSpacing: "-0.055em",
            color: "rgba(13, 14, 12, 0.08)",
            WebkitTextStroke: "1px rgba(13, 14, 12, 0.14)",
          }}
          aria-hidden
        >
          Arche
        </span>
      </div>

      <div className="wrap relative z-10 flex flex-wrap items-center justify-between gap-[10px] border-t border-[#0D0E0C]/[0.08] py-[18px] pb-24 md:pb-[18px] md:pl-[340px] text-[#484C45]">
        <p className="mono text-[12px]">{f.legal}</p>
        <p className="mono text-[12px]">Technology Meets Creativity</p>
      </div>
    </footer>
  );
}
