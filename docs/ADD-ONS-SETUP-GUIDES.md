# ADD-ONS SETUP GUIDES
> Version: 1.0 | Date: 25/01/2026 | Session: 160+
> Phase 3 Documentation Complete

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Add-On Setup Guides](#add-on-setup-guides)
   - [#1 Anti-Churn AI](#1-anti-churn-ai)
   - [#2 Review Booster](#2-review-booster)
   - [#3 Replenishment Reminder](#3-replenishment-reminder)
   - [#4 Email Cart Series AI](#4-email-cart-series-ai)
   - [#5 SMS Automation](#5-sms-automation)
   - [#6 Price Drop Alerts](#6-price-drop-alerts)
   - [#7 WhatsApp Booking](#7-whatsapp-booking)
   - [#8 Blog Factory AI](#8-blog-factory-ai)
   - [#9 Podcast Generator](#9-podcast-generator)
   - [#10 Dropshipping Suite](#10-dropshipping-suite)
3. [HITL Configuration Reference](#hitl-configuration-reference)
4. [FAQ](#faq)

---

## Prerequisites

### Common Requirements (All Add-Ons)

| Requirement | How to Obtain |
|-------------|---------------|
| Node.js 18+ | [nodejs.org](https://nodejs.org) |
| Git | [git-scm.com](https://git-scm.com) |
| 3A Automation subscription | [3a-automation.com/pricing](https://3a-automation.com/pricing.html) |

### Environment Variables Setup

Create `.env` file in root directory:

```bash
# Copy template
cp .env.example .env

# Edit with your credentials
nano .env
```

---

## Add-On Setup Guides

---

### #1 Anti-Churn AI

**Script:** `automations/agency/core/churn-prediction-resilient.cjs`

#### Required Credentials

| Variable | Source | How to Get |
|----------|--------|------------|
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo | Account → Settings → API Keys → Create Private Key |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify | Admin → Settings → Apps → Develop apps → Create app |
| `ANTHROPIC_API_KEY` | Anthropic | [console.anthropic.com](https://console.anthropic.com) |
| `XAI_API_KEY` | xAI (Grok) | [x.ai/api](https://x.ai/api) |
| `GEMINI_API_KEY` | Google | [aistudio.google.com](https://aistudio.google.com) |
| `OPENAI_API_KEY` | OpenAI | [platform.openai.com](https://platform.openai.com) |

#### Installation

```bash
# 1. Verify script exists
ls automations/agency/core/churn-prediction-resilient.cjs

# 2. Check health
node automations/agency/core/churn-prediction-resilient.cjs --health

# 3. Run analysis
node automations/agency/core/churn-prediction-resilient.cjs --analyze

# 4. View at-risk customers
node automations/agency/core/churn-prediction-resilient.cjs --list-at-risk
```

#### HITL Configuration

```bash
# Environment variables
LTV_THRESHOLD=500          # Customers above €500 LTV require approval
HITL_ENABLED=true          # Enable human approval for high-value

# CLI Commands
--list-interventions       # List pending approvals
--approve-intervention ID  # Approve intervention
--reject-intervention ID   # Reject intervention
```

#### Expected Output

```
✅ Churn Prediction Health Check
├── Klaviyo API: Connected (245 profiles)
├── Shopify API: Connected (1,203 orders)
├── AI Provider: anthropic (primary)
└── RFM Scoring: Ready

At-Risk Customers: 12
├── High LTV (>€500): 3 (require approval)
└── Standard: 9 (auto-intervention)
```

---

### #2 Review Booster

**Script:** `automations/agency/core/review-request-automation.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify |

#### Installation

```bash
# 1. Health check
node automations/agency/core/review-request-automation.cjs --health

# 2. Run review campaign
node automations/agency/core/review-request-automation.cjs --run

# 3. View stats
node automations/agency/core/review-request-automation.cjs --stats
```

#### HITL Configuration

**None required** - This add-on is fully automated (low risk).

| Parameter | Default | Description |
|-----------|---------|-------------|
| `REVIEW_DELAY_DAYS` | 7 | Days after delivery before sending request |
| `PHOTO_INCENTIVE` | 10 | Discount percentage for photo reviews |

---

### #3 Replenishment Reminder

**Script:** `automations/agency/core/replenishment-reminder.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify |

#### Installation

```bash
# 1. Health check
node automations/agency/core/replenishment-reminder.cjs --health

# 2. Configure consumption rates (one-time)
node automations/agency/core/replenishment-reminder.cjs --configure-products

# 3. Run reminders
node automations/agency/core/replenishment-reminder.cjs --run
```

#### Product Configuration

Create `data/consumption-rates.json`:

```json
{
  "products": [
    {
      "sku": "CREAM-001",
      "name": "Hydrating Cream 50ml",
      "avg_consumption_days": 30
    },
    {
      "sku": "SERUM-002",
      "name": "Vitamin C Serum 30ml",
      "avg_consumption_days": 45
    }
  ]
}
```

#### HITL Configuration

**None required** - Fully automated based on consumption data.

---

### #4 Email Cart Series AI

**Script:** `automations/agency/core/email-personalization-resilient.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo |
| `ANTHROPIC_API_KEY` | Anthropic (or other AI provider) |

#### Installation

```bash
# 1. Health check
node automations/agency/core/email-personalization-resilient.cjs --health

# 2. Preview mode (default - requires approval)
node automations/agency/core/email-personalization-resilient.cjs --preview

# 3. List pending previews
node automations/agency/core/email-personalization-resilient.cjs --list-previews

# 4. Approve and send
node automations/agency/core/email-personalization-resilient.cjs --approve-preview ID
```

#### HITL Configuration

```bash
# Environment variables
PREVIEW_MODE=true           # Default: true (AI emails saved for review)
AUTO_SEND_DELAY_HOURS=24    # Hours before auto-send if no action

# CLI Commands
--list-previews            # List pending email previews
--view-preview ID          # View specific email content
--approve-preview ID       # Approve and send
--reject-preview ID        # Reject and delete
--approve-all              # Approve all pending (use with caution)
```

#### Email Series Timing

| Email | Delay | Content |
|-------|-------|---------|
| Email 1 | 1 hour | Cart reminder + products |
| Email 2 | 24 hours | Social proof + urgency |
| Email 3 | 72 hours | Final offer + discount |

---

### #5 SMS Automation

**Script:** `automations/agency/core/sms-automation-resilient.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `OMNISEND_API_KEY` | Omnisend → Settings → API Keys |
| `TWILIO_ACCOUNT_SID` | Twilio (fallback) |
| `TWILIO_AUTH_TOKEN` | Twilio (fallback) |
| `TWILIO_PHONE_NUMBER` | Twilio (fallback) |

#### Installation

```bash
# 1. Health check
node automations/agency/core/sms-automation-resilient.cjs --health

# 2. Test SMS (dry-run)
node automations/agency/core/sms-automation-resilient.cjs --test --phone=+33612345678

# 3. Run automation
node automations/agency/core/sms-automation-resilient.cjs --run
```

#### HITL Configuration

```bash
# Environment variables (Session 160)
SMS_DAILY_MAX=50            # Maximum daily spend in EUR (default: 50)
SMS_ALERT_THRESHOLD=0.8     # Alert at 80% of limit (default: 0.8)
SMS_BLOCK_ON_EXCEED=true    # Block sending when limit exceeded
SMS_ALERT_WEBHOOK=          # Slack/Discord webhook URL for alerts

# CLI Commands
--daily-stats              # View today's SMS spend
--reset-daily-limit        # Reset daily counter (admin only)
--set-limit AMOUNT         # Change daily limit
```

#### Spend Limit Example

```
Daily SMS Budget: €50
├── Sent today: €38.50 (77%)
├── Alert threshold: €40.00 (80%)
└── Status: ✅ Active

⚠️ At 80%: Webhook notification sent
❌ At 100%: Sending blocked until tomorrow
```

---

### #6 Price Drop Alerts

**Script:** `automations/agency/core/price-drop-alerts.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify |

#### Installation

```bash
# 1. Health check
node automations/agency/core/price-drop-alerts.cjs --health

# 2. Configure webhooks
node automations/agency/core/price-drop-alerts.cjs --setup-webhooks

# 3. Run monitoring
node automations/agency/core/price-drop-alerts.cjs --monitor
```

#### HITL Configuration

**Partial** - Thresholds are configurable but no per-alert approval.

```bash
# Environment variables
PRICE_DROP_URGENT=20        # 20% drop = urgent alert
PRICE_DROP_FLASH=30         # 30% drop = flash sale alert
WISHLIST_SYNC_HOURS=6       # Sync wishlist every 6 hours
```

---

### #7 WhatsApp Booking

**Script:** `automations/agency/core/whatsapp-booking-notifications.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `WHATSAPP_BUSINESS_TOKEN` | Meta Business Suite → WhatsApp → API Setup |
| `WHATSAPP_PHONE_ID` | Meta Business Suite |
| `GOOGLE_CALENDAR_CREDENTIALS` | Google Cloud Console |

#### Installation

```bash
# 1. Health check
node automations/agency/core/whatsapp-booking-notifications.cjs --health

# 2. Verify templates (must be Meta-approved)
node automations/agency/core/whatsapp-booking-notifications.cjs --list-templates

# 3. Run notifications
node automations/agency/core/whatsapp-booking-notifications.cjs --run
```

#### HITL Configuration

**Implicit** - Meta template approval is the human checkpoint.

| Template | Timing | Content |
|----------|--------|---------|
| `booking_confirmation` | Immediate | Booking details |
| `reminder_24h` | T-24 hours | Tomorrow reminder |
| `reminder_1h` | T-1 hour | Final reminder |

#### Template Approval

Templates must be submitted to Meta for approval:

1. Go to Meta Business Suite → WhatsApp → Message Templates
2. Create template with variables: `{{1}}` = customer name, `{{2}}` = date/time
3. Wait for approval (24-48h)
4. Add template ID to configuration

---

### #8 Blog Factory AI

**Script:** `automations/agency/core/blog-generator-resilient.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `ANTHROPIC_API_KEY` | Anthropic |
| `XAI_API_KEY` | xAI (fallback) |
| `GEMINI_API_KEY` | Google (fallback) |
| `WORDPRESS_URL` | Your WordPress site |
| `WORDPRESS_USERNAME` | WordPress admin |
| `WORDPRESS_APP_PASSWORD` | WordPress → Users → App Passwords |
| `META_ACCESS_TOKEN` | Meta Business (for Facebook) |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn Developer Portal |
| `X_API_KEY` | X Developer Portal |

#### Installation

```bash
# 1. Health check
node automations/agency/core/blog-generator-resilient.cjs --health

# 2. Generate draft (requires approval)
node automations/agency/core/blog-generator-resilient.cjs --generate --topic="AI in E-commerce 2026"

# 3. List drafts
node automations/agency/core/blog-generator-resilient.cjs --list-drafts

# 4. View specific draft
node automations/agency/core/blog-generator-resilient.cjs --view-draft ID

# 5. Approve and publish
node automations/agency/core/blog-generator-resilient.cjs --approve ID
```

#### HITL Configuration

```bash
# Environment variables
PUBLISH_AFTER_APPROVAL=true  # Require human approval (default: true)
QUALITY_THRESHOLD=0.8        # AI quality score threshold
AUTO_SOCIAL_POST=false       # Auto-post to social after publish

# CLI Commands
--list-drafts              # List all pending drafts
--view-draft ID            # View full draft content
--approve ID               # Approve and publish
--reject ID                # Reject and delete
--edit ID                  # Open in editor before publish
```

#### Quality Scoring

| Score | Action |
|-------|--------|
| 0.9+ | Ready for review |
| 0.8-0.9 | Needs minor edits |
| <0.8 | Auto-rejected, regenerate |

---

### #9 Podcast Generator

**Script:** `automations/agency/core/podcast-generator-resilient.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `GEMINI_API_KEY` | Google AI Studio |
| `GOOGLE_TTS_CREDENTIALS` | Google Cloud Console |

#### Installation

```bash
# 1. Health check
node automations/agency/core/podcast-generator-resilient.cjs --health

# 2. Generate script from blog
node automations/agency/core/podcast-generator-resilient.cjs --generate --url="https://blog.example.com/post"

# 3. Review script
node automations/agency/core/podcast-generator-resilient.cjs --view-script ID

# 4. Generate audio
node automations/agency/core/podcast-generator-resilient.cjs --render ID
```

#### HITL Configuration

**Yes** - Script review before audio generation.

```bash
# Environment variables
VOICE_1=en-US-Neural2-D      # Host voice
VOICE_2=en-US-Neural2-F      # Co-host voice
SCRIPT_REVIEW_REQUIRED=true  # Review script before TTS

# CLI Commands
--view-script ID           # View generated script
--edit-script ID           # Edit before rendering
--render ID                # Generate audio from script
```

---

### #10 Dropshipping Suite

**Scripts:**
- `automations/agency/core/cjdropshipping-automation.cjs`
- `automations/agency/core/bigbuy-supplier-sync.cjs`
- `automations/agency/core/dropshipping-order-flow.cjs`

#### Required Credentials

| Variable | Source |
|----------|--------|
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify |
| `CJ_API_KEY` | [cjdropshipping.com](https://cjdropshipping.com) → API Settings |
| `CJ_API_SECRET` | CJDropshipping |
| `BIGBUY_API_KEY` | [bigbuy.eu](https://bigbuy.eu) → Partner Portal |

#### Installation

```bash
# 1. Health check all scripts
node automations/agency/core/cjdropshipping-automation.cjs --health
node automations/agency/core/bigbuy-supplier-sync.cjs --health
node automations/agency/core/dropshipping-order-flow.cjs --health

# 2. Sync product catalog
node automations/agency/core/bigbuy-supplier-sync.cjs --sync-catalog

# 3. Process pending orders
node automations/agency/core/dropshipping-order-flow.cjs --process
```

#### HITL Configuration

**Yes** - Order confirmation step available.

```bash
# Environment variables
AUTO_CONFIRM_ORDERS=false    # Require manual order confirmation
ORDER_VALUE_THRESHOLD=100    # Auto-confirm below €100

# CLI Commands
--list-pending             # List orders awaiting confirmation
--confirm-order ID         # Confirm and submit to supplier
--reject-order ID          # Cancel order
--confirm-all-below VALUE  # Confirm all orders below value
```

---

## HITL Configuration Reference

### Summary Table

| Add-On | HITL Level | Trigger | CLI Prefix |
|--------|------------|---------|------------|
| Anti-Churn AI | Full | LTV > €500 | `--intervention` |
| Review Booster | None | - | - |
| Replenishment | None | - | - |
| Email Cart AI | Full | All AI emails | `--preview` |
| SMS Automation | Full | Daily spend | `--daily` |
| Price Drop | Partial | Thresholds only | - |
| WhatsApp Booking | Implicit | Meta templates | - |
| Blog Factory AI | Full | All drafts | `--draft` |
| Podcast Generator | Yes | Script review | `--script` |
| Dropshipping | Yes | Order confirm | `--order` |

### Environment Variables Master List

```bash
# HITL Thresholds
LTV_THRESHOLD=500
ORDER_VALUE_THRESHOLD=100
QUALITY_THRESHOLD=0.8

# HITL Modes
HITL_ENABLED=true
PREVIEW_MODE=true
PUBLISH_AFTER_APPROVAL=true
AUTO_CONFIRM_ORDERS=false
SCRIPT_REVIEW_REQUIRED=true

# Spend Limits
SMS_DAILY_MAX=50
SMS_ALERT_THRESHOLD=0.8
SMS_BLOCK_ON_EXCEED=true

# Webhooks
SMS_ALERT_WEBHOOK=https://hooks.slack.com/...
```

---

## FAQ

### General Questions

**Q: Do I need all API credentials for each add-on?**

A: No. Each add-on has specific required credentials listed in its setup guide. You only need credentials for the add-ons you purchase.

---

**Q: What happens if an API provider fails?**

A: Scripts marked "resilient" have multi-provider fallback. For example, Blog Factory uses: Anthropic → Grok → Gemini → OpenAI.

---

**Q: Can I use add-ons with non-Shopify stores?**

A: Currently, add-ons #1-6 and #10 require Shopify. Add-ons #7-9 work with any platform.

---

### HITL Questions

**Q: What is HITL?**

A: Human In The Loop - a safety mechanism requiring human approval before critical actions (publishing content, spending money, contacting high-value customers).

---

**Q: Can I disable HITL entirely?**

A: Yes, but not recommended. Set `HITL_ENABLED=false` in your environment. You accept full responsibility for automated actions.

---

**Q: What happens if I don't approve pending items?**

A: Items remain in queue. Some add-ons (like Email Cart AI) have an auto-send timeout (`AUTO_SEND_DELAY_HOURS=24`).

---

### Technical Questions

**Q: How do I run add-ons on a schedule?**

A: Use cron jobs or a scheduler:

```bash
# Crontab example - run daily at 9am
0 9 * * * node /path/to/churn-prediction-resilient.cjs --analyze
```

---

**Q: Where are logs stored?**

A: By default in `logs/` directory. Configure with:

```bash
LOG_DIR=/custom/path/logs
LOG_LEVEL=debug  # Options: error, warn, info, debug
```

---

**Q: How do I upgrade an add-on?**

A: Pull latest from repository:

```bash
git pull origin main
npm install  # If dependencies changed
```

---

### Billing Questions

**Q: Are API costs included in the monthly fee?**

A: No. Add-on fees cover 3A setup/support. You pay API providers directly:
- Klaviyo: Based on contacts
- AI providers: Based on tokens
- SMS: Based on messages sent
- WhatsApp: Based on conversations

---

**Q: What's included in the setup fee?**

A:
- Initial configuration
- Credential setup assistance
- First run verification
- 30-day support

---

**Q: What's the refund policy?**

A: Setup fees are non-refundable. Monthly fees can be cancelled anytime with 30-day notice.

---

## Support

| Channel | Response Time |
|---------|---------------|
| Email: support@3a-automation.com | 24h |
| WhatsApp: +33 7 XX XX XX XX | 4h (business hours) |
| Booking: 3a-automation.com/booking | Next available slot |

---

*Document created: 25/01/2026 | Phase 3 Documentation Complete*
