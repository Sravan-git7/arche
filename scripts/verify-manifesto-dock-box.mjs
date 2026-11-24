import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
const BRAIN_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyManifestoDockBox() {
  console.log("=== VERIFYING MANIFESTO DOCK BOX ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Locate the Manifesto dock box
    const dockBox = page.locator(".glass-dock-box");
    const count = await dockBox.count();
    console.log(`Found ${count} .glass-dock-box elements.`);
    if (count !== 1) {
      throw new Error(`Expected exactly 1 .glass-dock-box, got ${count}`);
    }

    const styles = await dockBox.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        borderRadius: cs.borderRadius,
        border: cs.border,
        boxShadow: cs.boxShadow,
        backgroundColor: cs.backgroundColor,
      };
    });
    console.log("Dock box computed styles:", styles);

    // Verify links inside
    const link1 = dockBox.locator("a[href='#services']");
    const link2 = dockBox.locator("a[href='#process']");

    const text1 = await link1.innerText();
    const text2 = await link2.innerText();
    console.log("Link 1 text:", text1);
    console.log("Link 2 text:", text2);

    if (!text1.toLowerCase().includes("explore the 4 verticals")) {
      throw new Error(`Expected Link 1 to contain 'explore the 4 verticals', got '${text1}'`);
    }
    if (!text2.toLowerCase().includes("how we work")) {
      throw new Error(`Expected Link 2 to contain 'how we work', got '${text2}'`);
    }

    // Scroll to Manifesto section and capture screenshot
    const tensionSection = page.locator("#tension");
    await tensionSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const shotPath = path.join(ARTIFACT_DIR, "manifesto_glass_dock_box.png");
    await page.screenshot({ path: shotPath, clip: { x: 0, y: 0, width: 1440, height: 850 } });

    // Mobile check
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1000);

    const mobileTension = mobilePage.locator("#tension");
    await mobileTension.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);

    const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > 390);
    console.log("Mobile overflow > 390px?", overflow);
    if (overflow) {
      throw new Error("Mobile horizontal overflow detected!");
    }

    const mobileShot = path.join(ARTIFACT_DIR, "manifesto_glass_dock_box_mobile.png");
    await mobilePage.screenshot({ path: mobileShot });

    console.log("Manifesto dock box verification PASSED!");
  } finally {
    await browser.close();
  }
}

verifyManifestoDockBox().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
