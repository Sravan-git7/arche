import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5240;
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

    // 1.1 Progress Rail & Compact Dock Positioning
    console.log("\n--- Checking Progress Rail & Dock Positioning ---");
    const layoutPositions = await page.evaluate(() => {
      const rail = document.querySelector(".progress-rail");
      const dock = document.querySelector(".fixed.bottom-4.left-4");
      const dockPill = dock ? dock.querySelector(".rounded-full") : null;
      const grain = document.querySelector(".film-grain");
      const heroBar = document.querySelector("[data-hero-index-bar]");

      const railRect = rail ? rail.getBoundingClientRect() : null;
      const dockRect = dock ? dock.getBoundingClientRect() : null;
      const dockPillRect = dockPill ? dockPill.getBoundingClientRect() : null;
      const heroBarRect = heroBar ? heroBar.getBoundingClientRect() : null;

      return {
        rail: railRect ? {
          top: railRect.top,
          left: railRect.left,
          right: railRect.right,
          bottom: railRect.bottom,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        } : null,
        dock: dockRect ? {
          top: dockRect.top,
          left: dockRect.left,
          width: dockRect.width,
          height: dockRect.height,
          pillHeight: dockPillRect?.height,
        } : null,
        grain: grain ? {
          opacity: window.getComputedStyle(grain).opacity,
          zIndex: window.getComputedStyle(grain).zIndex,
          pointerEvents: window.getComputedStyle(grain).pointerEvents,
        } : null,
        heroBar: heroBarRect ? {
          top: heroBarRect.top,
          bottom: heroBarRect.bottom,
          height: heroBarRect.height,
        } : null,
      };
    });

    console.log("Layout positions:", JSON.stringify(layoutPositions, null, 2));

    // Rail is on the right edge
    assert(layoutPositions.rail !== null, "Progress rail found");
    assert(
      layoutPositions.rail && layoutPositions.rail.right >= layoutPositions.rail.windowWidth - 50,
      `Progress rail is fixed to right edge [right: ${layoutPositions.rail?.right}px, windowWidth: ${layoutPositions.rail?.windowWidth}px]`
    );
    assert(
      layoutPositions.rail && Math.abs(layoutPositions.rail.top + (layoutPositions.rail.bottom - layoutPositions.rail.top)/2 - layoutPositions.rail.windowHeight / 2) < 150,
      `Progress rail is vertically centered on the right edge`
    );

    // Dock is compact on the bottom left
    assert(layoutPositions.dock !== null, "Ask Arché dock found");
    assert(layoutPositions.dock && layoutPositions.dock.left <= 24, `Dock is anchored at left-4 [left: ${layoutPositions.dock?.left}px]`);
    assert(
      layoutPositions.dock && layoutPositions.dock.pillHeight && Math.abs(layoutPositions.dock.pillHeight - 40) <= 2,
      `Dock pill has compact h-10 height (40px) [got: ${layoutPositions.dock?.pillHeight}px]`
    );

    // Zero overlap between dock and rail
    assert(
      layoutPositions.dock && layoutPositions.rail && layoutPositions.dock.left + layoutPositions.dock.width < layoutPositions.rail.left,
      "Zero collision between bottom-left dock and right-side progress rail"
    );

    // Hero discipline bar grounded inside 900px viewport
    assert(
      layoutPositions.heroBar && layoutPositions.heroBar.bottom <= 902,
      `Hero 4-discipline bar is grounded inside 100svh viewport [bottom: ${layoutPositions.heroBar?.bottom}px]`
    );

    // Global tactile micro-grain
    assert(layoutPositions.grain !== null, "Global paper-grain overlay exists");
    assert(layoutPositions.grain?.opacity === "0.025" || layoutPositions.grain?.opacity === "0.02", `Grain overlay has 2% - 2.5% opacity [got: ${layoutPositions.grain?.opacity}]`);
    assert(layoutPositions.grain?.zIndex === "1", `Grain overlay is at z-index: 1 [got: ${layoutPositions.grain?.zIndex}]`);

    // 1.2 Alternating Chapter Backdrop Tones
    console.log("\n--- Checking Alternating Chapter Tones ---");
    const chapterTones = await page.evaluate(() => {
      const hero = document.querySelector("#hero");
      const tension = document.querySelector("#tension");
      const services = document.querySelector("#services");
      const difference = document.querySelector("#difference");
      const process = document.querySelector("#process");
      const work = document.querySelector("#work");
      const faq = document.querySelector("#faq");

      return {
        hero: hero ? window.getComputedStyle(hero).backgroundColor : null,
        tension: tension ? window.getComputedStyle(tension).backgroundColor : null,
        services: services ? window.getComputedStyle(services).backgroundColor : null,
        difference: difference ? window.getComputedStyle(difference).backgroundColor : null,
        process: process ? window.getComputedStyle(process).backgroundColor : null,
        work: work ? window.getComputedStyle(work).backgroundColor : null,
        faq: faq ? window.getComputedStyle(faq).backgroundColor : null,
      };
    });

    console.log("Chapter tones:", chapterTones);
    // #FBFBF6 = rgb(251, 251, 246)
    // #F2F6E9 = rgb(242, 246, 233)
    // #F6F9EE = rgb(246, 249, 238)
    assert(chapterTones.hero === "rgb(251, 251, 246)" || chapterTones.hero === "rgba(0, 0, 0, 0)", "Hero uses Warm Studio Ivory #FBFBF6 / global backdrop");
    assert(
      chapterTones.services === "rgb(238, 244, 223)" || chapterTones.services === "rgb(242, 246, 233)" || chapterTones.services === "rgba(0, 0, 0, 0)",
      "Chapter 03 Services uses soft botanical sage-mist backdrop / global backdrop"
    );
    assert(chapterTones.difference === "rgb(251, 251, 246)" || chapterTones.difference === "rgba(0, 0, 0, 0)", "Chapter 04 Difference uses #FBFBF6 / global backdrop");
    assert(
      chapterTones.process === "rgb(238, 244, 223)" || chapterTones.process === "rgb(246, 249, 238)" || chapterTones.process === "rgba(0, 0, 0, 0)",
      "Chapter 05 Process uses soft botanical sage-mist backdrop / global backdrop"
    );

    // 1.3 Chapter 02 Manifesto De-Duplication Check
    console.log("\n--- Checking Chapter 02 Manifesto De-Duplication ---");
    const manifestoAudit = await page.evaluate(() => {
      const tension = document.querySelector("#tension");
      const headlineWords = Array.from(tension ? tension.querySelectorAll(".manifesto-word") : []).map(w => w.textContent.trim());
      const explanationP = tension ? tension.querySelector(".lg\\:col-span-6 p") : null;
      return {
        wordCount: headlineWords.length,
        headlineText: headlineWords.join(" "),
        explanationText: explanationP ? explanationP.textContent.trim() : null,
      };
    });

    console.log("Manifesto audit:", manifestoAudit);
    assert(manifestoAudit.wordCount === 12, `Manifesto headline has strictly 12 words (duplicate sentence removed) [count: ${manifestoAudit.wordCount}]`);
    assert(
      manifestoAudit.headlineText === "Most businesses don't have a talent problem. They have a connection problem.",
      `Manifesto headline matches exact copy: "${manifestoAudit.headlineText}"`
    );
    assert(
      manifestoAudit.explanationText?.includes("Arché engineers all four as one connected system"),
      `Manifesto bottom-right paragraph is non-repeating and humanized [got: "${manifestoAudit.explanationText}"]`
    );

    // 1.4 Chapter 03 Services Header Clean Inline Specs (Zero Boxy Grey Pills)
    console.log("\n--- Checking Services Header Inline Specs ---");
    const servicesPillsAudit = await page.evaluate(() => {
      const services = document.querySelector("#services");
      const cards = Array.from(services ? services.querySelectorAll(".sticky-service-card") : []);
      const cardAudits = cards.map(c => {
        const headerRight = c.querySelector(".flex.flex-col.md\\:flex-row > div:nth-child(2)");
        const pillTags = headerRight ? Array.from(headerRight.querySelectorAll(".bg-\\[\\#E5E7DC\\], [class*='rounded-md.border']")) : [];
        const specsText = headerRight ? headerRight.textContent : "";
        return {
          pillCount: pillTags.length,
          specsText,
        };
      });
      return cardAudits;
    });

    console.log("Services specs audit:", servicesPillsAudit);
    const totalBoxyPills = servicesPillsAudit.reduce((sum, c) => sum + c.pillCount, 0);
    assert(totalBoxyPills === 0, `Boxy grey pill tags removed from all 4 Service card headers [found: ${totalBoxyPills}]`);

    // 1.5 Chapter 04 Why Arché Stat Strip: BENCHMARK x4 Deleted
    console.log("\n--- Checking Chapter 04 Stat Strip ---");
    const differenceAudit = await page.evaluate(() => {
      const diff = document.querySelector("#difference");
      const text = diff ? diff.innerText : "";
      const benchmarkMatches = text.match(/BENCHMARK/gi);
      return {
        benchmarkCount: benchmarkMatches ? benchmarkMatches.length : 0,
      };
    });

    assert(differenceAudit.benchmarkCount === 0, `BENCHMARK x4 completely deleted from Chapter 04 stat strip [found: ${differenceAudit.benchmarkCount}]`);

    // 1.6 Humanized Copy Across Page
    console.log("\n--- Checking Humanized Copy Across Page ---");
    const pageText = await page.evaluate(() => document.body.innerText);
    assert(!pageText.includes("engineered for deterministic leverage"), "Removed 'engineered for deterministic leverage'");
    assert(pageText.includes("built to move faster and convert better"), "Found humanized 'built to move faster and convert better'");
    assert(!pageText.includes("Production Deployment & Zero-Drift Sync"), "Removed 'Production Deployment & Zero-Drift Sync'");
    assert(pageText.includes("Launch, Handoff & Ongoing Scale"), "Found humanized 'Launch, Handoff & Ongoing Scale'");
    assert(!pageText.includes("Sub-50ms Neural Routing"), "Removed 'Sub-50ms Neural Routing'");
    assert(pageText.includes("INSTANT LEAD ROUTING"), "Found humanized 'INSTANT LEAD ROUTING'");

    // Screenshots Desktop
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_01_hero_desktop_1440x900.png") });

    await page.locator("#tension").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_02_manifesto_desktop_1440x900.png") });

    await page.locator("#services").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_03_services_desktop_1440x900.png") });

    await page.locator("#difference").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_04_difference_desktop_1440x900.png") });

    await page.locator("#process").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "precision_05_process_desktop_1440x900.png") });

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

    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "precision_06_hero_mobile_390x844.png") });

    await mobilePage.locator("#tension").scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "precision_07_manifesto_mobile_390x844.png") });

    await mobilePage.locator("#services").scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "precision_08_services_mobile_390x844.png") });

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
      console.log("ALL PRECISION LAYOUT & ATMOSPHERE CHECKS PASSED WITH 100% SUCCESS!");
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
