import os
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

def run():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # -------------------------------------------------------------
        # 1. FAQ PAGE
        # -------------------------------------------------------------
        page.goto("http://localhost:5173/#/faq", wait_until="networkidle")
        page.wait_for_timeout(2000)

        # Shot 1: Hero & Concierge
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, "faq_01_desktop_hero_and_concierge.png"))

        # Shot 2: Search, Filters, and Accordions
        heading = page.locator("text=FREQUENTLY ASKED QUESTIONS").first
        if heading.count() > 0:
            heading.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            
            # Open the first accordion row to reveal answer text
            first_q = page.locator("button:has-text('Can Arché handle just one discipline')").first
            if first_q.count() > 0:
                first_q.click()
                page.wait_for_timeout(500)
                
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "faq_02_desktop_heading_search_and_accordions.png"))

        # Shot 3: Guarantees & Escalation
        guar = page.locator("text=The Studio Standard · 04 Commercial Guarantees").first
        if guar.count() > 0:
            guar.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "faq_03_desktop_guarantees_and_escalation.png"))

        # -------------------------------------------------------------
        # 2. PRICING PAGE
        # -------------------------------------------------------------
        page.goto("http://localhost:5173/#/pricing", wait_until="networkidle")
        page.wait_for_timeout(2000)

        # Shot 4: Tier Cards
        tier_sec = page.locator("text=FOUR DISCIPLINARY STACKS").first
        if tier_sec.count() > 0:
            tier_sec.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, "pricing_01_desktop_pricing_cards.png"))

        # Shot 5: How We Price & Scope Notice
        how_we_price = page.locator("text=HOW WE PRICE AND OPERATE").first
        if how_we_price.count() > 0:
            how_we_price.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "pricing_02_desktop_how_we_price_and_scope_notice.png"))

        # -------------------------------------------------------------
        # 3. SERVICES DIRECTORY
        # -------------------------------------------------------------
        page.goto("http://localhost:5173/#/services", wait_until="networkidle")
        page.wait_for_timeout(2000)

        bento = page.locator("text=Explore dedicated").first
        if bento.count() > 0:
            bento.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, "services_01_desktop_bento_cards.png"))

        # -------------------------------------------------------------
        # 4. HOME PAGE (How We Work & Work Carousel)
        # -------------------------------------------------------------
        page.goto("http://localhost:5173/#/", wait_until="networkidle")
        page.wait_for_timeout(2500)

        # Shot 6: How We Work cards
        how_work = page.locator("text=Predictable delivery from day zero.").first
        if how_work.count() > 0:
            how_work.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "home_01_desktop_how_we_work.png"))

        # Shot 7: Work carousel cards
        work_sec = page.locator("text=Proof of Craft").first
        if work_sec.count() > 0:
            work_sec.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "home_02_desktop_work_carousel.png"))

        browser.close()
        print("All verification screenshots successfully captured.")

if __name__ == "__main__":
    run()
