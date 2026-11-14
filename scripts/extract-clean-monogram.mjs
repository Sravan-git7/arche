import { chromium } from 'playwright';
import fs from 'fs';

async function extractCleanMonogram() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.goto('http://localhost:5173/test-inspect-hires.html');

  const cleanPaths = await page.evaluate(async () => {
    const img = document.querySelector('img');
    await img.decode();
    const W = img.naturalWidth;
    const H = img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;

    function getLum(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return 0;
      const idx = (y * W + x) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    function isLime(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return false;
      const idx = (y * W + x) * 4;
      return data[idx + 1] > 115 && data[idx + 1] > data[idx] * 1.15 && data[idx + 1] > data[idx + 2] * 1.5;
    }

    // Exact bounds
    const minX = 400, maxX = 1650, minY = 540, maxY = 1500;
    const cropW = maxX - minX, cropH = maxY - minY;

    // Dot parameters
    const dotX = 1337.5, dotY = 1097.8, dotRadius = 45;

    // Create smoothed binary masks
    const binA = new Uint8Array(W * H);
    const binCLime = new Uint8Array(W * H);
    const binCIvory = new Uint8Array(W * H);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Exclude top-right triangle artifact
        if (x > 1460 && y < 780) continue;

        const lum = getLum(x, y);
        if (lum > 75) {
          const idx = y * W + x;

          // Exclude dot from C
          const dDot = Math.hypot(x - dotX, y - dotY);
          if (dDot <= dotRadius + 8) continue;

          if (isLime(x, y)) {
            binCLime[idx] = 1;
          } else {
            // Ivory: A vs C
            // C lower arc is centered around (1338, 1098) with x >= 1140, y >= 1100
            if (x >= 1140 && y >= 1100) {
              binCIvory[idx] = 1;
            } else {
              binA[idx] = 1;
            }
          }
        }
      }
    }

    // Moore-Neighbor outer contour tracing
    function traceSingleLoop(mask, startX, startY) {
      const loop = [];
      let cx = startX, cy = startY;
      let dir = 0;
      const dirs = [
        [1, 0], [1, 1], [0, 1], [-1, 1],
        [-1, 0], [-1, -1], [0, -1], [1, -1]
      ];

      for (let step = 0; step < 30000; step++) {
        loop.push({ x: cx, y: cy });
        let found = false;
        for (let i = 0; i < 8; i++) {
          const checkDir = (dir + 6 + i) % 8;
          const nx = cx + dirs[checkDir][0];
          const ny = cy + dirs[checkDir][1];
          if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY && mask[ny * W + nx] === 1) {
            cx = nx; cy = ny; dir = checkDir; found = true; break;
          }
        }
        if (!found || (cx === startX && cy === startY && step > 2)) break;
      }
      return loop;
    }

    // Find the LARGEST outer contour in mask
    function findMajorContour(mask) {
      let maxLen = 0, bestLoop = [];
      const visited = new Uint8Array(W * H);

      for (let y = minY; y <= maxY; y += 2) {
        for (let x = minX; x <= maxX; x += 2) {
          const idx = y * W + x;
          if (mask[idx] === 1 && !visited[idx]) {
            const isBorder = mask[idx - 1] === 0 || mask[idx + 1] === 0 || mask[idx - W] === 0 || mask[idx + W] === 0;
            if (isBorder) {
              const l = traceSingleLoop(mask, x, y);
              for (const p of l) visited[p.y * W + p.x] = 1;
              if (l.length > maxLen) {
                maxLen = l.length;
                bestLoop = l;
              }
            }
          }
        }
      }
      return bestLoop;
    }

    // For A, also find the inner hole contour
    function findAHole(mask) {
      // Find a background pixel (0) inside the hole
      // Search in aHole region (x: 700..900, y: 800..1050)
      for (let y = 800; y < 1050; y++) {
        for (let x = 750; x < 850; x++) {
          if (mask[y * W + x] === 0) {
            // Check if boundary
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                if (mask[(y + dy) * W + (x + dx)] === 1) {
                  return traceSingleLoop(mask, x + dx, y + dy);
                }
              }
            }
          }
        }
      }
      return [];
    }

    // Iterative RDP
    function rdp(pts, eps) {
      if (pts.length <= 2) return pts;
      const keep = new Uint8Array(pts.length);
      keep[0] = 1; keep[pts.length - 1] = 1;
      const stack = [[0, pts.length - 1]];

      while (stack.length > 0) {
        const [st, en] = stack.pop();
        let maxD = 0, maxI = st;
        const ax = pts[st].x, ay = pts[st].y;
        const bx = pts[en].x, by = pts[en].y;
        const l2 = (bx - ax) ** 2 + (by - ay) ** 2;

        for (let i = st + 1; i < en; i++) {
          const px = pts[i].x, py = pts[i].y;
          let d = 0;
          if (l2 === 0) {
            d = Math.hypot(px - ax, py - ay);
          } else {
            let t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2));
            d = Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
          }
          if (d > maxD) { maxD = d; maxI = i; }
        }

        if (maxD > eps) {
          keep[maxI] = 1;
          if (maxI - st > 1) stack.push([st, maxI]);
          if (en - maxI > 1) stack.push([maxI, en]);
        }
      }

      const res = [];
      for (let i = 0; i < pts.length; i++) if (keep[i]) res.push(pts[i]);
      return res;
    }

    // Convert polygon to smooth Catmull-Rom cubic Bézier path
    function toSmoothSvgPath(pts, scaleX, scaleY, offX, offY) {
      if (pts.length < 3) return '';
      const m = pts.map(p => ({
        x: Number(((p.x - offX) * scaleX).toFixed(2)),
        y: Number(((p.y - offY) * scaleY).toFixed(2))
      }));

      const n = m.length;
      let d = `M ${m[0].x} ${m[0].y} `;
      for (let i = 0; i < n; i++) {
        const p0 = m[(i - 1 + n) % n];
        const p1 = m[i];
        const p2 = m[(i + 1) % n];
        const p3 = m[(i + 2) % n];

        const cp1x = Number((p1.x + (p2.x - p0.x) / 6).toFixed(2));
        const cp1y = Number((p1.y + (p2.y - p0.y) / 6).toFixed(2));
        const cp2x = Number((p2.x - (p3.x - p1.x) / 6).toFixed(2));
        const cp2y = Number((p2.y - (p3.y - p1.y) / 6).toFixed(2));

        d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y} `;
      }
      d += 'Z';
      return d;
    }

    const aOuter = findMajorContour(binA);
    const aHole = findAHole(binA);
    const cLime = findMajorContour(binCLime);
    const cIvory = findMajorContour(binCIvory);

    // Epsilon = 4.5 in 2048 space ensures buttery smooth curves with ~60 points per loop
    const aOuterRdp = rdp(aOuter, 4.5);
    const aHoleRdp = rdp(aHole, 4.0);
    const cLimeRdp = rdp(cLime, 4.5);
    const cIvoryRdp = rdp(cIvory, 4.5);

    const sX = 100 / cropW;
    const sY = 76 / cropH;

    const pathA = toSmoothSvgPath(aOuterRdp, sX, sY, minX, minY) + ' ' + toSmoothSvgPath(aHoleRdp, sX, sY, minX, minY);
    const pathCLime = toSmoothSvgPath(cLimeRdp, sX, sY, minX, minY);
    const pathCIvory = toSmoothSvgPath(cIvoryRdp, sX, sY, minX, minY);

    const dotCx = Number(((dotX - minX) * sX).toFixed(2));
    const dotCy = Number(((dotY - minY) * sY).toFixed(2));
    const dotR = Number((dotRadius * sX).toFixed(2));

    return {
      aPoints: aOuterRdp.length + aHoleRdp.length,
      cLimePoints: cLimeRdp.length,
      cIvoryPoints: cIvoryRdp.length,
      pathA,
      pathCLime,
      pathCIvory,
      dot: { cx: dotCx, cy: dotCy, r: dotR }
    };
  });

  console.log('Clean extraction results:');
  console.log('A points:', cleanPaths.aPoints, 'length:', cleanPaths.pathA.length);
  console.log('C Lime points:', cleanPaths.cLimePoints, 'length:', cleanPaths.pathCLime.length);
  console.log('C Ivory points:', cleanPaths.cIvoryPoints, 'length:', cleanPaths.pathCIvory.length);
  console.log('Dot:', cleanPaths.dot);

  fs.writeFileSync('scripts/clean_ac_monogram.json', JSON.stringify(cleanPaths, null, 2));

  // Render comparison HTML
  const svgHtml = `
    <svg width="400" height="304" viewBox="0 0 100 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#f4f2ed" fill-rule="evenodd" d="${cleanPaths.pathA}" />
      <path fill="#c8f14f" fill-rule="evenodd" d="${cleanPaths.pathCLime}" />
      <path fill="#f4f2ed" fill-rule="evenodd" d="${cleanPaths.pathCIvory}" />
      <circle cx="${cleanPaths.dot.cx}" cy="${cleanPaths.dot.cy}" r="${cleanPaths.dot.r}" fill="#c8f14f" />
    </svg>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #0c0c0d; color: #fff; font-family: monospace; padding: 30px; display: flex; gap: 40px; justify-content: center; }
        .card { background: #18181b; padding: 20px; border-radius: 8px; text-align: center; }
        canvas, svg { width: 400px; height: 304px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h3>Original (arche logo.jpeg cropped)</h3>
        <canvas id="c-orig" width="400" height="304"></canvas>
      </div>
      <div class="card">
        <h3>Crisp Vector Monogram</h3>
        <div>${svgHtml}</div>
      </div>
      <img id="img" src="http://localhost:5173/arche%20logo.jpeg" style="display:none" />
      <script>
        const img = document.getElementById('img');
        img.onload = () => {
          const c = document.getElementById('c-orig');
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 400, 540, 1250, 960, 0, 0, 400, 304);
        };
      </script>
    </body>
    </html>
  `;

  fs.writeFileSync('public/test-clean-compare.html', html);
  await page.goto('http://localhost:5173/test-clean-compare.html');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'public/clean_vector_comparison.png' });
  console.log('Saved public/clean_vector_comparison.png');

  await browser.close();
}

extractCleanMonogram().catch(console.error);
