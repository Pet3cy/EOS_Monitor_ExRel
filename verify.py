from playwright.sync_api import sync_playwright

def verify_app(page):
    # Navigate to the app
    page.goto("http://localhost:3000")

    # Wait for the app to load
    page.wait_for_timeout(3000)
    page.screenshot(path="/tmp/screen_1.png", full_page=True)

    # Try to get past the welcome screen
    try:
        start_btn = page.get_by_text("Get Started")
        if start_btn.is_visible():
            start_btn.click()
            page.wait_for_timeout(2000)
    except:
        pass

    page.screenshot(path="/tmp/screen_2.png", full_page=True)

    # Click Contacts tab
    try:
        contacts_tab = page.get_by_text("Contacts")
        if contacts_tab.is_visible():
            contacts_tab.click()
            page.wait_for_timeout(2000)
    except:
        pass

    page.screenshot(path="/tmp/screen_3.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_app(page)
            print("Screenshots taken successfully.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()