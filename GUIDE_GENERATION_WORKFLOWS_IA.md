# Guide Stratégique pour la Génération de Workflows Publicitaires par IA

Ce document a pour objectif de structurer les informations nécessaires à une intelligence artificielle spécialisée dans la génération de workflows. En fournissant un contexte rigoureux, factuel et complet, nous pourrons générer des automatisations puissantes, robustes et parfaitement intégrées à l'écosystème de l'agence 3A-Automations.

---

## 1. Audit des Actifs Internes et Capacités Existantes

Il est impératif que l'IA de génération de workflows ait une connaissance approfondie de notre "stack" technologique et de nos processus actuels. Voici la liste des actifs à lui fournir.

### A. Technologies et Environnements d'Exécution

- **Langages de programmation :**
  - **Node.js (.cjs, .js) :** Principalement utilisé pour les automatisations, l'interaction avec les API et les scripts côté serveur.
  - **Python (.py) :** Utilisé pour des tâches spécifiques, notamment des tests et potentiellement des interactions avec des modèles d'IA.
- **Infrastructure :**
  - **Docker (`docker-compose.yml`) :** L'environnement de développement et de production est conteneurisé, garantissant la reproductibilité des scripts.
  - **GitHub Actions (`deploy-website.yml`) :** Le déploiement du site web est automatisé, suggérant une intégration continue.
- **Frontend :**
  - Site statique (`landing-page-hostinger/`) : HTML, CSS, JavaScript vanilla. Toute intégration d'automatisations côté client doit être compatible avec cette structure simple.

### B. "Toolbox" d'Automatisations Internes

Notre principal atout réside dans notre collection de scripts d'automatisation. L'IA doit les considérer comme une palette d'outils ("functions") qu'elle peut orchestrer.

- **Gestion de l'environnement :**
  - `lib/env-loader.cjs` : Un script central pour charger les variables d'environnement et les clés d'API. Tout nouveau workflow doit l'utiliser.

- **Analyse et Audit :**
  - `automations/clients/analytics/analyze-ga4-source.cjs` : Analyser les sources de conversion dans Google Analytics 4.
  - `automations/clients/analytics/audit-tiktok-pixel-config.cjs` : Auditer la configuration d'un pixel TikTok.
  - `scripts/forensic-site-audit.cjs` : Script complet d'audit de site web (probablement Lighthouse, SEO, etc.).

- **Génération de Leads et Scraping :**
  - `automations/generic/scrape-google-maps-businesses.cjs` : Extraire des informations sur des entreprises depuis Google Maps.
  - `automations/generic/scrape-hiring-companies.cjs` : Identifier des entreprises qui recrutent.
  - `automations/generic/scrape-linkedin-profiles.cjs` : Extraire des données de profils LinkedIn.

- **Intégrations CRM et Marketing :**
  - `automations/generic/sync-google-forms-to-klaviyo.cjs` : Synchroniser les soumissions d'un formulaire Google vers Klaviyo.
  - `automations/agency/core/google-calendar-booking.cjs` : Gérer des réservations via Google Calendar.

### C. Sources de Données et Connaissances

- **Knowledge Base (RAG) :**
  - Localisation : `knowledge-base/`
  - Composants : `document-parser.cjs`, `vector-store.cjs`, `rag-query.cjs`.
  - Description : Nous disposons d'un système de Retrieval-Augmented Generation. L'IA peut l'utiliser pour injecter des connaissances contextuelles (branding, offres, études de cas) dans les prompts des modèles génératifs. Le fichier `knowledge.json` dans `landing-page-hostinger/voice-assistant/` semble être une base de connaissances spécifique pour le widget vocal.

- **Données structurées :**
  - **Google Sheets :** L'outil `test-google-sheets.cjs` confirme notre capacité à lire/écrire des données depuis Google Sheets, qui peut servir de base de données simple ou de point de configuration pour les campagnes.
  - **Registres JSON :** `automations/automations-registry.json` agit comme un registre central pour nos automatisations.

---

## 2. Nouveaux Modèles d'IA à Intégrer

L'IA de workflows doit savoir quels modèles génératifs sont à sa disposition et leur spécialité.

- **Gemini (Google) :** Modèle multimodal de pointe.
  - **Rôle :** Génération de texte (copies publicitaires, articles de blog, scripts), analyse d'images, et potentiellement des fonctions de vision pour analyser les résultats visuels des publicités.
- **Grok (xAI) :** Modèle conversationnel avec accès temps réel.
  - **Rôle :** Analyse de tendances en temps réel, génération de contenu "dans l'actualité", brainstorming d'angles marketing basés sur des événements récents. Peut être utilisé pour le module `grok-client.cjs`.
- **Veo 3.1 (Google - hypothétique) :** Modèle de génération vidéo.
  - **Rôle :** Création de courtes vidéos publicitaires, de reels pour les réseaux sociaux, ou de démonstrations de produits à partir d'un prompt texte, d'images ou de données produits.
- **Nano Banan (interne/spécifique) :**
  - **Rôle :** (À définir) Ce modèle doit être clairement défini. S'agit-il d'un modèle de personnalisation ? D'un modèle ultra-rapide pour des tâches simples ? Sa fonction exacte doit être spécifiée (ex: "Modèle 'Nano Banan' : spécialisé dans la génération de titres publicitaires courts et percutants pour un A/B testing rapide").

---

## 3. Structure des Informations à Fournir à l'IA de Workflows

Pour garantir des résultats optimaux, chaque demande de génération de workflow doit être rigoureusement structurée en fonction du segment client. L'IA doit recevoir des informations différentes pour un client E-commerce et pour une PME B2B.

Voici deux exemples illustrant la structure de données à fournir.

---
### **Exemple 1 : Cas d'Usage E-commerce**
---

```yaml
# Demande de Génération de Workflow Publicitaire pour E-COMMERCE

# -----------------------------------------------------------
# 1. OBJECTIF STRATÉGIQUE
# -----------------------------------------------------------
segment_client: "E-commerce"
objectif_principal: "Augmenter les ventes de la nouvelle collection de 'chaussures de course' de 20% en 45 jours."
kpi_primaire: "ROAS (Return On Ad Spend)"
kpi_secondaires: ["Taux d'ajout au panier", "Coût par achat", "Valeur de panier moyen"]

# -----------------------------------------------------------
# 2. CIBLE (AUDIENCE)
# -----------------------------------------------------------
cible:
  persona:
    role: "Consommateur final"
    centres_interet: ["Course à pied", "Marathon", "Fitness", "Marques de sport concurrentes"]
    comportement_achat: "Sensible aux avis clients, recherche la performance technique."
  plateformes_frequentees: ["Instagram", "TikTok", "Blogs de running"]
  donnees_demographiques:
    age: "25-45 ans"
    region: "France métropolitaine"

# -----------------------------------------------------------
# 3. MESSAGE ET OFFRE
# -----------------------------------------------------------
message_principal: "Performance et confort inégalés. Découvrez la chaussure qui vous portera jusqu'à la ligne d'arrivée."
offre_speciale: "Livraison gratuite pour toute première commande."
arguments_cles:
  - "Technologie d'amorti 'CloudStep' brevetée."
  - "Approuvée par des athlètes professionnels."
  - "Note de 4.8/5 étoiles sur plus de 500 avis."

# -----------------------------------------------------------
# 4. ACTIFS À PRODUIRE
# -----------------------------------------------------------
actifs_a_generer:
  - type: "video"
    modele_ia: "Veo 3.1"
    prompt: "Créer 3 courtes vidéos (10-15s) pour Instagram Reels & TikTok. Style dynamique et rapide. Montrer des coureurs en action dans différents environnements (ville, nature). Focus sur la semelle de la chaussure. Terminer par le packshot produit et l'offre de livraison gratuite."
  - type: "image"
    modele_ia: "Gemini"
    prompt: "Générer 3 carrousels d'images pour Instagram. Chaque carrousel détaille un argument clé (Technologie, Avis, Athlètes) avec des visuels de haute qualité."
  - type: "texte"
    modele_ia: "Nano Banan"
    prompt: "Générer 10 titres courts et percutants pour A/B testing sur les publicités."

# -----------------------------------------------------------
# 5. ORCHESTRATION DES OUTILS INTERNES
# -----------------------------------------------------------
orchestration:
  - etape: 1
    outil: "actifs_a_generer"
    description: "Génération des actifs publicitaires (Vidéos, Images, Textes)."
  - etape: 2
    outil: "API Publicitaire (ex: Meta Ads)"
    description: "Déployer une campagne de conversion sur Instagram et Facebook avec les actifs générés."
  - etape: 3
    outil: "automations/clients/analytics/audit-tiktok-pixel-config.cjs"
    description: "Vérifier que le pixel de suivi est correctement configuré pour le suivi des achats."
  - etape: 4
    outil: "automations/clients/analytics/analyze-ga4-source.cjs"
    description: "Toutes les 72h, analyser le ROAS et le coût par achat. Si le ROAS < 3.0, notifier l'équipe."
  - etape: 5
    outil: "Intégration Klaviyo"
    description: "Pour les abandons de panier provenant de la campagne, déclencher une séquence email automatisée."

# -----------------------------------------------------------
# 6. CONTRAINTES ET DIRECTIVES
# -----------------------------------------------------------
contraintes:
  budget_total: "5000 EUR"
  tonalite_marque: "Inspirant, technique mais accessible."
  exclusions: "Ne pas utiliser d'images de coureurs blessés ou fatigués."
```

---
### **Exemple 2 : Cas d'Usage PME B2B**
---

```yaml
# Demande de Génération de Workflow Publicitaire pour PME B2B

# -----------------------------------------------------------
# 1. OBJECTIF STRATÉGIQUE
# -----------------------------------------------------------
segment_client: "PME B2B"
objectif_principal: "Générer 25 rendez-vous qualifiés pour une démonstration du logiciel 'SaaS-Analytics'."
kpi_primaire: "Nombre de rendez-vous bookés via Google Calendar."
kpi_secondaires: ["Coût par lead qualifié (MQL)", "Taux de conversion de la landing page"]

# -----------------------------------------------------------
# 2. CIBLE (AUDIENCE)
# -----------------------------------------------------------
cible:
  secteur_activite: "Agences de marketing digital, Consultants indépendants"
  taille_entreprise: "1-20 employés"
  persona:
    role: "Fondateur, Directeur, Head of Marketing"
    point_de_douleur: "Perte de temps dans la collecte et l'analyse de données pour les rapports clients."
  plateformes_frequentees: ["LinkedIn"]
  donnees_demographiques:
    region: "France, Canada (francophone)"

# -----------------------------------------------------------
# 3. MESSAGE ET OFFRE
# -----------------------------------------------------------
message_principal: "Automatisez 80% de votre reporting client et consacrez votre temps à la stratégie."
offre_speciale: "Un 'white paper' exclusif sur 'L'avenir du reporting automatisé' en téléchargement."
arguments_cles:
  - "Intégration en 1-clic avec GA4, Google Ads, Meta Ads."
  - "Générez des rapports PDF personnalisés en moins de 60 secondes."
  - "Cas client: L'agence 'XYZ' a réduit de 15h/mois le temps de préparation de ses rapports."

# -----------------------------------------------------------
# 4. ACTIFS À PRODUIRE
# -----------------------------------------------------------
actifs_a_generer:
  - type: "texte"
    modele_ia: "Gemini"
    prompt: "Rédiger le contenu du white paper 'L'avenir du reporting automatisé' (1500 mots)."
    knowledge_base_query: "Données techniques sur SaaS-Analytics, études de cas clients."
  - type: "texte"
    modele_ia: "Gemini"
    prompt: "Générer 3 variations de posts publicitaires pour LinkedIn, ciblant les points de douleur du persona."
  - type: "image"
    modele_ia: "Gemini"
    prompt: "Créer une image de couverture professionnelle pour le white paper et des bannières publicitaires pour LinkedIn."

# -----------------------------------------------------------
# 5. ORCHESTRATION DES OUTILS INTERNES
# -----------------------------------------------------------
orchestration:
  - etape: 1
    outil: "automations/generic/scrape-linkedin-profiles.cjs"
    description: "Identifier une liste de 1000 profils correspondants à la persona pour créer une audience personnalisée."
    parametres:
      role: "Fondateur, Directeur Marketing"
      secteur: "Agence marketing"
  - etape: 2
    outil: "actifs_a_generer"
    description: "Génération du white paper, des posts et des images."
  - etape: 3
    outil: "API Publicitaire (LinkedIn Ads)"
    description: "Lancer une campagne de génération de leads sur LinkedIn pour promouvoir le téléchargement du white paper."
  - etape: 4
    outil: "automations/generic/sync-google-forms-to-klaviyo.cjs"
    description: "Les leads ayant téléchargé le white paper sont ajoutés à une séquence de nurturing sur Klaviyo."
  - etape: 5
    outil: "automations/agency/core/google-calendar-booking.cjs"
    description: "L'email de nurturing final contient un lien pour booker une démo via notre système de calendrier."

# -----------------------------------------------------------
# 6. CONTRAINTES ET DIRECTIVES
# -----------------------------------------------------------
contraintes:
  budget_total: "2500 EUR"
  tonalite_marque: "Hautement professionnel, crédible, orienté ROI."
  exclusions: "Ne pas faire de promesses chiffrées irréalistes (ex: 'doublez vos revenus')."

```
---

### Conclusion

En adoptant cette approche structurée et segmentée, nous transformons l'IA de génération de workflows d'une simple "boîte noire" en un partenaire stratégique conscient de notre écosystème et de nos segments de clientèle. Elle pourra non seulement proposer des séquences d'actions pertinentes mais aussi les ancrer dans nos outils existants, garantissant ainsi des automatisations immédiatement opérationnelles et alignées avec nos standards de qualité.

```