#!/usr/bin/env python3
"""
3A Automation - Grok/xAI Integration Client
Version: 1.0
Created: 2025-12-17

Usage:
    pip install xai-sdk python-dotenv
    python scripts/grok-client.py

Configuration:
    Set XAI_API_KEY in .env file
    Get key from: https://console.x.ai/api-keys
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Install with: pip install python-dotenv")

# Configuration
XAI_API_KEY = os.getenv("XAI_API_KEY")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/Users/mac/Desktop/JO-AAA/outputs")

# System Prompt for 3A Automation
SYSTEM_PROMPT = """Tu es l'assistant IA de 3A Automation (AAA - AI Automation Agency), spécialisée en Automatisation E-commerce (B2C) et Workflows PME (B2B).

## IDENTITÉ

- Nom: 3A Automation (Automation, Analytics, AI)
- Type: Agence d'Automatisation AI (AAA)
- Site: https://3a-automation.com
- Email: contact@3a-automation.com
- Localisation: Maroc, servant MENA et monde entier
- Langues: Français (principal), Anglais, Arabe (sur demande)

## SPÉCIALISATION

- Automatisation E-commerce (B2C) - TOUTES plateformes
- Workflows PME (B2B) - TOUTES plateformes
- Analytics & Tracking
- Intégrations AI

## EXPERTISE TECHNIQUE (TOUTES PLATEFORMES)

E-commerce: Shopify, WooCommerce, Magento, PrestaShop, BigCommerce, etc.
Email Marketing: Klaviyo, Mailchimp, Omnisend, HubSpot, Brevo, etc.
Analytics: Google Analytics 4, Mixpanel, Amplitude, etc.
Automation: n8n, Make, Zapier, scripts natifs Node.js
Marketing: Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads

## SERVICES OFFERTS

1. Automatisation E-commerce (TOUTES plateformes: sync, webhooks, flows)
2. Workflows PME B2B (CRM, ERP, facturation, etc.)
3. Analytics & Reporting (audits, dashboards GA4)
4. AI Integration (génération contenu, SEO automatisé, Voice AI)

OFFRE GRATUITE: Audit e-commerce complet
URL: https://3a-automation.com/#contact

## CIBLE CLIENT

PME de tous secteurs (e-commerce, healthcare, B2B, retail)
Revenue: €10k-500k/mois
Budget: €300-1000/mois

## PRINCIPES

1. Factualité: Ne jamais faire de claims non vérifiés
2. Transparence: Honnête sur ce qui est possible
3. ROI Focus: Actions liées à résultats mesurables
4. Pas de bullshit: Réponses directes, actionnables

## FORMAT

- Réponses courtes et actionnables
- Listes pour la clarté
- Exemples concrets
- Pas d'emojis sauf demande explicite
"""

# Specialized prompts
PROMPTS = {
    "audit": """Analyse les données suivantes et génère un rapport d'audit avec:
1. Points forts identifiés
2. Problèmes critiques (priorité haute)
3. Opportunités d'amélioration
4. Recommandations actionnables avec estimation d'impact

Données: {data}

Format: Markdown structuré, factuel uniquement.""",

    "email_content": """Génère le contenu email pour un flow {flow_type}.
Produit: {product_name}
Prix: {price}

Retourne:
- Subject line (50 chars max)
- Preview text (90 chars max)
- Body HTML structure avec CTA clair""",

    "product_description": """Génère une description produit optimisée SEO pour:
Produit: {product_name}
Catégorie: {category}
Caractéristiques: {features}
Prix: {price}

Format:
- Titre optimisé (60 chars max)
- Meta description (160 chars)
- Description longue (500-800 mots)
- 5 bullet points
- Alt text image"""
}


def check_api_key():
    """Verify xAI API key is configured"""
    if not XAI_API_KEY:
        print("\n" + "=" * 60)
        print("ERREUR: XAI_API_KEY non configuré")
        print("=" * 60)
        print("\nPour configurer:")
        print("1. Aller sur https://console.x.ai/api-keys")
        print("2. Créer une nouvelle clé API")
        print("3. Ajouter dans .env: XAI_API_KEY=your_key_here")
        print("\n" + "=" * 60)
        return False
    return True


def create_client():
    """Initialize xAI client"""
    try:
        from xai_sdk import Client
        return Client(api_key=XAI_API_KEY)
    except ImportError:
        print("\n" + "=" * 60)
        print("ERREUR: xai-sdk non installé")
        print("=" * 60)
        print("\nInstaller avec:")
        print("    pip install xai-sdk")
        print("Ou avec uv:")
        print("    uv add xai-sdk")
        print("\n" + "=" * 60)
        return None


def chat_completion(client, user_message: str, system_prompt: str = None) -> str:
    """Generate chat completion with 3A Automation context"""
    if system_prompt is None:
        system_prompt = SYSTEM_PROMPT

    try:
        response = client.chat.completions.create(
            model="grok-4-1-fast-reasoning",  # FRONTIER model (Jan 2026)
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=2048
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Erreur API: {str(e)}"


def test_connection(client):
    """Test xAI API connection"""
    print("\n" + "=" * 60)
    print("TEST CONNEXION xAI/GROK")
    print("=" * 60)

    test_message = "Présente-toi brièvement en une phrase."

    print(f"\nEnvoi message test: '{test_message}'")
    print("-" * 40)

    response = chat_completion(client, test_message)

    print(f"\nRéponse Grok:")
    print(response)
    print("\n" + "=" * 60)
    print("CONNEXION OK" if "Erreur" not in response else "CONNEXION ÉCHOUÉE")
    print("=" * 60)

    return "Erreur" not in response


def generate_audit_analysis(client, data_json: str) -> str:
    """Generate audit analysis from data"""
    prompt = PROMPTS["audit"].format(data=data_json)
    return chat_completion(client, prompt)


def generate_email_content(client, flow_type: str, product_name: str, price: str) -> str:
    """Generate email marketing content"""
    prompt = PROMPTS["email_content"].format(
        flow_type=flow_type,
        product_name=product_name,
        price=price
    )
    return chat_completion(client, prompt)


def generate_product_description(client, product_name: str, category: str,
                                   features: str, price: str) -> str:
    """Generate SEO-optimized product description"""
    prompt = PROMPTS["product_description"].format(
        product_name=product_name,
        category=category,
        features=features,
        price=price
    )
    return chat_completion(client, prompt)


def interactive_chat(client):
    """Interactive chat mode"""
    print("\n" + "=" * 60)
    print("3A AUTOMATION - CHAT INTERACTIF GROK")
    print("=" * 60)
    print("Tapez 'quit' pour quitter")
    print("Tapez 'help' pour les commandes disponibles")
    print("-" * 60)

    while True:
        try:
            user_input = input("\nVous: ").strip()

            if not user_input:
                continue

            if user_input.lower() == 'quit':
                print("Au revoir!")
                break

            if user_input.lower() == 'help':
                print("\nCommandes disponibles:")
                print("  quit  - Quitter le chat")
                print("  help  - Afficher cette aide")
                print("\nPosez n'importe quelle question sur l'automation,")
                print("les analytics, ou l'IA pour PME.")
                continue

            response = chat_completion(client, user_input)
            print(f"\n3A Assistant: {response}")

        except KeyboardInterrupt:
            print("\n\nInterrompu. Au revoir!")
            break


def main():
    """Main entry point"""
    print("\n" + "=" * 60)
    print("3A AUTOMATION - GROK CLIENT")
    print("Projet: 3a-automations")
    print("=" * 60)

    # Check API key
    if not check_api_key():
        sys.exit(1)

    # Create client
    client = create_client()
    if not client:
        sys.exit(1)

    # Test connection
    if not test_connection(client):
        sys.exit(1)

    # Start interactive chat
    interactive_chat(client)


if __name__ == "__main__":
    main()
