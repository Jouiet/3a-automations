# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Restart workflow (deactivate then reactivate) to restart triggers
"""

import requests
import time

N8N_URL = 'https://n8n.srv1168256.hstgr.cloud/api/v1'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0NjI1NjI1fQ.YJeonYPrTdnjDewHvVv_BbPAbNnB9UEr2DbtGXIeALo'
WORKFLOW_ID = 'q0kyXyhCUq5gjmG2'

headers = {'X-N8N-API-KEY': N8N_API_KEY}

print("=" * 80)
print("RESTART WORKFLOW (TRIGGERS)")
print("=" * 80)
print()

# Step 1: Deactivate
print("1️⃣ Désactivation du workflow...")
response = requests.post(f'{N8N_URL}/workflows/{WORKFLOW_ID}/deactivate', headers=headers)

if response.status_code == 200:
    print("✅ Workflow désactivé")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
    exit(1)

# Wait 2 seconds
print()
print("⏰ Attente 2 secondes...")
time.sleep(2)

# Step 2: Reactivate
print()
print("2️⃣ Réactivation du workflow...")
response = requests.post(f'{N8N_URL}/workflows/{WORKFLOW_ID}/activate', headers=headers)

if response.status_code == 200:
    print("✅ Workflow réactivé")
    print()
    print("=" * 80)
    print("🎉 WORKFLOW REDÉMARRÉ!")
    print("=" * 80)
    print()
    print("✅ Les triggers ont été redémarrés")
    print()
    print("⏰ Prochaine vérification du dossier INPUT: dans 5 minutes max")
    print()
    print("📂 Vérifiez que votre fichier test est bien dans INPUT:")
    print("   https://drive.google.com/drive/folders/1O1PrZoTDweXQx8ImVLXlJArei9hdvizn")
    print()
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)

print("=" * 80)
