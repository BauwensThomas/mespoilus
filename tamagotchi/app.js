// ============================================================
// MON CHIEN — Tamagotchi Game Logic
// localStorage only (no server needed for localhost testing)
// ============================================================

const STORAGE_KEY = 'monchien_v1';
const Q_PER_DAY = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EGG_STAGES = ['egg_1', 'egg_2', 'egg_3', 'egg_open'];

const STAGES = {
  egg_1: { emoji: '🥚', label: 'Oeuf mystérieux', cls: 'stage-egg-1' },
  egg_2: { emoji: '🥚', label: 'Oeuf fissuré...', cls: 'stage-egg-2' },
  egg_3: { emoji: '🐣', label: 'Prêt à éclore !', cls: 'stage-egg-3' },
  egg_open: { emoji: '🐣', label: 'Il sort !', cls: 'stage-egg-open' },
  baby: { emoji: '🐶', label: 'Bébé chien', cls: 'stage-baby' },
  thin: { emoji: '🦮', label: 'Chien maigre', cls: 'stage-thin' },
  normal: { emoji: '🐕', label: 'Chien en forme', cls: 'stage-normal' },
  fat: { emoji: '🐕', label: 'Chien dodu', cls: 'stage-fat' },
  muscular: { emoji: '🐕‍🦺', label: 'Chien athlète', cls: 'stage-muscular' },
};

const QUESTIONS = [
  // ══ OEUF — Identité ══
  {
    id: 'q001',
    texte: "✨ Quelque chose s'agite dans l'œuf...\nQui es-tu ?",
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: [],
    tags_exclus: ['genre_ok'],
    reponses: [
      { texte: '🐾 Un garçon fougueux !', effets: { bonheur: 5 }, tags: ['male', 'genre_ok'] },
      { texte: '🌸 Une fille espiègle !', effets: { bonheur: 5 }, tags: ['female', 'genre_ok'] },
    ],
  },
  {
    id: 'q002_m',
    texte: 'Tu es un garçon !\nQuel est ton premier instinct ?',
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: ['male'],
    tags_exclus: ['instinct_ok'],
    reponses: [
      { texte: '🍖 Manger quelque chose.', effets: { poids: 5 }, tags: ['gourmand', 'instinct_ok'] },
      { texte: '💨 Courir très vite !', effets: { energie: 10 }, tags: ['sportif', 'instinct_ok'] },
      { texte: '😴 Dormir encore un peu.', effets: { bonheur: 8 }, tags: ['calme', 'instinct_ok'] },
    ],
  },
  {
    id: 'q002_f',
    texte: 'Tu es une fille !\nQuel est ton premier instinct ?',
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: ['female'],
    tags_exclus: ['instinct_ok'],
    reponses: [
      { texte: '🌺 Trouver un câlin.', effets: { bonheur: 10 }, tags: ['affectueux', 'instinct_ok'] },
      { texte: '🎾 Jouer et sauter !', effets: { energie: 8 }, tags: ['joueur', 'instinct_ok'] },
      { texte: '🍰 Manger quelque chose.', effets: { poids: 5 }, tags: ['gourmand', 'instinct_ok'] },
    ],
  },
  {
    id: 'q003',
    texte: "L'œuf vibre fort...\nCe qui t'attire le plus ?",
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: [],
    tags_exclus: ['attrait_ok'],
    reponses: [
      { texte: '🌳 La forêt et la nature.', effets: { energie: 8 }, tags: ['outdoor', 'attrait_ok'] },
      { texte: '🏠 La maison et le confort.', effets: { bonheur: 8 }, tags: ['indoor', 'attrait_ok'] },
      { texte: '🏙️ La ville et les amis.', effets: { bonheur: 5, energie: 3 }, tags: ['social', 'attrait_ok'] },
    ],
  },
  {
    id: 'q004',
    texte: "Une fissure... tu sens quelque chose\nà travers la coquille. C'est...",
    stades: ['egg_2'],
    tags_requis: [],
    tags_exclus: ['sens_ok'],
    reponses: [
      { texte: '☀️ De la lumière chaude.', effets: { bonheur: 8 }, tags: ['outdoor', 'sens_ok'] },
      { texte: '🍖 Une odeur de nourriture !', effets: { poids: 3, bonheur: 6 }, tags: ['gourmand', 'sens_ok'] },
      { texte: '🤗 De la chaleur humaine.', effets: { bonheur: 10 }, tags: ['affectueux', 'sens_ok'] },
      { texte: "🌬️ De l'air frais et libre.", effets: { energie: 8 }, tags: ['outdoor', 'sens_ok'] },
    ],
  },
  {
    id: 'q004b',
    texte: "Tu entends des sons pour la première fois.\nLequel t'attire ?",
    stades: ['egg_2'],
    tags_requis: [],
    tags_exclus: ['son_dehors_ok'],
    reponses: [
      { texte: '🎵 Une mélodie douce.', effets: { bonheur: 8 }, tags: ['calme', 'son_dehors_ok'] },
      { texte: '🏃 Des pas qui courent.', effets: { energie: 8 }, tags: ['sportif', 'son_dehors_ok'] },
      { texte: '🍽️ Des bruits de cuisine.', effets: { poids: 3, bonheur: 6 }, tags: ['gourmand', 'son_dehors_ok'] },
      { texte: "🐾 D'autres animaux qui jouent.", effets: { bonheur: 10 }, tags: ['social', 'son_dehors_ok'] },
    ],
  },
  {
    id: 'q005',
    texte: "L'œuf se brise presque...\nQue veux-tu faire en premier ?",
    stades: ['egg_3'],
    tags_requis: [],
    tags_exclus: ['pouvoir_ok'],
    reponses: [
      { texte: '👃 Tout renifler autour de moi.', effets: { energie: 5 }, tags: ['pisteur', 'pouvoir_ok'] },
      { texte: '💨 Courir le plus vite possible.', effets: { energie: 10 }, tags: ['rapide', 'pouvoir_ok'] },
      { texte: "🛡️ Trouver quelqu'un à protéger.", effets: { bonheur: 8 }, tags: ['gardien', 'pouvoir_ok'] },
      { texte: '😋 Trouver quelque chose à manger !', effets: { poids: 5, bonheur: 8 }, tags: ['gourmand', 'pouvoir_ok'] },
    ],
  },
  {
    id: 'q005b',
    texte: 'Plus que quelques secondes...\nTu penses à quoi ?',
    stades: ['egg_3'],
    tags_requis: [],
    tags_exclus: ['couleur_ok'],
    reponses: [
      { texte: "🌅 Au soleil qui m'attend dehors.", effets: { bonheur: 8 }, tags: ['couleur_or', 'outdoor', 'couleur_ok'] },
      { texte: '🌲 À la forêt à explorer.', effets: { energie: 8 }, tags: ['couleur_marron', 'outdoor', 'couleur_ok'] },
      { texte: '🤗 Aux bras qui vont me câliner.', effets: { bonheur: 10 }, tags: ['affectueux', 'couleur_ok'] },
      { texte: '🍖 À manger enfin quelque chose !', effets: { poids: 5, bonheur: 6 }, tags: ['gourmand', 'couleur_ok'] },
    ],
  },
  {
    id: 'q_egg_a',
    texte: "L'œuf tremble doucement...\nQue ressens-tu ?",
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '✨ De la curiosité !', effets: {}, tags: ['curieux'] },
      { texte: '😌 Une grande sérénité.', effets: {}, tags: ['calme'] },
      { texte: "⚡ De l'impatience !", effets: {}, tags: ['joueur'] },
    ],
  },
  {
    id: 'q_egg_b',
    texte: "Dans ton sommeil d'œuf...\ntu rêves de quoi ?",
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🌿 De grands espaces verts.', effets: {}, tags: ['outdoor'] },
      { texte: "🔥 D'une grande aventure.", effets: {}, tags: ['explorateur'] },
      { texte: "🤗 D'une chaleur douce.", effets: {}, tags: ['affectueux'] },
      { texte: '🍖 De quelque chose de bon.', effets: {}, tags: ['gourmand'] },
    ],
  },
  {
    id: 'q_egg_c',
    texte: 'La coquille est ton univers...\nQuel mot te définit ?',
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🌟 Libre.', effets: {}, tags: ['outdoor', 'rapide'] },
      { texte: '💪 Fort.', effets: {}, tags: ['gardien'] },
      { texte: '😄 Joyeux.', effets: {}, tags: ['comique', 'joueur'] },
      { texte: '🧠 Malin.', effets: {}, tags: ['curieux', 'pisteur'] },
    ],
  },
  {
    id: 'q_egg_d',
    texte: 'Si tu pouvais choisir\noù naître...',
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🌲 Dans une forêt profonde.', effets: {}, tags: ['outdoor', 'explorateur'] },
      { texte: '🏠 Dans une maison chaleureuse.', effets: {}, tags: ['indoor', 'affectueux'] },
      { texte: '🏖️ Sur une plage ensoleillée.', effets: {}, tags: ['outdoor'] },
      { texte: "🌆 Au cœur d'une grande ville.", effets: {}, tags: ['social'] },
    ],
  },
  {
    id: 'q_egg_e',
    texte: "Dans le silence de l'œuf...\ntu perçois une présence.",
    stades: ['egg_1', 'egg_2', 'egg_3'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🤗 Elle est douce et rassurante.', effets: {}, tags: ['affectueux', 'calme'] },
      { texte: '⚡ Elle est vive et excitante.', effets: {}, tags: ['joueur', 'rapide'] },
      { texte: '🛡️ Elle est forte et protectrice.', effets: {}, tags: ['gardien', 'courageux'] },
    ],
  },

    // ══ BABY — Découverte du monde ══
  {
    id: 'q010',
    texte: '🐣 Tu es né !\nTa toute première action ?',
    stades: ['egg_open', 'baby'],
    tags_requis: [],
    tags_exclus: ['premier_geste'],
    reponses: [
      { texte: '👅 Lécher tout ce qui bouge.', effets: { bonheur: 10, poids: 3 }, tags: ['gourmand', 'premier_geste'] },
      { texte: '🐾 Partir explorer partout.', effets: { energie: 10 }, tags: ['explorateur', 'premier_geste'] },
      { texte: '💤 Me rendormir encore un peu.', effets: { energie: 8, bonheur: 5 }, tags: ['calme', 'premier_geste'] },
    ],
  },
  {
    id: 'q011',
    texte: 'Tu as faim pour la première fois.\nQue veux-tu manger ?',
    stades: ['egg_open', 'baby'],
    tags_requis: [],
    tags_exclus: ['premier_repas'],
    reponses: [
      { texte: '🥛 Du lait bien chaud.', effets: { poids: 4, bonheur: 8 }, tags: ['premier_repas'] },
      { texte: "🍖 Une côtelette d'agneau !", effets: { poids: 10, energie: 5 }, tags: ['carnivore', 'premier_repas'] },
      { texte: '🥕 Des légumes ? Beurk... ok.', effets: { poids: 2, energie: 8 }, tags: ['sain', 'premier_repas'] },
    ],
  },
  {
    id: 'q012_m',
    texte: 'Tu rencontres un humain.\nQue fais-tu ?',
    stades: ['egg_open', 'baby'],
    tags_requis: ['male'],
    tags_exclus: ['premier_humain'],
    reponses: [
      { texte: '💨 Je fonce à toute vitesse !', effets: { energie: 8 }, tags: ['courageux', 'premier_humain'] },
      { texte: '👃 Je renifle prudemment.', effets: { bonheur: 5 }, tags: ['prudent', 'premier_humain'] },
      { texte: '🙈 Je me cache... timidement.', effets: { bonheur: 3 }, tags: ['timide', 'premier_humain'] },
    ],
  },
  {
    id: 'q012_f',
    texte: 'Tu rencontres un humain.\nComment tu réagis ?',
    stades: ['egg_open', 'baby'],
    tags_requis: ['female'],
    tags_exclus: ['premier_humain'],
    reponses: [
      { texte: '🐾 Je saute sur lui immédiatement !', effets: { bonheur: 10 }, tags: ['affectueux', 'premier_humain'] },
      { texte: '🌸 Je me roule pour un câlin.', effets: { bonheur: 8 }, tags: ['calme', 'premier_humain'] },
      { texte: "👀 Je l'observe de loin.", effets: { energie: 3 }, tags: ['curieux', 'premier_humain'] },
    ],
  },
  {
    id: 'q013',
    texte: 'Ton premier jouet est là !\nLequel tu choisis ?',
    stades: ['baby', 'thin', 'normal'],
    tags_requis: [],
    tags_exclus: ['jouet_ok'],
    reponses: [
      { texte: '🎾 Une balle rebondissante.', effets: { energie: 10, bonheur: 5 }, tags: ['aime_balle', 'jouet_ok'] },
      { texte: '🦴 Un os à ronger.', effets: { poids: 3, bonheur: 8 }, tags: ['aime_os', 'jouet_ok'] },
      { texte: '🪢 Une corde à tirer.', effets: { energie: 8, bonheur: 8 }, tags: ['aime_corde', 'jouet_ok'] },
      { texte: '🧸 Un doudou tout doux.', effets: { bonheur: 12 }, tags: ['aime_doudou', 'jouet_ok'] },
    ],
  },
  {
    id: 'q014',
    texte: 'Tu vois un écureuil !\nQue fais-tu ?',
    stades: ['baby', 'thin', 'normal'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '💨 Je le poursuis à toute vitesse !', effets: { energie: 8, bonheur: 10 }, tags: ['chasseur'] },
      { texte: "🐾 J'aboie très fort !", effets: { bonheur: 8 }, tags: [] },
      { texte: '👁️ Je le regarde, fasciné.', effets: { bonheur: 5 }, tags: ['curieux'] },
    ],
  },
  {
    id: 'q015',
    texte: 'Quel bruit tu fais quand tu es content ?',
    stades: ['baby', 'thin', 'normal'],
    tags_requis: [],
    tags_exclus: ['son_ok'],
    reponses: [
      { texte: "🔊 J'aboie à tue-tête !", effets: { energie: 6, bonheur: 8 }, tags: ['bruyant', 'son_ok'] },
      { texte: '🌀 Je tourne en rond tout seul.', effets: { bonheur: 10 }, tags: ['expressif', 'son_ok'] },
      { texte: '😛 Je lèche tout le monde.', effets: { bonheur: 12 }, tags: ['affectueux', 'son_ok'] },
    ],
  },

  // ══ NOURRITURE ══
  {
    id: 'q020',
    texte: "🍽️ L'heure du repas !\nCombien tu manges ?",
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🥗 Une petite portion légère.', effets: { poids: 2, energie: 5 }, tags: [] },
      { texte: '🍽️ Une portion normale.', effets: { energie: 8 }, tags: [] },
      { texte: '🍖🍖 Une double portion !', effets: { poids: 15, bonheur: 5 }, tags: ['a_mange_double'] },
    ],
  },
  {
    id: 'q021',
    texte: 'Encore une petite faim...\nTu craques pour un snack ?',
    stades: ['baby', 'thin', 'normal', 'fat'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🍪 Oui, un petit biscuit !', effets: { poids: 8, bonheur: 8 }, tags: ['a_grignote'] },
      { texte: '💪 Non, je résiste !', effets: { energie: 5 }, tags: ['discipline'] },
    ],
  },
  {
    id: 'q022',
    texte: '⚠️ Tu as déjà bien mangé...\nEncore un snack quand même ?',
    stades: ['baby', 'normal', 'fat'],
    tags_requis: ['a_mange_double'],
    tags_exclus: [],
    reponses: [
      { texte: '🍕 Allez... juste un bout.', effets: { poids: 12, bonheur: 5 }, tags: ['tres_gourmand'] },
      { texte: "🚫 Non, j'ai assez mangé.", effets: { energie: 8 }, tags: ['discipline'] },
    ],
  },
  {
    id: 'q023',
    texte: 'Repas du soir !\nQue veux-tu manger ?',
    stades: ['normal', 'fat', 'thin', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🥩 Du bœuf grillé et légumes.', effets: { poids: 5, energie: 10 }, tags: ['proteine'] },
      { texte: '🍝 Des pâtes bolognaise.', effets: { poids: 10, bonheur: 8 }, tags: [] },
      { texte: '🥦 Un repas sain et vert.', effets: { poids: 3, energie: 12 }, tags: ['sain'] },
      { texte: '🍔 Un burger géant.', effets: { poids: 18, bonheur: 12 }, tags: ['tres_gourmand', 'junk_food'] },
    ],
  },
  {
    id: 'q024',
    texte: "Tu passes devant la cuisine...\nL'odeur est trop bonne !",
    stades: ['normal', 'fat', 'baby'],
    tags_requis: ['gourmand'],
    tags_exclus: [],
    reponses: [
      { texte: '🏃 Je fais demi-tour vite fait.', effets: { poids: -3, bonheur: 3 }, tags: ['discipline'] },
      { texte: '👀 Je fais mes yeux tristes...', effets: { poids: 6, bonheur: 10 }, tags: ['a_grignote'] },
      { texte: '😈 Je fouille à toute vitesse !', effets: { poids: 12, bonheur: 8 }, tags: ['tres_gourmand'] },
    ],
  },
  {
    id: 'q025',
    texte: 'Ton humain mange une pizza...\nTu fais quoi ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '👁️ Je le regarde fixement...', effets: { bonheur: 5 }, tags: [] },
      { texte: "🐾 Je saute et j'aboie !", effets: { bonheur: 10 }, tags: ['bruyant'] },
      { texte: '😌 Je respecte son repas.', effets: { energie: 5, bonheur: 3 }, tags: ['discipline'] },
    ],
  },

    // ══ SPORT & EXERCISE ══
  {
    id: 'q030',
    texte: '🌅 Balade du matin !\nComment tu y vas ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🏃 En courant à toute allure !', effets: { poids: -10, energie: -5, bonheur: 10 }, tags: ['a_couru'] },
      { texte: '🚶 En marchant calmement.', effets: { poids: -3, bonheur: 8 }, tags: [] },
      { texte: '😴 En traînant les pattes...', effets: { poids: 3 }, tags: ['pas_bouge'] },
    ],
  },
  {
    id: 'q031',
    texte: "⚠️ Tu n'as pas bougé hier...\nOn fait du sport aujourd'hui ?",
    stades: ['normal', 'fat'],
    tags_requis: ['pas_bouge'],
    tags_exclus: [],
    reponses: [
      { texte: "💪 30 min de course, c'est parti !", effets: { poids: -15, energie: 5, bonheur: 10 }, tags: ['a_couru', 'repris_sport'] },
      { texte: "🛋️ Demain... c'est promis.", effets: { poids: 5 }, tags: ['pas_bouge'] },
    ],
  },
  {
    id: 'q032',
    texte: "🎾 Tu joues avec qui aujourd'hui ?",
    stades: ['baby', 'thin', 'normal', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '👦 Ton humain préféré.', effets: { bonheur: 12, energie: 5 }, tags: ['joue_humain'] },
      { texte: '🐕 Un autre chien du quartier.', effets: { bonheur: 10, energie: 8 }, tags: ['ami_chien'] },
      { texte: '🎾 Tout seul avec ta balle.', effets: { energie: 8, bonheur: 5 }, tags: [] },
    ],
  },
  {
    id: 'q033',
    texte: "⚡ Plein d'énergie !\nQuel sport tu choisis ?",
    stades: ['thin', 'normal', 'muscular'],
    tags_requis: ['sportif'],
    tags_exclus: [],
    reponses: [
      { texte: '🏊 La natation.', effets: { poids: -12, energie: 8, bonheur: 10 }, tags: ['nageur'] },
      { texte: '🏋️ La musculation.', effets: { poids: -8, energie: -5, bonheur: 8 }, tags: ['muscu'] },
      { texte: '🚴 Vélo avec ton maître.', effets: { poids: -10, energie: 5, bonheur: 10 }, tags: [] },
    ],
  },
  {
    id: 'q034',
    texte: '☔ Il pleut dehors...\nTu fais quoi ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🛋️ Je reste au chaud, parfait.', effets: { bonheur: 10 }, tags: ['pas_bouge', 'indoor'] },
      { texte: "🌧️ Je sors, j'adore la pluie.", effets: { poids: -8, bonheur: 8 }, tags: ['a_couru', 'outdoor'] },
      { texte: "🎮 Jeux d'intérieur avec toi.", effets: { bonheur: 8, energie: 5 }, tags: [] },
    ],
  },
  {
    id: 'q035',
    texte: '🌟 Tu croises un parc immense.\nQue fais-tu ?',
    stades: ['thin', 'normal', 'fat', 'muscular'],
    tags_requis: ['outdoor'],
    tags_exclus: [],
    reponses: [
      { texte: '🌿 Je cours partout en liberté.', effets: { poids: -10, bonheur: 15 }, tags: ['a_couru'] },
      { texte: '🐕 Je cherche des amis chiens.', effets: { bonheur: 12, energie: 5 }, tags: ['ami_chien'] },
      { texte: '🌸 Je renifle toutes les fleurs.', effets: { bonheur: 8 }, tags: ['curieux'] },
    ],
  },

  // ══ BONHEUR BAS ══
  {
    id: 'q_sad_1',
    texte: "😔 Tu ne te sens pas bien...\nQu'est-ce qui t'aiderait ?",
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    bonheur_max: 30,
    reponses: [
      { texte: '🤗 Un long câlin de mon humain.', effets: { bonheur: 15 }, tags: ['affectueux'] },
      { texte: '😴 Dormir et me reposer.', effets: { energie: 10, bonheur: 8 }, tags: ['calme'] },
      { texte: "🌳 Sortir prendre l'air.", effets: { bonheur: 10, poids: -3 }, tags: ['outdoor'] },
    ],
  },
  {
    id: 'q_sad_2',
    texte: '💔 Tu es épuisé...\nOù tu trouves la force de continuer ?',
    stades: ['thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    bonheur_max: 25,
    reponses: [
      { texte: "❤️ Dans l'amour de mon humain.", effets: { bonheur: 12 }, tags: ['affectueux'] },
      { texte: '🍖 Dans un bon repas réconfortant.', effets: { bonheur: 8, poids: 5 }, tags: ['gourmand'] },
      { texte: '🌟 Je ne sais pas... mais je tiens.', effets: { bonheur: 6 }, tags: [] },
    ],
  },
  {
    id: 'q_sad_3',
    texte: "😟 Tu as l'air triste...\nQu'est-ce qui te manque ?",
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    bonheur_max: 35,
    reponses: [
      { texte: '🐕 Des amis avec qui jouer.', effets: { bonheur: 10 }, tags: ['social'] },
      { texte: '🏃 Bouger et me dépenser.', effets: { bonheur: 8, poids: -5 }, tags: ['a_couru'] },
      { texte: '🥣 Manger quelque chose de bon.', effets: { bonheur: 8, poids: 5 }, tags: ['gourmand'] },
    ],
  },

  // ══ SURPOIDS / MUSCLE ══
  {
    id: 'q050',
    texte: '⚠️ Tu as grossi ces derniers jours...\nTu veux faire quelque chose ?',
    stades: ['fat'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '💪 Régime et sport dès demain !', effets: { poids: -5, energie: 8 }, tags: ['regime', 'a_couru'] },
      { texte: '🍩 Je suis bien comme je suis !', effets: { bonheur: 10 }, tags: ['assume'] },
      { texte: '😟 Je me sens pas bien...', effets: { bonheur: -5 }, tags: ['anxieux'] },
    ],
  },
  {
    id: 'q051',
    texte: '🥗 Tu fais un régime !\nMenu du jour ?',
    stades: ['fat', 'normal'],
    tags_requis: ['regime'],
    tags_exclus: [],
    reponses: [
      { texte: '🥦 Légumes uniquement.', effets: { poids: 3, energie: 5 }, tags: [] },
      { texte: '🍗 Poulet grillé sans sauce.', effets: { poids: 5, energie: 10 }, tags: ['proteine'] },
      { texte: '😅 Régime à moitié...', effets: { poids: -3 }, tags: [] },
    ],
  },
  {
    id: 'q060',
    texte: "💪 Tu t'entraînes dur !\nCombien de séances cette semaine ?",
    stades: ['normal', 'thin'],
    tags_requis: ['muscu'],
    tags_exclus: [],
    reponses: [
      { texte: '🔥 7/7 — je suis une machine !', effets: { poids: -10, energie: -8, bonheur: 8 }, tags: ['tres_sportif'] },
      { texte: '💪 5 séances raisonnables.', effets: { poids: -5, energie: -3, bonheur: 10 }, tags: ['tres_sportif'] },
      { texte: '😅 2 séances, je suis occupé.', effets: { poids: -2 }, tags: [] },
    ],
  },
  {
    id: 'q061',
    texte: '🏅 Tu progresses vraiment !\nQu’est-ce qui te motive ?',
    stades: ['normal', 'thin', 'muscular'],
    tags_requis: ['tres_sportif'],
    tags_exclus: [],
    reponses: [
      { texte: '🏆 Être le plus fort du quartier.', effets: { energie: 8, bonheur: 8 }, tags: ['champion'] },
      { texte: '❤️ Pour être en bonne santé.', effets: { bonheur: 12, energie: 5 }, tags: [] },
      { texte: '🎾 Pour courir plus vite que tout.', effets: { energie: 12, bonheur: 5 }, tags: ['rapide'] },
    ],
  },

  // ══ SOCIAL / SAISONS / FUN ══
  {
    id: 'q070',
    texte: '🐕 Tu croises un autre chien.\nQue fais-tu ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: "👋 Je m'approche pour jouer !", effets: { bonheur: 12, energie: 5 }, tags: ['social', 'ami_chien'] },
      { texte: '😤 Je gronde pour montrer qui est le chef.', effets: { energie: 5 }, tags: ['dominant'] },
      { texte: "😶 Je l'ignore royalement.", effets: { bonheur: 3 }, tags: ['solitaire'] },
    ],
  },
  {
    id: 'q071',
    texte: "🌟 Ton humain te félicite !\nTu penses que c'est pour quoi ?",
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: "🎾 J'ai bien rapporté la balle.", effets: { bonheur: 10, energie: 5 }, tags: [] },
      { texte: "🚽 J'ai fait pipi au bon endroit !", effets: { bonheur: 15 }, tags: ['propre'] },
      { texte: "😴 J'ai été sage et silencieux.", effets: { bonheur: 8, energie: 8 }, tags: ['calme'] },
    ],
  },
  {
    id: 'q072',
    texte: '😱 Tu as fait une bêtise !\nLaquelle ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: "🛋️ J'ai mâché le canapé.", effets: { bonheur: 5, energie: 5 }, tags: ['destructeur'] },
      { texte: "🗑️ J'ai fouillé la poubelle.", effets: { poids: 8, bonheur: 5 }, tags: ['tres_gourmand'] },
      { texte: "🧦 J'ai caché ses chaussettes.", effets: { bonheur: 8 }, tags: ['espiegle'] },
    ],
  },
  {
    id: 'q073',
    texte: 'Des enfants veulent jouer avec toi.\nTu acceptes ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    bonheur_min: 35,
    reponses: [
      { texte: "🎉 Oui ! Les enfants c'est génial.", effets: { bonheur: 15, energie: 8 }, tags: ['social', 'ami_enfant'] },
      { texte: '🤔 Je suis méfiant au début.', effets: { bonheur: 5 }, tags: ['prudent'] },
      { texte: "🙅 Non, j'ai besoin de calme.", effets: { energie: 8 }, tags: ['solitaire'] },
    ],
  },
  {
    id: 'q080',
    texte: '☀️ Il fait beau !\nOù veux-tu aller ?',
    stades: ['thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🏖️ À la plage courir sur le sable.', effets: { poids: -10, bonheur: 15 }, tags: ['outdoor', 'a_couru'] },
      { texte: '🌳 Dans le parc du quartier.', effets: { poids: -5, bonheur: 12 }, tags: ['outdoor'] },
      { texte: "🏠 Rester à l'ombre chez moi.", effets: { bonheur: 8, energie: 10 }, tags: ['indoor', 'pas_bouge'] },
    ],
  },
  {
    id: 'q081',
    texte: '❄️ Première neige !\nComment tu réagis ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: ['vu_neige'],
    reponses: [
      { texte: '❄️ Je me roule dedans avec joie !', effets: { bonheur: 15, poids: -5 }, tags: ['vu_neige', 'aime_neige', 'a_couru'] },
      { texte: "😨 Je recule, c'est bizarre...", effets: { bonheur: 3 }, tags: ['vu_neige', 'frileux'] },
      { texte: '😋 Je mange la neige... Miam ?', effets: { bonheur: 10, poids: 3 }, tags: ['vu_neige', 'tres_gourmand'] },
    ],
  },
  {
    id: 'q082',
    texte: '🌧️ Il fait froid et gris...\nQue ressens-tu ?',
    stades: ['thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '😴 Parfait pour rester sous la couette.', effets: { energie: 12, bonheur: 8 }, tags: ['indoor', 'pas_bouge'] },
      { texte: "💨 J'aime le vent dans mes poils.", effets: { bonheur: 10, energie: 5 }, tags: ['outdoor', 'a_couru'] },
      { texte: '😔 Ce temps me rend un peu triste.', effets: { bonheur: -5 }, tags: [] },
    ],
  },
  {
    id: 'q090',
    texte: '💭 En général, tu rêves\nde quoi quand tu dors ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🐿️ Chasser les écureuils.', effets: { energie: 5, bonheur: 8 }, tags: ['chasseur'] },
      { texte: '🍖 Un festin infini de viande.', effets: { poids: 5, bonheur: 10 }, tags: ['gourmand'] },
      { texte: '🌍 Explorer de nouveaux horizons.', effets: { bonheur: 10, energie: 8 }, tags: ['explorateur'] },
      { texte: '🤗 Être avec mon humain pour toujours.', effets: { bonheur: 12 }, tags: ['affectueux'] },
    ],
  },
  {
    id: 'q091',
    texte: '🤔 Si tu pouvais parler,\ntu dirais quoi ?',
    stades: ['normal', 'fat', 'muscular', 'thin'],
    tags_requis: [],
    tags_exclus: [],
    bonheur_min: 40,
    reponses: [
      { texte: '"Encore des croquettes SVP !"', effets: { poids: 3, bonheur: 10 }, tags: ['gourmand'] },
      { texte: '"Je t’aime, humain."', effets: { bonheur: 15 }, tags: ['affectueux'] },
      { texte: '"On joue ? On joue ? On joue ?"', effets: { energie: 8, bonheur: 12 }, tags: ['joueur'] },
      { texte: '"Qui est le bon garçon ? Moi !"', effets: { bonheur: 12 }, tags: ['comique'] },
    ],
  },
  {
    id: 'q092',
    texte: '🎂 Joyeux anniversaire !\nQuel cadeau tu veux ?',
    stades: ['thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    bonheur_min: 50,
    reponses: [
      { texte: '🎾 Un nouveau jouet !', effets: { bonheur: 15 }, tags: ['joueur'] },
      { texte: '🍰 Un gâteau pour chien.', effets: { poids: 10, bonheur: 15 }, tags: ['tres_gourmand'] },
      { texte: '🐕 Un ami chien pour jouer.', effets: { bonheur: 15, energie: 8 }, tags: ['ami_chien'] },
      { texte: '🛋️ Une sieste sans être dérangé.', effets: { energie: 15, bonheur: 10 }, tags: ['calme'] },
    ],
  },
  {
    id: 'q093',
    texte: 'Ton humain part au travail...\nTu fais quoi tout seul ?',
    stades: ['thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '😭 Je pleure à la porte.', effets: { bonheur: -5 }, tags: ['collant'] },
      { texte: "😴 Je fais une sieste jusqu'à son retour.", effets: { energie: 12, bonheur: 5 }, tags: ['calme'] },
      { texte: '🛋️ Je vole sa place sur le canapé.', effets: { bonheur: 10, energie: 8 }, tags: ['espiegle'] },
      { texte: '🧦 Je garde ses chaussettes précieusement.', effets: { bonheur: 8 }, tags: ['affectueux'] },
    ],
  },
  {
    id: 'q094',
    texte: 'Tu entends un bruit bizarre la nuit...\nQue fais-tu ?',
    stades: ['thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: "🦸 J'aboie et je protège !", effets: { energie: 5, bonheur: 8 }, tags: ['gardien', 'courageux'] },
      { texte: '😨 Je me cache sous le lit.', effets: { bonheur: 3 }, tags: ['timide'] },
      { texte: '💤 Je me rendors immédiatement.', effets: { energie: 8 }, tags: ['calme'] },
    ],
  },
  {
    id: 'q095',
    texte: "On te propose d'apprendre\nun nouveau tour. Lequel ?",
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🤝 Serrer la patte.', effets: { bonheur: 10 }, tags: ['discipline', 'social'] },
      { texte: '🔄 Faire le tour complet.', effets: { energie: 8, bonheur: 10 }, tags: ['acrobate'] },
      { texte: '🎭 Faire le mort dramatiquement.', effets: { bonheur: 12 }, tags: ['comique'] },
    ],
  },
  {
    id: 'q096',
    texte: 'Tu rencontres un chat...\nComment tu te comportes ?',
    stades: ['baby', 'thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🏃 Je le poursuis partout !', effets: { energie: 8, bonheur: 8 }, tags: ['chasseur'] },
      { texte: '👃 Je renifle avec curiosité.', effets: { bonheur: 5 }, tags: ['curieux'] },
      { texte: '🤝 On devient amis (wow rare !).', effets: { bonheur: 15 }, tags: ['social', 'ami_chat'] },
    ],
  },
  {
    id: 'q097',
    texte: 'Quelle est ta routine\ndu matin idéale ?',
    stades: ['thin', 'normal', 'fat', 'muscular'],
    tags_requis: [],
    tags_exclus: [],
    reponses: [
      { texte: '🌅 Course + petit-déjeuner sain.', effets: { poids: -5, energie: 10, bonheur: 8 }, tags: ['a_couru', 'sportif'] },
      { texte: "😴 Grasse matinée jusqu'à midi.", effets: { energie: 12, bonheur: 8 }, tags: ['calme', 'pas_bouge'] },
      { texte: '🎾 Jouer direct dès le réveil !', effets: { energie: 8, bonheur: 12 }, tags: ['joueur'] },
    ],
  },
];

let pet = null;
let isNewDay = false;
let showedMorningMsg = false;

function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

function newPet() {
  return {
    nom: '',
    genre: null,
    stade: 'egg_1',
    jour: 1,
    bonheur: 50,
    energie: 50,
    poids: 50,
    tags: [],
    q_today: 0,
    q_ids_today: [],
    q_ids_hier: [],
    reset_at: Date.now(),
    msgs_matin: [],
    mort: false,
    mort_raison: '',
    created_at: Date.now(),
  };
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
}

function applyNightEffects() {
  if (EGG_STAGES.includes(pet.stade)) {
    pet.bonheur = clamp(pet.bonheur - 3);
    pet.energie = clamp(pet.energie - 3);
    pet.poids = clamp(pet.poids - 2);
  } else {
    pet.bonheur = clamp(pet.bonheur - 10);
    pet.energie = clamp(pet.energie - 15);
    pet.poids = clamp(pet.poids - 5);
  }
}

function checkDeath() {
  if (pet.mort) return true;
  if (EGG_STAGES.includes(pet.stade)) return false;
  const dead_b = pet.bonheur <= 0;
  const dead_e = pet.energie <= 0;
  const dead_p = pet.poids <= 0;
  if (!dead_b && !dead_e && !dead_p) return false;

  pet.mort = true;
  if (dead_b && dead_e) pet.mort_raison = 'both';
  else if (dead_b) pet.mort_raison = 'bonheur';
  else if (dead_e) pet.mort_raison = 'energie';
  else pet.mort_raison = 'poids';
  save();
  return true;
}

function calcStage() {
  const { jour, poids, tags } = pet;
  if (jour <= 1) return 'egg_1';
  if (jour === 2) return 'egg_2';
  if (jour === 3) return 'egg_3';
  if (jour === 4) return 'egg_open';
  if (jour <= 7) return 'baby';
  if (tags.includes('tres_sportif') && tags.includes('muscu') && poids < 45) return 'muscular';
  if (poids >= 75) return 'fat';
  if (poids >= 42) return 'normal';
  return 'thin';
}

function buildMorningMsgs(tagsHier = []) {
  const m = [];

  if (EGG_STAGES.includes(pet.stade)) {
    const eggMsgs = {
      egg_1: "🥚 L'œuf vibre doucement... quelque chose s'éveille en toi.",
      egg_2: '🥚 Une nouvelle fissure est apparue cette nuit. Tu sens le monde dehors.',
      egg_3: "🐣 L'œuf tremble très fort. C'est pour bientôt...",
      egg_open: '🐣 La coquille se brise... tu es prêt.',
    };
    m.push(eggMsgs[pet.stade] || '🥚 La nuit a passé...');
  } else {
    if (pet.bonheur < 20) m.push('💔 Tu te réveilles épuisé. Prends soin de toi !');
    else if (pet.bonheur < 40) m.push("😔 Tu te réveilles un peu triste. Qu'est-ce qui te ferait du bien ?");
    else m.push('🌅 Une nouvelle journée commence. Tu as faim et soif !');

    if (tagsHier.includes('tres_gourmand')) m.push('😅 Tu as beaucoup mangé hier... attention au poids !');
    else if (tagsHier.includes('a_mange_double')) m.push('🍖 Tu as bien mangé hier. Un peu de sport ne ferait pas de mal !');

    if (tagsHier.includes('pas_bouge') && !tagsHier.includes('a_couru')) {
      m.push("🛋️ Tu n'as pas bougé hier... ton corps en a besoin !");
    } else if (tagsHier.includes('a_couru')) {
      m.push("💪 Belle journée hier ! La course t'a fait du bien.");
    }
  }

  pet.msgs_matin = m;
}

function advanceDay() {
  const tagsHier = [...pet.tags];

  applyNightEffects();
  if (checkDeath()) return;

  pet.jour++;
  pet.q_today = 0;
  pet.reset_at = Date.now();
  pet.q_ids_hier = pet.q_ids_today || [];
  pet.q_ids_today = [];

  const dailyTags = ['a_mange_double', 'a_grignote', 'tres_gourmand', 'pas_bouge', 'a_couru', 'discipline'];
  pet.tags = pet.tags.filter(t => !dailyTags.includes(t));

  const prevStade = pet.stade;
  pet.stade = calcStage();

  if (EGG_STAGES.includes(prevStade) && !EGG_STAGES.includes(pet.stade)) {
    pet.bonheur = 50;
    pet.energie = 50;
    pet.poids = 50;
  }

  buildMorningMsgs(tagsHier);

  isNewDay = true;
  showedMorningMsg = false;
  save();
}

function checkNewDay() {
  const elapsed = Date.now() - pet.reset_at;
  if (elapsed < MS_PER_DAY) return false;

  const days = Math.floor(elapsed / MS_PER_DAY);
  for (let i = 0; i < days; i++) {
    advanceDay();
  }
  return true;
}

function msLeft() {
  return Math.max(0, MS_PER_DAY - (Date.now() - pet.reset_at));
}

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function pickQuestion() {
  const hier = pet.q_ids_hier || [];
  const auj = pet.q_ids_today || [];

  const pool = QUESTIONS.filter(q => {
    if (!q.stades.includes(pet.stade)) return false;
    if (q.tags_requis.some(t => !pet.tags.includes(t))) return false;
    if (q.tags_exclus.some(t => pet.tags.includes(t))) return false;
    if (q.bonheur_min !== undefined && pet.bonheur < q.bonheur_min) return false;
    if (q.bonheur_max !== undefined && pet.bonheur > q.bonheur_max) return false;
    if (q.tags_exclus.length === 0 && (hier.includes(q.id) || auj.includes(q.id))) return false;
    return true;
  });

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const fallback = QUESTIONS.filter(q =>
    q.stades.includes(pet.stade) &&
    q.tags_requis.length === 0 &&
    q.tags_exclus.length === 0 &&
    !hier.includes(q.id) &&
    !auj.includes(q.id)
  );

  if (fallback.length > 0) {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  const last = QUESTIONS.filter(q =>
    q.stades.includes(pet.stade) &&
    q.tags_requis.length === 0 &&
    q.tags_exclus.length === 0 &&
    !auj.includes(q.id)
  );

  if (last.length > 0) {
    return last[Math.floor(Math.random() * last.length)];
  }

  return null;
}

function applyAnswer(q, i) {
  const rep = q.reponses[i];

  function apply(current, val) {
    if (val === undefined) return current;
    return clamp(current + (val > 0 ? Math.ceil(val / 2) : val));
  }

  const e = rep.effets || {};
  pet.bonheur = apply(pet.bonheur, e.bonheur);
  pet.energie = apply(pet.energie, e.energie);
  pet.poids = apply(pet.poids, e.poids);

  (rep.tags || []).forEach(t => {
    if (!pet.tags.includes(t)) pet.tags.push(t);
  });

  if (rep.tags?.includes('male')) pet.genre = 'male';
  if (rep.tags?.includes('female')) pet.genre = 'female';

  pet.q_today++;
  if (!pet.q_ids_today) pet.q_ids_today = [];
  pet.q_ids_today.push(q.id);

  pet.stade = calcStage();
  save();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');

  if (document.activeElement) {
    document.activeElement.blur();
  }
}

function applyStage(el, stageKey) {
  Object.values(STAGES).forEach(s => el.classList.remove(s.cls));
  const s = STAGES[stageKey];
  el.classList.add(s.cls);

  const em = el.querySelector('.stage-emoji');
  if (em) em.textContent = s.emoji;
}

function renderHeader() {
  document.getElementById('jour-num').textContent = pet.jour;
  document.getElementById('header-name').textContent = pet.nom || '';
  document.getElementById('q-left').textContent = Q_PER_DAY - pet.q_today;
}

function renderStats() {
  const panel = document.getElementById('stats-panel');
  panel.classList.remove('hidden');

  if (EGG_STAGES.includes(pet.stade)) {
    document.getElementById('bar-bonheur').style.width = '50%';
    document.getElementById('bar-energie').style.width = '50%';
    document.getElementById('bar-poids').style.width = '50%';
    document.getElementById('bar-bonheur').style.background = '#d1d5db';
    document.getElementById('bar-energie').style.background = '#d1d5db';
    document.getElementById('bar-poids').style.background = '#d1d5db';
    document.getElementById('val-bonheur').textContent = '?';
    document.getElementById('val-energie').textContent = '?';
    document.getElementById('val-poids').textContent = '?';
    return;
  }

  document.getElementById('bar-bonheur').style.background = '';
  document.getElementById('bar-energie').style.background = '';

  document.getElementById('bar-bonheur').style.width = pet.bonheur + '%';
  document.getElementById('bar-energie').style.width = pet.energie + '%';
  document.getElementById('bar-poids').style.width = pet.poids + '%';

  document.getElementById('val-bonheur').textContent = pet.bonheur;
  document.getElementById('val-energie').textContent = pet.energie;
  document.getElementById('val-poids').textContent = pet.poids;

  const pb = document.getElementById('bar-poids');
  pb.className = 'bar-fill';
  pb.style.background = '';

  if (pet.poids < 30) pb.classList.add('blue');
  else if (pet.poids < 60) pb.classList.add('green');
  else if (pet.poids < 80) pb.classList.add('yellow');
  else pb.style.background = '#F97316';
}

function renderQuestion(q) {
  document.getElementById('question-text').textContent = q.texte;
  document.getElementById('stage-label').textContent = STAGES[pet.stade].label;

  const container = document.getElementById('answers-container');
  container.innerHTML = '';

  q.reponses.forEach((rep, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = rep.texte;

    btn.addEventListener('click', () => {
      container.querySelectorAll('.answer-btn').forEach(b => {
        b.disabled = true;
      });

      btn.classList.add('selected');
      hideMorningMsg();

      setTimeout(() => {
        applyAnswer(q, i);
        next();
      }, 350);
    });

    container.appendChild(btn);
  });
}

function showMorningMsg() {
  if (!pet.msgs_matin || !pet.msgs_matin.length) return;

  const zone = document.getElementById('message-zone');
  document.getElementById('message-text').textContent = pet.msgs_matin.shift();
  zone.classList.remove('hidden');
}

function hideMorningMsg() {
  document.getElementById('message-zone').classList.add('hidden');
  pet.msgs_matin = [];
  save();
}

function renderDead() {
  showScreen('screen-dead');

  const sprite = document.getElementById('dead-sprite');
  if (sprite) applyStage(sprite, pet.stade);

  const msgs = {
    both: 'Il était épuisé et trop triste.\nNourris-le et reste avec lui la prochaine fois.',
    bonheur: 'Il était trop triste pour continuer.\nDonne-lui plus d\'amour la prochaine fois.',
    energie: 'Il n\'avait plus d\'énergie du tout.\nNourris-le et fais-le jouer chaque jour !',
    poids: 'Il est mort de faim...\nPense à le nourrir, même en petites portions !',
  };
  const msg = msgs[pet.mort_raison] || 'Il t\'attendait... mais tu es arrivé trop tard.';

  const el = document.getElementById('dead-msg');
  if (el) el.textContent = pet.nom ? `${pet.nom} a besoin de toi.\n${msg}` : msg;

  const btn = document.getElementById('btn-dead-restart');
  if (btn) {
    btn.onclick = () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    };
  }
}

function renderDone() {
  showScreen('screen-done');
  applyStage(document.getElementById('done-sprite'), pet.stade);

  const genderWord = pet.genre === 'female' ? 'elle' : 'il';
  document.getElementById('done-msg').textContent = pet.nom
    ? `${pet.nom} t'attend avec impatience.\nReviens demain, ${genderWord} a besoin de toi !`
    : 'Ton chien attend ton retour.\nReviens demain !';

  startCountdown();
}

function startCountdown() {
  const el = document.getElementById('countdown');

  function tick() {
    const left = msLeft();
    el.textContent = fmtTime(left);

    if (left > 0) setTimeout(tick, 1000);
    else location.reload();
  }

  tick();

  const btnNext = document.getElementById('btn-test-next');
  const btnReset = document.getElementById('btn-test-reset');

  if (btnNext) {
    btnNext.onclick = () => {
      advanceDay();
      startGame();
    };
  }

  if (btnReset) {
    btnReset.onclick = () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    };
  }
}

function next() {
  if (checkDeath()) {
    renderDead();
    return;
  }

  if (pet.q_today >= Q_PER_DAY) {
    renderDone();
    return;
  }

  applyStage(document.getElementById('pet-sprite'), pet.stade);
  renderHeader();
  renderStats();

  if (isNewDay && !showedMorningMsg) {
    showedMorningMsg = true;
    showMorningMsg();
  }

  const q = pickQuestion();
  if (!q) {
    renderDone();
    return;
  }

  renderQuestion(q);
}

function startGame() {
  showScreen('screen-game');
  document.getElementById('stage-label').textContent = STAGES[pet.stade].label;
  next();
}

function showNameScreen() {
  showScreen('screen-name');
  applyStage(document.getElementById('name-sprite'), 'egg_1');

  const input = document.getElementById('name-input');
  const btn = document.getElementById('btn-name-ok');

  function confirm() {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }

    pet.nom = name;
    save();
    startGame();
  }

  btn.onclick = confirm;
  input.onkeydown = e => {
    if (e.key === 'Enter') confirm();
  };

  setTimeout(() => input.focus(), 100);
}

function init() {
  pet = load();

  if (!pet) {
    pet = newPet();
    save();
    showScreen('screen-intro');

    const btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.addEventListener('click', showNameScreen);
    return;
  }

  isNewDay = checkNewDay();

  if (pet.mort) {
    renderDead();
    return;
  }

  if (pet.q_today >= Q_PER_DAY) {
    renderDone();
    return;
  }

  if (!pet.nom) {
    showNameScreen();
    return;
  }

  startGame();
}

document.addEventListener('DOMContentLoaded', init);