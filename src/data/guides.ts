export interface GuideArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
  readTime: string;
  content: string[];
  tips: string[];
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: 'debutant-guide',
    title: 'Guide du Débutant',
    subtitle: 'Tout ce que tu dois savoir pour bien démarrer dans BomberQuest',
    category: 'Bases',
    icon: 'book',
    readTime: '5 min',
    content: [
      "Bienvenue dans BomberQuest ! Ce guide va t'apprendre les bases pour devenir un maître bombardier.",
      "**Ton premier héros** : Tu commences avec Blaze #1, un héros Common. Il a des stats de base mais suffisantes pour les premières étapes. Place-le sur la grille et il posera automatiquement des bombes pour détruire les blocs.",
      "**Les BomberCoins (BC)** : C'est la monnaie du jeu. Tu les gagnes en complétant des cartes en mode Chasse au Trésor et des étapes en mode Histoire. Utilise-les pour invoquer de nouveaux héros !",
      "**Le mode Chasse au Trésor** : Sélectionne une carte, choisis tes héros et lance l'exploration. Tes héros posent des bombes automatiquement pour casser les blocs et ouvrir les coffres. Plus la carte est grande, plus les récompenses sont importantes.",
      "**Le mode Histoire** : Combat des ennemis à travers 5 régions uniques. Chaque région a 5 étapes avec des ennemis de plus en plus coriaces, et un boss final à vaincre !",
      "**Stamina** : Chaque héros a une barre de stamina. Quand elle tombe à zéro, le héros est épuisé. La stamina se régénère passivement hors combat, et les héros sont soignés à 100% après une victoire en Histoire.",
    ],
    tips: [
      "Commence par la Chasse au Trésor pour accumuler des BC",
      "Invoque des héros x10 pour économiser 100 BC",
      "Complète les quêtes journalières pour le bonus de 500 BC",
      "Améliore tes héros avant de tenter les boss",
    ],
  },
  {
    slug: 'guide-heros',
    title: 'Guide des Héros & Raretés',
    subtitle: 'Comprends le système de raretés, les stats et comment optimiser ton équipe',
    category: 'Héros',
    icon: 'crown',
    readTime: '7 min',
    content: [
      "Les héros sont le cœur de BomberQuest. Chaque héros a une rareté, des stats et des compétences uniques.",
      "**Les 6 raretés** : Common (60%), Rare (25%), Super Rare (10%), Epic (4%), Legend (0.9%), Super Legend (0.1%). Plus la rareté est élevée, meilleures sont les stats de base.",
      "**Les stats expliquées** :\n- **PWR (Puissance)** : Dégâts des bombes\n- **SPD (Vitesse)** : Vitesse de déplacement\n- **RNG (Portée)** : Portée des explosions\n- **BNB (Bombes)** : Nombre de bombes simultanées\n- **STA (Stamina)** : Points de vie\n- **LCK (Chance)** : Chance de trouver des coffres rares",
      "**Le système de Pity** : Si tu n'obtiens pas de héros rare après un certain nombre d'invocations, le système garantit un drop. 20 invocations sans Rare = Rare garanti, etc.",
      "**Amélioration** : Dépense des BC pour augmenter le niveau de tes héros. Chaque niveau améliore toutes les stats. Le coût augmente avec le niveau.",
      "**Ascension** : Quand tu as des doublons d'un héros, tu peux l'ascendre pour augmenter ses étoiles. Chaque étoile donne un boost significatif aux stats !",
    ],
    tips: [
      "Les héros Legend et Super Legend ont 4-5 compétences vs 0 pour les Common",
      "Garde tes doublons pour l'ascension, ne les ignore pas",
      "Un héros Epic bien amélioré bat souvent un Legend bas niveau",
      "Diversifie ton équipe : PWR élevé pour les boss, LCK élevé pour les coffres",
    ],
  },
  {
    slug: 'guide-histoire',
    title: 'Guide du Mode Histoire',
    subtitle: 'Stratégies pour conquérir les 5 régions et battre tous les boss',
    category: 'Combat',
    icon: 'sword',
    readTime: '8 min',
    content: [
      "Le mode Histoire est divisé en 5 régions, chacune avec 5 étapes. Tu dois compléter les étapes dans l'ordre.",
      "**Forêt Enchantée** (Niveau 1-3) : Les slimes sont lents et faibles. C'est l'endroit parfait pour apprendre le combat. Le boss Roi Slime a 40 PV et utilise des charges et invocations.",
      "**Cavernes Maudites** (Niveau 5-9) : Les gobelins sont rapides et les squelettes résistants. Prépare une équipe équilibrée. Le Chef Gobelin lance des pluies de bombes !",
      "**Ruines Anciennes** (Niveau 12-18) : Les squelettes sont en force. La Liche Noire est le premier boss vraiment difficile avec son invincibilité temporaire et ses invocations de minions.",
      "**Forteresse Orc** (Niveau 22-30) : Les orcs frappent fort. Le Seigneur Orc a des charges dévastatrices et 150 PV. Il faut esquiver ses patterns.",
      "**Enfer Ardent** (Niveau 35-45) : Les démons sont rapides et puissants. Le Seigneur Démon est le boss final avec 250 PV et tous les patterns ! Prépare ton meilleure équipe.",
      "**Patterns de boss** :\n- **Charge** : Le boss fonce vers toi, place des bombes sur son chemin\n- **Invocation** : Des minions apparaissent, élimine-les vite\n- **Invincibilité** : Esquive pendant la durée\n- **Pluie de bombes** : Des bombes tombent du ciel, reste mobile",
    ],
    tips: [
      "Sélectionne tes 6 meilleurs héros pour les boss",
      "Tes héros sont soignés à 100% après une victoire",
      "Les boss changent de pattern quand leur vie baisse",
      "Les étapes non-boss donnent moins de récompenses mais sont plus sûres pour farm",
    ],
  },
  {
    slug: 'guide-invocation',
    title: 'Guide de l\'Invocation & Gacha',
    subtitle: 'Maximise tes chances et comprends le système de pity',
    category: 'Gacha',
    icon: 'sparkle',
    readTime: '4 min',
    content: [
      "L'invocation est le moyen principal d'obtenir de nouveaux héros. Chaque invocation coûte 100 BC, ou 900 BC pour un pack de 10 (économise 100 BC).",
      "**Taux de drop** : Common 60%, Rare 25%, Super Rare 10%, Epic 4%, Legend 0.9%, Super Legend 0.1%.",
      "**Le système de Pity** fonctionne comme un filet de sécurité. Après un certain nombre d'invocations sans obtenir une rareté spécifique, tu es garanti de l'obtenir :\n- Rare : garanti après 20 invocations\n- Super Rare : garanti après 50\n- Epic : garanti après 100\n- Legend : garanti après 200",
      "**Conseil stratégique** : Accumule 900 BC et fais des invocations x10 plutôt que des invocations simples. Tu économises 100 BC à chaque fois, ce qui s'additionne vite !",
      "**Les shards** : Tu peux accumuler des fragments (shards) de différentes raretés. Ils sont utiles pour les futures fonctionnalités d'artisanat.",
    ],
    tips: [
      "Invoque toujours en x10 pour économiser",
      "Le pity counter ne se réinitialise jamais, même entre sessions",
      "Farm la Chasse au Trésor pour accumuler des BC rapidement",
      "Les quêtes journalières donnent jusqu'à 700 BC par jour",
    ],
  },
  {
    slug: 'guide-quetes',
    title: 'Guide des Quêtes Journalières',
    subtitle: 'Complète tes quêtes chaque jour pour progresser rapidement',
    category: 'Progression',
    icon: 'target',
    readTime: '3 min',
    content: [
      "Chaque jour, tu reçois 3 quêtes aléatoires à compléter. Compléter les 3 donne un bonus supplémentaire de 500 BC et 200 XP !",
      "**Types de quêtes** :\n- **Bombardier** : Pose X bombes (100-300)\n- **Entraîneur** : Améliore X héros (1-3)\n- **Explorateur** : Complète X cartes (3-5)\n- **Chasseur de trésors** : Ouvre X coffres (10-25)\n- **Combattant** : Élimine X ennemis en Histoire\n- **Collectionneur** : Invoque X héros (3-5)",
      "**Stratégie optimale** : Commence par les quêtes les plus faciles, puis concentre-toi sur celles qui donnent le plus de BC. Le bonus de complétion totale vaut vraiment le coup !",
      "**Reset quotidien** : Les quêtes se réinitialisent chaque jour. Les progrès non complétés sont perdus, alors essaie de tout finir avant minuit.",
    ],
    tips: [
      "Le bonus de 3/3 quêtes vaut 500 BC + 200 XP",
      "Combine les quêtes : la Chasse au Trésor compte pour les bombes ET les coffres",
      "Les quêtes d'amélioration sont les plus faciles à compléter",
      "Joue au moins une session par jour pour ne pas manquer le bonus",
    ],
  },
];
