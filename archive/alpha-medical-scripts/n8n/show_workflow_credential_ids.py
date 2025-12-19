# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Show all credential IDs used in N8N workflow
"""

import requests
import json

# N8N API config
N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
WORKFLOW_ID = 'q0kyXyhCUq5gjmG2'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

print("=" * 70)
print("WORKFLOW CREDENTIAL IDs")
print("=" * 70)
print()

# Get workflow
response = requests.get(f'{N8N_URL}/workflows/{WORKFLOW_ID}', headers=headers)
if response.status_code != 200:
    print(f"❌ Error: {response.status_code}")
    exit(1)

workflow = response.json()

print(f"Workflow: {workflow['name']}")
print()
print("CREDENTIALS USED:")
print("-" * 70)

# Collect all unique credential IDs and their types
cred_usage = {}

for node in workflow['nodes']:
    if 'credentials' in node and node['credentials']:
        for cred_type, cred_info in node['credentials'].items():
            cred_id = cred_info.get('id', 'NO_ID')

            if cred_id not in cred_usage:
                cred_usage[cred_id] = {
                    'type': cred_type,
                    'nodes': []
                }

            cred_usage[cred_id]['nodes'].append(node['name'])

# Display
for cred_id, info in cred_usage.items():
    print(f"\n📌 Credential ID: {cred_id}")
    print(f"   Type: {info['type']}")
    print(f"   Used by {len(info['nodes'])} nodes:")
    for node_name in info['nodes']:
        print(f"      - {node_name}")

print()
print("=" * 70)
print()
print("💡 POUR CRÉER UNE NOUVELLE CREDENTIAL ET RÉCUPÉRER L'ID:")
print()
print("1. Va sur N8N → Credentials")
print("2. Clique sur une credential que tu as créée")
print("3. Dans l'URL, tu verras: /credentials/{ID}")
print("4. Copie cet ID")
print()
print("Example: https://n8n.srv1168256.hstgr.cloud/credentials/ABC123")
print("         L'ID = ABC123")
print()
print("=" * 70)
