# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Diagnose why trigger is not firing
"""

import requests

N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
WORKFLOW_ID = 'q0kyXyhCUq5gjmG2'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

print("=" * 80)
print("DIAGNOSTIC: POURQUOI LE TRIGGER NE SE DÉCLENCHE PAS")
print("=" * 80)
print()

# Check workflow status
response = requests.get(f'{N8N_URL}/workflows/{WORKFLOW_ID}', headers=headers)
workflow = response.json()

print("1️⃣ WORKFLOW STATUS")
print("-" * 80)
print(f"Name: {workflow['name']}")
print(f"Active: {workflow['active']}")
print(f"ID: {workflow['id']}")
print()

if not workflow['active']:
    print("❌ PROBLÈME: Le workflow est INACTIF!")
    print("   Le trigger ne peut pas se déclencher si le workflow est inactif.")
    print()
    print("   SOLUTION: Réactiver le workflow")
    print("   URL: https://n8n.srv1168256.hstgr.cloud/workflow/q0kyXyhCUq5gjmG2")
    print()
    exit(1)
else:
    print("✅ Workflow est ACTIF")
    print()

# Check trigger nodes
print("2️⃣ TRIGGER NODES CONFIGURATION")
print("-" * 80)

trigger_count = 0
for node in workflow['nodes']:
    if 'Trigger' in node['type']:
        trigger_count += 1
        print(f"\n🔹 {node['name']}")
        print(f"   Type: {node['type']}")

        params = node.get('parameters', {})

        # Check poll times
        if 'pollTimes' in params:
            poll_times = params['pollTimes']
            print(f"   Poll Times: {poll_times}")

        # Check folder
        if 'folderToWatch' in params:
            folder_config = params['folderToWatch']
            if isinstance(folder_config, dict):
                folder_id = folder_config.get('value')
            else:
                folder_id = folder_config

            print(f"   Folder ID: {folder_id}")

            # Expected INPUT folder
            INPUT_FOLDER = '1O1PrZoTDweXQx8ImVLXlJArei9hdvizn'
            if folder_id == INPUT_FOLDER:
                print(f"   ✅ Surveille INPUT folder (correct)")
            else:
                print(f"   ⚠️ Folder inattendu")

print()
print(f"Total trigger nodes: {trigger_count}")
print()

# Check recent executions
print("3️⃣ RECENT EXECUTIONS")
print("-" * 80)

response = requests.get(f'{N8N_URL}/executions', headers=headers, params={'workflowId': WORKFLOW_ID, 'limit': 5})
executions = response.json()['data']

if executions:
    latest = executions[0]
    print(f"Latest execution: #{latest['id']}")
    print(f"  Started: {latest['startedAt']}")
    print(f"  Status: {latest['status']}")
    print(f"  Mode: {latest.get('mode', 'N/A')}")
    print()

    from datetime import datetime
    start_dt = datetime.fromisoformat(latest['startedAt'].replace('Z', '+00:00'))
    now_dt = datetime.utcnow().replace(tzinfo=start_dt.tzinfo)
    minutes_ago = (now_dt - start_dt).total_seconds() / 60

    print(f"⏰ Dernière exécution il y a {minutes_ago:.0f} minutes")
    print()

    if minutes_ago > 10:
        print("⚠️ Aucune exécution depuis >10 minutes")
        print()
        print("Causes possibles:")
        print("  1. Aucun fichier dans le dossier INPUT")
        print("  2. Le trigger poll est suspendu ou bugué")
        print("  3. Les credentials Google Drive ont expiré")
        print("  4. Le filtre bloque tous les fichiers")

print()
print("=" * 80)
print("RECOMMANDATIONS")
print("=" * 80)
print()
print("1. Vérifier qu'il y a bien un fichier dans INPUT:")
print("   https://drive.google.com/drive/folders/1O1PrZoTDweXQx8ImVLXlJArei9hdvizn")
print()
print("2. Tester manuellement le workflow (bouton 'Execute Workflow' dans N8N)")
print()
print("3. Désactiver puis réactiver le workflow pour restart les triggers")
print()
print("4. Vérifier les credentials Google Drive sont toujours valides")
print()
print("=" * 80)
