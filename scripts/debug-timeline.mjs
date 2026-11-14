import { chromium } from "playwright";

async function debugTimeline() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__archeIntroTl != null);

  console.log("Timeline ready, setting time 1.15...");
  await page.evaluate(() => {
    window.__archeIntroTl.pause();
    window.__archeIntroTl.time(1.15);
  });
  console.log("Time set to 1.15 successfully!");

  console.log("Taking screenshot...");
  await page.screenshot({ path: "scripts/test_debug_screenshot.png" });
  console.log("Screenshot taken!");

  await browser.close();
}

debugTimeline().catch(console.error);
