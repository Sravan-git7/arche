import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5299;
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
  console.log(`=== STARTING 4-POINT PRECISION AUDIT ===`);
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
    // TEST 0: PRELOADER CURTAIN REVEAL (1440 x 900)
    // -------------------------------------------------------------
    console.log("\n--- Preloader Curtain: Dark Obsidian Opening Reveal ---");
    const introPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await introPage.goto(`http://localhost:${PORT}`);
    const curtain = introPage.locator("[data-arche-curtain='true']");
    assert(await curtain.count() === 1, "Obsidian preloader curtain exists");
    
    await introPage.waitForTimeout(350);
    await introPage.screenshot({ path: join(ARTIFACTS_DIR, "preloader_obsidian_curtain.png") });
    
    const preloaderText = curtain.getByText("Arche Creative Studios", { exact: true });
    assert(await preloaderText.isVisible(), "Preloader wordmark 'Arche Creative Studios' is visible without clipping");

    // Wait for curtain to slide upward
    await introPage.waitForTimeout(2100);
    const curtainPost = await curtain.count();
    assert(curtainPost === 0 || await curtain.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return cs.pointerEvents === "none" || cs.opacity === "0" || parseFloat(cs.transform.split(",")[5]) < -100;
    }), "Curtain exited smoothly and does not block clicks");
    await introPage.close();

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
    console.log("\n--- Point 1: Fluted Glass & Green Mist Global Background ---");
    const globalBackdrop = pageDesk.locator("[data-global-studio-backdrop]");
    assert(await globalBackdrop.count() === 1, "Exactly one global backdrop element rendered");

    const backdropStyles = await globalBackdrop.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        position: cs.position,
        zIndex: cs.zIndex,
        pointerEvents: cs.pointerEvents,
        bgColor: cs.backgroundColor,
      };
    });
    console.log("Global Backdrop Styles:", backdropStyles);
    assert(backdropStyles.position === "fixed", "Global backdrop is position: fixed");
    assert(backdropStyles.zIndex === "0", `Global backdrop has z-index: 0 (got: ${backdropStyles.zIndex})`);
    assert(backdropStyles.pointerEvents === "none", "Global backdrop has pointer-events: none");

    // Check body and root are transparent
    const bodyRootStyles = await pageDesk.evaluate(() => {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const rootBg = window.getComputedStyle(document.getElementById("root")).backgroundColor;
      const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
      return { bodyBg, rootBg, htmlBg };
    });
    console.log("Body/Root/HTML Backgrounds:", bodyRootStyles);
    assert(
      bodyRootStyles.bodyBg === "rgba(0, 0, 0, 0)" || bodyRootStyles.bodyBg === "transparent",
      `body background is transparent !important (got: ${bodyRootStyles.bodyBg})`
    );
    assert(
      bodyRootStyles.rootBg === "rgba(0, 0, 0, 0)" || bodyRootStyles.rootBg === "transparent",
      `#root background is transparent !important (got: ${bodyRootStyles.rootBg})`
    );

    // Check all section wrappers are transparent
    const sectionBgStyles = await pageDesk.evaluate(() => {
      const sections = ["hero", "tension", "services", "difference", "process", "work", "faq"];
      const res = {};
      sections.forEach((id) => {
        const el = document.getElementById(id);
        res[id] = el ? window.getComputedStyle(el).backgroundColor : null;
      });
      return res;
    });
    console.log("Section Backgrounds:", sectionBgStyles);
    Object.entries(sectionBgStyles).forEach(([id, bg]) => {
      assert(
        bg === "rgba(0, 0, 0, 0)" || bg === "transparent",
        `Section #${id} wrapper is transparent (got: ${bg})`
      );
    });

    const flutedGlassEl = pageDesk.locator("[data-fluted-glass='global']");
    assert(await flutedGlassEl.count() === 1, "Global fluted-glass element exists");

    const flutedStyles = await flutedGlassEl.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bgImage: cs.backgroundImage,
        opacity: cs.opacity,
      };
    });
    console.log("Fluted Glass Styles:", flutedStyles);
    assert(
      flutedStyles.bgImage.includes("repeating-linear-gradient"),
      "Fluted glass has repeating-linear-gradient texture"
    );
    assert(
      parseFloat(flutedStyles.opacity) >= 0.9,
      `Fluted glass opacity is clearly visible (got ${flutedStyles.opacity})`
    );

    // Hero Line 1 & Line 2 Immediate Visibility and Specular Gradient
    const heroH1 = pageDesk.locator("#hero h1");
    const heroLine1 = heroH1.getByText("Systems that make");
    const heroLine2 = heroH1.getByText("businesses");
    const heroWord = heroH1.locator(".shiny-ink-text").last();

    assert(await heroLine1.isVisible(), "Hero Line 1 'Systems that make' is visible");
    assert(await heroLine2.isVisible(), "Hero Line 2 'businesses' is visible immediately on load");
    assert(await heroWord.isVisible(), "Hero kinetic verb is visible immediately on load");

    const heroStyles = await heroH1.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundImage,
        color: cs.color,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        textShadow: cs.textShadow,
      };
    });
    console.log("Hero H1 Styles:", heroStyles);
    assert(heroStyles.fontWeight === "700", `Hero H1 is weight 700 (got: ${heroStyles.fontWeight})`);
    assert(heroStyles.fontFamily.includes("Inter Tight"), `Hero H1 uses Inter Tight font (got: ${heroStyles.fontFamily})`);
    assert(heroStyles.color === "rgb(17, 18, 15)", `Hero H1 is crisp solid #11120F ink (got: ${heroStyles.color})`);
    assert(heroStyles.bg === "none" || heroStyles.bg === "", `Hero H1 has NO background linear-gradient causing black box (got: ${heroStyles.bg})`);

    // Verify ZERO solid black rectangles across all section headlines
    const headlines = ["#hero h1", "#services h2", "#difference h2", "#process h2", "#work h2", "#faq h2"];
    for (const sel of headlines) {
      const count = await pageDesk.locator(sel).count();
      for (let i = 0; i < count; i++) {
        const el = pageDesk.locator(sel).nth(i);
        const res = await el.evaluate((node) => {
          const cs = window.getComputedStyle(node);
          return {
            bg: cs.backgroundImage,
            webkitTextFillColor: cs.webkitTextFillColor,
            color: cs.color,
          };
        });
        assert(res.bg === "none" || res.bg === "", `${sel} [${i}] has NO background linear-gradient (got: "${res.bg}")`);
        assert(res.webkitTextFillColor !== "transparent", `${sel} [${i}] text-fill-color is NOT transparent (got: "${res.webkitTextFillColor}")`);
      }
    }

    // Verify Point 3: Shiny multi-stop metallic ink text on inner spans
    console.log("\n--- Point 3: Shiny Multi-Stop Metallic Ink Text ---");
    const shinySpans = pageDesk.locator(".shiny-ink-text");
    const shinyCount = await shinySpans.count();
    console.log("Shiny ink text elements found:", shinyCount);
    assert(shinyCount >= 4, `Found ${shinyCount} .shiny-ink-text elements (expected >= 4)`);
    const shinyStyle = await shinySpans.first().evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundImage,
        clip: cs.webkitBackgroundClip,
        fillColor: cs.webkitTextFillColor,
      };
    });
    console.log("Shiny ink text style:", shinyStyle);
    assert(shinyStyle.bg.includes("linear-gradient"), ".shiny-ink-text uses multi-stop linear gradient");
    assert(shinyStyle.clip === "text", ".shiny-ink-text has background-clip: text");
    assert(shinyStyle.fillColor === "rgba(0, 0, 0, 0)" || shinyStyle.fillColor === "transparent", ".shiny-ink-text has transparent text fill");

    // Verify Point 4: Dual-Contrast Halo Cursor & #9EE41A center dot
    console.log("\n--- Point 4: Dual-Contrast Halo Cursor ---");
    const cursorDotStyles = await pageDesk.locator(".cursor-dot").evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        width: cs.width,
        height: cs.height,
        boxShadow: cs.boxShadow,
      };
    });
    console.log("Cursor Dot Styles:", cursorDotStyles);
    assert(cursorDotStyles.bg === "rgb(255, 255, 255)", `Cursor dot is #FFFFFF white (got: ${cursorDotStyles.bg})`);
    assert(cursorDotStyles.width === "4px", `Cursor dot width is 4px (got: ${cursorDotStyles.width})`);

    const cursorRingStyles = await pageDesk.locator(".cursor-ring").evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        width: cs.width,
        height: cs.height,
        border: cs.border,
        boxShadow: cs.boxShadow,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
      };
    });
    console.log("Cursor Ring Styles:", cursorRingStyles);
    assert(cursorRingStyles.width === "32px", `Cursor ring is 32px (got: ${cursorRingStyles.width})`);
    assert(cursorRingStyles.backdropFilter.includes("blur(8px)"), `Cursor ring has 8px blur halo (got: ${cursorRingStyles.backdropFilter})`);
    assert(cursorRingStyles.boxShadow.includes("rgba(0, 0, 0, 0.12)"), `Cursor ring has awmedia smoked shadow (got: ${cursorRingStyles.boxShadow})`);

    // 2. WIDER, FULL-PROPORTION FROSTED-ALABASTER NAVBAR WITH MEGA-DROPDOWNS
    console.log("\n--- Point 2: nav-pill glass Navbar & Mega-Dropdowns ---");
    const navHeader = pageDesk.locator("header.nav#nav");
    assert(await navHeader.count() === 1, "header.nav#nav container exists");

    const navPill = pageDesk.locator(".nav-pill.glass[data-liquid='pill']");
    assert(await navPill.count() === 1, ".nav-pill.glass[data-liquid='pill'] exists");

    const navPillBox = await navPill.boundingBox();
    console.log("Navbar Pill bounding box:", navPillBox);
    assert(
      navPillBox && navPillBox.height >= 58 && navPillBox.height <= 66,
      `Navbar pill height is ~64px (got ${navPillBox?.height.toFixed(1)}px)`
    );
    assert(
      navPillBox && navPillBox.width >= 1180 && navPillBox.width <= 1230,
      `Navbar pill width is max-w-[1220px] (got ${navPillBox?.width.toFixed(1)}px)`
    );

    // Verify 3-Zone structure inside .nav-pill:
    const navLogo = navPill.locator(".nav-logo");
    assert(await navLogo.count() === 1, "Zone 1: .nav-logo exists");
    const navLogoBadge = navLogo.locator(".ac-monogram-badge");
    assert(await navLogoBadge.count() === 1, "Navbar logo uses crisp obsidian badge (.ac-monogram-badge)");

    const navLinks = navPill.locator(".nav-links");
    assert(await navLinks.count() === 1, "Zone 2: .nav-links exists");

    const navSide = navPill.locator(".nav-side");
    assert(await navSide.count() === 1, "Zone 3: .nav-side exists");

    const navItemsCount = await navLinks.locator("a, button").count();
    console.log("Navbar interactive items count inside .nav-links:", navItemsCount);
    assert(navItemsCount === 4, `Navbar has exactly 4 interactive links/triggers (Work, Services, Pricing, FAQ; Process removed) in center zone (got ${navItemsCount})`);

    const startBtn = navSide.getByText("Start a Project");
    assert(await startBtn.count() >= 1, "Start a Project button present in nav-side");

    // Test Services ▾ Mega-Dropdown
    const servicesTrigger = navLinks.getByRole("button", { name: /services/i });
    assert(await servicesTrigger.count() === 1, "Services ▾ dropdown trigger exists");
    await servicesTrigger.hover();
    await pageDesk.waitForTimeout(350);
    const servicesMega = pageDesk.locator("[data-megamenu-panel='services']");
    assert(await servicesMega.isVisible(), "Services mega-dropdown opens on hover");

    // Verify Point 1: Crisp & readable surface opacity + blur + shadow
    const servicesMegaStyles = await servicesMega.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        border: cs.border,
        boxShadow: cs.boxShadow,
      };
    });
    console.log("Services Mega Dropdown Styles:", servicesMegaStyles);
    assert(
      servicesMegaStyles.bg === "rgba(245, 242, 226, 0.96)" || servicesMegaStyles.bg === "rgba(232, 235, 225, 0.96)",
      `Mega-dropdown surface is warm cream-ivory rgba(245, 242, 226, 0.96) (got: ${servicesMegaStyles.bg})`
    );
    assert(
      servicesMegaStyles.backdropFilter.includes("blur(28px)"),
      `Mega-dropdown has 28px blur (got: ${servicesMegaStyles.backdropFilter})`
    );

    const creativeCol = servicesMega.getByText("CREATIVE & FILM");
    const webCol = servicesMega.getByText("WEB & PRODUCT");
    const aiCol = servicesMega.getByText("AI & AUTOMATION");
    const highlightCard = servicesMega.getByText("ONE CONNECTED SYSTEM");
    assert(await creativeCol.isVisible(), "Services mega-menu displays 'CREATIVE & FILM' column");
    assert(await webCol.isVisible(), "Services mega-menu displays 'WEB & PRODUCT' column");
    assert(await aiCol.isVisible(), "Services mega-menu displays 'AI & AUTOMATION' column");
    assert(await highlightCard.isVisible(), "Services mega-menu displays 'ONE CONNECTED SYSTEM' card");

    // Check featured card has soft sage-ivory styling
    const featuredCardStyles = await highlightCard.locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')]").first().evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundImage,
        color: cs.color,
      };
    });
    console.log("Featured Card Styles:", featuredCardStyles);
    assert(
      featuredCardStyles.bg.includes("linear-gradient"),
      "Featured card uses linear-gradient background"
    );
    assert(
      featuredCardStyles.color === "rgb(20, 20, 19)",
      `Featured card has crisp dark text (got: ${featuredCardStyles.color})`
    );

    // Capture screenshot with Services dropdown open over Hero to verify zero text bleed-through
    await pageDesk.screenshot({
      path: join(ARTIFACTS_DIR, "precision_desktop_services_dropdown.png"),
      clip: { x: 0, y: 0, width: 1440, height: 800 },
    });
    console.log("Captured precision_desktop_services_dropdown.png");

    // Test Work ▾ Mega-Dropdown
    const workTrigger = navLinks.getByRole("button", { name: /work/i });
    assert(await workTrigger.count() === 1, "Work ▾ dropdown trigger exists");
    await workTrigger.hover();
    await pageDesk.waitForTimeout(350);
    const workMega = pageDesk.locator("[data-megamenu-panel='work']");
    assert(await workMega.isVisible(), "Work mega-dropdown opens on hover");

    const retentionBuild = workMega.getByText("Retention Edit System");
    const narrativeBuild = workMega.getByText("Long-form Narrative Cut");
    const studioBuild = workMega.getByText("Studio Site System");
    const aiOpsBuild = workMega.getByText("AI Ops Pipeline");
    assert(await retentionBuild.isVisible(), "Work mega-menu displays 'Retention Edit System'");
    assert(await narrativeBuild.isVisible(), "Work mega-menu displays 'Long-form Narrative Cut'");
    assert(await studioBuild.isVisible(), "Work mega-menu displays 'Studio Site System'");
    assert(await aiOpsBuild.isVisible(), "Work mega-menu displays 'AI Ops Pipeline'");

    // Close dropdown by moving pointer away
    await pageDesk.mouse.move(10, 10);
    await pageDesk.waitForTimeout(350);

    // Corner marks removed from Hero
    const cornerMarkLeft = await pageDesk.locator("text='ARCHÉ · 01'").count();
    const eyebrowCount = await pageDesk.getByText("ARCHÉ CREATIVE STUDIOS", { exact: false }).count();
    assert(cornerMarkLeft === 0, `Hero corner label ARCHÉ · 01 is removed (count: ${cornerMarkLeft})`);
    assert(eyebrowCount >= 1, `Eyebrow text ARCHÉ CREATIVE STUDIOS is present (count: ${eyebrowCount})`);

    // Dark CTA card has zero fluted glass stripes
    const darkCtaFluted = await pageDesk.locator("[data-fluted-glass='dark-cta']").count();
    assert(darkCtaFluted === 0, `Dark Obsidian CTA card has zero fluted-glass stripes (count: ${darkCtaFluted})`);

    // Check scroll-lit statement words on Why Arché and Pre-CTA
    const diffStatementWords = await pageDesk.locator(".diff-statement-word").count();
    assert(diffStatementWords >= 10, `Why Arché intro statement has scroll-lit words (got ${diffStatementWords})`);

    const preCtaWords = await pageDesk.locator(".pre-cta-word").count();
    assert(preCtaWords >= 10, `Pre-CTA editorial statement has scroll-lit words (got ${preCtaWords})`);

    // Live Chat Dock & Interactive Drawer
    console.log("\n--- Bottom-Left Live Chat Dock & Drawer ---");
    const dock = pageDesk.locator("[data-ask-arche-dock]");
    assert(await dock.count() === 1, "Bottom-left Live Chat dock exists");
    const liveChatLabel = dock.getByText("Live chat");
    assert(await liveChatLabel.isVisible(), "Live chat label is visible");
    
    const waBtn = dock.locator("a[href*='wa.me/917995937536']");
    assert(await waBtn.count() === 1, "WhatsApp button opens https://wa.me/917995937536");

    const chatToggle = dock.locator("button[aria-label='Toggle Live Chat Drawer']");
    await chatToggle.click();
    await pageDesk.waitForTimeout(300);

    const chatDrawer = pageDesk.locator("[role='dialog'][aria-label='Arché Studio Live Chat']");
    assert(await chatDrawer.isVisible(), "Live chat drawer opened successfully");
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_live_chat_drawer.png") });

    const quickPill = chatDrawer.getByText("How much does a system cost?");
    assert(await quickPill.count() === 1, "Quick-question pill exists");
    await quickPill.click();
    await pageDesk.waitForTimeout(450);

    const studioAnswer = chatDrawer.getByText("Every project is scoped to your exact deliverables");
    assert(await studioAnswer.count() >= 1, "Studio animated smart reply to quick question");

    // Close drawer
    await chatToggle.click();
    await pageDesk.waitForTimeout(200);

    // 3D Micro-Tilt Cards
    const tiltCards = await pageDesk.locator(".tilt-card").count();
    console.log("Tilt cards count:", tiltCards);
    assert(tiltCards >= 4, `Found ${tiltCards} 3D tilt cards (expected >= 4)`);

    // 3. SMART TYPOGRAPHIC WEIGHT HIERARCHY & STAT STRIP & ZERO GREEN HEADLINE TEXT
    console.log("\n--- Point 3: Typographic Weight Hierarchy, Stat Strip & Zero Green Text ---");
    // Manifesto: ZERO green text
    const manifestoWordsColors = await pageDesk.locator("#tension p .manifesto-word").evaluateAll((elements) => {
      return elements.map((el) => window.getComputedStyle(el).color);
    });
    const hasGreen = manifestoWordsColors.some((c) =>
      c.includes("90, 143, 14") || c.includes("114, 179, 20") || c.includes("158, 228, 26")
    );
    assert(!hasGreen, "Chapter 02 (Manifesto) has ZERO green text anywhere (all uniform sculpted dark ink)");

    // Section H2s: Inter Tight 700
    const manifestoHeadline = pageDesk.locator("#tension p").first();
    const manifestoWeight = await manifestoHeadline.evaluate((el) => window.getComputedStyle(el).fontWeight);
    assert(manifestoWeight === "700", `Manifesto headline is weight 700 (got: ${manifestoWeight})`);

    const servicesH2 = pageDesk.locator("#services h2");
    const servicesH2Weight = await servicesH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    assert(servicesH2Weight === "700", `Services H2 is weight 700 (got: ${servicesH2Weight})`);

    const diffH2 = pageDesk.locator("#difference h2");
    const diffH2Weight = await diffH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    assert(diffH2Weight === "700", `Difference H2 is weight 700 (got: ${diffH2Weight})`);

    const processH2 = pageDesk.locator("#process h2");
    const processH2Weight = await processH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    assert(processH2Weight === "700", `Process H2 is weight 700 (got: ${processH2Weight})`);

    const workH2 = pageDesk.locator("#work h2");
    const workH2Weight = await workH2.evaluate((el) => window.getComputedStyle(el).fontWeight);
    assert(workH2Weight === "700", `Work H2 is weight 700 (got: ${workH2Weight})`);

    // Tight Section Rhythm (Zero 350px Dead Voids)
    const sectionPaddings = await pageDesk.evaluate(() => {
      const getPt = (id) => parseInt(window.getComputedStyle(document.getElementById(id)).paddingTop, 10);
      return {
        tensionPt: getPt("tension"),
        servicesPt: getPt("services"),
        differencePt: getPt("difference"),
        processPt: getPt("process"),
        workPt: getPt("work"),
        faqPt: getPt("faq"),
      };
    });
    console.log("Section Top Paddings (px):", sectionPaddings);
    assert(sectionPaddings.tensionPt <= 100, `Manifesto padding is compact (got: ${sectionPaddings.tensionPt}px)`);
    assert(sectionPaddings.servicesPt <= 80, `Services padding is tight (got: ${sectionPaddings.servicesPt}px)`);
    assert(sectionPaddings.differencePt <= 100, `Difference padding is compact (got: ${sectionPaddings.differencePt}px)`);
    assert(sectionPaddings.processPt <= 100, `Process padding is compact (got: ${sectionPaddings.processPt}px)`);
    assert(sectionPaddings.workPt <= 100, `Work padding is compact (got: ${sectionPaddings.workPt}px)`);
    assert(sectionPaddings.faqPt <= 100, `FAQ padding is compact (got: ${sectionPaddings.faqPt}px)`);

    // Why Arché Stat Strip Layout
    const statCols = pageDesk.locator("#difference [data-cursor='hover'], #difference .frosted-ivory-card > div");
    const stat1Num = pageDesk.locator("#difference").getByText("4", { exact: true });
    assert(await stat1Num.count() >= 1, "Stat 01 large numeral '4' is present");

    const stat1Label = pageDesk.locator("#difference").getByText("Disciplines", { exact: true });
    assert(await stat1Label.count() >= 1, "Stat 01 label 'Disciplines' is on separate line below");

    const stat2Num = pageDesk.locator("#difference").getByText("< 14", { exact: true });
    assert(await stat2Num.count() >= 1, "Stat 02 large numeral '< 14' is present");

    const stat2Label = pageDesk.locator("#difference").getByText("Days", { exact: true });
    assert(await stat2Label.count() >= 1, "Stat 02 label 'Days' is on separate line below");

    const stat3Num = pageDesk.locator("#difference").getByText("24/7", { exact: true });
    assert(await stat3Num.count() >= 1, "Stat 03 large numeral '24/7' is present");

    const stat4Num = pageDesk.locator("#difference").getByText("100%", { exact: true });
    assert(await stat4Num.count() >= 1, "Stat 04 large numeral '100%' is present");

    // 4. FIX HOW WE WORK (01-04) STOPPING AT 03
    console.log("\n--- Point 4: Process Step 04 Trigger Activation ---");
    // Scroll down to #process
    await pageDesk.locator("#process").scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(600);

    const processCards = pageDesk.locator("#process [data-cursor='hover']");
    const cardCount = await processCards.count();
    console.log("Process cards found:", cardCount);
    assert(cardCount === 4, `Process section has 4 step cards (got: ${cardCount})`);

    // Scroll smoothly through process section down to card 04
    const card4 = processCards.nth(3);
    await card4.scrollIntoViewIfNeeded();
    // Wait for smooth scroll and CSS transition to fully settle to 1.0
    await pageDesk.waitForFunction((el) => {
      return parseFloat(window.getComputedStyle(el).opacity) >= 0.98;
    }, await card4.elementHandle(), { timeout: 4000 });

    // Check sticky numeral in left column
    const stickyNumeral = pageDesk.locator("#process .text-gradient-charcoal-silver");
    const numeralText = await stickyNumeral.innerText();
    console.log("Sticky Numeral at Card 04:", numeralText);
    assert(
      numeralText.trim() === "04",
      `Sticky numeral switches to 04 when scrolling to Card 04 (got: ${numeralText.trim()})`
    );

    // Check progress bar width
    const progressBar = pageDesk.locator("#process div.h-full.bg-\\[\\#9EE41A\\]");
    const progressWidth = await progressBar.evaluate((el) => el.style.width);
    console.log("Progress Bar Width at Card 04:", progressWidth);
    assert(
      progressWidth === "100%",
      `Progress bar reaches 100% at Card 04 (got: ${progressWidth})`
    );

    // Check phase label in sticky left
    const phaseLabel = pageDesk.locator("#process").getByText("04 · LAUNCH & SCALE");
    assert(
      await phaseLabel.count() >= 1,
      "Sticky phase indicator shows '04 · LAUNCH & SCALE'"
    );

    // Check Card 04 active contrast
    const card4Opacity = await card4.evaluate((el) => window.getComputedStyle(el).opacity);
    console.log("Card 04 Opacity:", card4Opacity);
    assert(
      parseFloat(card4Opacity) >= 0.95,
      `Card 04 is fully illuminated (opacity >= 0.95, got ${card4Opacity})`
    );

    // Take screenshot of Process at Card 04 while scrolled there
    await pageDesk.screenshot({
      path: join(ARTIFACTS_DIR, "precision_desktop_process_04.png"),
    });
    console.log("Captured precision_desktop_process_04.png");

    // Scroll to #difference to capture stat strip
    await pageDesk.locator("#difference").scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(300);
    await pageDesk.locator("#difference").screenshot({
      path: join(ARTIFACTS_DIR, "precision_desktop_stat_strip.png"),
    });
    console.log("Captured precision_desktop_stat_strip.png");

    // Scroll back to top for hero screenshot
    await pageDesk.evaluate(() => window.scrollTo(0, 0));
    await pageDesk.waitForTimeout(300);
    await pageDesk.screenshot({
      path: join(ARTIFACTS_DIR, "precision_desktop_hero_navbar.png"),
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });
    console.log("Captured precision_desktop_hero_navbar.png");

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

    const mobileScrollWidth = await pageMobile.evaluate(() => document.documentElement.scrollWidth);
    console.log("Mobile scrollWidth:", mobileScrollWidth);
    assert(
      mobileScrollWidth <= 390,
      `Mobile scrollWidth does not exceed 390px viewport (got ${mobileScrollWidth}px)`
    );

    await pageMobile.screenshot({
      path: join(ARTIFACTS_DIR, "precision_mobile_hero.png"),
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured precision_mobile_hero.png");

    await pageMobile.close();

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n========================================");
    console.log(`TOTAL PASSES: ${passes.length}`);
    console.log(`TOTAL FAILURES: ${failures.length}`);
    console.log("========================================");

    if (failures.length > 0) {
      console.error("\nFAILURES ENCOUNTERED:");
      failures.forEach((f) => console.error(` - ${f}`));
      process.exit(1);
    } else {
      console.log("\nALL 4-POINT PRECISION FIX CHECKS PASSED PERFECTLY!");
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});
