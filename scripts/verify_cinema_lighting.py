import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # 1. Hero and Smoked Liquid Navbar (wait for intro completion)
        print("Navigating to http://localhost:5173/ ...")
        await page.goto("http://localhost:5173/", wait_until="domcontentloaded")
        # Wait 4.5s for intro animation to complete and navbar to reveal
        await page.wait_for_timeout(4500)

        hero_path = os.path.join(ARTIFACT_DIR, "cinema_01_hero_and_smoked_navbar.png")
        await page.screenshot(path=hero_path)
        print(f"Captured: {hero_path}")

        # 2. Services mega-dropdown open
        services_btn = page.locator("button:has-text('Services')").first
        await services_btn.hover()
        await page.wait_for_timeout(600)
        services_path = os.path.join(ARTIFACT_DIR, "cinema_02_services_dropdown_open.png")
        await page.screenshot(path=services_path)
        print(f"Captured: {services_path}")

        # 3. Work mega-dropdown open
        work_btn = page.locator("button:has-text('Work')").first
        await work_btn.hover()
        await page.wait_for_timeout(600)
        work_path = os.path.join(ARTIFACT_DIR, "cinema_03_work_dropdown_open.png")
        await page.screenshot(path=work_path)
        print(f"Captured: {work_path}")

        # Move mouse away to close dropdown
        await page.mouse.move(100, 500)
        await page.wait_for_timeout(500)

        # 4. Scroll to Difference / Manifesto to check whisper fluted background
        await page.evaluate("window.scrollTo(0, 1100)")
        await page.wait_for_timeout(1000)
        bg_path = os.path.join(ARTIFACT_DIR, "cinema_04_whisper_fluted_background.png")
        await page.screenshot(path=bg_path)
        print(f"Captured: {bg_path}")

        # 5. Pricing page navbar and contrast
        print("Navigating to http://localhost:5173/#/pricing ...")
        await page.goto("http://localhost:5173/#/pricing", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        pricing_path = os.path.join(ARTIFACT_DIR, "cinema_05_pricing_page.png")
        await page.screenshot(path=pricing_path)
        print(f"Captured: {pricing_path}")

        await browser.close()
        print("All verification screenshots captured successfully.")

if __name__ == "__main__":
    asyncio.run(main())
