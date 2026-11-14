import { chromium } from 'playwright';
import fs from 'fs';

async function perfectVectorization() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.goto('http://localhost:5173/test-inspect-hires.html');

  const result = await page.evaluate(async () => {
    const img = document.querySelector('img');
    await img.decode();
    const W = img.naturalWidth;
    const H = img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;

    // Helper functions
    function getLum(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return 0;
      const idx = (y * W + x) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    function isLime(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return false;
      const idx = (y * W + x) * 4;
      return data[idx + 1] > 110 && data[idx + 1] > data[idx] * 1.15 && data[idx + 1] > data[idx + 2] * 1.5;
    }

    // Exact bounding box of logo in 2048x2048 space
    // minX = 400, maxX = 1650, minY = 540, maxY = 1500
    // Width = 1250, Height = 960 (ratio = 1.302:1)
    const minX = 400, maxX = 1650, minY = 540, maxY = 1500;
    const cropW = maxX - minX, cropH = maxY - minY;

    // Separate into 4 distinct clean masks
    const maskA = new Uint8Array(W * H);
    const maskCLime = new Uint8Array(W * H);
    const maskCIvory = new Uint8Array(W * H);
    const maskDot = new Uint8Array(W * H);

    // Exact center of the dot in 2048 space
    const dotX = 1338, dotY = 1098, dotRadius = 55;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Exclude the top-right triangle artifact: x > 1460, y < 780
        if (x > 1450 && y < 780) continue;

        const lum = getLum(x, y);
        if (lum > 72) {
          const idx = y * W + x;

          // Check if dot
          const distDot = Math.hypot(x - dotX, y - dotY);
          if (distDot <= dotRadius + 4 && isLime(x, y)) {
            maskDot[idx] = 1;
            continue;
          }

          // Check if C Lime upper arc
          // The C lime arc starts from crossbar intersection at x ~ 1080, y ~ 850
          // Arches over the top (y: 680..1050, x: 1080..1650)
          if (isLime(x, y)) {
            maskCLime[idx] = 1;
            continue;
          }

          // Now ivory pixels: either A or lower arc of C
          // Lower arc of C is in x: 1100..1650, y: 1100..1500
          // Let's distinguish between A's bottom sweep and C's bottom loop:
          // A is on the left (x < 1080) OR the leg leading to crossbar
          // C lower arc is on the right (x >= 1080, y >= 1080)
          if (x >= 1150 && y >= 1100) {
            maskCIvory[idx] = 1;
          } else {
            maskA[idx] = 1;
          }
        }
      }
    }

    // Marching squares contour extraction
    function traceContour(mask, startX, startY) {
      const contour = [];
      let cx = startX, cy = startY;
      let dir = 0; // 0: E, 1: SE, 2: S, 3: SW, 4: W, 5: NW, 6: N, 7: NE
      const dirs = [
        [1, 0], [1, 1], [0, 1], [-1, 1],
        [-1, 0], [-1, -1], [0, -1], [1, -1]
      ];

      let loop = 0;
      while (loop < 25000) {
        loop++;
        contour.push({ x: cx, y: cy });

        let found = false;
        for (let i = 0; i < 8; i++) {
          const checkDir = (dir + 6 + i) % 8;
          const nx = cx + dirs[checkDir][0];
          const ny = cy + dirs[checkDir][1];
          if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY && mask[ny * W + nx] === 1) {
            cx = nx;
            cy = ny;
            dir = checkDir;
            found = true;
            break;
          }
        }
        if (!found || (cx === startX && cy === startY && loop > 2)) break;
      }
      return contour;
    }

    // Find all external and internal contours
    function getAllContours(mask, minPoints = 40) {
      const visited = new Uint8Array(W * H);
      const contours = [];

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = y * W + x;
          if (mask[idx] === 1 && !visited[idx]) {
            const isBorder = mask[idx - 1] === 0 || mask[idx + 1] === 0 || mask[idx - W] === 0 || mask[idx + W] === 0;
            if (isBorder) {
              const c = traceContour(mask, x, y);
              for (const p of c) visited[p.y * W + p.x] = 1;

              if (c.length >= minPoints) {
                // Calculate signed area
                let area = 0;
                for (let i = 0; i < c.length; i++) {
                  const p1 = c[i], p2 = c[(i + 1) % c.length];
                  area += (p1.x * p2.y - p2.x * p1.y);
                }
                area = Math.abs(area) / 2;
                if (area > 300) {
                  contours.push(c);
                }
              }
            }
          }
        }
      }
      return contours;
    }

    // Iterative RDP to avoid stack overflow on long loops
    function rdp(pts, epsilon) {
      if (pts.length <= 2) return pts;
      const keep = new Uint8Array(pts.length);
      keep[0] = 1;
      keep[pts.length - 1] = 1;

      const stack = [[0, pts.length - 1]];
      while (stack.length > 0) {
        const [start, end] = stack.pop();
        let dmax = 0, index = start;
        for (let i = start + 1; i < end; i++) {
          const d = distToSegment(pts[i], pts[start], pts[end]);
          if (d > dmax) {
            dmax = d;
            index = i;
          }
        }
        if (dmax > epsilon) {
          keep[index] = 1;
          if (index - start > 1) stack.push([start, index]);
          if (end - index > 1) stack.push([index, end]);
        }
      }

      const res = [];
      for (let i = 0; i < pts.length; i++) {
        if (keep[i]) res.push(pts[i]);
      }
      return res;
    }

    function distToSegment(p, a, b) {
      const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
      let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
    }

    // Bézier curve smoothing
    function toSmoothBezierPath(pts, scaleX, scaleY, offX, offY) {
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

    const sX = 100 / cropW;
    const sY = 76 / cropH;

    const aContours = getAllContours(maskA);
    const cLimeContours = getAllContours(maskCLime);
    const cIvoryContours = getAllContours(maskCIvory);

    const aPath = aContours.map(c => toSmoothBezierPath(rdp(c, 2.0), sX, sY, minX, minY)).join(' ');
    const cLimePath = cLimeContours.map(c => toSmoothBezierPath(rdp(c, 2.0), sX, sY, minX, minY)).join(' ');
    const cIvoryPath = cIvoryContours.map(c => toSmoothBezierPath(rdp(c, 2.0), sX, sY, minX, minY)).join(' ');

    const dotCx = Number(((dotX - minX) * sX).toFixed(2));
    const dotCy = Number(((dotY - minY) * sY).toFixed(2));
    const dotR = Number((dotRadius * sX).toFixed(2));

    return {
      aPath,
      cLimePath,
      cIvoryPath,
      dot: { cx: dotCx, cy: dotCy, r: dotR }
    };
  });

  fs.writeFileSync('scripts/accurate_ac_monogram.json', JSON.stringify(result, null, 2));
  console.log('Saved accurate_ac_monogram.json');
  console.log('Dot info:', result.dot);
  console.log('A path length:', result.aPath.length);
  console.log('C lime path length:', result.cLimePath.length);
  console.log('C ivory path length:', result.cIvoryPath.length);

  await browser.close();
}

perfectVectorization().catch(console.error);
