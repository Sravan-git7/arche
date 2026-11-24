from playwright.sync_api import sync_playwright
import time

ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744"

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # Desktop 1440x900
        print("Capturing Desktop 1440x900 deterministic frames...")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        page.goto("http://localhost:5173")
        
        # Wait for timeline to be attached
        page.wait_for_function("() => window.__arche_intro_tl !== undefined", timeout=5000)
        # Pause timeline immediately
        page.evaluate("window.__arche_intro_tl.pause()")

        desktop_beats = [
            (0.00, "preloader_01_desktop_t0_start_centered.png"),
            (0.25, "preloader_02_desktop_beat1_a_drawing.png"),
            (0.48, "preloader_03_desktop_beat1_a_complete.png"),
            (0.60, "preloader_04_desktop_beat2_c_drawing.png"),
            (0.72, "preloader_05_desktop_beat2_c_complete_dot_popped.png"),
            (1.05, "preloader_06_desktop_beat3_text_wiping.png"),
            (1.35, "preloader_07_desktop_beat3_text_revealed.png"),
            (1.85, "preloader_08_desktop_beat4_curtain_lifting.png"),
        ]

        for t_val, fname in desktop_beats:
            page.evaluate(f"window.__arche_intro_tl.seek({t_val})")
            time.sleep(0.05)
            page.screenshot(path=f"{ARTIFACT_DIR}/{fname}")
            print(f"Captured {fname} at seek({t_val}s)")

        context.close()

        # Mobile 390x844
        print("Capturing Mobile 390x844 deterministic frames...")
        m_context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        )
        m_page = m_context.new_page()
        m_page.goto("http://localhost:5173")
        m_page.wait_for_function("() => window.__arche_intro_tl !== undefined", timeout=5000)
        m_page.evaluate("window.__arche_intro_tl.pause()")

        mobile_beats = [
            (0.00, "preloader_09_mobile_t0_start_centered.png"),
            (0.25, "preloader_10_mobile_beat1_a_drawing.png"),
            (0.72, "preloader_11_mobile_beat2_c_complete_dot_popped.png"),
            (1.05, "preloader_12_mobile_beat3_text_wiping.png"),
            (1.35, "preloader_13_mobile_beat3_text_revealed.png"),
            (1.85, "preloader_14_mobile_beat4_curtain_lifting.png"),
        ]

        for t_val, fname in mobile_beats:
            m_page.evaluate(f"window.__arche_intro_tl.seek({t_val})")
            time.sleep(0.05)
            m_page.screenshot(path=f"{ARTIFACT_DIR}/{fname}")
            print(f"Captured {fname} at seek({t_val}s)")

        m_context.close()
        browser.close()
        print("Deterministic verification frame capture complete!")

if __name__ == "__main__":
    verify()
