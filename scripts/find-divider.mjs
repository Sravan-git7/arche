import { chromium } from 'playwright';

async function findAandCDivider() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/test-inspect-hires.html');

  const divider = await page.evaluate(async () => {
    const img = document.querySelector('img');
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;

    function getRGB(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return { r: 0, g: 0, b: 0, lum: 0 };
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      return { r, g, b, lum: 0.299 * r + 0.587 * g + 0.114 * b };
    }

    // Where is the crossbar of A?
    // Left leg of A is at x: 400..750
    // Right leg of A is at x: 750..1050
    // C is centered at (1338, 1098).
    // The leftmost extent of the C outer circle is around x ~ 1000..1050!
    // The crossbar connects the right leg of A to the C!
    // Let's find the minimum thickness (the neck) between A and C around x: 1000..1150
    const neckSlices = [];
    for (let x = 950; x <= 1150; x += 10) {
      let brightCount = 0;
      for (let y = 700; y < 1400; y++) {
        if (getRGB(x, y).lum > 75) brightCount++;
      }
      neckSlices.push({ x, brightCount });
    }

    return { neckSlices };
  });

  console.log('Neck slices between A and C:');
  for (const s of divider.neckSlices) {
    console.log(`x=${s.x}: brightCount=${s.brightCount}`);
  }

  await browser.close();
}

findAandCDivider().catch(console.error);
