import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5218;
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
    // ========================================================
    // 1. DESKTOP VIEWPORT: 1440x900
    // ========================================================
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

    // 1.1 Canvas Background (#FBFBF6)
    const canvasBg = await page.evaluate(() => {
      const el = document.querySelector("main > div, #hero, .w-full.bg-\\[\\#FBFBF6\\]");
      return window.getComputedStyle(el || document.body).backgroundColor;
    });
    console.log("Canvas BG computed:", canvasBg);
    assert(
      canvasBg.includes("251, 251, 246") || canvasBg.includes("251,251,246"),
      `Canvas background is Warm Studio Ivory (#FBFBF6) [got: ${canvasBg}]`
    );

    // 1.2 Card Surface Palette & Tone (No stark #FFFFFF cards)
    console.log("\n--- Checking Card Surface Palette & Inset Bevel ---");
    const cardAudit = await page.evaluate(() => {
      const selectors = [
        "#difference .frosted-ivory-card",
        "#difference .conviction-card",
        "#services .sticky-service-card",
        "#process .frosted-ivory-card",
        "#faq .faq-card",
      ];
      const results = [];
      for (const sel of selectors) {
        const els = Array.from(document.querySelectorAll(sel));
        for (const el of els) {
          const style = window.getComputedStyle(el);
          results.push({
            selector: sel,
            bg: style.background,
            bgImg: style.backgroundImage,
            bgColor: style.backgroundColor,
            border: style.border,
            boxShadow: style.boxShadow,
            opacity: style.opacity,
          });
        }
      }
      return results;
    });

    console.log(`Audited ${cardAudit.length} cards across Difference, Services, Process, and FAQ.`);
    assert(cardAudit.length >= 10, `Found at least 10 cards across sections [found: ${cardAudit.length}]`);

    let starkWhiteCards = 0;
    let hasLimestoneGradient = 0;
    for (const c of cardAudit) {
      // Check if background is plain flat rgb(255, 255, 255)
      if (
        (c.bgColor === "rgb(255, 255, 255)" && (!c.bgImg || c.bgImg === "none")) ||
        c.bg.includes("rgba(255, 255, 255, 1)")
      ) {
        starkWhiteCards++;
      }
      if (c.bgImg.includes("gradient") || c.bg.includes("linear-gradient")) {
        hasLimestoneGradient++;
      }
    }
    assert(starkWhiteCards === 0, `Zero stark #FFFFFF flat cards detected across audited sections [got: ${starkWhiteCards}]`);
    assert(
      hasLimestoneGradient >= cardAudit.length,
      `All ${cardAudit.length} audited cards use cohesive limestone gradient fill [got: ${hasLimestoneGradient}]`
    );

    // 1.3 Tactile Bevel & Specular Rim Check
    const sampleCard = cardAudit[0];
    console.log("Sample card border:", sampleCard?.border);
    console.log("Sample card boxShadow:", sampleCard?.boxShadow);
    assert(
      sampleCard?.boxShadow.includes("inset") && sampleCard?.boxShadow.includes("255, 255, 255"),
      `Cards have tactile inset specular rim [boxShadow: ${sampleCard?.boxShadow}]`
    );

    // 1.4 SERVICES STICKY STACKING & OPACITY RECESSION
    console.log("\n--- Checking Services Sticky Stacking & Opacity Recession ---");
    // Scroll to Services section
    await page.evaluate(() => {
      document.querySelector("#services")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(600);

    const serviceCardsInit = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("#services .sticky-service-card"));
      return cards.map((c, i) => {
        const style = window.getComputedStyle(c);
        return {
          index: i,
          position: style.position,
          top: style.top,
          zIndex: style.zIndex,
          opacity: parseFloat(style.opacity),
          bg: style.background,
        };
      });
    });

    assert(serviceCardsInit.length === 4, `Found 4 Service Cards [found: ${serviceCardsInit.length}]`);
    assert(
      serviceCardsInit.every((c) => c.position === "sticky" && (c.top === "96px" || c.top.includes("96px"))),
      "All 4 Service cards have position: sticky; top: 96px"
    );
    assert(
      serviceCardsInit.every((c) => c.opacity >= 0.95),
      "All Service cards have initial opacity ~1.0"
    );

    // Capture screenshot of Card 01 in view
    await page.screenshot({ path: join(ARTIFACTS_DIR, "limestone_services_card01.png") });

    // Scroll down to bring Card 02 over Card 01
    await page.evaluate(() => {
      const cards = document.querySelectorAll("#services .sticky-service-card");
      if (cards[1]) {
        // Scroll so Card 02 is near top: 96px
        cards[1].scrollIntoView({ behavior: "instant" });
      }
    });
    await page.waitForTimeout(800);

    const serviceStackState = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("#services .sticky-service-card"));
      const c1 = cards[0];
      const c2 = cards[1];
      const c1Style = c1 ? window.getComputedStyle(c1) : null;
      const c1Body = c1?.querySelector(".service-card-body");
      const c1BodyStyle = c1Body ? window.getComputedStyle(c1Body) : null;
      const c2Style = c2 ? window.getComputedStyle(c2) : null;

      return {
        card1Opacity: c1Style ? parseFloat(c1Style.opacity) : 1,
        card1Transform: c1Style ? c1Style.transform : "",
        card1BodyOpacity: c1BodyStyle ? parseFloat(c1BodyStyle.opacity) : 1,
        card2Opacity: c2Style ? parseFloat(c2Style.opacity) : 1,
        card2Top: c2 ? c2.getBoundingClientRect().top : 0,
      };
    });

    console.log("Services Stack State on Card 02:", serviceStackState);
    assert(
      serviceStackState.card1Opacity < 0.95,
      `Receding Card 01 dimmed opacity under Card 02 [got: ${serviceStackState.card1Opacity}]`
    );
    assert(
      serviceStackState.card1BodyOpacity <= 0.35,
      `Receding Card 01 inner body dimmed (<= 0.35, target ~0.15) [got: ${serviceStackState.card1BodyOpacity}]`
    );
    assert(
      serviceStackState.card2Opacity >= 0.95,
      `Incoming Card 02 is full opacity [got: ${serviceStackState.card2Opacity}]`
    );

    await page.screenshot({ path: join(ARTIFACTS_DIR, "limestone_services_card02_stacked.png") });

    // Scroll down to bring Card 03 over Card 02
    await page.evaluate(() => {
      const cards = document.querySelectorAll("#services .sticky-service-card");
      if (cards[2]) {
        cards[2].scrollIntoView({ behavior: "instant" });
      }
    });
    await page.waitForTimeout(800);

    const serviceCard3State = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("#services .sticky-service-card"));
      const c2 = cards[1];
      const c3 = cards[2];
      const c2Body = c2?.querySelector(".service-card-body");
      return {
        card2BodyOpacity: c2Body ? parseFloat(window.getComputedStyle(c2Body).opacity) : 1,
        card3Opacity: c3 ? parseFloat(window.getComputedStyle(c3).opacity) : 1,
        card3Rect: c3 ? c3.getBoundingClientRect() : null,
      };
    });

    console.log("Services Stack State on Card 03 (AI Chatbots):", serviceCard3State);
    assert(
      serviceCard3State.card2BodyOpacity <= 0.35,
      `Card 02 (Web Dev) body dimmed under Card 03 (AI Chatbots) [got: ${serviceCard3State.card2BodyOpacity}]`
    );
    assert(
      serviceCard3State.card3Opacity >= 0.95,
      `Card 03 (AI Chatbots) fully visible and opaque [got: ${serviceCard3State.card3Opacity}]`
    );

    await page.screenshot({ path: join(ARTIFACTS_DIR, "limestone_services_card03_stacked.png") });

    // 1.5 PROCESS SECTION & DOCK CLEARANCE CHECK
    console.log("\n--- Checking Process Section & Ask Arché Dock Clearance ---");
    await page.evaluate(() => {
      document.querySelector("#process")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);

    // Scroll to the 4th process step
    await page.evaluate(() => {
      const processCards = document.querySelectorAll("#process .frosted-ivory-card");
      if (processCards[3]) {
        processCards[3].scrollIntoView({ behavior: "instant" });
      }
    });
    await page.waitForTimeout(800);

    const dockClearance = await page.evaluate(() => {
      const dock = document.querySelector(".fixed.bottom-6.left-6");
      const leftCol = document.querySelector("#process .lg\\:sticky");
      const progressBar = leftCol?.querySelector(".rounded-full.bg-\\[\\#141413\\]\\/\\[0\\.08\\]");

      if (!dock || !progressBar) {
        return { error: "Elements not found", hasDock: !!dock, hasProgressBar: !!progressBar };
      }

      const dockRect = dock.getBoundingClientRect();
      const progressRect = progressBar.getBoundingClientRect();

      // Check if progressRect collides with dockRect
      const overlap = !(
        progressRect.right < dockRect.left ||
        progressRect.left > dockRect.right ||
        progressRect.bottom < dockRect.top ||
        progressRect.top > dockRect.bottom
      );

      const verticalGap = dockRect.top - progressRect.bottom;

      return {
        overlap,
        verticalGap,
        progressBottom: progressRect.bottom,
        dockTop: dockRect.top,
      };
    });

    console.log("Process Step 04 Dock Clearance:", dockClearance);
    assert(!dockClearance.overlap, "Process Step 04 progress bar does NOT overlap Ask Arché dock");
    assert(
      dockClearance.verticalGap > 0,
      `Process progress bar sits comfortably above dock with positive vertical gap [gap: ${dockClearance.verticalGap?.toFixed(1)}px]`
    );

    await page.screenshot({ path: join(ARTIFACTS_DIR, "limestone_process_step04_clearance.png") });

    // 1.6 RECESSED INNER TRAYS CHECK
    console.log("\n--- Checking Recessed Inner Trays Tone Hierarchy ---");
    const trayAudit = await page.evaluate(() => {
      const trays = [];
      const wdSurface = document.querySelector(".wd-surface");
      if (wdSurface) {
        trays.push({ name: "WebDevDemo wd-surface", bg: window.getComputedStyle(wdSurface).backgroundColor });
      }
      const auStage = document.querySelector(".au-card")?.closest(".rounded-\\[10px\\]");
      if (auStage) {
        trays.push({ name: "AutomationDemo stage tray", bg: window.getComputedStyle(auStage).backgroundColor });
      }
      const workThumbnailFrame = document.querySelector("#work [data-cursor='view']");
      if (workThumbnailFrame) {
        trays.push({ name: "Work thumbnail frame", bg: window.getComputedStyle(workThumbnailFrame).backgroundColor });
      }
      return trays;
    });

    console.log("Recessed Trays Audited:", trayAudit);
    assert(trayAudit.length >= 2, `Audited recessed trays [found: ${trayAudit.length}]`);
    assert(
      trayAudit.every((t) => t.bg.includes("229, 231, 220") || t.bg.includes("229,231,220") || t.bg.includes("234, 231, 223")),
      "Inner trays use warm stone recessed tone (#E5E7DC / #EAE7DF)"
    );

    // ========================================================
    // 2. MOBILE VIEWPORT: 390x844 (iPhone 14)
    // ========================================================
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

    // Check no horizontal scrollbar on mobile
    const mobileOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 2;
    });
    assert(mobileOverflow, "Mobile document has zero horizontal overflow");

    // Scroll to Services on mobile
    await mobilePage.evaluate(() => {
      document.querySelector("#services")?.scrollIntoView({ behavior: "instant" });
    });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "limestone_mobile_services.png") });

    // Scroll to Difference on mobile
    await mobilePage.evaluate(() => {
      document.querySelector("#difference")?.scrollIntoView({ behavior: "instant" });
    });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "limestone_mobile_difference.png") });

    // Scroll to Process on mobile
    await mobilePage.evaluate(() => {
      document.querySelector("#process")?.scrollIntoView({ behavior: "instant" });
    });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "limestone_mobile_process.png") });

    console.log("\n========================================");
    console.log(`VERIFICATION SUMMARY: ${passes.length} passed, ${failures.length} failed`);
    console.log("========================================");

    if (failures.length > 0) {
      console.error("FAILURES:");
      failures.forEach((f) => console.error(" - " + f));
      process.exit(1);
    } else {
      console.log("ALL TESTS PASSED WITH 100% SUCCESS!");
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution threw error:", err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});
