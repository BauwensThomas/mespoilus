# Tamagotchi - Mon Chien

## Vision
Jeu Tamagotchi web en HTML/CSS/JS vanilla, jouable sur PC et mobile. Le chien commence dans un oeuf, éclot, grandit selon les choix quotidiens (3 questions/jour). Le style visuel est aligné sur le site PetAgency : fond crème `#FFF7ED`, accent orange `#F97316`, polices Fredoka + Nunito, cartes arrondies, pas de pixel art.

## Structure des fichiers
```
tamagotchi/
├── index.html       - 5 écrans (intro, nom, jeu, fin de journée, mort)
├── style.css        - style warm/orange, responsive
├── app.js           - toute la logique du jeu
└── tamagotchi.md    - cette documentation
```

## Écrans
1. **Intro** - oeuf animé + bouton COMMENCER
2. **Nom** - saisie du prénom, oeuf à gauche
3. **Jeu** - header | [sprite (gauche) + stats (droite)] | message matin | question | réponses
4. **Fin de journée** - sprite + countdown 24h + boutons de test
5. **Mort** - sprite en niveaux de gris + message cause + bouton RECOMMENCER

## Layout du jeu
- `.pet-row` : flex row - sprite à gauche (190×190px), stats panel à droite (`flex: 1`)
- Pendant l'oeuf : stats visibles mais barres grises + `?` (valeurs mystère)
- Après éclosion : barres colorées avec vraies valeurs
- Conteneur max-width : 560px

## Stades de progression
| Stade | Jour | Condition |
|---|---|---|
| `egg_1` | 1 | - |
| `egg_2` | 2 | - |
| `egg_3` | 3 | - |
| `egg_open` | 4 | - |
| `baby` | 5–7 | - |
| `muscular` | 8+ | tags `tres_sportif` + `muscu` + poids < 45 |
| `fat` | 8+ | poids ≥ 75 |
| `normal` | 8+ | poids ≥ 42 |
| `thin` | 8+ | poids < 42 |

## Stats
| Stat | Icône | Nuit (oeuf) | Nuit (post-oeuf) | Rôle |
|---|---|---|---|---|
| `bonheur` | ❤ | −3 | −10 | Humeur ; → 0 = mort |
| `energie` | ⚡ | −3 | −15 | Vitalité ; → 0 = mort |
| `poids` | 🍖 | −2 | −5 | Corpulence ; → 0 = mort |

**Gains positifs divisés par 2** (`Math.ceil(val/2)`) - les stats montent deux fois moins vite qu'elles descendent.

**Manger ne donne jamais de poids négatif.** Seul le sport réduit le poids :
- Repas léger → +2 | Repas sain / légumes → +3 | Poulet grillé → +5
- Course, natation, vélo → poids négatif

## Effets de nuit (applyNightEffects)
- **Pendant l'oeuf** (`EGG_STAGES`) : decay minimal (−3 / −3 / −2) - dormance
- **Après éclosion** : decay complet (−10 / −15 / −5)

## Passage de jour (advanceDay)
1. Capture `tagsHier = [...pet.tags]` avant reset
2. `applyNightEffects()` (selon stade)
3. `checkDeath()` → si mort, stoppe et affiche écran mort
4. `pet.jour++`, reset `q_today`, `q_ids_today`, `reset_at`
5. Suppression des tags quotidiens : `a_mange_double`, `a_grignote`, `tres_gourmand`, `pas_bouge`, `a_couru`, `discipline`
6. `prevStade = pet.stade` → `calcStage()` → nouveau stade
7. **Si egg→baby (éclosion)** : reset `bonheur = energie = poids = 50`
8. `buildMorningMsgs(tagsHier)` → messages du matin

## Messages du matin
- **Stades oeuf** : message atmosphérique par stade (`egg_1` à `egg_open`), jamais de mention de faim
- **Après éclosion** :
  - bonheur < 20 → épuisé
  - bonheur < 40 → un peu triste
  - sinon → nouvelle journée
  - + mentions selon tags d'hier : trop mangé / pas bougé / a couru

## Mécanique de mort
`checkDeath()` → `pet.mort = true` + `pet.mort_raison` si :
- **Stade oeuf** → pas de mort possible (retourne false immédiatement)
- `bonheur <= 0` → mort de tristesse
- `energie <= 0` → mort d'épuisement
- `poids <= 0` → mort de faim
- bonheur + energie → "épuisé et triste"

Vérifié à 3 moments :
1. Dans `advanceDay()` après la nuit
2. Dans `next()` avant chaque question (mid-day)
3. Dans `init()` au chargement (état persisté depuis localStorage)

Écran mort : sprite du stade actuel en `filter: grayscale(1)`, message selon cause, bouton RECOMMENCER (reset localStorage).

## Sélection des questions (pickQuestion)
3 passes successives :
1. **Pool principal** : compatibles stade + tags_requis + tags_exclus + bonheur_min/max + non vues aujourd'hui ni hier (si `tags_exclus.length === 0`)
2. **Fallback** : sans tags_requis/exclus, non vues aujourd'hui ni hier
3. **Last resort** : sans tags_requis/exclus, non vues aujourd'hui

Si aucune question trouvée → `renderDone()` anticipé.

## Questions par stade (résumé)
| Stade | Questions disponibles |
|---|---|
| `egg_1` | q001, q002_m/f, q003, q_egg_a–e |
| `egg_2` | + q004, q004b |
| `egg_3` | + q005, q005b |
| `egg_open` | q010, q011, q012_m/f (toutes = 1re fois) |
| `baby` | q010–q015, q020–q025, q030–q034, q070–q073, q081, q090, q095–q096, q_sad_1/3 |
| `thin`/`normal`/`fat`/`muscular` | + q023, q031, q033, q035, q050–q051, q060–q061, q080–q082, q091–q097 |

## Tags importants
| Tag | Rôle |
|---|---|
| `genre_ok` / `male` / `female` | Genre du chien |
| `instinct_ok`, `attrait_ok`, `premier_geste`, etc. | Questions one-shot (exclus après) |
| `gourmand`, `sportif`, `calme`, `social` | Personnalité persistante |
| `a_mange_double`, `a_grignote`, `tres_gourmand` | Repas du jour (reset chaque nuit) |
| `pas_bouge`, `a_couru`, `discipline` | Activité du jour (reset chaque nuit) |
| `regime`, `muscu`, `tres_sportif` | Tags persistants (non reset) |

## Style (style.css)
- **Fond** : `#FFF7ED` (crème chaud)
- **Accent** : `#F97316` (orange), dark `#ea580c`
- **Polices** : Fredoka (titres/countdown), Nunito (tout le reste)
- **Cartes** : fond blanc, `border-radius: 14–18px`, ombre `rgba(249,115,22,0.12)`
- **Boutons primaires** : orange plein, `border-radius: 14px`, hover `translateY(-2px)`
- **Boutons réponses** : fond blanc → orange au clic (`.selected`)
- **Barres de stats** : fond `#f3f4f6`, remplissage pill coloré (vert/jaune/bleu/orange)
- **Sprite** : fond blanc, `border-radius: 24px`, bordure colorée par stade
- **Écran mort** : sprite `filter: grayscale(1)`, titre gris `#9ca3af`

## Boutons de test (dev only)
- **JOUR SUIVANT** : `advanceDay()` + redémarre le jeu sans attendre 24h
- **RESET** : efface `localStorage` + rechargement complet

## Bugs corrigés (historique)
- Enter auto-cliquait le premier bouton → `document.activeElement.blur()` dans `showScreen()`
- Listeners dupliqués sur btn-test-next → `.onclick =` remplace `.addEventListener`
- `buildMorningMsgs` lisait les tags déjà réinitialisés → capture `tagsHier` avant le reset
- Message du matin avec mauvais stade → `calcStage()` appelé avant `buildMorningMsgs()`
- Même question 2 jours de suite → `q_ids_hier` exclu du pool principal
- Question anniversaire (q092) proposée à bonheur=18 → `bonheur_min: 50`
- "La nuit tombe..." incohérent après réveil → q090 reformulée
- Énergie montait après une nuit → décroissance uniforme la nuit
- Repas sains donnaient poids négatif → corrigé (manger ≥ 0 poids)
- Poids à 0 ne tuait pas → ajouté à `checkDeath()`
- `checkDeath()` seulement à la nuit → vérifié aussi dans `next()`
- Sélecteur CSS `.name-input` sans class dans le HTML → class ajoutée à l'input
- Stats cachées pendant l'oeuf → maintenant toujours visibles (grises + `?`)
- **Mort dans l'oeuf** → pas de mort possible pendant `EGG_STAGES`, decay nuit réduit (−3/−3/−2)
- **Reset stats à l'éclosion** → bonheur/energie/poids remis à 50 quand egg→baby
- **Seulement 1 question au jour 4** (egg_open) → `egg_open` ajouté aux stades de q011, q012_m, q012_f

## Prochaines améliorations possibles
- Enrichir la base de questions (actuellement ~35, viser 150+)
- Sprites illustrations réelles ou pixel art par stade
- Traits de personnalité plus poussés, branches d'évolution fines
- Sauvegarde cloud (Supabase) pour multi-device
- Intégration dans le projet PetAgency / Next.js
