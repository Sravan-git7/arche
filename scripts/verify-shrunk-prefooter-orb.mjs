import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

async function verifyShrunkOrb() {
  console.log("=== VERIFYING SHRUNK PRE-FOOTER GLASS ORB (190-215px) & SOFTENED SHADING ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:5173/#/...");
  await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);

  const preFooter = page.locator("#pre-footer-cta");
  await preFooter.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const orb = preFooter.locator(".animate-orb-float > div").first();
  await orb.waitFor({ state: "visible" });

  const orbBox = await orb.boundingBox();
  console.log(`Orb dimensions at 1440x900: width=${orbBox.width}px, height=${orbBox.height}px`);

  if (Math.round(orbBox.width) !== 215 || Math.round(orbBox.height) !== 215) {
    throw new Error(`Expected orb to be 215px at 1440x900 desktop, but got ${orbBox.width}x${orbBox.height}px`);
  }
  console.log("✓ Verified exact desktop proportion: 215px x 215px");

  // Check background style
  const backgroundStyle = await orb.evaluate((el) => el.style.background);
  console.log("Orb background style:", backgroundStyle);
  if (!backgroundStyle.includes("rgba(20, 20, 19, 0.14)")) {
    throw new Error(`Expected background to include rgba(20, 20, 19, 0.14), got: ${backgroundStyle}`);
  }
  console.log("✓ Verified softened bottom-edge shading: rgba(20, 20, 19, 0.14)");

  const sectionBox = await preFooter.boundingBox();

  // Test 1: Orb resting at center
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prefooter_shrunk_orb_center_resting_1440.png"),
    clip: { x: 0, y: Math.max(0, sectionBox.y), width: 1440, height: Math.min(sectionBox.height, 900) },
  });
  console.log("Saved prefooter_shrunk_orb_center_resting_1440.png");

  // Test 2: Hover over subtitle to verify text readability behind the ball
  console.log("Hovering cursor directly over subtitle...");
  const subtitle = preFooter.locator("p").first();
  const subtitleBox = await subtitle.boundingBox();
  await page.mouse.move(subtitleBox.x + subtitleBox.width * 0.45, subtitleBox.y + subtitleBox.height * 0.5);
  await page.waitForTimeout(800);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prefooter_shrunk_orb_behind_subtitle_1440.png"),
    clip: { x: 0, y: Math.max(0, sectionBox.y), width: 1440, height: Math.min(sectionBox.height, 900) },
  });
  console.log("Saved prefooter_shrunk_orb_behind_subtitle_1440.png");

  // Test 3: Hover over headline word "business?" (matching image_87e3e4.jpg proportion)
  console.log("Hovering cursor over headline word 'business?'...");
  const headline = preFooter.locator("h2");
  const headlineBox = await headline.boundingBox();
  await page.mouse.move(headlineBox.x + headlineBox.width * 0.72, headlineBox.y + headlineBox.height * 0.75);
  await page.waitForTimeout(800);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prefooter_shrunk_orb_behind_headline_1440.png"),
    clip: { x: 0, y: Math.max(0, sectionBox.y), width: 1440, height: Math.min(sectionBox.height, 900) },
  });
  console.log("Saved prefooter_shrunk_orb_behind_headline_1440.png");

  await browser.close();
  console.log("=== ALL VERIFICATIONS PASSED ===");
}

verifyShrunkOrb().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
