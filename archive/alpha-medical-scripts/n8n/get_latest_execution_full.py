# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
import requests, json

N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
WORKFLOW_ID = 'q0kyXyhCUq5gjmG2'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

# Get latest execution
response = requests.get(f'{N8N_URL}/executions', headers=headers, params={'workflowId': WORKFLOW_ID})
executions = response.json()['data']

latest = executions[0]
print(f"Latest execution #{latest['id']}: {latest['status']}")
print(f"Started: {latest['startedAt']}")
print()

# Get full details with includeData=true
response = requests.get(f'{N8N_URL}/executions/{latest["id"]}?includeData=true', headers=headers)
data = response.json()

# Save to file for inspection
with open('latest_execution_full.json', 'w') as f:
    json.dump(data, f, indent=2)

print("✅ Full execution saved to: latest_execution_full.json")
print()

# Look for Save image node
if 'data' in data and 'resultData' in data['data'] and 'runData' in data['data']['resultData']:
    runData = data['data']['resultData']['runData']

    if 'Save image' in runData:
        print("🔍 'Save image' node output:")
        save_data = runData['Save image'][0]['data']['main'][0]
        for item in save_data:
            if 'json' in item:
                j = item['json']
                print(f"   File ID: {j.get('id', 'N/A')}")
                print(f"   Name: {j.get('name', 'N/A')}")
                print(f"   Parents: {j.get('parents', 'N/A')}")
                print(f"   WebContentLink: {j.get('webContentLink', 'N/A')}")
                print()
