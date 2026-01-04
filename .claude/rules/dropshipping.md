---
paths:
  - "**/dropship*"
  - "**/cj*"
  - "**/bigbuy*"
  - "**/supplier*"
---

# Dropshipping Scripts

## 3 Scripts Production-Ready
| Script | Lines | Status | Port |
|--------|-------|--------|------|
| cjdropshipping-automation.cjs | 726 | 90% ✅ | 3020 |
| bigbuy-supplier-sync.cjs | 929 | 85% | 3021 |
| dropshipping-order-flow.cjs | 1087 | 95% ✅ | 3022 |

## APIs
- CJ Dropshipping: api.cjdropshipping.com
- BigBuy: api.bigbuy.eu
- Shopify: Admin GraphQL
- WooCommerce: REST API

## Commands
```bash
node automations/agency/core/cjdropshipping-automation.cjs --health
node automations/agency/core/bigbuy-supplier-sync.cjs --health
node automations/agency/core/dropshipping-order-flow.cjs --health
```

## Known Issue
`searchProducts()` returns empty on BigBuy (API issue, not code)
