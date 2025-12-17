#!/bin/bash

# Deploy SEO changes to Shopify Live Theme
# Session 73 - Article Schema + Gift Card Alt Text Fix

echo ""
echo "🚀 DEPLOYING SEO CHANGES TO SHOPIFY"
echo "===================================="
echo ""
echo "Files to deploy:"
echo "  1. sections/main-article.liquid (schema-article integration)"
echo "  2. templates/gift_card.liquid (alt text fix)"
echo "  3. snippets/schema-article.liquid (BlogPosting schema)"
echo ""
echo "Theme: 147139985460 (Henderson-Shop/main)"
echo "Store: jqp1x4-7e.myshopify.com"
echo ""
echo "⚠️  IMPORTANT: This will modify the LIVE theme"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "📤 Pushing changes to Shopify..."
echo ""

shopify theme push \
  --theme 147139985460 \
  --only sections/main-article.liquid \
  --only templates/gift_card.liquid \
  --only snippets/schema-article.liquid

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL"
    echo ""
    echo "📋 Changes deployed:"
    echo "  ✅ Blog posts now have BlogPosting schema (rich snippets)"
    echo "  ✅ Gift card image has alt text (accessibility)"
    echo "  ✅ Schema-article snippet integrated"
    echo ""
    echo "🧪 TEST VERIFICATION:"
    echo "  1. Visit any blog post: https://www.hendersonshop.com/blogs/news"
    echo "  2. View page source, search for 'BlogPosting'"
    echo "  3. Check Google Rich Results Test:"
    echo "     https://search.google.com/test/rich-results"
    echo ""
    echo "📊 SEO Impact:"
    echo "  • Blog posts eligible for rich snippets"
    echo "  • AEO optimization for article content"
    echo "  • Accessibility compliance improved"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "Check errors above and try again"
    exit 1
fi
