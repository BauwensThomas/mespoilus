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

Chaque agent utilise l'API Anthropic (Claude) et fonctionne de façon autonome. Thomas orchestre les 7 autres.

| Agent | Rôle | Modèle Claude | Responsabilités |
|-------|------|--------------|-----------------|
| 👔 **Thomas** | CEO Orchestrateur | Opus 4.7 | Stratégie globale, priorisation des tâches, coordination de l'équipe, rapports de direction |
| ✍️ **Marie** | Rédactrice de contenu | Sonnet 4.6 | Articles de blog (800-1500 mots), guides pratiques, descriptions produits, contenu |
| 🔍 **Lucas** | Spécialiste SEO | Sonnet 4.6 | Recherche de mots-clés multi-pays (google.be/fr/ch/ca), optimisation on-page, audit de contenu, stratégie francophone |
| 📱 **Emma** | Réseaux sociaux | Sonnet 4.6 | Posts Instagram / Facebook / TikTok, calendrier éditorial, hashtags, ciblage communautés francophones internationales |
| 💻 **Maxime** | Développeur & Maintenance | Sonnet 4.6 | Surveillance des performances, correction de bugs, optimisation Next.js / Supabase, Core Web Vitals |
| 💬 **Léa** | Support client | Haiku 4.5 | Réponses emails clients, gestion des commandes, FAQ, satisfaction client |
| 📊 **Antoine** | Finance | Sonnet 4.6 | Suivi des revenus en €, calcul des marges, rapports financiers, projections trimestrielles |
| 🛡️ **Nathalie** | Sécurité | Sonnet 4.6 | Détection d'intrusions, blocage d'IPs, audits de sécurité, alertes en temps réel |
| 💌 **Sofia** | Newsletter | Sonnet 4.6 | Rédige la newsletter hebdomadaire, sélectionne les 3 meilleurs articles, envoie via Resend, gère les désabonnements |

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Style | Tailwind CSS - thème sombre (`#080808`) |
| Base de données | Supabase (PostgreSQL) |
| IA | API Anthropic - Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5 |
| Images | Unsplash API (fetch natif, 50 req/h gratuit) |
| Sécurité | Middleware Edge : rate limiting, détection SQLi/XSS, blocage IP |
| Déploiement prévu | Vercel |
| E-commerce prévu | Shopify |

### Variables d'environnement requises

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UNSPLASH_ACCESS_KEY
CSRF_SECRET
RESEND_API_KEY
```

---

## Ce qui est fait

### Landing page publique (`/`)
- Design clair et chaleureux (blanc, beige, tons ambrés)
- Hero split : texte à gauche (52%), 4 photos Unsplash d'animaux différents à droite en grille décalée (chien, chat, oiseau, lapin) avec dégradé de fondu — `getHeroPhotos()` dans `unsplash.ts`
- Nav : logo à gauche, liens Blog / Adoption / Newsletter au centre, bouton 🛍️ Boutique (amber) à droite — **pas de bouton "Lire le blog"**
- Section "Derniers articles" : 3 derniers articles de Marie avec cards light
- Section catégories : 5 catégories avec photos Unsplash (chiens, chats, oiseaux, rongeurs, reptiles)
- Section newsletter avec formulaire email (client component `NewsletterForm.tsx`)
- Footer complet avec navigation (inclut lien Adoption), mentions légales belges, lien Admin discret → `/login`
- `revalidate = 3600` (images Unsplash mises en cache 1h)

### Authentification admin (Supabase Auth)
- **Middleware** `src/middleware.ts` - protège `/dashboard`, `/agents/*`, `/orchestrate`, `/api/agents/*` etc.
- Routes admin sans session → redirect `/login?redirect=...`
- API routes sans session → `401 Unauthorized`
- **Page login** `src/app/login/page.tsx` - design sombre, formulaire email/password
- `src/app/login/actions.ts` - server action `signIn` via `supabase.auth.signInWithPassword`
- `src/app/actions/auth.ts` - server action `logout` (signOut + redirect `/login`)
- **Sidebar** : lien `Dashboard` pointe vers `/dashboard`, bouton "Se déconnecter" en bas
- **⚠️ À faire dans Supabase** : créer un utilisateur auth (Authentication → Users → Add user)

### Routes et layout
- `src/app/layout.tsx` - minimal, utilise `LayoutShell` (pas de sidebar globale)
- `src/components/layout/LayoutShell.tsx` - Client Component : sidebar uniquement sur `/dashboard`, `/agents/*`, `/orchestrate`, `/moderation`
- **Dashboard admin** sur `/dashboard` → `src/app/(admin)/dashboard/page.tsx`
- Routes publiques (`/`, `/blog/*`, `/boutique`, `/adoption`, `/login`) - sans sidebar
- Routes admin (`/dashboard`, `/agents/*`, `/orchestrate`, `/moderation`) - avec sidebar
- **Palette unifiée** : fond principal `bg-gray-900` (#111827, bleu foncé) sur toutes les pages sombres -plus de `#080808` noir pur
- **`BackButton`** (`src/components/ui/BackButton.tsx`) - Client Component réutilisable avec `router.back()`, utilisé sur `/blog` et `/boutique`

### Dashboard admin (`/dashboard`)
- Grille des 8 agents avec statut, stats et dernière activité
- Feed d'activité en temps réel
- Stats globales : articles publiés, tâches exécutées, tokens utilisés (réels, capturés via `stream.finalMessage()`), alertes sécurité
- Galerie Unsplash supprimée du dashboard

### Pages agents (`/agents/[agent]`)
- Photo ambiante Unsplash en hero (fallback SVG thématique)
- Zone de saisie de tâche avec **streaming en temps réel** de la réponse Claude
- Tâches rapides préconfigurées par agent
- Historique des 15 dernières activités par agent
- Noms des agents dans le feed d'activité cliquables → lien vers `/agents/[agent_id]` (icône + nom)
- Dans la page agent, chaque entrée d'historique est cliquable :
  - **Marie** → lien vers `/blog/[slug]` (ou `/blog`). `article_slug` stocké dans `details`.
  - **Autres agents** → accordéon qui affiche le texte complet généré (contenu stocké dans `details.content`)
  - Le contenu complet est sauvegardé dans `details` pour tous les agents sauf Marie (Marie a sa page article)
  - `revalidate = 30` sur la page agent (était 3600) pour que l'historique se rafraîchisse rapidement

### Page orchestration (`/orchestrate`)
- Thomas analyse un objectif, crée un plan, délègue aux agents concernés
- Exécution parallèle des sous-tâches
- Synthèse exécutive par Thomas

### Blog public (`/blog`)
- Articles sauvegardés automatiquement dans Supabase après fin du stream (post-processing dans `streamAgentTask`)
- Parsing frontmatter robuste : strip des code fences (` ```markdown `), extraction title/slug/category/keywords/excerpt
- Images Unsplash récupérées automatiquement par titre + catégorie lors de la sauvegarde
- Filtres par catégorie avec icônes et style amber actif (pills orange)
- Bannière catégorie : 4 vraies photos Unsplash (`getHeroPhotos()`) côte à côte à droite + dégradé orange 50% gauche + nom de catégorie + compteur d'articles
- État vide public : "Les premiers articles arrivent bientôt !" (`bg-gray-50`) sans référence admin
- `BackButton` en haut (router.back()) - retour intelligent admin ou visiteur
- `BlogCard` est un Client Component (`'use client'`) - nécessaire pour `onClick` sur le lien Unsplash
- Filtres catégories via `?category=chiens` - requête Supabase `contains('categories', ['chiens'])` (array containment)
- Pages articles avec hero image, rendu Markdown via `marked` (`gfm: true`, **sans** `breaks: true` - le mode breaks empêche le parsing correct des titres `##`)
- Styles article via classe CSS `.article-content` dans `globals.css` (indépendant de Tailwind JIT) : titres hiérarchisés, tableaux avec bordures visibles et hover, paragraphes aérés, blockquotes, code blocks
- SEO complet : meta title/description, canonical, Open Graph complet (og:title, og:description, og:image, og:url, og:locale `fr_FR`, og:article:publishedTime/modifiedTime/authors/tags), Twitter Card `summary_large_image`
- Schema.org JSON-LD `Article` injecté dans chaque page (`headline`, `image`, `datePublished`, `dateModified`, `author`, `publisher`, `mainEntityOfPage`)
- `robots: index, follow` sur `/blog` et `/blog/[slug]` - override du `noindex` global du layout admin
- `metadataBase` configuré dans le layout pour résoudre les URLs relatives OG/canonical
- `/sitemap.xml` dynamique (Next.js `sitemap.ts`) - liste tous les articles publiés depuis Supabase
- `/robots.txt` (Next.js `robots.ts`) - allow `/blog/`, disallow admin, pointe vers sitemap

### API interne
- `POST /api/agents/[agent]` - Streaming réponse agent
- `POST /api/orchestrate` - Orchestration Thomas multi-agents
- `GET /api/blog` - Articles paginés avec filtres
- `POST /api/security/report` - Rapport sécurité Nathalie
- `GET /api/stats` - Statistiques globales
- `POST /api/newsletter/subscribe` - Inscription newsletter (valide email, vérifie doublons, sauvegarde Supabase)
- `POST /api/newsletter/send` - Envoi campagne via Resend (auth requise, récupère abonnés actifs)
- `POST /api/adoption/upload` - Upload photo vers Supabase Storage bucket `adoption-photos` (image/*, max 5 Mo, 25 req/h par IP)
- `POST /api/adoption/submit` - Soumission annonce d'adoption (rate limit 5/h par IP, validation complète, emails automatiques)

### Agents - configuration maxTokens
| Agent | maxTokens | Raison |
|-------|-----------|--------|
| Thomas | 3000 | Analyses stratégiques courtes |
| Marie | 4000 | Articles longs |
| Lucas | 4000 | Analyses SEO multi-tableaux |
| Emma | 5000 | Série de posts complète (7 jours) |
| Antoine | 4000 | Rapports financiers détaillés |
| Maxime | 6000 | Rapports avec code TypeScript/SQL |
| Nathalie | 4000 | Audits de sécurité complets |
| Léa | 3000 | Réponses support courtes |
| Sofia | 4000 | Newsletters HTML + JSON structuré |
- Champ `maxTokens?: number` dans l'interface `Agent` (`types/index.ts`), fallback 3000 dans le runner

### Multi-catégories articles
- Chaque article a une colonne `categories TEXT[]` (tableau) en plus de `category` (catégorie principale)
- Marie génère un champ `categories: chiens, chats` dans son frontmatter pour tous les animaux couverts
- `saveMariesArticle` parse ce champ et stocke le tableau dans Supabase
- Le filtre blog utilise `query.contains('categories', [category])` (Supabase array containment `@>`)
- **À exécuter sur Supabase** : `migration_categories.sql` (backfill automatique depuis `category`)

### Post-processing streaming (`src/lib/agents/runner.ts`)
- `streamAgentTask` collecte le contenu complet au fil des chunks
- Au `done`, déclenche en fire-and-forget : `logActivity` + `updateAgentStats` + post-processing agent
- Tokens réels capturés via callback `onComplete` → `stream.finalMessage()` dans `anthropic.ts`
- Marie → `saveMariesArticle` : strip code fence, parse frontmatter, fetch Unsplash, upsert Supabase
- Emma → `saveSocialPost` : extrait les posts par plateforme, insère dans `social_posts`
- Nathalie → `saveSecurityAnalysis` : extrait le niveau de menace, insère dans `security_logs`
- Antoine → `saveFinancialReport` : insère dans `financial_reports`
- Sofia → `saveNewsletterDraft` : parse JSON (subject, preview_text, content_html), insère dans `newsletter_campaigns` en statut `draft`
- `logActivity` et `updateAgentStats` loggent les erreurs Supabase avec `console.error` (plus de silence)
- `updateAgentStats` : SELECT + UPDATE direct sans dépendance RPC

### Sécurité
- Rate limiting : 60 req/min global, 10 req/min par agent
- Détection : SQL injection, XSS, path traversal, LFI
- Blocage IP automatique (mémoire + Supabase `blocked_ips`)
- Headers de sécurité sur toutes les routes (CSP, X-Frame-Options, etc.)

### Base de données Supabase (10 tables)
`articles` · `activity_logs` · `security_logs` · `social_posts` · `financial_reports` · `agent_stats` · `blocked_ips` · `newsletter_subscribers` · `newsletter_campaigns` · `adoption_posts`

#### Fichiers SQL
| Fichier | Description |
|---------|-------------|
| `src/lib/supabase/schema.sql` | Schéma initial complet - à exécuter sur un projet Supabase vierge |
| `src/lib/supabase/migration_images.sql` | Ajoute les 4 colonnes image à `articles` (contenu dans `migration_complete.sql`) |
| `src/lib/supabase/migration_complete.sql` | Migration si schéma initial déjà appliqué - ajoute colonnes images, indexes, fonction RPC, seed `agent_stats` |
| `src/lib/supabase/migration_categories.sql` | **À exécuter** - ajoute colonne `categories TEXT[]`, backfill depuis `category`, index GIN |
| `src/lib/supabase/migration_newsletter.sql` | **À exécuter** - tables `newsletter_subscribers` et `newsletter_campaigns`, seed `agent_stats` pour Sofia |
| `src/lib/supabase/migration_adoption.sql` | **À exécuter** - table `adoption_posts` avec colonne `photo_urls TEXT[]` + note création bucket Storage |

#### Table `adoption_posts`
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `poster_name` | TEXT | Prénom du déposant |
| `email` | TEXT | Email privé (jamais affiché publiquement) |
| `animal_type` | TEXT | chien / chat / oiseau / rongeur / reptile / autre |
| `breed` | TEXT nullable | Race ou espèce |
| `age` | TEXT nullable | Âge approximatif |
| `gender` | TEXT | mâle / femelle / inconnu |
| `region` | TEXT | Région ou ville |
| `description` | TEXT | Description de l'animal (min. 20 caractères) |
| `contact_info` | TEXT | Coordonnées publiques = email public + téléphone (ex : `contact@x.com · 0487 12 34 56`) |
| `photo_urls` | TEXT[] | URLs publiques Supabase Storage (2 min, 5 max) |
| `status` | TEXT | pending / approved / rejected (défaut : pending) |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour |

#### Supabase Storage
- Bucket `adoption-photos` : **public**, limite 5 Mo par fichier — **à créer manuellement dans le Dashboard Supabase**
- Upload via service role dans l'API route (côté serveur uniquement)
- Path : `{randomUUID()}.{ext}` pour éviter les collisions

#### Divergences schema corrigées
- `articles` : colonnes `image_url`, `image_alt`, `image_credit`, `image_credit_url` ajoutées (fix PGRST204)
- `articles` : colonne `categories TEXT[]` ajoutée - supporte multi-catégories par article
- `agent_stats` : fonction RPC `increment_agent_stat` créée (upsert atomique)
- Indexes manquants : `articles(category)`, `articles(published_at DESC)`, `articles(categories GIN)`

### Newsletter (Sofia)
- `src/lib/resend.ts` — client Resend via fetch natif (pas de dépendance npm), `sendEmail` + `sendBulkNewsletter` (délai 120ms entre envois)
- `src/components/landing/NewsletterForm.tsx` — connecté à `/api/newsletter/subscribe`, gestion erreurs réelle
- Sofia génère le HTML complet en JSON `{ subject, preview_text, content_html }`, sauvegardé en `draft` automatiquement
- Envoi déclenché manuellement via `POST /api/newsletter/send` avec `{ campaignId }`
- Variable d'env requise : `RESEND_API_KEY` (gratuit jusqu'à 3000 emails/mois)

### Adoption animaux (`/adoption`)

#### Page publique `src/app/adoption/page.tsx`
- Design sombre cohérent avec le reste (`bg-gray-900`)
- Filtres par type d'animal : Tous / Chiens / Chats / Oiseaux / Rongeurs / Reptiles / Autre (pills amber)
- Filtrage via `?animal=chien` — Server Component, `revalidate = 60`
- Grille responsive 1→2→3 colonnes avec `AdoptionCard`
- Chaque carte : photo principale en cover (h-44), badge type animal coloré, tags race/âge/genre, région, description (line-clamp-3), coordonnées publiques
- État vide : style identique au blog (`bg-gray-50 rounded-2xl py-16`)
- Bouton "Déposer une annonce" scroll vers `#deposer`

#### Formulaire `src/app/adoption/AdoptionPostForm.tsx` (Client Component)
- Sélection de photos : drop zone initiale → grille de 5 thumbnails avec bouton `+`
- 2 photos minimum, 5 maximum — validé côté client ET serveur
- Preview instantanée via `URL.createObjectURL()`, révocation à la suppression ou après envoi
- Upload séquentiel photo par photo avec texte de progression "Upload photo X / Y…"
- Champs : prénom*, email privé*, type animal*, race, âge, sexe, région*, description* (min 20 car.), email public*, téléphone (optionnel)
- Les coordonnées publiques = email public (requis) + téléphone (optionnel) — affichés sur l'annonce

#### API routes adoption
- `POST /api/adoption/upload` — upload d'une image vers Supabase Storage, retourne l'URL publique
  - Rate limit : 25 uploads/h par IP
  - Validation : `image/*` uniquement, max 5 Mo
  - Path stocké : `{randomUUID()}.{ext}`
- `POST /api/adoption/submit` — soumission complète de l'annonce
  - Rate limit : 5 soumissions/h par IP
  - Validation : tous les champs requis, email public valide, 2–5 photos
  - `contact_info` = `contact_email + " · " + contact_phone` (ou juste l'email si pas de tél)
  - Envoi de 2 emails après insert réussi (voir ci-dessous)

#### Emails automatiques adoption (via Resend)
| Moment | Destinataire | Contenu |
|--------|-------------|---------|
| Soumission | Client (email privé) | "Annonce bien reçue, vérification sous 24h" |
| Soumission | Admin (`contact@mespoilus.com`) | Récap complet + lien direct `/moderation` |
| Approbation | Client (email privé) | "Votre annonce est en ligne" + lien `/adoption` |
| Refus | Client (email privé) | "Annonce non retenue" + invitation à répondre |
- Les erreurs d'envoi mail sont loggées mais n'empêchent pas l'action (insert / changement de statut)

#### Page de modération `src/app/(admin)/moderation/page.tsx`
- Accessible via sidebar admin (🛡️ Modération)
- Tabs : En attente (avec badge compteur) / Approuvées / Rejetées
- Filtrage via `?status=pending|approved|rejected`
- Carte par annonce : type, race, âge, genre, région, description, email déposant, contact public
- Boutons Approuver / Rejeter via Server Actions (`updateStatus.bind(null, id, status)`)
- `updateStatus` : fetch les infos du post → met à jour le statut → envoie l'email client → `revalidatePath`
- `revalidate = 0` (toujours frais)

### Placeholders visuels
- 6 SVG illustrés par catégorie animale
- 9 SVG thématiques par agent (couleur + silhouette métier — Sofia à ajouter)

### Pages légales
- `/mentions-legales` — éditeur Mes Poilus, hébergeur Vercel + LWS (nom de domaine), droit belge
- `/politique-confidentialite` — RGPD, données collectées (email newsletter + analytics), droits utilisateurs, modèle affiliation (pas de données commande)
- `/cgu` — Conditions Générales d'Utilisation adaptées au modèle affiliation (liens affiliés, pas de vente directe)
- `/cgv` — redirige automatiquement vers `/cgu`
- `/cookies` — tableau des cookies essentiels et analytiques, bouton réinitialisation (`CookieResetButton` client component)
- `CookieBanner` (`src/components/ui/CookieBanner.tsx`) — bandeau RGPD fixe en bas, Accept/Refus, sauvegarde dans `localStorage` clé `mespoilus_cookie_consent`
- Footer landing page — liens vers les 4 pages légales
- Emails : une seule adresse `contact@mespoilus.com` [À CRÉER sur LWS], domaine `.com` choisi pour la francophonie internationale
- Dernière mise à jour affichée : mai 2026

### Boutique (`/boutique`)
- Page publique placeholder "coming soon"
- Accessible depuis la nav de la landing page (bouton amber 🛍️) et depuis la sidebar admin
- `BackButton` intelligent (router.back())
- **Modèle : affiliation uniquement** — pas de vente directe, liens vers Amazon/Zooplus/etc.

### Dashboard admin
- Activité récente affichée horizontalement (scrollable) au-dessus de la grille des agents
- Grille agents : 3 colonnes sur XL, 2 sur SM
- Section "Blog Mes Poilus" supprimée du bas du dashboard
- Badge "agents en ligne" supprimé de la sidebar

### Unsplash -nouvelles fonctions
- `getHeroPhotos()` : fetch 4 photos séparées (chien, chat, oiseau, lapin) via `CATEGORY_QUERIES` existants, sans filtre `orientation=landscape` pour meilleure couverture

---

## Actions manuelles restantes (hors code)

| Action | Priorité |
|--------|----------|
| Créer compte **Resend** + ajouter `RESEND_API_KEY` dans `.env.local` | Haute |
| Créer adresse `contact@mespoilus.com` dans panel **LWS** | Haute |
| Créer utilisateur admin dans **Supabase → Authentication → Users** | Haute |
| Acheter domaine `mespoilus.com` sur **LWS** | Haute |
| Exécuter `migration_adoption.sql` dans Supabase SQL Editor | Haute |
| Créer le bucket `adoption-photos` dans **Supabase → Storage** (public, 5 Mo max) | Haute |
| Exécuter `migration_categories.sql` dans Supabase SQL Editor | Moyenne |

---

## Ce qui reste à faire (code)

### Site public clients
- Pages catégories animaux
- Moteur de recherche d'articles

### Boutique / Monétisation
- **Modèle actuel : affiliation uniquement** (liens vers Amazon, Zooplus, etc.) — pas de vente directe
- Intégration Shopify non prévue pour l'instant

### Marketing & acquisition
- Automatisation des posts réseaux sociaux par Emma (publication réelle via API Meta / TikTok, ciblage géographique par marché francophone)
- Stratégie de backlinks francophones (FR, BE, CH, CA)
- Google Search Console connecté (propriétés séparées par domaine/marché)
- Google Analytics / Plausible

### Améliorations agents
- Thomas : tableau de bord des KPIs hebdomadaires automatique
- Marie : génération planifiée (ex. 3 articles/semaine en automatique)
- Lucas : connexion à une vraie API de volume de mots-clés (Ahrefs, Semrush)
- Emma : publication réelle sur Instagram / Facebook / TikTok
- Nathalie : alertes email (SendGrid / Resend) en cas de menace critique

### Infrastructure
- Redis (Upstash) pour le rate limiting distribué en production
- Monitoring erreurs (Sentry)
- CI/CD GitHub Actions
- Backups Supabase automatisés
