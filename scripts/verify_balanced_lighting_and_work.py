import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # 1. Hero Stage with balanced left-key / right-fill dark cypress studio lighting
        print("Navigating to http://localhost:5173/ ...")
        await page.goto("http://localhost:5173/", wait_until="domcontentloaded")
        await page.wait_for_timeout(4500)
        hero_path = os.path.join(ARTIFACT_DIR, "balanced_01_hero_stage.png")
        await page.screenshot(path=hero_path)
        print(f"Captured: {hero_path}")

        # 2. Work page top
        print("Navigating to http://localhost:5173/#/work ...")
        await page.goto("http://localhost:5173/#/work", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        work_top_path = os.path.join(ARTIFACT_DIR, "balanced_02_work_page_top.png")
        await page.screenshot(path=work_top_path)
        print(f"Captured: {work_top_path}")

        # 3. Work page Project 01 focused view
        await page.evaluate("window.scrollTo(0, 360)")
        await page.wait_for_timeout(1000)
        work_detail_path = os.path.join(ARTIFACT_DIR, "balanced_03_work_page_detail.png")
        await page.screenshot(path=work_detail_path)
        print(f"Captured: {work_detail_path}")

        # 4. Click Expand Case View on Project 01
        expand_btn = page.locator("button:has-text('Expand Case View')").first
        await expand_btn.click()
        await page.wait_for_timeout(800)
        work_expanded_path = os.path.join(ARTIFACT_DIR, "balanced_04_work_page_expanded.png")
        await page.screenshot(path=work_expanded_path)
        print(f"Captured: {work_expanded_path}")

        # 5. Scroll back up and click a filter pill
        await page.evaluate("window.scrollTo(0, 200)")
        await page.wait_for_timeout(600)
        web_filter = page.locator("button:has-text('Web Development')").first
        await web_filter.click()
        await page.wait_for_timeout(800)
        work_filter_path = os.path.join(ARTIFACT_DIR, "balanced_05_work_page_filter_click.png")
        await page.screenshot(path=work_filter_path)
        print(f"Captured: {work_filter_path}")

        await browser.close()
        print("All verification screenshots captured successfully.")

if __name__ == "__main__":
    asyncio.run(main())
