import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5238;
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
    // -------------------------------------------------------------------------
    // 1. DESKTOP VIEWPORT: 1440x900
    // -------------------------------------------------------------------------
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 1440x900 Desktop");
    console.log("========================================");

    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
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

    // 1.1 Scope Check: ONLY 2 fluted glass optical accents in the entire DOM
    console.log("\n--- Checking Fluted Glass Scoped Application ---");
    const flutedElements = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("[data-fluted-glass]"));
      return els.map((el) => ({
        location: el.getAttribute("data-fluted-glass"),
        tag: el.tagName,
        bg: window.getComputedStyle(el).backgroundImage,
        mask: window.getComputedStyle(el).maskImage || window.getComputedStyle(el).webkitMaskImage,
        position: window.getComputedStyle(el).position,
        zIndex: window.getComputedStyle(el).zIndex,
        pointerEvents: window.getComputedStyle(el).pointerEvents,
      }));
    });

    console.log("Found fluted glass elements:", flutedElements.map(e => e.location));
    assert(flutedElements.length === 2, `Strictly TWO fluted-glass accents found across entire page [found: ${flutedElements.length}]`);
    assert(flutedElements.some(e => e.location === "hero"), "Hero fluted-glass veil element exists [data-fluted-glass='hero']");
    assert(flutedElements.some(e => e.location === "dark-cta"), "Dark CTA fluted-glass layer exists [data-fluted-glass='dark-cta']");

    // 1.2 Hero Fluted-Glass Veil Properties
    console.log("\n--- Checking Hero Fluted-Glass Veil ---");
    const heroFluted = flutedElements.find(e => e.location === "hero");
    console.log("Hero fluted bg:", heroFluted?.bg);
    assert(heroFluted !== undefined, "Hero fluted glass element found");
    assert(heroFluted?.bg.includes("repeating-linear-gradient"), "Hero fluted glass uses repeating-linear-gradient");
    assert(heroFluted?.bg.includes("rgba(255, 255, 255, 0.45)") || heroFluted?.bg.includes("rgba(255,255,255,0.45)"), "Hero fluted glass contains 0.45 white specular highlights");
    assert(heroFluted?.bg.includes("rgba(20, 20, 19") || heroFluted?.bg.includes("rgba(20,20,19"), "Hero fluted glass contains dark refraction ribs");
    assert(heroFluted?.mask.includes("radial-gradient"), "Hero fluted glass has radial vignette mask for seamless blend into #FBFBF6");
    assert(heroFluted?.pointerEvents === "none", "Hero fluted glass is pointer-events: none (zero interaction disruption)");

    // 1.3 Dark CTA Smoked Fluted-Glass Properties
    console.log("\n--- Checking Dark CTA Smoked Fluted-Glass ---");
    const darkCtaFluted = flutedElements.find(e => e.location === "dark-cta");
    console.log("Dark CTA fluted bg:", darkCtaFluted?.bg);
    assert(darkCtaFluted !== undefined, "Dark CTA fluted glass element found");
    assert(darkCtaFluted?.bg.includes("repeating-linear-gradient"), "Dark CTA fluted glass uses repeating-linear-gradient");
    assert(darkCtaFluted?.bg.includes("rgba(255, 255, 255, 0.04)") || darkCtaFluted?.bg.includes("rgba(255,255,255,0.04)"), "Dark CTA fluted glass contains 0.04 specular highlight ribs");
    assert(darkCtaFluted?.bg.includes("rgba(0, 0, 0, 0.22)") || darkCtaFluted?.bg.includes("rgba(0,0,0,0.22)"), "Dark CTA fluted glass contains 0.22 dark smoked grooves");
    assert(darkCtaFluted?.mask.includes("radial-gradient"), "Dark CTA fluted glass has radial vignette mask");
    assert(darkCtaFluted?.pointerEvents === "none", "Dark CTA fluted glass is pointer-events: none");

    // 1.4 Text Layer Contrast and Z-Index Hierarchy Check
    console.log("\n--- Checking Text Layer Contrast and Hierarchy ---");
    const contrastAndHierarchy = await page.evaluate(() => {
      const heroHeadline = document.querySelector("#hero h1");
      const ctaHeadline = document.querySelector("#faq .rounded-\\[32px\\] h2");

      const heroHeadlineColor = heroHeadline ? window.getComputedStyle(heroHeadline).color : null;
      const ctaHeadlineColor = ctaHeadline ? window.getComputedStyle(ctaHeadline).color : null;

      const heroContent = document.querySelector("#hero [class*='max-w-[1080px]']");
      const ctaContent = document.querySelector("#faq .rounded-\\[32px\\] .relative.z-10");

      return {
        heroHeadlineColor,
        ctaHeadlineColor,
        heroContentZ: heroContent ? window.getComputedStyle(heroContent).zIndex : null,
        ctaContentZ: ctaContent ? window.getComputedStyle(ctaContent).zIndex : null,
      };
    });

    console.log("Contrast & Hierarchy:", contrastAndHierarchy);
    assert(contrastAndHierarchy.heroHeadlineColor === "rgb(20, 20, 19)", "Hero headline is Jet Charcoal rgb(20, 20, 19) for crisp AAA contrast");
    assert(contrastAndHierarchy.ctaHeadlineColor === "rgb(251, 251, 246)", "Dark CTA headline is Pure Alabaster rgb(251, 251, 246) for crisp AAA contrast");
    assert(contrastAndHierarchy.heroContentZ === "10", "Hero content is elevated at z-index: 10 above fluted background veil");
    assert(contrastAndHierarchy.ctaContentZ === "10", "Dark CTA content is elevated at z-index: 10 above fluted smoked layer");

    // Capture Desktop Screenshots
    await page.screenshot({ path: join(ARTIFACTS_DIR, "fluted_01_hero_desktop_1440x900.png") });

    // Scroll to Dark CTA Card
    const ctaCard = page.locator("#faq .rounded-\\[32px\\]");
    await ctaCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "fluted_02_dark_cta_desktop_1440x900.png") });

    // -------------------------------------------------------------------------
    // 2. MOBILE VIEWPORT: 390x844
    // -------------------------------------------------------------------------
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 390x844 Mobile");
    console.log("========================================");

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
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
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasOverflow: doc.scrollWidth > doc.clientWidth + 1,
      };
    });

    assert(!mobileOverflow.hasOverflow, `Mobile document has zero horizontal overflow [scrollWidth: ${mobileOverflow.scrollWidth}, clientWidth: ${mobileOverflow.clientWidth}]`);

    // Capture Mobile Screenshots
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "fluted_03_hero_mobile_390x844.png") });

    const mobileCtaCard = mobilePage.locator("#faq .rounded-\\[32px\\]");
    await mobileCtaCard.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "fluted_04_dark_cta_mobile_390x844.png") });

    await mobileContext.close();
    await desktopContext.close();

    console.log("\n========================================");
    console.log(`VERIFICATION SUMMARY: ${passes.length} passed, ${failures.length} failed`);
    console.log("========================================");

    if (failures.length > 0) {
      console.error("\nFAILURES DETECTED:");
      for (const f of failures) console.error(`  - ${f}`);
      process.exit(1);
    } else {
      console.log("ALL FLUTED GLASS ACCENT CHECKS PASSED WITH 100% SUCCESS!");
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});
