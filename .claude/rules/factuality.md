# Règles de Factualité

> Toute affirmation doit être vérifiable empiriquement.

## Avant Toute Affirmation
1. Scripts "production-ready" → Vérifier fonctionnement
2. "X clients" → Vérifier actifs et payants
3. "Stack complet" → Auditer chaque composant

## INTERDIT
- ❌ Claims sans test empirique
- ❌ Wishful thinking

## Source de Vérité
- `automations-registry.json` - Automations count
- `data/pressure-matrix.json` - Sensors status
- `.env` - Credentials status

## Vérification Rapide
```bash
# Scripts count
ls automations/agency/core/*.cjs | wc -l

# Sensors status
node automations/agency/core/SENSOR-NAME.cjs --health

# Registry count
jq '.automations | length' automations/automations-registry.json
```
