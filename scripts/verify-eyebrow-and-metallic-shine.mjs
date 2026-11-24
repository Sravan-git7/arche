import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
const BRAIN_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyEyebrowsAndMetallicShine() {
  console.log("=== VERIFYING GLASS EYEBROW BOXES & METALLIC TEXT-SHINE ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. Verify Glass Eyebrow Pills
    const eyebrowCount = await page.locator(".glass-eyebrow-pill").count();
    console.log(`Found ${eyebrowCount} .glass-eyebrow-pill elements.`);
    if (eyebrowCount < 7) {
      throw new Error(`Expected at least 7 .glass-eyebrow-pill elements, got ${eyebrowCount}`);
    }

    const eyebrowStyles = await page.locator(".glass-eyebrow-pill").first().evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        borderRadius: cs.borderRadius,
        border: cs.border,
        textTransform: cs.textTransform,
        fontSize: cs.fontSize,
        letterSpacing: cs.letterSpacing,
      };
    });
    console.log("First .glass-eyebrow-pill computed styles:", eyebrowStyles);

    // 2. Verify display headlines
    const shinyInkCount = await page.locator(".shiny-ink-text").count();
    console.log(`Found ${shinyInkCount} .shiny-ink-text elements.`);
    if (shinyInkCount < 4) {
      throw new Error(`Expected at least 4 .shiny-ink-text elements, got ${shinyInkCount}`);
    }

    const secondaryShineCount = await page.locator(".headline-secondary-shine").count();
    console.log(`Found ${secondaryShineCount} .headline-secondary-shine elements.`);
    if (secondaryShineCount < 4) {
      throw new Error(`Expected at least 4 .headline-secondary-shine elements, got ${secondaryShineCount}`);
    }

    // 3. Verify Process numeral
    const processNumeral = await page.locator(".process-numeral-shine").first();
    const numeralStyles = await processNumeral.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontWeight: cs.fontWeight,
        backgroundClip: cs.backgroundClip || cs.webkitBackgroundClip,
        textFillColor: cs.webkitTextFillColor,
        color: cs.color,
      };
    });
    console.log("Process numeral computed styles:", numeralStyles);

    // 4. Verify Verb Glint Shine
    const verbGlint = await page.locator(".verb-glint-shine").first();
    const verbStyles = await verbGlint.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backgroundClip: cs.backgroundClip || cs.webkitBackgroundClip,
        textFillColor: cs.webkitTextFillColor,
        animationName: cs.animationName,
      };
    });
    console.log("Hero verb glint styles:", verbStyles);

    // 5. Capture Screenshots of each section
    // Hero
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const heroShot = path.join(ARTIFACT_DIR, "eyebrows_desktop_hero.png");
    await page.screenshot({ path: heroShot, clip: { x: 0, y: 0, width: 1440, height: 800 } });

    // Capabilities (Four verticals)
    const capSection = page.locator("#services");
    await capSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const capShot = path.join(ARTIFACT_DIR, "eyebrows_desktop_capabilities.png");
    await page.screenshot({ path: capShot, clip: { x: 0, y: 0, width: 1440, height: 750 } });

    // The Studio Difference (Why ambitious)
    const diffSection = page.locator("#difference");
    await diffSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const diffShot = path.join(ARTIFACT_DIR, "eyebrows_desktop_difference.png");
    await page.screenshot({ path: diffShot, clip: { x: 0, y: 0, width: 1440, height: 750 } });

    // How We Work (Process)
    const workSection = page.locator("#process");
    await workSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const howShot = path.join(ARTIFACT_DIR, "eyebrows_desktop_how_we_work.png");
    await page.screenshot({ path: howShot, clip: { x: 0, y: 0, width: 1440, height: 800 } });

    // Selected Work
    const selectedWork = page.locator("#work");
    await selectedWork.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const workShot = path.join(ARTIFACT_DIR, "eyebrows_desktop_selected_work.png");
    await page.screenshot({ path: workShot, clip: { x: 0, y: 0, width: 1440, height: 800 } });

    // FAQ
    const faqSection = page.locator("#faq");
    await faqSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const faqShot = path.join(ARTIFACT_DIR, "eyebrows_desktop_faq.png");
    await page.screenshot({ path: faqShot, clip: { x: 0, y: 0, width: 1440, height: 800 } });

    // 6. Mobile verification
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1000);

    const hasHorizontalOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > 390;
    });
    console.log("Mobile horizontal overflow > 390px?", hasHorizontalOverflow);
    if (hasHorizontalOverflow) {
      throw new Error("Mobile horizontal overflow detected!");
    }

    const mobileCap = mobilePage.locator("#services");
    await mobileCap.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);
    const mobileShot = path.join(ARTIFACT_DIR, "eyebrows_mobile_capabilities.png");
    await mobilePage.screenshot({ path: mobileShot });

    console.log("All Playwright checks PASSED!");
  } finally {
    await browser.close();
  }
}

verifyEyebrowsAndMetallicShine().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
