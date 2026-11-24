import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function measureParts() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const logoPngB64 = "data:image/png;base64," + fs.readFileSync("public/arche logo.png").toString("base64");

  const html = `<!DOCTYPE html><html><body><img id="png" src="${logoPngB64}" /></body></html>`;
  fs.writeFileSync("scripts/measure-parts.html", html);
  await page.goto(`file:///${path.resolve("scripts/measure-parts.html").replace(/\\/g, "/")}`);
  await page.waitForLoadState("networkidle");

  const results = await page.evaluate(() => {
    const img = document.getElementById("png");
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;

    const W = img.naturalWidth;
    const H = img.naturalHeight;

    // Classify pixels
    // Lime: g > 140 && g > r * 0.9 && b < 160 && (g - b) > 40
    // A: ivory pixels on the left
    // C: ivory pixels on the right
    // Let's find the exact neck / boundary between A and C:
    // Notice A and C meet where the crossbar of A touches or overlaps C.
    // Let's inspect columns between x = 220 and x = 270 (normalized to 500)
    const colStats = [];
    for (let x = 200; x <= 300; x++) {
      let ivory = 0;
      let lime = 0;
      for (let y = 135; y <= 364; y++) {
        const idx = (y * W + x) * 4;
        const a = data[idx + 3];
        if (a > 20) {
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          if (g > 140 && g > r * 0.9 && b < 160 && (g - b) > 40) {
            lime++;
          } else {
            ivory++;
          }
        }
      }
      colStats.push({ x, ivory, lime, total: ivory + lime });
    }

    // Lime bounding box
    let lx1 = W, ly1 = H, lx2 = 0, ly2 = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        if (data[idx + 3] > 20) {
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          if (g > 140 && g > r * 0.9 && b < 160 && (g - b) > 40) {
            if (x < lx1) lx1 = x;
            if (x > lx2) lx2 = x;
            if (y < ly1) ly1 = y;
            if (y > ly2) ly2 = y;
          }
        }
      }
    }

    return {
      colStats,
      lime: { lx1, ly1, lx2, ly2, w: lx2 - lx1 + 1, h: ly2 - ly1 + 1 }
    };
  });

  console.log("Lime BBox:", results.lime);
  // Find local minimum in colStats
  let minCol = results.colStats[0];
  for (const c of results.colStats) {
    if (c.total < minCol.total) {
      minCol = c;
    }
  }
  console.log("Local minimum between A and C in [200, 300]:", minCol);
  console.log("All cols around minimum:");
  console.log(results.colStats.filter(c => c.x >= 230 && c.x <= 270));

  await browser.close();
}

measureParts().catch(console.error);
