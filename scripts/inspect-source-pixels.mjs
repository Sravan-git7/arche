import { chromium } from "playwright";
import path from "path";

async function inspectImage() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  
  // Navigate to local vite server or load file directly
  await page.goto("http://localhost:5173/");
  
  const imgInfo = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/arche%20logo.jpeg";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        // Sample background corners and edges
        const pTL = ctx.getImageData(10, 10, 1, 1).data;
        const pTR = ctx.getImageData(img.width - 10, 10, 1, 1).data;
        const pBL = ctx.getImageData(10, img.height - 10, 1, 1).data;
        const pBR = ctx.getImageData(img.width - 10, img.height - 10, 1, 1).data;
        const pCenter = ctx.getImageData(Math.round(img.width / 2), Math.round(img.height / 2), 1, 1).data;

        // Find bounding box of non-black pixels (threshold > 25)
        const idata = ctx.getImageData(0, 0, img.width, img.height);
        const data = idata.data;
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            // Exclude dark background (luminance or max channel > 35)
            if (r > 35 || g > 35 || b > 35) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        resolve({
          width: img.width,
          height: img.height,
          corners: {
            tl: Array.from(pTL),
            tr: Array.from(pTR),
            bl: Array.from(pBL),
            br: Array.from(pBR),
            center: Array.from(pCenter)
          },
          bbox: { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 }
        });
      };
      img.onerror = (e) => resolve({ error: "Failed to load /arche logo.jpeg" });
    });
  });
  
  console.log("Image Info:", JSON.stringify(imgInfo, null, 2));
  await browser.close();
}

inspectImage().catch(console.error);
