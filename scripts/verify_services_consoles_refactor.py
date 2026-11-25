import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("Navigating to http://localhost:5173/#/services...")
        page.goto("http://localhost:5173/", wait_until="networkidle")
        time.sleep(1.5)

        # Scroll to services section
        page.evaluate("document.getElementById('services')?.scrollIntoView({ behavior: 'instant' })")
        time.sleep(1.0)

        service_cards = page.locator(".sticky-service-card")
        card_count = service_cards.count()
        print(f"Found {card_count} service cards")

        # -------------------------------------------------------------
        # CARD 01: VIDEO EDITING (Verify untouched)
        # -------------------------------------------------------------
        card_01 = service_cards.nth(0)
        card_01.scroll_into_view_if_needed()
        time.sleep(0.5)
        path_c1 = os.path.join(ARTIFACT_DIR, "refactor_01_video_untouched.png")
        card_01.screenshot(path=path_c1)
        print(f"Saved Card 01 screenshot to {path_c1}")

        # -------------------------------------------------------------
        # CARD 02: PITCH DECKS & STORYTELLING
        # -------------------------------------------------------------
        card_02 = service_cards.nth(1)
        card_02.scroll_into_view_if_needed()
        time.sleep(0.5)

        # Click Before mode
        before_btn = card_02.locator("button:has-text('BEFORE: RAW DECK')")
        if before_btn.count() > 0:
            before_btn.click()
            time.sleep(0.5)
            path_c2_before = os.path.join(ARTIFACT_DIR, "refactor_02_pitch_decks_before.png")
            card_02.screenshot(path=path_c2_before)
            print(f"Saved Card 02 (Before) screenshot to {path_c2_before}")

        # Click After mode
        after_btn = card_02.locator("button:has-text('AFTER: ARCHÉ')")
        if after_btn.count() > 0:
            after_btn.click()
            time.sleep(0.5)
            # Click Traction slide
            traction_btn = card_02.locator("button:has-text('02 TRACTION')")
            if traction_btn.count() > 0:
                traction_btn.click()
                time.sleep(0.4)
            path_c2_after = os.path.join(ARTIFACT_DIR, "refactor_02_pitch_decks_after_traction.png")
            card_02.screenshot(path=path_c2_after)
            print(f"Saved Card 02 (After Traction) screenshot to {path_c2_after}")

        # -------------------------------------------------------------
        # CARD 03: BESPOKE WEB DEVELOPMENT
        # -------------------------------------------------------------
        card_03 = service_cards.nth(2)
        card_03.scroll_into_view_if_needed()
        time.sleep(0.5)

        # Stage 01: WIREFRAME
        s1_btn = card_03.locator("button:has-text('01 WIREFRAME')")
        if s1_btn.count() > 0:
            s1_btn.click()
            time.sleep(0.4)
            path_c3_s1 = os.path.join(ARTIFACT_DIR, "refactor_03_webdev_stage1_wireframe.png")
            card_03.screenshot(path=path_c3_s1)
            print(f"Saved Card 03 (Stage 1 Wireframe) screenshot to {path_c3_s1}")

        # Stage 02: DESIGN
        s2_btn = card_03.locator("button:has-text('02 DESIGN')")
        if s2_btn.count() > 0:
            s2_btn.click()
            time.sleep(0.4)
            path_c3_s2 = os.path.join(ARTIFACT_DIR, "refactor_03_webdev_stage2_design.png")
            card_03.screenshot(path=path_c3_s2)
            print(f"Saved Card 03 (Stage 2 Design) screenshot to {path_c3_s2}")

        # Stage 03: BUILD & SPEED
        s3_btn = card_03.locator("button:has-text('03 BUILD & SPEED')")
        if s3_btn.count() > 0:
            s3_btn.click()
            time.sleep(0.4)
            path_c3_s3 = os.path.join(ARTIFACT_DIR, "refactor_03_webdev_stage3_speed.png")
            card_03.screenshot(path=path_c3_s3)
            print(f"Saved Card 03 (Stage 3 Speed) screenshot to {path_c3_s3}")

        # Stage 04: LIVE & CONVERTING
        s4_btn = card_03.locator("button:has-text('04 LIVE & CONVERTING')")
        if s4_btn.count() > 0:
            s4_btn.click()
            time.sleep(0.6)
            path_c3_s4 = os.path.join(ARTIFACT_DIR, "refactor_03_webdev_stage4_live.png")
            card_03.screenshot(path=path_c3_s4)
            print(f"Saved Card 03 (Stage 4 Live) screenshot to {path_c3_s4}")

        # -------------------------------------------------------------
        # CARD 04: WORKFLOW AUTOMATION (Side-by-Side Simultaneous Race)
        # -------------------------------------------------------------
        card_04 = service_cards.nth(3)
        card_04.scroll_into_view_if_needed()
        time.sleep(1.0)

        # Trigger replay race
        replay_btn = card_04.locator("button:has-text('REPLAY RACE')")
        if replay_btn.count() > 0:
            replay_btn.click()
            time.sleep(1.2)

        path_c4 = os.path.join(ARTIFACT_DIR, "refactor_04_automation_side_by_side.png")
        card_04.screenshot(path=path_c4)
        print(f"Saved Card 04 (Side-by-side race) screenshot to {path_c4}")

        # -------------------------------------------------------------
        # MOBILE 390PX VIEWPORT TEST
        # -------------------------------------------------------------
        print("Testing mobile 390px viewport...")
        mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
        mob_page = mobile_ctx.new_page()
        mob_page.goto("http://localhost:5173/", wait_until="networkidle")
        time.sleep(1.5)

        mob_page.evaluate("document.getElementById('services')?.scrollIntoView({ behavior: 'instant' })")
        time.sleep(1.0)

        mob_cards = mob_page.locator(".sticky-service-card")
        mob_path = os.path.join(ARTIFACT_DIR, "refactor_mobile_390px_services.png")
        mob_page.screenshot(path=mob_path, full_page=False)
        print(f"Saved mobile screenshot to {mob_path}")

        # Check for any horizontal overflow
        body_scroll_w = mob_page.evaluate("document.body.scrollWidth")
        inner_w = mob_page.evaluate("window.innerWidth")
        print(f"Mobile body scrollWidth: {body_scroll_w}, innerWidth: {inner_w}")
        assert body_scroll_w <= inner_w, f"Horizontal overflow detected: {body_scroll_w} > {inner_w}"

        browser.close()
        print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    verify()
