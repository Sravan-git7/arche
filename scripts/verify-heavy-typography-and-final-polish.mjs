import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5278;
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
  console.log(`=== STARTING HEAVY DISPLAY WEIGHT & FINAL POLISH AUDIT ===`);
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
    await pageDesk.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await pageDesk.waitForTimeout(1000);

    // 1.1 Hero H1 Heavy Display Weight
    const heroH1 = await pageDesk.locator("#hero h1");
    const heroH1Styles = await heroH1.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        lineHeight: cs.lineHeight,
      };
    });
    console.log("Hero H1 Styles:", heroH1Styles);
    assert(parseInt(heroH1Styles.fontWeight) === 800, `Hero H1 has computed weight 800 (found ${heroH1Styles.fontWeight})`);
    assert(heroH1Styles.fontFamily.includes("Plus Jakarta Sans"), "Hero H1 fontFamily includes Plus Jakarta Sans");
    assert(parseFloat(heroH1Styles.fontSize) >= 85, `Hero H1 is >= 85px on 1440px desktop (found ${heroH1Styles.fontSize})`);

    // 1.2 Section H2s Heavy Display Weight (800)
    // Services H2
    const servicesH2 = await pageDesk.locator("#services h2");
    const servicesH2Weight = await servicesH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    console.log("Services H2 Weight:", servicesH2Weight);
    assert(parseInt(servicesH2Weight) === 800, `Services H2 has weight 800 (found ${servicesH2Weight})`);

    // Why Arché / The Studio Difference H2
    const differenceH2 = await pageDesk.locator("#difference h2");
    const diffH2Weight = await differenceH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    console.log("Difference H2 Weight:", diffH2Weight);
    assert(parseInt(diffH2Weight) === 800, `TheStudioDifference H2 has weight 800 (found ${diffH2Weight})`);

    // Process H2
    const processH2 = await pageDesk.locator("#process h2");
    const processH2Weight = await processH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    console.log("Process H2 Weight:", processH2Weight);
    assert(parseInt(processH2Weight) === 800, `Process H2 has weight 800 (found ${processH2Weight})`);

    // Process Sticky Numeral
    const processNumeral = await pageDesk.locator("#process .text-gradient-charcoal-silver");
    const numeralStyles = await processNumeral.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      };
    });
    console.log("Process Numeral Styles:", numeralStyles);
    assert(parseInt(numeralStyles.fontWeight) === 800, `Process sticky numeral has weight 800 (found ${numeralStyles.fontWeight})`);
    assert(parseFloat(numeralStyles.fontSize) >= 105, `Process sticky numeral is clamp(6.8rem, 10.5vw, 9.5rem) >= 105px (found ${numeralStyles.fontSize})`);

    // Work Section H2
    const workH2 = await pageDesk.locator("#work h2");
    const workH2Weight = await workH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    console.log("Work H2 Weight:", workH2Weight);
    assert(parseInt(workH2Weight) === 800, `Work Section H2 has weight 800 (found ${workH2Weight})`);

    // FAQ H2
    const faqH2 = await pageDesk.locator("#faq h2").first();
    const faqH2Weight = await faqH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    console.log("FAQ H2 Weight:", faqH2Weight);
    assert(parseInt(faqH2Weight) === 800, `FAQ H2 has weight 800 (found ${faqH2Weight})`);

    // Final Dark CTA Card H2
    const darkCtaH2 = await pageDesk.locator("#faq [data-fluted-glass='dark-cta'] ~ div h2");
    const darkCtaH2Weight = await darkCtaH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    console.log("Dark CTA H2 Weight:", darkCtaH2Weight);
    assert(parseInt(darkCtaH2Weight) === 800, `Dark CTA H2 has weight 800 (found ${darkCtaH2Weight})`);

    // 1.3 Work Cards Polish: Zero scope pill chips, single-line caption with dots
    const scopePillCount = await pageDesk.evaluate(() => {
      const pills = Array.from(document.querySelectorAll("#work span")).filter((el) => {
        return el.className.includes("bg-[#141413]/5") || (el.className.includes("rounded-full") && el.textContent.includes("Short-form"));
      });
      return pills.length;
    });
    console.log("Work card scope pill chips count:", scopePillCount);
    assert(scopePillCount === 0, "No scope pill chips in Work cards");

    const workCaption = await pageDesk.locator("#work p.font-mono").first();
    const workCaptionText = await workCaption.textContent();
    console.log("First Work card caption text:", workCaptionText);
    assert(workCaptionText.includes("·"), "Work card uses clean dot-separated single-line caption");

    // 1.4 Footer Polish: Clearances and Wordmark
    const footerWordmark = await pageDesk.locator("footer .wrap span[aria-hidden]");
    const wordmarkStyles = await footerWordmark.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontWeight: cs.fontWeight,
        color: cs.color,
        webkitTextStroke: cs.webkitTextStroke || cs.webkitTextStrokeWidth,
      };
    });
    console.log("Footer giant Arche wordmark styles:", wordmarkStyles);
    assert(parseInt(wordmarkStyles.fontWeight) === 800, `Footer Arche wordmark has weight 800 (found ${wordmarkStyles.fontWeight})`);
    assert(wordmarkStyles.color.includes("rgba(20, 20, 19, 0.06)") || wordmarkStyles.color === "rgba(20, 20, 19, 0.06)", "Footer Arche wordmark has subtle fill rgba(20, 20, 19, 0.06)");

    // Check duplicate brand line under note
    const footerLocationCol = await pageDesk.locator("footer .wrap .grid > div").first();
    const locationColText = await footerLocationCol.textContent();
    console.log("Footer location column text:", locationColText);
    const techMeetsMatches = (locationColText.match(/Technology Meets Creativity/gi) || []).length;
    assert(techMeetsMatches === 1, `Zero duplicate 'Technology Meets Creativity' in footer location block (found exactly ${techMeetsMatches} occurrence from f.note)`);

    // Check Footer legal copyright position vs bottom-left Ask Arché dock
    const legalBar = await pageDesk.locator("footer .wrap.border-t");
    const legalPaddingLeft = await legalBar.evaluate((el) => window.getComputedStyle(el).paddingLeft);
    console.log("Footer legal bar paddingLeft:", legalPaddingLeft);
    const parsedPadLeft = parseFloat(legalPaddingLeft);
    assert(parsedPadLeft >= 320, `Footer legal bar has desktop paddingLeft >= 320px to clear Ask Arché dock (found ${legalPaddingLeft})`);

    const askDock = await pageDesk.locator("[data-ask-arche-dock]");
    const askDockBox = await askDock.boundingBox();
    const legalTextEl = await pageDesk.locator("footer .wrap.border-t p.mono").first();
    const legalTextBox = await legalTextEl.boundingBox();
    console.log("Ask Dock Bounding Box:", askDockBox);
    console.log("Legal Text Bounding Box:", legalTextBox);
    if (askDockBox && legalTextBox) {
      assert(legalTextBox.x >= askDockBox.x + askDockBox.width - 20, `Legal text starts to the right of the dock: text.x=${legalTextBox.x} >= dock.x+width=${askDockBox.x + askDockBox.width}`);
    }

    // Capture screenshots
    await pageDesk.evaluate(() => window.scrollTo(0, 0));
    await pageDesk.waitForTimeout(400);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_heavy_h1_navbar.png") });

    await pageDesk.locator("#work").scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(400);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_work_cards_single_line.png") });

    await pageDesk.locator("footer").scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(400);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_footer_dock_clearance.png") });

    await pageDesk.close();

    // -------------------------------------------------------------
    // TEST 2: MOBILE (390 x 844)
    // -------------------------------------------------------------
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 390x844 Mobile");
    console.log("========================================");

    const pageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await pageMobile.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await pageMobile.waitForTimeout(800);

    // Check horizontal overflow
    const scrollWidth = await pageMobile.evaluate(() => document.documentElement.scrollWidth);
    console.log("Mobile scrollWidth:", scrollWidth);
    assert(scrollWidth <= 390, `No horizontal overflow on mobile: scrollWidth=${scrollWidth} <= 390`);

    // Check Mobile H1 weight
    const mobileH1Weight = await pageMobile.locator("#hero h1").evaluate((el) => window.getComputedStyle(el).fontWeight);
    console.log("Mobile Hero H1 Weight:", mobileH1Weight);
    assert(parseInt(mobileH1Weight) === 800, `Mobile Hero H1 has weight 800 (found ${mobileH1Weight})`);

    // Check Footer mobile bottom padding
    const mobileLegalPaddingBottom = await pageMobile.locator("footer .wrap.border-t").evaluate((el) => window.getComputedStyle(el).paddingBottom);
    console.log("Mobile Footer legal bar paddingBottom:", mobileLegalPaddingBottom);
    assert(parseFloat(mobileLegalPaddingBottom) >= 80, `Mobile footer legal bar has paddingBottom >= 80px (found ${mobileLegalPaddingBottom})`);

    await pageMobile.screenshot({ path: join(ARTIFACTS_DIR, "mobile_heavy_typography.png") });
    await pageMobile.close();

    console.log("\n========================================");
    console.log(`AUDIT RESULTS: ${passes.length} Passed, ${failures.length} Failed`);
    console.log("========================================");

    if (failures.length > 0) {
      throw new Error(`${failures.length} verification check(s) failed!`);
    }

    console.log("\n🎉 ALL AUDIT VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
