# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
import requests, json, sys

N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
exec_id = sys.argv[1] if len(sys.argv) > 1 else '7'

headers = {'X-N8N-API-KEY': N8N_API_KEY}
response = requests.get(f'{N8N_URL}/executions/{exec_id}', headers=headers)

if response.status_code == 200:
    data = response.json()
    print(f"Execution #{exec_id}: {data['status'].upper()}")
    print(f"Started: {data['startedAt']}")

    if 'data' in data and 'resultData' in data['data']:
        result = data['data']['resultData']
        if 'error' in result:
            print(f"\n❌ ERROR: {result['error'].get('message', 'Unknown')}")

        if 'runData' in result:
            print(f"\n📋 Nodes executed: {len(result['runData'])}")
            for node_name, runs in result['runData'].items():
                for run in runs:
                    if 'error' in run:
                        print(f"\n🔴 {node_name}: {run['error'].get('message', 'Unknown error')}")
else:
    print(f"Error: {response.status_code}")
