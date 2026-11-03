import { chromium } from "playwright";

async function measure() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5173/");
  await page.waitForTimeout(1000);

  // Scroll to Problem pin and scroll through to final state
  const pPin = await page.evaluate(() => {
    // @ts-ignore
    const st = window.ScrollTrigger ? window.ScrollTrigger.getById("problem-pin") : null;
    return st ? { start: st.start, end: st.end } : null;
  });

  console.log("Problem pin:", pPin);
  if (pPin) {
    // Check initial state
    await page.evaluate((y) => window.scrollTo(0, y), pPin.start + 50);
    await page.waitForTimeout(500);
    const initialRects = await getRects(page);
    console.log("INITIAL RECTS (y = start + 50):", initialRects);

    // Check final state
    await page.evaluate((y) => window.scrollTo(0, y), pPin.start + (pPin.end - pPin.start) * 0.95);
    await page.waitForTimeout(500);
    const finalRects = await getRects(page);
    console.log("FINAL RECTS (y = start + 95%):", finalRects);
    await page.locator(".pf-visual-container").screenshot({ path: "audit_deliverables/phase-1/debug_visual_container.png" });
    await page.screenshot({ path: "audit_deliverables/phase-1/debug_full_problem.png" });
  }

  // Also test laptop 1366x768
  const laptopCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await laptopCtx.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  });
  const laptopPage = await laptopCtx.newPage();
  await laptopPage.goto("http://localhost:5173/");
  await laptopPage.waitForTimeout(1000);
  const lPin = await laptopPage.evaluate(() => {
    // @ts-ignore
    const st = window.ScrollTrigger ? window.ScrollTrigger.getById("problem-pin") : null;
    return st ? { start: st.start, end: st.end } : null;
  });
  if (lPin) {
    await laptopPage.evaluate((y) => window.scrollTo(0, y), lPin.start + (lPin.end - lPin.start) * 0.95);
    await laptopPage.waitForTimeout(500);
    const laptopRects = await getRects(laptopPage);
    console.log("LAPTOP RECTS (1366x768 at 95%):", laptopRects);
    await laptopPage.locator(".pf-visual-container").screenshot({ path: "audit_deliverables/phase-1/laptop_visual_container.png" });
  }

  await browser.close();
}

async function getRects(page) {
  return await page.evaluate(() => {
    const stage = document.querySelector(".pf-visual-container");
    const stageR = stage.getBoundingClientRect();
    const cardWeb = document.querySelector('[data-card="web"]')?.getBoundingClientRect();
    const cardEmail = document.querySelector('[data-card="email"]')?.getBoundingClientRect();
    const cardCrm = document.querySelector('[data-card="crm"]')?.getBoundingClientRect();
    const cardSheet = document.querySelector('[data-card="sheet"]')?.getBoundingClientRect();
    const procLane = document.querySelector(".pf-proc-lane")?.getBoundingClientRect();
    const grid = stage.querySelector(".grid");
    const gridStyle = grid ? window.getComputedStyle(grid) : {};

    return {
      stageHeight: stageR.height,
      gridTemplateRows: gridStyle.gridTemplateRows,
      gridTemplateColumns: gridStyle.gridTemplateColumns,
      alignItems: gridStyle.alignItems,
      web: cardWeb ? { top: cardWeb.top - stageR.top, height: cardWeb.height, bottom: cardWeb.bottom - stageR.top } : null,
      crm: cardCrm ? { top: cardCrm.top - stageR.top, height: cardCrm.height, bottom: cardCrm.bottom - stageR.top } : null,
      proc: procLane ? { top: procLane.top - stageR.top, height: procLane.height, bottom: procLane.bottom - stageR.top } : null,
      crmOverlapWithProc: cardCrm && procLane ? (cardCrm.top < procLane.bottom && cardCrm.bottom > procLane.top) : false,
      overlapPx: cardCrm && procLane ? Math.max(0, procLane.bottom - cardCrm.top) : 0,
    };
  });
}

measure().catch(console.error);
