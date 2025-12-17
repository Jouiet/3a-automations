# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Upload videos to Shopify Files API and return CDN URLs.

This script uploads video files to Shopify's CDN using the Admin API.
Each video is uploaded and a permanent CDN URL is returned.
"""

import os
import sys
import json
import requests
from pathlib import Path
from typing import Dict, List, Tuple

# Video files to upload with their metadata
VIDEOS_TO_UPLOAD = [
    {
        "filename": "Business Bag.mp4",
        "alt": "Business bag showcase - Premium professional bags",
        "ratio": "landscape"
    },
    {
        "filename": "Electronics & Tech.mp4",
        "alt": "Electronics and tech gadgets showcase",
        "ratio": "square"
    },
    {
        "filename": "Laptop Stand.mp4",
        "alt": "Laptop stand product demonstration",
        "ratio": "square"
    },
    {
        "filename": "Tech Dancing.mp4",
        "alt": "Tech products dynamic showcase",
        "ratio": "landscape"
    },
    {
        "filename": "Fourrure Homme.mp4",
        "alt": "Men's fashion fur jacket showcase",
        "ratio": "square"
    },
    {
        "filename": "grok-video-5fd14c67-020a-42d0-9876-aa4e91cf19b1.mp4",
        "alt": "Home and design products showcase",
        "ratio": "square"
    },
    {
        "filename": "I Love MyDealz.mp4",
        "alt": "MyDealz brand showcase video",
        "ratio": "portrait"
    },
    {
        "filename": "Lady in Red.mp4",
        "alt": "Fashion lifestyle showcase - Lady in red dress",
        "ratio": "portrait"
    }
]


def load_env_vars() -> Dict[str, str]:
    """Load Shopify credentials from .env file."""
    env_path = Path(__file__).parent.parent / ".env"

    if not env_path.exists():
        print(f"❌ ERROR: .env file not found at {env_path}")
        sys.exit(1)

    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()

    required_vars = ['SHOPIFY_ADMIN_API_TOKEN', 'SHOPIFY_STORE_URL', 'SHOPIFY_API_VERSION']
    missing_vars = [var for var in required_vars if var not in env_vars]

    if missing_vars:
        print(f"❌ ERROR: Missing required env vars: {', '.join(missing_vars)}")
        sys.exit(1)

    return env_vars


def upload_file_to_shopify(
    video_path: Path,
    alt_text: str,
    env_vars: Dict[str, str]
) -> Tuple[bool, str, str]:
    """
    Upload a video file to Shopify Files API.

    Returns:
        Tuple of (success: bool, cdn_url: str, error_message: str)
    """
    shop_url = env_vars['SHOPIFY_STORE_URL']
    api_token = env_vars['SHOPIFY_ADMIN_API_TOKEN']
    api_version = env_vars['SHOPIFY_API_VERSION']

    graphql_url = f"https://{shop_url}/admin/api/{api_version}/graphql.json"

    # Step 1: Generate staged upload URL
    stage_mutation = """
    mutation {
      stagedUploadsCreate(input: [{
        resource: FILE,
        filename: "%s",
        mimeType: "video/mp4",
        httpMethod: POST
      }]) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
    """ % video_path.name

    headers = {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': api_token
    }

    try:
        # Get staged upload URL
        response = requests.post(
            graphql_url,
            json={'query': stage_mutation},
            headers=headers,
            timeout=30
        )
        response.raise_for_status()

        result = response.json()

        if 'errors' in result:
            return False, "", f"GraphQL errors: {result['errors']}"

        staged_data = result.get('data', {}).get('stagedUploadsCreate', {})
        user_errors = staged_data.get('userErrors', [])

        if user_errors:
            return False, "", f"User errors: {user_errors}"

        staged_targets = staged_data.get('stagedTargets', [])
        if not staged_targets:
            return False, "", "No staged upload targets returned"

        staged_target = staged_targets[0]
        upload_url = staged_target['url']
        resource_url = staged_target['resourceUrl']
        parameters = staged_target['parameters']

        # Step 2: Upload file to staged URL
        with open(video_path, 'rb') as video_file:
            # Prepare form data with parameters from Shopify
            form_data = {param['name']: param['value'] for param in parameters}
            files = {'file': (video_path.name, video_file, 'video/mp4')}

            upload_response = requests.post(
                upload_url,
                data=form_data,
                files=files,
                timeout=120
            )
            upload_response.raise_for_status()

        # Step 3: Create file record in Shopify
        file_create_mutation = """
        mutation {
          fileCreate(files: [{
            alt: "%s",
            contentType: VIDEO,
            originalSource: "%s"
          }]) {
            files {
              ... on Video {
                id
                alt
                sources {
                  url
                  mimeType
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
        """ % (alt_text.replace('"', '\\"'), resource_url)

        file_response = requests.post(
            graphql_url,
            json={'query': file_create_mutation},
            headers=headers,
            timeout=30
        )
        file_response.raise_for_status()

        file_result = file_response.json()

        if 'errors' in file_result:
            return False, "", f"File create errors: {file_result['errors']}"

        file_data = file_result.get('data', {}).get('fileCreate', {})
        file_errors = file_data.get('userErrors', [])

        if file_errors:
            return False, "", f"File user errors: {file_errors}"

        files = file_data.get('files', [])
        if not files:
            return False, "", "No file record created"

        video_file = files[0]
        sources = video_file.get('sources', [])

        if not sources:
            return False, "", "No video sources returned"

        cdn_url = sources[0]['url']

        return True, cdn_url, ""

    except requests.exceptions.RequestException as e:
        return False, "", f"Request error: {str(e)}"
    except Exception as e:
        return False, "", f"Unexpected error: {str(e)}"


def main():
    """Main function to upload all videos."""
    print("🎬 MyDealz Video Upload to Shopify CDN")
    print("=" * 60)

    # Load credentials
    print("\n📋 Loading Shopify credentials...")
    env_vars = load_env_vars()
    print(f"✅ Credentials loaded for store: {env_vars['SHOPIFY_STORE_URL']}")

    # Prepare videos directory
    videos_dir = Path(__file__).parent.parent / "Videos"

    if not videos_dir.exists():
        print(f"\n❌ ERROR: Videos directory not found at {videos_dir}")
        sys.exit(1)

    # Upload each video
    results = []

    for idx, video_info in enumerate(VIDEOS_TO_UPLOAD, 1):
        filename = video_info['filename']
        alt_text = video_info['alt']
        ratio = video_info['ratio']

        video_path = videos_dir / filename

        print(f"\n[{idx}/{len(VIDEOS_TO_UPLOAD)}] Uploading: {filename}")
        print(f"    Ratio: {ratio}")
        print(f"    Alt: {alt_text}")

        if not video_path.exists():
            print(f"    ⚠️  SKIPPED: File not found")
            results.append({
                'filename': filename,
                'ratio': ratio,
                'success': False,
                'url': '',
                'error': 'File not found'
            })
            continue

        file_size_mb = video_path.stat().st_size / (1024 * 1024)
        print(f"    Size: {file_size_mb:.2f} MB")
        print(f"    Uploading to Shopify...")

        success, cdn_url, error = upload_file_to_shopify(video_path, alt_text, env_vars)

        if success:
            print(f"    ✅ SUCCESS: {cdn_url}")
            results.append({
                'filename': filename,
                'ratio': ratio,
                'success': True,
                'url': cdn_url,
                'error': ''
            })
        else:
            print(f"    ❌ FAILED: {error}")
            results.append({
                'filename': filename,
                'ratio': ratio,
                'success': False,
                'url': '',
                'error': error
            })

    # Summary
    print("\n" + "=" * 60)
    print("📊 UPLOAD SUMMARY")
    print("=" * 60)

    successful_uploads = [r for r in results if r['success']]
    failed_uploads = [r for r in results if not r['success']]

    print(f"\n✅ Successful: {len(successful_uploads)}/{len(VIDEOS_TO_UPLOAD)}")
    print(f"❌ Failed: {len(failed_uploads)}/{len(VIDEOS_TO_UPLOAD)}")

    if successful_uploads:
        print("\n🎯 SUCCESSFUL UPLOADS:")
        for result in successful_uploads:
            print(f"\n  • {result['filename']} ({result['ratio']})")
            print(f"    URL: {result['url']}")

    if failed_uploads:
        print("\n⚠️  FAILED UPLOADS:")
        for result in failed_uploads:
            print(f"\n  • {result['filename']} ({result['ratio']})")
            print(f"    Error: {result['error']}")

    # Save results to JSON
    results_file = Path(__file__).parent.parent / "video_upload_results.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n💾 Results saved to: {results_file}")

    if failed_uploads:
        print("\n⚠️  Some uploads failed. Please review errors above.")
        sys.exit(1)
    else:
        print("\n🎉 All videos uploaded successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
