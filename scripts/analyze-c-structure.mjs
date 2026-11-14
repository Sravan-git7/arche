import { chromium } from 'playwright';

async function analyzeCStructure() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/test-inspect-hires.html');

  const structure = await page.evaluate(async () => {
    const img = document.querySelector('img');
    await img.decode();
    const W = img.naturalWidth;
    const H = img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;

    function getRGB(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return { r: 0, g: 0, b: 0, lum: 0 };
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      return { r, g, b, lum };
    }

    // Radial scan from dot center (1338, 1098)
    // For every angle from 0 to 360 degrees in steps of 10 degrees:
    // list the intervals of brightness (where lum > 70)
    const rays = [];
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const segments = [];
      let inSeg = false, startR = 0, segIsLime = false;
      for (let r = 80; r < 550; r += 2) {
        const x = Math.round(1338 + r * Math.cos(rad));
        const y = Math.round(1098 + r * Math.sin(rad));
        const p = getRGB(x, y);
        const bright = p.lum > 70;
        const lime = p.g > 120 && p.g > p.r * 1.15 && p.g > p.b * 1.5;

        if (bright && !inSeg) {
          inSeg = true;
          startR = r;
          segIsLime = lime;
        } else if (!bright && inSeg) {
          inSeg = false;
          segments.push({ startR, endR: r, width: r - startR, isLime: segIsLime });
        }
      }
      rays.push({ deg, segments });
    }

    return rays;
  });

  console.log('Radial scan around C dot:');
  for (const ray of structure) {
    console.log(`Angle ${ray.deg}°: ${ray.segments.map(s => `[r=${s.startR}..${s.endR} (w=${s.width}, lime=${s.isLime})]`).join(', ')}`);
  }

  await browser.close();
}

analyzeCStructure().catch(console.error);
