import { chromium } from 'playwright';
import fs from 'fs';

async function visualizeSubpaths() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const data = JSON.parse(fs.readFileSync('scripts/marching_ac_paths.json', 'utf-8'));
  const aSubpaths = data.pathA.split('M ').filter(Boolean).map(s => 'M ' + s.trim());

  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#64748b'];
  const svgContent = `
    <svg width="600" height="456" viewBox="0 0 100 76" style="background:#111">
      ${aSubpaths.map((p, i) => `<path d="${p}" fill="${colors[i % colors.length]}" opacity="0.8" />`).join('\n')}
    </svg>
  `;

  fs.writeFileSync('public/test-subpaths.html', `<!DOCTYPE html><html><body>${svgContent}</body></html>`);
  await page.goto('http://localhost:5173/test-subpaths.html');
  await page.screenshot({ path: 'public/subpaths_a_colored.png' });
  console.log('Saved public/subpaths_a_colored.png');

  // Let's get bounding box of each subpath of A
  const boxes = await page.evaluate(() => {
    const paths = Array.from(document.querySelectorAll('path'));
    return paths.map((p, i) => {
      const b = p.getBBox();
      return { index: i, x: b.x, y: b.y, width: b.width, height: b.height };
    });
  });

  console.log('Subpath boxes of A:', boxes);
  await browser.close();
}

visualizeSubpaths().catch(console.error);
