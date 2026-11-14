import { chromium } from 'playwright';

async function checkWhy() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  await page.goto('http://localhost:5173/test-marching-compare.html');

  const check = await page.evaluate(() => {
    const cOrig = document.getElementById('c-orig');
    const ctx = cOrig.getContext('2d');
    const data = ctx.getImageData(0, 0, 400, 304).data;
    let nonZero = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 30 || data[i+1] > 30 || data[i+2] > 30) nonZero++;
    }
    return { nonZeroPixelsInOrigCanvas: nonZero };
  });

  console.log('Original canvas status:', check);
  await browser.close();
}

checkWhy().catch(console.error);
