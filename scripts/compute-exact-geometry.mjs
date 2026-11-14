import { chromium } from 'playwright';

async function computeExactGeometry() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/test-inspect-hires.html');

  const geom = await page.evaluate(async () => {
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
      return { r, g, b, lum: 0.299 * r + 0.587 * g + 0.114 * b };
    }

    // 1. Center of C: center of lime dot
    // Find weighted centroid of lime dot
    let sumX = 0, sumY = 0, count = 0;
    for (let y = 1000; y < 1200; y++) {
      for (let x = 1250; x < 1450; x++) {
        const p = getRGB(x, y);
        if (p.g > 130 && p.g > p.r * 1.15 && p.g > p.b * 1.5) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    const cCx = sumX / count;
    const cCy = sumY / count;

    // Radius of lime dot:
    const dotRadius = Math.sqrt(count / Math.PI);

    // 2. Radii of C:
    // C is concentric circles around (cCx, cCy)
    // Scan radially at 90 deg (downwards)
    let inInner = false, innerStart = 0, innerEnd = 0;
    let inOuter = false, outerStart = 0, outerEnd = 0;
    for (let r = dotRadius + 10; r < 500; r++) {
      const p = getRGB(Math.round(cCx), Math.round(cCy + r));
      if (p.lum > 70 && !inInner && !innerEnd) {
        inInner = true;
        innerStart = r;
      } else if (p.lum <= 70 && inInner) {
        inInner = false;
        innerEnd = r;
      } else if (p.lum > 70 && innerEnd && !inOuter) {
        inOuter = true;
        outerStart = r;
      } else if (p.lum <= 70 && inOuter) {
        inOuter = false;
        outerEnd = r;
      }
    }

    // 3. Left leg of A:
    // Apex of A: find topmost bright pixel around x: 700..900
    let aApexY = H, aApexX = 0;
    for (let y = 500; y < 700; y++) {
      for (let x = 700; x < 900; x++) {
        const p = getRGB(x, y);
        if (p.lum > 80 && y < aApexY) {
          aApexY = y;
          aApexX = x;
        }
      }
    }

    // Leftmost point of A:
    let aLeftX = W, aLeftY = 0;
    for (let y = 1200; y < 1520; y++) {
      for (let x = 380; x < 600; x++) {
        const p = getRGB(x, y);
        if (p.lum > 80 && x < aLeftX) {
          aLeftX = x;
          aLeftY = y;
        }
      }
    }

    // Bottom-left rounded cap of A:
    let aBottomY = 0, aBottomX = 0;
    for (let y = 1400; y < 1550; y++) {
      for (let x = 380; x < 600; x++) {
        const p = getRGB(x, y);
        if (p.lum > 80 && y > aBottomY) {
          aBottomY = y;
          aBottomX = x;
        }
      }
    }

    // Counter hole of A:
    // Bounding box of hole between legs
    let holeMinX = W, holeMaxX = 0, holeMinY = H, holeMaxY = 0;
    for (let y = 700; y < 1150; y++) {
      for (let x = 650; x < 950; x++) {
        const p = getRGB(x, y);
        // Is it inside the counter hole (dark surrounded by bright)
        if (p.lum < 40) {
          // Check if left and right are bright
          let hasLeft = false, hasRight = false;
          for (let lx = x - 1; lx >= 550; lx--) if (getRGB(lx, y).lum > 70) { hasLeft = true; break; }
          for (let rx = x + 1; rx <= 1050; rx++) if (getRGB(rx, y).lum > 70) { hasRight = true; break; }
          if (hasLeft && hasRight) {
            if (x < holeMinX) holeMinX = x;
            if (x > holeMaxX) holeMaxX = x;
            if (y < holeMinY) holeMinY = y;
            if (y > holeMaxY) holeMaxY = y;
          }
        }
      }
    }

    return {
      dot: { cx: cCx, cy: cCy, radius: dotRadius },
      cArcsAt90Deg: { innerStart, innerEnd, outerStart, outerEnd },
      aApex: { x: aApexX, y: aApexY },
      aLeft: { x: aLeftX, y: aLeftY },
      aBottom: { x: aBottomX, y: aBottomY },
      aHole: { minX: holeMinX, maxX: holeMaxX, minY: holeMinY, maxY: holeMaxY }
    };
  });

  console.log('Exact Geometric Parameters:', JSON.stringify(geom, null, 2));
  await browser.close();
}

computeExactGeometry().catch(console.error);
