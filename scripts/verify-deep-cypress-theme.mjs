import { chromium } from "playwright";
import path from "node:path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

async function verifyDeepCypressTheme() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:5173/#/ ...");
  await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Inspect Hero & Background Layers
  const heroCheck = await page.evaluate(() => {
    const vignette = document.querySelector('[data-cypress-vignette="true"]');
    const shadowTL = document.querySelector('[data-cypress-shadow-tl="true"]');
    const shadowBR = document.querySelector('[data-cypress-shadow-br="true"]');
    const fluted = document.querySelector('[data-fluted-glass="global"]');
    const navPill = document.querySelector('.nav-pill.glass');
    const startBtn = document.querySelector('header a[href="#/contact"], header a[href="/contact"]');

    return {
      vignetteStyle: vignette ? vignette.getAttribute("style") : null,
      shadowTLFound: !!shadowTL,
      shadowBRFound: !!shadowBR,
      flutedStyle: fluted ? fluted.getAttribute("style") : null,
      navPillShadow: navPill ? window.getComputedStyle(navPill).boxShadow : null,
      navPillBorder: navPill ? window.getComputedStyle(navPill).borderColor : null,
      startBtnClass: startBtn ? startBtn.className : null,
    };
  });
  console.log("Hero & Global Background Check:\n", JSON.stringify(heroCheck, null, 2));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "cypress_01_hero_1440.png"),
  });
  console.log("Captured cypress_01_hero_1440.png");

  // 2. Inspect Services Section (#services)
  const servicesSec = page.locator("#services");
  if (await servicesSec.count() > 0) {
    await servicesSec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const servicesCheck = await page.evaluate(() => {
      const card = document.querySelector(".sticky-service-card");
      const videoSlab = document.querySelector('[data-slab="engine"]');
      return {
        cardShadow: card ? window.getComputedStyle(card).boxShadow : null,
        cardBorder: card ? window.getComputedStyle(card).borderColor : null,
        videoSlabFound: !!videoSlab,
        videoSlabShadow: videoSlab ? window.getComputedStyle(videoSlab).boxShadow : null,
        videoSlabBg: videoSlab ? window.getComputedStyle(videoSlab).backgroundImage : null,
      };
    });
    console.log("Services Check:\n", JSON.stringify(servicesCheck, null, 2));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "cypress_02_services_1440.png"),
    });
    console.log("Captured cypress_02_services_1440.png");
  }

  // 3. Inspect Work Section (#work)
  const workSec = page.locator("#work, .wrap:has-text('SELECTED CLIENT COMMISSIONS')").first();
  if (await workSec.count() > 0) {
    await workSec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "cypress_03_work_1440.png"),
    });
    console.log("Captured cypress_03_work_1440.png");
  }

  // 4. Inspect Pre-Footer CTA & Floating Glass Orb (#pre-footer-cta)
  const preFooter = page.locator("#pre-footer-cta");
  if (await preFooter.count() > 0) {
    await preFooter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const orbCheck = await page.evaluate(() => {
      const orb = document.querySelector("#pre-footer-cta .animate-orb-float > div");
      if (!orb) return null;
      const computed = window.getComputedStyle(orb);
      return {
        className: orb.className,
        width: computed.width,
        height: computed.height,
        opacity: computed.opacity,
        boxShadow: computed.boxShadow,
        backgroundImage: computed.backgroundImage,
        border: computed.border,
      };
    });
    console.log("PreFooter Orb Check:\n", JSON.stringify(orbCheck, null, 2));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "cypress_04_prefooter_orb_1440.png"),
    });
    console.log("Captured cypress_04_prefooter_orb_1440.png");
  }

  // 5. Inspect Footer
  const footer = page.locator("footer");
  if (await footer.count() > 0) {
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "cypress_05_footer_1440.png"),
    });
    console.log("Captured cypress_05_footer_1440.png");
  }

  await browser.close();
  console.log("ALL DEEP CYPRESS CHECKS COMPLETED SUCCESSFULLY!");
}

verifyDeepCypressTheme().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
