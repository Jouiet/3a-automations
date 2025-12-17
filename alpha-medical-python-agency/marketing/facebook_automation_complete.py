# Type: agency
# Category: marketing
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
FACEBOOK ADS COMPLETE AUTOMATION - ALPHA MEDICAL
Date: 2025-12-06
Purpose: Automate Facebook/Instagram ad campaigns + audiences creation
SDK: facebook-python-business-sdk
API: Marketing API v22.0 (current as of Jan 2025)

CAPABILITIES:
1. Create campaigns programmatically
2. Create Custom Audiences from Shopify customer data
3. Create Lookalike Audiences (1%, 3%, 5%)
4. Automate audience syncing
5. Campaign performance monitoring

PREREQUISITES:
- Facebook App created with Marketing API
- System User Token (permanent) in .env.admin
- SDK installed: pip install facebook-business
"""

from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.customaudience import CustomAudience
from facebook_business.exceptions import FacebookRequestError

import os
import time
import hashlib
import json
from typing import List, Dict, Optional


class FacebookAdsAutomation:
    """Complete automation for Facebook Ads - Alpha Medical"""

    def __init__(self, config_file="/Users/mac/Desktop/Alpha-Medical/.env.admin"):
        """
        Initialize Facebook Ads automation

        Args:
            config_file: Path to .env.admin with Facebook credentials
        """
        print("\n🚀 Initializing Facebook Ads Automation...")
        self.config = self._load_config(config_file)
        self._init_api()
        self.ad_account = AdAccount(self.config['ad_account_id'])
        print(f"✅ Connected to Ad Account: {self.config['ad_account_id']}\n")

    def _load_config(self, config_file: str) -> Dict[str, str]:
        """Load Facebook config from .env.admin"""
        config = {}
        required_keys = [
            'FACEBOOK_APP_ID',
            'FACEBOOK_APP_SECRET',
            'FACEBOOK_ACCESS_TOKEN',
            'FACEBOOK_AD_ACCOUNT_ID'
        ]

        if not os.path.exists(config_file):
            raise FileNotFoundError(f"Config file not found: {config_file}")

        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('FACEBOOK_APP_ID='):
                    config['app_id'] = line.split('=', 1)[1].strip('"')
                elif line.startswith('FACEBOOK_APP_SECRET='):
                    config['app_secret'] = line.split('=', 1)[1].strip('"')
                elif line.startswith('FACEBOOK_ACCESS_TOKEN='):
                    config['access_token'] = line.split('=', 1)[1].strip('"')
                elif line.startswith('FACEBOOK_AD_ACCOUNT_ID='):
                    config['ad_account_id'] = line.split('=', 1)[1].strip('"')
                elif line.startswith('FACEBOOK_PAGE_ID='):
                    config['page_id'] = line.split('=', 1)[1].strip('"')
                elif line.startswith('FACEBOOK_PIXEL_ID='):
                    config['pixel_id'] = line.split('=', 1)[1].strip('"')

        # Validate required keys
        missing_keys = [key.replace('FACEBOOK_', '').lower() for key in required_keys
                        if key.replace('FACEBOOK_', '').lower() not in config]

        if missing_keys:
            raise ValueError(f"Missing required config keys: {', '.join(missing_keys)}")

        return config

    def _init_api(self):
        """Initialize Facebook Ads API"""
        try:
            FacebookAdsApi.init(
                app_id=self.config['app_id'],
                app_secret=self.config['app_secret'],
                access_token=self.config['access_token']
            )
            print("✅ Facebook Marketing API initialized")

        except Exception as e:
            raise Exception(f"Failed to initialize Facebook API: {str(e)}")

    @staticmethod
    def hash_email(email: str) -> str:
        """Hash email for Facebook privacy (SHA256 lowercase)"""
        return hashlib.sha256(email.lower().strip().encode()).hexdigest()

    @staticmethod
    def hash_phone(phone: str) -> str:
        """Hash phone for Facebook privacy (SHA256 digits only)"""
        clean_phone = ''.join(filter(str.isdigit, phone))
        return hashlib.sha256(clean_phone.encode()).hexdigest()

    def create_campaign(
        self,
        name: str,
        objective: str = 'OUTCOME_SALES',
        daily_budget: int = 5000,
        status: str = 'PAUSED'
    ) -> Campaign:
        """
        Create Facebook campaign

        Args:
            name: Campaign name
            objective: OUTCOME_SALES, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, etc.
            daily_budget: Daily budget in cents (5000 = $50.00)
            status: ACTIVE or PAUSED

        Returns:
            Campaign object

        Raises:
            FacebookRequestError: If API call fails
        """
        try:
            params = {
                Campaign.Field.name: name,
                Campaign.Field.objective: objective,
                Campaign.Field.status: status,
                Campaign.Field.daily_budget: daily_budget,
                Campaign.Field.bid_strategy: Campaign.BidStrategy.lowest_cost_without_cap,
                Campaign.Field.special_ad_categories: [],
            }

            campaign = self.ad_account.create_campaign(
                fields=[],
                params=params
            )

            print(f"✅ Campaign created successfully!")
            print(f"   ID: {campaign['id']}")
            print(f"   Name: {name}")
            print(f"   Objective: {objective}")
            print(f"   Daily Budget: ${daily_budget/100:.2f}")
            print(f"   Status: {status}\n")

            return campaign

        except FacebookRequestError as e:
            print(f"❌ Failed to create campaign:")
            print(f"   Error: {e.api_error_message()}")
            print(f"   Code: {e.api_error_code()}")
            raise

    def create_custom_audience(
        self,
        name: str,
        description: str,
        email_list: List[str]
    ) -> CustomAudience:
        """
        Create custom audience from email list

        Args:
            name: Audience name
            description: Audience description
            email_list: List of customer emails

        Returns:
            CustomAudience object

        Raises:
            FacebookRequestError: If API call fails
        """
        try:
            # Create audience
            params = {
                CustomAudience.Field.name: name,
                CustomAudience.Field.subtype: CustomAudience.Subtype.custom,
                CustomAudience.Field.description: description,
                CustomAudience.Field.customer_file_source:
                    CustomAudience.CustomerFileSource.user_provided_only,
            }

            audience = self.ad_account.create_custom_audience(
                fields=[],
                params=params
            )

            print(f"✅ Custom Audience created: {audience['id']}")

            # Hash and upload emails (batches of 10,000)
            schema = [CustomAudience.Schema.email]
            users = [[self.hash_email(email)] for email in email_list]

            batch_size = 10000
            total_uploaded = 0

            for i in range(0, len(users), batch_size):
                batch = users[i:i+batch_size]

                audience.add_users(
                    schema=schema,
                    users=batch,
                    is_raw=False  # Already hashed
                )

                total_uploaded += len(batch)
                print(f"   Uploaded {len(batch)} users (batch {i//batch_size + 1})")

            print(f"✅ Total users uploaded: {total_uploaded}\n")

            return audience

        except FacebookRequestError as e:
            print(f"❌ Failed to create custom audience:")
            print(f"   Error: {e.api_error_message()}")
            raise

    def create_lookalike_audience(
        self,
        name: str,
        source_audience_id: str,
        country: str = 'US',
        ratio: float = 0.01
    ) -> CustomAudience:
        """
        Create lookalike audience from existing custom audience

        Args:
            name: Lookalike audience name
            source_audience_id: ID of source custom audience
            country: Target country (2-letter code: US, CA, FR, etc.)
            ratio: Similarity ratio 0.01-0.10 (1%-10%)

        Returns:
            CustomAudience object (lookalike)

        Raises:
            FacebookRequestError: If API call fails
        """
        try:
            params = {
                CustomAudience.Field.name: name,
                CustomAudience.Field.subtype: CustomAudience.Subtype.lookalike,
                CustomAudience.Field.lookalike_spec: {
                    'ratio': ratio,
                    'country': country,
                    'starting_ratio': 0.0,
                    'type': 'similarity',
                },
                CustomAudience.Field.origin_audience_id: source_audience_id,
            }

            lookalike = self.ad_account.create_custom_audience(
                fields=[],
                params=params
            )

            print(f"✅ Lookalike Audience created!")
            print(f"   ID: {lookalike['id']}")
            print(f"   Source: {source_audience_id}")
            print(f"   Country: {country}")
            print(f"   Similarity: {int(ratio*100)}%\n")

            return lookalike

        except FacebookRequestError as e:
            print(f"❌ Failed to create lookalike:")
            print(f"   Error: {e.api_error_message()}")
            raise

    def run_complete_automation(
        self,
        customer_emails: List[str],
        campaign_name: str = "Alpha Medical - Pain Relief Products",
        campaign_budget: int = 5000
    ) -> Dict:
        """
        Run complete automation workflow

        Steps:
        1. Create campaign
        2. Create custom audience from customer emails
        3. Create 3 lookalike audiences (1%, 3%, 5%)

        Args:
            customer_emails: List of customer emails from Shopify
            campaign_name: Name for the campaign
            campaign_budget: Daily budget in cents ($50 = 5000)

        Returns:
            Dict with campaign, custom_audience, and lookalikes
        """
        print("\n" + "="*60)
        print("🚀 RUNNING COMPLETE AUTOMATION WORKFLOW")
        print("="*60 + "\n")

        results = {}

        # Step 1: Create campaign
        print("Step 1/4: Creating campaign...")
        campaign = self.create_campaign(
            name=f"{campaign_name} - Automated",
            objective='OUTCOME_SALES',
            daily_budget=campaign_budget,
            status='PAUSED'  # Start paused for review
        )
        results['campaign'] = campaign
        time.sleep(2)

        # Step 2: Create custom audience
        print("Step 2/4: Creating custom audience...")
        custom_audience = self.create_custom_audience(
            name=f"{campaign_name} - Existing Customers",
            description="High-value customers from Shopify - Auto-created",
            email_list=customer_emails
        )
        results['custom_audience'] = custom_audience
        time.sleep(5)  # Wait for audience to process

        # Step 3: Create lookalikes
        print("Step 3/4: Creating lookalike audiences...")
        lookalikes = []
        for ratio in [0.01, 0.03, 0.05]:
            lookalike = self.create_lookalike_audience(
                name=f"{campaign_name} - Lookalike {int(ratio*100)}% US",
                source_audience_id=custom_audience['id'],
                country='US',
                ratio=ratio
            )
            lookalikes.append(lookalike)
            time.sleep(2)

        results['lookalikes'] = lookalikes

        # Step 4: Summary
        print("="*60)
        print("✅ AUTOMATION COMPLETE!")
        print("="*60)
        print(f"\n📊 Results:")
        print(f"   Campaign ID: {campaign['id']}")
        print(f"   Custom Audience ID: {custom_audience['id']}")
        print(f"   Lookalike Audiences: {len(lookalikes)} created")
        print(f"\n📋 Next Steps:")
        print(f"   1. Wait 6-24h for lookalike audiences to populate")
        print(f"   2. Create Ad Sets targeting lookalike audiences")
        print(f"   3. Create Ads with creative assets")
        print(f"   4. Review campaign in Facebook Ads Manager")
        print(f"   5. Activate campaign when ready")
        print(f"\n🔗 View in Ads Manager:")
        print(f"   https://business.facebook.com/adsmanager/manage/campaigns?act={self.config['ad_account_id']}")

        return results


def load_shopify_customer_emails() -> List[str]:
    """
    Load customer emails from Shopify

    TODO: Implement Shopify API integration
    For now, returns example data
    """
    # Example: Replace with actual Shopify API call
    return [
        "customer1@example.com",
        "customer2@example.com",
        # Add real customer emails from Shopify
    ]


def main():
    """Main execution"""
    try:
        # Initialize automation
        automation = FacebookAdsAutomation()

        # Load customer emails (from Shopify)
        customer_emails = load_shopify_customer_emails()

        if len(customer_emails) < 100:
            print("⚠️  WARNING: Minimum 100 emails recommended for best results")
            print(f"   Current: {len(customer_emails)} emails")

        # Run complete automation
        results = automation.run_complete_automation(
            customer_emails=customer_emails,
            campaign_name="Alpha Medical - Pain Relief Products",
            campaign_budget=5000  # $50/day
        )

        # Save results
        output_file = "/Users/mac/Desktop/Alpha-Medical/facebook_automation_results.json"
        with open(output_file, 'w') as f:
            json.dump({
                'campaign_id': results['campaign']['id'],
                'custom_audience_id': results['custom_audience']['id'],
                'lookalike_ids': [la['id'] for la in results['lookalikes']],
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }, f, indent=2)

        print(f"\n✅ Results saved to: {output_file}")

    except Exception as e:
        print(f"\n❌ Automation failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
