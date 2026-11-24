import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
const BRAIN_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyPreFooterCTAAndGlassOrb() {
  console.log("=== VERIFYING PRE-FOOTER CTA AND GLASS ORB ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP VERIFICATION ON HOMEPAGE (/)
    // -------------------------------------------------------------
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2200); // Allow preloader to finish

    // Verify boxed dark obsidian CTA rectangle is GONE
    const oldDarkBox = page.locator("div[style*='linear-gradient(155deg, #141613 0%, #0D0E0C 100%)']");
    const oldBoxCount = await oldDarkBox.count();
    console.log(`Old boxed dark CTA count: ${oldBoxCount} (Expected: 0)`);
    if (oldBoxCount !== 0) {
      throw new Error(`Expected old dark CTA box to be gone, but found ${oldBoxCount}`);
    }

    // Verify new open #pre-footer-cta exists
    const preFooter = page.locator("#pre-footer-cta");
    const preFooterCount = await preFooter.count();
    console.log(`New #pre-footer-cta count: ${preFooterCount} (Expected: 1)`);
    if (preFooterCount !== 1) {
      throw new Error(`Expected exactly 1 #pre-footer-cta, found ${preFooterCount}`);
    }

    // Scroll to #pre-footer-cta
    await preFooter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Verify Eyebrow Pill
    const eyebrow = preFooter.locator(".glass-eyebrow-pill");
    const eyebrowText = await eyebrow.innerText();
    console.log(`Eyebrow text: "${eyebrowText}"`);
    if (!eyebrowText.includes("NOW BOOKING NEXT ENGAGEMENTS")) {
      throw new Error(`Expected eyebrow to contain 'NOW BOOKING NEXT ENGAGEMENTS', got '${eyebrowText}'`);
    }

    // Verify Headline
    const headline = preFooter.locator("h2");
    const headlineText = await headline.innerText();
    console.log(`Headline text: "${headlineText.replace(/\n/g, ' ')}"`);
    if (!headlineText.includes("Ready to connect") || !headlineText.includes("your entire business?")) {
      throw new Error(`Headline does not match expected text: '${headlineText}'`);
    }

    // Verify Glass Orb in PreFooterCTA
    const preFooterOrb = preFooter.locator(".animate-orb-float > div");
    const orbCount = await preFooterOrb.count();
    console.log(`PreFooter glass orb count: ${orbCount}`);
    if (orbCount !== 1) {
      throw new Error(`Expected 1 glass orb inside #pre-footer-cta, found ${orbCount}`);
    }

    const orbStyles = await preFooterOrb.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        borderRadius: cs.borderRadius,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        boxShadow: cs.boxShadow,
        width: cs.width,
        height: cs.height,
      };
    });
    console.log("PreFooter glass orb styles:", orbStyles);

    // Verify CTAs
    const startBtn = preFooter.locator("a[href*='/contact']");
    const workBtn = preFooter.locator("a[href*='/work']");
    console.log(`Start button count: ${await startBtn.count()}, Work button count: ${await workBtn.count()}`);

    // Verify Footer Glass Orb
    const footer = page.locator("footer");
    const footerOrb = footer.locator(".animate-orb-float-subtle > div");
    const footerOrbCount = await footerOrb.count();
    console.log(`Footer glass orb count: ${footerOrbCount}`);
    if (footerOrbCount !== 1) {
      throw new Error(`Expected 1 glass orb in footer, found ${footerOrbCount}`);
    }

    const footerOrbStyles = await footerOrb.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        borderRadius: cs.borderRadius,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        opacity: window.getComputedStyle(el.parentElement).opacity,
        width: cs.width,
        height: cs.height,
      };
    });
    console.log("Footer glass orb styles:", footerOrbStyles);

    // Capture PreFooter screenshot on homepage
    const homeShot = path.join(ARTIFACT_DIR, "prefooter_cta_desktop_1440.png");
    await preFooter.screenshot({ path: homeShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(homeShot, path.join(BRAIN_DIR, "prefooter_cta_desktop_1440.png"));
    }

    // Scroll to footer and capture footer orb screenshot
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const footerShot = path.join(ARTIFACT_DIR, "footer_with_glass_orb_1440.png");
    await footer.screenshot({ path: footerShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(footerShot, path.join(BRAIN_DIR, "footer_with_glass_orb_1440.png"));
    }

    // -------------------------------------------------------------
    // 2. VERIFICATION ON SERVICE DETAIL PAGE (/#/services/ai-automation)
    // -------------------------------------------------------------
    console.log("\n--- Testing Service Detail Page (/#/services/ai-automation) ---");
    await page.goto("http://localhost:5173/#/services/ai-automation", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const servicePreFooter = page.locator("#pre-footer-cta");
    if ((await servicePreFooter.count()) !== 1) {
      throw new Error("Expected #pre-footer-cta on service detail page");
    }
    await servicePreFooter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const serviceCtaShot = path.join(ARTIFACT_DIR, "service_ai_automation_prefooter_cta.png");
    await servicePreFooter.screenshot({ path: serviceCtaShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(serviceCtaShot, path.join(BRAIN_DIR, "service_ai_automation_prefooter_cta.png"));
    }
    console.log("Service page PreFooterCTA verified successfully!");

    // -------------------------------------------------------------
    // 3. MOBILE VIEWPORT (390x844) VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- Testing Mobile Viewport (390x844) ---");
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(2000);

    const mobilePreFooter = mobilePage.locator("#pre-footer-cta");
    await mobilePreFooter.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);

    const mobileOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > 390);
    console.log(`Mobile horizontal overflow detected: ${mobileOverflow}`);
    if (mobileOverflow) {
      throw new Error("Mobile horizontal overflow detected (> 390px)!");
    }

    const mobileShot = path.join(ARTIFACT_DIR, "prefooter_cta_mobile_390.png");
    await mobilePreFooter.screenshot({ path: mobileShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(mobileShot, path.join(BRAIN_DIR, "prefooter_cta_mobile_390.png"));
    }

    // Also screenshot mobile footer
    const mobileFooter = mobilePage.locator("footer");
    await mobileFooter.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(400);
    const mobileFooterShot = path.join(ARTIFACT_DIR, "footer_with_glass_orb_mobile_390.png");
    await mobileFooter.screenshot({ path: mobileFooterShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(mobileFooterShot, path.join(BRAIN_DIR, "footer_with_glass_orb_mobile_390.png"));
    }

    console.log("\n=== ALL PRE-FOOTER CTA AND GLASS ORB VERIFICATIONS PASSED! ===");
  } finally {
    await browser.close();
  }
}

verifyPreFooterCTAAndGlassOrb().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
