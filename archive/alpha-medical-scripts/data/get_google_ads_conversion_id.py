# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Get Google Ads Conversion ID from Shopify Settings
Checks if Google & YouTube app is installed and retrieves conversion tracking ID
"""

import requests
import os
import json
from dotenv import load_dotenv

load_dotenv('.env.admin')

SHOPIFY_STORE_DOMAIN = os.getenv('SHOPIFY_STORE_DOMAIN')
SHOPIFY_ADMIN_ACCESS_TOKEN = os.getenv('SHOPIFY_ADMIN_ACCESS_TOKEN')

headers = {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
    'Content-Type': 'application/json'
}

print("=" * 80)
print("RECHERCHE GOOGLE ADS CONVERSION ID - SHOPIFY API")
print("=" * 80)

# 1. Check installed apps/sales channels
print("\n🔍 Vérification des apps installées...")
# Note: Shopify doesn't expose app details via API for security
# But we can check shop settings

# 2. Check shop metafields for Google settings
graphql_url = f'https://{SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json'

query = """
{
  shop {
    name
    metafields(first: 50) {
      edges {
        node {
          namespace
          key
          value
          type
        }
      }
    }
  }
}
"""

try:
    response = requests.post(graphql_url, json={'query': query}, headers=headers)

    if response.status_code == 200:
        data = response.json()

        metafields = data.get('data', {}).get('shop', {}).get('metafields', {}).get('edges', [])

        google_metafields = [
            m['node'] for m in metafields
            if 'google' in m['node']['namespace'].lower() or
               'ads' in m['node']['namespace'].lower() or
               'conversion' in m['node']['key'].lower()
        ]

        if google_metafields:
            print(f"\n✅ Trouvé {len(google_metafields)} metafields Google/Ads:")
            for mf in google_metafields:
                print(f"\n   Namespace: {mf['namespace']}")
                print(f"   Key: {mf['key']}")
                print(f"   Value: {mf['value'][:100]}...")
        else:
            print("\n⚠️  Aucun metafield Google Ads trouvé dans les paramètres shop")

except Exception as e:
    print(f"\n❌ Erreur API: {e}")

# 3. Check theme settings
print("\n" + "-" * 80)
print("🔍 Vérification des settings theme...")

# Get active theme
try:
    themes_url = f'https://{SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/themes.json'
    response = requests.get(themes_url, headers=headers)

    if response.status_code == 200:
        themes = response.json().get('themes', [])
        active_theme = next((t for t in themes if t['role'] == 'main'), None)

        if active_theme:
            theme_id = active_theme['id']
            theme_name = active_theme['name']

            print(f"\n✅ Thème actif: {theme_name} (ID: {theme_id})")

            # Get theme assets that might contain Google Ads config
            assets_url = f'https://{SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/themes/{theme_id}/assets.json'
            response = requests.get(assets_url, headers=headers, params={'asset[key]': 'config/settings_data.json'})

            if response.status_code == 200:
                asset_data = response.json().get('asset', {})
                settings_value = asset_data.get('value', '')

                if settings_value:
                    try:
                        settings = json.loads(settings_value)
                        current_settings = settings.get('current', {})

                        # Search for Google Ads keys
                        google_keys = {
                            k: v for k, v in current_settings.items()
                            if 'google' in k.lower() or 'ads' in k.lower() or 'conversion' in k.lower()
                        }

                        if google_keys:
                            print(f"\n✅ Trouvé {len(google_keys)} settings Google Ads dans le thème:")
                            for key, value in google_keys.items():
                                print(f"   {key}: {value}")
                        else:
                            print("\n⚠️  Aucun setting Google Ads trouvé dans config/settings_data.json")

                    except json.JSONDecodeError:
                        print("\n⚠️  Impossible de parser settings_data.json")
            else:
                print(f"\n⚠️  Impossible de récupérer settings_data.json (HTTP {response.status_code})")

except Exception as e:
    print(f"\n❌ Erreur thème: {e}")

# 4. Final instruction
print("\n" + "=" * 80)
print("📋 INSTRUCTION MANUELLE REQUISE")
print("=" * 80)
print("""
Le Conversion ID (format AW-XXXXXXXXXX) ne peut pas être récupéré automatiquement
via l'API Shopify. Vous devez l'obtenir MANUELLEMENT depuis votre compte Google Ads.

ÉTAPES EXACTES:

1. Allez sur: https://ads.google.com/

2. Connectez-vous au compte: Alpha Medical Care (Customer ID: 128-734-6786)

3. Navigation:
   - Cliquez "Outils et paramètres" (icône clé en haut à droite)
   - Section "Mesure" → Cliquez "Conversions"

4. Si aucune conversion n'existe:
   - Cliquez "+ Nouvelle action de conversion"
   - Sélectionnez "Site web"
   - Choisissez "Achat" comme catégorie
   - Créez la conversion

5. Une fois créée, cliquez sur la conversion:
   - Cliquez "Installer le tag vous-même"
   - Vous verrez le code avec: gtag('config', 'AW-XXXXXXXXXX');
   - Copiez le AW-XXXXXXXXXX

6. PUIS, exécutez:
   python3 install_google_ads_pixel.py AW-XXXXXXXXXX

Le script install_google_ads_pixel.py sera créé et installera automatiquement
le pixel dans votre thème avec le bon ID.
""")

print("=" * 80)
