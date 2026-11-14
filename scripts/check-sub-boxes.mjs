import { chromium } from 'playwright';

async function checkSubBoxes() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  await page.goto('http://localhost:5173/test-iou.html');

  const boxes = await page.evaluate(() => {
    const svg = document.getElementById('svg');
    const paths = Array.from(svg.querySelectorAll('path'));
    const circle = svg.querySelector('circle');

    const box = el => {
      const b = el.getBBox();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    };
    return {
      a: box(paths[0]),
      cLime: box(paths[1]),
      cIvory: box(paths[2]),
      dot: box(circle)
    };
  });

  console.log('Subpath boxes in 100x76 viewBox:');
  for (const [k, v] of Object.entries(boxes)) {
    console.log(`${k}: x=${v.x.toFixed(1)}, y=${v.y.toFixed(1)}, w=${v.width.toFixed(1)}, h=${v.height.toFixed(1)}`);
  }

  await browser.close();
}

checkSubBoxes().catch(console.error);
