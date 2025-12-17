#!/usr/bin/env python3
"""
Facebook Lead Ads Campaign Creator - Automated via API
Based on official Facebook Marketing API samples (fbsamples/marketing-api-samples)

Creates complete Lead Generation campaign including:
1. Campaign (objective: lead_generation)
2. AdSet (optimization_goal: LEAD_GENERATION)
3. AdCreative (with Lead Form)
4. Ad (final deliverable)

Requirements:
  - facebook-business library
  - python-dotenv

Install: pip install facebook-business python-dotenv

Usage:
  python create_facebook_lead_campaign.py

Environment Variables (in .env):
  - FACEBOOK_ACCESS_TOKEN (USER token with ads_management permission)
  - FACEBOOK_APP_SECRET
  - FACEBOOK_APP_ID
  - FACEBOOK_LEAD_FORM_ID (Form ID: 1350726643258258)
  - FACEBOOK_AD_ACCOUNT_ID (e.g., act_123456789)
  - FACEBOOK_PAGE_ID (MyDealz page: 877703598755833)

Date: 2025-12-06
Session: 55
Source: https://github.com/fbsamples/marketing-api-samples/blob/master/samples/samplecode/lead_ad.py
"""

import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv

# Try to import Facebook SDK
try:
    from facebook_business.api import FacebookAdsApi
    from facebook_business.adobjects.adaccount import AdAccount
    from facebook_business.adobjects.campaign import Campaign
    from facebook_business.adobjects.adset import AdSet
    from facebook_business.adobjects.ad import Ad
    from facebook_business.adobjects.adcreative import AdCreative
    from facebook_business.adobjects.adimage import AdImage
    from facebook_business.adobjects.targeting import Targeting
except ImportError:
    print("❌ ERROR: facebook-business library not installed")
    print("📦 Install with: pip install facebook-business")
    sys.exit(1)

# Load environment variables
load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

# Facebook API credentials
ACCESS_TOKEN = os.getenv('FACEBOOK_ACCESS_TOKEN')
APP_SECRET = os.getenv('FACEBOOK_APP_SECRET')
APP_ID = os.getenv('FACEBOOK_APP_ID')
FORM_ID = os.getenv('FACEBOOK_LEAD_FORM_ID', '1350726643258258')  # Default from Session 51
AD_ACCOUNT_ID = os.getenv('FACEBOOK_AD_ACCOUNT_ID')  # act_XXXXXXXXX
PAGE_ID = os.getenv('FACEBOOK_PAGE_ID', '877703598755833')  # MyDealz page

# Campaign Configuration
CAMPAIGN_NAME = "MyDealz Winter Contest - Lead Generation"
DAILY_BUDGET = 1000  # $10.00 USD (in cents)
BID_AMOUNT = 150  # $1.50 USD max bid per lead (in cents)

# TARGETING: Simplified for Advantage+ Audience (advantage_audience=1)
# When using Advantage+ Audience, only geo_locations is allowed
# Facebook AI optimizes age, gender, interests automatically
TARGETING_CONFIG = {
    'geo_locations': {
        'countries': ['CA'],  # Canada
    }
}

# Creative Configuration
AD_MESSAGE = "❄️ Enter to win a premium winter coat worth $300! Limited time contest - Enter now for your chance to win. Click below to participate! 🎁"
AD_LINK = "https://mydealz.shop/pages/winter-coat-giveaway"
AD_CAPTION = "Win a $300 Winter Coat - Free Entry!"
AD_DESCRIPTION = "No purchase necessary. Contest ends soon. Winner announced next week."
AD_IMAGE_PATH = None  # Optional: path to image file, or None to skip image upload
CTA_TYPE = 'SIGN_UP'  # Call-to-action button type

# ============================================================================
# VALIDATION
# ============================================================================

def validate_config():
    """Validate that all required environment variables are set"""
    missing = []

    if not ACCESS_TOKEN:
        missing.append('FACEBOOK_ACCESS_TOKEN')
    if not APP_SECRET:
        missing.append('FACEBOOK_APP_SECRET')
    if not APP_ID:
        missing.append('FACEBOOK_APP_ID')
    if not FORM_ID:
        missing.append('FACEBOOK_LEAD_FORM_ID')
    if not AD_ACCOUNT_ID:
        missing.append('FACEBOOK_AD_ACCOUNT_ID')
    if not PAGE_ID:
        missing.append('FACEBOOK_PAGE_ID')

    if missing:
        print("❌ ERROR: Missing required environment variables:")
        for var in missing:
            print(f"   - {var}")
        print("\n📝 Add these variables to your .env file")
        print("   FACEBOOK_AD_ACCOUNT_ID format: act_XXXXXXXXX")
        print("   FACEBOOK_PAGE_ID: 877703598755833 (MyDealz page)")
        sys.exit(1)

    # Validate AD_ACCOUNT_ID format
    if not AD_ACCOUNT_ID.startswith('act_'):
        print("❌ ERROR: FACEBOOK_AD_ACCOUNT_ID must start with 'act_'")
        print(f"   Current value: {AD_ACCOUNT_ID}")
        print("   Expected format: act_123456789")
        sys.exit(1)

    print("✅ Configuration validated")
    print(f"   Ad Account: {AD_ACCOUNT_ID}")
    print(f"   Page ID: {PAGE_ID}")
    print(f"   Form ID: {FORM_ID}")
    print()

# ============================================================================
# FACEBOOK API INITIALIZATION
# ============================================================================

def init_api():
    """Initialize Facebook Ads API"""
    try:
        FacebookAdsApi.init(
            app_id=APP_ID,
            app_secret=APP_SECRET,
            access_token=ACCESS_TOKEN
        )
        print("✅ Facebook API initialized")
        return True
    except Exception as e:
        print(f"❌ ERROR initializing Facebook API: {e}")
        return False

# ============================================================================
# LEAD ADS CAMPAIGN CREATION (Official Facebook Sample Code)
# ============================================================================

def create_lead_ads_campaign():
    """
    Create complete Lead Ads campaign following official Facebook sample

    Source: https://github.com/fbsamples/marketing-api-samples/blob/master/samples/samplecode/lead_ad.py

    Returns:
        dict: Campaign details with IDs
    """

    try:
        # Step 1: Create Campaign
        print("📋 Creating Campaign...")
        campaign = Campaign(parent_id=AD_ACCOUNT_ID)
        campaign[Campaign.Field.name] = CAMPAIGN_NAME
        campaign[Campaign.Field.objective] = 'OUTCOME_LEADS'  # Facebook API v24.0+ (was LEAD_GENERATION)
        campaign[Campaign.Field.buying_type] = 'AUCTION'  # REQUIRED!
        campaign[Campaign.Field.special_ad_categories] = []  # REQUIRED by Facebook 2024+
        campaign['is_adset_budget_sharing_enabled'] = False  # Avoid bid_strategy requirement
        campaign[Campaign.Field.status] = 'PAUSED'  # Start paused

        campaign.remote_create()
        campaign_id = campaign.get_id_assured()
        print(f"✅ Campaign created: {campaign_id}")
        print(f"   Name: {CAMPAIGN_NAME}")
        print(f"   Objective: lead_generation")
        print()

        # Step 2: Create AdSet
        print("📊 Creating AdSet...")
        adset = AdSet(parent_id=AD_ACCOUNT_ID)
        adset[AdSet.Field.campaign_id] = campaign_id
        adset[AdSet.Field.name] = CAMPAIGN_NAME + ' - AdSet'
        adset[AdSet.Field.promoted_object] = {'page_id': PAGE_ID}  # CRITICAL for Lead Ads!
        adset[AdSet.Field.optimization_goal] = 'LEAD_GENERATION'  # LEAD_GENERATION
        adset[AdSet.Field.billing_event] = 'IMPRESSIONS'  # IMPRESSIONS
        adset[AdSet.Field.bid_strategy] = 'LOWEST_COST_WITH_BID_CAP'  # API v24/v25 requirement
        adset[AdSet.Field.bid_amount] = BID_AMOUNT  # $1.50 max bid per lead (with bid_strategy)
        adset[AdSet.Field.daily_budget] = DAILY_BUDGET  # $10/day
        adset[AdSet.Field.targeting] = TARGETING_CONFIG
        adset['targeting_automation'] = {'advantage_audience': 1}  # Enable Advantage+ audience (AI optimization)
        adset['destination_type'] = 'ON_AD'  # Required for Lead Forms (instant forms)
        adset[AdSet.Field.status] = 'PAUSED'  # Start paused

        adset.remote_create()
        adset_id = adset.get_id_assured()
        print(f"✅ AdSet created: {adset_id}")
        print(f"   Optimization: LEAD_GENERATION")
        print(f"   Billing: IMPRESSIONS")
        print(f"   Daily Budget: ${DAILY_BUDGET/100:.2f}")
        print(f"   Max Bid: ${BID_AMOUNT/100:.2f} per lead")
        print()

        # Step 3: Upload Image (if provided)
        image_hash = None
        if AD_IMAGE_PATH and os.path.exists(AD_IMAGE_PATH):
            print("📷 Uploading Ad Image...")
            image = AdImage(parent_id=AD_ACCOUNT_ID)
            image[AdImage.Field.filename] = AD_IMAGE_PATH
            image.remote_create()
            image_hash = image[AdImage.Field.hash]
            print(f"✅ Image uploaded: {image_hash}")
            print()
        else:
            print("⚠️  No image provided (AD_IMAGE_PATH not set or file not found)")
            print("   Creating ad without image (Facebook will use default)")
            print()

        # Step 4: Create AdCreative with Lead Form
        print("🎨 Creating AdCreative...")

        # Link Data (ad content)
        # NOTE: For Lead Ads with instant forms, caption/description not required
        # Lead Form has its own intro text and field labels
        link_data = {
            'message': AD_MESSAGE,
            'link': AD_LINK,
            'call_to_action': {
                'type': CTA_TYPE,  # SIGN_UP
                'value': {
                    'lead_gen_form_id': FORM_ID  # CRITICAL: Link to Lead Form!
                }
            }
        }

        # Add image hash if available
        if image_hash:
            link_data['image_hash'] = image_hash

        # Object Story Spec
        object_story_spec = {
            'page_id': PAGE_ID,
            'link_data': link_data
        }

        creative = AdCreative(parent_id=AD_ACCOUNT_ID)
        creative[AdCreative.Field.name] = CAMPAIGN_NAME + ' - Creative'
        creative[AdCreative.Field.object_story_spec] = object_story_spec

        creative.remote_create()
        creative_id = creative.get_id_assured()
        print(f"✅ AdCreative created: {creative_id}")
        print(f"   Message: {AD_MESSAGE[:50]}...")
        print(f"   CTA: {CTA_TYPE}")
        print(f"   Lead Form ID: {FORM_ID}")
        print()

        # Step 5: Create Ad
        print("📢 Creating Ad...")
        ad = Ad(parent_id=AD_ACCOUNT_ID)
        ad[Ad.Field.name] = CAMPAIGN_NAME
        ad[Ad.Field.adset_id] = adset_id
        ad[Ad.Field.creative] = {'creative_id': str(creative_id)}
        ad[Ad.Field.status] = 'PAUSED'  # Start paused

        ad.remote_create()
        ad_id = ad.get_id_assured()
        print(f"✅ Ad created: {ad_id}")
        print()

        # Return campaign details
        return {
            'success': True,
            'campaign_id': campaign_id,
            'adset_id': adset_id,
            'creative_id': creative_id,
            'ad_id': ad_id,
            'image_hash': image_hash,
            'campaign_name': CAMPAIGN_NAME,
            'daily_budget': f"${DAILY_BUDGET/100:.2f}",
            'max_bid_per_lead': f"${BID_AMOUNT/100:.2f}",
            'targeting': 'Canada, Advantage+ Audience (AI-optimized)',
            'status': 'PAUSED (ready to activate)',
        }

    except Exception as e:
        print(f"❌ ERROR creating campaign: {e}")
        print(f"   Error type: {type(e).__name__}")
        if hasattr(e, 'api_error_message'):
            print(f"   API Error: {e.api_error_message()}")
        if hasattr(e, 'api_error_code'):
            print(f"   Error Code: {e.api_error_code()}")
        if hasattr(e, 'api_error_subcode'):
            print(f"   Error Subcode: {e.api_error_subcode()}")
        return {
            'success': False,
            'error': str(e)
        }

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main execution"""
    print("═══════════════════════════════════════════════════════")
    print("📱 FACEBOOK LEAD ADS CAMPAIGN CREATOR - AUTOMATED")
    print("   Based on Official Facebook Marketing API Samples")
    print("═══════════════════════════════════════════════════════")
    print()

    # Validate configuration
    validate_config()

    # Initialize API
    if not init_api():
        sys.exit(1)
    print()

    # Create campaign
    print("🚀 Creating Lead Ads Campaign...")
    print("─────────────────────────────────────────────────────")
    print()

    result = create_lead_ads_campaign()

    print()
    print("═══════════════════════════════════════════════════════")

    if result['success']:
        print("✅ CAMPAIGN CREATED SUCCESSFULLY!")
        print()
        print("📊 Campaign Details:")
        print(f"   Campaign ID: {result['campaign_id']}")
        print(f"   AdSet ID: {result['adset_id']}")
        print(f"   Creative ID: {result['creative_id']}")
        print(f"   Ad ID: {result['ad_id']}")
        print()
        print("⚙️  Campaign Settings:")
        print(f"   Name: {result['campaign_name']}")
        print(f"   Daily Budget: {result['daily_budget']}")
        print(f"   Max Bid per Lead: {result['max_bid_per_lead']}")
        print(f"   Targeting: {result['targeting']}")
        print(f"   Status: {result['status']}")
        print()
        print("📌 Next Steps:")
        print("   1. Review campaign in Facebook Ads Manager:")
        print("      https://business.facebook.com/adsmanager")
        print()
        print("   2. Activate campaign when ready:")
        print("      - Change status from PAUSED to ACTIVE")
        print("      - Facebook will review (24-48h)")
        print()
        print("   3. Monitor leads:")
        print("      - GitHub Actions will auto-import daily at 2 PM UTC")
        print("      - Check Google Sheets for leads")
        print()
        print("🎯 Expected Performance:")
        print("   - Budget: $10/day × 14 days = $140 total")
        print("   - Expected: 93-140 leads (at $1.00-1.50 CPL)")
        print("   - Qualified: 65-98 leads (70% rate)")
        print("   - Revenue: $650-1,960 (at $10-20 LTV)")
        print("   - ROI: 364-1,300%")
        print()
        print("═══════════════════════════════════════════════════════")

        # Save campaign details to JSON
        output_file = f"lead-management/campaigns/facebook-lead-campaign-{datetime.now().strftime('%Y-%m-%d')}.json"
        os.makedirs('lead-management/campaigns', exist_ok=True)

        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)

        print(f"💾 Campaign details saved to: {output_file}")

    else:
        print("❌ CAMPAIGN CREATION FAILED")
        print()
        print(f"Error: {result.get('error', 'Unknown error')}")
        print()
        print("📚 Troubleshooting:")
        print("   1. Verify FACEBOOK_AD_ACCOUNT_ID format: act_XXXXXXXXX")
        print("   2. Check USER Access Token permissions (ads_management)")
        print("   3. Ensure Lead Form exists (Form ID: 1350726643258258)")
        print("   4. Verify Facebook Page ID (877703598755833)")
        print()
        sys.exit(1)

if __name__ == "__main__":
    main()
