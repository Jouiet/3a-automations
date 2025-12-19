# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Get detailed error from N8N execution
"""

import requests
import json

N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

print("=" * 70)
print("EXECUTION ERROR DETAILS")
print("=" * 70)
print()

# Get execution 2 (latest)
response = requests.get(f'{N8N_URL}/executions/2', headers=headers)

if response.status_code == 200:
    exec_data = response.json()

    print(f"Execution ID: {exec_data['id']}")
    print(f"Status: {exec_data['status']}")
    print(f"Started: {exec_data['startedAt']}")
    print(f"Stopped: {exec_data.get('stoppedAt', 'N/A')}")
    print()

    # Get error details
    if 'data' in exec_data and 'resultData' in exec_data['data']:
        result = exec_data['data']['resultData']

        if 'error' in result:
            print("❌ ERROR MESSAGE:")
            print("-" * 70)
            error = result['error']
            print(json.dumps(error, indent=2))
            print()

        # Check run data for node errors
        if 'runData' in result:
            print("📋 NODES EXECUTED:")
            print("-" * 70)
            for node_name, node_runs in result['runData'].items():
                print(f"\n🔹 {node_name}:")
                for run in node_runs:
                    if 'error' in run:
                        print(f"   ❌ ERROR: {run['error'].get('message', 'Unknown error')}")
                    else:
                        print(f"   ✅ Success")

        # Check last node
        if 'lastNodeExecuted' in result:
            print()
            print(f"🔴 Last node executed: {result['lastNodeExecuted']}")

    print()
    print("=" * 70)
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
