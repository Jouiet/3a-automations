# Type: agency
# Category: setup
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
ReConvert Upsell Configuration for Alpha Medical Care
Post-purchase upsells for AOV +10-15% increase

Implementation: Manual via ReConvert app UI
"""

print("="*80)
print("RECONVERT POST-PURCHASE UPSELL CONFIGURATION")
print("="*80)
print()

print("APP INFO:")
print("  Name: ReConvert Upsell & Cross Sell")
print("  Cost: $4.99/month (or FREE trial)")
print("  Status: ✅ INSTALLED")
print("  Purpose: Post-purchase upsells on thank you page")
print("  Expected Impact: +10-15% AOV, +$500-800/month revenue")
print()

print("="*80)
print("CONFIGURATION STEPS (45-60 min)")
print("="*80)
print()

print("STEP 1: ACCESS RECONVERT APP")
print("-" * 40)
print("1. Shopify Admin → Apps → ReConvert Upsell & Cross Sell")
print("2. If prompted, complete onboarding wizard")
print("3. You'll land on ReConvert dashboard")
print()

print("STEP 2: ENABLE THANK YOU PAGE FUNNEL")
print("-" * 40)
print("1. In ReConvert dashboard, click 'Funnels'")
print("2. Click 'Create New Funnel' or 'Thank You Page Funnel'")
print("3. Choose funnel type: 'One Click Upsell'")
print("4. Name: 'Post-Purchase Upsells - Alpha Medical'")
print()

print("STEP 3: CONFIGURE UPSELL PRODUCT RULES")
print("-" * 40)
print()
print("Set up 5 strategic upsell rules:")
print()

print("RULE 1: Neck Pain Products → Eye Massager")
print("  IF customer bought: Products containing 'neck' OR 'cervical'")
print("  THEN show upsell: Heat & Music Eye Massager")
print("  Rationale: Neck pain often accompanies eye strain/headaches")
print("  Discount: 10% off")
print()

print("RULE 2: Knee Products → Leg Massager")
print("  IF customer bought: Products containing 'knee'")
print("  THEN show upsell: Air Compression Leg Massager")
print("  Rationale: Complete lower body recovery")
print("  Discount: 10% off")
print()

print("RULE 3: Back Support → Lumbar Massager")
print("  IF customer bought: Products containing 'back' OR 'posture'")
print("  THEN show upsell: Electric Lumbar Massager")
print("  Rationale: Active therapy + passive support")
print("  Discount: 10% off")
print()

print("RULE 4: LED Masks → Eye Mask")
print("  IF customer bought: Products containing 'LED' OR 'light therapy'")
print("  THEN show upsell: Anti-Aging LED Eye Mask")
print("  Rationale: Complete facial care system")
print("  Discount: 10% off")
print()

print("RULE 5: EMS Products → Additional EMS")
print("  IF customer bought: Products containing 'EMS'")
print("  THEN show upsell: EMS Abdominal Belt OR EMS Hip Trainer")
print("  Rationale: Full body toning system")
print("  Discount: 10% off")
print()

print("STEP 4: DESIGN UPSELL WIDGET")
print("-" * 40)
print("1. In funnel editor, customize widget design:")
print("   - Headline: 'Complete Your Recovery Kit!'")
print("   - Subheading: 'Customers who bought [product] also love...'")
print("   - Button text: 'Add to My Order'")
print("   - Secondary button: 'No Thanks'")
print()
print("2. Add trust elements:")
print("   - '10,000+ Happy Customers'")
print("   - 'Free Shipping on Orders $50+'")
print("   - '30-Day Money-Back Guarantee'")
print()
print("3. Style settings:")
print("   - Primary color: #4770DB (brand blue)")
print("   - Button style: Solid, rounded corners")
print("   - Image size: Medium (product images)")
print()

print("STEP 5: ENABLE BIRTHDAY COLLECTOR")
print("-" * 40)
print("1. In ReConvert → Widgets → Birthday Collector")
print("2. Enable widget on thank you page")
print("3. Customize text:")
print("   'Get a special gift on your birthday! 🎂'")
print("4. Form fields:")
print("   - Birthday (MM/DD)")
print("   - Optional: Name")
print("5. Save and activate")
print()

print("STEP 6: CONFIGURE POST-PURCHASE SURVEY (OPTIONAL)")
print("-" * 40)
print("1. In ReConvert → Surveys")
print("2. Create survey:")
print("   Question: 'How did you hear about us?'")
print("   Options:")
print("     - Google Search")
print("     - Social Media")
print("     - Friend Referral")
print("     - Other")
print("3. Place survey below upsell on thank you page")
print()

print("STEP 7: SET DISCOUNT CODES")
print("-" * 40)
print("1. Go to Shopify Admin → Discounts")
print("2. Create discount code: 'UPSELL10'")
print("   - Type: Percentage")
print("   - Value: 10%")
print("   - Applies to: Specific products (upsell products)")
print("   - Minimum: None")
print("   - Usage: Unlimited")
print("3. Copy discount code")
print("4. In ReConvert, paste code in upsell settings")
print()

print("STEP 8: ENABLE FUNNEL")
print("-" * 40)
print("1. Review all settings in funnel")
print("2. Click 'Activate Funnel'")
print("3. Confirm activation")
print("4. Status should show: '✅ Active'")
print()

print("STEP 9: TEST POST-PURCHASE FLOW")
print("-" * 40)
print("1. Place a test order:")
print("   a. Add a neck massager to cart")
print("   b. Proceed to checkout")
print("   c. Complete purchase (use test payment if available)")
print()
print("2. On thank you page, verify:")
print("   ✓ Order confirmation shows")
print("   ✓ ReConvert upsell widget appears")
print("   ✓ Correct product recommendation (Eye Massager)")
print("   ✓ '10% off' discount shows")
print("   ✓ 'Add to My Order' button works")
print("   ✓ Birthday collector widget shows")
print()
print("3. Test one-click upsell:")
print("   a. Click 'Add to My Order'")
print("   b. Verify product added without re-entering payment")
print("   c. Check confirmation email includes upsell product")
print()

print("STEP 10: MONITOR PERFORMANCE")
print("-" * 40)
print("1. ReConvert Dashboard → Analytics")
print("2. Track metrics:")
print("   - Upsell acceptance rate (target: 10-15%)")
print("   - Average upsell order value")
print("   - Total additional revenue")
print("   - Birthday collection rate")
print()
print("3. Weekly optimization:")
print("   - Review top/bottom performing upsells")
print("   - Adjust product recommendations")
print("   - Test different discount levels (5%, 10%, 15%)")
print("   - A/B test widget copy")
print()

print("="*80)
print("EXPECTED RESULTS")
print("="*80)
print()
print("✅ Upsell Acceptance Rate: 10-15%")
print("✅ AOV Increase: +10-15%")
print("✅ Additional Revenue: $500-800/month")
print("   (Assumes 50 orders/month × 12% acceptance × $80 avg upsell)")
print("✅ Birthday Collection: 30-40% of customers")
print("✅ Customer Satisfaction: Enhanced shopping experience")
print()

print("="*80)
print("PRODUCT PAIRING RECOMMENDATIONS")
print("="*80)
print()

upsell_matrix = {
    "Neck/Cervical Products": [
        "Heat & Music Eye Massager ($39.99)",
        "Shoulder Vibration Massager ($44.99)",
        "LED Face & Neck Mask ($89.99)"
    ],
    "Knee Products": [
        "Air Compression Leg Massager ($79.99)",
        "Foreverlily Smart Knee Massager ($59.99)",
        "Adjustable Knee Brace ($34.99)"
    ],
    "Back/Posture Products": [
        "Electric Lumbar Massager ($69.99)",
        "Vibration Shoulder Steamer ($54.99)",
        "Posture Corrector ($24.99)"
    ],
    "LED Light Therapy": [
        "Anti-Aging LED Eye Mask ($79.99)",
        "Electric Gua Sha Board ($34.99)",
        "V-Line Face Slimming Device ($49.99)"
    ],
    "EMS Products": [
        "EMS Abdominal Belt ($39.99)",
        "EMS Hip Trainer ($44.99)",
        "Smart Hip Trainer ($54.99)"
    ],
    "Massage Therapy": [
        "Lymphatic Drainage Brush ($29.99)",
        "Electric Gua Sha Board ($34.99)",
        "Sleep Mask with Bluetooth ($19.99)"
    ]
}

for category, products in upsell_matrix.items():
    print(f"{category}:")
    for product in products:
        print(f"  → {product}")
    print()

print("="*80)
print("IMPORTANT NOTES")
print("="*80)
print()
print("⚠️  ReConvert requires manual UI configuration")
print("⚠️  Estimated setup time: 45-60 minutes")
print("⚠️  Test thoroughly with real checkout flow")
print("⚠️  Monitor performance weekly and optimize")
print("⚠️  Free trial available - activate before paid plan")
print("⚠️  One-click upsell only works AFTER initial payment")
print()

print("CONFIGURATION GUIDE GENERATED SUCCESSFULLY!")
print()
