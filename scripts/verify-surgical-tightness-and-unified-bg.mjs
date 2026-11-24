import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5288;
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
  console.log(`=== STARTING 4-POINT SURGICAL TIGHTNESS & UNIFIED BACKGROUND AUDIT ===`);
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

    // 1. ONE UNIFIED GLOBAL BACKGROUND ACROSS ENTIRE SITE
    console.log("\n--- Point 1: Unified Global Background Layer ---");
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
    assert(backdropStyles.bgColor === "rgb(251, 251, 246)", "Global Studio Backdrop base color is Warm Ivory #FBFBF6");

    // Check fluted glass optical veil
    const flutedVeil = await pageDesk.locator("[data-fluted-glass='global']");
    assert((await flutedVeil.count()) > 0, "Global architectural fluted-glass optical veil exists");

    // Check micro-grain
    const grain = await pageDesk.locator(".film-grain");
    const grainStyles = await grain.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        position: cs.position,
        opacity: cs.opacity,
        zIndex: cs.zIndex,
      };
    });
    console.log("Micro-grain Styles:", grainStyles);
    assert(grainStyles.position === "fixed", "Micro-grain is position: fixed");
    assert(grainStyles.opacity === "0.02" || grainStyles.opacity === "0.025", `Micro-grain has ~2% opacity (found ${grainStyles.opacity})`);

    // Verify all section wrappers are bg-transparent
    const sectionTones = await pageDesk.evaluate(() => {
      const ids = ["#hero", "#tension", "#services", "#difference", "#process", "#work", "#faq"];
      const res = {};
      ids.forEach((id) => {
        const el = document.querySelector(id);
        res[id] = el ? window.getComputedStyle(el).backgroundColor : null;
      });
      const footer = document.querySelector("footer");
      res["footer"] = footer ? window.getComputedStyle(footer).backgroundColor : null;
      return res;
    });
    console.log("Section wrapper background colors:", sectionTones);
    for (const [sec, bg] of Object.entries(sectionTones)) {
      assert(bg === "rgba(0, 0, 0, 0)", `Section ${sec} wrapper is 100% bg-transparent (found ${bg})`);
    }

    // 2. PROCESS LEFT COLUMN POSITIONING (01-04 SITS MID-SCREEN)
    console.log("\n--- Point 2: Process Section Vertical Proportions ---");
    const processSection = await pageDesk.locator("#process");
    await processSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(600);

    const processHeadlineLines = await pageDesk.evaluate(() => {
      const lines = Array.from(document.querySelectorAll("#process h2 .editorial-line")).map((el) => el.textContent.trim());
      const h2 = document.querySelector("#process h2");
      const cs = h2 ? window.getComputedStyle(h2) : null;
      return {
        count: lines.length,
        lines,
        fontSize: cs ? cs.fontSize : null,
        fontWeight: cs ? cs.fontWeight : null,
        lineHeight: cs ? cs.lineHeight : null,
      };
    });
    console.log("Process Headline Audit:", processHeadlineLines);
    assert(processHeadlineLines.count === 3, `Process headline has strictly 3 crisp lines max (found ${processHeadlineLines.count})`);
    assert(processHeadlineLines.lines[0] === "From brief", `Line 1 is 'From brief' (found '${processHeadlineLines.lines[0]}')`);
    assert(processHeadlineLines.lines[1] === "to live system,", `Line 2 is 'to live system,' (found '${processHeadlineLines.lines[1]}')`);
    assert(processHeadlineLines.lines[2] === "in four clear stages.", `Line 3 is 'in four clear stages.' (found '${processHeadlineLines.lines[2]}')`);
    assert(parseInt(processHeadlineLines.fontWeight) === 800, `Process headline has font-weight 800 (found ${processHeadlineLines.fontWeight})`);

    // Check that extra 3-line paragraph under Process headline is removed
    const extraParagraph = await pageDesk.locator("#process .lg\\:col-span-5 p");
    assert((await extraParagraph.count()) === 0, "Extra paragraph under Process headline is completely removed");

    // Check that redundant 'CURRENT STAGE' label is removed
    const currentStageLabel = await pageDesk.locator("#process").getByText("CURRENT STAGE");
    assert((await currentStageLabel.count()) === 0, "Redundant 'CURRENT STAGE' label is removed");

    // Check giant numeral scale and mid-screen positioning
    const numeralElement = await pageDesk.locator("#process .text-gradient-charcoal-silver");
    const numeralStyles = await numeralElement.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      };
    });
    console.log("Process Giant Numeral Styles:", numeralStyles);
    const parsedNumeralSize = parseFloat(numeralStyles.fontSize);
    assert(parsedNumeralSize >= 90, `Process numeral is monumental >= 90px (found ${numeralStyles.fontSize})`);
    assert(parseInt(numeralStyles.fontWeight) === 800, `Process numeral has font-weight 800 (found ${numeralStyles.fontWeight})`);

    // Check vertical positioning relative to viewport and Ask Arché dock
    const numeralBox = await numeralElement.boundingBox();
    const askDock = await pageDesk.locator("[data-ask-arche-dock]");
    const askDockBox = await askDock.boundingBox();
    console.log("Process Numeral Bounding Box:", numeralBox);
    console.log("Ask Arché Dock Bounding Box:", askDockBox);

    if (numeralBox && askDockBox) {
      assert(numeralBox.y > 100, `Process numeral sits comfortably in upper-mid screen (y=${numeralBox.y} > 100)`);
      const verticalClearance = askDockBox.y - (numeralBox.y + numeralBox.height);
      console.log("Vertical clearance between Process numeral bottom and Ask Arché dock:", verticalClearance, "px");
      assert(verticalClearance >= 100, `Process numeral has generous clearance above Ask Arché dock (clearance=${verticalClearance}px >= 100px)`);
    }

    // 3. COMPACT HUG-CONTENT NAVBAR (ZERO EMPTY GAPS)
    console.log("\n--- Point 3: Compact Hug-Content Navbar ---");
    await pageDesk.evaluate(() => window.scrollTo(0, 0));
    await pageDesk.waitForTimeout(400);

    const nav = await pageDesk.locator("nav[aria-label='Primary']");
    const navBox = await nav.boundingBox();
    const navClasses = await nav.getAttribute("class");
    console.log("Desktop Navbar Bounding Box:", navBox);
    console.log("Desktop Navbar Classes:", navClasses);

    assert(navClasses.includes("w-fit"), "Navbar has class 'w-fit' for hug-content sizing");
    assert(navClasses.includes("rounded-full"), "Navbar has rounded-full capsule pill shape");
    assert(navBox.width <= 750, `Navbar is tight compact hug-content (width=${navBox.width}px <= 750px, zero wasted gaps)`);
    assert(navBox.x > 300, `Navbar is horizontally centered (x=${navBox.x}px)`);

    // 4. REMOVE GREEN UNDERLINES & SUBTLE LUMINOUS GREEN LIGHT EFFECT
    console.log("\n--- Point 4: Zero Green Underlines & Soft Ambient Light Glow ---");
    // Check Hero: zero solid underlines
    const heroSolidUnderlines = await pageDesk.evaluate(() => {
      const hero = document.querySelector("#hero");
      if (!hero) return 0;
      // Look for any 2.5px-3px solid lime bars (w > 20px, not 5px circular dots)
      const bars = Array.from(hero.querySelectorAll("span")).filter((el) => {
        const cs = window.getComputedStyle(el);
        const bg = cs.backgroundColor;
        const h = parseFloat(cs.height);
        const w = parseFloat(cs.width);
        return (bg.includes("158, 228, 26") || bg.includes("114, 179, 20")) && h >= 2 && h <= 5 && w > 20;
      });
      return bars.length;
    });
    console.log("Hero solid green underline bars count:", heroSolidUnderlines);
    assert(heroSolidUnderlines === 0, "Hero has ZERO solid green underline bars");

    // Check Hero ambient radial glow behind focal word
    const heroFocalWordStyles = await pageDesk.evaluate(() => {
      const word = document.querySelector("#hero h1 span.relative span.inline-block");
      const glowBackdrop = document.querySelector("#hero h1 span.relative span[aria-hidden='true']");
      const wordCs = word ? window.getComputedStyle(word) : null;
      const glowCs = glowBackdrop ? window.getComputedStyle(glowBackdrop) : null;
      return {
        wordTextShadow: wordCs ? wordCs.textShadow : null,
        glowBg: glowCs ? glowCs.backgroundImage : null,
      };
    });
    console.log("Hero Focal Word Glow Styles:", heroFocalWordStyles);
    assert(
      (heroFocalWordStyles.wordTextShadow && heroFocalWordStyles.wordTextShadow.includes("158, 228, 26")) ||
      (heroFocalWordStyles.glowBg && heroFocalWordStyles.glowBg.includes("158, 228, 26")),
      "Hero focal verb has soft ambient #9EE41A radial light glow aura"
    );

    // Check Manifesto: zero solid underlines
    const manifestoSolidUnderlines = await pageDesk.evaluate(() => {
      const tension = document.querySelector("#tension");
      if (!tension) return 0;
      const bars = Array.from(tension.querySelectorAll("span")).filter((el) => {
        const cs = window.getComputedStyle(el);
        const bg = cs.backgroundColor;
        const h = parseFloat(cs.height);
        const w = parseFloat(cs.width);
        return (bg.includes("158, 228, 26") || bg.includes("114, 179, 20")) && h >= 2 && h <= 5 && w > 20;
      });
      return bars.length;
    });
    console.log("Manifesto solid green underline bars count:", manifestoSolidUnderlines);
    assert(manifestoSolidUnderlines === 0, "Manifesto has ZERO solid green underline bars");

    // Check Manifesto ambient glow
    const manifestoFocalGlow = await pageDesk.evaluate(() => {
      const aura = document.querySelector("#tension p span[aria-hidden='true']");
      return aura ? window.getComputedStyle(aura).backgroundImage : null;
    });
    console.log("Manifesto Focal Ambient Aura:", manifestoFocalGlow);
    assert(manifestoFocalGlow && manifestoFocalGlow.includes("158, 228, 26"), "Manifesto 'connection problem.' has soft ambient #9EE41A radial glow");

    // Screenshots Desktop
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_hero_luminous_glow.png") });
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_compact_navbar.png") });

    await processSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(400);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_process_midscreen_numeral.png") });

    const tensionSection = await pageDesk.locator("#tension");
    await tensionSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(400);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_manifesto_luminous_glow.png") });

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

    const mobileNav = await pageMobile.locator("nav[aria-label='Primary']");
    const mobileNavBox = await mobileNav.boundingBox();
    console.log("Mobile Navbar Bounding Box:", mobileNavBox);
    assert(mobileNavBox.width <= 375, `Mobile navbar fits within 390 viewport (width=${mobileNavBox.width}px)`);

    // Check Process on Mobile
    const mobileProcess = await pageMobile.locator("#process");
    await mobileProcess.scrollIntoViewIfNeeded();
    await pageMobile.waitForTimeout(400);

    const mobileProcessLines = await pageMobile.evaluate(() => {
      return document.querySelectorAll("#process h2 .editorial-line").length;
    });
    console.log("Mobile Process Headline Lines:", mobileProcessLines);
    assert(mobileProcessLines === 3, "Mobile Process headline maintains 3 crisp lines");

    await pageMobile.evaluate(() => window.scrollTo(0, 0));
    await pageMobile.waitForTimeout(400);
    await pageMobile.screenshot({ path: join(ARTIFACTS_DIR, "mobile_surgical_tightness.png") });
    await pageMobile.close();

    console.log("\n========================================");
    console.log(`AUDIT RESULTS: ${passes.length} Passed, ${failures.length} Failed`);
    console.log("========================================");

    if (failures.length > 0) {
      throw new Error(`${failures.length} verification check(s) failed!`);
    }

    console.log("\n🎉 ALL 4-POINT SURGICAL FIX VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
