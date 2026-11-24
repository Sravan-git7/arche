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

async function verifyPolish() {
  console.log("=== COMPREHENSIVE VERIFICATION: CONTRAST AUDIT, CURSOR GLOW & STUDIO PLATES ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2200); // Allow preloader to finish

    // 1. Move cursor across Hero to test the white cursor halo & 240px ambient spotlight follower
    await page.mouse.move(720, 450);
    await page.waitForTimeout(300);

    const cursorDot = page.locator(".cursor-dot");
    const cursorRing = page.locator(".cursor-ring");
    const ambientFollower = page.locator(".will-change-transform.z-\\[1\\]");

    console.log("Cursor Dot count:", await cursorDot.count());
    console.log("Cursor Ring count:", await cursorRing.count());
    console.log("Ambient Follower count:", await ambientFollower.count());

    const heroShot = path.join(ARTIFACT_DIR, "polish_01_hero_cursor_glow.png");
    await page.screenshot({ path: heroShot });
    saveArtifact(heroShot, "polish_01_hero_cursor_glow.png");
    console.log("Captured: polish_01_hero_cursor_glow.png");

    // 2. Manifesto: check scrub and clean borderless links
    const tension = page.locator("#tension");
    if (await tension.count() > 0) {
      await tension.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      // Verify borderless links exist and have no dock-box container
      const borderlessLinks = tension.locator("a[href='#services']");
      const linkColor = await borderlessLinks.evaluate((el) => window.getComputedStyle(el).color);
      console.log("Manifesto link color:", linkColor);

      const manifestoShot = path.join(ARTIFACT_DIR, "polish_02_manifesto_borderless_links.png");
      await tension.screenshot({ path: manifestoShot });
      saveArtifact(manifestoShot, "polish_02_manifesto_borderless_links.png");
      console.log("Captured: polish_02_manifesto_borderless_links.png");
    }

    // 3. Why Arché: check right-side paragraph color (#CBD1C5)
    const diff = page.locator("#difference");
    if (await diff.count() > 0) {
      await diff.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      const diffPara = diff.locator("p.text-\\[\\#CBD1C5\\]");
      if (await diffPara.count() > 0) {
        const color = await diffPara.evaluate((el) => window.getComputedStyle(el).color);
        console.log("Why Arché right-side paragraph computed color:", color);
      }

      const diffShot = path.join(ARTIFACT_DIR, "polish_03_why_arche_crisp_statement.png");
      await diff.screenshot({ path: diffShot });
      saveArtifact(diffShot, "polish_03_why_arche_crisp_statement.png");
      console.log("Captured: polish_03_why_arche_crisp_statement.png");
    }

    // 4. Process (How We Work): verify lit studio cards
    const hww = page.locator("#how-we-work");
    if (await hww.count() > 0) {
      await hww.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      const hwwShot = path.join(ARTIFACT_DIR, "polish_04_process_cards.png");
      await hww.screenshot({ path: hwwShot });
      saveArtifact(hwwShot, "polish_04_process_cards.png");
      console.log("Captured: polish_04_process_cards.png");
    }

    // 5. Work cards
    const work = page.locator("#work");
    if (await work.count() > 0) {
      await work.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      const workShot = path.join(ARTIFACT_DIR, "polish_05_work_cards.png");
      await work.screenshot({ path: workShot });
      saveArtifact(workShot, "polish_05_work_cards.png");
      console.log("Captured: polish_05_work_cards.png");
    }

    // 6. FAQ: check pre-CTA scrub statement
    const faq = page.locator("#faq");
    if (await faq.count() > 0) {
      await faq.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      // Scroll further to trigger scrub on pre-CTA statement
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(600);

      const preCtaWord = faq.locator(".pre-cta-word").first();
      if (await preCtaWord.count() > 0) {
        const wordColor = await preCtaWord.evaluate((el) => window.getComputedStyle(el).color);
        console.log("FAQ Pre-CTA scrubbed word computed color:", wordColor);
      }

      const faqShot = path.join(ARTIFACT_DIR, "polish_06_faq_scroll_lit_statement.png");
      await page.screenshot({ path: faqShot });
      saveArtifact(faqShot, "polish_06_faq_scroll_lit_statement.png");
      console.log("Captured: polish_06_faq_scroll_lit_statement.png");
    }

    // 7. PreFooterCTA & Glass Orb
    const preFooter = page.locator("#pre-footer-cta");
    if (await preFooter.count() > 0) {
      await preFooter.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Move cursor to left behind "Ready to connect"
      const sectionBox = await preFooter.boundingBox();
      const centerY = sectionBox.y + sectionBox.height * 0.42;
      await page.mouse.move(320, centerY, { steps: 15 });
      await page.waitForTimeout(500);

      const preShot = path.join(ARTIFACT_DIR, "polish_07_prefooter_orb_and_cards.png");
      await preFooter.screenshot({ path: preShot });
      saveArtifact(preShot, "polish_07_prefooter_orb_and_cards.png");
      console.log("Captured: polish_07_prefooter_orb_and_cards.png");
    }

    // 8. Pricing subpage
    await page.goto("http://localhost:5173/#/pricing", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const pricingShot = path.join(ARTIFACT_DIR, "polish_08_pricing.png");
    await page.screenshot({ path: pricingShot });
    saveArtifact(pricingShot, "polish_08_pricing.png");
    console.log("Captured: polish_08_pricing.png");

    // 9. Service Detail subpage
    await page.goto("http://localhost:5173/#/services/web-development", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const serviceShot = path.join(ARTIFACT_DIR, "polish_09_service_detail.png");
    await page.screenshot({ path: serviceShot });
    saveArtifact(serviceShot, "polish_09_service_detail.png");
    console.log("Captured: polish_09_service_detail.png");

    // 10. FAQ Hub subpage
    await page.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const faqHubShot = path.join(ARTIFACT_DIR, "polish_10_faq_hub.png");
    await page.screenshot({ path: faqHubShot });
    saveArtifact(faqHubShot, "polish_10_faq_hub.png");
    console.log("Captured: polish_10_faq_hub.png");

    console.log("=== ALL CHECKS & SCREENSHOTS COMPLETED SUCCESSFULLY ===");
  } finally {
    await browser.close();
  }
}

verifyPolish().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
