# 3A Automation - Guide de Déploiement

## Version: 1.1 | Date: 08/01/2026

---

## ARCHITECTURE DE DÉPLOIEMENT

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUX DE DÉPLOIEMENT AUTOMATIQUE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. Modifier fichiers locaux (landing-page-hostinger/*)                    │
│                     ↓                                                        │
│   2. git commit && git push                                                  │
│                     ↓                                                        │
│   3. GitHub Action "Deploy Website" se déclenche automatiquement            │
│                     ↓                                                        │
│   4. L'Action appelle l'API Hostinger (POST /docker)                        │
│                     ↓                                                        │
│   5. Hostinger redémarre le container nginx                                 │
│                     ↓                                                        │
│   6. Container exécute: git clone → copie fichiers → nginx démarre          │
│                     ↓                                                        │
│   7. Site LIVE mis à jour (~60 secondes total)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## MÉTHODE 1: DÉPLOIEMENT AUTOMATIQUE (Recommandée)

### Prérequis

- Repo GitHub: `Jouiet/3a-automations` (PUBLIC)
- Secrets configurés dans GitHub Actions

### Processus

```bash
# 1. Modifier des fichiers dans landing-page-hostinger/
# Exemple: éditer index.html, styles.css, etc.

# 2. Commit et push
git add landing-page-hostinger/
git commit -m "feat: description du changement"
git push origin main

# 3. Le déploiement se fait AUTOMATIQUEMENT
# Vérifier: https://github.com/Jouiet/3a-automations/actions
```

### Déclencheurs

Le workflow se déclenche quand:

- Push sur `main` affectant `landing-page-hostinger/**`
- Trigger manuel via GitHub Actions UI

### Vérification

```bash
# Vérifier le statut
curl -sI https://3a-automation.com | head -3

# Vérifier le contenu
curl -s https://3a-automation.com | grep "GTM-WLVJQC3M"
```

---

## MÉTHODE 2: DÉPLOIEMENT MANUEL (Urgence)

Si le déploiement automatique échoue, utiliser l'API directement:

```bash
# Depuis le répertoire JO-AAA
source .env

curl -s -X POST "https://developers.hostinger.com/api/vps/v1/virtual-machines/1168256/docker" \
  -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "3a-website",
    "content": "services:\n  website:\n    image: nginx:alpine\n    restart: always\n    labels:\n      - traefik.enable=true\n      - traefik.http.routers.website.rule=Host(`3a-automation.com`) || Host(`www.3a-automation.com`)\n      - traefik.http.routers.website.tls=true\n      - traefik.http.routers.website.entrypoints=web,websecure\n      - traefik.http.routers.website.tls.certresolver=mytlschallenge\n      - traefik.http.services.website.loadbalancer.server.port=80\n    networks:\n      - root_default\n    command: sh -c '\''apk add --no-cache git && rm -rf /usr/share/nginx/html/* && git clone --depth 1 https://github.com/Jouiet/3a-automations.git /tmp/repo && cp -r /tmp/repo/landing-page-hostinger/* /usr/share/nginx/html/ && rm -rf /tmp/repo && nginx -g \"daemon off;\"'\''\n\nnetworks:\n  root_default:\n    external: true"
  }'
```

---

## CONFIGURATION

### GitHub Secrets (déjà configurés)

| Secret | Valeur | Source |
|---|---|---|
| `HOSTINGER_API_KEY` | *** | hpanel.hostinger.com → API |

### GitHub Variables (déjà configurés)

| Variable | Valeur | Description |
|---|---|---|
| `HOSTINGER_VM_ID` | 1168256 | ID du VPS Hostinger |

### Fichiers Clés

```text
.github/workflows/deploy-website.yml  → Workflow automatique
landing-page-hostinger/               → Fichiers du site
.env                                  → Credentials locales (HOSTINGER_API_TOKEN)
```

---

## TROUBLESHOOTING

### Site affiche "Welcome to nginx!"

**Cause**: Le git clone a échoué ou le contenu n'a pas été copié.

**Solution**:

1. Vérifier que le repo est PUBLIC
2. Déclencher un redéploiement manuel
3. Vérifier les logs GitHub Actions

### HTTP 403 ou 404

**Cause**: Container en démarrage ou fichiers manquants.

**Solution**:

1. Attendre 60 secondes
2. Vérifier le statut container:

```bash
curl -s "https://developers.hostinger.com/api/vps/v1/virtual-machines/1168256/docker" \
  -H "Authorization: Bearer $HOSTINGER_API_TOKEN"
```

### Container en restart loop

**Cause**: Erreur dans la commande de démarrage.

**Solution**: Redéployer avec la commande exacte documentée ci-dessus.

---

## HISTORIQUE DES PROBLÈMES RÉSOLUS

| Date | Problème | Cause | Solution |
|---|---|---|---|
| 2025-12-19 | **404/502 intermittent** | **2 workflows en conflit (race condition)** | **Supprimé deploy.yml, gardé deploy-website.yml** |
| 2025-12-19 | Container exit code 128 | Repo PRIVATE | Rendu PUBLIC |
| 2025-12-19 | Default nginx page | docker-compose avec volume vide | Supprimé docker-compose.yml, utiliser commande inline |

---

## ANALYSE FORENSIQUE: RACE CONDITION (19/12/2025)

### Symptôme

Site retourne 404 ou 502 de façon intermittente après chaque push.

### Cause Racine

**DEUX workflows** se déclenchaient simultanément:

1. `deploy.yml` → "Deploy to Hostinger VPS" (utilisait hostinger/deploy-on-vps@v2)
2. `deploy-website.yml` → "Deploy Website" (appel API direct)

Les deux avaient le même trigger:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'landing-page-hostinger/**'
```

### Problèmes

1. **Race condition**: Les deux workflows appelaient l'API Hostinger en même temps
2. **Fichier manquant**: deploy.yml référençait `docker/docker-compose.yml` (inexistant)
3. **Conflits Docker**: Deux containers différents essayaient de démarrer

### Solution Appliquée

```bash
rm .github/workflows/deploy.yml  # Supprimé le workflow cassé
# Gardé uniquement deploy-website.yml
```

### Vérification de la Correction

```bash
# Après un push, UN SEUL workflow doit apparaître
gh run list --limit 3
# Expected: Un seul "Deploy Website" en cours
```

---

## CONTACTS & RESSOURCES

- **VPS**: srv1168256.hstgr.cloud (148.230.113.163)
- **Site**: <https://3a-automation.com>
- **GitHub**: <https://github.com/Jouiet/3a-automations>
- **API Docs**: <https://developers.hostinger.com/>

---

**Dernière mise à jour**: 08/01/2026 - Session 130 (Mission Complete)
