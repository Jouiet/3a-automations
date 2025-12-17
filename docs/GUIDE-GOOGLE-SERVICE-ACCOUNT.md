# Guide: Créer un Google Service Account
## Pour JO-AAA Automation Scripts

---

## Prérequis

- Compte Google
- Accès à Google Cloud Console
- ~15 minutes

---

## Étape 1: Accéder à Google Cloud Console

1. Ouvrir: https://console.cloud.google.com
2. Se connecter avec votre compte Google

---

## Étape 2: Créer un Projet

1. Cliquer sur le sélecteur de projet (en haut)
2. Cliquer **"New Project"**
3. Remplir:
   - **Project name:** `jo-aaa-automation`
   - **Organization:** Laisser par défaut
4. Cliquer **"Create"**
5. Attendre la création (~30 secondes)
6. Sélectionner le nouveau projet

---

## Étape 3: Activer les APIs Nécessaires

### 3.1 Google Analytics Data API
1. Menu hamburger → **APIs & Services** → **Library**
2. Rechercher: `Google Analytics Data API`
3. Cliquer sur le résultat
4. Cliquer **"Enable"**

### 3.2 Google Analytics Admin API
1. Retourner à Library
2. Rechercher: `Google Analytics Admin API`
3. Cliquer **"Enable"**

### 3.3 Google Sheets API
1. Retourner à Library
2. Rechercher: `Google Sheets API`
3. Cliquer **"Enable"**

---

## Étape 4: Créer le Service Account

1. Menu hamburger → **IAM & Admin** → **Service Accounts**
2. Cliquer **"+ Create Service Account"**
3. Remplir:
   - **Service account name:** `jo-aaa-automation`
   - **Service account ID:** (auto-généré)
   - **Description:** `Service account for JO-AAA automation scripts`
4. Cliquer **"Create and Continue"**
5. **Grant this service account access:**
   - Role: `Editor` (ou rôles spécifiques si préféré)
6. Cliquer **"Continue"**
7. Cliquer **"Done"**

---

## Étape 5: Créer la Clé JSON

1. Dans la liste des Service Accounts, cliquer sur celui créé
2. Aller à l'onglet **"Keys"**
3. Cliquer **"Add Key"** → **"Create new key"**
4. Sélectionner **"JSON"**
5. Cliquer **"Create"**
6. Le fichier JSON est téléchargé automatiquement

---

## Étape 6: Installer la Clé

### Sur Mac/Linux:

```bash
# Créer le dossier si nécessaire
mkdir -p ~/.config/google

# Copier le fichier téléchargé
cp ~/Downloads/jo-aaa-automation-*.json ~/.config/google/service-account.json

# Vérifier
cat ~/.config/google/service-account.json | head -5
```

### Résultat attendu:
```json
{
  "type": "service_account",
  "project_id": "jo-aaa-automation",
  "private_key_id": "abc123...",
```

---

## Étape 7: Configurer l'Accès aux Données

### Pour Google Analytics:

1. Aller sur https://analytics.google.com
2. Admin → Property → Property Access Management
3. Cliquer **"+"** → **"Add users"**
4. Email: Copier le `client_email` du fichier JSON
   (format: `jo-aaa-automation@jo-aaa-automation.iam.gserviceaccount.com`)
5. Rôle: **Viewer** (minimum) ou **Editor**
6. Cliquer **"Add"**

### Pour Google Sheets:

1. Ouvrir le Google Sheet à accéder
2. Cliquer **"Share"**
3. Ajouter le `client_email` du service account
4. Permission: **Editor**
5. Cliquer **"Send"**

---

## Étape 8: Tester la Configuration

```bash
cd /Users/mac/Desktop/JO-AAA

# Installer les dépendances
npm install

# Tester la configuration
npm run test-env
```

### Résultat attendu:
```
✅ Fichier Google Service Account TROUVÉ
   └── Type: service_account
   └── Project: jo-aaa-automation
   └── Client Email: jo-aaa-automation@...
   └── Private Key: ✓ Présente
```

---

## Troubleshooting

### Erreur: "File not found"
```
❌ Fichier Google Service Account NON TROUVÉ
```
**Solution:** Vérifier que le fichier existe à `~/.config/google/service-account.json`

### Erreur: "Permission denied"
```
Error: Permission denied to access analytics
```
**Solution:** Vérifier que le service account a été ajouté à Google Analytics (Étape 7)

### Erreur: "API not enabled"
```
Error: Google Analytics Data API has not been used in project
```
**Solution:** Retourner à l'Étape 3 et activer l'API

---

## Checklist Finale

- [ ] Projet créé sur Google Cloud
- [ ] 3 APIs activées (Analytics Data, Analytics Admin, Sheets)
- [ ] Service Account créé
- [ ] Clé JSON téléchargée
- [ ] Clé placée dans `~/.config/google/service-account.json`
- [ ] Service Account ajouté à Google Analytics
- [ ] Test réussi (`npm run test-env`)

---

## Ressources

- [Google Cloud Console](https://console.cloud.google.com)
- [Google Analytics](https://analytics.google.com)
- [Documentation API](https://developers.google.com/analytics/devguides/reporting/data/v1)

---

**Document créé:** 17 Décembre 2025
**Temps estimé:** 15-20 minutes
