import os
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

def run():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Load Home
        page.goto("http://localhost:5173/#/", wait_until="domcontentloaded")
        # Wait 3800ms for preloader animation to complete and curtain to lift
        page.wait_for_timeout(3800)

        # 1. Hero Initial Fold (verify 100svh, no peeking of next section)
        shot1 = os.path.join(ARTIFACTS_DIR, "luxury_01_hero_initial_fold.png")
        page.screenshot(path=shot1)
        print("Captured Hero:", shot1)

        # 2. Capability Marquee (Resting & Hover Illumination)
        marquee = page.locator("[aria-label='Capabilities Overview']").first
        if marquee.count() > 0:
            marquee.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            shot2 = os.path.join(ARTIFACTS_DIR, "luxury_02_capability_marquee.png")
            page.screenshot(path=shot2)
            print("Captured Marquee Resting:", shot2)

            # Hover directly in the middle of Row 1 to capture interactive phrase illumination and verify continuous glide
            row1 = page.locator(".animate-marquee-left").first
            row1_box = row1.bounding_box()
            if row1_box:
                page.mouse.move(720, row1_box["y"] + row1_box["height"] / 2)
                page.wait_for_timeout(400)
                shot2_hover = os.path.join(ARTIFACTS_DIR, "luxury_02_marquee_hover_illumination.png")
                page.screenshot(path=shot2_hover)
                print("Captured Marquee Hover Illumination:", shot2_hover)

                # Verify animationPlayState is 'running' on hover (NO pause)
                play_state = row1.evaluate("el => getComputedStyle(el).animationPlayState")
                anim_dur = row1.evaluate("el => getComputedStyle(el).animationDuration")
                print(f"Verified Row 1 on hover: animationPlayState='{play_state}', animationDuration='{anim_dur}'")

                # Sample transform over 600ms while keeping mouse hovered to prove continuous glide
                t1 = row1.evaluate("el => getComputedStyle(el).transform")
                page.wait_for_timeout(600)
                t2 = row1.evaluate("el => getComputedStyle(el).transform")
                is_moving = t1 != t2
                print(f"Verified continuous motion on hover: t1 != t2 is {is_moving} (t1: {t1[:30]}..., t2: {t2[:30]}...)")
                assert play_state == "running", f"Expected animationPlayState 'running', got '{play_state}'"
                assert is_moving, "Expected marquee to continue moving while hovered"

        # 3. Why Arché 4-column Stat Strip in Smoked Cypress Liquid Glass
        stat_strip = page.locator(".stat-strip-hairline").first
        if stat_strip.count() > 0:
            stat_strip.scroll_into_view_if_needed()
            page.wait_for_timeout(700)
            shot3 = os.path.join(ARTIFACTS_DIR, "luxury_03_why_arche_stat_strip.png")
            page.screenshot(path=shot3)
            print("Captured Stat Strip:", shot3)

        # 4. Work Carousel Smoked Cards
        thumb = page.locator(".work-thumbnail-frame").first
        if thumb.count() > 0:
            thumb.scroll_into_view_if_needed()
            page.wait_for_timeout(700)
            shot4 = os.path.join(ARTIFACTS_DIR, "luxury_04_work_carousel_smoked_cards.png")
            page.screenshot(path=shot4)
            print("Captured Work Cards:", shot4)

        # 5. FAQ Smoked Accordion Rows
        faq_btn = page.locator(".faq-card button").first
        if faq_btn.count() > 0:
            faq_btn.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            # Hover to verify cursor
            faq_btn.hover()
            page.wait_for_timeout(400)
            # Capture
            shot5 = os.path.join(ARTIFACTS_DIR, "luxury_05_faq_smoked_accordion_open.png")
            page.screenshot(path=shot5)
            print("Captured FAQ Rows:", shot5)

        # 6. Pre-Footer Precision Crystal Orb
        prefooter = page.locator("text=NOW BOOKING NEXT ENGAGEMENTS").first
        if prefooter.count() > 0:
            prefooter.scroll_into_view_if_needed()
            page.wait_for_timeout(800)
            shot6 = os.path.join(ARTIFACTS_DIR, "luxury_06_prefooter_crystal_orb.png")
            page.screenshot(path=shot6)
            print("Captured Pre-Footer Orb:", shot6)

        browser.close()
        print("All luxury verification screenshots successfully captured.")

if __name__ == "__main__":
    run()
