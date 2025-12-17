# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Investigate why output file is missing from OUTPUT folder
"""

import requests
import json

N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
WORKFLOW_ID = 'q0kyXyhCUq5gjmG2'
OUTPUT_FILE_ID = '1jh6tqawh__CruzZyZVIEzkYJLKcpzcBK'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

print("=" * 80)
print("INVESTIGATING OUTPUT FILE MYSTERY")
print("=" * 80)
print()
print(f"Output File ID from Sheet: {OUTPUT_FILE_ID}")
print()

# Get latest executions
print("📋 Getting latest workflow executions...")
response = requests.get(f'{N8N_URL}/executions', headers=headers, params={'workflowId': WORKFLOW_ID})

if response.status_code != 200:
    print(f"❌ Error: {response.status_code}")
    exit(1)

executions = response.json()['data']
print(f"Found {len(executions)} recent executions")
print()

# Find the successful one (most recent)
latest_success = None
for exec in executions:
    if exec['status'] == 'success':
        latest_success = exec
        break

if not latest_success:
    print("❌ No successful execution found")
    exit(1)

exec_id = latest_success['id']
print(f"✅ Latest successful execution: #{exec_id}")
print(f"   Status: {latest_success['status']}")
print(f"   Started: {latest_success['startedAt']}")
print(f"   Stopped: {latest_success.get('stoppedAt', 'N/A')}")
print()

# Get full execution details
print("📋 Getting execution details...")
response = requests.get(f'{N8N_URL}/executions/{exec_id}', headers=headers)

if response.status_code != 200:
    print(f"❌ Error: {response.status_code}")
    exit(1)

execution = response.json()
print()
print("=" * 80)
print("ANALYZING NODE OUTPUTS")
print("=" * 80)
print()

if 'data' not in execution or 'resultData' not in execution['data']:
    print("❌ No result data in execution")
    exit(1)

result_data = execution['data']['resultData']

if 'runData' not in result_data:
    print("❌ No runData found")
    exit(1)

run_data = result_data['runData']

print(f"Nodes executed: {len(run_data)}")
print()

# Look for nodes related to file saving
save_nodes = []
for node_name, runs in run_data.items():
    if 'save' in node_name.lower() or 'upload' in node_name.lower() or 'create' in node_name.lower():
        save_nodes.append(node_name)
        print(f"🔍 Found relevant node: {node_name}")

print()
print("=" * 80)
print("DETAILED NODE ANALYSIS")
print("=" * 80)
print()

for node_name in save_nodes:
    runs = run_data[node_name]
    print(f"📦 Node: {node_name}")
    print(f"   Executions: {len(runs)}")

    for i, run in enumerate(runs):
        print(f"\n   Run #{i+1}:")

        # Check for errors
        if 'error' in run:
            print(f"   ❌ ERROR: {run['error'].get('message', 'Unknown')}")
            if 'description' in run['error']:
                print(f"   Details: {run['error']['description']}")

        # Check output data
        if 'data' in run and 'main' in run['data']:
            main_data = run['data']['main']
            if main_data and len(main_data) > 0:
                items = main_data[0]
                print(f"   Output items: {len(items)}")

                # Look for file information
                for j, item in enumerate(items):
                    if 'json' in item:
                        json_data = item['json']
                        print(f"\n   Item #{j+1} JSON:")

                        # Look for file ID, name, parents
                        if 'id' in json_data:
                            print(f"      File ID: {json_data['id']}")
                        if 'name' in json_data:
                            print(f"      File Name: {json_data['name']}")
                        if 'parents' in json_data:
                            print(f"      Parents (folders): {json_data['parents']}")
                        if 'webViewLink' in json_data:
                            print(f"      View Link: {json_data['webViewLink']}")

                        # Check if this is our missing file
                        if 'id' in json_data and json_data['id'] == OUTPUT_FILE_ID:
                            print(f"\n      🎯 THIS IS THE OUTPUT FILE!")
                            print(f"      Expected Folder: 1gs_U0T9ZapXtlrrvzxS9IX0AI9Qllnox")
                            if 'parents' in json_data:
                                actual_folder = json_data['parents'][0] if json_data['parents'] else 'NONE'
                                print(f"      Actual Folder: {actual_folder}")

                                if actual_folder != '1gs_U0T9ZapXtlrrvzxS9IX0AI9Qllnox':
                                    print(f"\n      ❌ PROBLEM FOUND: File saved to WRONG FOLDER!")
                                    print(f"         Expected: 1gs_U0T9ZapXtlrrvzxS9IX0AI9Qllnox (Alpha Medical Output)")
                                    print(f"         Actual: {actual_folder}")
                                else:
                                    print(f"\n      ✅ File is in CORRECT folder")
                                    print(f"         But you said it's not visible in the folder?")
                                    print(f"         Maybe permissions issue or folder view not refreshed?")
            else:
                print(f"   ⚠️ No output data")

    print()

print("=" * 80)
print("RECOMMENDATIONS")
print("=" * 80)
print()
print("1. Check the actual parent folder ID shown above")
print("2. If wrong folder: Need to fix 'Save image' node configuration")
print("3. If correct folder: File may need permissions refresh or folder view refresh")
print("4. Try accessing file directly: https://drive.google.com/file/d/{}/view".format(OUTPUT_FILE_ID))
print()
