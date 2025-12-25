# Project Templates - Generic Reusable Components

> **Version:** 1.0.0
> **Created:** 2025-12-25
> **Author:** 3A Automation

## Overview

This folder contains production-ready, generic templates for automation workflows that can be deployed to any e-commerce, marketing, or SaaS project. All components use environment variables for configuration.

## Folder Structure

```
project-templates/
├── n8n-workflows/           # n8n automation workflows
│   ├── ai-avatar-generator-generic.json
│   ├── email-outreach-generic.json
│   ├── blog-article-generator-generic.json
│   ├── lead-scraper-generic.json
│   └── README.md
├── voice-widget/            # AI voice assistant
│   ├── voice-widget-generic.js
│   ├── voice-widget-generic.min.js
│   └── config-template.js
├── whatsapp/                # WhatsApp Business templates
│   ├── booking-confirmation.json
│   ├── booking-reminders.json
│   └── README.md
├── email-sequences/         # Email automation templates
│   ├── welcome-series.json
│   ├── cart-abandonment.json
│   └── README.md
├── env-configs/             # Environment variable templates
│   ├── .env.example
│   ├── .env.ecommerce
│   ├── .env.saas
│   └── .env.agency
└── README.md               # This file
```

## Quick Start

### 1. Choose Your Project Type

| Project Type | Recommended Workflows | Env Config |
|--------------|----------------------|------------|
| E-commerce | ai-avatar, email-outreach, whatsapp | `.env.ecommerce` |
| SaaS | blog-generator, lead-scraper | `.env.saas` |
| Agency | All workflows | `.env.agency` |
| CinematicAds | ai-avatar, email-outreach | `.env.saas` |

### 2. Copy to Your Project

```bash
# Example: Copy to CinematicAds project
cp -r project-templates/ ~/Desktop/Ads-Automations/templates/

# Or copy specific components
cp project-templates/n8n-workflows/*.json ~/Desktop/Ads-Automations/n8n/
cp project-templates/env-configs/.env.saas ~/Desktop/Ads-Automations/.env
```

### 3. Configure Environment Variables

Edit the `.env` file with your actual credentials:

```bash
# Required for all projects
BRAND_NAME=YourBrand
BRAND_URL=https://yourbrand.com
BRAND_EMAIL=contact@yourbrand.com

# API Keys (get from respective dashboards)
KLAVIYO_API_KEY=pk_xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx
```

### 4. Import to n8n

1. Open n8n dashboard
2. Go to Workflows > Import
3. Select the JSON workflow file
4. Update credential references
5. Activate workflow

## Workflows Description

### AI Avatar Generator (`ai-avatar-generator-generic.json`)
Generates AI marketing avatars using Imagen 3.0. Perfect for:
- Video ad personas
- Social media content
- CinematicAds projects

**Required env vars:** `GOOGLE_API_KEY`, `OPENAI_API_KEY`

### Email Outreach (`email-outreach-generic.json`)
Multi-touch B2B email sequence. Perfect for:
- Lead nurturing
- Cold outreach
- Client onboarding

**Required env vars:** `KLAVIYO_API_KEY`, `GOOGLE_SHEET_ID`

### Blog Article Generator (`blog-article-generator-generic.json`)
AI-powered SEO blog content. Perfect for:
- Content marketing
- SEO optimization
- Authority building

**Required env vars:** `CLAUDE_API_KEY`

### WhatsApp Booking (`whatsapp/`)
Appointment confirmations and reminders. Perfect for:
- Service businesses
- Consultations
- Demos

**Required env vars:** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`

## Voice Widget

The voice widget provides AI-powered voice interaction. To customize:

1. Copy `config-template.js`
2. Rename to `config-[your-project].js`
3. Update brand colors, prompts, and settings
4. Load in your HTML

## Support

- Documentation: https://3a-automation.com/docs
- Contact: contact@3a-automation.com
