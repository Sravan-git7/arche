import { useEffect } from "react";
import { Cursor } from "./components/Cursor";
import { Intro } from "./components/Intro";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { PreFooterCTA } from "./components/PreFooterCTA";
import { GlobalStudioBackground } from "./components/GlobalStudioBackground";
import { AskArcheDock } from "./components/AskArcheDock";
import { Home } from "./pages/Home";
import { ServicesIndexPage } from "./pages/ServicesIndexPage";
import { ServicePage } from "./pages/ServicePage";
import { WorkPage } from "./pages/Misc";
import { PricingPage } from "./pages/PricingPage";
import { ContactPage } from "./pages/Contact";
import { FAQPage } from "./pages/FAQPage";
import { RouteWipe, useRoute } from "./lib/router";
import { SmoothScroll } from "./motion/SmoothScroll";
import { useMagnetic } from "./lib/interact";

/**
 * Arche — AI + digital systems studio.
 *
 * Routes (hash-namespaced for the single-file deployment):
 *   /                      one-page experience
 *   /services              services index
 *   /services/:slug        dedicated service pages
 *   /work                  portfolio index
 *   /pricing               investment & pricing architecture
 *   /contact               start-a-project inquiry
 *
 * All routes share the unified root App layout:
 * - SmoothScroll (Lenis 60fps)
 * - Global botanical green-mist + fluted-glass background (fixed inset-0 z-0)
 * - Custom dual-contrast halo cursor
 * - Header (nav-pill glass) & Footer
 * - AskArcheDock (interactive live chat & WhatsApp partner dock)
 */
export default function App() {
  useMagnetic();
  const route = useRoute();

  // Global passive pointermove listener to update --mx and --my on .shiny-border elements at 60fps
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        ".shiny-border, .arche-glow-card, .smoked-glass-cell, .frosted-crystal, .weighted-card, .tilt-card, .smoked-cypress-glass"
      ) as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty("--mx", `${x}px`);
      target.style.setProperty("--my", `${y}px`);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  // Auto-redirect legacy routes
  useEffect(() => {
    if (route === "/services/ai-chatbots" || route === "/services/pitch-decks-storytelling") {
      window.location.hash = "#/services/pitch-decks";
    }
  }, [route]);

  let page = <Home />;
  if (route === "/services") page = <ServicesIndexPage />;
  else if (route.startsWith("/services/")) {
    const rawSlug = route.split("/")[2];
    const normalizedSlug =
      rawSlug === "ai-chatbots" || rawSlug === "pitch-decks-storytelling"
        ? "pitch-decks"
        : rawSlug;
    page = <ServicePage slug={normalizedSlug} />;
  }
  else if (route === "/pricing") page = <PricingPage />;
  else if (route === "/work") page = <WorkPage />;
  else if (route === "/contact") page = <ContactPage />;
  else if (route === "/faq") page = <FAQPage />;

  return (
    <SmoothScroll>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: "start" });
        }}
      >
        Skip to content
      </a>
      <Intro />
      <Cursor />
      <GlobalStudioBackground />
      <div className="film-grain" aria-hidden="true" />
      <RouteWipe />
      <Header />
      <main id="main" key={route} tabIndex={-1} className="relative z-10 w-full">
        {page}
        {route !== "/contact" && <PreFooterCTA />}
        <Footer />
      </main>
      {/* Global Grounded Live Chat & WhatsApp Dock — unified across all routes */}
      <AskArcheDock />
    </SmoothScroll>
  );
}
