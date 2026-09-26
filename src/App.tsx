import { Cursor } from "./components/Cursor";
import { Intro } from "./components/Intro";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { ServiceDetail } from "./pages/ServiceDetail";
import { ServicesIndex, WorkPage } from "./pages/Misc";
import { PricingPage } from "./pages/PricingPage";
import { ContactPage } from "./pages/Contact";
import { RouteWipe, useRoute } from "./lib/router";
import { useLenis } from "./lib/useLenis";
import { useMagnetic } from "./lib/interact";

/**
 * Arche — AI + digital systems studio.
 *
 * Routes (hash-namespaced for the single-file deployment):
 *   /                      one-page experience
 *   /services              services index
 *   /services/:slug        dedicated service pages
 *   /work                  portfolio index
 *   /contact               start-a-project flow (inquiry → reserve)
 *
 * Page transitions run through <RouteWipe/>; smooth scroll via Lenis;
 * reveal grammar is booted per page so ScrollTriggers rebuild cleanly.
 */
export default function App() {
  useLenis();
  useMagnetic();
  const route = useRoute();

  let page = <Home />;
  if (route === "/services") page = <ServicesIndex />;
  else if (route.startsWith("/services/")) page = <ServiceDetail slug={route.split("/")[2]} />;
  else if (route === "/pricing") page = <PricingPage />;
  else if (route === "/work") page = <WorkPage />;
  else if (route === "/contact") page = <ContactPage />;

  return (
    <>
      <Intro />
      <Cursor />
      <RouteWipe />
      <Header />
      <main key={route} className="relative w-full">
        {page}
      </main>
      <Footer />
    </>
  );
}
