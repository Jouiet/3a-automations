# Type: agency
# Category: n8n
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Complete Shopify Flow Automation - Loyalty Tier Tagging
Completes the remaining 40% of workflow configuration
Date: 2025-11-20
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), '.env.admin')
load_dotenv(load_env_path)

SHOPIFY_STORE_DOMAIN = os.getenv('SHOPIFY_STORE_DOMAIN')
SHOPIFY_ADMIN_ACCESS_TOKEN = os.getenv('SHOPIFY_ADMIN_ACCESS_TOKEN')

print("=" * 80)
print("GUIDE MANUEL - COMPLÉTER LE WORKFLOW SHOPIFY FLOW")
print("=" * 80)
print(f"\nWorkflow URL: https://admin.shopify.com/store/azffej-as/apps/flow/editor/019aa2e4-81e1-798b-8beb-91d1e89d7238/01KAHE90EY2HNH84H6P67AM079")
print("\nSTATUT ACTUEL:")
print("✅ Tier Platinum ($2500+) - 100% configuré")
print("⏳ Tier Gold ($1000-$2499) - À configurer")
print("⏳ Tier Silver ($500-$999) - À configurer")
print("⏳ Tier Bronze ($0-$499) - À configurer")
print("\n" + "=" * 80)

print("\nÉTAPES DÉTAILLÉES (5-10 minutes):")
print("\n1️⃣  CONFIGURER TIER GOLD")
print("-" * 80)
print("a) Cliquez sur le bouton '+' de la branche FALSE (sous 'Amount >= 2500')")
print("b) Sélectionnez 'Create condition'")
print("c) Configuration de la condition:")
print("   - Cliquez sur 'Select a variable'")
print("   - Naviguez: Order → Purchasing entity → Customer → Amount spent → Amount")
print("   - Comparison: 'Greater than or equal to'")
print("   - Value: 1000")
print("\nd) Branche TRUE (Gold):")
print("   - Cliquez sur '+' → 'Add customer tags'")
print("   - Tags: loyalty-gold")
print("   - Cliquez sur '+' → 'Remove customer tags'")
print("   - Tags: loyalty-bronze, loyalty-silver, loyalty-platinum")

print("\n2️⃣  CONFIGURER TIER SILVER")
print("-" * 80)
print("a) Cliquez sur le bouton '+' de la branche FALSE de la condition Gold")
print("b) Sélectionnez 'Create condition'")
print("c) Configuration:")
print("   - Variable: Order → ... → Amount spent → Amount")
print("   - Comparison: 'Greater than or equal to'")
print("   - Value: 500")
print("\nd) Branche TRUE (Silver):")
print("   - Add customer tags: loyalty-silver")
print("   - Remove customer tags: loyalty-bronze, loyalty-gold, loyalty-platinum")

print("\n3️⃣  CONFIGURER TIER BRONZE")
print("-" * 80)
print("a) Dans la branche FALSE de la condition Silver:")
print("   - Cliquez sur '+' → 'Add customer tags'")
print("   - Tags: loyalty-bronze")
print("   - Cliquez sur '+' → 'Remove customer tags'")
print("   - Tags: loyalty-silver, loyalty-gold, loyalty-platinum")

print("\n4️⃣  ACTIVER LE WORKFLOW")
print("-" * 80)
print("a) Cliquez sur 'Turn on workflow' en haut à droite")
print("b) Confirmez l'activation")

print("\n" + "=" * 80)
print("STRUCTURE FINALE ATTENDUE:")
print("=" * 80)
print("""
Order paid
│
└─► IF amount >= 2500 (Platinum) ✅ FAIT
    ├─► TRUE:
    │   ├─► Add tag: loyalty-platinum ✅
    │   └─► Remove tags: bronze, silver, gold ✅
    │
    └─► FALSE: IF amount >= 1000 (Gold) ⏳ À FAIRE
        ├─► TRUE:
        │   ├─► Add tag: loyalty-gold
        │   └─► Remove tags: bronze, silver, platinum
        │
        └─► FALSE: IF amount >= 500 (Silver) ⏳ À FAIRE
            ├─► TRUE:
            │   ├─► Add tag: loyalty-silver
            │   └─► Remove tags: bronze, gold, platinum
            │
            └─► FALSE (Bronze) ⏳ À FAIRE
                ├─► Add tag: loyalty-bronze
                └─► Remove tags: silver, gold, platinum
""")

print("\n" + "=" * 80)
print("VÉRIFICATION FINALE:")
print("=" * 80)
print("\n1. Vérifiez que le workflow est 'Active'")
print("2. Testez avec une commande de test")
print("3. Vérifiez les tags appliqués au client")
print("\n" + "=" * 80)
print("\n✨ Le tier Platinum est déjà configuré et sert de modèle!")
print("💡 Suivez exactement la même structure pour les 3 tiers restants")
print("\n" + "=" * 80)
