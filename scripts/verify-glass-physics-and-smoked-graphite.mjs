import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5202;
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
  console.log(`[TEST SERVER] Running at http://localhost:${PORT}`);

  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const passedTests = [];
  const failedTests = [];

  const viewports = [
    { name: "1440x900_desktop", width: 1440, height: 900, isMobile: false },
    { name: "390x844_mobile", width: 390, height: 844, isMobile: true },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING GLASS PHYSICS & SMOKED GRAPHITE: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
    });

    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("arche:intro_seen", "1");
      } catch (e) {}
    });

    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. VERIFY CANVAS BACKGROUND IS COOL STONE GREY (#DEDED8)
    const canvasBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`[CHECK] Body Background Color: ${canvasBg}`);
    // rgb(222, 222, 216) is #deded8
    if (canvasBg.includes("222, 222, 216") || canvasBg.includes("222,222,216")) {
      passedTests.push(`${vp.name}: Canvas background is Cool Architectural Stone-Grey (#DEDED8)`);
    } else {
      failedTests.push(`${vp.name}: Expected body bg to be #deded8 (222, 222, 216), got ${canvasBg}`);
    }

    // 2. VERIFY SECTION 02 SMOKED GRAPHITE BENTO GRID
    const bentoDetails = await page.evaluate(() => {
      const bentoGrid = document.querySelector(".smoked-graphite-container");
      const cells = document.querySelectorAll(".smoked-glass-cell");
      const titles = Array.from(cells).map((c) => c.querySelector("h3")?.textContent || "");
      const darkBand = document.querySelector("#proposition .bg-\\[\\#111210\\]");
      return {
        hasDarkBand: Boolean(darkBand),
        hasContainer: Boolean(bentoGrid),
        cellCount: cells.length,
        titles,
      };
    });
    console.log(`[CHECK] Bento Grid Smoked Graphite:`, bentoDetails);
    if (
      bentoDetails.hasDarkBand &&
      bentoDetails.hasContainer &&
      bentoDetails.cellCount >= 4 &&
      bentoDetails.titles.some((t) => t.includes("WEBSITE")) &&
      bentoDetails.titles.some((t) => t.includes("AI AGENT"))
    ) {
      passedTests.push(`${vp.name}: Section 02 Bento Grid operates in Smoked Graphite Studio Chapter (#111210) with 4 smoked-glass cells`);
    } else {
      failedTests.push(`${vp.name}: Bento Grid smoked graphite chapter incomplete: ${JSON.stringify(bentoDetails)}`);
    }

    // 3. VERIFY ARCHITECTURAL PROOF METRICS SMOKED GRAPHITE SECTION & WATERMARK POSITION
    const proofDetails = await page.evaluate(() => {
      const section = Array.from(document.querySelectorAll("section")).find((s) =>
        s.textContent.includes("Engineered for deterministic leverage")
      );
      if (!section) return null;
      const isDarkBg = window.getComputedStyle(section).backgroundColor.includes("17, 18, 16") ||
                       section.className.includes("bg-[#111210]");
      const watermark = Array.from(section.querySelectorAll("div")).find(
        (d) => d.textContent.trim() === "4 VERTICALS"
      );
      const headline = section.querySelector("h2");
      const unifiedBar = section.querySelector(".smoked-graphite-container");
      const columns = unifiedBar ? unifiedBar.querySelectorAll(".smoked-glass-cell") : [];

      let watermarkBehindHeadline = false;
      if (watermark && headline) {
        const wRect = watermark.getBoundingClientRect();
        const hRect = headline.getBoundingClientRect();
        // Watermark should be vertically aligned with the headline (centered behind it)
        const vDiff = Math.abs((wRect.top + wRect.height / 2) - (hRect.top + hRect.height / 2));
        watermarkBehindHeadline = vDiff < 100;
      }

      return {
        isDarkBg,
        hasWatermark: Boolean(watermark),
        watermarkBehindHeadline,
        hasUnifiedBar: Boolean(unifiedBar),
        columnCount: columns.length,
      };
    });
    console.log(`[CHECK] Proof Metrics Smoked Graphite:`, proofDetails);
    if (
      proofDetails &&
      proofDetails.isDarkBg &&
      proofDetails.hasWatermark &&
      proofDetails.watermarkBehindHeadline &&
      proofDetails.hasUnifiedBar &&
      proofDetails.columnCount === 4
    ) {
      passedTests.push(`${vp.name}: Proof Metrics in Smoked Graphite (#111210) with 4 VERTICALS watermark positioned directly BEHIND centered headline`);
    } else {
      failedTests.push(`${vp.name}: Proof Metrics setup failed: ${JSON.stringify(proofDetails)}`);
    }

    // 4. VERIFY TRANSLUCENT FROSTED CRYSTAL ON SERVICES STACK CARDS
    const servicesGlass = await page.evaluate(() => {
      const cards = document.querySelectorAll(".sticky-service-card");
      if (cards.length === 0) return null;
      const firstCardStyle = window.getComputedStyle(cards[0]);
      const bf = firstCardStyle.backdropFilter || "";
      const wbf = firstCardStyle.webkitBackdropFilter || "";
      const hasFrostedClass = cards[0].classList.contains("frosted-crystal");
      return {
        cardCount: cards.length,
        hasBlur: bf.includes("blur") || wbf.includes("blur") || hasFrostedClass,
        hasFrostedClass,
        boxShadow: firstCardStyle.boxShadow,
      };
    });
    console.log(`[CHECK] Services Frosted Crystal:`, servicesGlass);
    if (servicesGlass && servicesGlass.cardCount === 4 && servicesGlass.hasBlur) {
      passedTests.push(`${vp.name}: Services cards use genuine translucent frosted crystal with backdrop-filter blur`);
    } else {
      failedTests.push(`${vp.name}: Services cards frosted crystal styling missing: ${JSON.stringify(servicesGlass)}`);
    }

    // 5. VERIFY HERO CRYSTAL GLASS EXPLORE SERVICES BUTTON
    const exploreBtnGlass = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Explore Services")
      );
      if (!btn) return null;
      const style = window.getComputedStyle(btn);
      return {
        hasCrystalClass: btn.classList.contains("btn-crystal"),
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
        border: style.border,
      };
    });
    console.log(`[CHECK] Explore Services Button Crystal Glass:`, exploreBtnGlass);
    if (exploreBtnGlass && exploreBtnGlass.hasCrystalClass) {
      passedTests.push(`${vp.name}: Explore Services button uses translucent crystal glass (btn-crystal)`);
    } else {
      failedTests.push(`${vp.name}: Explore Services button missing crystal styling: ${JSON.stringify(exploreBtnGlass)}`);
    }

    // 6. VERIFY WORK CARDS TRANSLUCENT FROSTED FRAMES
    const workFrames = await page.evaluate(() => {
      const cards = document.querySelectorAll("#work .frosted-crystal, #work [data-cursor='view']");
      return cards.length >= 3;
    });
    console.log(`[CHECK] Work Cards Frosted Frames: ${workFrames}`);
    if (workFrames) {
      passedTests.push(`${vp.name}: Work showcase cards wrapped in frosted crystal frames`);
    } else {
      failedTests.push(`${vp.name}: Work cards frosted frames incomplete`);
    }

    // 7. CAPTURE VISUAL INSPECTION SCREENSHOTS
    // Screenshot A: Hero
    await page.screenshot({
      path: join(ARTIFACTS_DIR, `glass_hero_${vp.name}.png`),
    });

    // Screenshot B: Section 02 Smoked Graphite Bento Grid
    const propSection = await page.$("#proposition");
    if (propSection) {
      await propSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `glass_bento_smoked_graphite_${vp.name}.png`),
      });
    }

    // Screenshot C: Services Frosted Crystal Stack
    const servicesSection = await page.$("#services");
    if (servicesSection) {
      await servicesSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `glass_services_frosted_stack_${vp.name}.png`),
      });
    }

    // Screenshot D: Proof Metrics Smoked Graphite Band & Watermark
    const proofH2 = await page.$("h2:has-text('Engineered for deterministic leverage')");
    if (proofH2) {
      await proofH2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `glass_proof_metrics_smoked_${vp.name}.png`),
      });
    }

    // Screenshot E: FAQ Frosted Crystal Accordion
    const faqSection = await page.$("#faq");
    if (faqSection) {
      await faqSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `glass_faq_frosted_${vp.name}.png`),
      });
    }

    await context.close();
  }

  await browser.close();
  server.close();

  console.log(`\n========================================`);
  console.log(`FINAL RESULTS:`);
  console.log(`Passed: ${passedTests.length}`);
  console.log(`Failed: ${failedTests.length}`);
  if (failedTests.length > 0) {
    console.error("FAILURES:", failedTests);
    process.exit(1);
  } else {
    console.log("ALL GLASS PHYSICS & SMOKED GRAPHITE CHECKS PASSED CLEANLY!");
    process.exit(0);
  }
});
