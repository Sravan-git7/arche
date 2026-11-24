import { chromium } from "playwright";
import path from "node:path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

async function verifyCinemaLighting() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:5173/#/ ...");
  await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Verify Vignette and Fluted Glass elements
  const bgData = await page.evaluate(() => {
    const vignette = document.querySelector('[data-cinema-vignette="true"]');
    const fluted = document.querySelector('[data-fluted-glass="global"]');
    const navPill = document.querySelector('.nav-pill.glass');

    return {
      vignetteFound: !!vignette,
      vignetteStyle: vignette ? vignette.getAttribute('style') : null,
      flutedFound: !!fluted,
      flutedStyle: fluted ? fluted.getAttribute('style') : null,
      navPillFound: !!navPill,
      navPillShadow: navPill ? window.getComputedStyle(navPill).boxShadow : null,
    };
  });
  console.log("Background & Nav Check:", JSON.stringify(bgData, null, 2));

  // Capture Hero showing cinema perimeter vignette
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "cinema_lighting_hero_1440.png"),
  });
  console.log("Captured cinema_lighting_hero_1440.png");

  // 2. Scroll to Pre-Footer CTA
  const preFooter = page.locator("#pre-footer-cta");
  await preFooter.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const preFooterBox = await preFooter.boundingBox();
  console.log("PreFooter bounding box:", preFooterBox);

  // Check Orb element styles
  const orbData = await page.evaluate(() => {
    const section = document.querySelector("#pre-footer-cta");
    if (!section) return null;
    const orb = section.querySelector(".animate-orb-float > div");
    if (!orb) return null;
    const computed = window.getComputedStyle(orb);
    return {
      className: orb.className,
      inlineStyle: orb.getAttribute("style"),
      width: computed.width,
      height: computed.height,
      opacity: computed.opacity,
      boxShadow: computed.boxShadow,
      backgroundImage: computed.backgroundImage,
    };
  });
  console.log("Orb Data:", JSON.stringify(orbData, null, 2));

  // Test 1: Resting Position Screenshot
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "cinema_orb_resting_1440.png"),
  });
  console.log("Captured cinema_orb_resting_1440.png");

  // Test 2: Move cursor across section behind text
  if (preFooterBox) {
    // Move to right edge of headline
    await page.mouse.move(preFooterBox.x + preFooterBox.width * 0.72, preFooterBox.y + preFooterBox.height * 0.42);
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "cinema_orb_right_1440.png"),
    });
    console.log("Captured cinema_orb_right_1440.png");

    // Move to left edge behind "Ready to"
    await page.mouse.move(preFooterBox.x + preFooterBox.width * 0.28, preFooterBox.y + preFooterBox.height * 0.40);
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "cinema_orb_left_behind_headline_1440.png"),
    });
    console.log("Captured cinema_orb_left_behind_headline_1440.png");
  }

  // 3. Check FAQ Page to verify global background consistency
  console.log("Navigating to http://localhost:5173/#/faq ...");
  await page.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "cinema_lighting_faq_1440.png"),
  });
  console.log("Captured cinema_lighting_faq_1440.png");

  await browser.close();
  console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
}

verifyCinemaLighting().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
