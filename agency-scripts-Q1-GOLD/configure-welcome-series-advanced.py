#!/usr/bin/env python3
"""
WELCOME SERIES CONFIGURATION - ADVANCED MCP-COMET-BROWSER ATTEMPT
Session 68 - Advanced UI automation with extended wait times and JavaScript injection
"""

import pychrome
import time
import json
import base64
from pathlib import Path

# Chrome DevTools Protocol connection
browser = pychrome.Browser(url="http://127.0.0.1:9222")

print("🔍 WELCOME SERIES CONFIGURATION - ADVANCED ATTEMPT")
print("=" * 60)

# Create new tab
tab = browser.new_tab()

def wait_for_page_load(seconds=10):
    """Wait for page load with progress indicator"""
    print(f"   ⏳ Waiting {seconds}s for page load...")
    for i in range(seconds):
        time.sleep(1)
        if i % 2 == 0:
            print(f"      {i+1}s...", end=" ")
    print("\n   ✅ Wait complete")

def capture_screenshot(filename, description):
    """Capture and save screenshot"""
    print(f"   📸 Capturing: {description}")
    try:
        result = tab.Page.captureScreenshot(format='png')
        screenshot_data = base64.b64decode(result['data'])

        filepath = f"/tmp/{filename}"
        with open(filepath, 'wb') as f:
            f.write(screenshot_data)

        print(f"      ✅ Saved: {filepath}")
        return filepath
    except Exception as e:
        print(f"      ❌ Screenshot failed: {e}")
        return None

def execute_js(code, description):
    """Execute JavaScript and return result"""
    print(f"   🔧 Executing: {description}")
    try:
        result = tab.Runtime.evaluate(expression=code)

        if 'exceptionDetails' in result:
            print(f"      ❌ Exception: {result['exceptionDetails']}")
            return None

        value = result.get('result', {}).get('value')
        print(f"      ✅ Result: {value}")
        return value
    except Exception as e:
        print(f"      ❌ Failed: {e}")
        return None

def inject_helper_functions():
    """Inject helper JavaScript functions"""
    helper_js = """
    window.hendersonHelpers = {
        // Force click with multiple fallbacks
        forceClick: function(selector) {
            const element = document.querySelector(selector);
            if (!element) return false;

            // Try multiple click methods
            try {
                element.click();
                return true;
            } catch (e) {
                try {
                    element.dispatchEvent(new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    }));
                    return true;
                } catch (e2) {
                    return false;
                }
            }
        },

        // Set input value with change event
        setInput: function(selector, value) {
            const element = document.querySelector(selector);
            if (!element) return false;

            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        },

        // Find element by text content (deep search)
        findByText: function(text) {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            const matches = [];
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.includes(text)) {
                    matches.push(node.parentElement);
                }
            }
            return matches.length > 0 ? matches[0] : null;
        },

        // Check for Shadow DOM elements
        checkShadowDOM: function() {
            const shadowRoots = [];
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.shadowRoot) {
                    shadowRoots.push(el.tagName);
                }
            });
            return shadowRoots;
        }
    };

    console.log('✅ Henderson helpers injected');
    return true;
    """

    execute_js(helper_js, "Inject helper functions")

# Start DevTools Protocol
try:
    tab.start()
    print("✅ Chrome DevTools Protocol connected\n")

    # Enable required domains
    tab.Page.enable()
    tab.Runtime.enable()
    tab.DOM.enable()

    # STEP 1: Navigate to Welcome Series editor
    print("\n📍 STEP 1: Navigate to Welcome Series Editor")
    print("-" * 60)

    url = "https://admin.shopify.com/store/jqp1x4-7e/marketing/automations/flows/28834103348"
    print(f"   🌐 URL: {url}")

    tab.Page.navigate(url=url)
    wait_for_page_load(15)  # Extended wait for Shopify Admin

    capture_screenshot("session68_step1_initial.png", "Initial page load")

    # Inject helper functions
    inject_helper_functions()

    # STEP 2: Check for Shadow DOM
    print("\n📍 STEP 2: Analyze Page Structure")
    print("-" * 60)

    shadow_roots = execute_js(
        "window.hendersonHelpers.checkShadowDOM()",
        "Check for Shadow DOM"
    )

    if shadow_roots and len(shadow_roots) > 0:
        print(f"   ⚠️  Shadow DOM detected: {shadow_roots}")
    else:
        print("   ℹ️  No Shadow DOM detected")

    # STEP 3: Try to find email editor link
    print("\n📍 STEP 3: Locate Email Editor")
    print("-" * 60)

    # Try multiple selectors for "Welcome aboard!" email
    selectors = [
        'a[href*="emails"]',
        'button:contains("Welcome aboard!")',
        '[data-test-id*="email"]',
        '.marketing-email',
        'a[aria-label*="email"]'
    ]

    email_link_found = False
    for selector in selectors:
        result = execute_js(
            f"document.querySelector('{selector}') !== null",
            f"Try selector: {selector}"
        )
        if result:
            email_link_found = True
            print(f"   ✅ Found with: {selector}")
            break

    if not email_link_found:
        # Try text-based search
        print("   ⚠️  Selector search failed, trying text search...")
        result = execute_js(
            "window.hendersonHelpers.findByText('Welcome aboard!') !== null",
            "Search for 'Welcome aboard!' text"
        )
        email_link_found = result is True

    capture_screenshot("session68_step3_search.png", "After email link search")

    # STEP 4: Try to click email editor
    if email_link_found:
        print("\n📍 STEP 4: Open Email Editor")
        print("-" * 60)

        # Try force click
        click_result = execute_js(
            """
            const element = window.hendersonHelpers.findByText('Welcome aboard!');
            if (element) {
                const link = element.closest('a') || element.closest('button');
                if (link) {
                    link.click();
                    return true;
                }
            }
            return false;
            """,
            "Force click email link"
        )

        if click_result:
            print("   ✅ Click succeeded")
            wait_for_page_load(10)
            capture_screenshot("session68_step4_after_click.png", "After email click")

            # STEP 5: Try to fill subject line
            print("\n📍 STEP 5: Fill Subject Line")
            print("-" * 60)

            subject_selectors = [
                'input[name="subject"]',
                'input[placeholder*="subject"]',
                'input[type="text"][aria-label*="subject"]',
                '#subject',
                '.email-subject-input'
            ]

            subject_filled = False
            for selector in subject_selectors:
                result = execute_js(
                    f"window.hendersonHelpers.setInput('{selector}', 'Welcome! Here\\'s your 15% OFF 🎉')",
                    f"Try subject selector: {selector}"
                )
                if result:
                    subject_filled = True
                    print(f"   ✅ Subject filled with: {selector}")
                    break

            capture_screenshot("session68_step5_subject.png", "After subject fill attempt")

            # STEP 6: Try to select WELCOME15 discount
            print("\n📍 STEP 6: Select WELCOME15 Discount")
            print("-" * 60)

            discount_selectors = [
                'select[name*="discount"]',
                'select[aria-label*="discount"]',
                '.discount-selector',
                '[data-test-id*="discount"]'
            ]

            discount_selected = False
            for selector in discount_selectors:
                result = execute_js(
                    f"""
                    const select = document.querySelector('{selector}');
                    if (select) {{
                        const option = Array.from(select.options).find(
                            opt => opt.text.includes('WELCOME15')
                        );
                        if (option) {{
                            select.value = option.value;
                            select.dispatchEvent(new Event('change', {{ bubbles: true }}));
                            return true;
                        }}
                    }}
                    return false;
                    """,
                    f"Try discount selector: {selector}"
                )
                if result:
                    discount_selected = True
                    print(f"   ✅ Discount selected with: {selector}")
                    break

            capture_screenshot("session68_step6_discount.png", "After discount selection attempt")

            # STEP 7: Try to activate email
            print("\n📍 STEP 7: Activate Email")
            print("-" * 60)

            activate_result = execute_js(
                """
                const activateBtn = window.hendersonHelpers.findByText('Set to active');
                if (activateBtn) {
                    const button = activateBtn.closest('button');
                    if (button && !button.disabled) {
                        button.click();
                        return true;
                    }
                    return 'disabled';
                }
                return false;
                """,
                "Try to click 'Set to active'"
            )

            capture_screenshot("session68_step7_activate.png", "After activate attempt")

            # FINAL RESULTS
            print("\n" + "=" * 60)
            print("📊 RESULTS SUMMARY")
            print("=" * 60)
            print(f"   Email link found: {'✅' if email_link_found else '❌'}")
            print(f"   Email editor opened: {'✅' if click_result else '❌'}")
            print(f"   Subject filled: {'✅' if subject_filled else '❌'}")
            print(f"   Discount selected: {'✅' if discount_selected else '❌'}")
            print(f"   Email activated: {activate_result if activate_result else '❌'}")

            if subject_filled and discount_selected and activate_result == True:
                print("\n   🎉 SUCCESS: Email configured!")
            else:
                print("\n   ⚠️  PARTIAL: Some steps failed")
                print("   👉 Manual completion required")

        else:
            print("   ❌ Click failed - UI interaction blocked")
            capture_screenshot("session68_click_failed.png", "Click failure state")

    else:
        print("\n   ❌ Email editor link not found")
        print("   👉 Page structure may have changed")
        capture_screenshot("session68_no_link.png", "Link not found state")

    # Save detailed results
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "url": url,
        "shadow_dom_detected": shadow_roots if shadow_roots else [],
        "email_link_found": email_link_found,
        "steps_completed": {
            "navigate": True,
            "inject_helpers": True,
            "find_email": email_link_found,
            "click_email": email_link_found and click_result,
            "fill_subject": subject_filled if email_link_found else False,
            "select_discount": discount_selected if email_link_found else False,
            "activate": activate_result if email_link_found else False
        }
    }

    with open('/tmp/welcome_series_advanced_attempt.json', 'w') as f:
        json.dump(results, f, indent=2)

    print("\n💾 Results saved: /tmp/welcome_series_advanced_attempt.json")

except Exception as e:
    print(f"\n❌ CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()

finally:
    print("\n🔚 Closing browser tab...")
    try:
        tab.stop()
        browser.close_tab(tab)
    except:
        pass
    print("✅ Done")
