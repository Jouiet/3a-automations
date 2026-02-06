# 3A Dashboard

Dashboard complet pour 3A Automation - Gestion des leads, automations et analytics.

## Stack Technique

- **Frontend**: Next.js 14 (App Router)
- **UI**: Shadcn/UI + Tailwind CSS
- **Auth**: JWT + bcrypt (Email/Password)
- **Database**: Google Sheets (via Apps Script)
- **Orchestration**: Node.js native scripts

## Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/login/     # Page connexion
│   │   ├── admin/            # Dashboard Admin
│   │   │   ├── leads/        # Gestion Leads CRM
│   │   │   ├── automations/  # Gestion Automations
│   │   │   ├── analytics/    # Analytics
│   │   │   └── settings/     # Parametres
│   │   └── client/           # Portal Client
│   │       ├── automations/  # Mes Automations
│   │       └── reports/      # Rapports
│   ├── components/
│   │   ├── layouts/          # Sidebars, Headers
│   │   └── ui/               # Composants Shadcn
│   └── lib/
│       ├── auth.ts           # Auth JWT
│       ├── google-sheets.ts  # API Google Sheets
│       └── utils.ts          # Utilitaires
└── scripts/
    └── google-apps-script.js # Backend GAS
```

## Installation

### 1. Installer les dependances

```bash
cd dashboard
npm install
```

### 2. Configurer Google Sheets

1. Creer un nouveau Google Sheet
2. Aller dans Extensions > Apps Script
3. Copier le contenu de `scripts/google-apps-script.js`
4. Remplacer `YOUR_SPREADSHEET_ID` par l'ID de votre Sheet
5. Executer la fonction `initializeDatabase()` pour creer les tables
6. Deploy > New deployment > Web app
7. Copier l'URL du deployment

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir:
- `JWT_SECRET`: Cle secrete pour JWT (32+ caracteres)
- `GOOGLE_SHEETS_API_URL`: URL du Apps Script deploy

### 4. Lancer le serveur de developpement

```bash
npm run dev
```

Le dashboard sera disponible sur http://localhost:3001

## Utilisateur par defaut

- **Email**: admin@3a-automation.com
- **Password**: admin123
- **Role**: ADMIN

## Deploiement

### Option 1: Hostinger VPS (Recommande)

```bash
# Build
npm run build

# Deployer via Docker ou PM2
```

### Option 2: Self-hosted

```bash
npm run build
npm run start
```

## Fonctionnalites

### Admin Dashboard
- Vue d'ensemble KPIs
- Gestion Leads CRM complet
- Gestion Automations
- Analytics et rapports
- Gestion utilisateurs

### Client Portal
- Dashboard personnalise
- Vue des automations actives
- Rapports de performance
- Support et documents

## Securite

- Authentification JWT avec expiration 7 jours
- Passwords hashes avec bcrypt (12 rounds)
- Verification des roles (ADMIN, CLIENT, VIEWER)
- CORS configure

---

**3A Automation** - Automation · Analytics · AI
