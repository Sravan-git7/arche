import os
from playwright.sync_api import sync_playwright

def run():
    artifacts_dir = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Home - Manifesto
        page.goto("http://localhost:5173/", wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
        page.locator("#tension").scroll_into_view_if_needed()
        page.wait_for_timeout(1200)
        shot1 = os.path.join(artifacts_dir, "audit_10_manifesto_exact.png")
        page.screenshot(path=shot1)
        print("Captured Manifesto exact:", shot1)

        # 2. FAQ page - bottom guarantees and email button
        page.goto("http://localhost:5173/#/faq", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1200)
        shot2 = os.path.join(artifacts_dir, "audit_11_faq_bottom_guarantees_and_email.png")
        page.screenshot(path=shot2)
        print("Captured FAQ bottom:", shot2)

        # 3. Service page - packages bottom note & button
        page.goto("http://localhost:5173/#/services/video-editing", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        page.locator("#packages").scroll_into_view_if_needed()
        page.evaluate("window.scrollBy(0, 700)")
        page.wait_for_timeout(1200)
        shot3 = os.path.join(artifacts_dir, "audit_12_service_pricing_note_btn.png")
        page.screenshot(path=shot3)
        print("Captured Service pricing note button:", shot3)

        browser.close()
        print("All targeted captures completed.")

if __name__ == "__main__":
    run()
