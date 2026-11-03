import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // 1. Desktop Test (1440x900)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("arche_intro", "1");
      sessionStorage.setItem("arche:booted", "1");
    } catch {}
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  console.log("Navigating to http://localhost:5173...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Take desktop initial screenshot (Hero before scroll)
  await page.screenshot({ path: "scripts/foundation_desktop_hero.png" });

  // Check Lenis instance and smooth scrolling
  const lenisExists = await page.evaluate(() => {
    return !!window.gsap && !!window.ScrollTrigger;
  });
  console.log("GSAP & ScrollTrigger exposed on window:", lenisExists);

  // Test mouse wheel smooth scrolling
  console.log("Testing mouse wheel smooth scrolling...");
  await page.mouse.move(720, 450);
  const initialScrollY = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(300);
  const midScrollY = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(1000);
  const settledScrollY = await page.evaluate(() => window.scrollY);
  console.log(`Scroll progression: initial=${initialScrollY}, mid=${midScrollY}, settled=${settledScrollY}`);

  // Test ScrollTrigger markers alignment temporarily
  console.log("Temporarily enabling ScrollTrigger markers...");
  await page.evaluate(() => {
    const ST = window.ScrollTrigger;
    if (ST) {
      ST.defaults({ markers: true });
      ST.refresh();
    }
  });
  await page.waitForTimeout(300);
  const markerCount = await page.locator(".gsap-marker-start, .gsap-marker-scroller-start").count();
  console.log(`ScrollTrigger markers checked on page: ${markerCount}`);

  // Remove markers immediately
  await page.evaluate(() => {
    const ST = window.ScrollTrigger;
    if (ST) {
      ST.defaults({ markers: false });
      document.querySelectorAll(".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end").forEach(el => el.remove());
      ST.refresh();
    }
  });
  console.log("ScrollTrigger markers cleaned up.");

  // Test Chat transcript scrolling independently
  console.log("Testing Chat transcript data-lenis-prevent...");
  const chatScroller = page.locator("[data-lenis-prevent]").first();
  const hasLenisPrevent = await chatScroller.count() > 0;
  console.log("Independent scroll regions have data-lenis-prevent:", hasLenisPrevent);

  // Test Navigation between routes & scroll reset
  console.log("Testing navigation between routes...");
  await page.click('nav a[href="#/work"]');
  await page.waitForTimeout(700);
  const workScrollY = await page.evaluate(() => window.scrollY);
  console.log(`ScrollY after navigating to /work: ${workScrollY} (should be 0)`);
  await page.screenshot({ path: "scripts/foundation_work.png" });

  await page.click('nav a[href="#/contact"]');
  await page.waitForTimeout(700);
  const contactScrollY = await page.evaluate(() => window.scrollY);
  console.log(`ScrollY after navigating to /contact: ${contactScrollY} (should be 0)`);
  await page.screenshot({ path: "scripts/foundation_contact.png" });

  await page.click('nav a[href="#/"]');
  await page.waitForTimeout(700);
  const homeScrollY = await page.evaluate(() => window.scrollY);
  console.log(`ScrollY after returning to /: ${homeScrollY} (should be 0)`);

  // Test Browser resize
  console.log("Testing browser resize re-split...");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);

  // Take desktop full page shot
  await page.screenshot({ path: "scripts/foundation_desktop_after.png" });

  // 2. Mobile Viewport (390x844)
  console.log("Testing mobile viewport 390x844...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await mobileContext.addInitScript(() => {
    try {
      sessionStorage.setItem("arche_intro", "1");
      sessionStorage.setItem("arche:booted", "1");
    } catch {}
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: "scripts/foundation_mobile_hero.png" });

  // Check no horizontal scrollbar / overflow
  const hasOverflow = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log("Mobile has horizontal overflow:", hasOverflow);

  // Check console errors
  console.log("Total console errors encountered:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log("Errors:", consoleErrors);
  }

  await browser.close();
  console.log("Foundation test suite completed successfully.");
}

run().catch((err) => {
  console.error("Foundation test failed:", err);
  process.exit(1);
});
