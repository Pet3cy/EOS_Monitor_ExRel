from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto("http://localhost:3000")
            # Wait for a key element to ensure the page is loaded and styled.
            page.wait_for_selector('h1:has-text("OBESSU Event Flow")')

            page.screenshot(path="verification.png")

            title = page.title()
            print(f"Page title: {title}")

            browser.close()
            print("Verification successful.")
        except Exception as e:
            print(f"Verification failed: {e}")

if __name__ == "__main__":
    run()
