import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5212;
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
    // 1. Desktop 1440x900
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

    // 1.1 Canvas Background & Typography Colors
    const canvasBg = await page.evaluate(() => {
      const el = document.querySelector("main > div, #hero, .w-full.bg-\\[\\#FBFBF6\\]");
      return window.getComputedStyle(el || document.body).backgroundColor;
    });
    console.log("Canvas BG computed:", canvasBg);
    assert(
      canvasBg.includes("251, 251, 246") || canvasBg.includes("251,251,246"),
      `Canvas background is Warm Studio Ivory (#FBFBF6) [got: ${canvasBg}]`
    );

    // 1.2 Hero Centered Hierarchy (awmedia-level restraint)
    const heroMetrics = await page.evaluate(() => {
      const hero = document.getElementById("hero");
      if (!hero) return null;
      const h1 = hero.querySelector("h1");
      const sub = hero.querySelector("p");
      const ctas = hero.querySelector(".hero-ctas, a[href*='contact']");
      const sideSplitBoxes = hero.querySelectorAll(".hero-schematic, [data-hero-schematic], .split-hero, .hero-split-box");

      const heroRect = hero.getBoundingClientRect();
      const h1Rect = h1 ? h1.getBoundingClientRect() : null;
      const subRect = sub ? sub.getBoundingClientRect() : null;

      const vpCenter = window.innerWidth / 2;
      const h1Center = h1Rect ? h1Rect.left + h1Rect.width / 2 : 0;
      const subCenter = subRect ? subRect.left + subRect.width / 2 : 0;

      // Check leaf-lime word
      const limeWord = hero.querySelector("span.text-\\[\\#72B314\\]");
      const limeColor = limeWord ? window.getComputedStyle(limeWord).color : null;

      return {
        h1Found: !!h1,
        h1CenterDiff: Math.abs(h1Center - vpCenter),
        subCenterDiff: Math.abs(subCenter - vpCenter),
        sideSplitBoxesCount: sideSplitBoxes.length,
        limeWordFound: !!limeWord,
        limeColor,
      };
    });

    assert(heroMetrics && heroMetrics.h1Found, "Hero headline h1 found");
    assert(heroMetrics && heroMetrics.h1CenterDiff < 15, `Hero headline is centered (offset: ${heroMetrics?.h1CenterDiff?.toFixed(1)}px)`);
    assert(heroMetrics && heroMetrics.subCenterDiff < 15, `Hero subcopy is centered (offset: ${heroMetrics?.subCenterDiff?.toFixed(1)}px)`);
    assert(heroMetrics && heroMetrics.sideSplitBoxesCount === 0, "Hero has zero split side boxes or schematics");
    assert(heroMetrics && heroMetrics.limeWordFound, "Hero has leaf-lime #72B314 emphasis word ('scale.')");

    // 1.3 Hero Bottom Index Bar
    const hasIndexBar = await page.evaluate(() => {
      const bar = document.querySelector("#hero [data-hero-index-bar]");
      return !!bar;
    });
    assert(hasIndexBar, "Hero has 4-column architectural bottom index bar");

    // 1.4 Floating Smoked-Obsidian Pill Navbar & Zero Drift
    const navMetrics = await page.evaluate(() => {
      const nav = document.querySelector("nav.navbar-smoked-obsidian, nav[aria-label='Primary']");
      if (!nav) return null;
      const rect = nav.getBoundingClientRect();
      const vpCenter = window.innerWidth / 2;
      const navCenter = rect.left + rect.width / 2;
      const style = window.getComputedStyle(nav);
      return {
        found: true,
        bg: style.backgroundColor,
        centerDiff: Math.abs(navCenter - vpCenter),
        hasSmokedClass: nav.classList.contains("navbar-smoked-obsidian"),
      };
    });
    assert(navMetrics && navMetrics.found, "Floating pill navbar found");
    assert(navMetrics && navMetrics.hasSmokedClass, "Navbar has .navbar-smoked-obsidian class");
    assert(navMetrics && navMetrics.centerDiff < 6, `Navbar is centered initially (offset: ${navMetrics?.centerDiff?.toFixed(1)}px)`);

    // Scroll down 400px and check if navbar drifts
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    const navScrollMetrics = await page.evaluate(() => {
      const nav = document.querySelector("nav.navbar-smoked-obsidian, nav[aria-label='Primary']");
      if (!nav) return null;
      const rect = nav.getBoundingClientRect();
      const vpCenter = window.innerWidth / 2;
      const navCenter = rect.left + rect.width / 2;
      return {
        centerDiff: Math.abs(navCenter - vpCenter),
      };
    });
    assert(
      navScrollMetrics && navScrollMetrics.centerDiff < 6,
      `Navbar remains perfectly centered on scroll (offset: ${navScrollMetrics?.centerDiff?.toFixed(1)}px)`
    );

    // 1.5 Clean Frosted-Ivory Architectural Cards & Zero Muddy Smear
    const cardMetrics = await page.evaluate(() => {
      const serviceCards = document.querySelectorAll(".sticky-service-card");
      const frostedCards = document.querySelectorAll(".frosted-ivory-card");
      const card1 = serviceCards[0];
      const card2 = serviceCards[1];

      return {
        serviceCardCount: serviceCards.length,
        frostedCardCount: frostedCards.length,
        card1Bg: card1 ? window.getComputedStyle(card1).backgroundColor : null,
        card2Bg: card2 ? window.getComputedStyle(card2).backgroundColor : null,
      };
    });
    assert(cardMetrics.serviceCardCount === 4, `All 4 sticky service cards present (count: ${cardMetrics.serviceCardCount})`);
    assert(cardMetrics.frostedCardCount >= 8, `Frosted-ivory cards applied across sections (count: ${cardMetrics.frostedCardCount})`);

    // 1.6 Zero Cursive Serif Italics Check
    const fontCheck = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("h1, h2, h3, p, span, a, button"));
      let serifItalicCount = 0;
      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (
          (style.fontFamily.toLowerCase().includes("instrument serif") || style.fontFamily.toLowerCase().includes("serif")) &&
          style.fontStyle === "italic"
        ) {
          serifItalicCount++;
        }
      });
      return serifItalicCount;
    });
    assert(fontCheck === 0, `Zero cursive serif italics across page elements (count: ${fontCheck})`);

    // 1.7 Zero Pill Spam Check
    const pillSpamCheck = await page.evaluate(() => {
      const textNodes = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode.nodeValue?.trim() || "";
        if (
          text.includes("• Direct Partner Access") ||
          text.includes("• Weekly Staging Links") ||
          text.includes("• Zero Agency Bloat") ||
          text.includes("• SYNCED") ||
          text.includes("• LOCKED") ||
          text.includes("• ACTIVE") ||
          text.includes("• VERIFIED") ||
          text.includes("• HOW WE WORK") ||
          text.includes("• WHY ARCHÉ") ||
          text.includes("• SELECTED WORK")
        ) {
          textNodes.push(text);
        }
      }
      return textNodes;
    });
    assert(pillSpamCheck.length === 0, `Zero pill spam text detected across page (found: ${JSON.stringify(pillSpamCheck)})`);

    // 1.8 Custom Cursor Checks
    const cursorCheck = await page.evaluate(() => {
      const dot = document.querySelector(".cursor-dot");
      const ring = document.querySelector(".cursor-ring");
      const label = document.querySelector(".cursor-label");
      return {
        dotFound: !!dot,
        ringFound: !!ring,
        labelFound: !!label,
      };
    });
    assert(cursorCheck.dotFound && cursorCheck.ringFound, "Ultra-clean custom cursor dot & ring present in DOM");

    // Take Desktop Screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_brand_desktop_hero.png"), fullPage: false });

    // Scroll to Services and capture
    await page.evaluate(() => {
      document.getElementById("services")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_brand_desktop_services.png"), fullPage: false });

    // Scroll to Process and capture
    await page.evaluate(() => {
      document.getElementById("process")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_brand_desktop_process.png"), fullPage: false });

    // Scroll to Proof Metrics & FAQ
    await page.evaluate(() => {
      document.getElementById("faq")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_brand_desktop_faq.png"), fullPage: false });

    // 2. Mobile 390x844
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

    // Mobile Hero Centered check
    const mobileHero = await mobilePage.evaluate(() => {
      const h1 = document.querySelector("#hero h1");
      if (!h1) return null;
      const rect = h1.getBoundingClientRect();
      const vpCenter = window.innerWidth / 2;
      return {
        centerDiff: Math.abs(rect.left + rect.width / 2 - vpCenter),
      };
    });
    assert(mobileHero && mobileHero.centerDiff < 10, `Mobile hero is centered (offset: ${mobileHero?.centerDiff?.toFixed(1)}px)`);

    // Take Mobile Screenshot
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "precision_brand_mobile_hero.png"), fullPage: false });

    await mobilePage.evaluate(() => {
      document.getElementById("process")?.scrollIntoView({ behavior: "instant" });
    });
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "precision_brand_mobile_process.png"), fullPage: false });

  } catch (err) {
    console.error("Test execution error:", err);
    failures.push(err.message);
  } finally {
    await browser.close();
    server.close();
  }

  console.log("\n========================================");
  console.log(`SUMMARY: ${passes.length} PASSED, ${failures.length} FAILED`);
  console.log("========================================");

  if (failures.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
