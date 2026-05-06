# Mes Poilus

Plateforme de contenu et de services pour animaux de compagnie, ciblant l'ensemble du monde francophone (Belgique, France, Suisse, Canada, Afrique francophone).

## Fonctionnalités

- **Blog** — Articles SEO générés par Marie (IA), filtrables par catégorie, avec images Unsplash automatiques
- **Adoption** — Annonces de particuliers pour donner un animal, avec photos, modération admin et emails automatiques
- **Newsletter** — Inscription + envoi de campagnes via Resend
- **Boutique** — Placeholder affiliation (Amazon, Zooplus, etc.) — pas de vente directe
- **Agents IA** — 9 agents Claude avec dashboard admin, streaming en temps réel et historique
- **Sécurité** — Middleware Edge : rate limiting, détection SQLi/XSS, blocage IP automatique

---

## Stack

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Style | Tailwind CSS — thème sombre `gray-900` |
| Base de données | Supabase (PostgreSQL) |
| Storage | Supabase Storage (photos adoption) |
| IA | API Anthropic — Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5 |
| Images | Unsplash API (50 req/h gratuit) |
| Emails | Resend (3 000 emails/mois gratuit) |
| Déploiement prévu | Vercel |

---

## Installation

### 1. Cloner et installer

```bash
npm install
```

### 2. Variables d'environnement

```bash
cp .env.local.example .env.local
```

| Variable | Description | Où l'obtenir |
|----------|-------------|-------------|
| `ANTHROPIC_API_KEY` | Clé API Claude | [console.anthropic.com](https://console.anthropic.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | Dashboard Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (privée, côté serveur uniquement) | Dashboard Supabase → Settings → API |
| `UNSPLASH_ACCESS_KEY` | Clé API Unsplash | [unsplash.com/developers](https://unsplash.com/developers) |
| `RESEND_API_KEY` | Clé API Resend (emails) | [resend.com](https://resend.com) |
| `CSRF_SECRET` | Secret aléatoire ≥ 32 caractères | Générer manuellement |

### 3. Base de données Supabase

Exécuter les fichiers SQL dans l'ordre dans **Supabase → SQL Editor** :

```
src/lib/supabase/schema.sql               ← schéma initial (projet Supabase vierge)
src/lib/supabase/migration_complete.sql   ← colonnes images, indexes, fonction RPC
src/lib/supabase/migration_categories.sql ← colonne categories TEXT[] sur articles
src/lib/supabase/migration_newsletter.sql ← tables newsletter_subscribers et newsletter_campaigns
src/lib/supabase/migration_adoption.sql   ← table adoption_posts
```

### 4. Supabase Storage

Dans **Supabase → Storage**, créer le bucket `adoption-photos` :
- Visibilité : **Public**
- Taille maximale par fichier : **5 Mo**

### 5. Utilisateur admin

Dans **Supabase → Authentication → Users → Add user**, créer un compte avec ton email et un mot de passe. Ce compte donne accès au dashboard admin sur `/dashboard`.

### 6. Lancer en développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

---

## Structure du projet

```
src/
├── app/
│   ├── page.tsx                     # Landing page publique
│   ├── blog/
│   │   ├── page.tsx                 # Liste articles + filtres
│   │   └── [slug]/page.tsx          # Article complet
│   ├── adoption/
│   │   ├── page.tsx                 # Annonces + formulaire
│   │   └── AdoptionPostForm.tsx     # Formulaire client (upload photos)
│   ├── boutique/page.tsx            # Placeholder boutique
│   ├── login/
│   │   ├── page.tsx
│   │   └── actions.ts               # Server action signIn
│   ├── actions/auth.ts              # Server action logout
│   ├── (admin)/
│   │   ├── dashboard/page.tsx       # Dashboard agents IA
│   │   ├── agents/[agent]/page.tsx  # Interface agent + streaming
│   │   ├── orchestrate/page.tsx     # Orchestration multi-agents
│   │   └── moderation/page.tsx      # Modération annonces adoption
│   └── api/
│       ├── agents/[agent]/route.ts  # Streaming Claude
│       ├── orchestrate/route.ts     # Orchestration Thomas
│       ├── blog/route.ts            # Articles paginés
│       ├── newsletter/
│       │   ├── subscribe/route.ts   # Inscription newsletter
│       │   └── send/route.ts        # Envoi campagne
│       ├── adoption/
│       │   ├── upload/route.ts      # Upload photo → Supabase Storage
│       │   └── submit/route.ts      # Soumission annonce + emails
│       ├── security/report/route.ts
│       └── stats/route.ts
├── components/
│   ├── layout/
│   │   ├── LayoutShell.tsx          # Sidebar conditionnelle (admin seulement)
│   │   └── Sidebar.tsx
│   ├── blog/BlogCard.tsx
│   ├── landing/NewsletterForm.tsx
│   └── ui/
│       ├── BackButton.tsx
│       └── CookieBanner.tsx
├── lib/
│   ├── agents/
│   │   ├── runner.ts                # streamAgentTask + post-processing
│   │   ├── anthropic.ts             # Client Anthropic
│   │   └── agents.ts                # Configuration des 9 agents
│   ├── supabase/
│   │   ├── server.ts                # createAdminClient()
│   │   └── *.sql                    # Migrations
│   ├── resend.ts                    # sendEmail() + sendBulkNewsletter()
│   ├── rateLimit.ts                 # checkRateLimit() en mémoire
│   └── unsplash.ts                  # getHeroPhotos()
├── types/index.ts
└── middleware.ts                    # Protection routes admin + sécurité Edge
```

---

## Pages et routes

### Publiques

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/blog` | Liste des articles, filtres par catégorie |
| `/blog/[slug]` | Article complet avec SEO et schema.org |
| `/adoption` | Annonces d'adoption + formulaire de dépôt |
| `/boutique` | Placeholder boutique affiliation |
| `/mentions-legales` | Mentions légales (droit belge) |
| `/politique-confidentialite` | RGPD |
| `/cgu` | Conditions générales d'utilisation |
| `/cookies` | Politique cookies |

### Admin (auth Supabase requise)

| Route | Description |
|-------|-------------|
| `/login` | Connexion admin |
| `/dashboard` | Dashboard agents IA — statuts, stats, activité |
| `/agents/[agent]` | Interface par agent avec streaming temps réel |
| `/orchestrate` | Orchestration Thomas multi-agents |
| `/moderation` | Modération des annonces adoption |

---

## Les 9 agents IA

| Agent | Modèle | Rôle |
|-------|--------|------|
| 👔 Thomas | Opus 4.7 | CEO Orchestrateur — stratégie, coordination |
| ✍️ Marie | Sonnet 4.6 | Rédactrice blog (articles SEO 800–1500 mots) |
| 🔍 Lucas | Sonnet 4.6 | SEO multi-pays francophones |
| 📱 Emma | Sonnet 4.6 | Réseaux sociaux (Instagram, Facebook, TikTok) |
| 💻 Maxime | Sonnet 4.6 | Dev & maintenance Next.js / Supabase |
| 💬 Léa | Haiku 4.5 | Support client |
| 📊 Antoine | Sonnet 4.6 | Finance — marges, rapports, projections |
| 🛡️ Nathalie | Sonnet 4.6 | Sécurité — détection, blocage IP, audits |
| 💌 Sofia | Sonnet 4.6 | Newsletter — rédaction HTML + envoi via Resend |

Chaque agent a son propre post-processing : Marie sauvegarde les articles en BDD, Emma enregistre les posts sociaux, Antoine les rapports financiers, Sofia les drafts de newsletter, etc.

---

## Fonctionnement de l'adoption

1. Le visiteur soumet une annonce avec **2 à 5 photos** sur `/adoption`
2. Les photos sont uploadées dans le bucket Supabase Storage `adoption-photos`
3. L'annonce est insérée en BDD avec `status = 'pending'`
4. **Email automatique au déposant** : confirmation de réception
5. **Email automatique à l'admin** : notification avec récap + lien `/moderation`
6. L'admin approuve ou rejette depuis `/moderation`
7. **Email au déposant** selon la décision

### Emails automatiques (Resend)

| Déclencheur | Destinataire | Contenu |
|-------------|-------------|---------|
| Soumission | Déposant | Annonce bien reçue, vérification sous 24h |
| Soumission | Admin | Récap complet + lien direct `/moderation` |
| Approbation | Déposant | Annonce en ligne + lien `/adoption` |
| Refus | Déposant | Annonce non retenue + invitation à répondre |

---

## Base de données (10 tables)

| Table | Description |
|-------|-------------|
| `articles` | Articles rédigés par Marie (avec `image_url`, `categories TEXT[]`) |
| `activity_logs` | Historique des tâches de tous les agents |
| `security_logs` | Événements de sécurité |
| `social_posts` | Posts créés par Emma |
| `financial_reports` | Rapports d'Antoine |
| `agent_stats` | Statistiques par agent (tâches, tokens, score) |
| `blocked_ips` | IPs bloquées par Nathalie |
| `newsletter_subscribers` | Abonnés newsletter |
| `newsletter_campaigns` | Campagnes newsletter (draft → sent) |
| `adoption_posts` | Annonces d'adoption (pending / approved / rejected) |

---

## API interne

| Endpoint | Description |
|----------|-------------|
| `POST /api/agents/[agent]` | Streaming Claude pour un agent |
| `POST /api/orchestrate` | Orchestration Thomas multi-agents |
| `GET /api/blog` | Articles paginés avec filtres |
| `GET /api/stats` | Statistiques globales |
| `POST /api/security/report` | Rapport sécurité Nathalie |
| `POST /api/newsletter/subscribe` | Inscription newsletter |
| `POST /api/newsletter/send` | Envoi campagne (auth requise) |
| `POST /api/adoption/upload` | Upload photo → Supabase Storage (max 5 Mo, 25/h par IP) |
| `POST /api/adoption/submit` | Soumission annonce + emails automatiques (5/h par IP) |

---

## SEO

- Sitemap dynamique `/sitemap.xml` (tous les articles publiés)
- `robots.txt` : allow `/blog/`, disallow admin, lien sitemap
- Schema.org JSON-LD `Article` sur chaque page d'article
- Open Graph + Twitter Card complets sur toutes les pages publiques
- `robots: index, follow` sur `/blog`, `/blog/[slug]` et `/adoption`
- `metadataBase` configuré pour les URLs absolues OG/canonical

---

## Sécurité

- **Middleware Edge** — protège toutes les routes admin, redirige vers `/login`
- **Rate limiting** — 60 req/min global, 10/min par agent, 5 soumissions adoption/h, 25 uploads/h
- **Détection** — SQL injection, XSS, path traversal, LFI
- **Blocage IP** — automatique en mémoire + persistance dans `blocked_ips`
- **Headers** — CSP, X-Frame-Options, etc. sur toutes les routes

> En production : remplacer le rate limiting mémoire par Redis (Upstash) pour supporter plusieurs instances.
