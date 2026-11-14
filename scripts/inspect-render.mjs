import { chromium } from 'playwright';
import fs from 'fs';

async function inspectRender() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  // Clear sessionStorage so preloader mounts
  await page.addInitScript(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.intro-ac-monogram');

  // Pause at t=1.1s when everything is visible
  await page.evaluate(() => {
    window.__archeIntroTl.pause();
    window.__archeIntroTl.time(1.1);
  });

  await page.screenshot({ path: 'public/user_view_at_t11.png' });
  console.log('Saved public/user_view_at_t11.png');

  // Let's also inspect the bounding box and computed styles of the logo in the preloader
  const info = await page.evaluate(() => {
    const svg = document.querySelector('.intro-ac-monogram');
    const a = svg.querySelector('.ac-layer-a');
    const cLime = svg.querySelector('.ac-path-c-lime');
    const cIvory = svg.querySelector('.ac-path-c-ivory');
    const dot = svg.querySelector('.ac-layer-dot circle');

    return {
      svgBBox: svg.getBoundingClientRect(),
      aBBox: a.getBoundingClientRect(),
      cLimeBBox: cLime ? cLime.getBoundingClientRect() : null,
      cIvoryBBox: cIvory ? cIvory.getBoundingClientRect() : null,
      dotBBox: dot ? dot.getBoundingClientRect() : null,
      aFill: window.getComputedStyle(a).fill,
      cLimeFill: window.getComputedStyle(cLime).fill,
      dotFill: window.getComputedStyle(dot).fill
    };
  });

  console.log('Preloader logo metrics:', JSON.stringify(info, null, 2));
  await browser.close();
}

inspectRender().catch(console.error);
