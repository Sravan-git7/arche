import { useEffect } from "react";
import { Hero, Approach, ProcessSys, FinalCTA } from "../components/Sections";
import { Chapters } from "../components/Chapters";
import { WorkIndex } from "../components/WorkIndex";
import { FAQ } from "../components/FAQ";
import { ConnectedSystem } from "../components/ConnectedSystem";
import { ArcheAssistant } from "../components/ArcheAssistant";
import { ProblemSystem } from "../components/ProblemSystem";
import { BeforeAfter } from "../components/BeforeAfter";
import { Architecture3D } from "../components/Architecture3D";
import { Labs } from "../components/Labs";
import { ProgressRail } from "../components/ProgressRail";
import { BridgeDot } from "../components/BridgeDot";
import { SystemThread } from "../components/SystemThread";
import { Link, usePage } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";
import { resetPreviews } from "../lib/autoplay";

/**
 * Motion rhythm — calm → curious → interactive → cinematic → fast → calm
 * → experimental → productive → quiet → cinematic end.
 *
 *  Hero          spatial scene, pointer depth, focus-pull headline   (L4)
 *  Problem       pinned: idle tools → fan-out → one diagram          (L3)
 *  Services      tabbed live stages, hover preview, depth swap       (L3)
 *  System        3D architecture, entry paths, build-it-yourself     (L4)
 *  Work          pointer-reactive frames, expand-to-route            (L2)
 *  Labs          playground of working prototypes                    (L2)
 *  Process       click any stage, the system changes                 (L2)
 *  Approach      dark pause, principles demonstrate themselves       (L2)
 *  Ask Arche     conversation drives a live system                   (L3)
 *  FAQ           calm                                                (L1)
 *  Start         fragments converge into Arche                       (L4)
 */
export function Home() {
  usePage("Arche — AI + Digital Systems Studio");
  useReveal();
  useParallax();

  // A fresh visit gets a fresh round of Services first-view previews.
  useEffect(() => resetPreviews(), []);

  return (
    <>
      <div data-chapter="Hero">
        <Hero />
      </div>
      {/* Hero → Problem → Services is one continuous run: the receding planes
          and the carried signal bridge in; the compact diagram bridges out. */}
      <div data-chapter="Problem">
        <ProblemSystem />
      </div>
      <div data-chapter="Services">
        <Chapters />
      </div>
      <div data-chapter="System">
        <BeforeAfter />
        <Architecture3D />
        <ConnectedSystem />
      </div>
      <div data-chapter="Work">
        <section className="w-full py-[clamp(56px,7vw,110px)]">
          <div className="wrap">
            <div className="mb-[clamp(30px,4vw,60px)] flex flex-wrap items-end justify-between gap-[18px]">
              <div>
                <p className="mono mono-a mb-[10px]">Work</p>
                <h2 className="d2 max-w-[16ch]" data-r="mask">
                  Built, labelled honestly.
                </h2>
                <p className="body mt-[14px] max-w-[48ch]" data-r="meta">
                  Internal builds and prototypes — not client case studies. Each one shows how a capability is designed to operate.
                </p>
              </div>
              <Link to="/work" className="btn btn-ghost" cursor="VIEW">
                All work <span className="arw">→</span>
              </Link>
            </div>
            <WorkIndex limit={3} showFilters={false} />
          </div>
        </section>
      </div>
      <div data-chapter="Labs">
        <Labs />
      </div>
      <div data-chapter="Process">
        <ProcessSys />
      </div>
      <div data-chapter="Approach">
        <Approach />
      </div>
      <div data-chapter="Ask Arche">
        <ArcheAssistant />
      </div>
      <div data-chapter="FAQ">
        <FAQ />
      </div>
      <div data-chapter="Start">
        <FinalCTA />
      </div>
      <ProgressRail />
      <BridgeDot />
      <SystemThread />
    </>
  );
}
