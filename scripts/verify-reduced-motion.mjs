import { chromium } from "playwright";

async function verifyReducedMotion() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  try {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__archeIntroTl != null);

    const fullOpacity = await page.evaluate(() => {
      const full = document.querySelector(".intro-layer-full");
      return full ? window.getComputedStyle(full).opacity : null;
    });

    console.log("Reduced motion full logo opacity:", fullOpacity);
    if (fullOpacity === "1") {
      console.log("[PASS] Reduced motion shows complete static logo immediately.");
    } else {
      throw new Error(`Expected opacity '1', got '${fullOpacity}'`);
    }
  } finally {
    await browser.close();
  }
}

verifyReducedMotion().catch((err) => {
  console.error("Reduced motion verification failed:", err);
  process.exit(1);
});
