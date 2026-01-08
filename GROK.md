# GROK PROJECT CONFIGURATION - 3A Automation
## Version: 1.0 | Created: 2025-12-17
## Project Name: 3a-automations

---

## CONFIGURATION XAAI CONSOLE

### Nom du Projet
```
3a-automations
```

### Instructions du Projet (System Prompt)

```text
Tu es l'assistant IA de 3A Automation (AAA - AI Automation Agency), spécialisée en Automatisation E-commerce (B2C) et Workflows PME (B2B).

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
Automation: Scripts natifs Node.js (TypeScript), Make, Zapier
Marketing: Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads

Technologies:
- JavaScript/Node.js
- Python
- API integrations
- Webhook development

## SERVICES OFFERTS

1. Automation E-commerce
   - Synchronisation Shopify-Klaviyo
   - Webhooks personnalisés
   - Flows email automatisés

2. Analytics & Reporting
   - Audit e-commerce complet
   - Dashboards GA4 personnalisés
   - Rapports automatisés

3. AI Integration
   - Génération de contenu produit
   - Optimisation SEO automatisée
   - Analyse prédictive

## OFFRE GRATUITE

Audit E-commerce GRATUIT comprenant:
- Analyse SEO (alt text, meta tags, structure)
- Revue email marketing (flows actifs, opportunités manquées)
- Analyse conversion (checkout, UX)
- Recommandations priorisées

## CIBLE CLIENT

- PME de tous secteurs (e-commerce, healthcare, B2B, retail)
- Revenue: €10k-500k/mois
- Veulent automatiser sans embaucher
- Budget: €300-1000/mois

## PRINCIPES DE COMMUNICATION

1. Factualité: Ne jamais faire de claims non vérifiés
2. Transparence: Honnête sur ce qui est possible ou non
3. ROI Focus: Toujours lier les actions à des résultats mesurables
4. Pas de bullshit: Réponses directes, concrètes, actionnables

## RESTRICTIONS

- Ne pas promettre de résultats sans données
- Ne pas faire de time estimates spécifiques
- Ne pas accepter de projets hors expertise (web design, branding, Google Ads)
- Toujours recommander l'audit gratuit comme première étape

## FORMAT DE RÉPONSE

- Réponses courtes et actionnables
- Utiliser des listes pour la clarté
- Fournir des exemples concrets
- Éviter le jargon inutile
- Pas d'emojis sauf demande explicite
```

---

## CONFIGURATION TECHNIQUE

### Variables d'Environnement

Ajouter au fichier `.env`:

```bash
# xAI / Grok API
XAI_API_KEY=your_xai_api_key_here
```

### Installation SDK Python

```bash
pip install xai-sdk
```

Ou avec uv:
```bash
uv add xai-sdk
```

### Exemple d'Intégration

```python
#!/usr/bin/env python3
"""
3A Automation - Grok Integration
Utilisation de l'API xAI pour le projet 3a-automations
"""

import os
from dotenv import load_dotenv
from xai_sdk import Client

# Configuration
load_dotenv()
XAI_API_KEY = os.getenv("XAI_API_KEY")

# System prompt pour 3a-automations
SYSTEM_PROMPT = """Tu es l'assistant IA de 3A Automation (AAA - AI Automation Agency), spécialisée en Automatisation E-commerce (B2C) et Workflows PME (B2B).

IDENTITÉ:
- Agence d'Automatisation AI (AAA) - pas consultant solo
- Spécialisation: E-commerce (B2C) + PME (B2B), TOUTES plateformes
- Cible: PME €10k-500k/mois de tous secteurs

SERVICES:
1. Automatisation E-commerce (TOUTES plateformes: Shopify, WooCommerce, etc.)
2. Workflows PME B2B (CRM, ERP, facturation, etc.)
3. Analytics & Reporting (audits, dashboards)
4. AI Integration (génération contenu, SEO, voice AI)

OFFRE GRATUITE: Audit e-commerce complet

PRINCIPES:
- Factualité stricte, pas de claims non vérifiés
- Transparence totale
- Focus ROI mesurable
- Réponses directes et actionnables
"""

def create_client():
    """Initialise le client xAI"""
    if not XAI_API_KEY:
        raise ValueError("XAI_API_KEY non configuré dans .env")
    return Client(api_key=XAI_API_KEY)

def chat_completion(client, user_message: str):
    """Génère une réponse avec le contexte 3A Automation"""
    response = client.chat.completions.create(
        model="grok-2-latest",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        temperature=0.7,
        max_tokens=1024
    )
    return response.choices[0].message.content

# Usage
if __name__ == "__main__":
    client = create_client()

    # Exemple: Réponse à une demande de prospect
    response = chat_completion(
        client,
        "Je veux automatiser mon email marketing pour ma boutique e-commerce"
    )
    print(response)
```

### Intégration Node.js (Alternative)

```javascript
// 3a-grok-client.cjs
require('dotenv').config();

const SYSTEM_PROMPT = `Tu es l'assistant IA de 3A Automation...`; // Voir prompt complet ci-dessus

async function chatWithGrok(userMessage) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'grok-2-latest',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 1024
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}

module.exports = { chatWithGrok, SYSTEM_PROMPT };
```

---

## MODÈLES GROK DISPONIBLES

| Modèle | Usage | Contexte | Notes |
|--------|-------|----------|-------|
| `grok-2-latest` | Production | 131,072 tokens | Recommandé |
| `grok-2-vision-1212` | Images | 8,192 tokens | Analyse visuelle |
| `grok-4-0709` | Advanced | Variable | Dernier modèle |
| `grok-4-fast` | Rapide | Variable | Pour chat temps réel |

### Modèle Recommandé pour 3A Automation

Pour les usages typiques (audit, recommandations, email):
```
grok-2-latest
```

Pour l'analyse d'images (screenshots stores, audits visuels):
```
grok-2-vision-1212
```

---

## CAS D'USAGE 3A AUTOMATION

### 1. Assistant Chat Site Web

Intégrer sur 3a-automation.com pour:
- Répondre aux questions prospects
- Qualifier les leads
- Recommander l'audit gratuit

### 2. Génération de Contenu

- Descriptions produits optimisées SEO
- Emails marketing personnalisés
- Rapports d'audit formatés

### 3. Analyse et Recommandations

- Interprétation données analytics
- Recommandations automatisation
- Priorisation actions

### 4. Support Client Automatisé

- FAQ automatique
- Suivi projets
- Notifications intelligentes

---

## PROMPTS SPÉCIALISÉS

### Audit E-commerce

```text
Analyse les données suivantes d'une boutique Shopify et génère un rapport d'audit avec:
1. Points forts identifiés
2. Problèmes critiques (priorité haute)
3. Opportunités d'amélioration
4. Recommandations actionnables avec estimation d'impact

Données: {json_data}

Format: Markdown structuré, pas de bullshit, que du factuel.
```

### Optimisation Email Klaviyo

```text
Analyse les flows email suivants et identifie:
1. Flows manquants critiques (Browse Abandonment, Post-Purchase, Win-Back)
2. Optimisations possibles sur les flows existants
3. Timing recommandé (basé sur best practices e-commerce)
4. A/B tests suggérés

Données Klaviyo: {flows_data}
```

### Génération Description Produit

```text
Génère une description produit optimisée SEO pour:
Produit: {product_name}
Catégorie: {category}
Caractéristiques: {features}
Prix: {price}

Format:
- Titre optimisé (60 chars max)
- Description courte (160 chars - meta description)
- Description longue (500-800 mots)
- 5 bullet points clés
- Alt text pour image principale
```

---

## INTÉGRATION AVEC STACK EXISTANT

### Klaviyo + Grok

```python
# Génération automatique de contenu email avec Grok
def generate_email_content(client, product_data, flow_type):
    prompt = f"""
    Génère le contenu email pour un flow {flow_type}.
    Produit: {product_data['name']}
    Prix: {product_data['price']}

    Retourne:
    - Subject line (50 chars max)
    - Preview text (90 chars max)
    - Body HTML (structure avec CTA)
    """
    return chat_completion(client, prompt)
```

### Shopify + Grok

```python
# Optimisation descriptions produits via Grok
def optimize_product_description(client, product):
    prompt = f"""
    Optimise la description produit suivante pour SEO:
    Titre actuel: {product['title']}
    Description actuelle: {product['body_html']}

    Retourne JSON avec:
    - title: nouveau titre optimisé
    - body_html: description HTML optimisée
    - meta_description: meta description (160 chars)
    - alt_text: suggestion alt text image
    """
    return chat_completion(client, prompt)
```

---

## SÉCURITÉ ET BONNES PRATIQUES

### Ne Jamais Exposer

- ❌ API keys dans le code source
- ❌ Données clients sensibles dans les prompts
- ❌ Credentials en clair

### Toujours Faire

- ✅ Utiliser variables d'environnement
- ✅ Valider les inputs avant envoi à l'API
- ✅ Logger les usages pour monitoring
- ✅ Implémenter rate limiting

### Gestion des Erreurs

```python
from xai_sdk.exceptions import APIError, RateLimitError

try:
    response = chat_completion(client, message)
except RateLimitError:
    # Attendre et réessayer
    time.sleep(60)
    response = chat_completion(client, message)
except APIError as e:
    # Logger l'erreur
    logger.error(f"xAI API Error: {e}")
    response = None
```

---

## RESSOURCES

### Documentation Officielle

- xAI API: https://docs.x.ai/
- SDK Python: https://github.com/xai-org/xai-sdk-python
- Cookbook: https://github.com/xai-org/xai-cookbook
- Prompts: https://github.com/xai-org/grok-prompts

### Configuration Console

- Console xAI: https://console.x.ai/
- Gestion API Keys: https://console.x.ai/api-keys

---

## CHANGELOG

| Date | Version | Modification |
|------|---------|--------------|
| 2025-12-17 | 1.0 | Création initiale - Configuration projet Grok |

---

**Note:** Ce fichier contient la configuration standard pour intégrer Grok/xAI dans le projet 3A Automation. Le système prompt est aligné avec les valeurs et l'identité définies dans CLAUDE.md et llm.txt.
