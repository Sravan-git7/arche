import { chromium } from "playwright";
import { readFileSync } from "fs";

async function run() {
  const b1 = readFileSync("public/arche-logo-transparent.png").toString("base64");

  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 900, height: 400 } });
  await page.setContent(`
    <html>
    <body style="background:#F4F4EE; display:flex; flex-direction:column; gap:30px; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif;">
      
      <!-- Nav simulated pill on #F4F4EE -->
      <div style="background:rgba(244,244,238,0.8); backdrop-filter:blur(16px); border:1px solid rgba(20,20,19,0.1); border-radius:999px; padding:10px 24px; display:flex; align-items:center; gap:10px; box-shadow:0 12px 36px rgba(20,20,19,0.08);">
        <span style="font-size:12px; color:#5C5F59; margin-right:8px;">Original unaltered:</span>
        <img src="data:image/png;base64,${b1}" style="height:24px; width:auto;" />
        <span style="font-size:18px; font-weight:600; color:#141413; letter-spacing:-0.04em;">Arche</span>
        <span style="width:6px; height:6px; border-radius:50%; background:#9EE41A; box-shadow:0 0 6px #9EE41A;"></span>
      </div>

      <!-- Option 2: Crisp on light (subtle tone tuning or natural) -->
      <div style="background:rgba(255,255,255,0.9); border:1px solid rgba(20,20,19,0.1); border-radius:999px; padding:10px 24px; display:flex; align-items:center; gap:10px;">
        <span style="font-size:12px; color:#5C5F59; margin-right:8px;">Slight contrast:</span>
        <img src="data:image/png;base64,${b1}" style="height:24px; width:auto; filter: contrast(1.15) brightness(0.95);" />
        <span style="font-size:18px; font-weight:600; color:#141413; letter-spacing:-0.04em;">Arche</span>
        <span style="width:6px; height:6px; border-radius:50%; background:#9EE41A;"></span>
      </div>

    </body>
    </html>
  `);
  await page.screenshot({ path: "scripts/audit_artifacts/nav_logo_test.png" });
  console.log("Saved scripts/audit_artifacts/nav_logo_test.png");
  await browser.close();
}

run();
