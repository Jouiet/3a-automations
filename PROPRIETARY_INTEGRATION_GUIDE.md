# Technical Guide: 3A Global MCP Router

## Overview
The `3a-global-mcp` router is the central orchestration hub for 81 proprietary agentic automations.

## Architecture
- **Language**: TypeScript
- **Protocol**: Model Context Protocol (MCP) Standard
- **Transport**: Stdio
- **Execution**: Node.js `spawn` with 45s safety timeouts

## Integrated Tools (81 Automations)
The router exposes the following toolsets:
- **Core Pipelines**: Blog generation, LinkedIn automation, BigBuy sync, Google Maps lead gen.
- **CRM & Marketing**: WhatsApp booking, Voice API, Lead qualification, Churn prediction, Review automation.
- **E-commerce Optimization**: Dropshipping order flow, Replenishment reminders, SMS automation, VIP segmentation.
- **Deployment**: DOE (Deployment Orchestration Engine).
- **Analytics**: GA4 analysis, FB Pixel audit, BNPL ROI tracking.

## Operational Commands
### Build
```bash
npm run build
```

### Verify
```bash
npm run verify
```
The verification script `verify-core.js` performs 83 sequential tests using a strict ID-based protocol to ensure system stability.

## Troubleshooting
- **Hangs**: If a tool hangs, look for the 45s timeout. Check logs in `build/index.js` or run the specific script manually.
- **API Errors**: Many tools require `.env` variables. Verification will "pass" as long as the script executes and returns valid MCP JSON, even if the API returns a 400 (which is expected in test environments).

## Adding New Tools
1. Update the `TOOLS` array in `src/index.ts`.
2. Add a `case` block in the `setRequestHandler` switch.
3. Run `npm run build`.
4. Update `verify-core.js` to include the new test.

**Version: 3.0.0 (Stable)**
