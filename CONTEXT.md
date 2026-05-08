# Mes Poilus - Contexte projet

## Idée business

Agence de contenu et boutique e-commerce spécialisées dans les animaux de compagnie pour l'ensemble du **monde francophone**.

Deux piliers :

1. **Blog de contenu** - Articles SEO, guides pratiques, conseils vétérinaires, actualités animalières ciblant l'ensemble de la francophonie (google.be, google.fr, google.ch, google.ca). Monétisation via publicité display, articles sponsorisés et affiliation (Amazon.be/fr/ca, zooplus, animaleries locales selon marché).

2. **Boutique dropshipping** - Vente de produits animaliers (accessoires, alimentation, soins) sans stock physique. Fournisseurs européens avec livraison internationale francophone. Intégration Shopify prévue.

**Marchés cibles (par ordre de priorité) :**
- 🇧🇪 **Belgique francophone** - marché prioritaire, point d'ancrage de l'entreprise
- 🇫🇷 **France** - marché principal en volume
- 🇨🇭 **Suisse romande** - marché premium
- 🇱🇺 **Luxembourg francophone** - marché de niche
- 🇨🇦 **Canada francophone (Québec)** - marché en croissance
- 🌍 **Afrique francophone** - marché émergent (Maroc, Côte d'Ivoire, Sénégal, etc.)

**Animaux couverts :** chiens, chats, oiseaux, rongeurs, reptiles.

**Budget de démarrage :** 500 €

**Objectif revenus mois 3 :** 200 – 500 €/mois

---

## Les 9 agents IA

Chaque agent utilise l'API Anthropic (Claude) et fonctionne de façon autonome. Thomas orchestre les autres.

| Agent | Rôle | Modèle Claude | maxTokens | Responsabilités |
|-------|------|--------------|-----------|-----------------|
| 👔 **Thomas** | CEO Orchestrateur | Opus 4.7 | 3000 | Stratégie globale, priorisation, coordination, rapports |
| ✍️ **Marie** | Rédactrice de contenu | **Haiku 4.5** | **1200** | Articles de blog (400-600 mots), guides pratiques, conseils |
| 🔍 **Lucas** | Spécialiste SEO | Sonnet 4.6 | **400** | Recherche mots-clés, optimisation on-page, stratégie francophone |
| 📱 **Emma** | Réseaux sociaux | Haiku 4.5 | 2000 | Posts Facebook + Instagram (@mespoilusofficiel), hashtags, lien article complet |
| 💻 **Maxime** | Développeur & Maintenance | Sonnet 4.6 | 6000 | Performances, bugs, Next.js / Supabase, Core Web Vitals |
| 💬 **Léa** | Support client | Haiku 4.5 | 3000 | Réponses emails clients, commandes, FAQ — à la demande uniquement (pas de cron) |
| 📊 **Antoine** | Finance | Sonnet 4.6 | 4000 | Revenus €, marges, rapports financiers, projections |
| 🛡️ **Nathalie** | Sécurité | Sonnet 4.6 | 4000 | Détection intrusions, blocage IPs, audits, alertes |
| 💌 **Sofia** | Newsletter | Sonnet 4.6 | 4000 | Newsletter hebdomadaire, sélection articles, envoi Resend |

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Style | Tailwind CSS — thème sombre admin `#1e1e1e`, site public navy `#111827` |
| Base de données | Supabase (PostgreSQL) |
| IA | API Anthropic — Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5 |
| Images blog/social | **Pexels API** (téléchargement + stockage autorisés, 200 req/h gratuit) |
| Images site public | Unsplash API (hero, banners, agents — affichage uniquement, non stockées) |
| Stockage images | Supabase Storage bucket `blog-images` (images articles stockées définitivement) |
| Sécurité | Middleware Edge : rate limiting, détection SQLi/XSS, blocage IP |
| Déploiement | Vercel (crons configurés dans `vercel.json`) |
| Affiliation | Awin (EU) + CJ.com (CA/US, en attente confirmation) |

### Variables d'environnement requises

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UNSPLASH_ACCESS_KEY          # Images décoratives site public uniquement
PEXELS_API_KEY               # Images articles blog + réseaux sociaux
CSRF_SECRET
RESEND_API_KEY
AWIN_PUBLISHER_ID
AWIN_API_TOKEN
CRON_SECRET
MAKE_WEBHOOK_URL             # Webhook Make.com — Facebook + Instagram (@mespoilusofficiel)
NEXT_PUBLIC_APP_URL          # Ex: https://www.mespoilus.com (OBLIGATOIRE pour fetches internes Vercel)
```

---

## Ce qui est fait

### Landing page publique (`/`)
- Design clair et chaleureux (blanc, beige, tons ambrés)
- Hero split : texte à gauche (52%), 4 photos Unsplash d'animaux différents à droite en grille décalée (chien, chat, oiseau, lapin) avec dégradé de fondu — `getHeroPhotos()` dans `unsplash.ts`
- Nav : logo à gauche, liens Blog / Adoption / Newsletter au centre, bouton 🛍️ Boutique (amber) à droite
- Section "Derniers articles" : 3 derniers articles de Marie avec cards
- Section catégories : 5 catégories avec photos Unsplash
- Section newsletter avec formulaire email (client component `NewsletterForm.tsx`)
- Footer : navigation, mentions légales, lien **Facebook** réel → page Mes Poilus, **pas de lien Admin ni TikTok**
- `revalidate = 3600`

### Authentification admin (Supabase Auth)
- **Middleware** `src/middleware.ts` — protège `/dashboard`, `/agents/*`, `/orchestrate`, `/api/agents/*` etc.
- Routes admin sans session → redirect `/login?redirect=...`
- API routes sans session → `401 Unauthorized`
- **Page login** `src/app/login/page.tsx` — fond navy `#111827`, cadre `#262626` avec bordures `#484848`
- `src/app/login/actions.ts` — server action `signIn` via `supabase.auth.signInWithPassword`
- `src/app/actions/auth.ts` — server action `logout`

### Routes et layout
- `src/app/layout.tsx` — minimal, utilise `LayoutShell` + `CookieBanner` + `GoogleAnalytics`
- `src/components/layout/LayoutShell.tsx` — Client Component :
  - **Admin** (`/dashboard`, `/agents/*`, `/orchestrate`, `/moderation`) → `bg-[#1e1e1e]` gris + Sidebar
  - **Public** (tout le reste) → `bg-[#111827]` navy + PublicHeader
- Dashboard admin : `src/app/(admin)/dashboard/page.tsx`

### Thème visuel
- **Admin** : fond `#111827` (même que site public), sidebar `#0f172a`, cards `#1e2a3a`, bordures `#2a3a4a`, hover `#253347`
- **Site public** : fond navy `#111827`, cards `bg-[#262626]` avec section texte blog `#1e2a3a`
- **Blog cards** : section texte en `bg-[#1e2a3a]` (bleu clair distinct), texte blanc
- **CSS globals** : classes `.card`, `.card-hover`, `.input-dark`, `.btn-ghost` mises à jour avec les teintes navy

### Mode jour/nuit (`next-themes`)
- `ThemeProvider.tsx` wrappé dans `layout.tsx` — `defaultTheme="dark"`, `attribute="class"`, `enableSystem={true}`
- `<html suppressHydrationWarning>` dans `layout.tsx` pour éviter le flash SSR
- `tailwind.config.ts` : `darkMode: 'class'`
- `ThemeToggle.tsx` : dropdown 3 états (☀️ Jour / 🌙 Nuit / 🖥️ Auto), click-outside-to-close
- **Placement** : dans `PublicHeader.tsx` APRÈS le bouton Boutique (qui garde son `ml-auto`), même chose dans `Sidebar.tsx` footer + page accueil `page.tsx`
- CSS variables dans `globals.css` : `:root` (light) et `.dark` (dark) — `--bg-primary`, `--bg-card`, `--bg-sidebar`, etc.
- Classes CSS pures pour les utilitaires dynamiques (`.card`, `.card-hover`, `.input-dark`, `.btn-ghost`) — pas de `@apply dark:` sur ces classes

### Filtres blog — OR sur category ET categories[]
- Articles publiés peuvent avoir : `category` (string), `categories[]` (array), ou les deux
- Filtre PostgREST : `.or(\`category.eq.${category},categories.cs.{${category}}\`)` dans `blog/page.tsx` ET `_category-page.tsx`
- Évite les articles invisibles sur les pages catégories si `categories[]` est incomplet

### Dashboard admin (`/dashboard`)
- Grille des 9 agents avec statut, stats et dernière activité
- Feed d'activité : liste verticale compacte, 20 entrées, scrollable, sans icônes
- Stats globales : articles publiés, tâches exécutées, tokens utilisés, alertes sécurité
- **Chaque stat globale affiche : total all-time + "X ce mois" en ambré**
- **Totaux ET mensuels calculés depuis `activity_logs` (source unique) → total toujours ≥ ce mois**
- `agent_stats` utilisé uniquement pour `last_active` et fallback score
- Score agent : calculé dynamiquement depuis `activity_logs` (success / (success + error) * 100)
- **Chaque card agent affiche : tâches total + ce mois, tokens total + ce mois**
- **Auto-refresh toutes les 30 secondes** via `AutoRefresh.tsx` (client component, `router.refresh()`)
- **CronLauncher** : menu déroulant avec 4 pipelines manuels (voir section Crons)
- `revalidate = 30`

### Pages agents (`/agents/[agent]`)
- Photo ambiante Unsplash en hero (fallback SVG thématique)
- Zone de saisie de tâche avec **streaming en temps réel** de la réponse Claude
- Tâches rapides préconfigurées par agent
- Historique des activités par agent (cliquable — Marie → article, autres → accordéon contenu)
- **Stats : tâches complétées/échouées + tokens — total all-time + ce mois en ambré**
- **Délégation automatique via Thomas** : après chaque réponse, Thomas analyse et délègue si nécessaire (voir section Délégation)
- `revalidate = 30`

### Orchestration (`/orchestrate`)
- Thomas reçoit un objectif libre, crée un plan JSON, délègue aux agents
- **Pipeline réel** : si Marie est dans le plan → Lucas (SEO) → Marie (article publié) → image Pexels → cron_state → Emma (post Facebook)
- Si Emma seule → utilise le dernier article publié
- Pour Antoine/Nathalie/Lucas/Maxime → contexte Supabase réel injecté via `buildEnrichedPrompt`
- Thomas synthétise les résultats à la fin
- Badge "🚀 Pipeline réel activé" visible dans l'UI

### Délégation Thomas (`/api/agents/delegate`)
- Déclenchée automatiquement après chaque réponse d'agent (si réponse > 150 chars)
- Thomas analyse la réponse et décide si des tâches doivent être déléguées
- Maximum 3 délégations par session, agents différents de celui qui a répondu
- Résultats affichés en cartes dépliables sous la réponse principale
- Tout est sauvegardé en base (les save functions s'exécutent normalement)

### Contexte Supabase réel (`src/lib/agents/context.ts`)
- `buildEnrichedPrompt(agentId, baseTask, supabase)` — injecte les vraies données avant d'appeler l'agent
- **Antoine** : articles publiés, posts sociaux, tokens consommés, coût API estimé (mois courant vs mois précédent)
- **Nathalie** : incidents de sécurité, IPs bloquées, 5 derniers incidents
- **Lucas** : titres des 15 derniers articles (évite les doublons)
- **Maxime** : erreurs dans les logs, 5 dernières erreurs avec détail
- **Sofia** : 3 derniers articles publiés (titre, lien, résumé) + année en cours → génère newsletter sans saisie manuelle
- Utilisé dans orchestration, délégation, et crons finance/security

### Blog automatique — Pipeline complet

#### Cron 1 : `/api/cron/blog` (Lun/Mer/Ven 9h UTC)
1. **Thomas** prépare le contexte (animal par rotation, saison, mois exact, produits Supabase)
   - **Rotation animaux** : `ANIMAL_CATEGORIES[(semaine_ISO * 3 + jourIndex) % 5]` — 3 animaux différents par semaine, combinaisons changeantes chaque semaine. Lundi=0, Mercredi=1, Vendredi=2.
   - **Override manuel** : `?animal=chiens` via le sélecteur CronLauncher (dropdown dans le pipeline "SEO + Blog + Réseaux")
2. **Lucas** choisit le meilleur sujet selon priorité : **1) trending de saison** (préoccupations actuelles Google) → **2) lié aux produits AWIN dispo** (meilleure monétisation) → **3) fallback conseil pratique saisonnier**
3. **Marie** rédige l'article (Haiku 4.5, 1200 tokens, ~400-600 mots, ~10s) → sauvegardé dans Supabase
4. **Image** : téléchargement Pexels par catégorie animale → stockage dans Supabase Storage `blog-images` → mise à jour `image_url` sur l'article
5. Résultat écrit dans `cron_state` (slug, title, excerpt) avec status `article_ready`
6. **Stats Thomas** : tokens = somme Lucas + Marie

#### Cron 2 : `/api/cron/social` (Lun/Mer/Ven 9h30 UTC)
1. Lit `cron_state` pour trouver l'article prêt
2. **Emma** rédige un post Facebook avec le lien EXACT `https://mespoilus.com/blog/[slug]`
3. `save-social-post` récupère l'`image_url` de l'article (déjà stockée dans Supabase Storage)
4. Webhook Make.com → **Facebook + Instagram @mespoilusofficiel** ✅ (testé et confirmé fonctionnel)
5. `cron_state` marqué `done`
6. **Sofia supprimée de ce cron** — elle a son propre cron dédié

#### URL interne (critique)
- `saveSocialPost` dans `runner.ts` utilise `NEXT_PUBLIC_APP_URL` EN PREMIER (domaine custom, sans protection Vercel)
- Ne jamais utiliser `VERCEL_URL` seul pour les fetches internes → retourne 401 (URL hashée protégée)

### Crons automatiques complets (`vercel.json`)

| Route | Fréquence | Heure UTC | Agents | Sauvegarde |
|-------|-----------|-----------|--------|------------|
| `/api/cron/awin-sync` | Tous les jours | 3h00 | — | `products` |
| `/api/cron/blog` | Lun / Mer / Ven | 9h00 | Lucas + Marie | `articles` + Pexels Storage |
| `/api/cron/social` | Lun / Mer / Ven | 9h30 | Emma | `social_posts` + webhook Facebook |
| `/api/cron/finance` | **1er de chaque mois** | 8h00 | Antoine | `financial_reports` |
| `/api/cron/security` | **1er de chaque mois** | 8h00 | Nathalie + Maxime | `security_logs` + `tech_reports` |
| `/api/cron/newsletter` | **Chaque vendredi** | 10h00 | Sofia | `newsletter_campaigns` + envoi Resend |

**Protection anti-doublons :**
- Finance → vérifie si `financial_reports.period` existe déjà pour ce mois → abandon si oui
- Newsletter → vérifie si une campagne `sent` existe dans les 5 derniers jours → abandon si oui

### CronLauncher — Pipelines manuels (Dashboard)

Bouton "🚀 Lancer un cron" → menu déroulant avec 4 pipelines :

| Pipeline | Agents | Ce qui se passe |
|----------|--------|-----------------|
| 📝 SEO + Blog + Réseaux | Lucas → Marie → Emma | Article publié + post Facebook (35s d'attente entre les 2 étapes) |
| 📊 Finance | Antoine | Rapport financier mensuel → `financial_reports` |
| 🛡️ Sécurité & Maintenance | Nathalie + Maxime | Audit sécurité + audit technique → `security_logs` + `tech_reports` |
| 💌 Newsletter | Sofia | Newsletter avec 3 derniers articles → générée + **envoyée automatiquement via Resend** |

**Léa** : pas de cron — répond à la demande sur sa page agent uniquement.

### Images — Architecture

| Usage | Source | Stockage |
|-------|--------|---------|
| Images articles blog | **Pexels API** (`pexels.ts`) | Supabase Storage `blog-images` |
| Images posts sociaux | Même image que l'article (lecture Supabase) | Supabase Storage `blog-images` |
| Hero page accueil | Unsplash `getHeroPhotos()` | Affiché direct (non stocké) |
| Bannières blog/boutique/adoption | Unsplash `getBannerPhotos()` | Affiché direct (non stocké) |
| Photos agents | Unsplash `getPhotoForAgent()` | Affiché direct (non stocké) |

**Pourquoi Pexels pour blog/social :** Unsplash interdit le téléchargement et le stockage serveur (ToS) → 403 Forbidden. Pexels l'autorise explicitement.

**Crédits :** `📷 Photographer / Pexels` sur les articles, `📷 Photographer / Unsplash` sur les pages décoratives.

### Make.com — Réseaux sociaux
- Scénario linéaire : Webhook → **Facebook Pages + Instagram for Business** (@mespoilusofficiel)
- Instagram reconnecté via Meta Business Suite (compte `@mespoilus` banni → nouveau compte `@mespoilusofficiel` lié à la Page Facebook)
- Payload webhook : `{ content (sans hashtags), hashtags (string), image_url (URL Supabase Storage) }`
- `image_url` omis du payload si null → évite les erreurs Make.com `Missing required parameter`

### Post-processing streaming (`src/lib/agents/runner.ts`)

**Architecture :** Vercel Hobby = timeout 10s. Solution : appel à `/api/internal/save-agent-data` (route interne, timeout propre).

- `streamAgentTask` collecte le contenu complet au fil des chunks
- Au `done`, appelle `POST /api/internal/save-agent-data`
- Tokens réels capturés via callback `onComplete` → `stream.finalMessage()`
- URL interne : `NEXT_PUBLIC_APP_URL` en priorité

**Save functions dans `runner.ts` (appelées par `executeAgentTask`) :**

| Agent | Fonction | Table Supabase |
|-------|----------|----------------|
| Marie | `saveMariesArticle` | `articles` |
| Emma | `saveSocialPost` | `social_posts` + webhook Make.com |
| Nathalie | `saveSecurityAnalysis` | `security_logs` |
| Antoine | `saveFinancialReport` | `financial_reports` |
| Sofia | `saveNewsletterDraft` | `newsletter_campaigns` |
| Lucas | `saveSeoReport` | `seo_reports` |
| Maxime | `saveTechReport` | `tech_reports` |
| Léa | `saveSupportLog` | `support_logs` |

**Route `POST /api/internal/save-agent-data`** :
- Marie → strip code fence, parse frontmatter, `getPhotoForCategory` Pexels (4s timeout), upsert `articles`
- Emma → extrait hashtags, cherche image article (slug dans post), fallback Pexels, INSERT `social_posts`, webhook Make.com
- Nathalie → INSERT `security_logs`
- Antoine → INSERT `financial_reports`
- Sofia → parse JSON `{ subject, preview_text, content_html }`, INSERT `newsletter_campaigns` draft
- Toujours : `logActivity` + `updateAgentStats` via `dbFetch` (fetch natif Supabase REST, AbortController 6s)

**Route `POST /api/internal/save-social-post`** :
- Cherche `image_url` sur l'article le plus récent avec image (Supabase)
- Fallback : `getPhotoForCategory` Pexels → stockage dans Supabase Storage
- INSERT `social_posts` (facebook + instagram)
- Webhook Make.com avec `image_url` uniquement si non null

### Blog public (`/blog`)
- Articles sauvegardés automatiquement dans Supabase
- Images stockées dans Supabase Storage `blog-images`
- Filtres par catégorie via `?category=chiens`
- Pages articles avec hero image, rendu Markdown via `marked`
- SEO complet (meta, OG, Twitter Card, Schema.org JSON-LD)
- Sitemap dynamique, robots.txt

### Sécurité
- Rate limiting : 60 req/min global, 10 req/min par agent
- Détection : SQL injection, XSS, path traversal, LFI
- Blocage IP automatique (mémoire + Supabase `blocked_ips`)
- Headers de sécurité sur toutes les routes
- **RLS activé sur les 15 tables** ✅
  - `articles` → policy SELECT `status = 'published'` (lecture publique)
  - `products` → policy SELECT `in_stock = true` (lecture publique)
  - Toutes les autres tables → RLS activé sans policy (accès anon bloqué, service role bypass)
- Les rapports Nathalie/Maxime sont informatifs uniquement — pas de corrections automatiques
- Workflow mensuel : lire les rapports du 1er du mois → appliquer les corrections manuellement
- **Protection temps réel** : c'est le middleware qui bloque les IPs, détecte SQLi/XSS, rate limiting — pas Nathalie
- **Nathalie = auditrice mensuelle** : lit les logs enregistrés par le middleware et formule des recommandations
- **Sécurité compte admin** : mot de passe fort (20+ chars) ✅. MFA nécessiterait du code supplémentaire dans l'app.

### Base de données Supabase (15 tables)
`articles` · `activity_logs` · `security_logs` · `social_posts` · `financial_reports` · `agent_stats` · `blocked_ips` · `newsletter_subscribers` · `newsletter_campaigns` · `adoption_posts` · `products` · `cron_state` · `seo_reports` · `tech_reports` · `support_logs`

**Colonne ajoutée :** `activity_logs.tokens_used INTEGER DEFAULT 0` — migration : `src/lib/supabase/migration_tokens.sql` ✅

#### Colonnes clés `articles`
- `image_url` — URL publique Supabase Storage (ex: `https://xxx.supabase.co/storage/v1/object/public/blog-images/article-slug.jpg`)
- `image_alt`, `image_credit`, `image_credit_url` — attribution photographe Pexels
- `categories TEXT[]` — multi-catégories (array containment Supabase `@>`)

#### Table `cron_state`
- `slug`, `title`, `excerpt`, `status` (`article_ready` → `done`)
- Permet de transmettre les infos article entre cron blog (9h) et cron social (9h30)

#### Supabase Storage
- Bucket `blog-images` : **public**, upsert activé — images articles
- Bucket `adoption-photos` : **public**, limite 5 Mo — photos annonces adoption

#### Fichiers SQL
| Fichier | Description |
|---------|-------------|
| `src/lib/supabase/schema.sql` | Schéma initial complet |
| `src/lib/supabase/migration_complete.sql` | Migration si schéma initial déjà appliqué |
| `src/lib/supabase/migration_categories.sql` | Colonne `categories TEXT[]` |
| `src/lib/supabase/migration_newsletter.sql` | Tables newsletter |
| `src/lib/supabase/migration_adoption.sql` | Table `adoption_posts` |
| `src/lib/supabase/migration_products.sql` | Table `products` (après clés Awin) |
| `src/lib/supabase/migration_cron_state.sql` | Table `cron_state` |
| `src/lib/supabase/migration_blog_images.sql` | Policies bucket `blog-images` |
| `src/lib/supabase/migration_agent_reports.sql` | Tables `seo_reports`, `tech_reports`, `support_logs` ✅ |

### Newsletter (Sofia)
- `src/lib/resend.ts` — client Resend via fetch natif
- Sofia génère HTML en JSON `{ subject, preview_text, content_html }`, sauvegardé en `draft`
- Cron automatique : **chaque vendredi à 10h UTC** via `/api/cron/newsletter`
  1. Sofia génère le contenu → sauvegardé en `newsletter_campaigns` (draft)
  2. Récupère tous les abonnés `newsletter_subscribers` actifs
  3. Envoie via Resend à chaque abonné avec lien désabonnement unique
  4. Marque la campagne `sent`
- Lien désabonnement : `/api/newsletter/unsubscribe?t=<base64url(email)>` → page `/newsletter/unsubscribe`
- Année copyright injectée dynamiquement dans le prompt Sofia
- Protection anti-doublons : skip si campagne envoyée dans les 5 derniers jours

### Adoption animaux (`/adoption`)
- Filtres par type d'animal, bannière Unsplash dynamique
- Formulaire de dépôt avec upload photos (2-5 photos, Supabase Storage)
- Page modération admin avec approve/reject + emails automatiques Resend
- Emails : soumission (client + admin), approbation (client), refus (client)

### Boutique (`/boutique`) — Architecture Awin
- Filtres par catégorie, bannière Unsplash dynamique
- `ProductCard` blanc avec lien affilié `rel="sponsored"`
- Cron sync Awin quotidien 3h UTC
- Disclaimer affiliation barre fixe en bas (bg-white/95)

### Section Partenaires (`PartenairesSection.tsx`)
- Composant landing page — section "Nos recommandations" placée entre Catégories et Newsletter
- Interface `Partenaire` : `pays: string[]` (codes ISO : FR, BE, CA, US…), `network: 'awin' | 'cj'`
- Drapeaux emoji via `FLAGS` record (pas d'img externe)
- Partenaire actuel : **Dogfy Diet** (Awin, FR, chiens, nutrition fraîche)
- En attente CJ.com : Canada Pet Care, EntirelyPets (CA/US) — à ajouter quand confirmés
- Bannières promotionnelles Awin déconseillées (codes expirables) → utiliser le lien affilié stable

### Google Analytics & AdSense
- GA `G-QE9XSS18YQ` — chargement conditionnel RGPD
- AdSense `ca-pub-3549294158319032` — en attente approbation
- Emplacements : blog liste, blog article, adoption, accueil

### SEO & Indexation
- Sitemap dynamique, robots.txt, Schema.org JSON-LD
- Google Search Console vérifié + sitemap soumis
- Bing Webmaster Tools vérifié + sitemap soumis

### next.config.mjs
- `remotePatterns` : `images.unsplash.com` + `images.pexels.com` + `*.supabase.co`

### Déploiement
- Repo GitHub : `BauwensThomas/mespoilus`
- CI/CD : Vercel — déploiement automatique sur push `main`
- Git author : `Bauwens Thomas <contact@mespoilus.com>`

---

## Actions manuelles restantes

Aucune action manuelle bloquante en cours.

### Actions déjà effectuées ✅
- Site public (blog, adoption, boutique, pages légales) : thème clair `bg-gray-50`, cartes blanches `bg-white`, texte sombre
- PartenairesSection : Dogfy Diet (Awin FR) avec drapeaux emoji, interface prête pour CJ.com
- Filtre OR `category.eq + categories.cs` appliqué sur blog/page.tsx ET _category-page.tsx
- Adresse `contact@mespoilus.com` créée dans panel LWS
- Clés Awin obtenues et configurées dans Vercel + sync automatique opérationnel
- Compte Resend créé + `RESEND_API_KEY` configuré
- Utilisateur admin créé dans Supabase Auth (`contact@mespoilus.com`)
- Toutes les migrations SQL exécutées (adoption, categories, newsletter, cron_state, blog_images, **agent_reports**)
- Bucket `blog-images` créé dans Supabase Storage (public, upsert)
- Bucket `adoption-photos` créé dans Supabase Storage (public, 5 Mo max)
- Variables d'environnement dans Vercel (`NEXT_PUBLIC_APP_URL`, `PEXELS_API_KEY`, etc.)
- Google Analytics intégré (consent-gated)
- Google Search Console + Bing Webmaster Tools vérifiés + sitemaps soumis
- Pipeline blog complet opérationnel : Lucas → Marie → Pexels image → Supabase Storage → article
- Pipeline social opérationnel : Emma → save-social-post → image Supabase → webhook → Facebook + Instagram ✅
- Instagram `@mespoilusofficiel` créé, lié à la Page Facebook via Meta Business Suite, connecté Make.com ✅ (posts reçus confirmés)
- Rotation animaux cron blog : 3 animaux différents par semaine via formule `(semaine * 3 + jourIndex) % 5`
- CronLauncher : dropdown pour forcer un animal spécifique sur le pipeline "SEO + Blog + Réseaux"
- Emma passée sur **Haiku 4.5** + lien article complet dans les posts
- Marie passée sur **Haiku 4.5 + 1200 tokens** (~10s, compatible Vercel Hobby)
- Dashboard auto-refresh 30s, score calculé dynamiquement, tokens Thomas = pipeline cron
- Orchestration connectée au vrai pipeline (article publié + post Facebook réels)
- Délégation automatique Thomas sur chaque page agent
- 4 pipelines manuels dans CronLauncher (Finance, Sécurité, Newsletter, Blog+Social)
- Crons automatiques Finance (1/mois), Sécurité (1/mois), Newsletter (vendredi) configurés dans `vercel.json`
- Save functions pour tous les agents (Lucas → seo_reports, Maxime → tech_reports, Léa → support_logs)
- Contexte Supabase réel injecté dans prompts Antoine/Nathalie/Lucas/Maxime
- Newsletter envoi automatique via Resend avec lien désabonnement unique par abonné
- RLS activé sur les 15 tables Supabase (articles et products avec policies publiques)
- Protection anti-doublons sur finance (par mois) et newsletter (5 jours)
- Logs crons sans doublons (agent_id = 'thomas' pour les logs cron, agent propre pour runner.ts)
- Images Pexels variées : titre article + page aléatoire pour éviter photos identiques
- Stats mensuelles dashboard : total + ce mois sur cards globales et cards agents
- Stats mensuelles pages agents : tâches complétées/échouées + tokens avec comparaison ce mois
- Antoine : contexte mois courant vs mois précédent (tokens, coûts, tâches, articles)
- `activity_logs.tokens_used` : colonne créée ✅ (migration exécutée dans Supabase)
- Léa : mode manuel uniquement (pas d'intégration email automatique prévue)
- Footer page accueil : lien Admin supprimé, TikTok supprimé, Facebook lié (https://www.facebook.com/profile.php?id=61589487954538) + Instagram lié (https://www.instagram.com/mespoilusofficiel)
- Lucas cron blog : priorité sujets trending > AWIN affiliés > fallback saisonnier
- Dashboard totaux : calculés depuis `activity_logs` (même source que mensuels) pour cohérence garantie
- Cron social log : label corrigé (était "Emma + Sofia terminés", maintenant "Emma terminée")
- Thomas tokens : logs crons blog/finance/security/newsletter sauvegardent `tokens_used` dans `activity_logs`
- Sofia mode manuel : reçoit les 3 derniers articles via `buildEnrichedPrompt` (même comportement que le cron)
- Boutique : barre de recherche produits par nom/description (`BoutiqueSearchBar.tsx`)
- Descriptions agents corrigées pour refléter leurs vraies tâches (Nathalie, Emma, Lucas, Marie, Léa, Maxime, Antoine, Sofia, Thomas)
- Sofia mode manuel : génère + envoie la newsletter directement via Resend (anti-doublon 5 jours actif)
- Sofia : reçoit `image_url` des articles et les inclut comme `<img>` dans le HTML de la newsletter
- Emma enrichie : reçoit le dernier article publié automatiquement en mode manuel
- Hints visuels ajoutés sur les pages Marie, Lucas, Léa pour guider la saisie
- Thème admin : couleurs grises remplacées par bleu navy cohérent avec le site public
- Rotation animaux cron blog : 3 animaux différents par semaine, combinaisons changeantes (`semaine*3 + jourIndex) % 5`)
- CronLauncher : dropdown pour forcer un animal spécifique (override de la rotation automatique)
- Instagram `@mespoilusofficiel` connecté Make.com, posts Facebook+Instagram confirmés fonctionnels
- Mode jour/nuit/auto (next-themes) : toggle dans header public + admin sidebar, CSS variables, `ThemeToggle.tsx`
- Filtres catégories blog : OR sur `category` ET `categories[]` — articles visibles sur toutes les pages catégories
- Barres de recherche blog + boutique : fond `bg-gray-700` (gris visible) au lieu de noir/navy

---

## Ce qui reste à faire (code)

### Site public
- Pages catégories animaux
- Moteur de recherche d'articles

### Boutique / Monétisation
- Vérifier que les produits Awin s'affichent correctement sur `/boutique` — **en attente validation affiliation Awin**
- Barre de recherche produits ajoutée (`?search=mot`) — filtre par nom et description via `ilike`

### Marketing
- Stratégie backlinks francophones
- Lucas : connexion API volume mots-clés (Ahrefs, Semrush)

### Infrastructure
- Redis (Upstash) pour rate limiting distribué
- Monitoring erreurs (Sentry)
- Backups Supabase automatisés
