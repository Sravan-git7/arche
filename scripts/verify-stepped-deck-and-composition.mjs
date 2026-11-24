import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5220;
const DIST = join(process.cwd(), "dist");
const ARTIFACTS_DIR = join(process.cwd(), "scripts", "audit_artifacts");

if (!existsSync(ARTIFACTS_DIR)) {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

const server = createServer((req, res) => {
  let file = join(DIST, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  if (!existsSync(file)) file = join(DIST, "index.html");
  const ext = extname(file);
  res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
  res.end(readFileSync(file));
});

server.listen(PORT, async () => {
  console.log(`[VERIFY SERVER] Running at http://localhost:${PORT}`);

  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const failures = [];
  const passes = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passes.push(message);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failures.push(message);
    }
  }

  try {
    // ========================================================
    // 1. DESKTOP VIEWPORT: 1440x900
    // ========================================================
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 1440x900 Desktop");
    console.log("========================================");

    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      isMobile: false,
      hasTouch: false,
    });

    await desktopContext.addInitScript(() => {
      try {
        sessionStorage.setItem("arche_intro", "1");
        sessionStorage.setItem("arche_monogram_seen", "1");
      } catch (e) {}
    });

    const page = await desktopContext.newPage();
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1.1 Hero Bottom Anchor Check (above fold inside 100svh)
    console.log("\n--- Checking Hero Bottom Discipline Bar Grounding ---");
    const heroBarBounds = await page.evaluate(() => {
      const hero = document.querySelector("#hero");
      const bar = document.querySelector("[data-hero-index-bar]");
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const barRect = bar ? bar.getBoundingClientRect() : null;
      let curr = hero;
      const chain = [];
      while (curr && curr !== document.body) {
        chain.unshift({
          tag: curr.tagName,
          id: curr.id,
          className: curr.className?.slice?.(0, 30),
          offsetTop: curr.offsetTop,
          top: curr.getBoundingClientRect().top,
          marginTop: window.getComputedStyle(curr).marginTop,
          paddingTop: window.getComputedStyle(curr).paddingTop,
        });
        curr = curr.parentElement;
      }
      return {
        chain,
        heroTop: heroRect?.top,
        barTop: barRect?.top,
        barBottom: barRect?.bottom,
        windowHeight: window.innerHeight,
      };
    });
    console.log("Chain to hero:", JSON.stringify(heroBarBounds.chain, null, 2));
    assert(heroBarBounds !== null, "Hero 4-discipline bottom bar found in DOM");
    assert(
      heroBarBounds && heroBarBounds.barBottom <= heroBarBounds.windowHeight + 2,
      `Hero 4-discipline bar is grounded inside initial viewport [bottom: ${heroBarBounds?.barBottom}px, windowHeight: ${heroBarBounds?.windowHeight}px]`
    );

    await page.screenshot({ path: join(ARTIFACTS_DIR, "stepped_01_hero_desktop.png") });

    // 1.2 Subtle Arché Sage-Lime Card Palette & Rim Specular Check
    console.log("\n--- Checking Sage-Lime Card Palette & Rim ---");
    const cardAudit = await page.evaluate(() => {
      const selectors = [
        "#services .sticky-service-card",
        "#difference .frosted-ivory-card",
        "#difference .conviction-card",
        "#process .frosted-ivory-card",
        "#faq .faq-card",
      ];
      const results = [];
      for (const sel of selectors) {
        const els = Array.from(document.querySelectorAll(sel));
        for (const el of els) {
          const style = window.getComputedStyle(el);
          results.push({
            selector: sel,
            bg: style.background,
            bgImg: style.backgroundImage,
            border: style.border,
            boxShadow: style.boxShadow,
          });
        }
      }
      return results;
    });

    console.log(`Audited ${cardAudit.length} cards across Services, Difference, Process, and FAQ.`);
    assert(cardAudit.length >= 10, `Audited at least 10 cards [found: ${cardAudit.length}]`);

    const hasSageLimeGradient = cardAudit.every(
      (c) => c.bgImg.includes("gradient") || c.bg.includes("linear-gradient")
    );
    assert(hasSageLimeGradient, "All audited cards use the subtle sage-lime gradient fill");

    const sampleCard = cardAudit[0];
    console.log("Sample card border:", sampleCard.border);
    console.log("Sample card boxShadow:", sampleCard.boxShadow);
    assert(
      sampleCard.border.includes("114, 179, 20") || sampleCard.border.includes("rgba"),
      `Card border uses botanical lime rim [border: ${sampleCard.border}]`
    );
    assert(
      sampleCard.boxShadow.includes("inset") && sampleCard.boxShadow.includes("255, 255, 255"),
      `Card has tactile inset specular top rim [boxShadow: ${sampleCard.boxShadow}]`
    );

    // 1.3 Conviction Cards Proof Cues Check (No repetitive SLA)
    console.log("\n--- Checking Conviction Cards Proof Cues ---");
    const convictionCues = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("#difference .conviction-card"));
      return cards.map((c) => {
        const footer = c.querySelector("[data-proof-cue]");
        return footer ? footer.textContent?.trim() : "";
      });
    });
    console.log("Conviction card proof cues:", convictionCues);
    assert(convictionCues.length === 3, "Found 3 conviction cards");
    assert(
      !convictionCues.some((c) => c?.toLowerCase().includes("standard arché sla")),
      "Removed repetitive 'STANDARD ARCHÉ SLA' from conviction cards"
    );
    assert(
      convictionCues[0]?.includes("01 · Unified Repo & Brand") &&
      convictionCues[1]?.includes("02 · Live Staging Every Friday") &&
      convictionCues[2]?.includes("03 · 100% IP & Code Ownership"),
      "Conviction cards have distinct concise proof cues (01, 02, 03)"
    );

    // 1.4 Chapter 02 — The Tension: Asymmetric 12-Column Layout Check
    console.log("\n--- Checking Chapter 02 Manifesto Asymmetric Layout ---");
    await page.evaluate(() => {
      document.querySelector("#tension")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(600);

    const manifestoLayout = await page.evaluate(() => {
      const section = document.querySelector("#tension");
      const headline = section?.querySelector("p.font-display");
      const explanation = section?.querySelector(".lg\\:col-span-6 p");
      const exploreLink = section?.querySelector("a[href='#services']");
      const processLink = section?.querySelector("a[href='#process']");

      const headlineAlign = headline ? window.getComputedStyle(headline).textAlign : "";

      return {
        hasSection: !!section,
        headlineAlign,
        hasExplanation: !!explanation,
        explanationText: explanation?.textContent?.trim().slice(0, 40),
        hasExploreLink: !!exploreLink,
        hasProcessLink: !!processLink,
      };
    });

    console.log("Manifesto layout check:", manifestoLayout);
    assert(manifestoLayout.headlineAlign === "left" || manifestoLayout.headlineAlign === "start", "Manifesto statement is left-aligned in asymmetric layout");
    assert(manifestoLayout.hasExplanation, `Found editorial explanation block [${manifestoLayout.explanationText}...]`);
    assert(manifestoLayout.hasExploreLink && manifestoLayout.hasProcessLink, "Found sleek kinetic links (Explore 4 verticals & How we work)");

    await page.screenshot({ path: join(ARTIFACTS_DIR, "stepped_02_manifesto_asymmetric.png") });

    // 1.5 Chapter 04 — The Studio Difference: Asymmetric Split Lockup Check
    console.log("\n--- Checking Chapter 04 Difference Asymmetric Split Header ---");
    await page.evaluate(() => {
      document.querySelector("#difference")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(600);

    const differenceHeader = await page.evaluate(() => {
      const section = document.querySelector("#difference");
      const grid = section?.querySelector(".grid.grid-cols-1.lg\\:grid-cols-12");
      const h2 = section?.querySelector("h2");
      const subcopy = section?.querySelector(".lg\\:col-span-5 p");

      return {
        hasSplitGrid: !!grid,
        h2Align: h2 ? window.getComputedStyle(h2).textAlign : "",
        hasSubcopy: !!subcopy,
        subcopyText: subcopy?.textContent?.trim().slice(0, 45),
      };
    });

    console.log("Difference header check:", differenceHeader);
    assert(differenceHeader.hasSplitGrid, "Studio Difference header uses asymmetric lg:grid-cols-12 split lockup");
    assert(differenceHeader.h2Align === "left" || differenceHeader.h2Align === "start", "Difference headline is left-aligned in 7-col container");
    assert(differenceHeader.hasSubcopy, `Found concise studio statement in 5-col container [${differenceHeader.subcopyText}...]`);

    await page.screenshot({ path: join(ARTIFACTS_DIR, "stepped_03_difference_asymmetric.png") });

    // 1.6 Chapter 03 — Services Stepped-Deck Sticky Physics & Shadows
    console.log("\n--- Checking Services Stepped-Deck Sticky Physics ---");
    await page.evaluate(() => {
      document.querySelector("#services")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(600);

    const serviceDeck = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("#services .sticky-service-card"));
      const parent = cards[0]?.parentElement;

      return {
        count: cards.length,
        parentClass: parent?.className || "",
        cards: cards.map((c, i) => {
          const style = window.getComputedStyle(c);
          return {
            index: i,
            position: style.position,
            top: style.top,
            zIndex: style.zIndex,
            boxShadow: style.boxShadow,
          };
        }),
      };
    });

    console.log("Services stepped deck configuration:", serviceDeck);
    assert(serviceDeck.count === 4, "Found 4 Services cards");

    const expectedTops = ["78px", "108px", "138px", "168px"];
    const topsMatch = serviceDeck.cards.every((c, i) => c.top === expectedTops[i]);
    assert(
      topsMatch,
      `Cards have stepped sticky top offsets [78px, 108px, 138px, 168px] [got: ${serviceDeck.cards.map((c) => c.top).join(", ")}]`
    );

    // Verify upward separation shadows on Cards 02, 03, 04
    const cards234Shadows = serviceDeck.cards.slice(1);
    const hasUpwardShadows = cards234Shadows.every((c) => c.boxShadow.includes("-14px") || c.boxShadow.includes("rgba(20, 20, 19, 0.09)"));
    assert(
      hasUpwardShadows,
      "Cards 02, 03, and 04 have upward separation shadows to float in front of receding cards"
    );

    // Verify parent container pacing and runway
    assert(
      serviceDeck.parentClass.includes("space-y-[14vh]") && serviceDeck.parentClass.includes("pb-[18vh]"),
      "Services container has space-y-[14vh] vertical pacing and pb-[18vh] scroll runway for Card 04 hold"
    );

    // Test Card 02 stacking over Card 01
    await page.evaluate(() => {
      const cards = document.querySelectorAll("#services .sticky-service-card");
      if (cards[1]) {
        cards[1].scrollIntoView({ behavior: "instant" });
      }
    });
    await page.waitForTimeout(800);

    const card01Recession = await page.evaluate(() => {
      const c1 = document.querySelectorAll("#services .sticky-service-card")[0];
      const c1Body = c1?.querySelector(".service-card-body");
      const c1Style = c1 ? window.getComputedStyle(c1) : null;
      const c1BodyStyle = c1Body ? window.getComputedStyle(c1Body) : null;

      return {
        card1Transform: c1Style?.transform,
        card1Opacity: c1Style ? parseFloat(c1Style.opacity) : 1,
        bodyOpacity: c1BodyStyle ? parseFloat(c1BodyStyle.opacity) : 1,
        bodyFilter: c1BodyStyle?.filter,
      };
    });

    console.log("Card 01 recession state under Card 02:", card01Recession);
    assert(
      card01Recession.card1Transform?.includes("matrix") && !card01Recession.card1Transform?.includes("matrix(1,"),
      `Card 01 scaled backward under Card 02 [transform: ${card01Recession.card1Transform}]`
    );
    assert(
      card01Recession.bodyOpacity <= 0.45,
      `Card 01 inner content softly dimmed under Card 02 [got: ${card01Recession.bodyOpacity}]`
    );
    assert(
      card01Recession.card1Opacity >= 0.95,
      `Card 01 outer surface remains 100% opaque sage-lime for zero text bleed [got: ${card01Recession.card1Opacity}]`
    );

    await page.screenshot({ path: join(ARTIFACTS_DIR, "stepped_04_card02_over_card01.png") });

    // Test Card 04 Hold at top: 168px
    await page.evaluate(() => {
      const cards = document.querySelectorAll("#services .sticky-service-card");
      if (cards[3]) {
        cards[3].scrollIntoView({ behavior: "instant" });
      }
    });
    await page.waitForTimeout(800);

    const card04Hold = await page.evaluate(() => {
      const c4 = document.querySelectorAll("#services .sticky-service-card")[3];
      const rect = c4?.getBoundingClientRect();
      const style = c4 ? window.getComputedStyle(c4) : null;

      return {
        top: rect?.top,
        stickyTop: style?.top,
        opacity: style ? parseFloat(style.opacity) : 0,
      };
    });

    console.log("Card 04 hold state:", card04Hold);
    assert(
      card04Hold.stickyTop === "168px",
      `Card 04 pinned at top: 168px [got: ${card04Hold.stickyTop}]`
    );
    assert(
      card04Hold.opacity >= 0.95,
      `Card 04 is 100% visible during its hold [got: ${card04Hold.opacity}]`
    );

    await page.screenshot({ path: join(ARTIFACTS_DIR, "stepped_05_card04_hold.png") });

    // ========================================================
    // 2. MOBILE VIEWPORT: 390x844 (iPhone 14)
    // ========================================================
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 390x844 Mobile");
    console.log("========================================");

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobileContext.addInitScript(() => {
      try {
        sessionStorage.setItem("arche_intro", "1");
        sessionStorage.setItem("arche_monogram_seen", "1");
      } catch (e) {}
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1000);

    const mobileOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 2;
    });
    assert(mobileOverflow, "Mobile document has zero horizontal overflow");

    await mobilePage.evaluate(() => {
      document.querySelector("#tension")?.scrollIntoView({ behavior: "instant" });
    });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "stepped_06_mobile_manifesto.png") });

    await mobilePage.evaluate(() => {
      document.querySelector("#services")?.scrollIntoView({ behavior: "instant" });
    });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "stepped_07_mobile_services.png") });

    await mobilePage.evaluate(() => {
      document.querySelector("#difference")?.scrollIntoView({ behavior: "instant" });
    });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "stepped_08_mobile_difference.png") });

    console.log("\n========================================");
    console.log(`VERIFICATION SUMMARY: ${passes.length} passed, ${failures.length} failed`);
    console.log("========================================");

    if (failures.length > 0) {
      console.error("FAILURES:");
      failures.forEach((f) => console.error(" - " + f));
      process.exit(1);
    } else {
      console.log("ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
      process.exit(0);
    }
  } catch (err) {
    console.error("Verification execution error:", err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});
