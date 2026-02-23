from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto("http://localhost:3000")
            # Wait a bit just in case
            page.wait_for_timeout(2000)

            page.screenshot(path="verification.png")

            title = page.title()
            print(f"Page title: {title}")

            browser.close()
            print("Verification successful.")
        except Exception as e:
            print(f"Verification failed: {e}")

if __name__ == "__main__":
    run()
