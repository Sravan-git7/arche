import { chromium } from 'playwright';

async function debugBinA() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/test-inspect-hires.html');

  const debug = await page.evaluate(async () => {
    const img = document.querySelector('img');
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;

    function getLum(x, y) {
      const idx = (y * W + x) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
    function isLime(x, y) {
      const idx = (y * W + x) * 4;
      return data[idx + 1] > 115 && data[idx + 1] > data[idx] * 1.15 && data[idx + 1] > data[idx + 2] * 1.5;
    }

    const minX = 400, maxX = 1650, minY = 540, maxY = 1500;
    let countA = 0, countCLime = 0, countCIvory = 0;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (x > 1460 && y < 780) continue;
        if (getLum(x, y) > 75) {
          if (isLime(x, y)) countCLime++;
          else if (x >= 1140 && y >= 1100) countCIvory++;
          else countA++;
        }
      }
    }

    return { countA, countCLime, countCIvory };
  });

  console.log('Pixel counts in masks:', debug);
  await browser.close();
}

debugBinA().catch(console.error);
