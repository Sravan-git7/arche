import { chromium } from 'playwright';

async function comparePure() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  await page.goto('http://localhost:5173/test-marching-compare.html');

  const diff = await page.evaluate(async () => {
    const cOrig = document.getElementById('c-orig');
    const ctx1 = cOrig.getContext('2d');
    const d1 = ctx1.getImageData(0, 0, 400, 304).data;

    const svg = document.querySelector('svg');
    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = url; });

    const cSvg = document.createElement('canvas');
    cSvg.width = 400; cSvg.height = 304;
    const ctx2 = cSvg.getContext('2d');
    ctx2.drawImage(img, 0, 0, 400, 304);
    const d2 = ctx2.getImageData(0, 0, 400, 304).data;

    // Bounding box of d1 vs d2
    let minX1 = 400, maxX1 = 0, minY1 = 304, maxY1 = 0;
    let minX2 = 400, maxX2 = 0, minY2 = 304, maxY2 = 0;

    for (let y = 0; y < 304; y++) {
      for (let x = 0; x < 400; x++) {
        const idx = (y * 400 + x) * 4;
        const lum1 = 0.299 * d1[idx] + 0.587 * d1[idx+1] + 0.114 * d1[idx+2];
        const lum2 = 0.299 * d2[idx] + 0.587 * d2[idx+1] + 0.114 * d2[idx+2];

        if (lum1 > 60) {
          if (x < minX1) minX1 = x;
          if (x > maxX1) maxX1 = x;
          if (y < minY1) minY1 = y;
          if (y > maxY1) maxY1 = y;
        }
        if (lum2 > 60) {
          if (x < minX2) minX2 = x;
          if (x > maxX2) maxX2 = x;
          if (y < minY2) minY2 = y;
          if (y > maxY2) maxY2 = y;
        }
      }
    }

    return {
      origBBox: { minX: minX1, maxX: maxX1, minY: minY1, maxY: maxY1, w: maxX1 - minX1, h: maxY1 - minY1 },
      svgBBox: { minX: minX2, maxX: maxX2, minY: minY2, maxY: maxY2, w: maxX2 - minX2, h: maxY2 - minY2 }
    };
  });

  console.log('Bounding boxes:', diff);
  await browser.close();
}

comparePure().catch(console.error);
