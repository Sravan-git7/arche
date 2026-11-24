import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # 1. PreFooter CTA
    print("1. Testing PreFooterCTA resting & left-glide matching awmedia...")
    page.goto("http://localhost:5173", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)

    pre_footer = page.locator("#pre-footer-cta")
    pre_footer.scroll_into_view_if_needed()
    page.wait_for_timeout(600)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "awmedia_match_01_prefooter_center.png"))

    box = pre_footer.bounding_box()
    if box:
        target_x = box["x"] + box["width"] * 0.16
        target_y = box["y"] + box["height"] * 0.45
        page.mouse.move(target_x, target_y)
        page.wait_for_timeout(900)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "awmedia_match_02_prefooter_left.png"))
        print("Captured awmedia_match_02_prefooter_left.png")

    # 2. Test /#/services/video-editing
    print("2. Testing /#/services/video-editing...")
    page.goto("http://localhost:5173/#/services/video-editing", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)

    page.evaluate("window.scrollTo({ top: 900, behavior: 'instant' })")
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "awmedia_match_03_service_bottleneck.png"))
    print("Captured awmedia_match_03_service_bottleneck.png")

    page.evaluate("window.scrollTo({ top: 2200, behavior: 'instant' })")
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "awmedia_match_04_service_builds.png"))
    print("Captured awmedia_match_04_service_builds.png")

    # 3. Test /#/pricing
    print("3. Testing /#/pricing...")
    page.goto("http://localhost:5173/#/pricing", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)

    page.evaluate("window.scrollTo({ top: 2500, behavior: 'instant' })")
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "awmedia_match_05_pricing_commercial.png"))
    print("Captured awmedia_match_05_pricing_commercial.png")

    # 4. Test /#/work
    print("4. Testing /#/work...")
    page.goto("http://localhost:5173/#/work", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "awmedia_match_06_work_hub.png"))
    print("Captured awmedia_match_06_work_hub.png")

    # 5. Test /#/faq
    print("5. Testing /#/faq...")
    page.goto("http://localhost:5173/#/faq", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "awmedia_match_07_faq_hub.png"))
    print("Captured awmedia_match_07_faq_hub.png")

    browser.close()
    print("All verification screenshots successfully captured!")
