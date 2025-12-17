#!/bin/bash
# Upload Yamaha scooter image to Shopify Media Library
set -e

source .env.local

IMAGE_PATH="/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/generated-yamaha-scooter-optimized.webp"
FILENAME="generated-yamaha-scooter-optimized.webp"
GRAPHQL_URL="https://${SHOPIFY_STORE}/admin/api/2024-10/graphql.json"

echo "🚀 Uploading Yamaha scooter image to Shopify Media Library"
echo "=================================================================="
echo ""
echo "📤 File: $FILENAME"

SIZE_KB=$(du -k "$IMAGE_PATH" | cut -f1)
echo "   Size: ${SIZE_KB} KB"

# Step 1: Generate staged upload URL
echo "   📡 Requesting staged upload URL..."

MUTATION='mutation {
  stagedUploadsCreate(input: [{
    resource: IMAGE,
    filename: "'"$FILENAME"'",
    mimeType: "image/webp",
    httpMethod: POST
  }]) {
    stagedTargets {
      url
      resourceUrl
      parameters { name value }
    }
    userErrors { field message }
  }
}'

STAGED_RESPONSE=$(curl -s "$GRAPHQL_URL" \
    -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$MUTATION" | jq -Rs .)}")

ERRORS=$(echo "$STAGED_RESPONSE" | jq -r '.data.stagedUploadsCreate.userErrors[]?')
if [ ! -z "$ERRORS" ]; then
    echo "   ❌ Staged upload error: $ERRORS"
    exit 1
fi

STAGED_URL=$(echo "$STAGED_RESPONSE" | jq -r '.data.stagedUploadsCreate.stagedTargets[0].url')
RESOURCE_URL=$(echo "$STAGED_RESPONSE" | jq -r '.data.stagedUploadsCreate.stagedTargets[0].resourceUrl')

if [ "$STAGED_URL" = "null" ] || [ -z "$STAGED_URL" ]; then
    echo "   ❌ No staged URL returned"
    exit 1
fi

echo "   ✅ Staged URL generated"

# Step 2: Build curl form data
PARAMS=$(echo "$STAGED_RESPONSE" | jq -r '.data.stagedUploadsCreate.stagedTargets[0].parameters')
CURL_ARGS=""
for row in $(echo "$PARAMS" | jq -r '.[] | @base64'); do
    NAME=$(echo "$row" | base64 -d | jq -r '.name')
    VALUE=$(echo "$row" | base64 -d | jq -r '.value')
    CURL_ARGS="$CURL_ARGS -F ${NAME}=${VALUE}"
done

echo "   📤 Uploading file to staging..."

UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$STAGED_URL" \
    $CURL_ARGS \
    -F "file=@${IMAGE_PATH}")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" != "204" ] && [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
    echo "   ❌ Upload failed: HTTP $HTTP_CODE"
    exit 1
fi

echo "   ✅ File uploaded to staging"
sleep 3

# Step 3: Create file in Media Library
echo "   📝 Creating file in Media Library..."

CREATE_MUTATION='mutation {
  fileCreate(files: [{
    alt: "Yamaha sportbike scooter touring",
    contentType: IMAGE,
    originalSource: "'"$RESOURCE_URL"'"
  }]) {
    files {
      ... on MediaImage {
        id
        image { url }
      }
    }
    userErrors { field message }
  }
}'

CREATE_RESPONSE=$(curl -s "$GRAPHQL_URL" \
    -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$CREATE_MUTATION" | jq -Rs .)}")

CREATE_ERRORS=$(echo "$CREATE_RESPONSE" | jq -r '.data.fileCreate.userErrors[]?')
if [ ! -z "$CREATE_ERRORS" ]; then
    echo "   ❌ File create error: $CREATE_ERRORS"
    exit 1
fi

FILE_URL=$(echo "$CREATE_RESPONSE" | jq -r '.data.fileCreate.files[0].image.url')

if [ "$FILE_URL" = "null" ] || [ -z "$FILE_URL" ]; then
    FILE_URL="https://cdn.shopify.com/s/files/1/0674/5128/9652/files/$FILENAME"
fi

echo "   ✅ File created in Media Library"
echo "   🌐 URL: $FILE_URL"
echo ""
echo "=================================================================="
echo "✅ UPLOAD COMPLETE"
echo "=================================================================="
echo "Next: Update templates/index.json slide-4"
