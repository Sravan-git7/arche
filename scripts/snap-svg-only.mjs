import { chromium } from 'playwright';

async function snapSvgOnly() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto('http://localhost:5173/test-marching-compare.html');
  const svg = await page.$('svg');
  if (svg) {
    await svg.screenshot({ path: 'public/test_svg_pure.png' });
    console.log('Saved public/test_svg_pure.png');
  }
  const canvas = await page.$('#c-orig');
  if (canvas) {
    await canvas.screenshot({ path: 'public/test_orig_pure.png' });
    console.log('Saved public/test_orig_pure.png');
  }
  await browser.close();
}

snapSvgOnly().catch(console.error);
