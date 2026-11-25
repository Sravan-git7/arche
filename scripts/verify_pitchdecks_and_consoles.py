import os
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

def run():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("=== 1. DESKTOP VIEWPORT 1440x900 VERIFICATION ===")
        page.goto("http://localhost:5173/#/", wait_until="domcontentloaded")
        page.wait_for_timeout(3800) # Preloader curtain completion

        # Scroll to Services section
        services = page.locator("#services").first
        assert services.count() > 0, "Services section not found"
        services.scroll_into_view_if_needed()
        page.wait_for_timeout(800)

        # Locate all 4 service cards in Chapters
        cards = page.locator(".sticky-service-card").all()
        print(f"Found {len(cards)} sticky-service-cards in Chapters.")
        assert len(cards) == 4, f"Expected 4 sticky cards, got {len(cards)}"

        # 1. Card 01: Video Editing (Untouched Guardrail)
        card1 = cards[0]
        card1.scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        shot1 = os.path.join(ARTIFACTS_DIR, "receding_01_video_editing_untouched.png")
        card1.screenshot(path=shot1)
        print("Captured Card 01 (Video Editing):", shot1)
        card1_text = card1.inner_text()
        assert "01 ·" in card1_text and "VIDEO EDITING" in card1_text, "Card 01 mismatch"
        assert "STAGE:" in card1_text, "Expected video stage indicator in Card 01"

        # 2. Card 02: Pitch Decks & Storytelling (3D Perspective Deck Stack)
        card2 = cards[1]
        card2.scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        # Click TRACTION to explicitly view Slide 03
        traction_btn = card2.locator("button:has-text('TRACTION')").first
        if traction_btn.count() > 0:
            traction_btn.click()
            page.wait_for_timeout(400)
        shot2 = os.path.join(ARTIFACTS_DIR, "receding_02_pitch_decks_3d_stack.png")
        card2.screenshot(path=shot2)
        print("Captured Card 02 (Pitch Decks 3D Stack):", shot2)
        card2_text = card2.inner_text()
        assert "02 ·" in card2_text and "PITCH DECKS" in card2_text, "Card 02 mismatch"
        assert "16:9 MASTER" in card2_text, "Expected '16:9 MASTER' in Deck Demo"
        assert "INVESTOR READY" in card2_text, "Expected 'INVESTOR READY' in Deck Demo"
        assert "3.4× Revenue Velocity" in card2_text, "Expected traction headline in Deck Demo"
        assert "₹4.2 Cr ARR" in card2_text, "Expected ₹4.2 Cr ARR metric in Deck Demo"

        # 3. Card 03: Web Development (Scan Wipe & Dual Viewport)
        card3 = cards[2]
        card3.scroll_into_view_if_needed()
        page.wait_for_timeout(900)
        shot3 = os.path.join(ARTIFACTS_DIR, "receding_03_web_dev_flagship_stage.png")
        card3.screenshot(path=shot3)
        print("Captured Card 03 (Web Dev Flagship Stage):", shot3)
        card3_text = card3.inner_text()
        assert "03 ·" in card3_text and "WEB DEVELOPMENT" in card3_text, "Card 03 mismatch"
        assert "arche.studio/client" in card3_text, "Expected 'arche.studio/client' in WebDevDemo"
        assert "100" in card3_text and "PERF" in card3_text, "Expected 100 Perf in WebDevDemo"
        assert "LOCKSTEP SYNC" in card3_text or "Mobile Viewport" in card3_text, "Expected mobile sync indicator"

        # 4. Card 04: AI Automation (Central Hub & Luminous Beams)
        card4 = cards[3]
        card4.scroll_into_view_if_needed()
        page.wait_for_timeout(900)
        shot4 = os.path.join(ARTIFACTS_DIR, "receding_04_ai_automation_central_hub.png")
        card4.screenshot(path=shot4)
        print("Captured Card 04 (AI Automation Central Hub):", shot4)
        card4_text = card4.inner_text()
        assert "04 ·" in card4_text and "AI AUTOMATION" in card4_text, "Card 04 mismatch"
        assert "4 SYSTEMS SYNCED" in card4_text, "Expected '4 SYSTEMS SYNCED' in AutomationDemo"
        assert "ARCHÉ AI" in card4_text or "SCORING 94%" in card4_text, "Expected Arché AI Hub in AutomationDemo"
        assert "Activity Stream" in card4_text or "INBOX PARSED" in card4_text, "Expected Activity Stream in AutomationDemo"

        # Capture whole Services stack view to verify receding depth physics
        page.evaluate("window.scrollTo(0, document.getElementById('services').offsetTop + 700)")
        page.wait_for_timeout(700)
        shot_stack = os.path.join(ARTIFACTS_DIR, "receding_stack_physics_depth.png")
        page.screenshot(path=shot_stack)
        print("Captured Receding Stack Depth Overview:", shot_stack)

        # === 2. MOBILE VIEWPORT 390x844 VERIFICATION ===
        print("=== 2. MOBILE VIEWPORT 390x844 VERIFICATION ===")
        mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
        m_page = mobile_ctx.new_page()
        m_page.goto("http://localhost:5173/#/", wait_until="domcontentloaded")
        m_page.wait_for_timeout(3800)

        # Check for horizontal overflow across whole document
        overflow = m_page.evaluate("""() => {
            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                hasOverflow: document.documentElement.scrollWidth > window.innerWidth
            };
        }""")
        print(f"Mobile overflow check: scrollWidth={overflow['scrollWidth']}, innerWidth={overflow['innerWidth']}, hasOverflow={overflow['hasOverflow']}")
        assert not overflow["hasOverflow"], f"Horizontal overflow detected on mobile: {overflow}"

        # Scroll to services on mobile and capture
        m_services = m_page.locator("#services").first
        if m_services.count() > 0:
            m_services.scroll_into_view_if_needed()
            m_page.wait_for_timeout(800)
            shot_m_services = os.path.join(ARTIFACTS_DIR, "mobile_receding_services_stack.png")
            m_page.screenshot(path=shot_m_services)
            print("Captured Mobile Services:", shot_m_services)

        browser.close()
        print("ALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
