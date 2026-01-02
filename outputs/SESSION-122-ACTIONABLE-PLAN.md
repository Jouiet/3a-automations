# Session 122 - Plan Actionnable
**Date:** 02/01/2026
**Audit Score:** 89% | **Security Backend:** 45% (CRITICAL)

---

## ACTIONS IMMÉDIATES (P0) - HUMAIN REQUIS

### 1. Rotation JWT_SECRET (CRITIQUE - 30 min)

```bash
# SSH vers VPS
ssh root@srv1168256.hstgr.cloud

# Générer nouveau secret
openssl rand -base64 64

# Éditer .env du dashboard
nano /root/dashboard/.env
# Remplacer JWT_SECRET par nouvelle valeur

# Redémarrer le container dashboard
cd /root/dashboard
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

**Impact:** Tous les utilisateurs seront déconnectés. Prévoir communication.

### 2. Révoquer N8N_API_KEY (CRITIQUE - 15 min)

```bash
# Accéder à n8n
https://n8n.srv1168256.hstgr.cloud/settings/api

# 1. Révoquer l'ancienne clé
# 2. Générer nouvelle clé API
# 3. Mettre à jour dans .env du dashboard
```

### 3. Nettoyer docker-compose.production.yml (CRITIQUE - 10 min)

```yaml
# AVANT (DANGEREUX - secrets en clair):
environment:
  - JWT_SECRET=3a_automation_jwt_secret_production_2025_secure
  - N8N_API_KEY=eyJhbG...

# APRÈS (SÉCURISÉ - référence .env):
environment:
  - JWT_SECRET=${JWT_SECRET}
  - N8N_API_KEY=${N8N_API_KEY}
  - GOOGLE_SHEETS_ID=${GOOGLE_SHEETS_ID}
```

---

## ACTIONS COURT TERME (P1) - Cette semaine

### 4. Purger l'historique Git (2h)

```bash
# Option A: BFG Repo-Cleaner (recommandé)
brew install bfg
bfg --delete-files docker-compose.production.yml
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all

# Option B: git filter-branch
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch dashboard/docker-compose.production.yml' \
  --prune-empty --tag-name-filter cat -- --all
```

**Note:** Secrets déjà exposés. La purge empêche futures fuites mais les valeurs actuelles sont compromises.

### 5. Implémenter Docker Secrets (1h)

```yaml
# docker-compose.production.yml
services:
  dashboard:
    secrets:
      - jwt_secret
      - n8n_api_key

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  n8n_api_key:
    file: ./secrets/n8n_api_key.txt
```

---

## ACTIONS MOYEN TERME (P2) - Ce mois

### 6. Améliorer Accessibilité (85% → 90%)

| Fix | Fichiers | Effort |
|-----|----------|--------|
| focus-visible sur liens | styles.css | 30 min |
| aria-label boutons icon-only | *.html (63 fichiers) | 2h |
| Contraste texte gris | styles.css (.text-muted) | 30 min |
| Skip-to-content visible | Header component | 30 min |

### 7. Audit Automatisé CI/CD

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push]
jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          extra_args: --only-verified
```

---

## MÉTRIQUES DE SUCCÈS

| Métrique | Avant | Cible | Deadline |
|----------|-------|-------|----------|
| Security Backend | 45% | 90%+ | 03/01/2026 |
| Secrets en repo | 3 | 0 | 02/01/2026 |
| Accessibilité | 85% | 90% | 15/01/2026 |
| Overall Audit | 89% | 95% | 31/01/2026 |

---

## CHECKLIST VALIDATION

- [ ] JWT_SECRET rotaté sur VPS
- [ ] N8N_API_KEY révoqué et régénéré
- [ ] docker-compose.production.yml utilise variables ${VAR}
- [ ] .env créé sur VPS avec nouvelles valeurs
- [ ] Git history purgé (ou repo recréé)
- [ ] GitHub secret scanning activé
- [ ] CI/CD security scan ajouté

---

## CONTACTS / RESPONSABLES

| Action | Responsable | Contact |
|--------|-------------|---------|
| VPS Access | Jouiet | Admin |
| n8n Admin | Jouiet | Admin |
| GitHub Repo | Jouiet | Owner |

---

*Généré automatiquement - Session 122*
