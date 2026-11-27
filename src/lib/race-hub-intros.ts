import type { AnimalType } from '@/lib/breeds-list';

/**
 * Texte éditorial des pages /races/<animal> (27/11/2026). Ces pages n'étaient qu'une grille de cartes :
 * Google les explorait sans les indexer ("Explorée, actuellement non indexée"). Contenu unique par
 * espèce, faits largement établis uniquement, aucun chiffre non vérifiable. Pas d'emoji ni de tiret long.
 */
export interface HubSection { h: string; p: string[] }
export interface HubIntro { title: string; lead: string; sections: HubSection[]; blogLabel: string }

export const RACE_HUB_INTROS: Record<AnimalType, HubIntro> = {
  chien: {
    title: "Bien choisir une race de chien",
    lead: "Choisir une race de chien, c'est choisir un compagnon pour dix ans ou plus. L'apparence compte moins que le gabarit adulte, le niveau d'énergie, le besoin de compagnie et l'entretien : ce sont ces critères qui font qu'une adoption se passe bien.",
    sections: [
      { h: 'Les bonnes questions avant d\'adopter', p: [
        "Combien de temps pouvez-vous consacrer chaque jour aux sorties, au jeu et à l'éducation ? Un chien de berger ou de chasse a souvent besoin de bien plus que trois promenades rapides, alors qu'une race de compagnie se contente d'activités plus calmes.",
        "Le chien restera-t-il seul plusieurs heures ? Vivez-vous en appartement ou avec un jardin ? Avez-vous déjà éduqué un chien ? Certaines races indépendantes, très sensibles ou très puissantes demandent une expérience que d'autres n'exigent pas.",
      ] },
      { h: 'Santé et budget', p: [
        "Beaucoup de races ont des prédispositions connues : dysplasie de la hanche chez de nombreux grands chiens, difficultés respiratoires chez les races à museau court comme le bouledogue français ou le carlin, troubles oculaires ou cardiaques selon les lignées. Chaque fiche détaille ces points.",
        "Avant d'adopter, renseignez-vous sur les dépistages réalisés chez les parents et prévoyez le budget alimentation, vétérinaire, assurance éventuelle et toilettage, qui varie beaucoup d'une race à l'autre.",
      ] },
      { h: 'Élevage, refuge ou croisé', p: [
        "Un chien de race issu d'un élevage sérieux permet d'anticiper son gabarit et ses grandes tendances de caractère, sans les garantir : l'éducation et la socialisation comptent autant que la race. Les refuges accueillent aussi des chiens de race et de nombreux croisés équilibrés, qui méritent d'être considérés.",
      ] },
    ],
    blogLabel: 'Nos conseils pour les chiens',
  },
  chat: {
    title: "Bien choisir une race de chat",
    lead: "Toutes les races de chats ne vivent pas de la même façon. Besoin d'activité, attachement à l'humain, entretien du pelage et sensibilité à la solitude varient beaucoup, et ces différences comptent plus que la couleur des yeux ou la longueur du poil.",
    sections: [
      { h: 'Intérieur, extérieur et tempérament', p: [
        "Certaines races, comme l'abyssin ou le bengal, sont très actives et s'ennuient vite sans jeux, arbre à chat et stimulation. D'autres, comme le ragdoll ou le persan, sont réputées plus calmes. Le siamois et les races orientales sont souvent bavards et supportent mal de rester seuls longtemps.",
        "Un chat vivant uniquement en appartement a besoin d'un environnement enrichi : postes en hauteur, griffoirs, cachettes et séances de jeu quotidiennes.",
      ] },
      { h: 'Pelage et santé', p: [
        "Les races à poil long, comme le persan ou le maine coon, demandent un brossage régulier pour éviter les nœuds et limiter les boules de poils. Les races à face plate peuvent souffrir de troubles respiratoires et oculaires.",
        "Certaines maladies héréditaires sont bien connues, comme la polykystose rénale chez le persan ou la cardiomyopathie hypertrophique chez le maine coon et le ragdoll. Un éleveur sérieux peut indiquer les dépistages réalisés sur ses reproducteurs.",
      ] },
      { h: 'Les démarches', p: [
        "En Belgique comme en France, l'identification du chat (puce électronique) est obligatoire. La stérilisation est fortement recommandée pour les chats qui ne sont pas destinés à la reproduction, et les refuges proposent aussi des chats de race ou d'apparence.",
      ] },
    ],
    blogLabel: 'Nos conseils pour les chats',
  },
  oiseau: {
    title: "Bien choisir une espèce d'oiseau",
    lead: "Adopter un oiseau engage souvent pour longtemps : une perruche ondulée vit plusieurs années, et les grands perroquets peuvent vivre plusieurs décennies. Avant de choisir une espèce, il faut regarder sa sociabilité, son niveau sonore et l'espace dont elle a besoin.",
    sections: [
      { h: 'Un animal social', p: [
        "La plupart des oiseaux de compagnie vivent en groupe dans la nature. Seuls, ils s'ennuient et peuvent développer des troubles du comportement comme l'arrachage des plumes. Beaucoup d'espèces se plaisent mieux en couple ou en petit groupe, à condition d'avoir assez de place.",
        "Les perroquets et les grandes perruches sont intelligents et demandent beaucoup d'attention, de jouets et d'interactions quotidiennes. Certains sont aussi très bruyants, un point à vérifier si vous vivez en appartement.",
      ] },
      { h: 'Cage, sorties et alimentation', p: [
        "Une cage doit permettre à l'oiseau de voler ou au moins de déployer largement ses ailes, et les sorties quotidiennes en pièce sécurisée sont précieuses. Une alimentation variée vaut mieux qu'un simple mélange de graines.",
        "Certains dangers sont méconnus : l'avocat est toxique pour de nombreux oiseaux, et les fumées dégagées par les revêtements antiadhésifs surchauffés peuvent leur être mortelles.",
      ] },
      { h: 'Réglementation', p: [
        "Certaines espèces de perroquets sont protégées par la convention CITES et doivent être accompagnées de documents prouvant leur origine légale. Renseignez-vous avant l'achat et consultez un vétérinaire habitué aux oiseaux.",
      ] },
    ],
    blogLabel: 'Nos conseils pour les oiseaux',
  },
  rongeur: {
    title: "Bien choisir son rongeur ou son lapin",
    lead: "Lapins, cochons d'Inde, hamsters, rats ou chinchillas n'ont ni les mêmes besoins ni la même espérance de vie. On les croit souvent faciles à vivre et parfaits pour les enfants, mais chaque espèce a ses exigences.",
    sections: [
      { h: 'Seul ou à plusieurs ?', p: [
        "Le lapin, le cochon d'Inde, le rat et la gerbille sont des animaux sociaux qui vivent mieux avec au moins un congénère. Le hamster doré, à l'inverse, est solitaire et supporte mal la cohabitation.",
        "Le rythme compte aussi : le hamster est actif la nuit, ce qui le rend peu adapté à un jeune enfant qui voudrait jouer avec lui en journée.",
      ] },
      { h: 'Alimentation et dents', p: [
        "Les dents des lapins et des rongeurs poussent en continu. Pour le lapin et le cochon d'Inde, le foin à volonté est la base de l'alimentation et de l'usure dentaire. Le cochon d'Inde ne fabrique pas sa propre vitamine C et doit la trouver dans son alimentation.",
      ] },
      { h: 'Espace et soins', p: [
        "La plupart des cages vendues dans le commerce sont trop petites. Un enclos spacieux et des sorties quotidiennes changent beaucoup la vie d'un lapin ou d'un cochon d'Inde.",
        "Repérez à l'avance un vétérinaire qui soigne les NAC (nouveaux animaux de compagnie) : ces petits animaux cachent leurs symptômes, et une consultation rapide est souvent décisive.",
      ] },
    ],
    blogLabel: 'Nos conseils pour les rongeurs',
  },
  reptile: {
    title: "Bien choisir son reptile",
    lead: "Un reptile ne se choisit pas comme un chien ou un chat : son bien-être dépend presque entièrement de l'installation que vous lui offrez. Température, lumière, humidité et alimentation doivent être maîtrisées avant même son arrivée.",
    sections: [
      { h: 'Un terrarium adapté à l\'espèce', p: [
        "Les reptiles ne produisent pas leur propre chaleur. Le terrarium doit proposer un point chaud et une zone plus fraîche, pour que l'animal régule lui-même sa température. Les espèces diurnes, comme les tortues terrestres ou le pogona, ont aussi besoin d'un éclairage UVB, indispensable à leurs os.",
        "Taille du terrarium, substrat, humidité et cachettes varient beaucoup d'une espèce à l'autre : chaque fiche précise ces besoins.",
      ] },
      { h: 'Longévité et alimentation', p: [
        "Certaines tortues vivent plusieurs décennies, et de nombreux serpents et lézards dépassent largement dix ans. L'alimentation peut reposer sur des insectes vivants, des végétaux ou des proies, ce qui doit être accepté dès le départ.",
      ] },
      { h: 'Hygiène et réglementation', p: [
        "Les reptiles peuvent porter des salmonelles sans être malades : lavez-vous les mains après chaque manipulation, surtout avec de jeunes enfants. Selon l'espèce et le pays, la détention peut nécessiter des documents (CITES pour certaines tortues, par exemple) ou une déclaration. Renseignez-vous avant l'achat et repérez un vétérinaire spécialisé.",
      ] },
    ],
    blogLabel: 'Nos conseils pour les reptiles',
  },
};
