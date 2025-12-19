#!/bin/bash
# Upload 3 carousel images to Shopify Media Library
set -e

source .env.local

IMAGE_1="/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-saad-aljasser-740728748-18530662-optimized.webp"
IMAGE_2="/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/Motorcycle 3-optimized.webp"
IMAGE_3="/Users/mac/Desktop/henderson-shopify/Motos Images/pexels-nicholas-dias-1119542-2116475-optimized.webp"

GRAPHQL_URL="https://${SHOPIFY_STORE}/admin/api/2024-10/graphql.json"

echo "🚀 Uploading 3 carousel images to Shopify Media Library"
echo "=================================================================="

upload_image() {
    local IMAGE_PATH="$1"
    local FILENAME="$2"
    local CAROUSEL="$3"

    echo ""
    echo "📤 Carousel $CAROUSEL: $FILENAME"

    if [ ! -f "$IMAGE_PATH" ]; then
        echo "   ❌ File not found: $IMAGE_PATH"
        return 1
    fi

    local SIZE_KB=$(du -k "$IMAGE_PATH" | cut -f1)
    echo "   Size: ${SIZE_KB} KB"

    # Step 1: Generate staged upload URL
    echo "   📡 Requesting staged upload URL..."

    local MUTATION='mutation {
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

    local STAGED_RESPONSE=$(curl -s "$GRAPHQL_URL" \
        -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$MUTATION" | jq -Rs .)}")

    local ERRORS=$(echo "$STAGED_RESPONSE" | jq -r '.data.stagedUploadsCreate.userErrors[]?')
    if [ ! -z "$ERRORS" ]; then
        echo "   ❌ Staged upload error: $ERRORS"
        return 1
    fi

    local STAGED_URL=$(echo "$STAGED_RESPONSE" | jq -r '.data.stagedUploadsCreate.stagedTargets[0].url')
    local RESOURCE_URL=$(echo "$STAGED_RESPONSE" | jq -r '.data.stagedUploadsCreate.stagedTargets[0].resourceUrl')

    if [ "$STAGED_URL" = "null" ] || [ -z "$STAGED_URL" ]; then
        echo "   ❌ No staged URL returned"
        return 1
    fi

    echo "   ✅ Staged URL generated"

    # Step 2: Build curl form data
    local PARAMS=$(echo "$STAGED_RESPONSE" | jq -r '.data.stagedUploadsCreate.stagedTargets[0].parameters')
    local CURL_ARGS=""
    for row in $(echo "$PARAMS" | jq -r '.[] | @base64'); do
        local NAME=$(echo "$row" | base64 -d | jq -r '.name')
        local VALUE=$(echo "$row" | base64 -d | jq -r '.value')
        CURL_ARGS="$CURL_ARGS -F ${NAME}=${VALUE}"
    done

    echo "   📤 Uploading file to staging..."

    local UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$STAGED_URL" \
        $CURL_ARGS \
        -F "file=@${IMAGE_PATH}")

    local HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

    if [ "$HTTP_CODE" != "204" ] && [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
        echo "   ❌ Upload failed: HTTP $HTTP_CODE"
        return 1
    fi

    echo "   ✅ File uploaded to staging"
    sleep 3

    # Step 3: Create file in Media Library
    echo "   📝 Creating file in Media Library..."

    local CREATE_MUTATION='mutation {
      fileCreate(files: [{
        alt: "'"$(basename "$FILENAME" .webp)"'",
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

    local CREATE_RESPONSE=$(curl -s "$GRAPHQL_URL" \
        -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$CREATE_MUTATION" | jq -Rs .)}")

    local CREATE_ERRORS=$(echo "$CREATE_RESPONSE" | jq -r '.data.fileCreate.userErrors[]?')
    if [ ! -z "$CREATE_ERRORS" ]; then
        echo "   ❌ File create error: $CREATE_ERRORS"
        return 1
    fi

    local FILE_URL=$(echo "$CREATE_RESPONSE" | jq -r '.data.fileCreate.files[0].image.url')

    if [ "$FILE_URL" = "null" ] || [ -z "$FILE_URL" ]; then
        FILE_URL="https://cdn.shopify.com/s/files/1/0674/5128/9652/files/$FILENAME"
    fi

    echo "   ✅ File created in Media Library"
    echo "   🌐 URL: $FILE_URL"
}

# Upload all 3 images
upload_image "$IMAGE_1" "pexels-saad-aljasser-740728748-18530662-optimized.webp" "2" || true
sleep 2
upload_image "$IMAGE_2" "motorcycle-3-optimized.webp" "5" || true
sleep 2
upload_image "$IMAGE_3" "pexels-nicholas-dias-1119542-2116475-optimized.webp" "8" || true

echo ""
echo "=================================================================="
echo "✅ UPLOAD COMPLETE"
echo "=================================================================="
echo "Next: Reorganize templates/index.json"
