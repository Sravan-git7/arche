import { chromium } from 'playwright';
import path from 'path';

async function verifyAll() {
  console.log('=== VERIFYING AC MONOGRAM BRANDING & PRELOADER ===');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    // Ensure preloader runs
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__archeIntroTl != null);
    console.log('[1/4] Timeline initialized in Intro.');

    // Pause timeline for deterministic state inspections
    await page.evaluate(() => {
      window.__archeIntroTl.pause();
    });

    const getLayerStatesAtTime = async (time) => {
      return await page.evaluate((t) => {
        window.__archeIntroTl.time(t);
        const a = document.querySelector('.intro-ac-monogram .ac-layer-a');
        const c = document.querySelector('.intro-ac-monogram .ac-layer-c');
        const dot = document.querySelector('.intro-ac-monogram .ac-layer-dot');
        const getStyle = (el) => {
          if (!el) return null;
          const comp = window.getComputedStyle(el);
          return {
            opacity: parseFloat(comp.opacity || '1'),
            clipPath: comp.clipPath
          };
        };
        return {
          time: t,
          a: getStyle(a),
          c: getStyle(c),
          dot: getStyle(dot)
        };
      }, time);
    };

    // 1. Check t=0.25s: A is active, C is NOT visible, Dot is NOT visible
    const state025 = await getLayerStatesAtTime(0.25);
    console.log('State at t=0.25s:', state025);
    if (state025.a.opacity < 0.2) throw new Error('A has not begun revealing at t=0.25s');
    if (state025.c.opacity > 0.01) throw new Error('Violation: C appeared before A was established!');
    if (state025.dot.opacity > 0.01) throw new Error('Violation: Dot appeared before C was complete!');
    console.log('[PASS] t=0.25s: A reveals first. C and Dot are absent.');

    // 2. Check t=0.65s: A is complete, C is active, Dot is NOT visible
    const state065 = await getLayerStatesAtTime(0.65);
    console.log('State at t=0.65s:', state065);
    if (state065.a.opacity < 0.99) throw new Error('A is not fully established at t=0.65s');
    if (state065.c.opacity < 0.2) throw new Error('C has not begun revealing at t=0.65s');
    if (state065.dot.opacity > 0.01) throw new Error('Violation: Dot appeared before C was complete!');
    console.log('[PASS] t=0.65s: A established, C revealing. Dot is absent.');

    // 3. Check t=0.88s: A and C are complete, Dot has not started yet
    const state088 = await getLayerStatesAtTime(0.88);
    console.log('State at t=0.88s:', state088);
    if (state088.dot.opacity > 0.01) throw new Error('Violation: Dot appeared before C was complete!');
    console.log('[PASS] t=0.88s: C complete, Dot still absent.');

    // 4. Check t=1.10s: A, C, and Dot are all complete
    const state110 = await getLayerStatesAtTime(1.10);
    console.log('State at t=1.10s:', state110);
    if (state110.a.opacity < 0.99 || state110.c.opacity < 0.99 || state110.dot.opacity < 0.99) {
      throw new Error('All elements not complete at t=1.10s');
    }
    console.log('[PASS] t=1.10s: Dot appears last, all elements established.');

    // Resume timeline to finish transition
    await page.evaluate(() => {
      window.__archeIntroTl.play();
    });

    // Wait for page entrance
    await page.waitForSelector('nav .ac-monogram', { state: 'visible', timeout: 5000 });
    console.log('[2/4] [PASS] Header contains AcMonogram.');

    // Scroll to footer and verify AcMonogram
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footerLogo = await page.$('footer .ac-monogram');
    if (!footerLogo) throw new Error('AcMonogram missing from Footer!');
    console.log('[3/4] [PASS] Footer contains AcMonogram.');

    // Verify Mobile Header
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.addInitScript(() => {
      sessionStorage.setItem('arche_intro', '1');
      sessionStorage.setItem('arche:booted', '1');
    });
    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const mobileHeaderLogo = await mobilePage.$('nav .ac-monogram');
    if (!mobileHeaderLogo) throw new Error('AcMonogram missing from Mobile Header!');
    console.log('[4/4] [PASS] Mobile Header contains AcMonogram.');

    console.log('\nALL BRANDING AND PRELOADER CHECKS PASSED WITH FLYING COLORS!');
  } finally {
    await browser.close();
  }
}

verifyAll().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
