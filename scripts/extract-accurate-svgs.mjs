import { chromium } from 'playwright';
import fs from 'fs';

async function extractAccurateSvgs() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.goto('http://localhost:5173/test-inspect-hires.html');

  const paths = await page.evaluate(async () => {
    const img = document.querySelector('img');
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
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

    const minX = 400, maxX = 1650, minY = 540, maxY = 1500;
    const cropW = maxX - minX, cropH = maxY - minY;
    const dotX = 1337.5, dotY = 1097.8, dotRadius = 45;

    // Use downsample S = 2 for high fidelity (1024x1024 grid)
    const S = 2;
    const gW = Math.ceil(W / S);
    const gH = Math.ceil(H / S);

    const maskA = new Uint8Array(gW * gH);
    const maskCLime = new Uint8Array(gW * gH);
    const maskCIvory = new Uint8Array(gW * gH);

    for (let gy = 0; gy < gH; gy++) {
      for (let gx = 0; gx < gW; gx++) {
        const x = gx * S, y = gy * S;
        if (x < minX || x > maxX || y < minY || y > maxY) continue;
        if (x > 1460 && y < 780) continue; // artifact

        const p = getRGB(x, y);
        if (p.lum > 75) {
          const dDot = Math.hypot(x - dotX, y - dotY);
          if (dDot <= dotRadius + 8) continue;

          const gidx = gy * gW + gx;
          const isLime = p.g > 115 && p.g > p.r * 1.15 && p.g > p.b * 1.5;

          if (isLime) {
            maskCLime[gidx] = 1;
          } else if (x >= 1100 && y >= 1050) {
            maskCIvory[gidx] = 1;
          } else {
            maskA[gidx] = 1;
          }
        }
      }
    }

    // Marching squares polygon extractor
    function extractPolygons(grid, minArea = 100) {
      const edges = new Map();
      for (let y = 0; y < gH - 1; y++) {
        for (let x = 0; x < gW - 1; x++) {
          const tl = grid[y * gW + x];
          const tr = grid[y * gW + (x + 1)];
          const bl = grid[(y + 1) * gW + x];
          const br = grid[(y + 1) * gW + (x + 1)];
          const cell = (tl << 3) | (tr << 2) | (br << 1) | bl;

          if (cell === 0 || cell === 15) continue;

          const T = `${x + 0.5},${y}`;
          const R = `${x + 1},${y + 0.5}`;
          const B = `${x + 0.5},${y + 1}`;
          const L = `${x},${y + 0.5}`;
          const add = (p1, p2) => edges.set(p1, p2);

          switch (cell) {
            case 1: add(L, B); break;
            case 2: add(B, R); break;
            case 3: add(L, R); break;
            case 4: add(R, T); break;
            case 5: add(L, T); add(B, R); break;
            case 6: add(B, T); break;
            case 7: add(L, T); break;
            case 8: add(T, L); break;
            case 9: add(T, B); break;
            case 10: add(T, R); add(B, L); break;
            case 11: add(T, R); break;
            case 12: add(R, L); break;
            case 13: add(R, B); break;
            case 14: add(B, L); break;
          }
        }
      }

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

        if (loop.length >= 10) {
          let area = 0;
          for (let i = 0; i < loop.length; i++) {
            const p1 = loop[i], p2 = loop[(i + 1) % loop.length];
            area += (p1.x * p2.y - p2.x * p1.y);
          }
          area = Math.abs(area) / 2;
          if (area >= minArea) loops.push(loop);
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

    const sX = 100 / cropW;
    const sY = 76 / cropH;

    // Extract loops for each component (filter small noise < 1500 area)
    const loopsA = extractPolygons(maskA, 1500);
    const loopsCLime = extractPolygons(maskCLime, 1500);
    const loopsCIvory = extractPolygons(maskCIvory, 1500);

    const pathA = loopsA.map(l => toSmoothSvgPath(rdp(l, 4.0), sX, sY, minX, minY)).join(' ');
    const pathCLime = loopsCLime.map(l => toSmoothSvgPath(rdp(l, 4.0), sX, sY, minX, minY)).join(' ');
    const pathCIvory = loopsCIvory.map(l => toSmoothSvgPath(rdp(l, 4.0), sX, sY, minX, minY)).join(' ');

    const dotCx = Number(((dotX - minX) * sX).toFixed(2));
    const dotCy = Number(((dotY - minY) * sY).toFixed(2));
    const dotR = Number((dotRadius * sX).toFixed(2));

    return {
      loopsACount: loopsA.length,
      loopsCLimeCount: loopsCLime.length,
      loopsCIvoryCount: loopsCIvory.length,
      pathA,
      pathCLime,
      pathCIvory,
      dot: { cx: dotCx, cy: dotCy, r: dotR }
    };
  });

  console.log('Polygons extracted:', {
    loopsA: paths.loopsACount,
    loopsCLime: paths.loopsCLimeCount,
    loopsCIvory: paths.loopsCIvoryCount,
    pathALength: paths.pathA.length,
    pathCLimeLength: paths.pathCLimeLength,
    pathCIvoryLength: paths.pathCIvoryLength,
    dot: paths.dot
  });

  fs.writeFileSync('scripts/accurate_production_paths.json', JSON.stringify(paths, null, 2));

  // Render high-res visual comparison
  const svgHtml = `
    <svg width="400" height="304" viewBox="0 0 100 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#f4f2ed" fill-rule="evenodd" d="${paths.pathA}" />
      <path fill="#c8f14f" fill-rule="evenodd" d="${paths.pathCLime}" />
      <path fill="#f4f2ed" fill-rule="evenodd" d="${paths.pathCIvory}" />
      <circle cx="${paths.dot.cx}" cy="${paths.dot.cy}" r="${paths.dot.r}" fill="#c8f14f" />
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
        <h3>Production Studio Vector</h3>
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

  fs.writeFileSync('public/test-accurate-compare.html', html);
  await page.goto('http://localhost:5173/test-accurate-compare.html');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'public/accurate_vector_comparison.png' });
  console.log('Saved public/accurate_vector_comparison.png');

  // Compute exact IoU
  const iou = await page.evaluate(async () => {
    const cOrig = document.getElementById('c-orig');
    const d1 = cOrig.getContext('2d').getImageData(0, 0, 400, 304).data;

    const svg = document.querySelector('svg');
    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    await new Promise(res => { img.onload = res; img.src = url; });

    const cSvg = document.createElement('canvas');
    cSvg.width = 400; cSvg.height = 304;
    const ctxSvg = cSvg.getContext('2d');
    ctxSvg.drawImage(img, 0, 0, 400, 304);
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

  console.log('Accurate Studio Vector IoU:', iou);
  await browser.close();
}

extractAccurateSvgs().catch(console.error);
