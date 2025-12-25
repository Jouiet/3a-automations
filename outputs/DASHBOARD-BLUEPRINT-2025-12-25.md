# DASHBOARD BLUEPRINT - 3A AUTOMATION
## Version: 1.2.0 | Date: 2025-12-25 | Session: 94
## Document: Recherche, Audit, Planification et Suivi Implementation

---

## 0. EXECUTIVE SUMMARY

### Contexte
Ce document constitue l'analyse exhaustive des dashboards Admin et Client de 3A Automation. Il est basé sur:
- **Audit code existant**: 34 fichiers .tsx analysés
- **Recherche web**: Best practices agences 2025
- **Recherche GitHub**: Patterns d'intégration n8n
- **Analyse business model**: Alignement features/pricing

### Verdict Global (Mise à jour Session 93)
| Aspect | État Actuel | Gravité | Session |
|--------|-------------|---------|---------|
| Admin Dashboard | Fonctionnel, API connectée | ✅ OK | 86 |
| Client Dashboard | **REAL API DATA** | ✅ RÉSOLU | 92 |
| n8n Integration | **API PROXY FONCTIONNEL** | ✅ RÉSOLU | 92 |
| CinematicAds UI | **REDIRECT cinematicads.studio** | ✅ STRATÉGIE | 93 |
| Real-time Updates | Polling 30s implémenté | ✅ OK | 92 |
| Charts/Graphs | **Recharts IMPLEMENTED** | ✅ RÉSOLU | 94 |
| On-demand Services UI | Voice/WhatsApp generics créés | BASSE | 93 |

### Contrainte Business Fondamentale (Mise à jour Session 93)
> **3A Automation n'est PAS une plateforme self-service.**
>
> **STRATÉGIE SESSION 93:**
> - CinematicAds = **PROJET SÉPARÉ** → cinematicads.studio (SaaS autonome)
> - 3A Automation = Marketing-only (redirect, pas d'implémentation)
> - Voice AI + WhatsApp = Templates génériques créés pour multi-projets
>
> Les 73 autres automations font partie des packs (Quick Win, Essentials, Growth).
> Les 4 CinematicAds sont marquées "external-service" dans le registry.

---

## 1. AUDIT CODE EXISTANT

### 1.1 Structure du Projet Dashboard

```
dashboard/src/
├── app/
│   ├── (auth)/login/page.tsx      # Auth page
│   ├── admin/
│   │   ├── page.tsx               # Admin overview (API connected)
│   │   ├── leads/page.tsx         # CRM leads
│   │   ├── automations/page.tsx   # Automations list
│   │   ├── analytics/page.tsx     # Analytics
│   │   ├── workflows/page.tsx     # n8n workflows (placeholder)
│   │   ├── campaigns/page.tsx     # Campaigns
│   │   ├── calendar/page.tsx      # Calendar
│   │   ├── reports/page.tsx       # Reports
│   │   └── settings/page.tsx      # Settings
│   ├── client/
│   │   ├── page.tsx               # Client overview (MOCK DATA!)
│   │   ├── automations/page.tsx   # Client automations
│   │   ├── reports/page.tsx       # Reports
│   │   ├── documents/page.tsx     # Documents
│   │   ├── support/page.tsx       # Support
│   │   └── settings/page.tsx      # Settings
│   └── page.tsx                   # Root redirect
├── components/
│   ├── layouts/                   # Sidebars, headers
│   └── ui/                        # Shadcn components
├── lib/
│   └── auth.ts                    # JWT auth, roles
└── scripts/
    └── google-apps-script.js      # Backend API
```

**Total: 34 fichiers .tsx**

### 1.2 Analyse Admin Dashboard (`/admin/page.tsx`)

**État: FONCTIONNEL avec limitations**

```typescript
// Stats affichées (lignes 19-28)
interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  qualifiedLeads: number;
  conversionRate: number;
  activeAutomations: number;
  automationErrors: number;
  revenueThisMonth: number;    // NON IMPLEMENTÉ (toujours 0)
  revenueGrowth: number;       // NON IMPLEMENTÉ (toujours 0)
}
```

**API connectée**:
```typescript
// Lignes 113-115
const [statsRes, activitiesRes] = await Promise.all([
  fetch("/api/stats"),
  fetch("/api/stats?type=activities&limit=5")
]);
```

**Problèmes identifiés**:
1. `revenueThisMonth` et `revenueGrowth` = hardcodés à 0
2. Charts = placeholder ("Integration Recharts" - ligne 237)
3. Pas de refresh automatique (data chargée une seule fois au mount)
4. Quick Actions = non fonctionnelles (pas de handlers onClick)

### 1.3 Analyse Client Dashboard (`/client/page.tsx`)

**État: CRITIQUE - 100% MOCK DATA**

```typescript
// Lignes 42-59 - DONNÉES FICTIVES
const mockStats: ClientStats = {
  activeAutomations: 12,    // FAUX
  emailsSent: 3456,         // FAUX
  leadsGenerated: 89,       // FAUX
  tasksCompleted: 45,       // FAUX
};

const mockTasks: UpcomingTask[] = [
  { id: "1", title: "Call mensuel performance", date: "26 Dec 2024", type: "meeting" },
  // ... dates obsolètes (2024 au lieu de 2025)
];

const mockActivities: RecentActivity[] = [
  { id: "1", message: "Campagne 'Noel 2024' envoyee...", time: "Il y a 2h", type: "email" },
  // ... références à 2024
];
```

**Problèmes critiques**:
1. **Aucune connexion API** - useEffect simule un loading de 500ms puis affiche mock data
2. Dates obsolètes (2024 vs 2025)
3. Stats inventées
4. Aucune personnalisation par client
5. Metrics affichés (42.3% open rate, 8.7% CTR) = complètement inventés

### 1.4 Analyse Backend (`google-apps-script.js`)

**État: FONCTIONNEL mais limité**

**Opérations disponibles** (lignes 35-60):
- `create`: Créer enregistrement
- `list`: Lister avec filtres
- `getById`: Recherche par ID
- `getByEmail`: Recherche par email
- `update`: Mise à jour
- `delete`: Suppression
- `incrementRun`: Incrémenter compteur automation
- `getDashboardStats`: Statistiques agrégées

**Schema des données** (lignes 356-377):
```
Users: id, email, name, password, role, createdAt, lastLogin
Leads: id, name, email, phone, company, jobTitle, linkedinUrl,
       source, status, score, priority, notes, tags, assignedTo,
       createdAt, updatedAt, lastContact, nextFollowUp
Automations: id, name, description, type, status, n8nWorkflowId,
             schedule, lastRunAt, nextRunAt, runCount, successCount,
             errorCount, ownerId, createdAt
Activities: id, userId, leadId, action, details, createdAt
Metrics: id, name, value, unit, category, date
```

**Limitation majeure**:
- `revenueThisMonth` retourne toujours 0 (ligne 343: "To be implemented")
- Pas de tracking client-spécifique

### 1.5 Système d'Authentification (`lib/auth.ts`)

**Rôles définis**:
```typescript
export type UserRole = "ADMIN" | "CLIENT" | "VIEWER";
```

**Permissions**:
- `canAccessAdminPanel`: ADMIN uniquement
- `canAccessClientPortal`: ADMIN ou CLIENT
- `canManageAutomations`: ADMIN uniquement
- `canViewReports`: ADMIN ou CLIENT
- `canEditSettings`: ADMIN uniquement

**JWT**: Expiry 7 jours, bcrypt 12 rounds

---

## 2. RECHERCHE WEB - BEST PRACTICES 2025

### 2.1 Client Portal Best Practices

Sources: [AgencyHandy](https://www.agencyhandy.com/client-portal-best-practices/), [Synup](https://www.synup.com/en/competitors/top-agency-client-dashboard-tools), [Ahsuite](https://blog.ahsuite.com/best-client-portals-for-marketing-agencies/)

| Best Practice | Notre État | Gap |
|--------------|-----------|-----|
| Dashboard personnalisable | Non | CRITIQUE |
| SSO / Magic Links | Non (email/password basic) | MOYENNE |
| Mobile responsive | Oui (Tailwind) | OK |
| White-label branding | Partiel (logo 3A) | BASSE |
| Real-time updates | Non | HAUTE |
| Automated reporting | Non | HAUTE |
| Unified dashboard (multi-sources) | Non | HAUTE |

### 2.2 Fonctionnalités Essentielles Manquantes

**D'après la recherche**:

1. **Chatbots/Automated Responses**
   - Notre état: Absent
   - Recommandation: Intégrer support via WhatsApp (workflow existant)

2. **Automated Reporting**
   - Notre état: Placeholder
   - Recommandation: Rapports PDF/email automatiques mensuels

3. **Unified Dashboard**
   - Notre état: Données isolées
   - Recommandation: Agréger Klaviyo + n8n + GA4 dans une vue

4. **Data Visualization**
   - Notre état: Placeholder charts
   - Recommandation: Implémenter Recharts avec vraies données

5. **Role-Based Access**
   - Notre état: Basique (3 rôles)
   - Recommandation: OK pour notre modèle

### 2.3 Plateformes de Référence 2025

| Plateforme | Prix | Forces | Faiblesses pour nous |
|-----------|------|--------|---------------------|
| AgencyAnalytics | $79-399/mois | 80+ intégrations, reporting auto | Overkill, pas de n8n |
| SuiteDash | $19-99/mois | All-in-one, white-label | Pas d'automation focus |
| SPP.co | $129-399/mois | Billing + projects | Pas de lead gen |
| Agency Handy | $49-199/mois | Digital agencies | Pas de workflow engine |

**Conclusion**: Aucune plateforme existante ne correspond à notre stack (n8n + Klaviyo + CinematicAds). Dashboard custom justifié.

---

## 3. RECHERCHE GITHUB - N8N DASHBOARD INTEGRATIONS

### 3.1 Projet Analysé: Landry83/N8N-Dashboard

Source: [GitHub](https://github.com/Landry83/N8N-Dashboard)

**Stack**:
- Next.js + TypeScript
- Shadcn/UI + PostCSS
- DeepSeek API pour AI assistant

**Fonctionnalités**:
- AI-powered workflow assistant
- Workflow management interface
- Execution history
- Templates browser

**Limitations identifiées**:
- Documentation API n8n non explicite
- Demo mode sans connexion réelle
- Pas de multi-tenant

**Applicabilité**: Pattern UI réutilisable, mais intégration n8n à développer

### 3.2 Projet Analysé: gusbarros76/n8n-monitor-dashboard

Source: [GitHub](https://github.com/gusbarros76/n8n-monitor-dashboard)

**Stack**:
- Next.js 14 + TypeScript
- **Supabase** pour real-time + persistence
- Recharts pour visualisation
- Lucide React icons

**Fonctionnalités**:
- Real-time monitoring via Supabase subscriptions
- Auto-refresh 30 secondes
- Dark mode
- Alert system avec acknowledgment
- Analytics charts

**Architecture clé**:
```
Supabase Tables:
├── workflows (name, active, tags)
├── executions (workflow_id, status, timestamps, errors)
└── alerts (severity, message, acknowledged)
```

**Applicabilité**:
- Pattern de real-time excellent
- Mais nécessite migration Google Sheets → Supabase
- OU implémenter polling Google Sheets

### 3.3 Patterns d'Intégration n8n API

**n8n REST API disponible**:
```
GET  /api/v1/workflows           # Liste workflows
GET  /api/v1/workflows/{id}      # Détail workflow
POST /api/v1/workflows/{id}/activate
POST /api/v1/workflows/{id}/deactivate
GET  /api/v1/executions          # Liste executions
GET  /api/v1/executions/{id}     # Détail execution
```

**Notre configuration**:
- URL: https://n8n.srv1168256.hstgr.cloud
- API Key: Configurée (Session 89)
- Workflows actifs: 10/10

**Gap identifié**: Dashboard actuel n'utilise pas l'API n8n. Les données workflow sont mockées.

---

## 4. LIMITATIONS GOOGLE SHEETS BACKEND

### 4.1 Quotas API Documentés

Source: [Google Developers](https://developers.google.com/workspace/sheets/api/limits)

| Limite | Valeur | Impact |
|--------|--------|--------|
| Requests/minute/project | 300 | Dashboard multi-utilisateurs limité |
| Max cells/spreadsheet | 10,000,000 | ~500k rows avec 20 colonnes |
| Request payload max | 2 MB | OK pour CRUD simple |
| Request timeout | 180 secondes | OK |

### 4.2 Problèmes de Scalabilité

Source: [Tho Digitals](https://thodigitals.com/limitations-of-google-sheets/)

1. **Performance dégradée > 50k rows**
   - Notre état: < 1k rows actuellement
   - Risque: Faible à court terme

2. **Pas de real-time natif**
   - Solution: Polling (inefficace) ou migration

3. **Pas de transactions ACID**
   - Risque: Race conditions sur updates concurrents

4. **Limitation: n8n + Service Account = NON SUPPORTÉ**
   - Découvert Session 90
   - Impact: Pas de logging n8n → Google Sheets
   - Documentation: GitHub #22018, #17422

### 4.3 Alternatives Évaluées

| Alternative | Prix | Avantages | Inconvénients |
|------------|------|-----------|---------------|
| Supabase | Gratuit → $25/mois | Real-time, PostgreSQL | Migration requise |
| Firebase | Gratuit → pay-as-go | Real-time, Google ecosystem | NoSQL, pricing complexe |
| PlanetScale | Gratuit → $29/mois | MySQL, serverless | Pas de real-time natif |
| Neon | Gratuit → $19/mois | PostgreSQL, branching | Nouveau, moins mature |

**Recommandation**: Rester sur Google Sheets tant que < 10k leads, prévoir migration Supabase si scaling.

---

## 5. ALIGNEMENT BUSINESS MODEL VS DASHBOARD

### 5.1 Modèle Business Rappel

**Packs One-Time**:
| Pack | Prix | Heures | Automations incluses |
|------|------|--------|---------------------|
| Quick Win | €390 | 3-4h | 1 flow au choix |
| Essentials | €790 | 7-9h | Audit + 3 flows + intégration |
| Growth | €1399 | 14-18h | 5 flows + dashboard + support 60j |

**Retainers Mensuels**:
| Plan | Prix/mois | Inclus |
|------|-----------|--------|
| Maintenance | €290 | 3h support + monitoring |
| Optimization | €490 | 5h + optimisations mensuelles |

**Services On-Demand (vendus séparément)**:
1. CinematicAds AI - Vidéo génération
2. AI Assistant (Grok Voice) - Téléphonie IA
3. WhatsApp Business - Confirmations/rappels

### 5.2 Personas vs Dashboard Features

| Persona | Pack | Dashboard Needs | Actuel |
|---------|------|-----------------|--------|
| E-commerce Dropshipper | Quick Win | Simple: 1 automation status | ABSENT |
| E-commerce Scaler | Growth | Full: multi-flows, analytics | MOCK |
| B2B Lead Hunter | Essentials | CRM focus, lead tracking | PARTIAL |
| Commerce Local | Quick Win | WhatsApp stats, booking | ABSENT |
| Marketing Agency | Custom | Multi-client, white-label | ABSENT |

### 5.3 Features Requises par Pack

**Quick Win (€390) - Dashboard minimal**:
- [x] Login client
- [ ] Vue 1 automation status
- [ ] Metrics basiques (emails sent, leads)
- [ ] Support ticket

**Essentials (€790) - Dashboard standard**:
- Quick Win +
- [ ] Vue multi-automations
- [ ] CRM leads intégré
- [ ] Rapport mensuel

**Growth (€1399) - Dashboard complet**:
- Essentials +
- [ ] Analytics avancés
- [ ] n8n workflow monitoring
- [ ] Looker Studio embed
- [ ] Support prioritaire

### 5.4 Services On-Demand - UI Requise

**CinematicAds AI**:
- [ ] Upload assets (images, prompts)
- [ ] Status génération vidéo
- [ ] Download output
- [ ] Historique projets
- [ ] Usage/crédits

**AI Assistant (Voice)**:
- [ ] Stats appels (entrants, durée)
- [ ] Transcriptions
- [ ] Bookings créés
- [ ] Configuration horaires

**WhatsApp Business**:
- [ ] Stats messages (sent, delivered, read)
- [ ] Templates utilisés
- [ ] Rappels programmés
- [ ] Opt-out liste

---

## 6. GAP ANALYSIS COMPLET

### 6.1 Gaps Critiques (Bloquants)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| G1 | Client dashboard = mock data | Clients voient données fausses | MOYEN |
| G2 | Revenue tracking absent | Impossible suivre business | FAIBLE |
| G3 | n8n API non intégrée | Workflow status inventé | MOYEN |
| G4 | On-demand services UI absente | 3 services non accessibles | ÉLEVÉ |

### 6.2 Gaps Hauts (Importants)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| G5 | Charts placeholder | Dashboard peu utile | MOYEN |
| G6 | Pas de real-time | Data obsolète | ÉLEVÉ |
| G7 | Pas de rapports automatiques | Travail manuel | MOYEN |
| G8 | Quick actions non fonctionnelles | UX cassée | FAIBLE |

### 6.3 Gaps Moyens (Nice-to-have)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| G9 | Pas de SSO/magic links | Friction login | MOYEN |
| G10 | Pas de multi-tenant agence | Marketing Agency limité | ÉLEVÉ |
| G11 | Pas de notifications | Pas d'alertes | MOYEN |
| G12 | Mobile app | Desktop only | ÉLEVÉ |

---

## 7. ARCHITECTURE CIBLE

### 7.1 Architecture Technique Proposée

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                    │
├─────────────────────────────────────────────────────────────────┤
│  Admin Dashboard          │  Client Portal                      │
│  ├── Overview             │  ├── Overview (personalized)        │
│  ├── Leads CRM            │  ├── My Automations                 │
│  ├── Automations          │  ├── Reports                        │
│  ├── Workflows (n8n)      │  ├── On-Demand Services             │
│  ├── Analytics            │  │   ├── CinematicAds               │
│  ├── Campaigns            │  │   ├── Voice AI                   │
│  └── Settings             │  │   └── WhatsApp                   │
│                           │  ├── Documents                       │
│                           │  ├── Support                         │
│                           │  └── Settings                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js API Routes)             │
├─────────────────────────────────────────────────────────────────┤
│  /api/auth/*     │  Authentication (JWT)                        │
│  /api/stats      │  Dashboard statistics                        │
│  /api/leads/*    │  CRUD leads                                  │
│  /api/n8n/*      │  Proxy to n8n API                            │
│  /api/klaviyo/*  │  Proxy to Klaviyo API                        │
│  /api/services/* │  On-demand services                          │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Google Sheets  │ │   n8n API       │ │  Klaviyo API    │
│  (Database)     │ │  (Workflows)    │ │  (Email CRM)    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  Vertex AI (CinematicAds)  │  xAI Grok (Voice)  │  WhatsApp API │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Flux de Données

**Admin Dashboard**:
```
1. Login → JWT token
2. /api/stats → Google Sheets (getDashboardStats)
3. /api/n8n/workflows → n8n API (GET /workflows)
4. /api/klaviyo/metrics → Klaviyo API (campaigns, lists)
5. Polling 30s pour refresh
```

**Client Portal**:
```
1. Login → JWT token + clientId
2. /api/stats?clientId=X → Google Sheets (filtered by client)
3. /api/n8n/workflows?ownerId=X → n8n API (client workflows)
4. /api/services/cinematicads?clientId=X → Project status
5. /api/services/whatsapp?clientId=X → Message stats
```

### 7.3 Schéma Base de Données Étendu

**Nouvelles tables requises**:

```
Clients:
├── id
├── name
├── email
├── company
├── pack (QUICK_WIN | ESSENTIALS | GROWTH)
├── retainer (NONE | MAINTENANCE | OPTIMIZATION)
├── startDate
├── endDate (retainer)
├── automationIds[]
└── onDemandEnabled (cinematicads, voice, whatsapp)

CinematicAdsProjects:
├── id
├── clientId
├── name
├── status (PENDING | PROCESSING | COMPLETED | ERROR)
├── inputAssets[]
├── outputUrl
├── creditsUsed
├── createdAt
└── completedAt

VoiceCallLogs:
├── id
├── clientId
├── phoneNumber
├── duration
├── transcript
├── bookingCreated
├── createdAt

WhatsAppMessages:
├── id
├── clientId
├── template
├── recipient
├── status (SENT | DELIVERED | READ | FAILED)
├── sentAt
└── readAt
```

---

## 8. PLAN D'IMPLEMENTATION

### 8.1 Phase 1: Fondations (Critique)

**Durée estimée**: 2-3 jours de développement

| Tâche | Priorité | Effort |
|-------|----------|--------|
| 1.1 Connecter Client Dashboard à API (remplacer mock) | P0 | 4h |
| 1.2 Ajouter endpoint `/api/stats?clientId=X` | P0 | 2h |
| 1.3 Implémenter revenue tracking | P0 | 3h |
| 1.4 Intégrer n8n API dans dashboard | P0 | 4h |
| 1.5 Quick Actions fonctionnelles | P1 | 2h |

**Critère de succès**: Client voit SES vraies données

### 8.2 Phase 2: On-Demand Services UI

**Durée estimée**: 3-4 jours de développement

| Tâche | Priorité | Effort |
|-------|----------|--------|
| 2.1 Page CinematicAds avec upload/status | P0 | 6h |
| 2.2 Page Voice AI avec stats appels | P0 | 4h |
| 2.3 Page WhatsApp avec stats messages | P0 | 4h |
| 2.4 API routes pour chaque service | P0 | 6h |
| 2.5 Schéma DB étendu (nouvelles tables) | P0 | 3h |

**Critère de succès**: 3 services accessibles et fonctionnels

### 8.3 Phase 3: Visualisation & Reports

**Durée estimée**: 2-3 jours de développement

| Tâche | Priorité | Effort |
|-------|----------|--------|
| 3.1 Implémenter Recharts avec vraies données | P1 | 4h |
| 3.2 Rapport PDF automatique mensuel | P1 | 6h |
| 3.3 Export CSV leads/metrics | P2 | 2h |
| 3.4 Looker Studio embed (Growth pack) | P2 | 3h |

**Critère de succès**: Visualisations réelles, rapport auto

### 8.4 Phase 4: Real-time & Polish

**Durée estimée**: 2-3 jours de développement

| Tâche | Priorité | Effort |
|-------|----------|--------|
| 4.1 Polling 30s pour refresh data | P1 | 2h |
| 4.2 Notifications in-app | P2 | 4h |
| 4.3 SSO / Magic links | P3 | 4h |
| 4.4 Multi-tenant (agencies) | P3 | 8h |

**Critère de succès**: Dashboard dynamique

---

## 9. RECOMMANDATIONS TECHNIQUES

### 9.1 À Faire Immédiatement

1. **Remplacer mock data dans client dashboard**
   - Fichier: `dashboard/src/app/client/page.tsx`
   - Action: Copier pattern de `/admin/page.tsx` pour API calls
   - Filter par `clientId` depuis JWT

2. **Créer endpoint client stats**
   - Fichier: `dashboard/src/app/api/stats/route.ts`
   - Action: Ajouter paramètre `clientId` pour filtrage

3. **Connecter n8n API**
   - Créer `/api/n8n/workflows/route.ts`
   - Utiliser `N8N_API_KEY` depuis `.env`
   - Proxy vers `https://n8n.srv1168256.hstgr.cloud/api/v1`

### 9.2 À Éviter

1. **NE PAS migrer vers Supabase maintenant**
   - Google Sheets suffisant < 10k leads
   - Migration = effort élevé, risque

2. **NE PAS implémenter WebSocket**
   - Polling 30s suffisant pour notre volume
   - Complexité inutile

3. **NE PAS ajouter multi-tenant**
   - Priorité basse, persona Agency = 5% clients
   - À revisiter si demande

### 9.3 Stack Technique Recommandée

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend | Next.js 14 App Router | Déjà en place, SSR, API routes |
| UI | Shadcn/UI + Tailwind | Déjà en place, cohérent |
| Charts | Recharts | Mentionné dans code, populaire |
| Auth | JWT + bcrypt | Déjà en place, suffisant |
| Database | Google Sheets | Suffisant, gratuit, familier |
| Real-time | Polling 30s | Simple, suffisant pour volume |
| PDF | react-pdf ou jspdf | Rapports automatiques |

---

## 10. MÉTRIQUES DE SUCCÈS

### 10.1 KPIs Dashboard

| Métrique | Baseline | Target | Mesure |
|----------|----------|--------|--------|
| Client login/semaine | 0 | 5+ par client actif | Analytics |
| Temps sur dashboard | 0 | > 2 min/session | Analytics |
| Satisfaction client | N/A | > 4/5 | Survey post-onboarding |
| Tickets support dashboard | 0 | < 2/mois | Zendesk/email |

### 10.2 KPIs Techniques

| Métrique | Baseline | Target | Mesure |
|----------|----------|--------|--------|
| Load time | ? | < 2s | Lighthouse |
| API response time | ? | < 500ms | Monitoring |
| Uptime | ? | 99.5% | Uptime Robot |
| Mobile usability | ? | 100/100 | Lighthouse |

---

## 11. RISQUES IDENTIFIÉS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Google Sheets quota hit | Faible | Élevé | Caching, batch requests |
| n8n API instable | Faible | Moyen | Retry logic, fallback UI |
| Adoption client faible | Moyenne | Élevé | Onboarding, documentation |
| Scope creep features | Élevée | Moyen | Priorisation stricte, MVP first |

---

## 12. SOURCES

### Recherche Web
- [Client Portal Best Practices 2025 - AgencyHandy](https://www.agencyhandy.com/client-portal-best-practices/)
- [Best Agency Client Dashboard Tools - Synup](https://www.synup.com/en/competitors/top-agency-client-dashboard-tools)
- [Client Portals for Marketing Agencies - Ahsuite](https://blog.ahsuite.com/best-client-portals-for-marketing-agencies/)
- [Google Sheets API Limits](https://developers.google.com/workspace/sheets/api/limits)
- [Google Sheets Limitations 2025 - Tho Digitals](https://thodigitals.com/limitations-of-google-sheets/)

### Recherche GitHub
- [N8N-Dashboard by Landry83](https://github.com/Landry83/N8N-Dashboard)
- [n8n-monitor-dashboard by gusbarros76](https://github.com/gusbarros76/n8n-monitor-dashboard)

### Documentation Interne
- PERSONAS-3A-AUTOMATION.md
- automations-registry.json v1.5.0
- dashboard/src/**/*.tsx (34 fichiers analysés)

---

## 13. PROCHAINES ÉTAPES IMMÉDIATES

### Session 92 - Implementation Phase 1 - COMPLETED (25/12/2025)

```
[x] 1. Copier pattern API de admin/page.tsx vers client/page.tsx
[x] 2. Ajouter paramètre clientId à /api/stats
[x] 3. Créer /api/n8n/workflows avec proxy
[x] 4. Créer /api/n8n/executions avec proxy
[x] 5. Implémenter revenue tracking dans getDashboardStats()
[x] 6. Tester dashboard client avec vraies données
[x] 7. Quick actions: onClick handlers

FICHIERS CRÉÉS/MODIFIÉS:
├── dashboard/src/app/api/n8n/workflows/route.ts (NEW - proxy n8n API)
├── dashboard/src/app/api/n8n/executions/route.ts (NEW - proxy n8n API)
├── dashboard/src/app/client/page.tsx (REWRITTEN - real API calls)
├── dashboard/.env.local (UPDATED - N8N_HOST, N8N_API_KEY)
└── Build: SUCCESS - 27 pages compiled

n8n API VERIFIED:
├── Workflows: 10/10 active
├── Executions: Real data from API
└── Connection: OK
```

### Session 93 - STRATÉGIE PARTENAIRE VALIDÉE (25/12/2025)

```
DÉCISION STRATÉGIQUE:
├── CinematicAds = PAS d'UI dans 3A Dashboard
│   ├── Raison: Projet SaaS séparé (cinematicads.studio)
│   ├── Action: Marketing-only avec redirect
│   └── CTAs ajoutés sur pages automations (FR + EN)
├── Voice AI + WhatsApp = Templates génériques créés
│   ├── Dossier: automations/shared-components/
│   ├── Voice Widget: 3 configs (example, 3A, CinematicAds)
│   └── WhatsApp: 2 workflows n8n (confirmation, reminders)
└── Dashboard Phase 2 = ANNULÉE (services déjà gérés)

FICHIERS CRÉÉS SESSION 93:
├── automations/shared-components/voice-widget/
│   ├── config.example.js
│   ├── config-3a-automation.js
│   ├── config-cinematicads.js
│   └── README.md
├── automations/shared-components/whatsapp-workflows/
│   ├── booking-confirmation-generic.json
│   ├── booking-reminders-generic.json
│   └── README.md
├── automations.html: CinematicAds cards → cinematicads.studio
├── en/automations.html: idem EN
├── styles.css: .category-cta, .clickable-card, .card-cta
└── automations-registry.json: v1.6.0 (external-service type)

COMMIT: b12aa9d
```

### Session 94 - PHASE 3 COMPLETE (25/12/2025)

```
PHASE 3 - VISUALISATION: ✅ COMPLETE
[x] 3.1 Implémenter Recharts avec vraies données
    ├── BarChart: Executions par workflow (success vs error)
    ├── PieChart: Workflow status + Success/Error distribution
    ├── Admin + Client dashboards rewritten
    └── Real data from n8n API

[x] 3.2 Rapport PDF automatique
    ├── jsPDF + jspdf-autotable
    ├── Professional 3A Automation branding
    ├── Summary boxes + workflow performance table
    └── /api/reports/pdf endpoint

[x] 3.3 Export CSV leads/metrics
    ├── /api/reports/export endpoint
    ├── Types: workflows, executions, summary
    ├── French headers (ID, Nom, Status, etc.)
    └── Content-Disposition: attachment

FICHIERS CRÉÉS SESSION 94:
├── dashboard/src/lib/pdf-generator.ts (NEW)
├── dashboard/src/app/api/reports/route.ts (NEW)
├── dashboard/src/app/api/reports/pdf/route.ts (NEW)
├── dashboard/src/app/api/reports/export/route.ts (NEW)
├── dashboard/src/app/admin/reports/page.tsx (REWRITTEN)
└── dashboard/src/app/client/reports/page.tsx (REWRITTEN)

COMMITS:
├── e9d997a feat(session94): Phase 3.2 + 3.3 - PDF Reports & CSV Export
└── 3137a16 docs(session94): Update CLAUDE.md
```

### Prochaines Étapes (Session 95+)

```
PHASE 4 - DÉPLOIEMENT CINEMATICADS (Projet séparé):
[ ] 4.1 Copier shared-components vers /Desktop/Ads-Automations/
[ ] 4.2 Configurer n8n pour CinematicAds
[ ] 4.3 Créer templates WhatsApp Meta
[ ] 4.4 Déployer voice-widget sur cinematicads.studio

PHASE 5 - LEAD GENERATION (Priorité HAUTE):
[ ] 5.1 Premier outreach: 10 prospects e-commerce Shopify
[ ] 5.2 Test campaign: Formulaire → Klaviyo → n8n
[ ] 5.3 Monitoring alertes si workflow échoue
```

---

## 14. HISTORIQUE DES SESSIONS

| Session | Date | Actions | Status |
|---------|------|---------|--------|
| 91 | 25/12/2025 | Recherche + Blueprint | ✅ COMPLETE |
| 92 | 25/12/2025 | Phase 1 - Client dashboard API | ✅ COMPLETE |
| 93 | 25/12/2025 | Stratégie CinematicAds + Generics | ✅ COMPLETE |
| 94 | 25/12/2025 | Phase 3 - Recharts + PDF + CSV | ✅ COMPLETE |

---

*Document mis à jour le 2025-12-25*
*Session 94 - Phase 3 COMPLETE (Recharts, PDF, CSV)*
*Dashboard Blueprint Phases 1-3 = 100% DONE*
