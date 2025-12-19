# Type: agency
# Category: setup
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Shopify Email Configuration - Abandoned Checkout Recovery
Optimize native Shopify abandoned checkout email for 5-8% recovery rate

Implementation: Manual via Shopify Admin
"""

print("="*80)
print("SHOPIFY EMAIL - ABANDONED CHECKOUT OPTIMIZATION")
print("="*80)
print()

print("CURRENT STATUS:")
print("  Platform: Shopify Basic Plan")
print("  Available: ✅ Abandoned CHECKOUT emails")
print("  NOT Available: ❌ Abandoned CART emails (requires Shopify plan or Klaviyo)")
print("  Purpose: Recover 5-8% of abandoned checkouts")
print("  Expected Impact: $500-800/month recovered revenue")
print()

print("="*80)
print("CONFIGURATION STEPS (30 min)")
print("="*80)
print()

print("STEP 1: ACCESS ABANDONED CHECKOUT SETTINGS")
print("-" * 40)
print("1. Shopify Admin → Settings → Notifications")
print("2. Scroll to 'Customer notifications' section")
print("3. Find 'Abandoned checkouts' notification")
print("4. Click 'Abandoned checkouts' to edit")
print()

print("STEP 2: VERIFY EMAIL IS ENABLED")
print("-" * 40)
print("1. Check that toggle is ON (blue)")
print("2. If OFF, toggle to enable")
print("3. Verify timing: Default is '1 hour after abandonment'")
print("   - KEEP at 1 hour (optimal conversion window)")
print("   - Research shows: 1h = 30-40% open rate")
print("4. Click 'Edit code' to customize template")
print()

print("STEP 3: OPTIMIZE EMAIL SUBJECT LINE")
print("-" * 40)
print()
print("Current subject line likely generic. Test these:")
print()
print("OPTION 1 (Direct):")
print('  "Complete your order - Alpha Medical Care"')
print()
print("OPTION 2 (Question):")
print('  "Did you forget something?"')
print()
print("OPTION 3 (Urgency):")
print('  "Your cart is waiting! Complete checkout now"')
print()
print("OPTION 4 (Personalized):")
print('  "{{ customer.first_name }}, your order is almost complete"')
print()
print("RECOMMENDED: Start with Option 1 (highest clarity)")
print()

print("STEP 4: CUSTOMIZE EMAIL BODY")
print("-" * 40)
print()
print("Edit the email template with these elements:")
print()

print("1. GREETING (Personalized):")
print('   Hi {{ customer.first_name | default: "there" }},')
print()

print("2. REMINDER TEXT:")
print('   "You left items in your cart at Alpha Medical Care.')
print('    Complete your order now to start your recovery journey!"')
print()

print("3. PRODUCT REMINDER:")
print('   - Show product image(s)')
print('   - Product name(s)')
print('   - Price(s)')
print('   - Total cart value')
print('   (Shopify email template includes this by default)')
print()

print("4. URGENCY ELEMENT:")
print('   "⏰ Items in high demand - inventory may be limited"')
print()

print("5. FREE SHIPPING CALLOUT:")
print('   {% if cart.total_price >= 5000 %}')
print('     "✅ You qualify for FREE SHIPPING!"')
print('   {% else %}')
print('     {% assign remaining = 5000 | minus: cart.total_price | money %}')
print('     "Add {{ remaining }} more for FREE SHIPPING"')
print('   {% endif %}')
print()

print("6. PRIMARY CTA BUTTON:")
print('   Text: "Complete Your Order"')
print('   Style: Large, blue button (#4770DB)')
print('   Link: {{ url_to_recover }}  (Shopify variable)')
print()

print("7. TRUST SIGNALS:")
print('   - "✓ 30-Day Money-Back Guarantee"')
print('   - "✓ Free Shipping on Orders $50+"')
print('   - "✓ 10,000+ Happy Customers"')
print('   - "✓ Secure Checkout"')
print()

print("8. CUSTOMER REVIEWS (Optional):")
print('   Add 1-2 short customer testimonials')
print('   Example: "Best investment in my recovery! - Sarah M."')
print()

print("9. SUPPORT INFORMATION:")
print('   "Questions? We\'re here to help!"')
print('   "Email: support@alphamedical.shop"')
print('   "Live Chat: Available 9AM-6PM EST"')
print()

print("10. FOOTER:")
print('    - Company name: Alpha Medical Care')
print('    - Unsubscribe link (required)')
print('    - Privacy policy link')
print()

print("STEP 5: SAVE AND TEST")
print("-" * 40)
print("1. Click 'Save' to save template changes")
print("2. Click 'Send test email' button")
print("3. Enter your test email address")
print("4. Check inbox:")
print("   ✓ Subject line displays correctly")
print("   ✓ Personalization works ({{ customer.first_name }})")
print("   ✓ Product images/details show")
print("   ✓ CTA button link works")
print("   ✓ Free shipping logic displays")
print("   ✓ Mobile responsive (check on phone)")
print()

print("STEP 6: CREATE TEST ABANDONED CHECKOUT")
print("-" * 40)
print("1. Open your store in incognito/private browser")
print("2. Add a product to cart (e.g., Neck Massager)")
print("3. Click 'Checkout'")
print("4. Enter:")
print("   - Email: your-test-email@example.com")
print("   - Shipping info")
print("5. DO NOT complete payment - close browser")
print("6. Wait 1 hour")
print("7. Check test email inbox for abandoned checkout email")
print("8. Verify:")
print("   ✓ Email arrives within 1-2 hours")
print("   ✓ Subject line is optimized version")
print("   ✓ Product details match abandoned checkout")
print("   ✓ 'Complete Your Order' button works")
print("   ✓ Clicking button returns to checkout")
print("   ✓ Cart items still present")
print()

print("STEP 7: CREATE DISCOUNT CODE (OPTIONAL)")
print("-" * 40)
print("For customers who don't convert after first email:")
print()
print("1. Shopify Admin → Discounts → Create discount")
print("2. Code: 'COMEBACK10'")
print("3. Type: Percentage")
print("4. Value: 10%")
print("5. Applies to: Entire order")
print("6. Minimum purchase: $30")
print("7. Usage limit: One per customer")
print("8. Valid for: 7 days")
print()
print("9. Manually send follow-up email (if customer doesn't complete):")
print('   Subject: "Last chance: 10% off your cart"')
print('   Body: Include COMEBACK10 code')
print("   Timing: 24-48 hours after first email")
print()

print("STEP 8: MONITOR PERFORMANCE")
print("-" * 40)
print("1. Shopify Admin → Analytics → Reports")
print("2. Go to 'Cart Analysis' report")
print("3. Track metrics:")
print("   - Abandoned checkout rate (Baseline: ~70%)")
print("   - Recovery email open rate (Target: >40%)")
print("   - Recovery email click rate (Target: >15%)")
print("   - Recovery conversion rate (Target: 5-8%)")
print("   - Revenue recovered")
print()
print("4. Weekly review:")
print("   - Compare week-over-week performance")
print("   - Identify patterns (days/times with higher abandonment)")
print("   - Test subject line variations (A/B test)")
print("   - Optimize email copy based on clicks")
print()

print("STEP 9: ADVANCED: ADD SECOND EMAIL (MANUAL)")
print("-" * 40)
print("Shopify Basic only sends ONE automated email.")
print("For multi-touch sequence, options:")
print()
print("A. Manual follow-up (LOW tech):")
print("   - Weekly: Export abandoned checkouts")
print("   - Email customers manually with COMEBACK10 code")
print()
print("B. Upgrade to Klaviyo (RECOMMENDED):")
print("   - 3-email automated sequence")
print("   - Email 1: 1 hour (product reminder)")
print("   - Email 2: 24 hours (benefits + reviews)")
print("   - Email 3: 48 hours (10% discount)")
print("   - See configure_klaviyo.py for setup")
print()
print("C. Upgrade Shopify plan to Advanced ($399/mo):")
print("   - Native multi-email sequences")
print("   - NOT RECOMMENDED (use Klaviyo instead - free up to 250 contacts)")
print()

print("="*80)
print("EXPECTED RESULTS")
print("="*80)
print()
print("BASELINE (No optimization):")
print("  - Abandoned checkout rate: 70%")
print("  - Recovery rate: 0-2%")
print("  - Revenue lost: ~$10,000/month")
print()
print("AFTER OPTIMIZATION:")
print("  - Abandoned checkout rate: 65-70% (unchanged)")
print("  - Email open rate: 40-45%")
print("  - Email click rate: 15-20%")
print("  - Recovery conversion rate: 5-8%")
print("  - Revenue recovered: $500-800/month")
print()
print("CALCULATION:")
print("  - 100 abandoned checkouts/month")
print("  - × $100 average checkout value")
print("  - × 40% email open rate")
print("  - × 20% click rate")
print("  - × 8% conversion")
print("  - = ~$640/month recovered")
print()

print("="*80)
print("EMAIL TEMPLATE EXAMPLE")
print("="*80)
print()

email_template = """
Subject: Complete your order - Alpha Medical Care

---

Hi {{ customer.first_name | default: "there" }},

You left items in your cart at Alpha Medical Care. Complete your order now to
start your recovery journey!

[PRODUCT IMAGE]
{{ line_item.title }}
{{ line_item.price }}

Cart Total: {{ cart.total_price }}

{% if cart.total_price >= 5000 %}
✅ You qualify for FREE SHIPPING!
{% else %}
{% assign remaining = 5000 | minus: cart.total_price | money %}
Add {{ remaining }} more for FREE SHIPPING
{% endif %}

⏰ Items in high demand - inventory may be limited

[BUTTON: Complete Your Order]
(Links to: {{ url_to_recover }})

---

WHY CHOOSE ALPHA MEDICAL CARE?

✓ 30-Day Money-Back Guarantee
✓ Free Shipping on Orders $50+
✓ 10,000+ Happy Customers
✓ Secure Checkout

---

"Best investment in my recovery! The quality exceeded my expectations."
- Sarah M., Verified Customer

---

Questions? We're here to help!
Email: support@alphamedical.shop
Live Chat: Available 9AM-6PM EST

Alpha Medical Care
[Unsubscribe] | [Privacy Policy]
"""

print(email_template)
print()

print("="*80)
print("IMPORTANT NOTES")
print("="*80)
print()
print("⚠️  Shopify Basic only supports ONE automated email")
print("⚠️  Abandoned CART (pre-checkout) emails NOT available on Basic")
print("⚠️  For multi-email sequence, use Klaviyo (free up to 250 contacts)")
print("⚠️  Test thoroughly with real abandoned checkout scenario")
print("⚠️  Monitor weekly and optimize based on performance")
print("⚠️  CAN-SPAM compliance: Include unsubscribe link")
print("⚠️  Email must be sent within reasonable time (1-24 hours optimal)")
print()

print("CONFIGURATION GUIDE GENERATED SUCCESSFULLY!")
print()
