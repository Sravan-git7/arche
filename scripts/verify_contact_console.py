import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\srava\.gemini\antigravity\brain\5fcd58f0-0095-4eb4-a575-224618e12744"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # 1. Desktop Verification at 1440x900
        # -------------------------------------------------------------
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("Navigating desktop to http://localhost:5173/#/contact ...")
        await page.goto("http://localhost:5173/#/contact", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)

        # Step 01 Desktop
        s1_path = os.path.join(ARTIFACT_DIR, "contact_01_desktop_step1.png")
        await page.screenshot(path=s1_path)
        print(f"Captured: {s1_path}")

        # Click "Web Development" card
        web_dev_card = page.locator("button:has-text('Web Development')").first
        await web_dev_card.click()
        await page.wait_for_timeout(600)

        # Step 02 Desktop
        s2_path = os.path.join(ARTIFACT_DIR, "contact_02_desktop_step2.png")
        await page.screenshot(path=s2_path)
        print(f"Captured: {s2_path}")

        # Click quick-prompt chip
        quick_prompt = page.locator("button:has-text('Launch a high-converting website')").first
        await quick_prompt.click()
        await page.wait_for_timeout(300)

        # Click Continue to Timeline
        continue_btn = page.locator("button:has-text('Continue to Timeline')").first
        await continue_btn.click()
        await page.wait_for_timeout(600)

        # Step 03 Desktop
        s3_path = os.path.join(ARTIFACT_DIR, "contact_03_desktop_step3.png")
        await page.screenshot(path=s3_path)
        print(f"Captured: {s3_path}")

        # Click "1–3 Months"
        timeline_card = page.locator("button:has-text('1–3 Months')").first
        await timeline_card.click()
        await page.wait_for_timeout(600)

        # Step 04 Desktop
        s4_path = os.path.join(ARTIFACT_DIR, "contact_04_desktop_step4.png")
        await page.screenshot(path=s4_path)
        print(f"Captured: {s4_path}")

        # Verify browser autofill attributes on form
        name_input = page.locator("input[autocomplete='name']").first
        email_input = page.locator("input[autocomplete='email']").first
        tel_input = page.locator("input[autocomplete='tel']").first
        org_input = page.locator("input[autocomplete='organization']").first

        assert await name_input.count() > 0, "name input with autocomplete='name' missing"
        assert await email_input.count() > 0, "email input with autocomplete='email' missing"
        assert await tel_input.count() > 0, "tel input with autocomplete='tel' missing"
        assert await org_input.count() > 0, "org input with autocomplete='organization' missing"

        # Fill inputs
        await name_input.fill("Aditya Rao")
        await email_input.fill("aditya@foundry.io")
        await tel_input.fill("+91 98765 43210")
        await org_input.fill("Foundry Media")
        await page.wait_for_timeout(300)

        s4_filled_path = os.path.join(ARTIFACT_DIR, "contact_05_desktop_step4_filled.png")
        await page.screenshot(path=s4_filled_path)
        print(f"Captured: {s4_filled_path}")

        # Submit form
        submit_btn = page.locator("button:has-text('Send Project Brief')").first
        await submit_btn.click()
        await page.wait_for_timeout(800)

        # Confirmation State Desktop
        confirm_path = os.path.join(ARTIFACT_DIR, "contact_06_desktop_confirmation.png")
        await page.screenshot(path=confirm_path)
        print(f"Captured: {confirm_path}")

        # -------------------------------------------------------------
        # 2. Mobile Verification at 390x844 (iPhone 14)
        # -------------------------------------------------------------
        m_context = await browser.new_context(viewport={"width": 390, "height": 844})
        m_page = await m_context.new_page()

        print("Navigating mobile to http://localhost:5173/#/contact ...")
        await m_page.goto("http://localhost:5173/#/contact", wait_until="domcontentloaded")
        await m_page.wait_for_timeout(2000)

        m_s1_path = os.path.join(ARTIFACT_DIR, "contact_07_mobile_step1.png")
        await m_page.screenshot(path=m_s1_path)
        print(f"Captured: {m_s1_path}")

        # Scroll down slightly to view the Step 01 cards on mobile
        await m_page.evaluate("window.scrollTo(0, 320)")
        await m_page.wait_for_timeout(500)
        m_s1_cards_path = os.path.join(ARTIFACT_DIR, "contact_08_mobile_step1_cards.png")
        await m_page.screenshot(path=m_s1_cards_path)
        print(f"Captured: {m_s1_cards_path}")

        await browser.close()
        print("All contact console screenshots captured successfully.")

if __name__ == "__main__":
    asyncio.run(main())
