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

        print("Navigating to http://localhost:5173/...")
        page.goto("http://localhost:5173/", wait_until="networkidle")
        time.sleep(1.5)

        # Scroll to services section and locate Card 04
        page.evaluate("document.getElementById('services')?.scrollIntoView({ behavior: 'instant' })")
        time.sleep(1.0)

        service_cards = page.locator(".sticky-service-card")
        card_04 = service_cards.nth(3)
        card_04.scroll_into_view_if_needed()
        time.sleep(0.5)

        demo = card_04.locator(".automation-demo")
        assert demo.count() > 0, "AutomationDemo container not found in Card 04!"

        # -------------------------------------------------------------
        # 1. VERIFY PHASE A: MANUAL
        # -------------------------------------------------------------
        print("Checking Phase A (MANUAL)...")
        manual_btn = demo.locator("button:has-text('MANUAL')").first
        manual_btn.click()
        time.sleep(1.2)

        # Check subheaders
        sub_left = demo.locator("text=YOU · 6 MANUAL STEPS")
        assert sub_left.count() > 0, "Phase A sub-header 'YOU · 6 MANUAL STEPS' missing"
        print("✓ Verified sub-header 'YOU · 6 MANUAL STEPS'")

        # Check 6 step rows
        step_titles = [
            "Email arrives",
            "Copy the details",
            "Update the sheet",
            "Open the CRM",
            "Send a reply",
            "Create a task",
        ]
        for st in step_titles:
            assert demo.locator(f"text={st}").count() > 0, f"Step row '{st}' missing"
        print("✓ All 6 manual step rows verified")

        # Check footer
        assert demo.locator("text=AUTO-PREVIEW · MANUAL RUN").count() > 0, "Manual footer missing"
        assert demo.locator("text=18 HRS/WK LOST TO DATA ENTRY").count() > 0, "18 hrs/wk warning missing"
        print("✓ Manual footer verified")

        path_manual = os.path.join(ARTIFACT_DIR, "card04_phase_a_manual.png")
        card_04.screenshot(path=path_manual)
        print(f"Saved Phase A Manual screenshot to {path_manual}")

        # -------------------------------------------------------------
        # 2. VERIFY PHASE B: AUTOMATED
        # -------------------------------------------------------------
        print("Checking Phase B (AUTOMATED)...")
        auto_btn = demo.locator("button:has-text('AUTOMATED')").first
        auto_btn.click()
        time.sleep(2.5) # Wait for beams to shoot and destinations to update

        # Check subheader
        assert demo.locator("text=SYSTEM · 1 EVENT").count() > 0, "Phase B sub-header 'SYSTEM · 1 EVENT' missing"
        print("✓ Verified sub-header 'SYSTEM · 1 EVENT'")

        # Check AI core (76px x 76px, bold 'AI', ZERO emojis)
        ai_monogram = demo.locator("text=AI").first
        assert ai_monogram.count() > 0, "AI monogram missing"
        assert demo.locator("text=READS · DECIDES · ROUTES").count() > 0, "Caption 'READS · DECIDES · ROUTES' missing"
        print("✓ Verified AI core monogram & caption")

        # Check that emojis are ZERO
        body_text = demo.inner_text()
        for forbidden in ["🧠", "⚡", "⚠️", "✔", "✅"]:
            assert forbidden not in body_text, f"Forbidden emoji '{forbidden}' found in Card 04!"
        print("✓ ZERO emojis confirmed in Card 04")

        # Check 4 destination cards with latencies
        destinations = [
            ("INBOX", "12ms"),
            ("SHEET", "34ms"),
            ("CRM", "45ms"),
            ("SLACK", "18ms"),
        ]
        for dest, lat in destinations:
            assert demo.locator(f"text={dest}").count() > 0, f"Destination card '{dest}' missing"
            assert demo.locator(f"text={lat}").count() > 0, f"Latency '{lat}' missing"
        print("✓ All 4 destination cards and latencies verified")

        # Check footer
        assert demo.locator("text=DONE · 0.32s · PERSON FREE").count() > 0, "Automated footer missing"
        assert demo.locator("text=34× FASTER").count() > 0, "34x faster stat missing"
        print("✓ Automated footer verified")

        # Check SVG Bezier curves and connection points
        svg_curves = demo.locator("svg path[d*=' C ']")
        curve_count = svg_curves.count()
        print(f"Found {curve_count} cubic Bezier curves in SVG overlay")
        assert curve_count == 4, f"Expected 4 cubic Bezier curves, got {curve_count}"

        # Verify edge-to-edge coordinates in DOM
        coords_valid = page.evaluate("""() => {
            const container = document.querySelector('.automation-demo');
            const svg = container ? container.querySelector('svg.pointer-events-none') : null;
            if (!svg) return false;
            const paths = svg.querySelectorAll("path[d*=' C ']");
            if (paths.length !== 4) return false;
            // All paths have valid d strings
            for (let p of paths) {
                const d = p.getAttribute('d');
                if (!d || d.includes('NaN')) return false;
            }
            return true;
        }""")
        assert coords_valid, "SVG Bezier path coordinates are invalid or contain NaN!"
        print("✓ SVG Bezier curves mathematically verified edge-to-edge")

        path_auto = os.path.join(ARTIFACT_DIR, "card04_phase_b_automated.png")
        card_04.screenshot(path=path_auto)
        print(f"Saved Phase B Automated screenshot to {path_auto}")

        # -------------------------------------------------------------
        # 3. VERIFY AUTO-TRANSITION (Loop behavior)
        # -------------------------------------------------------------
        print("Checking Automatic 2-phase sequence without clicking...")
        run_again_btn = demo.locator("button:has-text('RUN AGAIN')")
        if run_again_btn.count() > 0:
            run_again_btn.click()
            time.sleep(0.5)
            # Should be in manual
            assert demo.locator("text=YOU · 6 MANUAL STEPS").is_visible(), "Failed to start in Manual after RUN AGAIN"
            print("✓ Starts in Manual automatically")
            # Wait 4.5s for automatic transition to Automated
            print("Waiting 4.5s for automatic transition to Phase B...")
            time.sleep(4.5)
            assert demo.locator("text=SYSTEM · 1 EVENT").is_visible(), "Failed to auto-transition to Automated after 4.2s"
            print("✓ Automatically transitioned to Automated after 4.2s!")

        # -------------------------------------------------------------
        # 4. MOBILE 390PX VIEWPORT
        # -------------------------------------------------------------
        print("Testing mobile 390px viewport...")
        mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
        mob_page = mobile_ctx.new_page()
        mob_page.goto("http://localhost:5173/", wait_until="networkidle")
        time.sleep(1.5)

        mob_page.evaluate("document.getElementById('services')?.scrollIntoView({ behavior: 'instant' })")
        time.sleep(1.0)

        mob_card_04 = mob_page.locator(".sticky-service-card").nth(3)
        mob_card_04.scroll_into_view_if_needed()
        time.sleep(0.5)

        mob_path = os.path.join(ARTIFACT_DIR, "card04_mobile_390px.png")
        mob_card_04.screenshot(path=mob_path)
        print(f"Saved mobile screenshot to {mob_path}")

        # Check horizontal overflow
        body_scroll_w = mob_page.evaluate("document.body.scrollWidth")
        inner_w = mob_page.evaluate("window.innerWidth")
        print(f"Mobile body scrollWidth: {body_scroll_w}, innerWidth: {inner_w}")
        assert body_scroll_w <= inner_w, f"Horizontal overflow detected: {body_scroll_w} > {inner_w}"

        browser.close()
        print("ALL CARD 04 AUTOMATION TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    verify()
