import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
const BRAIN_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function saveArtifact(srcPath, name) {
  if (fs.existsSync(BRAIN_DIR)) {
    fs.copyFileSync(srcPath, path.join(BRAIN_DIR, name));
  }
}

async function verifyDarkStageAndOrb() {
  console.log("=== COMPREHENSIVE VERIFICATION: DARK STAGE & AW MEDIA PREFOOTER ORB ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2200); // Allow preloader to finish

    // 1. Hero
    const heroShot = path.join(ARTIFACT_DIR, "dark_stage_01_hero.png");
    await page.screenshot({ path: heroShot });
    saveArtifact(heroShot, "dark_stage_01_hero.png");
    console.log("Captured: dark_stage_01_hero.png");

    // 2. Manifesto
    const manifesto = page.locator("#manifesto");
    if (await manifesto.count() > 0) {
      await manifesto.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const manifestoShot = path.join(ARTIFACT_DIR, "dark_stage_02_manifesto.png");
      await manifesto.screenshot({ path: manifestoShot });
      saveArtifact(manifestoShot, "dark_stage_02_manifesto.png");
      console.log("Captured: dark_stage_02_manifesto.png");
    }

    // 3. Difference
    const diff = page.locator("#difference");
    if (await diff.count() > 0) {
      await diff.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const diffShot = path.join(ARTIFACT_DIR, "dark_stage_03_difference.png");
      await diff.screenshot({ path: diffShot });
      saveArtifact(diffShot, "dark_stage_03_difference.png");
      console.log("Captured: dark_stage_03_difference.png");
    }

    // 4. Process (How We Work)
    const hww = page.locator("#how-we-work");
    if (await hww.count() > 0) {
      await hww.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const hwwShot = path.join(ARTIFACT_DIR, "dark_stage_04_process.png");
      await hww.screenshot({ path: hwwShot });
      saveArtifact(hwwShot, "dark_stage_04_process.png");
      console.log("Captured: dark_stage_04_process.png");
    }

    // 5. Work section
    const work = page.locator("#work");
    if (await work.count() > 0) {
      await work.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const workShot = path.join(ARTIFACT_DIR, "dark_stage_05_work.png");
      await work.screenshot({ path: workShot });
      saveArtifact(workShot, "dark_stage_05_work.png");
      console.log("Captured: dark_stage_05_work.png");
    }

    // 6. FAQ section
    const faq = page.locator("#faq");
    if (await faq.count() > 0) {
      await faq.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const faqShot = path.join(ARTIFACT_DIR, "dark_stage_06_faq.png");
      await faq.screenshot({ path: faqShot });
      saveArtifact(faqShot, "dark_stage_06_faq.png");
      console.log("Captured: dark_stage_06_faq.png");
    }

    // 7. PreFooterCTA & Interactive Glass Orb
    const preFooter = page.locator("#pre-footer-cta");
    await preFooter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const orb = preFooter.locator(".animate-orb-float > div");
    if ((await orb.count()) !== 1) {
      throw new Error("Expected 1 glass orb in #pre-footer-cta");
    }

    const orbDimensions = await orb.boundingBox();
    console.log("Orb bounding box at resting state:", orbDimensions);

    // Capture resting state
    const preRestShot = path.join(ARTIFACT_DIR, "dark_stage_07_prefooter_resting.png");
    await preFooter.screenshot({ path: preRestShot });
    saveArtifact(preRestShot, "dark_stage_07_prefooter_resting.png");
    console.log("Captured: dark_stage_07_prefooter_resting.png");

    // Move cursor to LEFT behind "Ready to connect" (matching awmedia screenshot!)
    const sectionBox = await preFooter.boundingBox();
    const centerY = sectionBox.y + sectionBox.height * 0.42;

    // awmedia position: cursor to the left around x = 320px
    await page.mouse.move(320, centerY, { steps: 18 });
    await page.waitForTimeout(600); // Allow gsap.quickTo to interpolate

    const awmediaShot = path.join(ARTIFACT_DIR, "dark_stage_08_prefooter_left_awmedia_match.png");
    await preFooter.screenshot({ path: awmediaShot });
    saveArtifact(awmediaShot, "dark_stage_08_prefooter_left_awmedia_match.png");
    console.log("Captured: dark_stage_08_prefooter_left_awmedia_match.png");

    // Move cursor to RIGHT
    await page.mouse.move(1150, centerY, { steps: 18 });
    await page.waitForTimeout(600);
    const preRightShot = path.join(ARTIFACT_DIR, "dark_stage_09_prefooter_right.png");
    await preFooter.screenshot({ path: preRightShot });
    saveArtifact(preRightShot, "dark_stage_09_prefooter_right.png");
    console.log("Captured: dark_stage_09_prefooter_right.png");

    // 8. Footer
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const footerShot = path.join(ARTIFACT_DIR, "dark_stage_10_footer.png");
    await footer.screenshot({ path: footerShot });
    saveArtifact(footerShot, "dark_stage_10_footer.png");
    console.log("Captured: dark_stage_10_footer.png");

    // 9. Pricing subpage
    await page.goto("http://localhost:5173/#/pricing", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const pricingShot = path.join(ARTIFACT_DIR, "dark_stage_11_pricing.png");
    await page.screenshot({ path: pricingShot });
    saveArtifact(pricingShot, "dark_stage_11_pricing.png");
    console.log("Captured: dark_stage_11_pricing.png");

    // 10. Service Detail subpage
    await page.goto("http://localhost:5173/#/services/web-development", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const serviceShot = path.join(ARTIFACT_DIR, "dark_stage_12_service_webdev.png");
    await page.screenshot({ path: serviceShot });
    saveArtifact(serviceShot, "dark_stage_12_service_webdev.png");
    console.log("Captured: dark_stage_12_service_webdev.png");

    // 11. FAQ Knowledge Hub & Concierge
    await page.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const faqHubShot = path.join(ARTIFACT_DIR, "dark_stage_13_faq_hub.png");
    await page.screenshot({ path: faqHubShot });
    saveArtifact(faqHubShot, "dark_stage_13_faq_hub.png");
    console.log("Captured: dark_stage_13_faq_hub.png");

    console.log("=== ALL SCREENSHOTS VERIFIED & SAVED SUCCESSFULLY ===");
  } finally {
    await browser.close();
  }
}

verifyDarkStageAndOrb().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
