import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
const BRAIN_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyCursorFollowAndCleanFooter() {
  console.log("=== VERIFYING PRE-FOOTER CURSOR FOLLOW AND CLEAN FOOTER ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2200); // Allow preloader to finish

    // 1. Confirm Footer has ZERO glass orbs
    const footer = page.locator("footer");
    const footerOrbCount = await footer.locator(".animate-orb-float, .animate-orb-float-subtle, [style*='blur(16px)']").count();
    console.log(`Footer glass orb count: ${footerOrbCount} (Expected: 0)`);
    if (footerOrbCount !== 0) {
      throw new Error(`Expected exactly 0 glass orbs in footer, found ${footerOrbCount}`);
    }

    // Scroll to footer to capture clean watermark screenshot
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const cleanFooterShot = path.join(ARTIFACT_DIR, "footer_clean_no_orb_1440.png");
    await footer.screenshot({ path: cleanFooterShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(cleanFooterShot, path.join(BRAIN_DIR, "footer_clean_no_orb_1440.png"));
    }
    console.log("Captured clean footer screenshot without orb.");

    // 2. Locate #pre-footer-cta and verify the glass orb
    const preFooter = page.locator("#pre-footer-cta");
    if ((await preFooter.count()) !== 1) {
      throw new Error("Expected exactly 1 #pre-footer-cta");
    }

    await preFooter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const orb = preFooter.locator(".animate-orb-float > div");
    if ((await orb.count()) !== 1) {
      throw new Error("Expected 1 glass orb in #pre-footer-cta");
    }

    const sectionBox = await preFooter.boundingBox();
    console.log("PreFooter section bounding box:", sectionBox);

    // Helper to extract GSAP transform matrix values
    const getOrbTransform = async () => {
      return await orb.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const transform = style.transform;
        if (!transform || transform === "none") return { x: 0, y: 0 };
        const match = transform.match(/matrix\(([^)]+)\)/);
        if (match) {
          const parts = match[1].split(",").map((v) => parseFloat(v.trim()));
          return { x: parts[4], y: parts[5] };
        }
        return { x: 0, y: 0 };
      });
    };

    // Initial resting state
    const restingT = await getOrbTransform();
    console.log("Resting transform:", restingT);

    // 3. Move cursor LEFT across headline ("Ready to connect")
    const leftX = sectionBox.x + sectionBox.width * 0.2;
    const centerY = sectionBox.y + sectionBox.height * 0.45;
    await page.mouse.move(leftX, centerY, { steps: 10 });
    await page.waitForTimeout(400); // Allow gsap.quickTo to interpolate

    const leftT = await getOrbTransform();
    console.log("Cursor moved LEFT -> Orb transform:", leftT);
    if (leftT.x >= -10) {
      throw new Error(`Expected orb x to be negative when cursor is left, got ${leftT.x}`);
    }

    const leftShot = path.join(ARTIFACT_DIR, "prefooter_orb_cursor_left.png");
    await preFooter.screenshot({ path: leftShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(leftShot, path.join(BRAIN_DIR, "prefooter_orb_cursor_left.png"));
    }

    // 4. Move cursor RIGHT across headline ("your entire business?")
    const rightX = sectionBox.x + sectionBox.width * 0.8;
    await page.mouse.move(rightX, centerY, { steps: 10 });
    await page.waitForTimeout(400);

    const rightT = await getOrbTransform();
    console.log("Cursor moved RIGHT -> Orb transform:", rightT);
    if (rightT.x <= 10) {
      throw new Error(`Expected orb x to be positive when cursor is right, got ${rightT.x}`);
    }

    const rightShot = path.join(ARTIFACT_DIR, "prefooter_orb_cursor_right.png");
    await preFooter.screenshot({ path: rightShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(rightShot, path.join(BRAIN_DIR, "prefooter_orb_cursor_right.png"));
    }

    // 5. Move cursor UP towards eyebrow
    const topY = sectionBox.y + sectionBox.height * 0.15;
    await page.mouse.move(sectionBox.x + sectionBox.width * 0.5, topY, { steps: 10 });
    await page.waitForTimeout(400);
    const topT = await getOrbTransform();
    console.log("Cursor moved UP -> Orb transform:", topT);
    if (topT.y >= 0) {
      throw new Error(`Expected orb y to be negative when cursor is top, got ${topT.y}`);
    }

    // 6. Move cursor DOWN towards CTAs
    const bottomY = sectionBox.y + sectionBox.height * 0.85;
    await page.mouse.move(sectionBox.x + sectionBox.width * 0.5, bottomY, { steps: 10 });
    await page.waitForTimeout(400);
    const bottomT = await getOrbTransform();
    console.log("Cursor moved DOWN -> Orb transform:", bottomT);
    if (bottomT.y <= 0) {
      throw new Error(`Expected orb y to be positive when cursor is bottom, got ${bottomT.y}`);
    }

    // 7. Move mouse outside section into footer (pointerleave) and verify return to rest
    const outsideY = sectionBox.y + sectionBox.height + 80;
    await page.mouse.move(sectionBox.x + sectionBox.width * 0.5, outsideY, { steps: 5 });
    await page.waitForTimeout(900); // Allow gsap power3.out to glide back

    const finalT = await getOrbTransform();
    console.log("Cursor left section -> Final transform after glide back:", finalT);
    if (Math.abs(finalT.x) > 2 || Math.abs(finalT.y) > 2) {
      throw new Error(`Expected orb to glide back near (0, 0), got (${finalT.x}, ${finalT.y})`);
    }

    const restingShot = path.join(ARTIFACT_DIR, "prefooter_orb_resting.png");
    await preFooter.screenshot({ path: restingShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(restingShot, path.join(BRAIN_DIR, "prefooter_orb_resting.png"));
    }

    console.log("\n=== ALL CURSOR FOLLOW AND CLEAN FOOTER CHECKS PASSED! ===");
  } finally {
    await browser.close();
  }
}

verifyCursorFollowAndCleanFooter().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
