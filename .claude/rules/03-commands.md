# 3A Automation - Essential Commands

## Validation Scripts

```bash
node scripts/forensic-audit-complete.cjs    # SEO/AEO audit
node scripts/audit-accessibility.cjs        # WCAG/RGAA
node scripts/test-voice-widget.cjs          # Voice widget
node scripts/test-seo-complete.cjs          # SEO 142 tests
```

## API Testing

```bash
node automations/generic/test-all-apis.cjs
```

## Deployment

```bash
git push origin main  # Triggers GitHub Action → Hostinger
```

## Minified Assets

| Asset | Size |
|-------|------|
| styles.min.css | 100KB |
| script.min.js | 11KB |
| voice-widget.min.js | 33KB |
| geo-locale.min.js | 3.4KB |
