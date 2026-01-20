# 📦 3A Agentic Transmissibility Framework

Version: 1.0.0 | Date: 2026-01-08

## Overview

This framework defines the requirements for deploying **3A Level 4 Agents** in client environments. To maintain the "Ultrathink" standard of 100% resilience, all transmissible agents must follow these deployment patterns.

## 1. Engine Requirements

- **Runtime**: Node.js v20.x or higher (LTS).
- **Core Dependencies**: `dotenv`, `node-fetch`, `fs`, `path`.
- **Hardware**: Minimum 512MB RAM / 1 vCPU (Cloud Functions or Micro-Docker).

## 2. Configuration (`.env`)

Clients must provide a `.env` file in the execution directory containing:

```bash
# Frontier AI Providers
ANTHROPIC_API_KEY=sk-...
GEMINI_API_KEY=...
XAI_API_KEY=...

# Platform APIs (Specific to Agent Role)
SHOPIFY_SHOP_NAME=...
SHOPIFY_ACCESS_TOKEN=shpat_...
KLAVIYO_API_KEY=pk_...
GA4_PROPERTY_ID=...
```

## 3. Deployment Patterns (Verified 2026)

### A. Hostinger VPS (Naked Node.js via PM2)

- **Standard**: Manual SSH or CloudPanel.
- **Process**:
  1. Upload `.cjs` and `.env` to a dedicated directory.
  2. Install dependencies: `npm install dotenv node-fetch`.
  3. Run: `pm2 start your-agent.cjs --name "3A-Agent-01"`.
- **Why**: Zero container overhead; direct server access.

### B. Google Cloud Functions (Serverless Node.js)

- **Standard**: Cloud Functions (2nd Gen).
- **Process**: Deploy using `gcloud functions deploy` or UI upload.
- **Why**: High portability via the open-source Functions Framework.

### C. Supabase Edge Functions (Edge Deno/Node)

- **Standard**: Supabase CLI.
- **Process**: `supabase functions deploy`.
- **Why**: Low latency, native npm compatibility in the Edge Runtime.

## 4. Transmission Checklist (No-Bullshit Verification)

- [x] **Portability Patch**: Script uses `process.cwd()` for `.env` fallback.
- [x] **Dependency Bundle**: Small footprint (< 5MB excluding node_modules).
- [x] **Telemetry**: Result logs output to standard `STDOUT` for client observability.
- [x] **Security**: No hardcoded keys; all secrets pulled from environment.

---

### 3A Automation | 2026 | Architecting Holistic Systems
