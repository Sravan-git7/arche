import { chromium } from 'playwright';

async function checkIntroVisuals() {
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

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__archeIntroTl != null);

  await page.evaluate(() => {
    window.__archeIntroTl.pause();
    window.__archeIntroTl.time(1.35);
  });

  const inspection = await page.evaluate(() => {
    const monogram = document.querySelector('.intro-ac-monogram');
    const wordmarkText = document.querySelector('.intro-char')?.closest('span');
    const dot = monogram.querySelector('.ac-path-dot');
    const cLime = monogram.querySelector('.ac-path-c-lime');
    const cIvory = monogram.querySelector('.ac-path-c-ivory');
    const aPath = monogram.querySelector('.ac-path-a');

    return {
      monogramBBox: monogram.getBoundingClientRect(),
      wordmarkTextBBox: wordmarkText.getBoundingClientRect(),
      aBBox: aPath.getBoundingClientRect(),
      cLimeBBox: cLime.getBoundingClientRect(),
      cIvoryBBox: cIvory.getBoundingClientRect(),
      dotBBox: dot.getBoundingClientRect(),
      cLimeColor: window.getComputedStyle(cLime).fill,
      cIvoryColor: window.getComputedStyle(cIvory).fill,
      dotColor: window.getComputedStyle(dot).fill,
      aColor: window.getComputedStyle(aPath).fill
    };
  });

  console.log('Intro Visual Inspection:', JSON.stringify(inspection, null, 2));
  await browser.close();
}

checkIntroVisuals().catch(console.error);
