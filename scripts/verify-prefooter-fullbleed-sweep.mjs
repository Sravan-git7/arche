import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
const BRAIN_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyFullBleedSweep() {
  console.log("=== VERIFYING PRE-FOOTER ORB FULL-BLEED HORIZONTAL SWEEP ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2200); // Allow preloader to finish

    const preFooter = page.locator("#pre-footer-cta");
    await preFooter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const orb = preFooter.locator(".animate-orb-float > div");
    if ((await orb.count()) !== 1) {
      throw new Error("Expected 1 glass orb in #pre-footer-cta");
    }

    const sectionBox = await preFooter.boundingBox();
    console.log("Section bounding box:", sectionBox);

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

    const centerY = sectionBox.y + sectionBox.height * 0.45;

    // 1. Initial resting state
    const restT = await getOrbTransform();
    console.log("Resting transform:", restT);

    // 2. Sweep to FAR LEFT edge (x = 30px on 1440px screen)
    await page.mouse.move(30, centerY, { steps: 15 });
    await page.waitForTimeout(450); // Allow gsap.quickTo power3.out to interpolate
    const farLeftT = await getOrbTransform();
    console.log("Mouse at far left (30px) -> Orb transform:", farLeftT);
    if (farLeftT.x > -500) {
      throw new Error(`Expected orb x < -500 for full-screen travel, got ${farLeftT.x}`);
    }

    const farLeftShot = path.join(ARTIFACT_DIR, "prefooter_orb_far_left_fullbleed.png");
    await preFooter.screenshot({ path: farLeftShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(farLeftShot, path.join(BRAIN_DIR, "prefooter_orb_far_left_fullbleed.png"));
    }

    // 3. Sweep to CENTER of headline (x = 720px)
    await page.mouse.move(720, centerY, { steps: 15 });
    await page.waitForTimeout(450);
    const centerT = await getOrbTransform();
    console.log("Mouse at center (720px) -> Orb transform:", centerT);
    if (Math.abs(centerT.x) > 50) {
      throw new Error(`Expected orb x near 0 when mouse is center, got ${centerT.x}`);
    }

    const centerShot = path.join(ARTIFACT_DIR, "prefooter_orb_center_headline.png");
    await preFooter.screenshot({ path: centerShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(centerShot, path.join(BRAIN_DIR, "prefooter_orb_center_headline.png"));
    }

    // 4. Sweep to FAR RIGHT edge (x = 1410px on 1440px screen)
    await page.mouse.move(1410, centerY, { steps: 15 });
    await page.waitForTimeout(450);
    const farRightT = await getOrbTransform();
    console.log("Mouse at far right (1410px) -> Orb transform:", farRightT);
    if (farRightT.x < 500) {
      throw new Error(`Expected orb x > +500 for full-screen travel, got ${farRightT.x}`);
    }

    const farRightShot = path.join(ARTIFACT_DIR, "prefooter_orb_far_right_fullbleed.png");
    await preFooter.screenshot({ path: farRightShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(farRightShot, path.join(BRAIN_DIR, "prefooter_orb_far_right_fullbleed.png"));
    }

    // 5. Mouse leaves section into footer -> smooth glide back to rest
    await page.mouse.move(720, sectionBox.y + sectionBox.height + 80, { steps: 5 });
    await page.waitForTimeout(900); // Allow power3.out to glide back
    const finalRestT = await getOrbTransform();
    console.log("Mouse left section -> Final transform after glide back:", finalRestT);
    if (Math.abs(finalRestT.x) > 2 || Math.abs(finalRestT.y) > 2) {
      throw new Error(`Expected orb to glide back to (0, 0), got (${finalRestT.x}, ${finalRestT.y})`);
    }

    const restingShot = path.join(ARTIFACT_DIR, "prefooter_orb_returned_to_rest.png");
    await preFooter.screenshot({ path: restingShot });
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(restingShot, path.join(BRAIN_DIR, "prefooter_orb_returned_to_rest.png"));
    }

    console.log("\n=== ALL FULL-BLEED SWEEP CHECKS PASSED SUCCESSFULLY! ===");
  } finally {
    await browser.close();
  }
}

verifyFullBleedSweep().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
