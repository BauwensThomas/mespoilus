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

**Animaux couverts :** chiens, chats, oiseaux, rongeurs, reptiles. Catégorie `general` pour articles transversaux.

**Budget de démarrage :** 500 €

**Objectif revenus mois 3 :** 200 – 500 €/mois

---

## Les 9 agents IA

Chaque agent utilise l'API Anthropic (Claude) et fonctionne de façon autonome. Thomas orchestre les autres.

| Agent | Rôle | Modèle Claude | maxTokens | Responsabilités |
|-------|------|--------------|-----------|-----------------|
| 👔 **Thomas** | CEO Orchestrateur | Opus 4.7 | 3000 | Stratégie globale, priorisation, coordination, rapports |
| ✍️ **Marie** | Rédactrice de contenu | **Haiku 4.5** | **1800** | Articles de blog (550-700 mots), guides pratiques, conseils |
| 🔍 **Lucas** | Spécialiste SEO | Sonnet 4.6 | **1200** | Recherche mots-clés, optimisation on-page, stratégie francophone |
| 📱 **Emma** | Réseaux sociaux | Haiku 4.5 | 2000 | Posts Facebook + Instagram (@mespoilusofficiel), hashtags, lien article complet |
| 💻 **Maxime** | Développeur & Maintenance | Sonnet 4.6 | 6000 | Performances, bugs, Next.js / Supabase, Core Web Vitals |
| 💬 **Léa** | Support client | Haiku 4.5 | 3000 | Réponses emails clients, commandes, FAQ -à la demande uniquement (pas de cron) |
| 📊 **Antoine** | Finance | Sonnet 4.6 | 4000 | Revenus €, marges, rapports financiers, projections |
| 🛡️ **Nathalie** | Sécurité | Sonnet 4.6 | 4000 | Détection intrusions, blocage IPs, audits, alertes |
| 💌 **Sofia** | Newsletter | Sonnet 4.6 | 4000 | Newsletter hebdomadaire, sélection articles, envoi Resend |

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Style | Tailwind CSS -thème clair public `bg-gray-50`, admin clair `bg-white/bg-gray-50` |
| Base de données | Supabase (PostgreSQL) |
| IA | API Anthropic -Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5 |
| Images blog/social | **Pexels API** (téléchargement + stockage autorisés, 200 req/h gratuit) |
| Images hero & catégories | **Supabase table `hero_photos`** -rotation round-robin via `last_used_at`, `revalidate = 3600` |
| Images agents (pages `/agents/[agent]`) | Unsplash API -affichage uniquement, non stockées |
| Stockage images | Supabase Storage `blog-images` (articles) + `hero-photos` (hero & catégories) |
| Sécurité | Middleware Edge : rate limiting, détection SQLi/XSS, blocage IP |
| Déploiement | Vercel (crons configurés dans `vercel.json`) |
| Affiliation | Awin (EU) + Amazon Associates FR (en cours, catégorie Livres) + CJ.com (CA/US, en attente confirmation) |

### Variables d'environnement requises
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UNSPLASH_ACCESS_KEY # Images décoratives site public uniquement
PEXELS_API_KEY # Images articles blog + réseaux sociaux
CSRF_SECRET
RESEND_API_KEY
AWIN_PUBLISHER_ID
AWIN_API_TOKEN
AWIN_FEED_TOKEN # Token Darwin CSV feeds Awin (même valeur que AWIN_API_TOKEN possible)
CRON_SECRET
MAKE_WEBHOOK_URL # Webhook Make.com -Facebook + Instagram (@mespoilusofficiel)
NEXT_PUBLIC_APP_URL # Ex: https://www.mespoilus.com (OBLIGATOIRE pour fetches internes Vercel)
NEXT_PUBLIC_ADSENSE_ENABLED # 'true' une fois AdSense approuvé (actuellement 'false')

---
## Ce qui est fait
### Landing page publique (`/`)
- **Design clair et chaleureux** (bg-gray-50, blanc, beige, tons ambrés)
- Hero split : texte à gauche (52%), **4 photos depuis Supabase `hero_photos`** à droite en grille décalée (chien, chat, oiseau, rongeur) -rotation round-robin via `last_used_at`, `revalidate = 3600`, fallback dégradé coloré si pas de photo
- Nav : logo à gauche (PawPrint Lucide blanc sur fond orange), liens Blog / Adoption / Newsletter au centre, bouton Boutique (orange) à droite
- Section "Derniers articles" : 3 derniers articles de Marie avec cards
- **Section catégories "Par type d'animal"** : 5 catégories avec photos depuis **même table `hero_photos`** (1 photo aléatoire par `animal_type`), fallback dégradé coloré -lien vers `/blog/{catégorie}`
- Section newsletter `py-10` (réduit depuis py-20) avec formulaire email (client component `NewsletterForm.tsx`)
- Footer compact : `pt-8 pb-5`, grille 4 cols, liens `space-y-0.5`, titres `mb-1` -navigation, mentions légales, Instagram + Facebook, **pas de lien Admin ni TikTok**
- Bloc AdSense entre newsletter et footer : sans padding vertical (vide jusqu'à approbation AdSense)
- `revalidate = 3600`
### Authentification admin (Supabase Auth)
- **Middleware** `src/middleware.ts` -protège `/dashboard`, `/agents/*`, `/orchestrate`, `/moderation` etc.
- Routes admin sans session → redirect `/login?redirect=...`
- API routes sans session → `401 Unauthorized`
- **Page login** `src/app/login/page.tsx` -fond blanc clair, formulaire clair
- `src/app/login/actions.ts` -server action `signIn` via `supabase.auth.signInWithPassword`
- `src/app/actions/auth.ts` -server action `logout`
### Routes et layout
- `src/app/layout.tsx` -minimal, utilise `LayoutShell` + `CookieBanner` + `GoogleAnalytics`
- `src/components/layout/LayoutShell.tsx` -Client Component :
  - **Admin** → Sidebar (`isOpen`/`onToggle` props) + main (`ml-64` ou `ml-0` avec transition 300ms selon état sidebar)
  - **Public** → PublicHeader (`h-20`, visible partout) + `PartenairesBandeau` (sticky `top-20 z-30 h-9`) + main
- **`PartenairesBandeau`** (dans `LayoutShell.tsx`) : bande partenaire sticky sous le header public
  - Affiche 1 partenaire aléatoire au chargement : label "Partenaire", nom, drapeaux pays, tag coloré, description tronquée, flèche `→`
  - `bg-white/95 backdrop-blur border-b border-gray-100`, centré, `z-30`
- Dashboard admin : `src/app/(admin)/dashboard/page.tsx`
### Thème visuel -Conversion au THÈME CLAIR complet ✅
- **Site public** : `bg-gray-50`, cards `bg-white`, texte `text-gray-900`, borders `border-gray-200/300`
- **Admin** : fond `bg-white`, main area `bg-gray-50`, sidebar `bg-white` avec borders `border-gray-200`, accents orange
- **Composants admin convertis au clair** : `globals.css` (`.card`, `.card-hover`), `AgentCard.tsx`, `GlobalStats.tsx`, `ActivityFeed.tsx`, `CronLauncher.tsx`, `dashboard/page.tsx`, `moderation/page.tsx`, `AgentPage.tsx` -tous les `bg-[#1e2a3a]`, `bg-[#111827]`, `border-[#2a3a4a]` éliminés
- **Blog articles** : `bg-gray-50`, texte `text-gray-900`, `.article-content` CSS clair pour prose
- **Header** : `bg-white/95 backdrop-blur`, hauteur **fixe `h-20`** (80px) sur toutes les pages pour cohérence
- **Admin sidebar** : `bg-white`, nav items clairs, active items `bg-orange-100 text-orange-700`
### Header fixe - Hauteur cohérente ✅
- PublicHeader : `h-20` fixe + `flex items-center h-full` pour centrage vertical
- Hauteur identique sur toutes les pages (landing, blog, boutique, adoption, pages admin)
- PublicHeader visible sur TOUTES les pages (y compris la homepage -`if pathname === '/'` supprimé)
### Bannières catégories -Illustrations SVG animales ✅
- **Remplacement images** : remplacées par des illustrations SVG custom
- **Chiens** : famille de chiens simple
- **Chats** : chat assis
- **Oiseaux** : oiseau en vol
- **Rongeurs** : lapin avec oreilles
- **Reptiles** : serpent ondulant
- Opacité 20% pour effet discret
- Fond dégradé orange cohérent
### Images articles blog -Featured images améliorées ✅
- Hauteur **`h-56`** pour articles "à la une" (au lieu de h-48)
- Ajout `object-center` pour centrage optimal
- Meilleure visibilité des animaux dans les images
### Boutique -Carousel partenaires repositionné ✅
- **Position fixe en haut à droite** (`fixed top-24 right-6 z-30`)
- Header remain cohérent avec autres pages
- Carousel flotte sans affecter le layout
### Filtres blog -OR sur category ET categories[]
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
- **CronLauncher** : menu déroulant `w-96` avec 5 pipelines manuels, textes `text-sm`/`text-xs` lisibles
- **Typographie admin agrandie** : titres sections `text-base`, valeurs stats `text-2xl`, descriptions `text-sm`, labels `text-sm` -plus aucun `text-[9px]`/`text-[10px]` dans les composants dashboard
- `revalidate = 30`
### Pages agents (`/agents/[agent]`)
- Photo ambiante Unsplash en hero (fallback SVG thématique)
- Zone de saisie de tâche avec **streaming en temps réel** de la réponse Claude
- Tâches rapides préconfigurées par agent
- **Historique des activités** : collapsible (fermé par défaut), filtre par date (`<input type="date">`), cliquable (Marie → article, autres → accordéon contenu)
- **Stats : tâches complétées/échouées + tokens -total all-time + ce mois en ambré**
- **Délégation automatique via Thomas** : après chaque réponse, Thomas analyse et délègue si nécessaire (voir section Délégation)
- **Panneau Emma (post direct)** : upload photo + instructions → `POST /api/admin/emma-direct` → Emma génère + webhook Make.com (sans créer d'article blog)
- **Panneau Sofia (newsletter manuelle)** : choix destinataire (admin test / tous abonnés) + envoi immédiat, bypass anti-doublon 5 jours
- **Toggle Marie "Publier sur les réseaux"** : après génération article, appelle Emma via `/api/admin/emma-direct` avec slug+titre+image
- **Upload image Marie** : zone drag-and-drop sous la textarea, stocke dans Supabase Storage `blog-images`, image utilisée dans l'article (au lieu de Pexels) + transmise à Emma si toggle réseaux ON
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
- `buildEnrichedPrompt(agentId, baseTask, supabase)` -injecte les vraies données avant d'appeler l'agent
- **Antoine** : articles publiés, posts sociaux, tokens consommés, coût API estimé (mois courant vs mois précédent)
- **Nathalie** : incidents de sécurité, IPs bloquées, 5 derniers incidents
- **Lucas** : titres des 15 derniers articles (évite les doublons)
- **Maxime** : erreurs dans les logs, 5 dernières erreurs avec détail
- **Sofia** : 3 derniers articles publiés (titre, lien, résumé) + année en cours → génère newsletter sans saisie manuelle
- Utilisé dans orchestration, délégation, et crons finance/security
### Blog automatique -Pipeline complet
#### Cron 1 : `/api/cron/blog` (Lun/Mer/Ven 9h UTC)
1. **Thomas** prépare le contexte (animal par rotation, saison, mois, produits Supabase, 3 articles récents même catégorie)
   - **Rotation animaux** : `ANIMAL_CATEGORIES[(semaine_ISO * 3 + jourIndex) % 5]` -3 animaux différents par semaine. Lundi=0, Mercredi=1, Vendredi=2.
   - **Override manuel** : `?animal=chiens` via le sélecteur CronLauncher
2. **Lucas** choisit le sujet selon le **type d'article** (rotation forcée ou override manuel) :
   - **Rotation type** : `(semaine*3+jourIndex) % 3` → trending → affiliation → pratique → ...
   - **trending** : sujet activement recherché sur Google (hors saisonniers génériques)
   - **affiliation** : article centré sur un partenaire ou produit Awin avec lien affilié exact ; anti-répétition 30 articles via colonne `featured_partner`
   - **pratique** : guide concret et actionnable ; fallback si affiliation impossible (tous bloqués + aucun produit dispo)
   - Retourne : SUJET, MOTS_CLES, INTENTION, RAISON, NOM_PRODUIT, LIEN_AFFILIE, IMAGE_PRODUIT, META_DESC
3. **Marie** rédige l'article (Haiku 4.5, **1400 tokens**, **550-700 mots**, ~12s) → sauvegardé dans Supabase
   - Reçoit : sujet + mots-clés + intention + raison + meta description cible + 3 articles récents pour liens internes
   - Saison injectée uniquement pour trending et pratique (pas pour affiliation → évite "printemps printemps")
   - Temps de lecture recalculé dynamiquement après génération (`wordCount ÷ 250`, min 1)
4. **Image** : image produit Awin (téléchargée → Supabase Storage) si affiliation, sinon Pexels → `blog-images`
5. Résultat écrit dans `cron_state` (slug, title, excerpt) avec status `article_ready`
6. **Stats Thomas** : tokens = somme Lucas + Marie
#### Cron 2 : `/api/cron/social` (Lun/Mer/Ven 9h30 UTC)
1. Lit `cron_state` pour trouver l'article prêt
2. **Emma** rédige un post Facebook avec le lien EXACT `https://mespoilus.com/blog/[slug]`
3. `save-social-post` récupère l'`image_url` de l'article (déjà stockée dans Supabase Storage)
4. Webhook Make.com → **Facebook + Instagram @mespoilusofficiel** ✅ (testé et confirmé fonctionnel)
5. `cron_state` marqué `done`
6. **Sofia supprimée de ce cron** -elle a son propre cron dédié
#### URL interne (critique)
- `saveSocialPost` dans `runner.ts` utilise `NEXT_PUBLIC_APP_URL` EN PREMIER (domaine custom, sans protection Vercel)
- Ne jamais utiliser `VERCEL_URL` seul pour les fetches internes → retourne 401 (URL hashée protégée)
### Crons automatiques complets (`vercel.json`)
| Route | Fréquence | Heure UTC | Agents | Sauvegarde |
|-------|-----------|-----------|--------|------------|
| `/api/cron/awin-sync/chiens` | Tous les jours | 2h00 | -| `products` |
| `/api/cron/awin-sync/chats` | Tous les jours | 2h20 | -| `products` |
| `/api/cron/awin-sync/oiseaux` | Tous les jours | 2h40 | -| `products` |
| `/api/cron/awin-sync/rongeurs` | Tous les jours | 3h00 | -| `products` |
| `/api/cron/awin-sync/reptiles` | Tous les jours | 3h20 | -| `products` |
| `/api/cron/awin-sync/livres` | Tous les jours | 3h40 | -| `products` |
| `/api/cron/awin-sync/general` | Tous les jours | 4h00 | -| `products` |
| `/api/cron/blog` | Lun / Mer / Ven | 9h00 | Lucas + Marie | `articles` + Pexels Storage |
| `/api/cron/social` | Lun / Mer / Ven | 9h30 | Emma | `social_posts` + webhook Facebook |
| `/api/cron/finance` | **1er de chaque mois** | 8h00 | Antoine | `financial_reports` |
| `/api/cron/security` | **1er de chaque mois** | 8h00 | Nathalie + Maxime | `security_logs` + `tech_reports` |
| `/api/cron/newsletter` | **Chaque vendredi** | 10h00 | Sofia | `newsletter_campaigns` + envoi Resend |
| `/api/cron/prenoms` | **1er de chaque mois** | 7h00 | Thomas (Haiku) | `prenoms` (DELETE + INSERT, 5 animaux × 4 styles × 50 noms) |
**Protection anti-doublons :**
- Finance → vérifie si `financial_reports.period` existe déjà pour ce mois → abandon si oui
- Newsletter → vérifie si une campagne `sent` existe dans les 5 derniers jours → abandon si oui
### CronLauncher -Pipelines manuels (Dashboard)
Bouton "🚀 Lancer un cron" → menu déroulant avec 4 pipelines :
- **Sélecteur animal** : forcer un animal spécifique (chiens, chats, oiseaux, rongeurs, reptiles) ou Auto
- **Sélecteur type article** : Auto (rotation), Trending, Partenaire/Produit, Conseil pratique
| Pipeline | Agents | Ce qui se passe |
|----------|--------|-----------------|
| 📝 SEO + Blog + Réseaux | Lucas → Marie → Emma | Article publié + post Facebook (35s d'attente entre les 2 étapes) |
| 📊 Finance | Antoine | Rapport financier mensuel → `financial_reports` |
| 🛡️ Sécurité & Maintenance | Nathalie + Maxime | Audit sécurité + audit technique → `security_logs` + `tech_reports` |
| 💌 Newsletter | Sofia | Newsletter avec 3 derniers articles → générée + **envoyée automatiquement via Resend** |
**Léa** : pas de cron -répond à la demande sur sa page agent uniquement.
### Images -Architecture
| Usage | Source | Stockage |
|-------|--------|---------|
| Images articles blog | **Pexels API** (`pexels.ts`) | Supabase Storage `blog-images` |
| Images posts sociaux | Même image que l'article (lecture Supabase) | Supabase Storage `blog-images` |
| Hero page accueil (4 cases) | **Supabase `hero_photos`** -round-robin `last_used_at` | Supabase Storage `hero-photos` |
| Catégories "Par type d'animal" | **Supabase `hero_photos`** -1 photo aléatoire par `animal_type` | Supabase Storage `hero-photos` |
| Photos agents (pages `/agents/[agent]`) | Unsplash `getPhotoForAgent()` | Affiché direct (non stocké) |
**Pourquoi Pexels pour blog/social :** Unsplash interdit le téléchargement et le stockage serveur (ToS) → 403 Forbidden. Pexels l'autorise explicitement.
**Pourquoi Supabase pour hero/catégories :** contrôle total, rotation automatique, pas de dépendance externe, API transformation Supabase NON disponible sur plan gratuit → utiliser URLs directes `/object/public/`.
**Crédits :** `📷 Photographer / Pexels` sur les articles.
### Make.com -Réseaux sociaux
- Scénario linéaire : Webhook → **Facebook Pages + Instagram for Business** (@mespoilusofficiel)
- Instagram reconnecté via Meta Business Suite (compte `@mespoilus` banni → nouveau compte `@mespoilusofficiel` lié à la Page Facebook)
- Payload webhook : `{ content (sans hashtags), hashtags (string), image_url (URL Supabase Storage) }`
- `image_url` omis du payload si null → évite les erreurs Make.com `Missing required parameter`
### Post-processing streaming (`src/lib/agents/runner.ts`)
**Architecture :** Vercel Hobby = timeout 60s (`maxDuration = 60` configuré sur toutes les routes cron). Solution streaming : appel à `/api/internal/save-agent-data` (route interne, timeout propre).
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
- Marie → strip code fence, parse frontmatter, **anti-doublon** (vérifie slug existant avant INSERT), si `overrideImageUrl` fourni utilise cette image (sinon `getPhotoForCategory` Pexels 4s timeout), upsert `articles`
- Emma → extrait hashtags, cherche image article (slug dans post), fallback Pexels, INSERT `social_posts`, webhook Make.com
- Nathalie → INSERT `security_logs`
- Antoine → INSERT `financial_reports`
- Sofia → parse JSON `{ subject, preview_text, content_html }`, INSERT `newsletter_campaigns` draft
- Toujours : `logActivity` + `updateAgentStats` via `dbFetch` (fetch natif Supabase REST, AbortController 6s)
**Route `POST /api/admin/emma-direct`** :
- Auth session requise
- Body : `{ instructions: string, imageUrl?: string }`
- Appelle `executeAgentTask('emma', prompt)` (non-streaming)
- Envoie au webhook Make.com avec `imageUrl` fourni (prioritaire sur l'image auto)

**Route `POST /api/admin/upload-image`** :
- Auth session requise
- FormData avec `file` (image)
- Upload dans Supabase Storage `blog-images` sous le nom `social-{timestamp}.ext`
- Retourne `{ url: string }` (URL publique)

**Route `POST /api/internal/save-social-post`** :
- Cherche `image_url` sur l'article le plus récent avec image (Supabase)
- **Filtre URL** : n'utilise que les URLs commençant par `NEXT_PUBLIC_SUPABASE_URL` (Supabase Storage) → rejette les CDN externes (Awin, etc.) que Instagram refuse
- Fallback : `getPhotoForCategory` Pexels → stockage dans Supabase Storage
- INSERT `social_posts` (facebook + instagram)
- Webhook Make.com avec `image_url` uniquement si non null
### Blog public (`/blog`)
- Articles sauvegardés automatiquement dans Supabase
- Images stockées dans Supabase Storage `blog-images`
- Filtres par catégorie : chiens, chats, oiseaux, rongeurs, reptiles, **general** (+ page `/blog/general` avec métadonnées SEO)
- Catégorie `general` : articles transversaux, boutique, sujets multi-animaux
- **Pages articles (`/blog/[slug]`) : thème clair** (`bg-gray-50`, texte `#111827`) -prose Tailwind light + `.article-content` CSS light dans `globals.css`
- Liens articles : soulignés en ambré (`text-decoration: underline`, `text-underline-offset: 3px`) via `.article-content a` dans `globals.css`
- Hero image + gradient overlay + crédit photographe Pexels cliquable
- SEO complet (meta, OG, Twitter Card, Schema.org JSON-LD)
- Sitemap dynamique, robots.txt
### Sécurité
- Rate limiting : 60 req/min global, 10 req/min par agent
- Détection : SQL injection, XSS, path traversal, LFI
- Blocage IP automatique (mémoire + Supabase `blocked_ips`)
- Headers de sécurité sur toutes les routes
- **RLS activé sur les 15 tables** ✅
  - `articles` → policy SELECT `status = 'published'` (lecture publique)
  - `products` → policy SELECT `true` (lecture publique totale — colonne `in_stock` supprimée)
  - Toutes les autres tables → RLS activé sans policy (accès anon bloqué, service role bypass)
- Les rapports Nathalie/Maxime sont informatifs uniquement -pas de corrections automatiques
- Workflow mensuel : lire les rapports du 1er du mois → appliquer les corrections manuellement
- **Protection temps réel** : c'est le middleware qui bloque les IPs, détecte SQLi/XSS, rate limiting -pas Nathalie
- **Nathalie = auditrice mensuelle** : lit les logs enregistrés par le middleware et formule des recommandations
- **Sécurité compte admin** : mot de passe fort (20+ chars) ✅. MFA nécessiterait du code supplémentaire dans l'app.
### Base de données Supabase (16 tables)
`articles` · `activity_logs` · `security_logs` · `social_posts` · `financial_reports` · `agent_stats` · `blocked_ips` · `newsletter_subscribers` · `newsletter_campaigns` · `adoption_posts` · `products` · `cron_state` · `seo_reports` · `tech_reports` · `support_logs` · `hero_photos` · `prenoms` · `pdf_guides` · `pdf_downloads` · `pdf_consents`
**Colonne ajoutée :** `activity_logs.tokens_used INTEGER DEFAULT 0` -migration : `src/lib/supabase/migration_tokens.sql` ✅
#### Colonnes clés `articles`
- `image_url` -URL publique Supabase Storage (ex: `https://xxx.supabase.co/storage/v1/object/public/blog-images/article-slug.jpg`)
- `image_alt`, `image_credit`, `image_credit_url` -attribution photographe Pexels
- `categories TEXT[]` -multi-catégories (array containment Supabase `@>`)
#### Table `hero_photos`
- `id`, `url` (URL publique Supabase Storage), `alt`, `animal_type` (singulier ou pluriel -normalisé via `ANIMAL_TYPE_MAP`), `active`, `last_used_at`, `created_at`
- RLS : SELECT public sur `active = true` uniquement
- Photos organisées en sous-dossiers dans le bucket `hero-photos` (ex: `chiens/photo1.jpg`)
- Rotation round-robin : photo la moins récemment utilisée choisie par `last_used_at ASC NULLS FIRST`
- `revalidate = 3600` : DB write 1×/heure max (pas à chaque visiteur)
#### Table `cron_state`
- `slug`, `title`, `excerpt`, `status` (`article_ready` → `done`)
- Permet de transmettre les infos article entre cron blog (9h) et cron social (9h30)
#### Supabase Storage
- Bucket `blog-images` : **public**, upsert activé -images articles
- Bucket `hero-photos` : **public** -photos hero & catégories, organisées en sous-dossiers par animal_type
- Bucket `adoption-photos` : **public**, limite 5 Mo -photos annonces adoption
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
| `src/lib/supabase/migration_featured_partner.sql` | Colonne `featured_partner TEXT` sur `articles` -anti-répétition partenaires 30 articles ✅ |
| `src/lib/supabase/migration_awin_categories.sql` | Colonne `categories TEXT[]` sur `products` + GIN index (⚠️ à exécuter) |
| `src/lib/supabase/migration_drop_in_stock.sql` | Supprime colonne `in_stock` de `products` + RLS `USING (true)` ✅ |
| `src/lib/supabase/migration_rls_awin_progress.sql` | RLS sur `awin_sync_progress` (⚠️ à exécuter) |
### Newsletter (Sofia)
- `src/lib/resend.ts` -client Resend via fetch natif
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
- **Thème clair** (`bg-gray-50`, formulaire `bg-white`)
- Filtres par type d'animal, bannière Unsplash dynamique
- **Barre de recherche** (`AdoptionSearchBar.tsx`) : recherche par race, description, région (`?q=mot`)
- `getPosts` accepte `search` → filtre `breed.ilike + description.ilike + region.ilike`
- Formulaire de dépôt avec upload photos (2-5 photos, Supabase Storage)
- Page `/adoption/deposer` : thème clair (inputs `bg-white`, labels `text-gray-800`)
- Page modération admin avec approve/reject + emails automatiques Resend
- Emails : soumission (client + admin), approbation (client), refus (client)
### Blog (`/blog`) et Boutique (`/boutique`) -Harmonisation bannières ✅
- Header `text-3xl`, layout `py-6 space-y-5`, filtres pills `px-3 py-1.5`
- Bannière catégorie : `h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900` (même style que les pages catégories)
- **Suppression Unsplash** des deux pages (plus aucune dépendance Unsplash sur `/blog` et `/boutique`)
- **Boutique** : `BoutiquePartenairesCarousel` supprimé -partenaires gérés uniquement via `PartenairesBandeau` dans LayoutShell
### Boutique (`/boutique`) -Architecture Awin
- **Thème clair** (`bg-gray-50`, cards `bg-white`)
- Filtres par catégorie (chiens, chats, oiseaux, rongeurs, reptiles, **livres**), barre de recherche, disclaimer affiliation barre fixe en bas
- **Pagination** : 48 produits/page, param `?page=N`, compte exact via requête Supabase parallèle `{ count: 'exact', head: true }`
- **Tri client** : `BoutiqueSortSelect.tsx` (select) avec 4 options via param `?sort=` : `stock` (dispo en premier + prix asc, défaut), `price_asc`, `price_desc`, `name_asc`
- **Filtre admin affilié** : panel amber visible uniquement si session admin connectée -liste des marchands par catégorie, param `?affiliate=Merchant+Name`
- `ProductCard` : image `unoptimized` (CDN Awin externe), nom, description, prix + devise, drapeau marchand, bouton "Voir" (orange). Pas de filtre ni badge stock — tous les produits sont affichés
- **Drapeaux** via `flagcdn.com` : table override `MERCHANT_COUNTRY` pour cas connus (ex: `'tuft & paw' → 'us'`), puis suffixe marchand (`Zooplus FR` → fr), puis devise (USD→us, CAD→ca, GBP→gb). EUR sans pays connu = pas de drapeau
- Cron sync Awin : **7 crons par catégorie** (2h-4h UTC, 20min d'écart), reset catégorie + réinsertion depuis feeds Awin
- Disclaimer affiliation barre fixe en bas (bg-white/95)
- Filtre boutique : `.contains('categories', [category])` (array containment) -un livre sur chien apparaît dans "Tous", "Chiens" ET "Livres"
#### Système multi-catégories produits
- Colonne `categories TEXT[]` sur la table `products` (GIN index) en plus de `category TEXT` (primaire)
- `assignCategories(p)` dans `src/lib/awin.ts` : attribue une catégorie primaire + tableau `categories[]`
  - Primaire = premier animal trouvé (propriétaire cron), sinon livres, sinon general
  - Livre sur chien → `category: 'livres'`, `categories: ['livres', 'chiens']`
  - **Anti-match GPC bypass pour livres** : si GPC détecte 'livres', le check animal ignore le GPC et passe directement par mots-clés
- Cron livres (`/api/cron/awin-sync/livres`) : prend ownership des produits où `primary === 'livres'`
- Boutique filtre avec `.contains('categories', [category])` → multi-appartenance
#### Awin Darwin CSV Feeds (source unique de données produits)
- URL feedList : `https://ui.awin.com/productdata-darwin-download/publisher/{id}/{token}/1/feedList`
- Retourne un CSV avec colonnes `Advertiser Name`, `Membership Status`, `Feed ID`, `URL`
- Seulement les feeds `Membership Status === 'active'` sont utilisés
- **Déduplication par marchand** : 1 seul feed par marchand (URL la plus longue = flux complet)
- Chaque feed est un CSV (parfois `.gz`) téléchargé et décompressé (détection gzip par magic bytes `0x1F 0x8B`)
- **Streaming pur** : `parseCSVStreamingWithFlush` -jamais plus de 100 produits en RAM, flush+upsert immédiat
- **Colonnes Darwin (noms réels)** : `product_name` (titre), `category_name` (catégorie GPC), `isbn` (livres). Fallbacks : `title ?? product_name`, `google_product_category ?? category_name ?? merchant_category`. Colonne `stock_status` ignorée (supprimée du modèle)
- Catégorisation : `category_name` / `google_product_category` en priorité via `GPC_MAP` → fallback mots-clés titre
- **Détection livres** : ISBN non vide (`p['isbn']?.trim()`) = livre garanti
- **Mots-clés : titre uniquement + bornes de mot** pour mots simples (évite "pochette"→poche, "catalogue"→chat), titre+description pour expressions multi-mots
- **Anti-faux-positifs** : produits sans correspondance animal/livre → retournés `null` par `assignCategories()`, non importés
- Prix extrait par regex `priceRaw.match(/^([\d.]+)\s*([A-Z]{3})?/)` (format `'199.00 USD'`). Fallback devise : colonne `currency` ou `currency_code` du CSV, puis EUR
- **Disponibilité** : colonne `in_stock` supprimée de la table `products` et du type `AwinProduct`. Les feeds Awin ne sont pas fiables pour le stock — tous les produits sont affichés, l'utilisateur vérifie sur le site marchand
- Filtres : `price > 0`, exclusion pièces détachées (`/\bparts?\b/i`, `/ [A-Z0-9]{5,}$/`)
- **Pas de pre-delete** : suppression post-sync uniquement si `totalSynced > 0 && !lastError`, par comparaison `last_synced < syncStart` (évite DB vide si feed échoue)
- Cache feeds 1h en mémoire (évite re-téléchargement feedList à chaque appel)
#### Table `awin_sync_progress`
- Tracker de progression des crons Awin (1 ligne par catégorie)
- Colonnes : `category`, `status` (`running`/`done`/`error`), `synced` (compteur), `current_feed`, `error`, `started_at`, `finished_at`, `updated_at`
- Mise à jour pendant la sync (chaque batch) + finale (done/error)
- **Ne se met PAS à jour automatiquement** entre deux syncs -garde le dernier résultat jusqu'au prochain cron
- RLS activé : service_role bypass automatique, accès anon bloqué
- CronLauncher lit cette table via `/api/admin/run-cron?step=awin-progress` pour afficher la progression
### Section Partenaires
#### Landing page (`PartenairesSection.tsx`)
- Section "Nos recommandations" entre Catégories et Newsletter
- Affiche toutes les cartes en grille (server component)
#### Boutique -Carrousel coverflow (`BoutiquePartenairesCarousel.tsx`)
- **Position fixe en haut à droite** : `fixed top-24 right-6 z-30`
- Carousel animé RAF (requestAnimationFrame) : carte centrale grande (orange-50), côtés plus petites (blanc)
- Auto-rotation lente (`SPEED = 1/720` ≈ 12s/carte), s'arrête au survol
- Flèches prev/next affichées **uniquement si ≥ 3 partenaires** -animation démarre aussi à ≥ 3
- Transition de couleur RGB continue (orange-200 → gray-300 sur les bordures, orange-50 → blanc sur les fonds)
- Tags en **inline styles CSS** (`tagBg`/`tagText` sur l'interface Partenaire) -Tailwind ne compile pas les classes dynamiques de fichiers `.ts` de données
- Drapeaux : `flagcdn.com` 16×12px objectFit cover pour uniformiser BE/FR
- Layout boutique : flex (colonne gauche titre/search/filtres, colonne droite carousel) -`space-y-4`
### Sidebar admin -Fonctionnalités ✅
- **Lien Accueil** : premier item nav (icône `Home`, href `/`) -accès direct au site public
- **Fermable** : bouton `ChevronLeft` dans le header sidebar pour fermer, bouton `Menu` flottant `fixed left-3 top-4` pour rouvrir. Transition `translate-x-0` / `-translate-x-full` (300ms). `ml-64`/`ml-0` sur le `<main>` synchronisé via `sidebarOpen` dans `LayoutShell`.
- **Badge modération** : pastille orange sur l'item "Modération" affichant le nombre d'annonces adoption `pending`. Route `/api/admin/pending-count` (GET → `{ count: number }`). Consultée au chargement + toutes les 60s (setInterval).
- **Typographie agents agrandie** : nom `text-sm`, rôle `text-xs`, icône `size=17`
#### Interface `Partenaire` (`src/lib/partenaires.ts`)
- `pays: string[]` (codes ISO), `network: 'awin' | 'cj'`
- `tagColor` (classes Tailwind, pour PartenairesSection et BoutiquePartenairesRotating)
- `tagBg` / `tagText` (valeurs CSS hex, pour BoutiquePartenairesCarousel -inline styles)
- Partenaire actuel : **Dogfy Diet** (Awin, FR, chiens, nutrition fraîche)
- En attente CJ.com : Canada Pet Care, EntirelyPets (CA/US) -à ajouter quand confirmés
- Carousel actif à partir de **3 partenaires** (flèches + animation)
#### Fix Tailwind config
- `./src/lib/**/*.{js,ts,jsx,tsx}` ajouté au `content` de `tailwind.config.ts`
- Nécessaire pour que les classes définies dans `partenaires.ts` soient compilées (tagColor pour PartenairesSection)
### Google Analytics & AdSense
- GA `G-QE9XSS18YQ` -chargement conditionnel RGPD
- AdSense `ca-pub-3549294158319032` -en attente approbation
- Emplacements : blog liste, blog article, adoption, accueil
### SEO & Indexation
- Sitemap dynamique, robots.txt, Schema.org JSON-LD
- Google Search Console vérifié + sitemap soumis
- Bing Webmaster Tools vérifié + sitemap soumis
### next.config.mjs
- `remotePatterns` : `images.unsplash.com` + `images.pexels.com` + `*.supabase.co` + `cdn.shopify.com` + `flagcdn.com`
### Déploiement
- Repo GitHub : `BauwensThomas/mespoilus`
- CI/CD : Vercel -déploiement automatique sur push `main`
- Git author : `Bauwens Thomas <thozma.thomas@gmail.com>`
---
## Actions manuelles restantes

### Guides PDF ✅
- ✅ Migration `pdf_guides` exécutée (table + données seedées)
- ✅ Bucket `pdf-guides` créé (privé, application/pdf uniquement)
- ✅ 10/10 PDFs uploadés dans Supabase Storage
### Migrations Supabase en attente ⚠️
- ✅ `migration_awin_categories.sql` — colonne `categories TEXT[]` + GIN index sur `products` (vérifié en DB)
- ✅ `migration_rls_awin_progress.sql` — RLS sur `awin_sync_progress` (vérifié : anon=[], service_role=données)

### Actions manuelles en attente ⚠️
- **SQL Supabase** : supprimer faux positifs Maxi Zoo dans livres → `DELETE FROM products WHERE category = 'livres' AND merchant_name LIKE '%Maxi Zoo%';`
- **Livres Amazon** : continuer d'en ajouter via `/produits` (objectif : ~2 par catégorie animale minimum)
- **Amazon Associates** : générer 3 ventes dans les 180 jours pour valider le compte et débloquer l'API PA

### Actions déjà effectuées ✅
- Site public (blog, adoption, boutique, pages légales) : **thème clair complet** ✅
- Landing page catégories : **icônes en bas des images** ✅
- Pages admin/agent : **conversion thème clair complet** ✅
- Blog articles featured : **hauteur h-56 + object-center** ✅
- Bannières catégories : **illustrations SVG animales** (chiens, chats, oiseaux, rongeurs, reptiles) ✅
- Header : **hauteur fixe h-20 cohérente** sur toutes les pages ✅
- Boutique carousel : **position fixe top-right, ne dérègle pas le layout** ✅
- PartenairesSection : Dogfy Diet (Awin FR) avec drapeaux emoji, interface prête pour CJ.com
- Filtre OR `category.eq + categories.cs` appliqué sur blog/page.tsx ET _category-page.tsx
- Adresse `contact@mespoilus.com` créée dans panel LWS
- Clés Awin obtenues et configurées dans Vercel + sync automatique opérationnel
- Compte Resend créé + `RESEND_API_KEY` configuré
- Utilisateur admin créé dans Supabase Auth (`thozma.thomas@gmail.com`)
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
- CronLauncher : dropdown pour forcer un animal spécifique (override de la rotation automatique)
- Emma passée sur **Haiku 4.5** + lien article complet dans les posts
- Marie passée sur **Haiku 4.5 + 1400 tokens** (~10s, compatible Vercel Hobby)
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
- Rotation type d'article cron blog : trending → affiliation → pratique via `(semaine*3+jourIndex)%3` + override manuel CronLauncher
- Anti-répétition partenaires : colonne `featured_partner` sur `articles`, bloque réutilisation pendant 30 articles
- Lucas enrichi : output cron inclut INTENTION, RAISON, NOM_PRODUIT, LIEN_AFFILIE, IMAGE_PRODUIT, META_DESC
- Marie enrichie : reçoit contexte Lucas complet + 3 articles récents même catégorie pour liens internes + meta cible
- Marie tokens 1200 → 1400 → 1800, consigne 550-700 mots (était 400-600), structure 3-4 H2 (était 2 H2)
- Détection troncature Marie : `stop_reason === 'max_tokens'` → erreur explicite dans runner.ts (article rejeté, pas publié tronqué)
- Lucas tokens 400 → 500
- Temps de lecture calculé dynamiquement après génération (wordCount÷250) et mis à jour en DB
- Pages articles blog `/blog/[slug]` : thème clair (bg-gray-50, texte #111827), `.article-content` CSS light
- ProductCard simplifié : bouton "lien cassé" supprimé -liens 404 acceptables (1/30)
- tsconfig target ES2017 : fix compatibilité Set/iteration TypeScript sur Vercel
- Accessibilité 91→96 : labels amber-600→amber-700, textes gray-400→gray-500, alt="" images catégories décoratives, balise `<main>` dans LayoutShell public
- Accessibilité 96→100 : CookieBanner lien "En savoir plus" underline (identification couleur), flagcdn img width/height explicites
- PageSpeed Insights (après corrections session 2) : mobile **99/96/100/100**, bureau **100/96/100/100** ✅
  - Google Fonts supprimé de `globals.css` (CSP violation + render-blocking)
  - `browserslist` ajouté dans `package.json` (élimine polyfills JS legacy)
  - Image `sizes` corrigés sur landing + BlogCard (50vw/33vw selon breakpoint)
  - Contraste orange-600 conservé volontairement (choix utilisateur)
- Google Search Console + Bing Webmaster Tools : sitemaps soumis, pages découvertes, indexation en cours
- ads.txt en ligne (`/public/ads.txt`, pub-3549294158319032) -AdSense en révision
- AdBanner : gardé par `NEXT_PUBLIC_ADSENSE_ENABLED` (false = invisible, zéro impact layout). Deux hooks `useEffect` en premier (règle React hooks). Label unifié "Annonce". Ajouté sur `/outils/age`, `/outils/prenom`, `/outils/quiz`
- `src/lib/guides.ts` créé : `PdfGuide` interface + `CATEGORY_CONFIG` extraits de `guides/page.tsx` (exports invalides en Next.js App Router)
- Sitemap : pages `/outils/age`, `/outils/prenom`, `/outils/quiz` ajoutées (priority 0.7)
- Partenaires : Fnac retiré du projet (Awin + partenaires) — hors-sujet pour un site animalier. Seul Dogfy Diet reste
- Amazon Associates FR : en cours d'affiliation — prévu pour la catégorie Livres (animaux). Intégration à faire quand accès obtenus (API Product Advertising ou liens manuels, pas de feed CSV Awin)
- Boutique : colonne `categories TEXT[]` + GIN index + filtre `.contains()`. Catégorie "Livres" ajoutée
- Boutique : `unoptimized` sur `<Image>` de `ProductCard` (CDN Awin non listé dans `remotePatterns`)
- Awin sync : refactoring complet vers 7 crons par catégorie, streaming pur, `assignCategories()` multi-catégories
- Awin Darwin CSV : fix colonnes réelles (`product_name`, `category_name`, `stock_status`, `isbn`) + bornes de mot manuelles + détection ISBN livres + no pre-delete + anti-faux-positifs (null pour produits hors-animaux) ✅
- Awin CATEGORY_EXCLUSIONS : formes plurielles/diminutives FR/NL/DE ajoutées (chats, chatons, katten, chiens, chiots, honden…) pour rongeurs/oiseaux/reptiles — évite les faux positifs pluriels ✅
- Awin image produit blog : URL upscalée 200×200 → 800×800 avant téléchargement (`?w=800&h=800`) ✅
- Boutique : hint recherche "Vous ne trouvez pas…" à côté du sélecteur de tri quand aucune recherche active ✅
- Colonne `in_stock` supprimée de `products` (table + type + sync + boutique + dashboard) — feeds Awin non fiables pour le stock ✅
- Migration exécutée : `migration_drop_in_stock.sql` (DROP COLUMN CASCADE + nouvelle RLS `USING (true)`) ✅
- Awin GPC_MAP livres élargi : roman, BD, manga, littérature, jeunesse, encyclopédie, biographie, poche, broché, relié ✅
- Awin devise : fallback sur colonnes `currency`/`currency_code` du CSV si absente du champ `price` ✅
- Boutique pagination : 48/page, `?page=N`, requête count parallèle ✅
- Boutique tri : `BoutiqueSortSelect` (disponibles en premier / prix ↑ / prix ↓ / nom A–Z) via `?sort=` ✅
- Boutique filtre admin affilié : panel amber, visible si session admin, `?affiliate=` ✅
- ProductCard drapeaux : table override `MERCHANT_COUNTRY` (Tuft & Paw → US), suffixe marchand (FR/BE/…), devise, jamais EUR par défaut ✅
- Blog cron image : fallback Pexels si téléchargement image Awin échoue, jamais URL CDN Awin stockée ✅
- save-social-post : filtre URL Supabase Storage uniquement → Instagram accepte les images ✅
- Marie maxTokens 1800 + détection troncature `stop_reason=max_tokens` dans runner.ts ✅
- CronLauncher : panel Awin avec 7 catégories, étendu par défaut, progress merge sans écraser les catégories idle
- Dashboard totaux : calculés depuis `activity_logs` (même source que mensuels) pour cohérence garantie
- Cron social log : label corrigé (était "Emma + Sofia terminés", maintenant "Emma terminée")
- Thomas tokens : logs crons blog/finance/security/newsletter sauvegardent `tokens_used` dans `activity_logs`
- Sofia mode manuel : reçoit les 3 derniers articles via `buildEnrichedPrompt` (même comportement que le cron)
- Boutique : barre de recherche produits par nom/description (`BoutiqueSearchBar.tsx`)
- Descriptions agents corrigées pour refléter leurs vraies tâches (Nathalie, Emma, Lucas, Marie, Léa, Maxime, Antoine, Sofia, Thomas)
- Sofia mode manuel : génère + envoie la newsletter directement via Resend — **bypass anti-doublon 5 jours** + choix destinataires (admin test ou tous abonnés) ✅
- Sofia : reçoit `image_url` des articles et les inclut comme `<img>` dans le HTML de la newsletter
- Emma enrichie : reçoit le dernier article publié automatiquement en mode manuel
- Hints visuels ajoutés sur les pages Marie, Lucas, Léa pour guider la saisie
- Thème admin : couleurs grises remplacées par bleu navy cohérent avec le site public
- Rotation animaux cron blog : 3 animaux différents par semaine, combinaisons changeantes (`semaine*3 + jourIndex) % 5`)
- CronLauncher : dropdown pour forcer un animal spécifique (override de la rotation automatique)
- Instagram `@mespoilusofficiel` connecté Make.com, posts Facebook+Instagram confirmés fonctionnels
- Mode jour/nuit/auto (next-themes) : toggle dans header public + admin sidebar, CSS variables, `ThemeToggle.tsx`
- Filtres catégories blog : OR sur `category` ET `categories[]` -articles visibles sur toutes les pages catégories
- Barres de recherche blog + boutique : fond `bg-gray-700` (gris visible) au lieu de noir/navy
- Espacement pages publiques : `space-y-4` sur boutique, blog, adoption (uniformisé)
- Boutique : carousel coverflow partenaires (RAF, auto-rotate, flèches ≥3, inline styles tags)
- Tailwind config : `src/lib/` ajouté au content scan
- Adoption `/deposer` : converti en thème clair (était dark `bg-gray-900`)
- Adoption : barre de recherche par race/description/région (`AdoptionSearchBar.tsx`)
- Partenaires : suppression des 4 faux partenaires test (Zooplus, Royal Canin, Petcube, AquaShop)
- Landing page : newsletter réduite (py-10), footer compact (pt-8 pb-5, space-y-0.5 liens), AdBanner sans padding vertical, **transitions de sections droites (sans vagues SVG)**
- Dashboard + pages agents : timestamps absolus (aujourd'hui/hier à HH:mm, sinon d MMM à HH:mm) via date-fns
- Boutique : Awin réécrit (Darwin CSV feeds au lieu de keyword API), reset DB complet à chaque sync, bouton "lien cassé" sur ProductCard, drapeaux devises
- next.config.mjs : `cdn.shopify.com` + `flagcdn.com` ajoutés aux remotePatterns
- `AWIN_FEED_TOKEN` ajouté aux variables d'environnement Vercel
- **Windows git path issue** : suppression des parenthèses échappées dans git tracking ✅
- **Hero photos** : table `hero_photos` (Supabase) remplace Unsplash -rotation round-robin via `last_used_at`, `revalidate = 3600`, `ANIMAL_TYPE_MAP` pour singulier/pluriel, bucket `hero-photos` organisé en sous-dossiers ✅
- **Catégories homepage** : même table `hero_photos` filtrée par `animal_type`, 1 photo aléatoire par catégorie, fallback dégradé coloré, lien `/blog/{catégorie}` ✅
- **Pages catégories blog** (`/blog/chiens`, `/blog/chats`, etc.) : layout harmonisé avec blog principal (header → filtres → recherche → bannière → contenu), `BlogSearchBar` avec prop `basePath` pour rester dans la catégorie ✅
- **BlogCard featured** : layout horizontal `flex flex-col md:flex-row`, image carré `md:w-96 md:h-96` object-cover, teaser 650 chars via `getTeaser()` (strip HTML + Markdown), `<span role="link">` pour crédits photo (pas de `<a>` imbriqué dans `<Link>`), contenu `justify-between` ✅
- **Adoption** : bouton "Déposer une annonce" poussé à droite avec `ml-auto` ✅
- **Favicon/icône** : `src/app/icon.svg` mis à jour -Lucide PawPrint blanc (stroke, strokeWidth 1.5) sur fond dégradé orange `#f97316` → `#ea580c`, rx=7 ✅
- **CLAUDE.md** créé : contexte complet projet pour Claude Code (stack, thème, structure layout, hero photos, Supabase, règles) ✅
- **Admin thème clair complet** : tous les `bg-[#...]`/`border-[#...]`/`dark:` éliminés de AgentCard, GlobalStats, ActivityFeed, CronLauncher, dashboard/page, moderation/page, AgentPage, globals.css ✅
- **PartenairesBandeau** : bande partenaire sticky sous header public (1 partenaire aléatoire, drapeaux, tag, description) dans LayoutShell ✅
- **PublicHeader partout** : header visible sur toutes les pages y compris homepage ✅
- **next.config.mjs** : `flagcdn.com` ajouté aux remotePatterns (corrige crash boutique) ✅
- **Blog/Boutique harmonisés** : bannière dégradé orange→gris, header text-3xl, Unsplash supprimé, BoutiquePartenairesCarousel supprimé ✅
- **Sidebar fermable** : bouton fermer/rouvrir, transition 300ms, main s'adapte (ml-64 ↔ ml-0) ✅
- **Badge modération** : pastille orange sur "Modération" avec compteur annonces pending (API `/api/admin/pending-count`, refresh 60s) ✅
- **Sidebar "Accueil"** : lien Home ajouté en premier dans la nav admin ✅
- **Typographie admin agrandie** : text-[9px]/text-[10px]/text-[11px] éliminés, textes lisibles text-sm/text-base partout (dashboard, agents, modération, sidebar) ✅
- **Outils publics** : 4 outils accessibles via dropdown "Outils" dans le header public ✅
  - Calculateur d'âge (`/outils/age`) : **5 catégories site** (chien, chat, oiseau, rongeur, reptile) -formules spécifiques par animal, slider, résultat gradient orange, `max-w-6xl`
  - Quiz "Quel animal pour moi ?" (`/outils/quiz`) : 6 questions, 5 animaux scorés, progression automatique 300ms, résultat avec conseils, `max-w-6xl`
  - Générateur de prénom (`/outils/prenom`) : 5 animaux × 4 styles -tirage aléatoire de 6, grille 3 cols, **connecté à la table Supabase `prenoms`** (fallback statique si vide), badge "Mis à jour ce mois-ci" si données DB actives
  - Guides PDF gratuits (`/guides`) : page liste avec modal email + download sécurisé, `max-w-6xl`
- **Cron mensuel prénoms** : `/api/cron/prenoms` (1er du mois, 7h UTC) -Thomas génère 50 prénoms par animal (5 animaux × 4 styles) via Claude Haiku, DELETE+INSERT full refresh, logActivity ✅
  - Table `prenoms` : `(animal TEXT, style TEXT, names TEXT[], generated_at TIMESTAMP, PRIMARY KEY(animal, style))`, RLS public SELECT
  - CronLauncher : pipeline "Prénoms animaux" (pipeline #5) avec icône Sparkles
- **Header public avec menu hamburger** ✅
  - Breakpoint hamburger : **`md` (768px)** -nav desktop visible ≥768px, hamburger visible <768px
  - Mobile menu : dropdown absolu avec tous les NAV_LINKS + section Outils repliable (useState `toolsOpen`)
  - `PartenairesBandeau` : `hidden md:flex` (masqué sur mobile)
  - Boutique : `whitespace-nowrap` (toujours visible)
- **Homepage "Nos outils pour vous aider"** : section avec 4 cards (Calculateur d'âge, Quiz, Générateur prénom, Guides PDF), `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` ✅
- **Homepage headers centrés** : "Nos derniers conseils", "Nos recommandations", "PartenairesSection" tous centrés (`text-center mb-12`) ✅
- **Hero/footer** : reptiles ajoutés dans le texte hero et navigation footer ✅
- **Système guides PDF RGPD** ✅
  - 3 tables Supabase : `pdf_guides` (10 guides seedés), `pdf_downloads` (token UUID 24h), `pdf_consents` (trace RGPD)
  - Bucket Supabase Storage `pdf-guides` (privé) -signed URLs 60s
  - `/guides` : page liste server component (`revalidate=3600`), 6 catégories colorées (chiens/chats/rongeurs/oiseaux/reptiles/général)
  - `GuidesGrid` client component : CATEGORY_CONFIG défini localement (pas de prop fonction Server→Client)
  - `GuideDownloadModal` : email + checkbox newsletter **décochée par défaut** (conforme RGPD), consent stocké séparément dans `pdf_consents`
  - `/api/guides/request` : valide email → insère pdf_downloads + pdf_consents → upsert newsletter_subscribers si consent → envoie email Resend avec lien download
  - `/api/guides/download/[token]` : vérifie token + expiry → génère signed URL Supabase Storage (60s) → redirige, marque `downloaded_at`
  - Sitemap mis à jour : `/guides` (priority 0.9) + slugs individuels (priority 0.8)
  - Guides dans dropdown "Outils" header (pas dans NAV_LINKS)
- **Scroll-to-top corrigé** : `useEffect` sur `pathname` avec garde `if (!window.location.hash)` -les ancres (#categories, #newsletter) ne sont plus écrasées ✅
- **Emma post direct** : panneau sur page Emma (border rose) — upload image + instructions → `/api/admin/emma-direct` → Emma génère + Make webhook, sans passer par le blog ✅
- **Marie toggle réseaux** : toggle "Publier aussi sur les réseaux (Emma)" sur page Marie → après génération, Emma crée un post avec slug+titre+image uploadée ✅
- **Marie upload image** : zone d'upload sur page Marie → image stockée dans `blog-images` → utilisée comme image article (pas Pexels) + transmise à Emma si toggle ON ✅
- **Historique agents collapsible** : `HistoryPanel` fermé par défaut, bouton ouvrir/fermer, filtre par date (`<input type="date">`), compteur résultats filtrés ✅
- **Anti-doublon Marie** : `save-agent-data` vérifie le slug avant INSERT → PATCH si existant (évite doublons si exécution double) ✅
- **Catégorie Général blog** : page `/blog/general`, filtre dans nav, métadonnées SEO — prompt Marie renforcé pour choisir `general` si article transversal/boutique/multi-animaux ✅
- **Lucas maxTokens** : 500 → 1200 (URLs Awin trop longues pour 500 tokens) ✅
- **Amazon Associates FR** : compte approuvé (ID `mespoilus-21`), mention légale ajoutée au footer homepage ("En tant que Partenaire Amazon…") ✅
- **Page admin `/produits`** (`src/app/(admin)/produits/page.tsx`) : ajout manuel livres Amazon avec extraction ASIN automatique, preview lien affilié, upload image, catégories animales, liste avec filtre par catégorie + badge "Aucune catégorie animale", bouton modifier inline ✅
- **API admin livres** : `POST/PATCH/DELETE /api/admin/products` (extraction ASIN, URL affiliée `https://www.amazon.fr/dp/[ASIN]?tag=mespoilus-21`, id `amazon_[ASIN]`, `merchant_name: 'Amazon FR'`) + `GET /api/admin/products-list` ✅
- **Boutique catégorie Livres** : réactivée dans CATEGORIES avec icône `BookOpen` ✅
- **getMerchants fix** : requête Amazon FR séparée (limit 1) + marchands Awin (limit 100000) — évite le plafond 10 000 lignes qui cachait Amazon FR dans les filtres admin ✅
- **maxDuration = 60** : ajouté sur toutes les routes cron manquantes (7× awin-sync, blog, social) — évite timeout 10s Vercel Hobby par défaut ✅
- **Vercel crons** : 13 crons tous actifs et reconnus par Vercel Hobby ✅
- **Awin mots-clés livres** : `'poche'`, `'broché'`, `'relié'` retirés (causaient "lampe de poche" → livres) ✅
---
## Ce qui reste à faire (code)
### Outils publics (`/outils/`)
- **Outil nutrition** chien/chat : calculateur de ration quotidienne selon poids/âge/activité
- **Comparateur croquettes** : comparer 2-3 marques sur critères (protéines, prix/kg, note)
- **Suivi vaccination** : calendrier des vaccins par animal + rappels
### Boutique / Monétisation
- **Amazon Associates FR** : compte approuvé (ID `mespoilus-21`). Page admin `/produits` opérationnelle pour ajout manuel de livres. Après 3 ventes dans 180 jours → intégration API Product Advertising pour sync automatique
- Barre de recherche produits ajoutée (`?search=mot`) -filtre par nom et description via `ilike`
### Marketing
- Stratégie backlinks francophones
- Lucas : connexion API volume mots-clés (Ahrefs, Semrush)
### Infrastructure
- Redis (Upstash) pour rate limiting distribué
- Monitoring erreurs (Sentry)
- Backups Supabase automatisés