# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
List ALL workflow nodes with detailed configuration
"""

import requests
import json

N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
WORKFLOW_ID = 'q0kyXyhCUq5gjmG2'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

print("=" * 80)
print("ALL WORKFLOW NODES - COMPLETE LISTING")
print("=" * 80)
print()

response = requests.get(f'{N8N_URL}/workflows/{WORKFLOW_ID}', headers=headers)
if response.status_code != 200:
    print(f"❌ Error: {response.status_code}")
    exit(1)

workflow = response.json()

print(f"Workflow: {workflow['name']}")
print(f"Total Nodes: {len(workflow['nodes'])}")
print()

for i, node in enumerate(workflow['nodes'], 1):
    print(f"{'=' * 80}")
    print(f"NODE #{i}: {node['name']}")
    print(f"{'=' * 80}")
    print(f"Type: {node['type']}")
    print(f"Position: ({node['position'][0]}, {node['position'][1]})")
    print()

    params = node.get('parameters', {})
    if params:
        print("Parameters:")
        for key, value in params.items():
            # Pretty print based on type
            if isinstance(value, dict):
                print(f"  {key}:")
                for subkey, subvalue in value.items():
                    print(f"    {subkey}: {subvalue}")
            elif isinstance(value, list):
                print(f"  {key}: {value}")
            else:
                print(f"  {key}: {value}")
        print()

    creds = node.get('credentials', {})
    if creds:
        print("Credentials:")
        for cred_type, cred_info in creds.items():
            print(f"  {cred_type}: {cred_info.get('id')}")
        print()

    print()

# Now specifically look for nodes that might handle OUTPUT
print()
print("=" * 80)
print("NODES THAT MIGHT WRITE OUTPUT FILES")
print("=" * 80)
print()

for node in workflow['nodes']:
    node_name = node['name']
    params = node.get('parameters', {})

    # Look for any node that mentions "save", "output", "write", "upload", "create"
    keywords = ['save', 'output', 'write', 'upload', 'create', 'move', 'copy']

    if any(keyword in node_name.lower() for keyword in keywords):
        print(f"🔹 {node_name}")
        print(f"   Type: {node['type']}")

        if 'operation' in params:
            print(f"   Operation: {params['operation']}")

        # Look for any folder-related parameters
        folder_params = ['folderId', 'parent', 'driveId', 'parents', 'folder', 'destination']
        for param_name in folder_params:
            if param_name in params:
                value = params[param_name]
                if isinstance(value, dict):
                    print(f"   {param_name}: {value.get('value', value)}")
                else:
                    print(f"   {param_name}: {value}")

        print()

print()
print("=" * 80)
print("NODES WITH FOLDER PARAMETERS")
print("=" * 80)
print()

INPUT_FOLDER = '1O1PrZoTDweXQx8ImVLXlJArei9hdvizn'
OUTPUT_FOLDER = '1gs_U0T9ZapXtlrrvzxS9IX0AI9Qllnox'

for node in workflow['nodes']:
    params = node.get('parameters', {})
    has_folder = False
    folder_info = []

    # Check all possible folder parameter names
    for param_name, param_value in params.items():
        if isinstance(param_value, dict) and 'value' in param_value:
            if INPUT_FOLDER in str(param_value['value']) or OUTPUT_FOLDER in str(param_value['value']):
                has_folder = True
                folder_id = param_value['value']
                folder_type = 'INPUT' if folder_id == INPUT_FOLDER else 'OUTPUT'
                folder_info.append(f"{param_name}={folder_type} ({folder_id})")

        elif isinstance(param_value, str):
            if INPUT_FOLDER in param_value or OUTPUT_FOLDER in param_value:
                has_folder = True
                folder_type = 'INPUT' if INPUT_FOLDER in param_value else 'OUTPUT'
                folder_info.append(f"{param_name}={folder_type}")

    if has_folder:
        print(f"🔹 {node['name']}")
        print(f"   Type: {node['type']}")
        for info in folder_info:
            print(f"   {info}")
        print()

print("=" * 80)
