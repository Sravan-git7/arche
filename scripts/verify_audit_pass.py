import os
import sys
import time
from playwright.sync_api import sync_playwright

def run():
    artifacts_dir = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"
    os.makedirs(artifacts_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("Navigating to http://localhost:5173/...")
        page.goto("http://localhost:5173/", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # 1. Check Hero & Manifesto
        page.evaluate("window.scrollTo(0, 700)")
        page.wait_for_timeout(1000)
        shot1 = os.path.join(artifacts_dir, "audit_01_manifesto_boxed_buttons.png")
        page.screenshot(path=shot1)
        print("Captured Manifesto:", shot1)

        # 2. Check The Studio Difference (Count-up & 3D cards)
        diff_el = page.locator("#difference")
        if diff_el.count() > 0:
            diff_el.scroll_into_view_if_needed()
            page.wait_for_timeout(1500)
            shot2 = os.path.join(artifacts_dir, "audit_02_studio_difference_counts.png")
            page.screenshot(path=shot2)
            print("Captured Studio Difference:", shot2)

        # 3. Check Work Section (Image curtain & All work button)
        work_el = page.locator("#work")
        if work_el.count() > 0:
            work_el.scroll_into_view_if_needed()
            page.wait_for_timeout(1500)
            shot3 = os.path.join(artifacts_dir, "audit_03_work_carousel.png")
            page.screenshot(path=shot3)
            print("Captured Work Carousel:", shot3)

        # 4. Check FAQ Section & Pre-Footer CTA on Home
        faq_el = page.locator("#faq")
        if faq_el.count() > 0:
            faq_el.scroll_into_view_if_needed()
            page.wait_for_timeout(1500)
            shot4 = os.path.join(artifacts_dir, "audit_04_faq_home_boxed_link.png")
            page.screenshot(path=shot4)
            print("Captured FAQ Home:", shot4)

        # 5. Check Footer
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1500)
        shot5 = os.path.join(artifacts_dir, "audit_05_footer_contrast_and_start_btn.png")
        page.screenshot(path=shot5)
        print("Captured Footer:", shot5)

        # 6. Check /#/faq
        print("Navigating to http://localhost:5173/#/faq...")
        page.goto("http://localhost:5173/#/faq", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        shot6 = os.path.join(artifacts_dir, "audit_06_faq_page_top.png")
        page.screenshot(path=shot6)
        print("Captured FAQ Page top:", shot6)

        page.evaluate("window.scrollTo(0, 1100)")
        page.wait_for_timeout(1500)
        shot7 = os.path.join(artifacts_dir, "audit_07_faq_page_guarantees_and_email.png")
        page.screenshot(path=shot7)
        print("Captured FAQ Page guarantees:", shot7)

        # 7. Check /#/pricing
        print("Navigating to http://localhost:5173/#/pricing...")
        page.goto("http://localhost:5173/#/pricing", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        shot8 = os.path.join(artifacts_dir, "audit_08_pricing_page_pills_and_links.png")
        page.screenshot(path=shot8)
        print("Captured Pricing Page:", shot8)

        # 8. Check /#/services/video-editing
        print("Navigating to http://localhost:5173/#/services/video-editing...")
        page.goto("http://localhost:5173/#/services/video-editing", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.evaluate("window.scrollTo(0, 3200)")
        page.wait_for_timeout(1500)
        shot9 = os.path.join(artifacts_dir, "audit_09_service_pricing_breakdown_btn.png")
        page.screenshot(path=shot9)
        print("Captured Service Detail breakdown button:", shot9)

        browser.close()
        print("All verification screenshots taken successfully!")

if __name__ == "__main__":
    run()
