import { chromium } from 'playwright';
import fs from 'fs';

async function marchingSquaresVectorize() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.goto('http://localhost:5173/test-inspect-hires.html');

  const svgPaths = await page.evaluate(async () => {
    const img = document.querySelector('img');
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
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

    const minX = 400, maxX = 1650, minY = 540, maxY = 1500;
    const cropW = maxX - minX, cropH = maxY - minY;
    const dotX = 1337.5, dotY = 1097.8, dotRadius = 45;

    // Downsample grid by factor of 4 for clean, high-precision contouring without pixel noise
    // 2048 / 4 = 512 width grid
    const S = 4;
    const gW = Math.ceil(W / S);
    const gH = Math.ceil(H / S);

    const gA = new Uint8Array(gW * gH);
    const gCLime = new Uint8Array(gW * gH);
    const gCIvory = new Uint8Array(gW * gH);

    for (let gy = 0; gy < gH; gy++) {
      for (let gx = 0; gx < gW; gx++) {
        const x = gx * S, y = gy * S;
        if (x < minX || x > maxX || y < minY || y > maxY) continue;
        if (x > 1460 && y < 780) continue; // artifact

        const lum = getLum(x, y);
        if (lum > 75) {
          const dDot = Math.hypot(x - dotX, y - dotY);
          if (dDot <= dotRadius + 8) continue;

          const gidx = gy * gW + gx;
          if (isLime(x, y)) {
            gCLime[gidx] = 1;
          } else if (x >= 1140 && y >= 1100) {
            gCIvory[gidx] = 1;
          } else {
            gA[gidx] = 1;
          }
        }
      }
    }

    // Marching Squares on downsampled grid
    function traceMarching(grid, minArea = 50) {
      const edges = new Map(); // key: "x,y", val: [nextX, nextY]

      for (let y = 0; y < gH - 1; y++) {
        for (let x = 0; x < gW - 1; x++) {
          const tl = grid[y * gW + x];
          const tr = grid[y * gW + (x + 1)];
          const bl = grid[(y + 1) * gW + x];
          const br = grid[(y + 1) * gW + (x + 1)];
          const cell = (tl << 3) | (tr << 2) | (br << 1) | bl;

          if (cell === 0 || cell === 15) continue;

          // Midpoints:
          // Top: (x + 0.5, y)
          // Right: (x + 1, y + 0.5)
          // Bottom: (x + 0.5, y + 1)
          // Left: (x, y + 0.5)
          const T = `${x + 0.5},${y}`;
          const R = `${x + 1},${y + 0.5}`;
          const B = `${x + 0.5},${y + 1}`;
          const L = `${x},${y + 0.5}`;

          const addSeg = (p1, p2) => edges.set(p1, p2);

          switch (cell) {
            case 1: addSeg(L, B); break;
            case 2: addSeg(B, R); break;
            case 3: addSeg(L, R); break;
            case 4: addSeg(R, T); break;
            case 5: addSeg(L, T); addSeg(B, R); break;
            case 6: addSeg(B, T); break;
            case 7: addSeg(L, T); break;
            case 8: addSeg(T, L); break;
            case 9: addSeg(T, B); break;
            case 10: addSeg(T, R); addSeg(B, L); break;
            case 11: addSeg(T, R); break;
            case 12: addSeg(R, L); break;
            case 13: addSeg(R, B); break;
            case 14: addSeg(B, L); break;
          }
        }
      }

      // Link edges into polygons
      const loops = [];
      const visited = new Set();

      for (const [start] of edges) {
        if (visited.has(start)) continue;

        const loop = [];
        let curr = start;
        while (curr && !visited.has(curr)) {
          visited.add(curr);
          const [px, py] = curr.split(',').map(Number);
          loop.push({ x: px * S, y: py * S });
          curr = edges.get(curr);
        }

        if (loop.length >= 8) {
          // Compute area
          let area = 0;
          for (let i = 0; i < loop.length; i++) {
            const p1 = loop[i], p2 = loop[(i + 1) % loop.length];
            area += (p1.x * p2.y - p2.x * p1.y);
          }
          area = Math.abs(area) / 2;
          if (area >= minArea) {
            loops.push(loop);
          }
        }
      }
      return loops;
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

    const loopsA = traceMarching(gA, 1000);
    const loopsCLime = traceMarching(gCLime, 1000);
    const loopsCIvory = traceMarching(gCIvory, 1000);

    const sX = 100 / cropW;
    const sY = 76 / cropH;

    const pathA = loopsA.map(l => toSmoothSvgPath(rdp(l, 5), sX, sY, minX, minY)).join(' ');
    const pathCLime = loopsCLime.map(l => toSmoothSvgPath(rdp(l, 5), sX, sY, minX, minY)).join(' ');
    const pathCIvory = loopsCIvory.map(l => toSmoothSvgPath(rdp(l, 5), sX, sY, minX, minY)).join(' ');

    const dotCx = Number(((dotX - minX) * sX).toFixed(2));
    const dotCy = Number(((dotY - minY) * sY).toFixed(2));
    const dotR = Number((dotRadius * sX).toFixed(2));

    return {
      loopsACount: loopsA.length,
      loopsCLimeCount: loopsCLime.length,
      loopsCIvoryCount: loopsCIvory.length,
      pathALength: pathA.length,
      pathCLimeLength: pathCLime.length,
      pathCIvoryLength: pathCIvory.length,
      pathA,
      pathCLime,
      pathCIvory,
      dot: { cx: dotCx, cy: dotCy, r: dotR }
    };
  });

  console.log('Marching squares result:', {
    loopsACount: svgPaths.loopsACount,
    loopsCLimeCount: svgPaths.loopsCLimeCount,
    loopsCIvoryCount: svgPaths.loopsCIvoryCount,
    pathALength: svgPaths.pathALength,
    pathCLimeLength: svgPaths.pathCLimeLength,
    pathCIvoryLength: svgPaths.pathCIvoryLength,
    dot: svgPaths.dot
  });

  fs.writeFileSync('scripts/marching_ac_paths.json', JSON.stringify(svgPaths, null, 2));

  // Render direct visual comparison
  const svgHtml = `
    <svg width="400" height="304" viewBox="0 0 100 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#f4f2ed" fill-rule="evenodd" d="${svgPaths.pathA}" />
      <path fill="#c8f14f" fill-rule="evenodd" d="${svgPaths.pathCLime}" />
      <path fill="#f4f2ed" fill-rule="evenodd" d="${svgPaths.pathCIvory}" />
      <circle cx="${svgPaths.dot.cx}" cy="${svgPaths.dot.cy}" r="${svgPaths.dot.r}" fill="#c8f14f" />
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
        <h3>Marching Squares Vector Monogram</h3>
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

  fs.writeFileSync('public/test-marching-compare.html', html);
  await page.goto('http://localhost:5173/test-marching-compare.html');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'public/marching_vector_comparison.png' });
  console.log('Saved public/marching_vector_comparison.png');

  // Measure IoU on 400x304
  const iou = await page.evaluate(async () => {
    const cOrig = document.getElementById('c-orig');
    if (!cOrig) return { error: 'canvas not found' };
    const ctxOrig = cOrig.getContext('2d');
    const d1 = ctxOrig.getImageData(0, 0, 400, 304).data;

    const svg = document.querySelector('svg');
    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const svgImg = new Image();
    await new Promise(res => { svgImg.onload = res; svgImg.src = url; });

    const cSvg = document.createElement('canvas');
    cSvg.width = 400; cSvg.height = 304;
    const ctxSvg = cSvg.getContext('2d');
    ctxSvg.drawImage(svgImg, 0, 0, 400, 304);
    const d2 = ctxSvg.getImageData(0, 0, 400, 304).data;

    let overlap = 0, total = 0, origCount = 0;
    for (let i = 0; i < 400 * 304; i++) {
      const idx = i * 4;
      const fg1 = (0.299 * d1[idx] + 0.587 * d1[idx + 1] + 0.114 * d1[idx + 2]) > 60;
      const fg2 = (0.299 * d2[idx] + 0.587 * d2[idx + 1] + 0.114 * d2[idx + 2]) > 60;

      if (fg1) origCount++;
      if (fg1 && fg2) overlap++;
      if (fg1 || fg2) total++;
    }

    return {
      overlap,
      total,
      origCount,
      coverage: (overlap / origCount * 100).toFixed(1) + '%',
      iou: (overlap / total * 100).toFixed(1) + '%'
    };
  });

  console.log('Marching Squares IoU:', iou);
  await browser.close();
}

marchingSquaresVectorize().catch(console.error);
