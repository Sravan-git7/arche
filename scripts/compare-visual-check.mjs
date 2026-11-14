import { chromium } from 'playwright';
import fs from 'fs';

async function compareWithOriginal() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const p = JSON.parse(fs.readFileSync('scripts/accurate_divided_paths.json', 'utf-8'));

  const page = await browser.newPage({ viewport: { width: 1100, height: 600 } });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #0c0c0d; color: #fff; font-family: sans-serif; padding: 30px; display: flex; gap: 40px; justify-content: center; }
        .card { background: #141416; border: 1px solid #27272a; border-radius: 12px; padding: 24px; text-align: center; }
        canvas, svg { width: 420px; height: 320px; display: block; }
      </style>
    </head>
    <body>
      <div class="card">
        <h3 style="margin:0 0 16px; color:#a1a1aa">Reference: arche logo.jpeg</h3>
        <canvas id="c-orig" width="420" height="320"></canvas>
      </div>
      <div class="card">
        <h3 style="margin:0 0 16px; color:#c8f14f">Vector: AC Monogram</h3>
        <svg id="svg" width="420" height="320" viewBox="0 0 100 76" fill="none">
          <path id="pA" fill="#f4f2ed" fill-rule="evenodd" d="${p.pathA}" />
          <path id="pCLime" fill="#c8f14f" fill-rule="evenodd" d="${p.pathCLime}" />
          <path id="pCIvory" fill="#f4f2ed" fill-rule="evenodd" d="${p.pathCIvory}" />
          <circle id="pDot" cx="${p.dot.cx}" cy="${p.dot.cy}" r="${p.dot.r}" fill="#c8f14f" />
        </svg>
      </div>
      <img id="img" src="http://localhost:5173/arche%20logo.jpeg" style="display:none" />
      <script>
        const img = document.getElementById('img');
        img.onload = () => {
          const c = document.getElementById('c-orig');
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 400, 540, 1250, 960, 0, 0, 420, 320);
        };
      </script>
    </body>
    </html>
  `;

  fs.writeFileSync('public/test-visual-check.html', html);
  await page.goto('http://localhost:5173/test-visual-check.html');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'public/perfect_vector_match.png' });
  console.log('Saved public/perfect_vector_match.png');

  await browser.close();
}

compareWithOriginal().catch(console.error);
