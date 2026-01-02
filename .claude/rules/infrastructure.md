# Infrastructure 3A Automation

## VPS Hostinger

| Paramètre | Valeur |
|-----------|--------|
| ID | 1168256 |
| Hostname | srv1168256.hstgr.cloud |
| IP | 148.230.113.163 |
| OS | Ubuntu + Docker |

## Containers Docker

| Container | Image | Port | Statut |
|-----------|-------|------|--------|
| 3a-website | nginx:alpine | 80 | RUNNING |
| root-traefik-1 | traefik | 80/443 | RUNNING |
| root-n8n-1 | n8n | 5678 | RUNNING (Infrastructure only - 0 workflows) |

## Architecture

```
Internet → Traefik (reverse proxy + SSL) → nginx (site)
Note: n8n container runs but has 0 active workflows (all migrated to native scripts)
```

## Déploiement Automatique

```yaml
# .github/workflows/deploy-website.yml
Trigger: push to main affecting landing-page-hostinger/**
Action: POST Hostinger API → restart container → git clone repo
Durée: ~60 secondes
```

## URLs

- Site: https://3a-automation.com
- n8n: https://n8n.srv1168256.hstgr.cloud
- API Hostinger: https://developers.hostinger.com/api/vps/v1/

## Commande Déploiement Manuel

```bash
source .env
curl -X POST "https://developers.hostinger.com/api/vps/v1/virtual-machines/1168256/docker" \
  -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @scripts/deploy-docker-compose.json
```
