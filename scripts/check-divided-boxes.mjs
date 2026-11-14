import { chromium } from 'playwright';
import fs from 'fs';

async function checkDividedBoxes() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const p = JSON.parse(fs.readFileSync('scripts/accurate_divided_paths.json', 'utf-8'));

  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });

  const html = `
    <!DOCTYPE html><html><body>
    <svg id="svg" width="400" height="304" viewBox="0 0 100 76">
      <path id="pA" fill="#f4f2ed" d="${p.pathA}" />
      <path id="pCLime" fill="#c8f14f" d="${p.pathCLime}" />
      <path id="pCIvory" fill="#f4f2ed" d="${p.pathCIvory}" />
      <circle id="pDot" cx="${p.dot.cx}" cy="${p.dot.cy}" r="${p.dot.r}" fill="#c8f14f" />
    </svg>
    </body></html>
  `;

  fs.writeFileSync('public/test-divided.html', html);
  await page.goto('http://localhost:5173/test-divided.html');

  const boxes = await page.evaluate(() => {
    const box = id => {
      const b = document.getElementById(id).getBBox();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    };
    return {
      a: box('pA'),
      cLime: box('pCLime'),
      cIvory: box('pCIvory'),
      dot: box('pDot'),
      svg: box('svg')
    };
  });

  console.log('Divided path bounding boxes:');
  for (const [k, v] of Object.entries(boxes)) {
    console.log(`${k}: x=${v.x.toFixed(1)}, y=${v.y.toFixed(1)}, w=${v.width.toFixed(1)}, h=${v.height.toFixed(1)}`);
  }

  await browser.close();
}

checkDividedBoxes().catch(console.error);
