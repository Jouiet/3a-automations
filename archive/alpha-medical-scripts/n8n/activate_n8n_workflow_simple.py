# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Simple script to check N8N workflow status and attempt activation
"""

import requests
import json

# N8N API config
N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
WORKFLOW_ID = 'q0kyXyhCUq5gjmG2'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

print("=" * 70)
print("N8N WORKFLOW STATUS CHECK")
print("=" * 70)
print()

# Get workflow details
print("📋 Getting workflow details...")
response = requests.get(f'{N8N_URL}/workflows/{WORKFLOW_ID}', headers=headers)

if response.status_code != 200:
    print(f"❌ Error: HTTP {response.status_code}")
    print(response.text)
    exit(1)

workflow = response.json()

print(f"✅ Workflow: {workflow['name']}")
print(f"   ID: {workflow['id']}")
print(f"   Nodes: {len(workflow['nodes'])}")
print(f"   Active: {'✅ YES' if workflow['active'] else '⚠️ NO'}")
print()

# Check credentials in nodes
print("📋 Checking node credentials...")
print("-" * 70)

has_issues = False
for node in workflow['nodes']:
    if 'credentials' in node and node['credentials']:
        for cred_type, cred_info in node['credentials'].items():
            status = "✅" if cred_info.get('id') else "❌"
            print(f"{status} Node '{node['name']}': {cred_type}")
            if not cred_info.get('id'):
                has_issues = True
                print(f"   ⚠️ No credential ID assigned!")

print()

if not workflow['active']:
    print("📋 Attempting to activate workflow...")
    print("-" * 70)

    # Set active to True (don't include 'id' - it's read-only)
    workflow_update = {
        'name': workflow['name'],
        'nodes': workflow['nodes'],
        'connections': workflow['connections'],
        'active': True,
        'settings': workflow.get('settings', {}),
        'staticData': workflow.get('staticData', None)
    }

    response = requests.put(
        f'{N8N_URL}/workflows/{WORKFLOW_ID}',
        json=workflow_update,
        headers=headers
    )

    if response.status_code == 200:
        result = response.json()
        if result.get('active'):
            print("✅ Workflow ACTIVATED successfully!")
        else:
            print("⚠️ Workflow updated but not active")
            print("   This usually means the trigger node needs validation")
            print("   Solution: Upload a test file to Google Drive folder")
    else:
        print(f"❌ Activation failed: HTTP {response.status_code}")
        print(response.text)

        if "No data with the current filter could be found" in response.text:
            print()
            print("💡 SOLUTION:")
            print("   The trigger node 'File Created' needs at least 1 file in the folder")
            print("   to validate. Upload a test image to:")
            print("   https://drive.google.com/drive/folders/1gs_U0T9ZapXtlrrvzxS9IX0AI9Qllnox")
else:
    print("✅ Workflow is already active!")

print()
print("=" * 70)
