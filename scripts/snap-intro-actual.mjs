import { chromium } from 'playwright';

async function snapIntroActual() {
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
    window.__archeIntroTl.time(1.35); // Full lockup
  });

  await page.screenshot({ path: 'public/intro_actual_screen.png' });
  console.log('Saved public/intro_actual_screen.png');

  // Also zoom in on the logo group (centered on screen)
  const logoGroup = await page.$('.intro-ac-monogram');
  if (logoGroup) {
    const box = await page.evaluate(() => {
      const g = document.querySelector('[class*="select-none px-4"]');
      const b = g ? g.getBoundingClientRect() : null;
      return b ? { x: b.x - 20, y: b.y - 20, width: b.width + 40, height: b.height + 40 } : null;
    });
    if (box) {
      await page.screenshot({ path: 'public/intro_actual_zoom.png', clip: box });
      console.log('Saved public/intro_actual_zoom.png');
    }
  }

  await browser.close();
}

snapIntroActual().catch(console.error);
