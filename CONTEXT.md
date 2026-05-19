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
| 👔 **Thomas** | CEO Orchestrateur | Opus 4.7 | 3000 | Stratégie globale, priorisation, coordination des 8 autres agents, rapports |
| ✍️ **Marie** | Rédactrice de contenu | **Haiku 4.5** | **4000** | Articles de blog (550-700 mots), guides pratiques, conseils |
| 🔍 **Lucas** | Spécialiste SEO | Sonnet 4.6 | **4000** | Recherche mots-clés, optimisation on-page, stratégie francophone |
| 📱 **Emma** | Réseaux sociaux | Haiku 4.5 | 2000 | Posts Facebook + Instagram (@mespoilusofficiel), hashtags, lien article complet |
| 💻 **Maxime** | Développeur & Maintenance | Sonnet 4.6 | 6000 | Performances, bugs, Next.js / Supabase, Core Web Vitals |
| 💬 **Léa** | Support client | Haiku 4.5 | 3000 | Réponses emails clients, commandes, FAQ - À la demande uniquement (pas de cron) |
| 📊 **Antoine** | Finance | Sonnet 4.6 | 4000 | Revenus €, marges, rapports financiers, projections |
| 🛡️ **Nathalie** | Sécurité | Sonnet 4.6 | 8000 | Détection intrusions, blocage IPs, audits, alertes |
| 💌 **Sofia** | Newsletter | Sonnet 4.6 | 4000 | Newsletter hebdomadaire, sélection articles, envoi Resend |

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Style | Tailwind CSS - Thème clair public `bg-gray-50`, admin clair `bg-white/bg-gray-50` |
| Base de données | Supabase (PostgreSQL) |
| IA | API Anthropic - Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5 |
| Monitoring erreurs | Sentry (`@sentry/nextjs` v10) - Erreurs, traces, profiling, logs |
| Images blog/social | **Pexels API** (téléchargement + stockage autorisés, 200 req/h gratuit) |
| Images hero & catégories | **Supabase table `hero_photos`** - Rotation round-robin via `last_used_at`, `revalidate = 3600` |
| Images agents (pages `/agents/[agent]`) | Unsplash API - Affichage uniquement, non stockées |
| Stockage images | Supabase Storage `blog-images` (articles) + `hero-photos` (hero & catégories) |
| Sécurité | Middleware Edge : rate limiting, détection SQLi/XSS, blocage IP |
| Déploiement | Vercel (crons configurés dans `vercel.json`) |
| Affiliation | Awin (EU) + Amazon Associates FR (en cours, catégorie Livres) + CJ.com / scraping sitemap (CanadaPetCare CA/US - ~82 produits importés) |

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
MAKE_WEBHOOK_URL # Webhook Make.com - Facebook + Instagram (@mespoilusofficiel)
NEXT_PUBLIC_APP_URL # Ex: https://www.mespoilus.com (OBLIGATOIRE pour fetches internes Vercel)
NEXT_PUBLIC_ADSENSE_ENABLED # 'true' une fois AdSense approuvé (actuellement 'false')
SENTRY_AUTH_TOKEN # Dans .env.sentry-build-plugin (gitignored) + Vercel env vars (Production+Preview) - NE JAMAIS COMMITTER

---
## Ce qui est fait
### Landing page publique (`/`)
- **Design clair et chaleureux** (bg-gray-50, blanc, beige, tons ambrés)
- Hero split : texte à gauche (52%), **4 photos depuis Supabase `hero_photos`** à droite en grille décalée (chien, chat, oiseau, rongeur) - Rotation round-robin via `last_used_at`, `revalidate = 3600`, fallback dégradé coloré si pas de photo
- Nav : logo à gauche (PawPrint Lucide blanc sur fond orange), liens Blog / Adoption / Newsletter au centre, bouton Boutique (orange) à droite
- Section "Derniers articles" : 3 derniers articles de Marie avec cards
- **Section catégories "Par type d'animal"** : 5 catégories avec photos depuis **même table `hero_photos`** (1 photo aléatoire par `animal_type`), fallback dégradé coloré - Lien vers `/blog/{catégorie}`
- Section newsletter `py-10` (réduit depuis py-20) avec formulaire email (client component `NewsletterForm.tsx`)
- Footer compact : `pt-8 pb-5`, grille 4 cols, liens `space-y-0.5`, titres `mb-1` - Navigation, mentions légales, Instagram + Facebook, **pas de lien Admin ni TikTok**
- Bloc AdSense entre newsletter et footer : sans padding vertical (vide jusqu'à approbation AdSense)
- `revalidate = 3600`
### Authentification admin (Supabase Auth)
- **Middleware** `src/middleware.ts` - Protège `/dashboard`, `/agents/*`, `/orchestrate`, `/adoption-admin`, `/blog-admin`, `/races-admin`, `/produits-admin` etc.
- Routes admin sans session → redirect `/login?redirect=...`
- API routes sans session → `401 Unauthorized`
- **Page login** `src/app/login/page.tsx` - Fond blanc clair, formulaire clair
- `src/app/login/actions.ts` - Server action `signIn` via `supabase.auth.signInWithPassword`
- `src/app/actions/auth.ts` - Server action `logout`
### Routes et layout
- `src/app/layout.tsx` - Minimal, utilise `LayoutShell` + `CookieBanner` + `GoogleAnalytics`
- `src/components/layout/LayoutShell.tsx` - Client Component :
  - **Admin** → Sidebar (`isOpen`/`onToggle` props) + main (`ml-64` ou `ml-0` avec transition 300ms selon état sidebar)
  - **Public** → PublicHeader (`h-20`, visible partout) + `PartenairesBandeau` (sticky `top-20 z-30 h-9`) + main + `RefugeFinderPanel` + `VetFinderPanel` + `AnimalDayPopup`
- **`PartenairesBandeau`** (dans `LayoutShell.tsx`) : bande partenaire sticky sous le header public
  - Affiche 1 partenaire aléatoire au chargement : label "Partenaire", nom, drapeaux pays, tag coloré, description tronquée (pas de flèche)
  - Pour Maxi Zoo (`urlsByCountry`) : clic ouvre un picker pays inline (dropdown) avec 🇫🇷/🇧🇪 → redirige vers le bon lien Awin
  - Drapeaux : `<img style={{ width:'18px', height:'13px', objectFit:'cover' }}>` (plain img, pas next/image) pour uniformiser BE/FR
  - `bg-white/95 backdrop-blur border-b border-gray-100`, centré `max-w-7xl mx-auto`, `z-30`
- Dashboard admin : `src/app/(admin)/dashboard/page.tsx`
### Thème visuel - Conversion au THÈME CLAIR complet ✅
- **Site public** : `bg-gray-50`, cards `bg-white`, texte `text-gray-900`, borders `border-gray-200/300`
- **Admin** : fond `bg-white`, main area `bg-gray-50`, sidebar `bg-white` avec borders `border-gray-200`, accents orange
- **Composants admin convertis au clair** : `globals.css` (`.card`, `.card-hover`), `AgentCard.tsx`, `GlobalStats.tsx`, `ActivityFeed.tsx`, `CronLauncher.tsx`, `dashboard/page.tsx`, `moderation/page.tsx`, `AgentPage.tsx` - Tous les `bg-[#1e2a3a]`, `bg-[#111827]`, `border-[#2a3a4a]` éliminés
- **Blog articles** : `bg-gray-50`, texte `text-gray-900`, `.article-content` CSS clair pour prose
- **Header** : `bg-white/95 backdrop-blur`, hauteur **fixe `h-20`** (80px) sur toutes les pages pour cohérence
- **Admin sidebar** : `bg-white`, nav items clairs, active items `bg-orange-100 text-orange-700`
### Header fixe - Hauteur cohérente ✅
- PublicHeader : `h-20` fixe + `flex items-center h-full` pour centrage vertical
- Hauteur identique sur toutes les pages (landing, blog, boutique, adoption, pages admin)
- PublicHeader visible sur TOUTES les pages (y compris la homepage - `if pathname === '/'` supprimé)
### Bannières catégories - Illustrations SVG animales ✅
- **Remplacement images** : remplacées par des illustrations SVG custom
- **Chiens** : famille de chiens simple
- **Chats** : chat assis
- **Oiseaux** : oiseau en vol
- **Rongeurs** : lapin avec oreilles
- **Reptiles** : serpent ondulant
- Opacité 20% pour effet discret
- Fond dégradé orange cohérent
### Images articles blog - Featured images améliorées ✅
- Hauteur **`h-56`** pour articles "à la une" (au lieu de h-48)
- Ajout `object-center` pour centrage optimal
- Meilleure visibilité des animaux dans les images
### Boutique - Carousel partenaires repositionné ✅
- **Position fixe en haut à droite** (`fixed top-24 right-6 z-30`)
- Header remain cohérent avec autres pages
- Carousel flotte sans affecter le layout
### Filtres blog - OR sur category ET categories[]
- Articles publiés peuvent avoir : `category` (string), `categories[]` (array), ou les deux
- Filtre PostgREST : `.or(\`category.eq.${category},categories.cs.{${category}}\`)` dans `blog/page.tsx` ET `_category-page.tsx`
- Évite les articles invisibles sur les pages catégories si `categories[]` est incomplet
### Dashboard admin (`/dashboard`)
- Grille des 9 agents avec statut, stats et dernière activité
- **Feed d'activité (`ActivityFeed.tsx`)** : collapsible (ferme par defaut), header affiche total `(N)` + compteur du jour en rouge `aujourd'hui (X)` au centre + "Live" a droite. Quand ouvert : champ date pour filtrer par jour (filtre client, "X resultats" + bouton Effacer), 10 lignes visibles avec scroll. Tous les logs charges sans limite depuis la DB.
- Stats globales : articles publiés, tâches exécutées, tokens utilisés, alertes sécurité
- **Chaque stat globale affiche : total all-time + "X ce mois" en ambré**
- **Totaux ET mensuels calculés depuis `activity_logs` (source unique) → total toujours ≥ ce mois**
- `agent_stats` utilisé uniquement pour `last_active` et fallback score
- Score agent : calculé dynamiquement depuis `activity_logs` (success / (success + error) * 100)
- **Chaque card agent affiche : tâches total + ce mois, tokens total + ce mois**
- **Auto-refresh toutes les 30 secondes** via `AutoRefresh.tsx` (client component, `router.refresh()`)
- **CronLauncher** : menu déroulant `w-96` avec 8 pipelines manuels, textes `text-sm`/`text-xs` lisibles
- **Typographie admin agrandie** : titres sections `text-base`, valeurs stats `text-2xl`, descriptions `text-sm`, labels `text-sm` - Plus aucun `text-[9px]`/`text-[10px]` dans les composants dashboard
- `revalidate = 30`
### Orchestration image override (`/orchestrate`)
- Zone image optionnelle sous la textarea : **upload depuis l'ordinateur** (→ `/api/admin/upload-image` → Supabase Storage `blog-images`) ou **coller une URL**
- Preview avec bouton croix rouge pour supprimer, spinner pendant l'upload
- `overrideImageUrl` envoyé dans le body POST `/api/orchestrate`
- **Si pipeline Marie → Emma** : skip Pexels, article mis à jour avec l'image fournie ; Emma utilise cette image pour le post social
- **Si Emma seule + image** : Emma génère un post libre sur l'objectif (sans chercher le dernier article) ; l'image est envoyée au webhook Make.com
- **Sans image** : comportement inchangé (Pexels pour les articles, image du dernier article pour Emma standalone)
- Image Supabase Storage → fonctionne avec Instagram ; URL externe → fonctionne avec Facebook mais peut être rejetée par Instagram

### Pages agents (`/agents/[agent]`)
- Photo ambiante Unsplash en hero (fallback SVG thématique)
- Zone de saisie de tâche avec **streaming en temps réel** de la réponse Claude
- Tâches rapides préconfigurées par agent
- **Historique des activités** : collapsible (fermé par défaut), filtre par date (`<input type="date">`), cliquable (Marie → article, autres → accordéon contenu)
- **Stats : tâches complétées/échouées + tokens - Total all-time + ce mois en ambré**
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
- `buildEnrichedPrompt(agentId, baseTask, supabase)` - Injecte les vraies données avant d'appeler l'agent
- **Antoine** : articles publiés, posts sociaux, tokens consommés, coût API estimé (mois courant vs mois précédent)
- **Nathalie** : incidents de sécurité, IPs bloquées, 5 derniers incidents
- **Lucas** : titres des 15 derniers articles (évite les doublons)
- **Maxime** : erreurs dans les logs, 5 dernières erreurs avec détail
- **Sofia** : 3 derniers articles publiés (titre, lien, résumé) + année en cours → génère newsletter sans saisie manuelle
- Utilisé dans orchestration, délégation, et crons finance/security
### Blog automatique - Pipeline complet
#### Cron 1 : `/api/cron/blog?auto=true` (Lun/Mer/Ven 9h UTC)
1. **Thomas** prépare le contexte (animal, saison, mois, produits Supabase, 3 articles récents même catégorie)
   - **Sélection animal** : `?auto=true` → `selectLeastUsedCategory()` choisit toujours la catégorie avec le moins d'articles publiés (chiens/chats/oiseaux/rongeurs/reptiles)
   - **Override manuel** : `?animal=chiens` via le sélecteur CronLauncher (désactive auto)
2. **Lucas** choisit le sujet selon le **type d'article** (rotation forcée ou override manuel) :
   - **Rotation type** : `(nb_articles_animal + offset_animal) % 5` → chaque animal cycle indépendamment ; offset par animal (chiens=0, chats=1, oiseaux=2, rongeurs=3, reptiles=4) pour éviter que tous soient sur le même type simultanément
   - **trending** : sujet activement recherché sur Google (hors saisonniers génériques)
   - **affiliation** : article centré sur un partenaire ou produit Awin avec lien affilié exact ; anti-répétition 30 articles via colonne `featured_partner`
   - **pratique** : guide concret et actionnable ; fallback si affiliation impossible (tous bloqués + aucun produit dispo)
   - **race** : Lucas reçoit la liste de toutes les races de l'animal (avec photo + contenu, non couvertes en priorité, couvertes en fallback) → choisit la race avec le meilleur potentiel SEO → retourne `RACE_SLUG`
   - Retourne : SUJET, RACE_SLUG, MOTS_CLES, INTENTION, RAISON, NOM_PRODUIT, LIEN_AFFILIE, IMAGE_PRODUIT, META_DESC
3. **Marie** rédige l'article (Haiku 4.5, **1400 tokens**, **550-700 mots**, ~12s) → sauvegardé dans Supabase
   - Reçoit : sujet + mots-clés + intention + raison + meta description cible + 3 articles récents pour liens internes
   - Si type `race` : reçoit aussi lien obligatoire vers `https://www.mespoilus.com/races/[animal]/[slug]`
   - **Saison injectée uniquement pour `trending`** (pas pour affiliation, race, pratique, best_of) → évite les titres génériques "au printemps" hors saison
   - Si partenaire forcé : reçoit `- Marque : X (mentionne ce nom nommément)` + codes promo en section obligatoire
   - Temps de lecture recalculé dynamiquement après génération (`wordCount ÷ 250`, min 1)
4. **Image** : type `race` → `photo_url` de la race depuis Supabase directement ; affiliation → image produit Awin (téléchargée Storage) ; sinon → Pexels → `blog-images`
5. **breed_slug** stocké dans `articles` si type race (colonne `breed_slug` - migration `migration_article_breed.sql`)
6. Résultat écrit dans `cron_state` (slug, title, excerpt) avec status `article_ready`
7. **Stats Thomas** : tokens = somme Lucas + Marie
#### Cron 2 : `/api/cron/social` (Lun/Mer/Ven 9h30 UTC)
1. Lit `cron_state` pour trouver l'article prêt
2. Lit `featured_partner` et `promo_codes` depuis la table `articles` (colonnes requises : `featured_partner TEXT` migration_featured_partner.sql ✅, `promo_codes TEXT` migration manuelle `ALTER TABLE articles ADD COLUMN IF NOT EXISTS promo_codes TEXT`)
3. Génère un hashtag partenaire depuis `featured_partner` (ex: "Tuft & Paw" → `#tuftandpaw`, caractères spéciaux normalisés)
4. **Emma** rédige un post Facebook avec le lien EXACT + codes promo obligatoires + hashtag partenaire
5. `save-social-post` récupère l'`image_url` de l'article (déjà stockée dans Supabase Storage)
6. Webhook Make.com → **Facebook + Instagram @mespoilusofficiel** ✅ (testé et confirmé fonctionnel)
7. `cron_state` marqué `done`
8. **Sofia supprimée de ce cron** - Elle a son propre cron dédié
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
| `/api/cron/cj-sync/canada-pet-care` | Tous les jours | 5h00 | -| `products` (scraping sitemap canadapetcare.com, ~82 produits, USD, 🇨🇦) |
| `/api/cron/blog` | Lun / Mer / Ven | 9h00 | Lucas + Marie | `articles` + Pexels Storage + **email notification** a `contact@mespoilus.com` |
| `/api/cron/social` | Lun / Mer / Ven | 9h30 | Emma | `social_posts` + webhook Facebook + **email notification** a `contact@mespoilus.com` |
| `/api/cron/finance` | **1er de chaque mois** | 8h00 | Antoine | `financial_reports` + **email rapport complet** a `contact@mespoilus.com` |
| `/api/cron/security` | **1er de chaque mois** | 8h00 | Nathalie + Maxime (parallele) | `security_logs` + `tech_reports` + **email audit** a `contact@mespoilus.com` — `maxDuration = 300` |
| `/api/cron/newsletter` | **Chaque vendredi** | 10h00 | Sofia | `newsletter_campaigns` + envoi Resend + **email confirmation** a `contact@mespoilus.com` |
| `/api/cron/prenoms` | **1er de chaque mois** | 7h00 | Thomas (Haiku) | `prenoms` (DELETE + INSERT, 5 animaux × 4 styles × 50 noms) + **email notification** a `contact@mespoilus.com` |
| `/api/cron/adoption-followup` | **Chaque samedi** | 19h00 | - | Email suivi déposant (animal adopté ?) |
| `/api/cron/adoption-cleanup` | Tous les jours | 3h00 | - | Soft delete annonces ≥60j (status=deleted, PII anonymises) + log activity_logs (meme si 0 annonces) |
| `/api/cron/adoption-social` | **Chaque mardi** | 19h00 | Emma | `social_posts` + webhook Make.com - Photo réelle annonce - Abandon si 0 annonces + **email notification** a `contact@mespoilus.com` |
| `/api/cron/breeds?batch=10` | **Chaque dimanche** | 7h00 | Haiku | `breeds` (10 races/run, 2 par catégorie interleaved) + **email notification** a `contact@mespoilus.com` |
| `/api/cron/daily-recap` | **Tous les jours** | 20h00 | - | Email recap journalier → `contact@mespoilus.com` : liste tous les logs du jour (`activity_logs`), stats (total, succes, erreurs, manquants, tokens), **heures en heure belge** + UTC entre parentheses. Section rouge si crons attendus absents des logs (detection par pattern dans `action`). Declenchable manuellement depuis CronLauncher. **20h UTC = 22h heure belge ete / 21h hiver**. Loggue lui-meme dans `activity_logs`. |
**⚠️ Fiabilité crons Vercel Hobby :** les crons sont tous reconnus (19 au total) mais Vercel Hobby n'a pas de retry. Un cron manqué est silencieux. Pour les crons critiques (blog, social), vérifier régulièrement Vercel Dashboard → Settings → Crons → Last execution.
**Daily-recap fiabilité :** en cas d'échec `sendEmail`, l'erreur est loggée dans `activity_logs` (agent Thomas, status error) pour traçabilité. Un non-déclenchement Vercel reste silencieux (pas de log du tout).
**Protection anti-doublons :**
- Finance → vérifie si `financial_reports.period` existe déjà pour ce mois → abandon si oui
- Newsletter → vérifie si une campagne `sent` existe dans les 5 derniers jours → abandon si oui
### Page admin Boutique (`/boutique-admin`)
- Onglets affiliés : `Tous` | `Awin` | `Amazon` | `CanadaPetCare`
- Quand onglet `Awin` sélectionné : **sous-filtre marchand** (pills) chargé depuis `/api/admin/products-merchants` — permet de filtrer par marchand Awin spécifique (Dogfy Diet, Maxi Zoo, Tuft & Paw, etc.)
- Bouton "Cacher/Afficher" sur chaque produit (admin) → table `products_hidden`
- Counts mis à jour en temps réel via `/api/admin/products-counts`

### Page admin Fiches races (`/races-admin`)
- Liste toutes les races avec statut (published/draft/pending), photo, actions
- **Bouton "Photo"** : upload ou URL → `PATCH /api/admin/breeds` avec `photo_url`
- **Bouton "Texte"** (bleu, icône FileText) : édition inline du contenu textuel de chaque fiche
  - Champs éditables : `excerpt`, `origine`, `poids`, `taille`, `esperance_vie`, `niveau_activite`, `description` (textarea HTML brut), `caractere` (tags séparés par virgules)
  - Données stockées dans colonne `content JSONB` de la table `breeds`
  - API `PATCH /api/admin/breeds` accepte `{ id, content }` pour mise à jour partielle
- Flash "Texte sauvegardé" et "Photo sauvegardée" après succès
- API `GET /api/admin/breeds` retourne aussi la colonne `content`

### CronLauncher - Pipelines manuels (Dashboard)
Bouton "🚀 Lancer un cron" → menu déroulant avec 8 pipelines + 2 panels de sync boutique + 1 import one-shot :
- **Sélecteur animal** : forcer un animal spécifique (chiens, chats, oiseaux, rongeurs, reptiles) ou Auto
- **Sélecteur type article** : Auto (rotation), Trending, Partenaire/Produit, Conseil pratique, **Fiche de race**, **Sélection produits**
- **Panel "Forcer un partenaire"** (`ForcedPartnerPanel`, replié par défaut, style violet) : sélection depuis liste PARTENAIRES → charge automatiquement tous les produits en boutique jusqu'à 500 (filtre `merchant_name ILIKE '%keyword%'` Supabase) + champ recherche produit + sélection radio par `affiliate_url` (unique, évite les doublons de nom) + champ codes promo libre + **image forcée** (upload fichier ou coller URL avec preview et détection d'erreur `onError`). Force `forcedType = 'affiliation'` dans le cron blog + injecte une contrainte absolue dans le prompt Lucas + section "CODES PROMO OBLIGATOIRES" dans le prompt Marie + mention explicite de la marque (`- Marque : X (mentionne ce nom nommément dans l'article)`). Partenaires disponibles : Dogfy Diet, Maxi Zoo, CanadaPetCare, Tuft & Paw.
| Pipeline | Agents | Ce qui se passe |
|----------|--------|-----------------|
| 📝 SEO + Blog + Réseaux | Lucas → Marie → Emma | Article publié + post Facebook (35s d'attente entre les 2 étapes) |
| 📊 Finance | Antoine | Rapport financier mensuel → `financial_reports` |
| 🛡️ Sécurité & Maintenance | Nathalie + Maxime | Audit sécurité + audit technique → `security_logs` + `tech_reports` |
| 💌 Newsletter | Sofia | Newsletter avec 3 derniers articles → générée + **envoyée automatiquement via Resend** |
| ✨ Prénoms animaux | Thomas (Haiku) | 50 prénoms par catégorie × 5 animaux → `prenoms` |
| 🐾 Adoption — Réseaux | Emma | Post Facebook + Instagram sur les dernières annonces d'adoption |
| ✨ Fiches races | Haiku | 10 fiches races générées → `breeds` |
| 📧 Récap quotidien | - | Email récap journalier → `contact@mespoilus.com` |
**Léa** : pas de cron - Répond à la demande sur sa page agent uniquement.
- **Sync Boutique Awin** (`AwinPanel`) : 7 catégories indépendantes, progression temps réel depuis `awin_sync_progress` — **fermé par défaut** (toggle ChevronDown)
- **Sync Boutique CJ** (`CJSyncPanel`) : déclenche `/api/cron/cj-sync/canada-pet-care` (scraper sitemap) - Générique, prêt pour futurs affiliés CJ
- **Import CanadaPetCare** (`CanadaPetCareImportPanel`) : scraping one-shot `/api/admin/import-canada-pet-care` - Utile pour import initial ou réimport forcé. Invalide le cache `/boutique` via `revalidatePath` après import.
- **Pipeline "Adoption — Réseaux"** : déclenche `/api/cron/adoption-social` — icône Heart rose, 1 étape (Emma → Facebook + Instagram)
### Page admin Produits affiliés (`/produits-admin`)
- Renommée "Produits affiliés" (était "Livres Amazon") - Sidebar icône `ShoppingBag`
- **Onglets affiliés** en haut : `Amazon Livres` | `CanadaPetCare` (extensible via `AFFILIATE_SOURCES`)
- **Amazon** : formulaire ajout livre (ASIN + image + prix + catégories animales), liste éditable avec catégories
- **CanadaPetCare** : liste lecture seule (image, nom, catégories, prix USD, lien externe, supprimer)
- API `/api/admin/products-list` : accepte `?merchant=` pour filtrer par marchand (défaut : `Amazon FR`)
### Images -Architecture
| Usage | Source | Stockage |
|-------|--------|---------|
| Images articles blog | **Pexels API** (`pexels.ts`) → fallback photo race (`breeds.photo_url`) | Supabase Storage `blog-images` / URL directe |
| Images posts sociaux | Meme image que l'article (lecture Supabase) | Supabase Storage `blog-images` |
| Hero page accueil (4 cases) | **Supabase `hero_photos`** - Round-robin `last_used_at` → fallback `breeds.photo_url` aleatoire | Supabase Storage `hero-photos` / URL directe |
| Categories "Par type d'animal" | **Supabase `hero_photos`** - 1 photo aleatoire par `animal_type` → fallback `breeds.photo_url` | Supabase Storage `hero-photos` / URL directe |
| Photos pages `/races` (5 categories) | **Supabase `hero_photos`** → fallback `breeds.photo_url` aleatoire | Supabase Storage `hero-photos` / URL directe |
| Photos agents (pages `/agents/[agent]`) | Unsplash `getPhotoForAgent()` | Affiche direct (non stocke) |
**Fallback breeds :** quand `hero_photos` ou Pexels ne fournissent pas d'image, on pioche une photo aleatoire parmi les races publiees avec `photo_url` non null (`breeds` table). 120+ photos disponibles. Zero depend externe.
**Pourquoi Pexels pour blog/social :** Unsplash interdit le telechargement et le stockage serveur (ToS) → 403 Forbidden. Pexels l'autorise explicitement.
**Pourquoi Supabase pour hero/categories :** controle total, rotation automatique, pas de dependance externe, API transformation Supabase NON disponible sur plan gratuit → utiliser URLs directes `/object/public/`.
**Credits :** `Photo Photographer / Pexels` sur les articles.
**`unoptimized` sur toutes les images dynamiques :** prop ajoutee sur tous les composants `<Image>` affichant des URLs Supabase Storage (races, blog, adoption, hero, categories). Evite les transformations Vercel (quota Hobby : 5 000/mois). Les images Supabase sont deja des JPEG/WebP optimises — aucun impact visuel.
### Make.com -Réseaux sociaux
- Scénario linéaire : Webhook → **Facebook Pages + Instagram for Business** (@mespoilusofficiel)
- Instagram reconnecté via Meta Business Suite (compte `@mespoilus` banni → nouveau compte `@mespoilusofficiel` lié à la Page Facebook)
- Payload webhook : `{ content (sans hashtags), hashtags (string), image_url (URL Supabase Storage) }`
- `image_url` omis du payload si null → évite les erreurs Make.com `Missing required parameter`
### Post-processing streaming (`src/lib/agents/runner.ts`)
**Architecture :** `maxDuration` par route cron : 60s pour les routes simples (social), 120s pour blog/newsletter, **300s pour security (Nathalie + Maxime en parallèle) et prenoms/breeds** — Vercel Hobby permet 1-300s. Solution streaming : appel à `/api/internal/save-agent-data` (route interne, timeout propre).
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
- Marie → strip code fence, parse frontmatter, **anti-doublon** (verifie slug existant avant INSERT), si `overrideImageUrl` fourni utilise cette image (sinon `getPhotoForCategory` Pexels 4s timeout → fallback `breeds.photo_url` aleatoire si Pexels echoue), upsert `articles`
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
- Accepte `overrideImageUrl?: string` dans le body — si fourni, skip le fetch auto d'image
- Sinon : cherche `image_url` sur l'article le plus récent avec image (Supabase)
- **Filtre URL** : n'utilise que les URLs commençant par `NEXT_PUBLIC_SUPABASE_URL` (Supabase Storage) → rejette les CDN externes (Awin, etc.) que Instagram refuse
- Fallback : `getPhotoForCategory` Pexels → stockage dans Supabase Storage
- INSERT `social_posts` (facebook + instagram)
- Webhook Make.com avec `image_url` uniquement si non null

**`executeAgentTask(agentId, task, context?, overrideImageUrl?)`** :
- 4e param optionnel `overrideImageUrl` — passé à `saveSocialPost` quand `agentId === 'emma'`
- `saveSocialPost(content, overrideImageUrl?)` : transmet l'override à `save-social-post`
### Blog public (`/blog`)
- Articles sauvegardés automatiquement dans Supabase
- Images stockées dans Supabase Storage `blog-images`
- Filtres par catégorie : chiens, chats, oiseaux, rongeurs, reptiles, **general** (+ page `/blog/general` avec métadonnées SEO)
- Catégorie `general` : articles transversaux, boutique, sujets multi-animaux
- **Pages articles (`/blog/[slug]`) : thème clair** (`bg-gray-50`, texte `#111827`) - Prose Tailwind light + `.article-content` CSS light dans `globals.css`
- Liens articles : soulignés en ambré (`text-decoration: underline`, `text-underline-offset: 3px`) via `.article-content a` dans `globals.css`
- Hero image + gradient overlay + crédit photographe Pexels cliquable
- SEO complet (meta, OG, Twitter Card, Schema.org JSON-LD)
- Sitemap dynamique, robots.txt
- **Toggle grille/liste** (`BlogPostsGrid.tsx`) : bouton LayoutGrid/List en haut de la section articles, préférence `localStorage('blog-view')`. Prop `showFeatured` : `true` sur pages catégories sans recherche, `false` si recherche active. ListRow : thumbnail 64×64, badge catégorie coloré, titre tronqué, extrait, date + temps de lecture. Fonctionne sur `/blog` ET `/blog/chiens`, `/blog/chats`, etc. via `_category-page.tsx`
### Sécurité
- Rate limiting : 60 req/min global, 10 req/min par agent
- Détection : SQL injection, XSS, path traversal, LFI
- Blocage IP automatique (mémoire + Supabase `blocked_ips`)
- Headers de sécurité sur toutes les routes
- **RLS activé sur toutes les tables** ✅
  - `articles` → policy SELECT `status = 'published'` (lecture publique)
  - `products` → policy SELECT `true` (lecture publique totale — colonne `in_stock` supprimée)
  - Toutes les autres tables → RLS activé sans policy (accès anon bloqué, service role bypass)
- Les rapports Nathalie/Maxime sont informatifs uniquement - Pas de corrections automatiques
- Workflow mensuel : lire les rapports du 1er du mois → appliquer les corrections manuellement
- **Protection temps réel** : c'est le middleware qui bloque les IPs, détecte SQLi/XSS, rate limiting - Pas Nathalie
- **Nathalie = auditrice mensuelle** : lit les logs enregistrés par le middleware et formule des recommandations
- **Sécurité compte admin** : mot de passe fort (20+ chars) ✅. MFA nécessiterait du code supplémentaire dans l'app.
### Base de données Supabase (25 tables)
`activity_logs` · `adoption_alerts` · `adoption_posts` · `agent_stats` · `article_comments` · `articles` · `awin_sync_progress` · `blocked_ips` · `breeds` · `cron_state` · `financial_reports` · `hero_photos` · `newsletter_campaigns` · `newsletter_subscribers` · `pdf_consents` · `pdf_downloads` · `pdf_guides` · `prenoms` · `products` · `products_hidden` · `security_logs` · `seo_reports` · `social_posts` · `support_logs` · `tech_reports`

**`products_hidden`** : PK `affiliate_url TEXT`. Produits exclus de la boutique publique. RLS service_role. Migration `src/lib/supabase/products_hidden.sql`.
**Colonne ajoutée :** `activity_logs.tokens_used INTEGER DEFAULT 0` - Migration : `src/lib/supabase/migration_tokens.sql` ✅
#### Colonnes clés `articles`
- `image_url` - URL publique Supabase Storage (ex: `https://xxx.supabase.co/storage/v1/object/public/blog-images/article-slug.jpg`)
- `image_alt`, `image_credit`, `image_credit_url` - Attribution photographe Pexels
- `categories TEXT[]` - Multi-catégories (array containment Supabase `@>`)
- `featured_partner TEXT` - Nom de la marque partenaire mise en avant (ex: "Tuft & Paw") — migration `migration_featured_partner.sql` ✅ — utilisé par le cron social pour le hashtag
- `promo_codes TEXT` - Codes promo associés à l'article (ex: "ESSENTIALS20 -20%, NEWHOME25 -25%") — migration manuelle : `ALTER TABLE articles ADD COLUMN IF NOT EXISTS promo_codes TEXT;` — utilisé par Emma dans le post social
#### Table `hero_photos`
- `id`, `url` (URL publique Supabase Storage), `alt`, `animal_type` (singulier ou pluriel - Normalisé via `ANIMAL_TYPE_MAP`), `active`, `last_used_at`, `created_at`
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
| `src/lib/supabase/migration_activity_stats_rpc.sql` | Fonction RPC `get_agent_stats_aggregated(start_of_month)` — agrégation stats dashboard cote DB (evite limite 1000 lignes Supabase) |
| `src/lib/supabase/migration_complete.sql` | Migration si schéma initial déjà appliqué |
| `src/lib/supabase/migration_categories.sql` | Colonne `categories TEXT[]` |
| `src/lib/supabase/migration_newsletter.sql` | Tables newsletter |
| `src/lib/supabase/migration_adoption.sql` | Table `adoption_posts` |
| `src/lib/supabase/migration_products.sql` | Table `products` (après clés Awin) |
| `src/lib/supabase/migration_cron_state.sql` | Table `cron_state` |
| `src/lib/supabase/migration_blog_images.sql` | Policies bucket `blog-images` |
| `src/lib/supabase/migration_agent_reports.sql` | Tables `seo_reports`, `tech_reports`, `support_logs` ✅ |
| `src/lib/supabase/migration_featured_partner.sql` | Colonne `featured_partner TEXT` sur `articles` - Anti-répétition partenaires 30 articles ✅ |
| `src/lib/supabase/migration_awin_categories.sql` | Colonne `categories TEXT[]` sur `products` + GIN index (⚠️ à exécuter) |
| `src/lib/supabase/migration_drop_in_stock.sql` | Supprime colonne `in_stock` de `products` + RLS `USING (true)` ✅ |
| `src/lib/supabase/products_hidden.sql` | Table `products_hidden` (PK affiliate_url) + RLS ✅ |
| `src/lib/supabase/migration_rls_awin_progress.sql` | RLS sur `awin_sync_progress` (⚠️ à exécuter) |
### Notifications email crons (`src/lib/cron-email.ts`)
- Helpers partagés pour les emails de notification de tous les pipelines cron
- `mdToHtml(md)` — convertit Markdown basique en HTML (titres, gras, italique, listes, code)
- `cronEmailWrapper(title, subtitle, body)` — enveloppe HTML commune (header orange dégradé, fond gris clair, footer)
- `statsRow(stats[])` — ligne de badges colorés (ex: "Generees: 5 / Restantes: 120 / Tokens: 12 345")
- `sectionBlock(title, content, borderColor?, bgColor?)` — bloc avec bordure colorée à gauche (titre + contenu HTML)
- `errorBlock(errors[])` — section rouge listant les erreurs (n'affiche rien si tableau vide)
- Utilisé par : cron blog, social, finance, security, newsletter, prenoms, adoption-social, breeds

### Newsletter (Sofia)
- `src/lib/resend.ts` - Client Resend via fetch natif
- Sofia génère HTML en JSON `{ subject, preview_text, content_html }`, sauvegardé en `draft`
- Cron automatique : **chaque vendredi à 10h UTC** via `/api/cron/newsletter`
  1. Sofia génère le contenu → sauvegardé en `newsletter_campaigns` (draft)
  2. Récupère tous les abonnés `newsletter_subscribers` actifs
  3. Envoie via Resend à chaque abonné avec lien désabonnement unique
  4. Marque la campagne `sent`
- Lien désabonnement : `/api/newsletter/unsubscribe?t=<base64url(email)>` → page `/newsletter/unsubscribe`
- Année copyright injectée dynamiquement dans le prompt Sofia
- Protection anti-doublons : skip si campagne envoyée dans les 5 derniers jours
### Adoption animaux (`/adoption`) — Feature complète ✅
#### Pages publiques
- **Listing** `/adoption` : filtres par type + filtres dynamiques sur la même ligne, barre de recherche (race/description/région), **toggle grille/liste** (`AdoptionPostsGrid.tsx`, `localStorage('adoption-view')`), bouton "Déposer"
  - Filtres dynamiques (`AdoptionFilters.tsx`) : pays, sexe, race, âge — affichés dans le même flex que les boutons de type animal, séparés par un trait vertical, options cascadantes (filtre par les params actifs → options disponibles = subset du résultat filtré)
  - `getAvailableFilters(animal, pays, gender, race, ageUnit)` : applique les mêmes filtres que `getPosts()` avant d'extraire les valeurs distinctes — les dropdowns ne montrent que les options encore valides
- **Détail** `/adoption/[id]` : galerie photos (slider + miniatures), fiche lisible (Race/Âge/Sexe/Ville/Description/Raison du don), contact privé via formulaire (reply-to visiteur), suppression par code (discrète, alignée à droite), `max-w-6xl`
- **Dépôt** `/adoption/deposer` : bloc info (données privées, suppression auto 60j, code de suppression), formulaire 3 colonnes `max-w-4xl`
- **Suppression** `/adoption/supprimer?id=X&token=Y` : page de confirmation avec 2 boutons de raison (animal adopte / erreur), puis confirmation → soft delete + anonymisation RGPD. Suspense boundary (Next.js 14)
#### Formulaire de dépôt (`AdoptionPostForm.tsx`)
- Photos : 2 min, 5 max, preview avec suppression individuelle
- Téléphone : dropdown custom (bouton flag image `flagcdn.com` + code, recherche par nom de pays, séparateur visuel) — zero initial retiré en temps réel (`replace(/^0+/, '')`)
- Âge : **obligatoire**, nombre 1–99 + select mois/ans → stocké `"3 mois"` ou `"2 ans"`
- **Type "Autre"** : quand sélectionné, le champ "Race/Espèce" devient "Quel animal ? *" (obligatoire) — placeholder "ex : Cheval, Cochon, Araignée…" (animaux hors des 5 catégories). Valeur stockée dans `breed`.
- Indicatif dérivé de l'emoji via `flagToISO()` (Unicode Regional Indicator → ISO 2 lettres → `flagcdn.com/20x15/{iso}.png`)
- Pays : liste 35 pays francophones + option **"Autre"** → affiche un champ texte libre "Quel pays ?" si sélectionné, valeur résolue avant envoi
- Submit : `contact_phone: \`${indicatif} ${num.replace(/^0+/, '')}\`` combiné avant envoi
#### API routes adoption
| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/adoption/submit` | POST | Validation complète (âge, téléphone, photos ≥2, reason ≥10 chars), insert DB, emails déposant + admin |
| `/api/adoption/upload` | POST | Upload photo Supabase Storage `adoption-photos` (5 Mo max) |
| `/api/adoption/post` | GET | Fetch annonce approuvée par id (champs publics + reason) |
| `/api/adoption/contact` | POST | Message visiteur → déposant via email (`replyTo: from_email`) — email déposant jamais exposé |
| `/api/adoption/delete` | POST | Vérification token, **soft delete** (`status='deleted'`, `deleted_by='user'`, `deleted_reason='adopted'\|'error'`, PII anonymises `poster_name='Anonymise'`, `email='supprime@mespoilus.com'`, `contact_info=null`) |
| `/api/adoption/forgot-token` | POST | Renvoie code + lien direct `/adoption/supprimer?id=X&token=Y` par email (anti-énumération) |
#### Emails (tous via Resend, aucun "répondez à cet email")
- Soumission → déposant : confirmation + `contact@mespoilus.com` pour questions
- Soumission → admin : notification avec lien `/adoption-admin`
- Approbation → déposant : annonce en ligne + code de suppression (monospace 26px)
- Refus → déposant : raison incluse, contact `contact@mespoilus.com`
- Contact visiteur → déposant : message + `replyTo: from_email` (répondre va au visiteur)
- Forgot-token → déposant : code + bouton "Supprimer mon annonce" (lien direct)
- Follow-up → déposant : email chaque samedi si annonce ≥7j, bouton supprimer si adopté
- Expiry → déposant : email avant suppression auto à 60j
#### Modération admin (`/adoption-admin`)
- **4 tabs** : En attente / Approuvees / Rejetees / Supprimees (badge count sur "En attente")
- **Filtre animal** sur tous les onglets : Tous / Chiens / Chats / Oiseaux / Rongeurs / Reptiles / Autre
- **Filtre raison** (onglet Supprimees uniquement) : Tous / Adopte (Heart) / Supprime utilisateur (User) / Supprime auto 60j (Bot)
- URL params : `?status=deleted&animal=chien&reason=adopted`
- Cards supprimees : badge raison colore + timestamp `deleted_at`, PII masques (poster_name, email, contact_info non affiches), pas de boutons d'action
- Admin peut supprimer une annonce (soft delete : `status='deleted'`, `deleted_by='admin'`, `deleted_reason='admin'`)
- Cards : 5 photos en grille, fiche (animal, race, age, ville, par/email/tel), description, raison (amber), boutons
- Actions pending : Approuver (genere delete_token 8 chars hex) / Rejeter (raison obligatoire → email)
- Actions toutes cartes (sauf supprimees) : **Modifier** (→ `/adoption-admin/[id]/edit`) / **Supprimer** (confirm() cote client via `DeletePostButton.tsx`)
- Page edit `/adoption-admin/[id]/edit` : formulaire pre-rempli tous champs + statut, server action redirect
- Badge sidebar : count `pending` fetchee server-side dans `RootLayout`, passe via props a Sidebar, refresh 60s
#### Alertes adoption par email ✅
- Table `adoption_alerts` : `email`, `animal` ('tous'/'chien'/…), `country` ('tous'/'Belgique'/…), `confirmed`, `confirm_token` (UUID, sert aussi de token désinscription)
- **Double opt-in RGPD** : email confirmation envoyé à l'inscription, alerte active seulement après clic
- **Bouton flottant** `fixed bottom-6 right-6` sur `/adoption` → modal avec sélecteurs animal + pays
- Si déjà confirmé pour mêmes critères → message "déjà inscrit" sans écraser
- **Envoi automatique** à chaque approbation en modération : filtre `animal IN (post.animal_type, 'tous')` + `country === 'tous' OR post.region.includes(alert.country)`, email avec lien désinscription
- **Désinscription** : lien dans chaque email d'alerte + dans l'email de confirmation → `GET /api/adoption/alerts/unsubscribe?token=xxx` → suppression immédiate
- **Nettoyage** : inscriptions `confirmed=false` de plus de 7 jours supprimées par le cron `adoption-cleanup` quotidien
- Section 2.6 ajoutée dans politique de confidentialité
- Migration : `migration_adoption_alerts.sql`

#### Crons adoption (`vercel.json`)
| Route | Schedule | Description |
|-------|----------|-------------|
| `/api/cron/adoption-followup` | `0 19 * * 6` (samedi 19h) | Annonces approuvées ≥7j → email "animal adopté ?" avec bouton supprimer. Récurrent chaque samedi (`followup_sent_at IS NULL OR <= 6 days ago`). **Loggue toujours dans `activity_logs`** (0 ou N emails envoyés) |
| `/api/cron/adoption-cleanup` | `0 3 * * *` (quotidien 3h) | Annonces approuvées ≥60j → email expiry → **soft delete** (`status='deleted'`, `deleted_by='cron'`, `deleted_reason='auto_expired'`, PII anonymisés). **Loggue toujours dans `activity_logs`** meme si 0 annonces. **+** suppression alertes `confirmed=false` de plus de 7j |
| `/api/cron/adoption-social` | `0 19 * * 2` (mardi 19h) | Emma publie un post Facebook/Instagram sur les 3 dernières annonces approuvées. **Abandon automatique si aucune annonce.** Bypass `executeAgentTask` → `runAgent` direct pour contrôler l'image (photo réelle de l'annonce, Supabase Storage). Prompt Emma avec type, race, âge, sexe, ville, description, lien annonce individuel + lien global. Un seul webhook Make.com. |
#### Colonnes Supabase `adoption_posts` ajoutées
```sql
ALTER TABLE adoption_posts ADD COLUMN IF NOT EXISTS delete_token TEXT;
ALTER TABLE adoption_posts ALTER COLUMN contact_info DROP NOT NULL;
ALTER TABLE adoption_posts ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ;
ALTER TABLE adoption_posts ADD COLUMN IF NOT EXISTS reason TEXT;
-- Soft delete + RGPD (migration_adoption_soft_delete.sql)
ALTER TABLE adoption_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE adoption_posts ADD COLUMN IF NOT EXISTS deleted_reason TEXT; -- 'adopted' | 'error' | 'auto_expired' | 'admin'
ALTER TABLE adoption_posts ADD COLUMN IF NOT EXISTS deleted_by TEXT;    -- 'user' | 'cron' | 'admin'
```
- `email` colonne NOT NULL → anonymisation via `'supprime@mespoilus.com'` (placeholder RGPD)
- Annonces supprimees non visibles sur le site (filtres `status=eq.approved` auto-excluent `status=deleted`)
### Blog (`/blog`) et Boutique (`/boutique`) - Harmonisation bannières ✅
- Header `text-3xl`, layout `py-6 space-y-5`, filtres pills `px-3 py-1.5`
- Bannière catégorie : `h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900` (même style que les pages catégories)
- **Suppression Unsplash** des deux pages (plus aucune dépendance Unsplash sur `/blog` et `/boutique`)
- **Boutique** : `BoutiquePartenairesCarousel` supprimé - Partenaires gérés uniquement via `PartenairesBandeau` dans LayoutShell
### Boutique (`/boutique`) -Architecture Awin
- **Thème clair** (`bg-gray-50`, cards `bg-white`)
- Filtres par catégorie (chiens, chats, oiseaux, rongeurs, reptiles, **livres**), barre de recherche, disclaimer affiliation barre fixe en bas
- **Pagination** : 48 produits/page, param `?page=N`, compte exact via requête Supabase parallèle `{ count: 'exact', head: true }`
- **Tri client** : `BoutiqueSortSelect.tsx` (select) avec 4 options via param `?sort=` : `stock` (dispo en premier + prix asc, défaut), `price_asc`, `price_desc`, `name_asc`
- **Filtre admin affilié** : panel amber visible uniquement si session admin connectée -liste des marchands par catégorie, param `?affiliate=Merchant+Name`. `getMerchants()` fait 2 requêtes : existence check pour marchands connus non-Awin (`Amazon FR`, `CanadaPetCare`) + requête dynamique pour marchands Awin (limit 5000). Évite la limite de lignes Supabase qui tronquait les résultats sur "Tous".
- **Table `products_hidden`** : liste de `affiliate_url` (PK) à exclure de la boutique publique. Migration `migration_products_hidden.sql`. Produits cachés filtrés côté boutique via sous-requête Supabase.
- **Bouton "Cacher" admin** : visible sur chaque card produit si admin connecté, cache/décache via `/api/admin/products-hidden` (POST/DELETE). Badge "Caché" sur les produits cachés.
- API `/api/admin/products-hidden` : GET liste, POST cache, DELETE décache
- API `/api/admin/products-counts` : counts par affilié/marchand pour les badges
- API `/api/admin/products-merchants` : liste des marchands Awin distincts (pour sous-filtre)
- **Toggle grille/liste** (`BoutiqueProductsGrid.tsx`) : bouton LayoutGrid/List en haut de la grille produits, préférence `localStorage('boutique-view')`. ListRow : thumbnail 64×64, drapeau + marchand, nom tronqué, description, prix, bouton "Voir"
- `ProductCard` : image `unoptimized` (CDN Awin externe), nom, description, prix + devise, drapeau marchand, bouton "Voir" (orange). Pas de filtre ni badge stock — tous les produits sont affichés
- **Drapeaux** via `flagcdn.com` : table override `MERCHANT_COUNTRY` pour cas connus (ex: `'tuft & paw' → 'us'`, `'canadapetcare' → 'ca'`), puis suffixe marchand (`Zooplus FR` → fr), puis devise (USD→us, CAD→ca, GBP→gb). EUR sans pays connu = pas de drapeau
- Cron sync Awin : **7 crons par catégorie** (2h-4h UTC, 20min d'écart), reset catégorie + réinsertion depuis feeds Awin
- Disclaimer affiliation barre fixe en bas (bg-white/95)
- Filtre boutique : `.contains('categories', [category])` (array containment) - Un livre sur chien apparaît dans "Tous", "Chiens" ET "Livres"
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
- **Lien Accueil** : premier item nav (icône `Home`, href `/`) - Accès direct au site public
- **Fermable** : bouton `ChevronLeft` dans le header sidebar pour fermer, bouton `Menu` flottant `fixed left-3 top-4` pour rouvrir. Transition `translate-x-0` / `-translate-x-full` (300ms). `ml-64`/`ml-0` sur le `<main>` synchronisé via `sidebarOpen` dans `LayoutShell`.
- **Badge modération** : pastille orange sur l'item "Adoption" (lien `/adoption-admin`) affichant le nombre d'annonces `pending`. Route `/api/admin/pending-count` (GET → `{ count: number }`). Consultée au chargement + toutes les 60s (setInterval).
- **Routes admin renommées** : `/moderation` → `/adoption-admin`, `/gestion-blog` → `/blog-admin`, `/gestion-races` → `/races-admin`, `/produits` → `/produits-admin`
- **Typographie agents agrandie** : nom `text-sm`, rôle `text-xs`, icône `size=17`
#### Interface `Partenaire` (`src/lib/partenaires.ts`)
- `pays: string[]` (codes ISO), `network: 'awin' | 'cj'`
- `tagColor` (classes Tailwind, pour PartenairesSection et BoutiquePartenairesRotating)
- `tagBg` / `tagText` (valeurs CSS hex, pour BoutiquePartenairesCarousel -inline styles)
- Partenaires actifs : **Dogfy Diet** (Awin, FR, chiens), **Maxi Zoo** (Awin, FR+BE -picker pays popup), **CanadaPetCare** (CJ, CA/US, chiens+chats), **Tuft & Paw** (Awin, US 🇺🇸, chats - `recommend: false`)
- **Maxi Zoo** : `urlsByCountry: { FR: awinmid=68698, BE: awinmid=68696 }` - Clic ouvre un popup (bandeau) ou modal (section) pour choisir FR 🇫🇷 ou BE 🇧🇪
- **Tuft & Paw** : tag `'Litière, Nourriture & Mobilier'`, description inclut litière + nourriture fraîche + mobilier design, `recommend: false` → exclue de la section "Nos recommandations" landing
- CanadaPetCare : produits dans boutique via scraping sitemap (pas de section partenaire dédiée)
- **Champ `recommend?: boolean`** sur l'interface `Partenaire` : `false` → exclu de `PartenairesSection.tsx` (filtre `p.recommend !== false`)
- Carousel actif à partir de **3 partenaires** (flèches + animation)
#### Fix Tailwind config
- `./src/lib/**/*.{js,ts,jsx,tsx}` ajouté au `content` de `tailwind.config.ts`
- Nécessaire pour que les classes définies dans `partenaires.ts` soient compilées (tagColor pour PartenairesSection)
### Google Analytics & AdSense
- GA `G-QE9XSS18YQ` - Chargement conditionnel RGPD
- AdSense `ca-pub-3549294158319032` - En attente approbation
- Emplacements : blog liste, blog article, adoption, accueil

### Monitoring erreurs - Sentry ✅
- **Package** : `@sentry/nextjs` v10 + `@sentry/profiling-node`
- **DSN** : `https://be2b25d58b9617d48f5102aefe1b9487@o4511412620689408.ingest.de.sentry.io/4511412634189904` (region EU/Allemagne)
- **SENTRY_AUTH_TOKEN** : dans `.env.sentry-build-plugin` (gitignored) + variable Vercel (Production+Preview)
- **Fichiers de config** :
  - `sentry.server.config.ts` : init serveur, `nodeProfilingIntegration()`, logs + profiling activés
  - `sentry.edge.config.ts` : init edge, logs activés
  - `src/instrumentation.ts` : register() charge server/edge config
  - `src/instrumentation-client.ts` : init client, `browserProfilingIntegration()`, logs + profiling activés
  - `src/app/global-error.tsx` : error boundary React global
- **Fonctionnalites actives** :
  - Erreurs : captures automatiquement (client + serveur + edge), email alerte sur chaque nouvelle issue
  - Traces : `tracesSampleRate: 1` (100% des pages tracees)
  - Profiling : `profilesSampleRate: 1` (server via Node.js, client via browser)
  - Logs : `enableLogs: true` + `consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })` sur server + client + edge — capture automatique des `console.log/warn/error`
  - Source maps : uploadees a chaque deploy Vercel via `withSentryConfig`
- **Alertes email** : regle configuree dans Sentry dashboard, notifie `contact@mespoilus.com` (membre recently active) a chaque nouvelle issue
- **Metrics** : non disponibles sur plan gratuit Sentry
- **Sentry trace data** : injecte dans les metadata via `Sentry.getTraceData()` dans `layout.tsx`
### SEO & Indexation
- Sitemap dynamique, robots.txt (`disallow`: `/dashboard/`, `/agents/`, `/orchestrate/`, `/adoption-admin/`, `/blog-admin/`, `/races-admin/`, `/produits-admin/`, `/boutique-admin/`, `/guides-admin/`, `/api/`, `/login`), Schema.org JSON-LD
- Google Search Console vérifié + sitemap soumis
- Bing Webmaster Tools vérifié + sitemap soumis
- **Sitemap images** : `image_url` (articles) et `photo_url` (races) inclus dans sitemap → indexation Google Images. Dynamique : nouvelles images apparaissent automatiquement ✅
- **Schema markup enrichi** : articles → `ImageObject` avec `alt` + `logo` publisher ; races → JSON-LD `Article` complet ajoute (etait absent) ; `www.` corrige dans fallback appUrl articles. Valide via Google Rich Results Test (1 element valide detecte). Note : le bot du Rich Results Test retourne parfois "acces impossible" sur les pages ISR Vercel avant premiere visite — le vrai Googlebot indexe normalement via sitemap ✅
### next.config.mjs
- `poweredByHeader: false` — supprime le header `X-Powered-By: Next.js` (info leak)
- `remotePatterns` : `images.unsplash.com` + `images.pexels.com` + `*.supabase.co` + `cdn.shopify.com` + `flagcdn.com`
- **Headers de securite** : `X-DNS-Prefetch-Control`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Document-Policy: js-profiling` (requis pour Sentry browser profiling)
- **CSP (Content-Security-Policy)** : `script-src` inclut Google, AdSense, Maps, Pinterest (`s.pinimg.com` + `ct.pinterest.com`) ; `connect-src` inclut Supabase, Anthropic, Google Analytics, Sentry (`*.ingest.de.sentry.io` + `*.ingest.sentry.io`), Google CSI (`csi.gstatic.com`), Pinterest ; `frame-src` inclut Google Ads + Pinterest
- **Sentry config** : `withSentryConfig` wrapper, `widenClientFileUpload: true`, `automaticVercelMonitors: true`, source maps uploadees en CI uniquement (`silent: !process.env.CI`)
- **Google Maps** : parametre `loading=async` ajoute dans `RefugeFinderPanel.tsx` et `VetFinderPanel.tsx` (supprime warning performance)
- **Accessibilite formulaires** : `id` + `name` ajoutes sur tous les inputs/selects sans attributs — search bars (blog, adoption, races, boutique), newsletter (`autocomplete="email"`), refuge finder (adresse + rayon), vet finder (adresse + rayon). `<noscript>` Pinterest supprime (warning preload)
- **Pinterest** : tag de tracking conserve (`s.pinimg.com/ct/core.js`), seul le `<noscript>` fallback img supprime
### Déploiement
- Repo GitHub : `BauwensThomas/mespoilus`
- CI/CD : Vercel -déploiement automatique sur push `main`
- Git author : `Bauwens Thomas <contact@mespoilus.com>`
---
## Actions manuelles restantes

### Guides PDF ✅
- ✅ Migration `pdf_guides` exécutée (table + données seedées)
- ✅ Bucket `pdf-guides` créé (privé, application/pdf uniquement)
- ✅ 10/10 PDFs uploadés dans Supabase Storage
### Migrations Supabase en attente ⚠️
- ✅ `migration_awin_categories.sql` — colonne `categories TEXT[]` + GIN index sur `products` (vérifié en DB)
- ✅ `migration_rls_awin_progress.sql` — RLS sur `awin_sync_progress` (vérifié : anon=[], service_role=données)
- ✅ `migration_activity_stats_rpc.sql` — fonction RPC `get_agent_stats_aggregated` exécutée en DB

### Actions manuelles en attente ⚠️
- ✅ **SQL Supabase** : faux positifs Maxi Zoo supprimés + colonne `product_type` migrée + Amazon FR tagué `livres`
- ✅ **Livres Amazon** : ~2 par catégorie animale minimum atteint
- **Amazon Associates** : générer 3 ventes dans les 180 jours pour valider le compte et débloquer l'API PA
- **120 races générées + photos ajoutées** ✅ — 70 nouvelles races en DB à partir du 25 mai 2026 (cron breeds bloqué avant cette date)
- ✅ **Migration article_comments** : exécutée dans Supabase Dashboard
- ✅ **Budget cap Anthropic** : limite mensuelle fixée à 20 € sur console.anthropic.com
- **Next.js upgrade** : vulnérabilités npm détectées (1 high, 1 moderate) sur Next.js 14.2.35 — fix = upgrade vers Next.js 15/16 (breaking change, à planifier)

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
- Rotation type d'article cron blog : 5 types (trending, affiliation, pratique, race, **best_of**) via `(nb_articles_animal + offset) % 5` — offset par animal pour diversité simultanée + override manuel CronLauncher
- Type **race** : Lucas choisit la meilleure race SEO (non encore couverte en priorité) depuis breeds table (photo + content requis) → Marie intègre lien fiche race → image = photo_url Supabase → breed_slug enregistré dans articles
- Type **best_of** : Lucas choisit un sujet "Meilleur X pour [animal]" à fort potentiel SEO/affiliation → Marie rédige top 3-5 produits avec liens Awin si dispo + liens recherche Amazon (`amazon.fr/s?k=...&tag=mespoilus-21`). Pas de fallback nécessaire (Amazon links toujours disponibles)
- Cron blog passe en `?auto=true` : animal = catégorie avec le moins d'articles publiés (plus de rotation fixe)
- Liens articles/prompts unifiés en `https://www.mespoilus.com/...` partout (blog, social, adoption, newsletter crons)
- Migration `migration_article_breed.sql` à exécuter : `ALTER TABLE articles ADD COLUMN breed_slug text`
- Page `/blog/[slug]` : `export const dynamic = 'force-dynamic'` (toujours lire DB fraîche, pas de cache)
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
- **Commentaires articles blog** ✅ : formulaire (prénom + texte, max 1000 chars) sur `/blog/[slug]`, table `article_comments` (status: pending/approved/rejected), API `POST /api/comments/submit` (rate-limit 5/h), section commentaires approuvés affichée au-dessus du formulaire, modération via **`/gestion-blog`** (approuver/rejeter), migration `migration_article_comments.sql` ✅ exécutée
- **Feature "Fiches races"** : pages `/races`, `/races/[animal]`, `/races/[animal]/[slug]`, cron Haiku génération breeds, table `breeds` Supabase ✅
  - `/races` : 5 catégories en cartes portrait avec photos `hero_photos` + fallback gradient
  - `/races/[animal]` : grille **6 colonnes** (`lg:grid-cols-6`), barre de recherche (`?q=`), bannière orange standard, toggle liste/grille, **photos individuelles par race** depuis `breeds.photo_url`, **`revalidate = 3600`**. **Onglets filtres** : Toutes / Appartement / Enfants / Débutants / Seniors
  - `/races/[animal]/[slug]` : photo depuis `breed.photo_url`, photo `aspect-[3/4] max-w-xs` centrée, bannière orange, container `max-w-4xl`, stats + caractère + convient_pour + description + soins, **`revalidate = 3600`**
  - `/races/[animal]/appartement|enfants|debutants|seniors` : **20 pages filtres** (5 animaux × 4 critères) — filtre JS sur `content.convient_pour`, onglets actifs (sans breadcrumb), barre de recherche `?q=` + toggle vue, JSON-LD `CollectionPage` (dans le div H1 pour eviter gap space-y-5), metadata uniques, dans sitemap, `generateStaticParams`, `searchParams` transmis depuis chaque wrapper ✅
  - Cron `/api/cron/breeds` : Haiku 4.5, max_tokens=4096, **1×/semaine dimanche 7h UTC**, batch 10, upsert `animal,slug`, nettoyage JSON robuste + repair, logs JSON complets sur erreur parse
  - **`BREEDS_SEED` : 190 races** (80 chiens, 45 chats, 25 oiseaux, 23 rongeurs, 17 reptiles) — nouvelles races ordonnées **2 par catégorie par semaine** (interleaved)
  - Toggle grille/liste via `?view=list` URL param (composant `ViewToggle.tsx` partagé)
  - **Colonne `photo_url TEXT`** sur `breeds` : migration `migration_breeds_photo.sql` ✅ exécutée
  - **Page admin `/gestion-races`** : liste toutes les races publiées (tous animaux), filtre par onglet, carte rouge si pas de photo, upload fichier (FileReader base64 preview) ou URL (téléchargée vers Supabase Storage), delete photo, sauvegarde via `PATCH /api/admin/breeds`, dispatch `breed-photo-updated`
  - **Badge rouge sidebar** : nombre de races sans photo, `breeds-no-photo-count` API (`force-dynamic`), refresh au mount + 60s + event `breed-photo-updated`
  - `/gestion-races` protégé : ajouté dans `ADMIN_PAGE_PREFIXES` (middleware) et `ADMIN_PREFIXES` (LayoutShell)
  - **"Bulldog Français" → "Bouledogue Français"** (breeds-list.ts + DB)
- **Toggle grille/liste unifié** (`ViewToggle.tsx`) : composant client partagé, même couleur orange-600 sur adoption/boutique/races, placé à droite de la barre de recherche via `justify-between` ✅
- **Boutique** : texte "Vous ne trouvez pas..." déplacé à côté du tri, `ViewToggle` en `ml-auto` tout à droite ✅
- **Homepage outils** : 6 outils en grille 2 colonnes `grid-cols-1 sm:grid-cols-2`, 3 lignes, cartes horizontales fines (`p-4 flex items-center gap-4`), meme largeur que les autres sections (`px-6 / max-w-6xl mx-auto`) ✅
- Tirets longs (—) retirés des textes visibles sur toutes les pages publiques ✅
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
- Filtres catégories blog : OR sur `category` ET `categories[]` - Articles visibles sur toutes les pages catégories
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
- **Outils publics** : 5 outils + guides accessibles via dropdown "Outils" dans le header public ✅
  - Calculateur d'âge (`/outils/age`) : **5 catégories site** (chien, chat, oiseau, rongeur, reptile) - Formules spécifiques par animal, slider, résultat gradient orange, `max-w-6xl`
  - Ration journalière (`/outils/nutrition`) : calculateur RER/MER vétérinaire — chien/chat, poids, stade (chiot/adulte/senior), stérilisation, activité (sédentaire/normal/actif), type alimentation (croquettes/pâtée/mixte 50-50), kcal/100g éditables, `max-w-6xl` ✅
  - Quiz "Quel animal pour moi ?" (`/outils/quiz`) : 6 questions, 5 animaux scorés, progression automatique 300ms, résultat avec conseils, `max-w-6xl`
  - Générateur de prénom (`/outils/prenom`) : 5 animaux × 4 styles - Tirage aléatoire de 6, grille 3 cols, **connecté à la table Supabase `prenoms`** (fallback statique si vide), badge "Mis à jour ce mois-ci" si données DB actives
  - Guides PDF gratuits (`/guides`) : page liste avec modal email + download sécurisé, `max-w-6xl`
  - **Trouver un vétérinaire** (`/outils/veterinaire`) : `VetFinderPanel.tsx`, panel pleine largeur mobile / `min(88vw,600px)` desktop, geocoding via **Nominatim** (OpenStreetMap, gratuit, pas de clé API), autocomplete dropdown debounce 600ms, bouton "Ma position" (géolocalisation navigateur), sélecteur rayon, carte Google Maps JS API avec cercle de recherche + marqueurs (Places API nearbySearch), résultats avec lien `maps/search/?api=1&query_place_id=` (compatible mobile), contours carte blancs arrondis ✅
  - **next.config.mjs** : `Permissions-Policy: geolocation=(self)` (était `()` → bloquait toute géolocalisation), CSP `connect-src` + `fundingchoicesmessages.google.com` ajouté ✅
  - **Politique de confidentialité** : section 2.9 "Outil Trouver un vétérinaire (Google Maps)" + géolocalisation dans table base légale + Google Maps Platform dans sous-traitants ✅
  - Clé API : `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps JS API + Places API activées dans Google Cloud Console)
- **Cron mensuel prénoms** : `/api/cron/prenoms` (1er du mois, 7h UTC) - Thomas génère 50 prénoms par animal (5 animaux × 4 styles) via Claude Haiku, DELETE+INSERT full refresh, logActivity ✅
  - Table `prenoms` : `(animal TEXT, style TEXT, names TEXT[], generated_at TIMESTAMP, PRIMARY KEY(animal, style))`, RLS public SELECT
  - CronLauncher : pipeline "Prénoms animaux" (pipeline #5) avec icône Sparkles
- **Header public avec menu hamburger** ✅
  - Breakpoint hamburger : **`md` (768px)** -nav desktop visible ≥768px, hamburger visible <768px
  - Mobile menu : dropdown absolu avec tous les NAV_LINKS + section Outils repliable (useState `toolsOpen`)
  - `PartenairesBandeau` : `hidden md:flex` (masqué sur mobile)
  - Boutique : `whitespace-nowrap` (toujours visible)
- **Homepage "Outils pratiques"** : 6 cartes (Ration journalière, Calculateur d'âge, Quiz, Générateur prénom, Guides PDF, Fiches races), grille `grid-cols-1 sm:grid-cols-2` (3 lignes × 2 colonnes), cartes horizontales `p-4 flex items-center gap-4`, ChevronRight avec opacité hover ✅
- **Homepage "Des animaux cherchent un foyer"** (`AdoptionPreviewSection.tsx`) : section entre Outils et Partenaires, `max-w-6xl` (même largeur que "Par type d'animal"), 5 cards 1 par catégorie (chien/chat/oiseau/rongeur/reptile), 1 aléatoire parmi 10 derniers, `unstable_noStore()` pour variété à chaque chargement, âge et ville en `text-gray-900`. **Centrage automatique** : `flex flex-wrap justify-center gap-4` + largeur fixe `w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-52` → cards centrées si moins de 5 catégories disponibles ✅
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
- **Fiches races** (`/races`) : 120 races seed (50 chiens, 30 chats, 15 oiseaux, 15 rongeurs, 10 reptiles) - Cron quotidien 6h UTC - Génération Haiku 10/run - Pages `/races`, `/races/[animal]`, `/races/[animal]/[slug]` - JSON-LD breed - Sitemap - "Races" dans nav header ✅
- **Pages légales auditées et corrigées (mai 2026)** : données annonces adoption mises à jour (email + téléphone privés, non publics), durée conservation adoption 60 jours, section 2.5 guides PDF ajoutée dans politique-confidentialite, affiliés listés précisément (Amazon FR Associates, Awin, CJ.com/CanadaPetCare), mention Amazon Associates ajoutée dans CGU ✅
- **getMerchants fix** : requête Amazon FR séparée (limit 1) + marchands Awin (limit 100000) — évite le plafond 10 000 lignes qui cachait Amazon FR dans les filtres admin ✅
- **Sidebar admin renommée** : "Modération" → "Adoption", "Blog" → `/gestion-blog` (page réelle de modération commentaires) ✅
- **Page admin `/gestion-blog`** : 3 sections (en attente / approuvés / rejetés), badge rouge dans sidebar (via `/api/admin/pending-count` enrichi avec `commentCount`), lien cliquable vers l'article, approve/reject server actions ✅
- **Middleware** : `/moderation`, `/produits`, `/gestion-blog` ajoutés aux routes protégées ✅
- **Design admin unifié** : toutes les pages admin (guides, fiches races, produits affiliés, blog, adoption) utilisent `px-8 py-8 space-y-6 animate-fade-in` + header `text-3xl font-bold tracking-tight` sans icône ✅
- **Onglets catégorie guides admin** : filtre Tous/Chiens/Chats/Oiseaux/Rongeurs/Reptiles avec compteur par catégorie ✅
- **Fiches races** : emojis retirés des onglets de filtre ✅
- **Largeur `max-w-6xl` harmonisée** sur : articles blog (`/blog/[slug]`), fiches races (`/races/[animal]/[slug]`), pages légales (mentions légales, politique de confidentialité, CGU, cookies) — même largeur que les outils ✅
- **RGPD commentaires** : section 2.7 ajoutée dans politique de confidentialité (prénom + texte, pas d'email, modération, suppression sur demande) + base légale + conservation ✅
- **Page `/presse`** : kit presse complet (description longue + courte à copier-coller, stats dynamiques Supabase, thématiques, logo/couleurs, contact mailto, liens réseaux) — lien dans footer section Légal ✅
- **Sidebar admin** : Accueil et Boutique encadrés en bleu clair (`border-blue-200 bg-blue-50`) pour indiquer qu'ils renvoient vers le site public ✅
- **RGPD contact email** : section 2.8 ajoutée dans politique de confidentialité (presse, partenariats, questions — email utilisé uniquement pour répondre, non stocké en DB) ✅
- **maxDuration = 60** : ajouté sur toutes les routes cron manquantes (7× awin-sync, blog, social) — évite timeout 10s Vercel Hobby par défaut ✅
- **Vercel crons** : 13 crons tous actifs et reconnus par Vercel Hobby ✅
- **Awin mots-clés livres** : `'poche'`, `'broché'`, `'relié'` retirés (causaient "lampe de poche" → livres) ✅
- **Filtre type de produit boutique** : bouton "Type ▼" dans la rangée catégories (après Livres, séparateur) → dropdown cases à cocher multi-select (nourriture, accessoires, habitat, jouets, hygiène, santé, livres) → param `?types=a,b` → `.in('product_type', types)` ✅
- **Toggle grille/liste boutique** (`BoutiqueProductsGrid.tsx`) : bouton LayoutGrid/List, préférence `localStorage('boutique-view')` ✅
- **Toggle grille/liste adoption** (`AdoptionPostsGrid.tsx`) : idem boutique, `localStorage('adoption-view')` ✅
- **Toggle grille/liste blog** (`BlogPostsGrid.tsx`) : fonctionne sur `/blog` et toutes les pages catégories (`_category-page.tsx`), prop `showFeatured`, `localStorage('blog-view')` ✅
- **AdoptionPreviewSection centrage** : cards centrées quand < 5 catégories via `flex flex-wrap justify-center` + largeur fixe `xl:w-52` ✅
- **CJ sync activity log** : log `activity_logs` ajouté à la fin du cron CanadaPetCare ✅
- **Colonne `product_type TEXT`** sur `products` : migration `migration_product_type.sql` à exécuter, index GIN. `assignProductType()` dans `awin.ts` détecte le type depuis GPC + titre (ISBN → livres en priorité). `'bd'` retiré (faux positifs couvertures) ✅
- **Livres Amazon** : `product_type = 'livres'` ajouté dans POST et PATCH de `/api/admin/products` — les nouveaux livres sont automatiquement filtrables. SQL pour les existants : `UPDATE products SET product_type = 'livres' WHERE merchant_name = 'Amazon FR';` ✅
- **Trouveur de veterinaire** (`VetFinderPanel`) : onglet bleu fixe droite toutes pages publiques (hors admin), panel slide-in. Largeur responsive : `w-full` mobile, `min(88vw,600px)` desktop (breakpoint md). Geocodage + autocomplete Nominatim (OpenStreetMap, gratuit, sans cle, debounce 600ms, dropdown suggestions). Carte + markers Google Maps + Places API nearbySearch. Champ adresse unique avec suggestions en temps reel (worldwide). Layout: bouton GPS + rayon (ligne 1), adresse (ligne 2), bouton rechercher. Carte bords arrondis `rounded-xl border`. Layout scroll unique (form+carte+resultats). `mapReady` state evite recherches silencieuses avant init carte. Lien vet : format `maps/search/?api=1&query_place_id=` (compatible mobile + app Maps). CSP: `geolocation=(self)` dans Permissions-Policy, `fundingchoicesmessages.google.com` dans connect-src. Env: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Vercel + .env.local). Section 2.9 ajoutee dans politique-confidentialite (Google Maps IP + GPS opt-in non stocke) ✅
- **Trouveur de refuge** (`RefugeFinderPanel`) : meme architecture que `VetFinderPanel` mais en rose (`pink-500`). Onglet fixe droite positionne juste au-dessus du tab veterinaire (`bottom: calc(50% + 80px)`). Icone `Heart`. Recherche via Places API `keyword: 'refuge animaux SPA'` (pas de type specifique Google Maps pour refuges). Markers roses `#db2777`. Fichier : `src/components/refuge/RefugeFinderPanel.tsx`. Ajoute dans `LayoutShell` avant `VetFinderPanel` ✅
- **AnimalDayPopup** (`src/components/ui/AnimalDayPopup.tsx`) : modal centree avec overlay, s'affiche une seule fois par jour (localStorage `animal-day-seen` = date ISO du jour). Declenchee sur 6 journees mondiales fixes : 4 avr (rat 🐀), 23 mai (tortues 🐢), 31 mai (perroquets 🦜), 8 aout (chat 🐱), 26 aout (chien 🐶), 4 oct (animaux 🐾). CTA "Faites un cadeau a votre animal" redirige vers `/boutique?category={animal}` (ou `/boutique` pour journee generale). Fermeture : clic overlay, bouton croix, ou "Non merci". Ajoute dans `LayoutShell` cote public uniquement (hors admin) ✅
---
## Ce qui reste à faire (code)
### SEO / Contenu (fort impact)
- ~~Pages "Meilleure race pour..."~~ ✅ fait
### Monétisation
- **Amazon Associates FR** : compte approuvé (ID `mespoilus-21`). Attendre 3 ventes dans 180 jours → activer API Product Advertising pour sync automatique
### Infrastructure
- **Monitoring erreurs (Sentry)** : utile pour detecter les pannes cron silencieuses
- **Backups Supabase automatisés**
- **Redis (Upstash)** : rate limiting distribue — moins urgent
### Marketing
- **Stratégie backlinks francophones**
- **Lucas : connexion API volume mots-clés** (Ahrefs ou Semrush)