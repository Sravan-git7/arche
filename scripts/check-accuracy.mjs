import { chromium } from 'playwright';
import fs from 'fs';

async function checkAccuracy() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const p = JSON.parse(fs.readFileSync('scripts/accurate_production_paths.json', 'utf-8'));

  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>body { background: #000; margin: 0; padding: 20px; }</style>
    </head>
    <body>
      <canvas id="c-orig" width="400" height="304"></canvas>
      <svg id="svg" width="400" height="304" viewBox="0 0 100 76" fill="none">
        <path fill="#f4f2ed" fill-rule="evenodd" d="${p.pathA}" />
        <path fill="#c8f14f" fill-rule="evenodd" d="${p.pathCLime}" />
        <path fill="#f4f2ed" fill-rule="evenodd" d="${p.pathCIvory}" />
        <circle cx="${p.dot.cx}" cy="${p.dot.cy}" r="${p.dot.r}" fill="#c8f14f" />
      </svg>
      <img id="img" src="http://localhost:5173/arche%20logo.jpeg" />
      <script>
        window.__ready = false;
        const img = document.getElementById('img');
        img.onload = () => {
          const c = document.getElementById('c-orig');
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 400, 540, 1250, 960, 0, 0, 400, 304);
          window.__ready = true;
        };
        if (img.complete) img.onload();
      </script>
    </body>
    </html>
  `;

  fs.writeFileSync('public/test-iou.html', html);
  await page.goto('http://localhost:5173/test-iou.html');
  await page.waitForFunction(() => window.__ready === true);

  const stats = await page.evaluate(async () => {
    const cOrig = document.getElementById('c-orig');
    const d1 = cOrig.getContext('2d').getImageData(0, 0, 400, 304).data;

    const svg = document.getElementById('svg');
    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = url; });

    const cSvg = document.createElement('canvas');
    cSvg.width = 400; cSvg.height = 304;
    const ctxSvg = cSvg.getContext('2d');
    ctxSvg.drawImage(img, 0, 0, 400, 304);
    const d2 = ctxSvg.getImageData(0, 0, 400, 304).data;

    let overlap = 0, orig = 0, total = 0;
    for (let i = 0; i < 400 * 304; i++) {
      const idx = i * 4;
      const fg1 = (0.299 * d1[idx] + 0.587 * d1[idx+1] + 0.114 * d1[idx+2]) > 60;
      const fg2 = (0.299 * d2[idx] + 0.587 * d2[idx+1] + 0.114 * d2[idx+2]) > 60;

      if (fg1) orig++;
      if (fg1 && fg2) overlap++;
      if (fg1 || fg2) total++;
    }

    return {
      overlap,
      orig,
      total,
      coverage: (overlap / orig * 100).toFixed(1) + '%',
      iou: (overlap / total * 100).toFixed(1) + '%'
    };
  });

  console.log('IoU Stats:', stats);
  await browser.close();
}

checkAccuracy().catch(console.error);
