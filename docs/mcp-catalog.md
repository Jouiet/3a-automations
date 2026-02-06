# 3A Global MCP: Tool Catalog (121 Automations + 3 Meta = 124 Tools)
> Catalog of all proprietary tools exposed via the 3A Global MCP Router (v1.5.0, 99/99 tests).
> Each tool is designed for high-performance agentic orchestration.

## Lead Generation & Acquisition (26 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `meta-leads-sync` | Meta Leads → Shopify Sync | script | 1 | Synchronizes lead data from Meta Ads (Facebook/Instagram) lead forms directly into Shopify customer records. Use this for Meta-based acquisition workflows. |
| `google-ads-sync` | Google Ads → Shopify Sync | script | 1 | Google Ads → Shopify Sync |
| `tiktok-leads-sync` | TikTok Leads → Shopify Sync | script | 1 | TikTok Leads → Shopify Sync |
| `lead-scoring` | Lead Qualification & Scoring | manual-process | 3 | Lead Qualification & Scoring |
| `hot-warm-cold` | HOT/WARM/COLD Segmentation | klaviyo-segment | 1 | HOT/WARM/COLD Segmentation |
| `data-enrichment` | Data Enrichment | apollo-integration | 1 | Data Enrichment |
| `geo-segmentation` | Geo-Segmentation | script | 1 | Geo-Segmentation |
| `google-forms-crm` | Google Forms → CRM | script | 1 | Google Forms → CRM |
| `typeform-klaviyo` | Typeform → Klaviyo | manual-process | 1 | Typeform → Klaviyo |
| `sourcing-google-maps` | Google Maps Sourcing | script | 3 | Scrapes local business data from Google Maps based on query and location. Use this for local B2B lead generation or competitive research in a specific area. |
| `sourcing-linkedin` | LinkedIn Sourcing | script | 3 | Extracts professional profiles from LinkedIn based on search criteria. Essential for B2B outreach and hiring intelligence. |
| `veille-recrutement` | Hiring Intelligence | script | 1 | Hiring Intelligence |
| `google-apps-script-booking` | Google Apps Script Booking | script | 1 | Google Apps Script Booking |
| `google-calendar-booking` | Google Calendar Booking | script | 1 | Google Calendar Booking |
| `geo-segment-generic` | Geo Segment Generic | script | 1 | Geo Segment Generic |
| `import-facebook-lead-ads` | Import Facebook Lead Ads | script | 1 | Import Facebook Lead Ads |
| `segment-leads` | Segment Leads | script | 1 | Segment Leads |
| `enable-apify-schedulers` | Enable Apify Schedulers | script | 1 | Enable Apify Schedulers |
| `linkedin-lead-scraper` | LinkedIn Lead Automation | script | 2 | LinkedIn Lead Automation |
| `email-outreach-sequence` | Email Outreach Sequence | script | 3 | Email Outreach Sequence |
| `linkedin-to-klaviyo-pipeline` | LinkedIn → Klaviyo Pipeline (B2B) | script | 1 | LinkedIn → Klaviyo Pipeline (B2B) |
| `google-maps-to-klaviyo-pipeline` | Google Maps → Klaviyo Pipeline (Local B2B) | script | 1 | Google Maps → Klaviyo Pipeline (Local B2B) |
| `b2b-email-templates-module` | B2B Email Templates Module | script | 3 | B2B Email Templates Module |
| `hubspot-b2b-crm` | HubSpot B2B CRM Integration v1.1.0 | script | 1 | HubSpot B2B CRM Integration v1.1.0 |
| `lead-gen-scheduler` | Lead Gen Scheduler | script | 1 | Lead Gen Scheduler |
| `invoice-generator` | Invoice Generator | script | 4 | Invoice Generator |

## SEO & Content (10 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `alt-text-fix` | Image Alt Text Correction | script | 1 | Image Alt Text Correction |
| `auto-meta-tags` | Automatic Meta Tags | shopify-flow | 1 | Automatic Meta Tags |
| `image-sitemap` | Image Sitemap | script | 1 | Image Sitemap |
| `schema-products` | Schema.org Products | shopify-theme | 1 | Schema.org Products |
| `internal-linking` | Internal Linking | manual-process | 1 | Internal Linking |
| `llms-txt` | llms.txt (AEO) | manual-file | 1 | llms.txt (AEO) |
| `generate-tags-csv` | Generate Tags Csv | script | 1 | Generate Tags Csv |
| `import-alt-text-api` | Import Alt Text Api | script | 1 | Import Alt Text Api |
| `upload-llms` | Upload Llms | script | 1 | Upload Llms |
| `content-strategist-agentic` | AI Content Strategist | script | 4 | AI Content Strategist |

## Email Marketing (CRM) (11 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `welcome-series` | Welcome Series | klaviyo-flow | 2 | Welcome Series |
| `abandoned-cart` | Abandoned Cart | klaviyo-flow | 2 | Abandoned Cart |
| `browse-abandonment` | Browse Abandonment | klaviyo-flow | 2 | Browse Abandonment |
| `post-purchase` | Post-Purchase | klaviyo-flow | 2 | Post-Purchase |
| `win-back` | Win-Back | klaviyo-flow | 2 | Win-Back |
| `vip-tiers` | VIP Tiers | klaviyo-segment | 2 | VIP Tiers |
| `flows-audit` | Complete Flows Audit | script | 3 | Complete Flows Audit |
| `ab-sender-rotation` | A/B Sender Rotation | script | 2 | A/B Sender Rotation |
| `audit-klaviyo-flows-v2` | Audit Klaviyo Flows V2 | script | 2 | Audit Klaviyo Flows V2 |
| `omnisend-b2c-ecommerce` | Omnisend B2C E-commerce Integration v1.1.0 | script | 2 | Omnisend B2C E-commerce Integration v1.1.0 |
| `email-personalization-resilient` | Resilient Email Personalization (4 AI + 3-Email Cart Series) | script | 3 | Resilient Email Personalization (4 AI + 3-Email Cart Series) |

## SMS Marketing (1 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `sms-automation-resilient` | Resilient SMS Automation (Omnisend + Twilio) | script | 2 | Resilient SMS Automation (Omnisend + Twilio) |

## Retention & Churn Prediction (4 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `churn-prediction-resilient` | Resilient Churn Prediction (RFM + AI) | script | 3 | Resilient Churn Prediction (RFM + AI) |
| `at-risk-customer-flow` | At-Risk Customer Flow (Anti-Churn Intervention) | script | 1 | At-Risk Customer Flow (Anti-Churn Intervention) |
| `price-drop-alerts` | Price Drop Alerts (Wishlist) | script | 1 | Price Drop Alerts (Wishlist) |
| `replenishment-reminder` | Replenishment Reminder | script | 1 | Replenishment Reminder |

## Shopify Admin (14 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `product-enrichment` | Product Enrichment | ai-process | 3 | Product Enrichment |
| `shopping-attributes` | Google Shopping Attributes | shopify-metafield | 1 | Google Shopping Attributes |
| `collection-management` | Collection Management | shopify-flow | 1 | Collection Management |
| `legal-pages` | Legal Pages | template | 1 | Legal Pages |
| `gtm-installation` | GTM Installation | manual-setup | 1 | GTM Installation |
| `loyalty-webhooks` | Loyalty Webhooks | shopify-webhook | 1 | Loyalty Webhooks |
| `store-audit` | Complete Store Audit | script | 3 | Complete Store Audit |
| `facebook-audiences` | Export → Facebook Audiences | script | 1 | Export → Facebook Audiences |
| `google-taxonomy` | Google Taxonomy Import | script | 1 | Google Taxonomy Import |
| `audit-shopify-store` | Audit Shopify Store | script | 1 | Audit Shopify Store |
| `create-warehouse-metafield` | Create Warehouse Metafield | script | 1 | Create Warehouse Metafield |
| `import-taxonomy-metafield` | Import Taxonomy Metafield | script | 1 | Import Taxonomy Metafield |
| `parse-warehouse-csv` | Parse Warehouse Csv | script | 1 | Parse Warehouse Csv |
| `review-request-automation` | Automated Review Request (Shopify → Klaviyo) | script | 2 | Automated Review Request (Shopify → Klaviyo) |

## Analytics & Reporting (9 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `looker-dashboard` | Looker Studio Dashboard | looker-template | 1 | Looker Studio Dashboard |
| `ga4-source-report` | GA4 Source Report | script | 3 | GA4 Source Report |
| `system-audit` | Complete Flywheel Audit | multi-tool | 4 | Complete Flywheel Audit |
| `low-stock-alert` | Low Stock Alert | shopify-flow | 1 | Low Stock Alert |
| `margin-projections` | Margin Projections | sheets-template | 1 | Margin Projections |
| `inventory-analysis` | Inventory Analysis | sheets-template | 1 | Inventory Analysis |
| `bnpl-tracking` | BNPL Performance Tracking | script | 1 | BNPL Performance Tracking |
| `pixel-verification` | Pixel Verification | script | 1 | Pixel Verification |
| `analyze-ga4-conversion-source` | Analyze Ga4 Conversion Source | script | 1 | Analyze Ga4 Conversion Source |

## Content & Video & Podcast (19 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `promo-video` | Product Promo Video | script | 1 | Product Promo Video |
| `cart-recovery-video` | Cart Recovery Video | video-template | 2 | Cart Recovery Video |
| `portrait-video` | Portrait Video Format | script | 3 | Portrait Video Format |
| `shopping-feed` | Google Shopping Feed | shopify-app | 1 | Google Shopping Feed |
| `gmc-diagnostic` | GMC Diagnostic | manual-audit | 1 | GMC Diagnostic |
| `auto-blog` | Auto Blog + Multi-Channel Distribution | script | 1 | Auto Blog + Multi-Channel Distribution |
| `custom-workflow-deprecated` | Custom Workflow (Deprecated) | deprecated | 1 | Custom Workflow (Deprecated) |
| `generate-all-promo-videos` | Generate All Promo Videos | script | 1 | Generate All Promo Videos |
| `blog-generator-resilient` | Resilient Blog Generator (3 AI + 3 Social) | script | 3 | Resilient Blog Generator (3 AI + 3 Social) |
| `podcast-generator-resilient` | Podcast Generator (Blog → Audio) | script | 3 | Podcast Generator (Blog → Audio) |
| `index` | Index | script | 1 | Index |
| `content` | Content | script | 1 | Content |
| `popup` | Popup | script | 1 | Popup |
| `markets` | Markets | script | 1 | Markets |
| `index-1` | Index | script | 1 | Index |
| `search` | Search | script | 1 | Search |
| `config-3a-automation` | Config 3a Automation | script | 2 | Config 3a Automation |
| `config-cinematicads` | Config Cinematicads | script | 1 | Config Cinematicads |
| `config.example` | Config.Example | script | 1 | Config.Example |

## AI Avatar & Influencer (2 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `ai-avatar-generator` | AI Avatar Generator | external-service | 3 | AI Avatar Generator |
| `ai-talking-video` | AI Talking Video | external-service | 3 | AI Talking Video |

## CinematicAds AI (4 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `cinematic-director` | CinematicAds Director | external-service | 1 | CinematicAds Director |
| `competitor-clone` | Competitor Clone AI | external-service | 3 | Competitor Clone AI |
| `ecommerce-factory` | E-commerce Ads Factory | external-service | 1 | E-commerce Ads Factory |
| `asset-factory` | Asset Factory (Dual AI) | external-service | 3 | Asset Factory (Dual AI) |

## WhatsApp Business (3 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `whatsapp-booking-confirmation` | WhatsApp Booking Confirmation | script | 1 | WhatsApp Booking Confirmation |
| `whatsapp-booking-reminders` | WhatsApp Reminders 24h + 1h | script | 1 | WhatsApp Reminders 24h + 1h |
| `whatsapp-booking-notifications` | WhatsApp Booking Notifications | script | 1 | WhatsApp Booking Notifications |

## Voice AI & Telephony (4 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `voice-ai-web-widget` | AI Voice Web Assistant | web-component | 4 | AI Voice Web Assistant |
| `grok-voice-telephony` | AI Phone Assistant | script | 4 | AI Phone Assistant |
| `voice-widget-templates` | Voice Widget Templates (8 industries) | script | 4 | Voice Widget Templates (8 industries) |
| `grok-voice-realtime` | Grok Voice Realtime (WebSocket + TTS) | script | 4 | Grok Voice Realtime (WebSocket + TTS) |

## Marketing Automation (1 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `newsletter-automation` | Newsletter Automation | script | 2 | Newsletter Automation |

## Dropshipping & Suppliers (3 Tools)

| Tool ID | Name | Type | Level | Semantic Description |
| :--- | :--- | :--- | :---: | :--- |
| `cjdropshipping-automation` | CJDropshipping - Supplier Automation | script | 2 | CJDropshipping - Supplier Automation |
| `bigbuy-supplier-sync` | BigBuy - Supplier Sync | script | 1 | BigBuy - Supplier Sync |
| `dropshipping-order-flow` | Dropshipping - Multi-Supplier Orchestration | script | 1 | Dropshipping - Multi-Supplier Orchestration |
