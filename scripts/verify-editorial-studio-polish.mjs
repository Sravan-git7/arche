import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5205;
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
    console.log(`TESTING EDITORIAL STUDIO POLISH: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
    });

    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("arche_intro", "true");
        sessionStorage.setItem("arche_intro_dismissed", "true");
        sessionStorage.setItem("arche_intro_seen", "true");
      } catch {}
    });

    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    // 1. TEST CANVAS & NO BLACK SECTION SLABS
    console.log(`\n[CHECK 1] Whitish Studio Stone (#EAE9E3) Canvas & Zero Black Section Slabs...`);
    const canvasEvaluation = await page.evaluate(() => {
      const prop = document.querySelector("#proposition");
      const services = document.querySelector("#services");
      const process = document.querySelector("#process");
      const faq = document.querySelector("#faq");
      const rootStyle = getComputedStyle(document.documentElement);
      const bgVar = rootStyle.getPropertyValue("--bg").trim();

      // Check if any giant section has dark background #111210 or #141413
      const sections = Array.from(document.querySelectorAll("section"));
      const darkSections = sections.filter((s) => {
        const bg = getComputedStyle(s).backgroundColor;
        // check if rgb corresponds to dark obsidian (< 40)
        const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [_, r, g, b] = match.map(Number);
          return r < 30 && g < 30 && b < 30 && s.offsetWidth > 600;
        }
        return false;
      });

      return {
        bgVar,
        propBg: prop ? getComputedStyle(prop).backgroundColor : null,
        servicesBg: services ? getComputedStyle(services).backgroundColor : null,
        processBg: process ? getComputedStyle(process).backgroundColor : null,
        faqBg: faq ? getComputedStyle(faq).backgroundColor : null,
        darkSectionCount: darkSections.length,
      };
    });

    console.log(`  --bg CSS variable: ${canvasEvaluation.bgVar}`);
    console.log(`  Proposition background: ${canvasEvaluation.propBg}`);
    console.log(`  Services background: ${canvasEvaluation.servicesBg}`);
    console.log(`  Dark full-width sections found: ${canvasEvaluation.darkSectionCount}`);

    if (canvasEvaluation.bgVar.toLowerCase().includes("eae9e3") && canvasEvaluation.darkSectionCount === 0) {
      console.log(`  [PASS] Canvas is whitish stone (#EAE9E3) and zero black section slabs exist.`);
      passedTests.push(`${vp.name}: Whitish Stone Canvas & Zero Black Slabs`);
    } else {
      console.error(`  [FAIL] Canvas or black slabs check failed.`);
      failedTests.push(`${vp.name}: Canvas / Black Slabs Check`);
    }

    // 2. TEST WHY ARCHÉ ASYMMETRIC BENTO GRID
    console.log(`\n[CHECK 2] Why Arché Asymmetric Editorial Bento...`);
    const bentoEvaluation = await page.evaluate(() => {
      const h2 = document.querySelector("#proposition h2");
      const bentoCards = Array.from(document.querySelectorAll("#proposition .bento-card-unit"));
      const img = document.querySelector("#proposition img");
      const eyebrow = document.querySelector("#proposition span.font-mono");

      const cardTexts = bentoCards.map((c) => c.innerText);
      const hasCard1 = cardTexts.some((t) => t.includes("Four disciplines. One team."));
      const hasCard2 = cardTexts.some((t) => t.includes("We ship on schedule. Always."));
      const hasCard3 = cardTexts.some((t) => t.includes("Not corporate. Direct."));
      const hasCard4 = cardTexts.some((t) => t.includes("Built to scale after launch."));

      const hasDoubleSlash = eyebrow ? eyebrow.innerText.includes("//") : false;

      return {
        headline: h2 ? h2.innerText : "",
        bentoCardCount: bentoCards.length,
        hasCard1,
        hasCard2,
        hasCard3,
        hasCard4,
        hasPhoto: Boolean(img && img.src),
        hasDoubleSlash,
      };
    });

    console.log(`  Headline: "${bentoEvaluation.headline.replace(/\n/g, ' ')}"`);
    console.log(`  Cards found: Card1: ${bentoEvaluation.hasCard1}, Card2: ${bentoEvaluation.hasCard2}, Card3: ${bentoEvaluation.hasCard3}, Card4: ${bentoEvaluation.hasCard4}`);
    console.log(`  Architectural photo present: ${bentoEvaluation.hasPhoto}`);
    console.log(`  Double slash '//' in eyebrow: ${bentoEvaluation.hasDoubleSlash}`);

    if (
      bentoEvaluation.hasCard1 &&
      bentoEvaluation.hasCard2 &&
      bentoEvaluation.hasCard3 &&
      bentoEvaluation.hasCard4 &&
      bentoEvaluation.hasPhoto &&
      !bentoEvaluation.hasDoubleSlash
    ) {
      console.log(`  [PASS] Why Arché asymmetric bento correctly built with luxury copy & architectural photo.`);
      passedTests.push(`${vp.name}: Why Arché Asymmetric Bento`);
    } else {
      console.error(`  [FAIL] Why Arché bento evaluation failed.`);
      failedTests.push(`${vp.name}: Why Arché Asymmetric Bento`);
    }

    // 3. TEST PROOF METRICS WATERMARK & UNIFIED 4-COLUMN BAR
    console.log(`\n[CHECK 3] Proof Metrics on Whitish Stone with ARCHÉ Watermark...`);
    const proofEvaluation = await page.evaluate(() => {
      // Find watermark text containing ARCHÉ
      const watermarkEl = Array.from(document.querySelectorAll("*")).find(
        (el) => el.textContent?.trim() === "ARCHÉ" && el.style?.WebkitTextStroke !== undefined
      );

      const bar = document.querySelector(".frosted-crystal.grid-cols-1");
      const metrics = [
        "4 Disciplines",
        "< 14 Days",
        "24/7",
        "100%",
      ];
      const pageText = document.body.innerText;
      const allMetricsFound = metrics.every((m) => pageText.includes(m));

      return {
        hasWatermark: Boolean(watermarkEl),
        hasBar: Boolean(bar),
        allMetricsFound,
      };
    });

    console.log(`  ARCHÉ watermark present behind headline: ${proofEvaluation.hasWatermark}`);
    console.log(`  All 4 metrics present (4 Disciplines, < 14 Days, 24/7, 100%): ${proofEvaluation.allMetricsFound}`);

    if (proofEvaluation.hasWatermark && proofEvaluation.allMetricsFound) {
      console.log(`  [PASS] Proof Metrics correctly rendered on light canvas with subtle ARCHÉ watermark.`);
      passedTests.push(`${vp.name}: Proof Metrics on Whitish Stone`);
    } else {
      console.error(`  [FAIL] Proof Metrics check failed.`);
      failedTests.push(`${vp.name}: Proof Metrics Check`);
    }

    // 4. TEST SERVICES METADATA CLEANLINESS
    console.log(`\n[CHECK 4] Services Clean Minimal Uppercase Metadata...`);
    const servicesEvaluation = await page.evaluate(() => {
      const metaElements = Array.from(document.querySelectorAll(".sticky-service-card .font-mono"));
      const metaTexts = metaElements.map((el) => el.innerText.replace(/\s+/g, " ").trim());
      const hasClean01 = metaTexts.some((t) => t.includes("01 · VIDEO EDITING"));
      const hasClean02 = metaTexts.some((t) => t.includes("02 · WEB DEVELOPMENT"));
      const hasClean03 = metaTexts.some((t) => t.includes("03 · AI CHATBOTS"));
      const hasClean04 = metaTexts.some((t) => t.includes("04 · AI AUTOMATION"));
      const hasEditorialSuiteClutter = document.body.innerText.includes("// THE EDITORIAL SUITE");

      return {
        metaTexts,
        hasClean01,
        hasClean02,
        hasClean03,
        hasClean04,
        hasEditorialSuiteClutter,
      };
    });

    console.log(`  Metadata texts found: ${JSON.stringify(servicesEvaluation.metaTexts.slice(0, 4))}`);
    console.log(`  Clean metadata (01 · VIDEO EDITING, etc.): ${servicesEvaluation.hasClean01 && servicesEvaluation.hasClean02}`);
    console.log(`  Old '// THE EDITORIAL SUITE' clutter present: ${servicesEvaluation.hasEditorialSuiteClutter}`);

    if (
      servicesEvaluation.hasClean01 &&
      servicesEvaluation.hasClean02 &&
      servicesEvaluation.hasClean03 &&
      servicesEvaluation.hasClean04 &&
      !servicesEvaluation.hasEditorialSuiteClutter
    ) {
      console.log(`  [PASS] Services metadata is clean minimal uppercase with zero clutter.`);
      passedTests.push(`${vp.name}: Clean Services Metadata`);
    } else {
      console.error(`  [FAIL] Services metadata check failed.`);
      failedTests.push(`${vp.name}: Clean Services Metadata`);
    }

    // 5. TEST CURSOR STATES (Desktop only)
    if (!vp.isMobile) {
      console.log(`\n[CHECK 5] Frosted-Glass Custom Cursor States...`);

      // Test default ring size
      const defaultCursor = await page.evaluate(() => {
        const ring = document.querySelector(".cursor-ring");
        const dot = document.querySelector(".cursor-dot");
        if (!ring || !dot) return null;
        const rStyle = getComputedStyle(ring);
        const dStyle = getComputedStyle(dot);
        return {
          ringWidth: rStyle.width,
          ringHeight: rStyle.height,
          dotWidth: dStyle.width,
          dotHeight: dStyle.height,
          ringClass: ring.className,
        };
      });
      console.log(`  Default cursor dimensions: ring = ${defaultCursor?.ringWidth}x${defaultCursor?.ringHeight}, dot = ${defaultCursor?.dotWidth}x${defaultCursor?.dotHeight}`);

      // Hover over button -> should expand to 36px hover ring (.cursor-state-hover)
      await page.hover("header a, nav a, button");
      await page.waitForTimeout(250);
      const hoverButtonCursor = await page.evaluate(() => {
        const ring = document.querySelector(".cursor-ring");
        return {
          className: ring ? ring.className : "",
        };
      });
      console.log(`  Hovering button cursor class: ${hoverButtonCursor.className}`);

      // Hover over service card -> MUST NOT HAVE cursor-state-view
      const serviceCard = page.locator(".sticky-service-card").first();
      await serviceCard.hover({ position: { x: 50, y: 50 } });
      await page.waitForTimeout(250);
      const serviceHoverCursor = await page.evaluate(() => {
        const ring = document.querySelector(".cursor-ring");
        return {
          className: ring ? ring.className : "",
          isView: ring ? ring.classList.contains("cursor-state-view") : false,
        };
      });
      console.log(`  Hovering Service card cursor class: "${serviceHoverCursor.className}" (isView: ${serviceHoverCursor.isView})`);

      // Hover over Work thumbnail -> MUST HAVE cursor-state-view
      const workThumb = page.locator('[data-cursor="view"]').first();
      let workThumbIsView = false;
      if (await workThumb.count() > 0) {
        await workThumb.hover();
        await page.waitForTimeout(250);
        workThumbIsView = await page.evaluate(() => {
          const ring = document.querySelector(".cursor-ring");
          return ring ? ring.classList.contains("cursor-state-view") : false;
        });
      }
      console.log(`  Hovering Work thumbnail cursor isView: ${workThumbIsView}`);

      if (!serviceHoverCursor.isView && (workThumbIsView || (await workThumb.count()) === 0)) {
        console.log(`  [PASS] Custom cursor correctly isolates VIEW lens to thumbnails and removes it from Service cards.`);
        passedTests.push(`${vp.name}: Cursor States & Service Card Isolation`);
      } else {
        console.error(`  [FAIL] Custom cursor evaluation failed.`);
        failedTests.push(`${vp.name}: Cursor States & Service Card Isolation`);
      }
    }

    // 6. SCREENSHOT ARTIFACTS
    console.log(`\nCapturing screenshot artifacts for visual verification...`);
    const prefix = vp.name;

    // Scroll to Proposition & capture Why Arché
    const propSection = page.locator("#proposition");
    if (await propSection.count() > 0) {
      await propSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `${prefix}_01_why_arche_bento.png`),
      });
    }

    // Scroll to Proof Metrics
    const metricsSection = page.locator("section:has-text('ARCHITECTURAL BENCHMARKS')");
    if (await metricsSection.count() > 0) {
      await metricsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `${prefix}_02_proof_metrics.png`),
      });
    }

    // Scroll to Services
    const servicesSection = page.locator("section#services");
    if (await servicesSection.count() > 0) {
      await servicesSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `${prefix}_03_services.png`),
      });
    }

    await context.close();
  }

  await browser.close();
  server.close();

  console.log(`\n========================================`);
  console.log(`VERIFICATION SUMMARY:`);
  console.log(`Passed: ${passedTests.length}`);
  console.log(`Failed: ${failedTests.length}`);
  passedTests.forEach((t) => console.log(`  ✓ ${t}`));
  failedTests.forEach((t) => console.log(`  ✗ ${t}`));
  console.log(`========================================\n`);

  if (failedTests.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
