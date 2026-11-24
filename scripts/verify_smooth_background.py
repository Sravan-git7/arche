import os
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

def run():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. HERO (Home)
        page.goto("http://localhost:5173/#/", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        shot1 = os.path.join(ARTIFACTS_DIR, "smooth_bg_01_desktop_hero.png")
        page.screenshot(path=shot1)
        print("Captured Hero:", shot1)

        # 2. FAQ PAGE
        page.goto("http://localhost:5173/#/faq", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        shot2 = os.path.join(ARTIFACTS_DIR, "smooth_bg_02_desktop_faq.png")
        page.screenshot(path=shot2)
        print("Captured FAQ:", shot2)

        # 3. PRICING PAGE
        page.goto("http://localhost:5173/#/pricing", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        shot3 = os.path.join(ARTIFACTS_DIR, "smooth_bg_03_desktop_pricing.png")
        page.screenshot(path=shot3)
        print("Captured Pricing:", shot3)

        # 4. SERVICES PAGE
        page.goto("http://localhost:5173/#/services", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        shot4 = os.path.join(ARTIFACTS_DIR, "smooth_bg_04_desktop_services.png")
        page.screenshot(path=shot4)
        print("Captured Services:", shot4)

        browser.close()
        print("All smooth background screenshots captured successfully.")

if __name__ == "__main__":
    run()
