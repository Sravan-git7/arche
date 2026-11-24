import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5277;
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
  console.log(`=== STARTING MONUMENTAL TYPOGRAPHY & FROSTED ALABASTER NAVBAR AUDIT ===`);
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

    // 1.1 Navbar checks
    const navbar = await pageDesk.locator("nav[aria-label='Primary']");
    const navStyles = await navbar.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        classes: el.className,
        bg: cs.backgroundColor,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        border: cs.border,
        boxShadow: cs.boxShadow,
        width: cs.width,
        position: cs.position,
        borderRadius: cs.borderRadius,
      };
    });

    console.log("Navbar Computed Styles:", navStyles);
    assert(navStyles.classes.includes("navbar-frosted-alabaster"), "Navbar has class .navbar-frosted-alabaster");
    assert(navStyles.classes.includes("rounded-full"), "Navbar has rounded-full capsule pill shape");
    assert(navStyles.classes.includes("!fixed") || navStyles.position === "fixed", "Navbar is fixed at the top");

    // Check Navbar text & logo colors
    const logoColor = await pageDesk.locator("nav[aria-label='Primary'] a >> text=Arche").evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    console.log("Navbar Logo text color:", logoColor);
    assert(logoColor === "rgb(20, 20, 19)", "Navbar Logo text is Jet Charcoal (#141413)");

    // Check nav links
    const workLinkStyles = await pageDesk.locator("nav[aria-label='Primary'] a >> text=Work").evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Navbar Work link styles:", workLinkStyles);
    assert(workLinkStyles.fontSize === "12px", "Navbar link font size is 12px");
    assert(parseInt(workLinkStyles.fontWeight) >= 500, "Navbar link font weight is 500+ (Inter font-medium)");
    assert(workLinkStyles.color === "rgb(20, 20, 19)" || workLinkStyles.color === "rgb(89, 92, 86)", "Navbar link color is dark charcoal / muted graphite");

    // Check CTA button
    const ctaButton = await pageDesk.locator("nav[aria-label='Primary'] a[href='#/contact']");
    const ctaButtonStyles = await ctaButton.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        fontSize: cs.fontSize,
      };
    });
    console.log("Navbar CTA button styles:", ctaButtonStyles);
    assert(ctaButtonStyles.bg === "rgb(20, 20, 19)", "Navbar CTA button background is solid Jet Charcoal (#141413)");
    assert(ctaButtonStyles.color === "rgb(251, 251, 246)", "Navbar CTA button text is warm ivory (#FBFBF6)");

    // 1.2 Hero Monumental Typography
    const heroH1 = await pageDesk.locator("#hero h1");
    const heroH1Styles = await heroH1.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        maxWidth: cs.maxWidth,
      };
    });
    console.log("Hero H1 Styles (Desktop 1440):", heroH1Styles);
    const parsedH1Size = parseFloat(heroH1Styles.fontSize);
    assert(parsedH1Size >= 85, `Hero H1 is monumental on 1440 desktop (>= 85px). Found ${heroH1Styles.fontSize}`);
    assert(heroH1Styles.fontFamily.includes("Archivo") || heroH1Styles.fontFamily.includes("Inter Tight") || heroH1Styles.fontFamily.includes("Plus Jakarta Sans"), "Hero H1 enforces display font family (Archivo / Inter Tight / Plus Jakarta Sans)");
    assert(parseInt(heroH1Styles.fontWeight) >= 700, "Hero H1 font weight is 700 (bold)");
    assert(heroH1Styles.color === "rgb(13, 14, 12)" || heroH1Styles.color === "rgb(20, 20, 19)", "Hero H1 color is Jet Black #0D0E0C / Jet Charcoal #141413");

    // Check Hero Subhead
    const heroSubhead = await pageDesk.locator("#hero p >> text=Brand film, bespoke web flagships");
    const subheadStyles = await heroSubhead.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        color: cs.color,
        maxWidth: cs.maxWidth,
      };
    });
    console.log("Hero Subhead Styles:", subheadStyles);
    const parsedSubheadSize = parseFloat(subheadStyles.fontSize);
    assert(parsedSubheadSize >= 18 && parsedSubheadSize <= 20, `Hero Subhead is 18px-19px (found ${subheadStyles.fontSize})`);
    assert(subheadStyles.fontFamily.includes("Inter"), "Hero Subhead enforces Inter font family");
    assert(subheadStyles.color === "rgb(72, 76, 69)" || subheadStyles.color === "rgb(74, 77, 70)" || subheadStyles.color === "rgb(82, 85, 78)", "Hero Subhead color is #484C45 / #4A4D46 / #52554E");

    // Check Hero Underline / Ambient Light Aura
    const heroUnderlines = await pageDesk.locator("#hero span[style*='left center']").count();
    console.log("Hero solid underlines count:", heroUnderlines);
    assert(heroUnderlines === 0, "Hero solid underline is deleted in favor of soft ambient radial glow");

    // Check Hero Bottom Bar
    const heroBottomBar = await pageDesk.locator("[data-hero-index-bar]");
    const bottomBarBox = await heroBottomBar.boundingBox();
    console.log("Hero Bottom Bar Bounding Box:", bottomBarBox);
    assert(bottomBarBox.width <= 940, `Hero bottom bar is sleek centered max-w-[920px] (found ${bottomBarBox.width}px)`);

    // Check Ask Arche dock position vs bottom bar (no collision)
    const askDock = await pageDesk.locator("[data-ask-arche-dock]");
    const askDockBox = await askDock.boundingBox();
    console.log("Ask Arché Dock Bounding Box:", askDockBox);
    if (askDockBox && bottomBarBox) {
      const horizontalOverlap =
        askDockBox.x < bottomBarBox.x + bottomBarBox.width &&
        askDockBox.x + askDockBox.width > bottomBarBox.x;
      const verticalOverlap =
        askDockBox.y < bottomBarBox.y + bottomBarBox.height &&
        askDockBox.y + askDockBox.height > bottomBarBox.y;
      assert(!(horizontalOverlap && verticalOverlap), "Ask Arché dock and Hero bottom bar have ZERO collision");
    }

    // 1.3 Chapter 03 (Services) Verification
    console.log("\n========================================");
    console.log("TESTING CHAPTER 03 (SERVICES)");
    console.log("========================================");
    const servicesSection = await pageDesk.locator("#services");
    await servicesSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(600);

    const servicesStyles = await servicesSection.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
      };
    });
    console.log("Services Section Background:", servicesStyles.bg);
    assert(servicesStyles.bg === "rgb(238, 244, 223)" || servicesStyles.bg === "rgba(0, 0, 0, 0)", "Services Section background is soft botanical sage-mist (#EEF4DF) / global backdrop");

    const servicesHeadline = await pageDesk.locator("#services h2");
    const servicesHeadlineStyles = await servicesHeadline.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        lineHeight: cs.lineHeight,
      };
    });
    console.log("Services Headline Styles:", servicesHeadlineStyles);
    const parsedServicesSize = parseFloat(servicesHeadlineStyles.fontSize);
    assert(parsedServicesSize >= 40, `Services headline scale is monumental (>= 40px, found ${servicesHeadlineStyles.fontSize})`);
    assert(parseInt(servicesHeadlineStyles.fontWeight) >= 700, "Services headline is font-bold 700");

    // Verify service card highlights (Inter 12.5px, #52554E, separated by dots)
    const firstCardHighlights = await pageDesk.locator("#services .sticky-service-card").first().locator("span >> text=4K Cinema Master Grades");
    const highlightStyles = await firstCardHighlights.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    console.log("Service Card Highlight Styles:", highlightStyles);
    assert(highlightStyles.fontSize === "12.5px", `Service card highlight font-size is 12.5px (found ${highlightStyles.fontSize})`);
    assert(highlightStyles.fontFamily.includes("Inter"), "Service card highlight font-family is Inter");
    assert(highlightStyles.color === "rgb(82, 85, 78)", "Service card highlight color is #52554E");

    // 1.4 Chapter 05 (How We Work / Process) Verification
    console.log("\n========================================");
    console.log("TESTING CHAPTER 05 (PROCESS)");
    console.log("========================================");
    const processSection = await pageDesk.locator("#process");
    await processSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(600);

    const processStyles = await processSection.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
      };
    });
    console.log("Process Section Background:", processStyles.bg);
    assert(processStyles.bg === "rgb(238, 244, 223)" || processStyles.bg === "rgba(0, 0, 0, 0)", "Process Section background is soft botanical sage-mist (#EEF4DF) / global backdrop");

    const processHeadline = await pageDesk.locator("#process h2");
    const processHeadlineStyles = await processHeadline.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
      };
    });
    console.log("Process Headline Styles:", processHeadlineStyles);
    const parsedProcessSize = parseFloat(processHeadlineStyles.fontSize);
    assert(parsedProcessSize >= 40, `Process headline scale is monumental (>= 40px, found ${processHeadlineStyles.fontSize})`);

    // Check sticky numeral styles
    const processNumeral = await pageDesk.locator("#process .text-gradient-charcoal-silver");
    const numeralStyles = await processNumeral.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
      };
    });
    console.log("Process Giant Sticky Numeral Styles:", numeralStyles);
    const parsedNumeralSize = parseFloat(numeralStyles.fontSize);
    assert(parsedNumeralSize >= 100, `Process numeral is monumental >= 100px (found ${numeralStyles.fontSize})`);
    assert(parseInt(numeralStyles.fontWeight) === 800, `Process numeral has weight 800 font-extrabold (found ${numeralStyles.fontWeight})`);

    // Capture Desktop Screenshots
    await pageDesk.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await pageDesk.waitForTimeout(500);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_hero_frosted_navbar.png") });

    await servicesSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(500);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_services_specs.png") });

    await processSection.scrollIntoViewIfNeeded();
    await pageDesk.waitForTimeout(500);
    await pageDesk.screenshot({ path: join(ARTIFACTS_DIR, "desktop_process_numeral.png") });

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

    // Check horizontal scroll / overflow on mobile
    const scrollWidth = await pageMobile.evaluate(() => document.documentElement.scrollWidth);
    console.log("Mobile Document scrollWidth:", scrollWidth, "(viewport: 390)");
    assert(scrollWidth <= 390, `No horizontal overflow on mobile: scrollWidth=${scrollWidth} <= 390`);

    // Check Mobile Navbar
    const mobileNav = await pageMobile.locator("nav[aria-label='Primary']");
    const mobileNavBox = await mobileNav.boundingBox();
    console.log("Mobile Navbar Bounding Box:", mobileNavBox);
    assert(mobileNavBox.width <= 375, `Mobile navbar fits within 390 viewport (width=${mobileNavBox.width})`);

    // Check Hero H1 on Mobile
    const mobileH1 = await pageMobile.locator("#hero h1");
    const mobileH1Styles = await mobileH1.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      };
    });
    console.log("Mobile Hero H1 Styles:", mobileH1Styles);
    const parsedMobileH1Size = parseFloat(mobileH1Styles.fontSize);
    assert(parsedMobileH1Size >= 48, `Mobile Hero H1 scales responsively (>= 48px, found ${mobileH1Styles.fontSize})`);

    // Capture Mobile Screenshot
    await pageMobile.screenshot({ path: join(ARTIFACTS_DIR, "mobile_hero_frosted_navbar.png") });

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
