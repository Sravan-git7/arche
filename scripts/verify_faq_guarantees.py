import os
from playwright.sync_api import sync_playwright

def run():
    artifacts_dir = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.goto("http://localhost:5173/#/faq", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        
        # Find the 4-pillar guarantees strip
        el = page.locator("text=The Studio Standard · 04 Commercial Guarantees")
        if el.count() > 0:
            el.scroll_into_view_if_needed()
            page.wait_for_timeout(1000)
            shot = os.path.join(artifacts_dir, "audit_13_faq_guarantees_strip.png")
            page.screenshot(path=shot)
            print("Captured Guarantees Strip:", shot)

        browser.close()

if __name__ == "__main__":
    run()
