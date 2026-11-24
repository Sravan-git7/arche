import os
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. PRICING TIER CARDS
        page.goto("http://localhost:5173/#/pricing", wait_until="networkidle")
        page.wait_for_timeout(2000)
        pkg_card = page.locator(".frosted-ivory-card").first
        if pkg_card.count() > 0:
            pkg_card.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "pricing_03_desktop_tier_cards.png"))

        # 2. SERVICES 2x2 BENTO TILES
        page.goto("http://localhost:5173/#/services", wait_until="networkidle")
        page.wait_for_timeout(2000)
        bento_tile = page.locator("h3:has-text('Video Production')").first
        if bento_tile.count() > 0:
            bento_tile.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "services_02_desktop_bento_tiles.png"))

        # 3. HOME HOW WE WORK
        page.goto("http://localhost:5173/#/", wait_until="networkidle")
        page.wait_for_timeout(2500)
        hww = page.locator("text=HOW WE WORK").first
        if hww.count() > 0:
            hww.scroll_into_view_if_needed()
            page.wait_for_timeout(800)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "home_01_desktop_how_we_work.png"))

        # 4. HOME WORK SHOWCASE
        work_el = page.locator("text=SHOWCASE · 01").first
        if work_el.count() > 0:
            work_el.scroll_into_view_if_needed()
            page.wait_for_timeout(800)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "home_02_desktop_work_carousel.png"))

        browser.close()
        print("Captured targeted cards successfully.")

if __name__ == "__main__":
    run()
