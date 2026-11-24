import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5279;
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
  console.log(`=== STARTING FULL-SITE BACKGROUND & HEAVY BLACK TYPOGRAPHY AUDIT ===`);
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
    // -------------------------------------------------------------
    // TEST 1: DESKTOP (1440 x 900)
    // -------------------------------------------------------------
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 1440x900 Desktop");
    console.log("========================================");

    const pageDesk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageDesk.addInitScript(() => sessionStorage.setItem("arche_intro", "true"));
    await pageDesk.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await pageDesk.waitForTimeout(800);

    // 1.1 Full-Site Global Background Layer
    const globalBackdrop = await pageDesk.locator("[data-global-studio-backdrop]");
    const backdropStyles = await globalBackdrop.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        position: cs.position,
        zIndex: cs.zIndex,
        pointerEvents: cs.pointerEvents,
        bgColor: cs.backgroundColor,
      };
    });
    console.log("Global Studio Backdrop Styles:", backdropStyles);
    assert(backdropStyles.position === "fixed", "Global Studio Backdrop is position: fixed");
    assert(backdropStyles.zIndex === "-10", "Global Studio Backdrop has z-index: -10");
    assert(backdropStyles.pointerEvents === "none", "Global Studio Backdrop has pointer-events: none");
    assert(backdropStyles.bgColor === "rgb(251, 251, 246)", "Global Studio Backdrop base color is #FBFBF6");

    // Check fluted glass overlay in backdrop
    const flutedVeil = await pageDesk.locator("[data-fluted-glass='global']");
    assert((await flutedVeil.count()) > 0, "Global architectural fluted-glass optical veil exists");

    // Check Services cards opacity (cards must be opaque so stacked cards never bleed text)
    const firstServiceCard = await pageDesk.locator("#services .sticky-service-card").first();
    const cardBg = await firstServiceCard.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    console.log("First Service Card Background Image:", cardBg);
    assert(cardBg.includes("linear-gradient"), "Service card has opaque gradient background so stacked cards never bleed text");

    // 1.2 Heavy Black Display Typography (#0D0E0C & 800 Weight)
    // Hero H1
    const heroH1 = await pageDesk.locator("#hero h1");
    const heroH1Styles = await heroH1.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
        letterSpacing: cs.letterSpacing,
        lineHeight: cs.lineHeight,
      };
    });
    console.log("Hero H1 Styles:", heroH1Styles);
    assert(parseInt(heroH1Styles.fontWeight) === 800, `Hero H1 has font-weight 800 (found ${heroH1Styles.fontWeight})`);
    assert(heroH1Styles.color === "rgb(13, 14, 12)", `Hero H1 color is Jet Black #0D0E0C (found ${heroH1Styles.color})`);
    assert(parseFloat(heroH1Styles.fontSize) >= 90, `Hero H1 is monumental on 1440 desktop (>= 90px, found ${heroH1Styles.fontSize})`);

    // Chapter 02 Manifesto
    const manifestoWord = await pageDesk.locator("#tension .manifesto-word").first();
    const manifestoStyles = await manifestoWord.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
      };
    });
    console.log("Manifesto Styles:", manifestoStyles);
    assert(parseInt(manifestoStyles.fontWeight) === 800, `Manifesto statement has font-weight 800 (found ${manifestoStyles.fontWeight})`);
    assert(parseFloat(manifestoStyles.fontSize) >= 44, `Manifesto statement is monumental (>= 44px, found ${manifestoStyles.fontSize})`);

    // Services H2
    const servicesH2 = await pageDesk.locator("#services h2 span").first();
    const servicesColor = await servicesH2.evaluate((el) => window.getComputedStyle(el).color);
    assert(servicesColor === "rgb(13, 14, 12)", `Services H2 line 1 is Jet Black #0D0E0C (found ${servicesColor})`);

    // TheStudioDifference H2 & Stat Strip
    const diffH2 = await pageDesk.locator("#difference h2 .editorial-line").first();
    const diffColor = await diffH2.evaluate((el) => window.getComputedStyle(el).color);
    assert(diffColor === "rgb(13, 14, 12)", `Why Arché H2 line 1 is Jet Black #0D0E0C (found ${diffColor})`);

    const statNum = await pageDesk.locator("#difference .font-display").first();
    const statStyles = await statNum.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Why Arché Stat Numeral Styles:", statStyles);
    assert(parseInt(statStyles.fontWeight) === 800, `Stat numeral has font-weight 800 (found ${statStyles.fontWeight})`);
    assert(statStyles.color === "rgb(13, 14, 12)", `Stat numeral is Jet Black #0D0E0C (found ${statStyles.color})`);
    assert(parseFloat(statStyles.fontSize) >= 40, `Stat numeral scale is clamp(2.5rem, 3.8vw, 3.5rem) >= 40px (found ${statStyles.fontSize})`);

    // 1.3 04 AI Automation Card Typography & Padding Scale
    const autoCard = await pageDesk.locator("#services .sticky-service-card").nth(3);
    await autoCard.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(600);

    // Toggle button font size
    const toggleBtn = await pageDesk.locator(".au-seg button").first();
    const toggleStyles = await toggleBtn.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      };
    });
    console.log("Automation Mode Toggle Styles:", toggleStyles);
    assert(toggleStyles.fontSize === "12px", `Mode toggle is 12px (found ${toggleStyles.fontSize})`);
    assert(parseInt(toggleStyles.fontWeight) >= 600, `Mode toggle is font-weight 600 (found ${toggleStyles.fontWeight})`);

    // Step row font size and padding
    const stepRow = await pageDesk.locator(".au-pane .grid > div").first().locator("span.font-sans").first();
    const stepRowStyles = await stepRow.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Step Row Text Styles:", stepRowStyles);
    assert(stepRowStyles.fontSize === "13.5px", `Step row text is 13.5px (found ${stepRowStyles.fontSize})`);
    assert(parseInt(stepRowStyles.fontWeight) === 600, `Step row text is font-weight 600 (found ${stepRowStyles.fontWeight})`);
    assert(stepRowStyles.color === "rgb(13, 14, 12)", `Step row text is Jet Black #0D0E0C (found ${stepRowStyles.color})`);

    // Result card title and sub-description
    const resultCardTitle = await pageDesk.locator(".au-pane .au-card span.font-mono.font-bold").first();
    const resultTitleStyles = await resultCardTitle.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Result Card Title Styles:", resultTitleStyles);
    assert(resultTitleStyles.fontSize === "13px", `Result card title is 13px (found ${resultTitleStyles.fontSize})`);
    assert(parseInt(resultTitleStyles.fontWeight) === 700, `Result card title is font-weight 700 (found ${resultTitleStyles.fontWeight})`);
    assert(resultTitleStyles.color === "rgb(13, 14, 12)", `Result card title is Jet Black #0D0E0C (found ${resultTitleStyles.color})`);

    const resultCardTip = await pageDesk.locator(".au-pane .au-card p.font-mono").first();
    const resultTipStyles = await resultCardTip.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Result Card Description Styles:", resultTipStyles);
    assert(resultTipStyles.fontSize === "12px", `Result card description is 12px (found ${resultTipStyles.fontSize})`);
    assert(parseInt(resultTipStyles.fontWeight) === 500, `Result card description is font-weight 500 (found ${resultTipStyles.fontWeight})`);
    assert(resultTipStyles.color === "rgb(52, 56, 50)", `Result card description is crisp #343832 (found ${resultTipStyles.color})`);

    // 1.4 Upgraded Substantial Footer
    const footerSection = await pageDesk.locator("footer");
    await footerSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(600);

    // Left-side editorial statement
    const footerStatement = await pageDesk.locator("footer p >> text=Built for teams that refuse to stitch four agencies together.");
    const statementStyles = await footerStatement.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Footer Editorial Statement Styles:", statementStyles);
    assert(parseFloat(statementStyles.fontSize) >= 22, `Footer statement is >= 22px (found ${statementStyles.fontSize})`);
    assert(parseInt(statementStyles.fontWeight) === 700, `Footer statement is font-weight 700 (found ${statementStyles.fontWeight})`);
    assert(statementStyles.color === "rgb(13, 14, 12)", `Footer statement is Jet Black #0D0E0C (found ${statementStyles.color})`);

    // Navigation links (16px–17px, font-weight: 600, #0D0E0C)
    const footerWorkLink = await pageDesk.locator("footer a >> text=Work");
    const linkStyles = await footerWorkLink.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Footer Nav Link Styles:", linkStyles);
    const parsedLinkSize = parseFloat(linkStyles.fontSize);
    assert(parsedLinkSize >= 16 && parsedLinkSize <= 17.5, `Footer nav link is 16px–17px (found ${linkStyles.fontSize})`);
    assert(parseInt(linkStyles.fontWeight) === 600, `Footer nav link is font-weight 600 (found ${linkStyles.fontWeight})`);
    assert(linkStyles.color === "rgb(13, 14, 12)", `Footer nav link is Jet Black #0D0E0C (found ${linkStyles.color})`);

    // Column titles (12px, font-weight: 700, #343832)
    const colTitle = await pageDesk.locator("footer .wrap .grid p.font-mono >> text=Studio");
    const colTitleStyles = await colTitle.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Footer Column Title Styles:", colTitleStyles);
    assert(colTitleStyles.fontSize === "12px", `Footer column title is 12px (found ${colTitleStyles.fontSize})`);
    assert(parseInt(colTitleStyles.fontWeight) === 700, `Footer column title is font-weight 700 (found ${colTitleStyles.fontWeight})`);
    assert(colTitleStyles.color === "rgb(52, 56, 50)", `Footer column title is #343832 (found ${colTitleStyles.color})`);

    // Oversized Arche wordmark styling
    const wordmark = await pageDesk.locator("footer span[aria-hidden]");
    const wmStyles = await wordmark.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        color: cs.color,
        webkitTextStroke: cs.webkitTextStroke || cs.webkitTextStrokeWidth,
      };
    });
    console.log("Footer Oversized Wordmark Styles:", wmStyles);
    assert(wmStyles.color === "rgba(13, 14, 12, 0.08)", `Wordmark fill is rgba(13, 14, 12, 0.08) (found ${wmStyles.color})`);

    // Footer legal dock clearance
    const legalBar = await pageDesk.locator("footer .wrap.border-t");
    const padLeft = await legalBar.evaluate((el) => window.getComputedStyle(el).paddingLeft);
    console.log("Footer Legal Bar paddingLeft:", padLeft);
    assert(parseFloat(padLeft) >= 320, `Footer legal bar has paddingLeft >= 320px for dock clearance (found ${padLeft})`);

    // Capture screenshots
    await pageDesk.evaluate(() => window.scrollTo(0, 0));
    await pageDesk.waitForTimeout(400);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_hero_heavy_black.png") });

    await autoCard.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(400);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_automation_scaled_text.png") });

    await footerSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(400);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_upgraded_footer.png") });

    await pageDesk.close();

    // -------------------------------------------------------------
    // TEST 2: MOBILE (390 x 844)
    // -------------------------------------------------------------
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 390x844 Mobile");
    console.log("========================================");

    const pageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await pageMobile.addInitScript(() => sessionStorage.setItem("arche_intro", "true"));
    await pageMobile.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await pageMobile.waitForTimeout(800);

    const scrollWidth = await pageMobile.evaluate(() => document.documentElement.scrollWidth);
    console.log("Mobile Document scrollWidth:", scrollWidth);
    assert(scrollWidth <= 390, `No horizontal overflow on mobile: scrollWidth=${scrollWidth} <= 390`);

    const mobileH1 = await pageMobile.locator("#hero h1");
    const mobileH1Styles = await mobileH1.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Mobile Hero H1 Styles:", mobileH1Styles);
    assert(parseInt(mobileH1Styles.fontWeight) === 800, `Mobile H1 is font-weight 800 (found ${mobileH1Styles.fontWeight})`);
    assert(mobileH1Styles.color === "rgb(13, 14, 12)", `Mobile H1 is Jet Black #0D0E0C (found ${mobileH1Styles.color})`);
    assert(parseFloat(mobileH1Styles.fontSize) >= 48, `Mobile H1 scales responsively >= 48px (found ${mobileH1Styles.fontSize})`);

    const mobileFooterPad = await pageMobile.locator("footer .wrap.border-t").evaluate((el) => window.getComputedStyle(el).paddingBottom);
    console.log("Mobile Footer paddingBottom:", mobileFooterPad);
    assert(parseFloat(mobileFooterPad) >= 80, `Mobile footer has paddingBottom >= 80px (found ${mobileFooterPad})`);

    await pageMobile.evaluate(() => window.scrollTo(0, 0));
    await pageMobile.waitForTimeout(400);
    await pageMobile.screenshot({ path: join(ARTIFACTS_DIR, "mobile_fullsite_continuity.png") });
    await pageMobile.close();

    console.log("\n========================================");
    console.log(`AUDIT RESULTS: ${passes.length} Passed, ${failures.length} Failed`);
    console.log("========================================");

    if (failures.length > 0) {
      throw new Error(`${failures.length} verification check(s) failed!`);
    }

    console.log("\n🎉 ALL FULL-SITE BACKGROUND & HEAVY BLACK TYPOGRAPHY CHECKS PASSED WITH 100% SUCCESS!");
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
