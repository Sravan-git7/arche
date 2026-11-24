import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5199;
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
    console.log(`TESTING UPGRADES: ${vp.name} (${vp.width}x${vp.height})`);
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

    // TEST 1: Universal Reactive Glow Cards count
    const glowCardCount = await page.evaluate(() => {
      return document.querySelectorAll(".arche-glow-card").length;
    });
    console.log(`[PASS] Universal .arche-glow-card count: ${glowCardCount}`);
    if (glowCardCount >= 15) {
      passedTests.push(`${vp.name}: Universal glow cards applied across sections (${glowCardCount} found)`);
    } else {
      failedTests.push(`${vp.name}: Expected >= 15 glow cards, found ${glowCardCount}`);
    }

    // TEST 2: Spotlight coordinates updating on pointer move (Desktop only)
    if (!vp.isMobile) {
      const coordsUpdated = await page.evaluate(async () => {
        const card = document.querySelector(".arche-glow-card");
        if (!card) return false;
        const rect = card.getBoundingClientRect();
        const evt = new PointerEvent("pointermove", {
          clientX: rect.left + 50,
          clientY: rect.top + 50,
          bubbles: true,
        });
        card.dispatchEvent(evt);
        await new Promise((r) => requestAnimationFrame(r));
        const mx = card.style.getPropertyValue("--mx");
        const my = card.style.getPropertyValue("--my");
        return mx.includes("px") && my.includes("px");
      });
      console.log(`[PASS] Pointer coordinates updated via SpotlightCard: ${coordsUpdated}`);
      if (coordsUpdated) {
        passedTests.push(`${vp.name}: SpotlightCard updates --mx and --my on pointermove`);
      } else {
        failedTests.push(`${vp.name}: SpotlightCard failed to update --mx/--my`);
      }
    }

    // TEST 3: Contextual Cursor Morphing (Desktop vs Mobile)
    if (!vp.isMobile) {
      const cursorState = await page.evaluate(() => {
        const ring = document.querySelector(".cursor-ring");
        const dot = document.querySelector(".cursor-dot");
        if (!ring || !dot) return null;
        const ringStyle = window.getComputedStyle(ring);
        const dotStyle = window.getComputedStyle(dot);
        return {
          ringExists: true,
          dotExists: true,
          ringDisplay: ringStyle.display,
          dotDisplay: dotStyle.display,
        };
      });
      console.log(`[PASS] Desktop Cursor Present:`, cursorState);
      if (cursorState && cursorState.ringExists && cursorState.dotExists) {
        passedTests.push(`${vp.name}: Desktop morphing cursor ring and dot active`);
      } else {
        failedTests.push(`${vp.name}: Desktop cursor elements missing`);
      }

      // Test cursor hover trigger on visible interactive element
      const targetBtn = page.locator("header a, nav a, button").filter({ hasNotText: "Skip" }).first();
      await targetBtn.hover({ force: true });
      await page.waitForTimeout(300);
      const isHoverState = await page.evaluate(() => {
        const ring = document.querySelector(".cursor-ring");
        return ring ? ring.classList.contains("cursor-state-hover") || ring.classList.contains("cursor-state-view") : false;
      });
      console.log(`[PASS] Cursor morphs on hover: ${isHoverState}`);
      if (isHoverState) {
        passedTests.push(`${vp.name}: Cursor ring cleanly morphs on hover/interactive elements`);
      } else {
        failedTests.push(`${vp.name}: Cursor ring failed to morph to hover/view state`);
      }
    } else {
      // Mobile: verify cursor is hidden
      const mobileHidden = await page.evaluate(() => {
        const ring = document.querySelector(".cursor-ring");
        const dot = document.querySelector(".cursor-dot");
        if (!ring || !dot) return true;
        const rStyle = window.getComputedStyle(ring);
        const dStyle = window.getComputedStyle(dot);
        return rStyle.display === "none" && dStyle.display === "none";
      });
      console.log(`[PASS] Mobile cursor hidden: ${mobileHidden}`);
      if (mobileHidden) {
        passedTests.push(`${vp.name}: Cursor hidden on mobile/touch viewports`);
      } else {
        failedTests.push(`${vp.name}: Cursor unexpectedly displayed on mobile`);
      }
    }

    // TEST 4: Floating "Ask Arché" Quick-Connect Dock
    const dockVisible = await page.evaluate(() => {
      const dock = document.querySelector("[aria-label='Toggle Arché Quick Intelligence']");
      return Boolean(dock);
    });
    console.log(`[PASS] Ask Arché dock button exists: ${dockVisible}`);
    if (dockVisible) {
      passedTests.push(`${vp.name}: Ask Arché floating quick-connect dock rendered`);
    } else {
      failedTests.push(`${vp.name}: Ask Arché dock missing`);
    }

    // Click toggle to open popover
    await page.click("[aria-label='Toggle Arché Quick Intelligence']");
    await page.waitForTimeout(350);
    const popoverOpen = await page.evaluate(() => {
      const dialog = document.querySelector("[role='dialog'][aria-label='Ask Arché Intelligence']");
      return Boolean(dialog);
    });
    console.log(`[PASS] Ask Arché popover opens: ${popoverOpen}`);
    if (popoverOpen) {
      passedTests.push(`${vp.name}: Ask Arché intelligence dialog opens smoothly`);
    } else {
      failedTests.push(`${vp.name}: Ask Arché dialog failed to open`);
    }

    // Click preset question in popover
    await page.click("button:has-text('How do your 4 verticals connect')");
    await page.waitForTimeout(200);
    const answerRendered = await page.evaluate(() => {
      return document.body.innerText.includes("Film assets supply cinema branding");
    });
    console.log(`[PASS] Preset question answer rendered: ${answerRendered}`);
    if (answerRendered) {
      passedTests.push(`${vp.name}: Preset QA answers rendered in popover`);
    } else {
      failedTests.push(`${vp.name}: Preset QA answer not visible`);
    }

    // Close popover
    await page.click("button[aria-label='Close dialog']");
    await page.waitForTimeout(200);

    // TEST 5: Architectural Proof Metrics Section
    const proofMetrics = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll("h2")).find((el) =>
        el.textContent.includes("Engineered for deterministic leverage")
      );
      const watermark = Array.from(document.querySelectorAll("div")).find((el) =>
        el.textContent.trim() === "4 VERTICALS"
      );
      return {
        h2Found: Boolean(h2),
        watermarkFound: Boolean(watermark),
      };
    });
    console.log(`[PASS] Proof Metrics Section:`, proofMetrics);
    if (proofMetrics.h2Found && proofMetrics.watermarkFound) {
      passedTests.push(`${vp.name}: Architectural Proof Metrics section with 4 VERTICALS watermark verified`);
    } else {
      failedTests.push(`${vp.name}: Proof Metrics headline or watermark missing`);
    }

    // TEST 6: Work Showcase 3-Up Carousel with LIVE badge
    const workCarousel = await page.evaluate(() => {
      const liveBadges = Array.from(document.querySelectorAll("span")).filter(
        (el) => el.textContent.trim() === "LIVE"
      );
      const prevBtn = document.querySelector("[aria-label='Previous work slide']");
      const nextBtn = document.querySelector("[aria-label='Next work slide']");
      return {
        liveBadgesCount: liveBadges.length,
        hasPrevBtn: Boolean(prevBtn),
        hasNextBtn: Boolean(nextBtn),
      };
    });
    console.log(`[PASS] Work Showcase Carousel:`, workCarousel);
    if (workCarousel.liveBadgesCount >= 3 && workCarousel.hasPrevBtn && workCarousel.hasNextBtn) {
      passedTests.push(`${vp.name}: Work Showcase 3-up carousel with LIVE badges and navigation controls verified`);
    } else {
      failedTests.push(`${vp.name}: Work carousel controls or LIVE badges incomplete`);
    }

    // Capture visual screenshots
    // Screenshot 1: Hero & Dock
    await page.screenshot({
      path: join(ARTIFACTS_DIR, `upgrade_hero_${vp.name}.png`),
    });

    // Screenshot 2: Work Showcase Carousel
    const workSection = await page.$("#work");
    if (workSection) {
      await workSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `upgrade_work_carousel_${vp.name}.png`),
      });
    }

    // Screenshot 3: Proof Metrics Section
    const proofH2 = await page.$("h2:has-text('Engineered for deterministic leverage')");
    if (proofH2) {
      await proofH2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `upgrade_proof_metrics_${vp.name}.png`),
      });
    }

    // Screenshot 4: FAQ Section
    const faqSection = await page.$("#faq");
    if (faqSection) {
      await faqSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `upgrade_faq_${vp.name}.png`),
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
    console.log("ALL VERIFICATIONS PASSED CLEANLY!");
    process.exit(0);
  }
});
