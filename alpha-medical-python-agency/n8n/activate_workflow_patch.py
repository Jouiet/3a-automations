# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Activate N8N workflow using PATCH method
"""

import requests

# N8N API config
N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
WORKFLOW_ID = 'q0kyXyhCUq5gjmG2'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

print("=" * 70)
print("ACTIVATING N8N WORKFLOW")
print("=" * 70)
print()

# Try different activation methods

# Method 1: POST to /activate endpoint
print("📋 Method 1: POST /workflows/{id}/activate")
response = requests.post(f'{N8N_URL}/workflows/{WORKFLOW_ID}/activate', headers=headers)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print("   ✅ SUCCESS!")
elif response.status_code == 404:
    print("   ❌ Endpoint not found")
else:
    print(f"   Response: {response.text}")

print()

# Method 2: PATCH with active flag
print("📋 Method 2: PATCH /workflows/{id} with {\"active\": true}")
response = requests.patch(
    f'{N8N_URL}/workflows/{WORKFLOW_ID}',
    json={'active': True},
    headers=headers
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print("   ✅ SUCCESS!")
    result = response.json()
    print(f"   Active: {result.get('active', 'unknown')}")
else:
    print(f"   Response: {response.text}")

print()

# Method 3: Check final status
print("📋 Checking final status...")
response = requests.get(f'{N8N_URL}/workflows/{WORKFLOW_ID}', headers=headers)
if response.status_code == 200:
    workflow = response.json()
    if workflow['active']:
        print("✅ WORKFLOW IS NOW ACTIVE!")
    else:
        print("⚠️ Workflow still inactive")
        print()
        print("💡 MANUAL ACTIVATION REQUIRED:")
        print("   The workflow trigger needs validation.")
        print("   1. Go to: https://n8n.srv1168256.hstgr.cloud/workflow/q0kyXyhCUq5gjmG2")
        print("   2. Click the 'Active' toggle in top right")
        print("   3. If error about 'File Created' node:")
        print("      - Upload 1 test image to Google Drive folder")
        print("      - https://drive.google.com/drive/folders/1gs_U0T9ZapXtlrrvzxS9IX0AI9Qllnox")
        print("      - Then retry activation")

print()
print("=" * 70)
