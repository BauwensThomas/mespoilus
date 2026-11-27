/**
 * Prompts des crons IA, partagés entre les routes et scripts/test-models.ts (27/11/2026).
 * Texte identique à celui qui était écrit directement dans chaque route.
 */

export function breedPrompt(name: string, animalLabel: string): string {
  return `Tu es un expert en bien-etre animal. Genere une fiche race complete et precise pour : ${name} (${animalLabel}).

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans commentaires) :
{
  "excerpt": "Une phrase accrocheuse de 80-120 caracteres decrivant la race",
  "description": "<p>Paragraphe sur l'histoire et l'origine.</p><p>Paragraphe sur le caractere et la personnalite.</p><p>Paragraphe sur la vie au quotidien et les conseils pratiques.</p>",
  "origine": "Pays ou region d'origine",
  "taille": "petit ou moyen ou grand ou tres grand",
  "poids": "X-Y kg",
  "esperance_vie": "X-Y ans",
  "caractere": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "entretien": "2 phrases sur le toilettage et les soins.",
  "alimentation": "2 phrases sur les besoins alimentaires specifiques.",
  "sante": "2 phrases sur les maladies frequentes et la robustesse.",
  "convient_pour": {
    "appartement": true,
    "jardin": false,
    "enfants": true,
    "debutants": false,
    "seniors": true
  },
  "niveau_activite": "faible ou modere ou eleve ou tres eleve"
}`;
}

export function classifyPrompt(productList: string): string {
  return `Tu es un expert en produits pour animaux de compagnie. Classifie chaque produit dans exactement une de ces catégories : nourriture, jouets, hygiene, sante, habitat, accessoires, livres.

Règles :
- nourriture : croquettes, pâtées, friandises, compléments alimentaires, vitamines
- jouets : balles, cordes, peluches, laser, jouets interactifs, griffoirs
- hygiene : shampooings, brosses, soins dentaires, antiparasitaires, produits de toilettage
- sante : médicaments, compléments santé, articulaire, digestif, calmants
- habitat : cages, litières, paniers, lits, aquariums, griffoirs muraux, arbres à chat
- accessoires : laisses, harnais, colliers, gamelles, vêtements, transport, dressage
- livres : livres, guides, encyclopédies

Format d'entrée : id|nom du produit (marque)|catégorie_animal
Format de sortie : id|type - une seule ligne par produit, rien d'autre.

Produits à classifier :
${productList}`;
}

export function prenomsPrompt(animalLabel: string): string {
  return `Génère exactement 50 prénoms originaux et tendance pour un ${animalLabel} domestique, répartis en 4 styles (environ 12-13 par style) :
- Mignon : prénoms doux, tendres, kawaii
- Classique : prénoms courants et intemporels
- Nature : inspirés de la nature, éléments, saisons, astres
- Rigolo : originaux, drôles, décalés

Règles : prénoms courts (1-2 mots max), variés, en français principalement, sans doublons entre styles.

Retourne UNIQUEMENT ce JSON valide, sans markdown ni explication :
{"Mignon":["nom1","nom2",...],"Classique":[...],"Nature":[...],"Rigolo":[...]}`;
}

export function translateNamesPrompt(names: string[]): string {
  return `Tu es un expert en traduction de produits pour animaux de compagnie EN/NL → FR.

Règles STRICTES :
- Traduis TOUS les mots descriptifs anglais ou néerlandais en français. Exemples obligatoires : Adult→Adulte, Indoor→Intérieur, Outdoor→Extérieur, Senior→Senior, Kitten→Chaton, Puppy→Chiot, Chicken→Poulet, Salmon→Saumon, Beef→Bœuf, Turkey→Dinde, Lamb→Agneau, Fish→Poisson, Dry→Sec, Wet→Humide, Fresh→Frais, Light→Léger, Sterilised→Stérilisé, Grain Free→Sans céréales, Cat→Chat, Dog→Chien, Tree→Arbre, Box→Boîte, Litter→Litière, Enclosure→Enceinte, Toy→Jouet, Bed→Lit, Bowl→Bol, Feeder→Distributeur, Scratcher→Griffoir, Harness→Harnais, Leash→Laisse, Collar→Collier, Brush→Brosse, Coat→Pelage, House→Maison, Tower→Tour, Tunnel→Tunnel, Wand→Baguette, Carrier→Transporteur, Mat→Tapis, Pad→Coussin, Perch→Perchoir, Cage→Cage, Tank→Aquarium, Food→Nourriture, Treat→Friandise, Snack→Snack, Mix→Mélange, Blend→Mélange, Formula→Formule, Recipe→Recette, Natural→Naturel, Organic→Biologique, Grain→Céréale, Free→Sans, With→Avec, For→Pour, Small→Petit, Medium→Moyen, Large→Grand, Mini→Mini, Maxi→Maxi.
- Les noms propres de MARQUES ne se traduisent pas (Royal Canin, Purina, Whiskas, Hills, Orijen, Acana, Zooplus, Maxi Zoo, CanadaPetCare, Puft, Tuft & Paw, Trixie, Ferplast, etc.).
- Un prénom de produit (Haven, Milo, Luna, etc.) qui est le NOM DU PRODUIT doit rester tel quel, mais les mots descriptifs qui l'accompagnent se traduisent.
- Ne retourne JAMAIS le nom identique si celui-ci contient des mots anglais ou néerlandais descriptifs.
Réponds UNIQUEMENT avec les résultats, un par ligne, dans le même ordre. Pas d'explication, pas de numéro, pas de guillemets.\n\n${names.join('\n')}`;
}

export function translateNamesForcedPrompt(names: string[]): string {
  return `Tu es un traducteur EN→FR expert en produits pour animaux. Ces noms sont EN ANGLAIS et doivent être traduits en français naturel et grammaticalement correct.

RÈGLES ABSOLUES :
- INTERDIT de retourner un nom identique à l'original. TOUT MOT ANGLAIS descriptif doit être traduit.
- Traduis les groupes nominaux composés avec la bonne grammaire française (ajoute les prépositions nécessaires) : Cat Tree→Arbre à chat, Cat Tower→Tour à chat, Cat Scratcher→Griffoir pour chat, Cat Bed→Lit pour chat, Cat Litter→Litière pour chat, Litter Box→Boîte à litière, Litter Box Enclosure→Meuble cache-litière, Cat Bowl→Bol pour chat, Dog Bed→Lit pour chien, Dog Bowl→Gamelle pour chien, Dog Harness→Harnais pour chien, Cat Food→Nourriture pour chat, Cat Treats→Friandises pour chat, Dog Food→Nourriture pour chien, Dog Treats→Friandises pour chien.
- Traduis les adjectifs : Really→Vraiment, Great→Super, Good→Bon, Best→Meilleur, Amazing→Incroyable, Premium→Premium, Natural→Naturel, Organic→Bio, Fresh→Frais, Original→Original, Perfect→Parfait, Ultimate→Ultime.
- Traduis les autres mots : Cat→Chat, Dog→Chien, Tree→Arbre, Tower→Tour, Box→Boîte, Litter→Litière, Enclosure→Meuble, Toy→Jouet, Bed→Lit, Bowl→Bol, Feeder→Distributeur, Scratcher→Griffoir, Harness→Harnais, Leash→Laisse, Collar→Collier, House→Maison, Food→Nourriture, Treat→Friandise, Grain→Céréale, Free→Sans, With→Avec, For→Pour, Small→Petit, Medium→Moyen, Large→Grand, Pack→Lot, Set→Ensemble, Bundle→Pack, Kit→Kit, Rope→Corde, Mat→Tapis, Pad→Coussin, Cover→Housse, Furniture→Meuble.
- Garde UNIQUEMENT les noms propres de lignes produits (Haven, Milo, Grove, Luna, etc.) et les noms de marques (Puft, CanadaPetCare, Tuft & Paw, Trixie, etc.) tels quels.
- Chiffres, unités et tirets inchangés.
Réponds UNIQUEMENT avec les traductions, une par ligne, dans le même ordre. Pas d'explication.\n\n${names.join('\n')}`;
}

export function translateDescPrompt(descs: string[]): string {
  return `Tu es un expert en produits pour animaux de compagnie. Pour chaque description ci-dessous :
- Si elle est DÉJÀ en français, retourne-la IDENTIQUE.
- Si elle est principalement en anglais ou en néerlandais, traduis-la en français naturel. Garde les noms de marques et les chiffres tels quels.
Réponds UNIQUEMENT avec un tableau JSON des résultats dans le même ordre. Pas d'explication, pas de markdown.\n\n${JSON.stringify(descs)}`;
}
