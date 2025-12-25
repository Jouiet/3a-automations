# n8n Workflow Templates

> Generic, production-ready n8n workflows for any project

## Available Workflows

| Workflow | Use Case | Required APIs |
|----------|----------|---------------|
| `ai-avatar-generator-generic.json` | AI marketing avatars | Google (Imagen), OpenAI |
| `email-outreach-generic.json` | B2B email sequences | Klaviyo, Google Sheets |
| `blog-article-generator-generic.json` | SEO blog content | Claude API |
| `lead-scraper-generic.json` | Lead generation | Apify, Klaviyo, Sheets |

## Quick Setup

### 1. Import to n8n

```bash
# Via n8n CLI
n8n import:workflow --input=ai-avatar-generator-generic.json

# Or via UI
# n8n Dashboard > Workflows > Import from file
```

### 2. Configure Environment Variables

In n8n Settings > Variables, add:

```
BRAND_NAME=YourBrand
BRAND_URL=https://yourbrand.com
GOOGLE_API_KEY=xxx
OPENAI_API_KEY=sk-xxx
KLAVIYO_API_KEY=pk_xxx
CLAUDE_API_KEY=sk-ant-xxx
APIFY_API_TOKEN=apify_api_xxx
GOOGLE_SHEET_ID=1xxx
```

### 3. Create Credentials

For each workflow, create matching credentials:
- **OpenAI API** - for avatar generation
- **Google API** - for Imagen 3
- **Google Sheets OAuth** - for logging
- **Klaviyo** - for email sequences (or use HTTP with API key)

### 4. Activate & Test

1. Open workflow in n8n
2. Click "Activate"
3. Test via webhook URL or manual trigger

## Environment Variable Reference

### Common (All Workflows)

| Variable | Description | Example |
|----------|-------------|---------|
| `BRAND_NAME` | Your brand name | `CinematicAds` |
| `BRAND_URL` | Your website URL | `https://cinematicads.studio` |
| `WEBHOOK_PATH` | Custom webhook path | `myproject/api` |

### AI Avatar Generator

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Gemini/Imagen API key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | Model to use | `gpt-4` |
| `IMAGE_ASPECT_RATIO` | Portrait ratio | `1:1` |
| `VIDEO_ASPECT_RATIO` | Scene ratio | `9:16` |

### Email Outreach

| Variable | Description | Default |
|----------|-------------|---------|
| `KLAVIYO_API_KEY` | Klaviyo API key | Required |
| `GOOGLE_SHEET_ID` | Logging sheet ID | Required |
| `SENDER_NAME` | Email sender name | `Team` |
| `BOOKING_URL` | Calendar booking URL | `{BRAND_URL}/booking` |
| `KLAVIYO_METRIC` | Event metric name | `outreach_started` |

### Blog Article Generator

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_API_KEY` | Anthropic API key | Required |
| `CLAUDE_MODEL` | Claude model | `claude-sonnet-4-20250514` |
| `DEFAULT_LANGUAGE` | Article language | `fr` |
| `CTA_TEXT` | Call-to-action text | Auto-generated |

### Lead Scraper

| Variable | Description | Default |
|----------|-------------|---------|
| `APIFY_API_TOKEN` | Apify API token | Required |
| `LINKEDIN_SEARCH_URL` | LinkedIn search URL | Required |
| `MAX_PROFILES` | Profiles per run | `100` |
| `SCRAPE_INTERVAL_HOURS` | Schedule interval | `6` |
| `TITLE_KEYWORDS` | Comma-separated keywords | `e-commerce,marketing...` |
| `TARGET_INDUSTRIES` | Target industries | `retail,fashion...` |
| `TARGET_LOCATIONS` | Target locations | `morocco,france...` |
| `MIN_LEAD_SCORE` | Minimum score to save | `50` |

## Project-Specific Configurations

### CinematicAds (SaaS)

```env
BRAND_NAME=CinematicAds
BRAND_URL=https://cinematicads.studio
BOOKING_URL=https://cinematicads.studio/demo
DEFAULT_LANGUAGE=en
IMAGE_ASPECT_RATIO=1:1
VIDEO_ASPECT_RATIO=9:16
TITLE_KEYWORDS=marketing,agency,creative,video
TARGET_INDUSTRIES=advertising,marketing,media
```

### E-commerce Store

```env
BRAND_NAME=MyShop
BRAND_URL=https://myshop.com
BOOKING_URL=https://myshop.com/contact
DEFAULT_LANGUAGE=fr
TITLE_KEYWORDS=e-commerce,shopify,retail
TARGET_INDUSTRIES=retail,fashion,beauty
```

### B2B Agency

```env
BRAND_NAME=MyAgency
BRAND_URL=https://myagency.com
BOOKING_URL=https://calendly.com/myagency
TITLE_KEYWORDS=ceo,founder,director,manager
TARGET_INDUSTRIES=technology,finance,consulting
MIN_LEAD_SCORE=60
```

## Webhook URLs

After activation, workflows are accessible at:

```
POST https://your-n8n.com/webhook/{WEBHOOK_PATH}
```

### Example Requests

**AI Avatar Generator:**
```bash
curl -X POST https://n8n.example.com/webhook/ai-avatar-generator \
  -H "Content-Type: application/json" \
  -d '{"audience": "Young entrepreneurs", "style": "professional", "scenes": ["office", "casual"]}'
```

**Email Outreach:**
```bash
curl -X POST https://n8n.example.com/webhook/leads/new \
  -H "Content-Type: application/json" \
  -d '{"email": "john@company.com", "firstName": "John", "company": "Acme Inc"}'
```

**Blog Generator:**
```bash
curl -X POST https://n8n.example.com/webhook/blog/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Marketing 2026", "language": "en", "keywords": "AI, marketing, automation"}'
```

## Cost Estimates

| Workflow | Cost per Run | Monthly (100 runs) |
|----------|--------------|-------------------|
| AI Avatar | ~$0.50 | ~$50 |
| Email Outreach | ~$0.01 | ~$1 |
| Blog Generator | ~$0.10 | ~$10 |
| Lead Scraper | ~$3.00 | ~$300 |

## Support

- Documentation: https://3a-automation.com/docs
- n8n Docs: https://docs.n8n.io
- Contact: contact@3a-automation.com
