import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function generate() {
  const tabLogoPath = resolve("public/tab logo.jpeg");
  const tabLogoBase64 = readFileSync(tabLogoPath).toString("base64");
  const dataUrl = `data:image/jpeg;base64,${tabLogoBase64}`;

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  const script = `
    async function processIcons(imgSrc) {
      const img = new Image();
      img.src = imgSrc;
      await new Promise(r => img.onload = r);

      function renderToCanvas(size, cornerRadius) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw rounded rectangle clip
        const r = cornerRadius;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(size - r, 0);
        ctx.quadraticCurveTo(size, 0, size, r);
        ctx.lineTo(size, size - r);
        ctx.quadraticCurveTo(size, size, size - r, size);
        ctx.lineTo(r, size);
        ctx.quadraticCurveTo(0, size, 0, size - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();

        // Fill background
        ctx.fillStyle = '#141413';
        ctx.fillRect(0, 0, size, size);

        // Draw source image centered
        ctx.drawImage(img, 0, 0, size, size);
        return canvas.toDataURL('image/png');
      }

      return {
        png16: renderToCanvas(16, 3),
        png32: renderToCanvas(32, 6),
        png48: renderToCanvas(48, 9),
        png180: renderToCanvas(180, 36),
      };
    }
  `;

  await page.setContent(`<html><body><script>${script}</script></body></html>`);
  const icons = await page.evaluate(async (dataUrl) => {
    // @ts-ignore
    return await processIcons(dataUrl);
  }, dataUrl);

  const png32Buffer = Buffer.from(icons.png32.split(",")[1], "base64");
  const png16Buffer = Buffer.from(icons.png16.split(",")[1], "base64");
  const png180Buffer = Buffer.from(icons.png180.split(",")[1], "base64");

  writeFileSync("public/favicon-32x32.png", png32Buffer);
  writeFileSync("public/favicon-16x16.png", png16Buffer);
  writeFileSync("public/apple-touch-icon.png", png180Buffer);
  writeFileSync("public/favicon.ico", png32Buffer);

  // Also create self-contained favicon.svg with embedded high-res image
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <clipPath id="tabBadge">
      <rect width="32" height="32" rx="6" fill="#141413" />
    </clipPath>
  </defs>
  <rect width="32" height="32" rx="6" fill="#141413" />
  <image href="${icons.png180}" width="32" height="32" clip-path="url(#tabBadge)" />
</svg>`;

  writeFileSync("public/favicon.svg", svgContent);

  console.log("Favicons generated successfully:");
  console.log("  - public/favicon-32x32.png");
  console.log("  - public/favicon-16x16.png");
  console.log("  - public/apple-touch-icon.png");
  console.log("  - public/favicon.ico");
  console.log("  - public/favicon.svg");

  await browser.close();
}

generate().catch(err => {
  console.error("Error generating favicons:", err);
  process.exit(1);
});
