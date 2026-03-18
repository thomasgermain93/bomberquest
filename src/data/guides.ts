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
      "**Ton premier héros** : Tu commences avec Blaze #1, un héros Common du Clan Braise. Il a des stats de base mais suffisantes pour les premières étapes. Place-le sur la grille et il posera automatiquement des bombes pour détruire les blocs.",
      "**Les BomberCoins (BC)** : C'est la monnaie principale du jeu. Tu les gagnes en complétant des cartes en mode Chasse au Trésor et des étapes en mode Histoire. Utilise-les pour invoquer de nouveaux héros !",
      "**Les Universal Shards** : La seconde ressource clé. Tu en gagnes via la Chasse au Trésor (3-18 par run selon le tier), le mode Histoire (2-6 par étape, 10-30 au first clear d'un boss), et les succès. Les Universal Shards servent à invoquer des héros ciblés ou à recycler des doublons.",
      "**Le mode Chasse au Trésor** : Sélectionne une carte, choisis tes héros et lance l'exploration. Tes héros posent des bombes automatiquement pour casser les blocs et ouvrir les coffres. Plus la carte est grande, plus les récompenses (BC et Shards) sont importantes.",
      "**Le mode Histoire** : Combat des ennemis à travers 5 régions uniques. Chaque région a 5 étapes et un boss final. Les boss first clear récompensent généreusement en Universal Shards !",
      "**Les Clans** : Chaque héros appartient à l'un des 6 clans. Aligner 2 héros du même clan dans ton équipe active un bonus de synergie passif. Commence par constituer une équipe homogène dès que possible.",
    ],
    tips: [
      "Commence par la Chasse au Trésor pour accumuler BC et Universal Shards",
      "Invoque des héros x10 pour économiser 100 BC par rapport au x1",
      "Complète les 3 quêtes journalières pour le bonus de 500 BC + 200 XP",
      "Les boss first clear en Histoire donnent le plus de Shards : priorise-les",
      "Regarde le panneau héros sous la carte en combat pour suivre la stamina en temps réel",
    ],
  },
  {
    slug: 'guide-heros',
    title: 'Guide des Héros, Clans & Raretés',
    subtitle: 'Comprends les raretés, les clans, le recyclage et comment optimiser ta collection',
    category: 'Héros',
    icon: 'crown',
    readTime: '7 min',
    content: [
      "Les héros sont le cœur de BomberQuest. Chaque héros a une rareté, un clan d'appartenance, des stats et des compétences uniques.",
      "**Les 6 raretés** : Common (60%), Rare (25%), Super-Rare (10%), Epic (4%), Legend (0.9%), Super-Legend (0.1%). Plus la rareté est élevée, meilleures sont les stats de base et plus nombreuses sont les compétences.",
      "**Les 6 clans** :\n- 🔥 **Clan Braise (Ember)** : thème feu, bombes orangées\n- ⚡ **Cavaliers de l'Orage (Storm)** : thème électrique, bombes bleues\n- 🔨 **Garde de Forge** : thème mécanique, bombes grises\n- 🌑 **Noyau d'Ombre (Shadow)** : thème furtivité, bombes violettes\n- ⚙️ **Circuit Arcanique (Arcane)** : thème technologie, bombes vertes\n- 🌿 **Meute Sauvage (Wild)** : thème nature, bombes dorées",
      "**Recyclage des héros** : Tu peux convertir n'importe quel héros en Universal Shards. Taux par rareté : Common=1, Rare=3, Super-Rare=8, Epic=20, Legend=50, Super-Legend=150 (+1 shard par tranche de 10 niveaux). Recycle les doublons en trop après avoir amélioré les compétences.",
      "**Amélioration de compétences via doublons** : Sacrifie un doublon du même héros pour monter le niveau d'une de ses compétences. Le coût varie de 1 à 5 doublons selon le niveau visé, avec un niveau max déterminé par la rareté.",
      "**Box management** : Utilise les filtres doublons et lockés pour identifier tes héros recyclables. Le panneau affiche des KPIs clés : total de héros, doublons disponibles et héros recyclables. Verrouillez tes héros principaux pour éviter les recyclages accidentels.",
      "**Les stats expliquées** :\n- **PWR (Puissance)** : Dégâts des bombes\n- **SPD (Vitesse)** : Vitesse de déplacement\n- **RNG (Portée)** : Portée des explosions\n- **BNB (Bombes)** : Nombre de bombes simultanées\n- **STA (Stamina)** : Points de vie\n- **LCK (Chance)** : Chance de trouver des coffres rares",
    ],
    tips: [
      "Les héros Legend et Super-Legend ont jusqu'à 5 compétences actives",
      "Améliore les compétences de tes héros principaux avant de recycler des doublons",
      "Un héros Epic bien amélioré bat souvent un Legend bas niveau",
      "Aligne 2+ héros du même clan pour activer leur synergie passive",
      "Recycle en priorité les Common et Rare en double dont tu n'as pas besoin",
    ],
  },
  {
    slug: 'guide-histoire',
    title: 'Guide du Mode Histoire',
    subtitle: 'Stratégies pour conquérir les 5 régions, battre les boss et maximiser les récompenses',
    category: 'Combat',
    icon: 'sword',
    readTime: '8 min',
    content: [
      "Le mode Histoire est divisé en 5 régions, chacune avec 5 étapes normales et un boss final. Tu dois compléter les étapes dans l'ordre. Chaque étape normale rapporte des Universal Shards, et les boss first clear donnent une prime généreuse.",
      "**Récompenses par étape** : Forêt=2 shards, Cavernes=3, Ruines=4, Forteresse=5, Enfer=6 shards par étape normale. First clear d'un boss : Forêt=10, Cavernes=15, Ruines=20, Forteresse=25, Enfer=30 shards. Les boss ne donnent plus de héros directs mais des shards.",
      "**Affinités de clan vs ennemi** : En mode Histoire, certains clans infligent ×1.25 de dégâts contre un type d'ennemi spécifique :\n- Clan Braise vs Démons\n- Cavaliers de l'Orage vs Squelettes\n- Garde de Forge vs Orcs\n- Noyau d'Ombre vs Gobelins\n- Circuit Arcanique vs Slimes\n- Meute Sauvage vs Gobelins",
      "**Forêt Enchantée** (Niveau 1-3) : Les slimes sont lents et faibles. Idéal pour apprendre. Le boss Roi Slime a 40 PV et utilise des charges et invocations. Utilise le Circuit Arcanique pour l'affinité ×1.25 contre les slimes.",
      "**Cavernes Maudites** (Niveau 5-9) : Les gobelins sont rapides, les squelettes résistants. Le Chef Gobelin lance des pluies de bombes. Les Cavaliers de l'Orage brillent ici contre les squelettes.",
      "**Ruines Anciennes & Forteresse Orc** (Niveau 12-30) : Les squelettes puis les orcs dominent. La Liche Noire a une phase d'invincibilité temporaire. Le Seigneur Orc charge avec 150 PV — esquive ses patterns. Garde de Forge réduit les dégâts reçus de 20% et a l'affinité vs Orcs.",
      "**Enfer Ardent** (Niveau 35-45) : Les démons sont rapides et puissants. Le Seigneur Démon (250 PV) enchaîne tous les patterns. Amène ton meilleure équipe Clan Braise pour l'affinité ×1.25 et la synergie portée de bombe.",
    ],
    tips: [
      "Priorise les boss first clear pour le maximum de Universal Shards",
      "Adapte ton clan d'équipe à l'ennemi dominant de la région",
      "Tes héros sont soignés à 100% après une victoire",
      "Surveille le panneau héros en bas de carte pour anticiper les épuisements de stamina",
      "Les étapes normales permettent de farm des shards de façon sûre avant un boss difficile",
    ],
  },
  {
    slug: 'guide-invocation',
    title: 'Guide de l\'Invocation & Gacha',
    subtitle: 'Maximise tes chances et comprends le système de pity et d\'invocation ciblée',
    category: 'Gacha',
    icon: 'sparkle',
    readTime: '4 min',
    content: [
      "L'invocation est le moyen principal d'obtenir de nouveaux héros. Deux modes sont disponibles : l'invocation standard en BomberCoins et l'invocation ciblée en Universal Shards.",
      "**Invocation standard (BomberCoins)** : x1=100 BC, x10=900 BC (économise 100 BC), x100=8000 BC (économise 2000 BC). Taux de drop : Common 60%, Rare 25%, Super-Rare 10%, Epic 4%, Legend 0.9%, Super-Legend 0.1%.",
      "**Invocation ciblée (Universal Shards)** : Tu peux cibler une rareté précise en dépensant des Universal Shards. Coûts : Common=10, Rare=50, Super-Rare=150, Epic=400, Legend=1000, Super-Legend=2500 shards. Idéal pour viser un clan ou une rareté spécifique.",
      "**Le système de Pity** est un filet de sécurité qui garantit un drop après un certain nombre d'invocations sans obtenir la rareté visée :\n- Rare : garanti après 10 invocations\n- Super-Rare : garanti après 30\n- Epic : garanti après 50\n- Legend : garanti après 200\nLe compteur ne se réinitialise jamais, même entre sessions.",
      "**Succès d'invocation** : Des récompenses en Universal Shards sont débloquées à chaque palier : 1re invoc=5 shards, 10 invoc=20, 25 invoc=40, 50 invoc=75, 100 invoc=100 shards. Ces bonus s'accumulent et accélèrent ta progression.",
    ],
    tips: [
      "Invoque toujours en x10 ou x100 pour maximiser les économies de BC",
      "Le pity counter ne se réinitialise jamais — accumule des invocations sereinement",
      "Utilise les Universal Shards pour des invocations ciblées si tu as besoin d'un clan précis",
      "Complète les succès d'invocation : ils financent eux-mêmes de nouvelles invocations",
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
      "Chaque jour, tu reçois 3 quêtes aléatoires à compléter. Compléter les 3 donne un bonus supplémentaire de 500 BC et 200 XP ! La variété est garantie : tu reçois toujours 1 quête de farm, 1 quête d'action et 1 quête de progression.",
      "**Types de quêtes actuels** :\n- **Bombardier** : Pose X bombes (100-300) — quête de farm\n- **Explorateur** : Complète X cartes (3-5) — quête d'action\n- **Chasseur de trésors** : Ouvre X coffres (10-25) — quête de farm\n- **Combattant** : Élimine X ennemis en Histoire — quête d'action\n- **Collectionneur** : Invoque X héros (3-5) — quête de progression\n- **Collecteur de fragments** : Collecte X Universal Shards (20-50) — quête de progression",
      "**Stratégie optimale** : Commence par identifier quelle quête de farm tu peux combiner avec une autre. La Chasse au Trésor compte simultanément pour les bombes posées ET les coffres ouverts. Le mode Histoire compte pour les ennemis éliminés ET la collecte de shards.",
      "**Reset quotidien** : Les quêtes se réinitialisent chaque jour à minuit. Les progrès non complétés sont perdus — essaie de tout finir avant le reset.",
    ],
    tips: [
      "Le bonus 3/3 quêtes vaut 500 BC + 200 XP — ne le manque jamais",
      "La Chasse au Trésor valide à la fois les bombes et les coffres en une seule session",
      "L'Histoire valide à la fois les ennemis éliminés et la collecte de shards",
      "La quête Collecteur de fragments s'obtient en jouant normalement — pas besoin de stratégie spéciale",
      "Joue au moins une courte session par jour pour ne pas manquer le bonus",
    ],
  },
  {
    slug: 'guide-economie',
    title: "Guide de l'Économie & Universal Shards",
    subtitle: 'Maîtrise les ressources du jeu : BomberCoins, Universal Shards et recyclage',
    category: 'Progression',
    icon: 'coins',
    readTime: '6 min',
    content: [
      "BomberQuest repose sur deux ressources principales : les **BomberCoins (BC)** pour les invocations standard, et les **Universal Shards** pour les invocations ciblées, le recyclage et l'amélioration des compétences. Maîtriser leur flux est clé pour progresser efficacement.",
      "**Sources de Universal Shards** :\n- Chasse au Trésor : 3-4 shards (cartes tier 1-2), 6-9 (tier 3-4), 12-18 (tier 5-6)\n- Mode Histoire, étape normale : Forêt=2, Cavernes=3, Ruines=4, Forteresse=5, Enfer=6 shards\n- Mode Histoire, boss first clear : 10 (Forêt) → 15 → 20 → 25 → 30 (Enfer)\n- Succès d'invocation : 5 (1re) → 20 (10e) → 40 (25e) → 75 (50e) → 100 (100e)",
      "**Taux de recyclage par rareté** :\n- Common = 1 shard\n- Rare = 3 shards\n- Super-Rare = 8 shards\n- Epic = 20 shards\n- Legend = 50 shards\n- Super-Legend = 150 shards\n- Bonus : +1 shard par tranche de 10 niveaux sur le héros recyclé",
      "**Invocations ciblées (coût en Universal Shards)** :\n- Common = 10, Rare = 50, Super-Rare = 150, Epic = 400, Legend = 1000, Super-Legend = 2500",
      "**Amélioration de compétences via doublons** : Sacrifie 1 à 5 doublons du même héros pour monter le niveau d'une compétence. Cette mécanique est plus efficace que le recyclage pur si le héros est dans ton équipe principale.",
      "**Stratégie early game** : Farm les cartes tier 3-4 de Chasse au Trésor pour un bon ratio temps/shards. Complète les boss first clear de l'Histoire dès que possible pour les gros bonus. Recycle les Common et Rare en double.",
      "**Stratégie late game** : Concentre les shards sur des invocations Epic et Legend ciblées. Améliore les compétences de tes héros principaux avec les doublons avant de recycler. Les cartes tier 5-6 deviennent la source principale de shards passifs.",
    ],
    tips: [
      "Les boss first clear sont la source de shards la plus rentable — priorise-les",
      "Recycle les héros au niveau max pour le bonus de shards (+1/10 niveaux)",
      "L'invocation ciblée Super-Rare à 150 shards est le meilleur rapport coût/valeur",
      "Ne recycle pas un héros avant d'avoir maximisé ses compétences avec ses doublons",
      "Les succès d'invocation s'auto-financent : chaque palier rapporte des shards pour la prochaine invocation",
    ],
  },
  {
    slug: 'guide-clans',
    title: 'Guide des Clans & Synergies',
    subtitle: 'Construis des équipes synergiques pour maximiser tes performances',
    category: 'Stratégie',
    icon: 'shield',
    readTime: '5 min',
    content: [
      "Les clans sont le système de synergie d'équipe de BomberQuest. Chaque héros appartient à l'un des 6 clans. Aligner **2 héros ou plus du même clan** dans ton équipe active un bonus passif puissant qui s'applique pendant toute la session.",
      "**Les 6 clans et leurs synergies (2+ héros actifs)** :\n- 🔥 **Clan Braise (Ember)** : +1 portée pour toutes les bombes. Affinité ×1.25 vs Démons en Histoire\n- ⚡ **Cavaliers de l'Orage (Storm)** : bombes explosent 0.3s plus tôt. Affinité ×1.25 vs Squelettes\n- 🔨 **Garde de Forge** : dégâts reçus -20%. Affinité ×1.25 vs Orcs\n- 🌑 **Noyau d'Ombre (Shadow)** : +30% pièces des coffres. Affinité ×1.25 vs Gobelins\n- ⚙️ **Circuit Arcanique (Arcane)** : +20% chance de réaction en chaîne. Affinité ×1.25 vs Slimes\n- 🌿 **Meute Sauvage (Wild)** : déplacement +20%. Affinité ×1.25 vs Gobelins",
      "**Affinités clan × ennemi en Mode Histoire** : Quand tu as la synergie active, tu infliges ×1.25 dégâts supplémentaires contre le type d'ennemi correspondant. Par exemple, 2 héros Ember actifs contre des Démons = synergie +portée ET dégâts bonifiés. Adapte ton équipe à la région visée.",
      "**Skins de bombes par clan** : Chaque clan a sa propre couleur de bombe et d'explosion unique. Braise = orangé, Orage = bleu électrique, Forge = gris métallique, Ombre = violet, Arcane = vert circuit, Sauvage = doré naturel. Un indicateur visuel pratique pour identifier ton clan actif.",
      "**Compositions optimales par objectif** :\n- **Farm Chasse au Trésor (coffres)** : 2+ Noyau d'Ombre pour +30% pièces des coffres\n- **Speed run cartes** : 2+ Meute Sauvage pour +20% vitesse de déplacement\n- **Boss tanky** : 2+ Garde de Forge pour -20% dégâts reçus\n- **Chaînes explosions** : 2+ Circuit Arcanique pour +20% chance de réaction\n- **Forêt/Cavernes** : 2+ Arcane (Slimes) ou Orage (Squelettes) pour l'affinité\n- **Enfer Ardent** : 2+ Braise pour affinité Démon + portée bombes",
      "**21 compétences disponibles** : Les héros peuvent avoir jusqu'à 5 compétences selon leur rareté. Parmi les skills clés : bombStorm, blastRadius, ironWill, lastStand, clanBond et bien d'autres. La compétence **clanBond** renforce spécifiquement le bonus de synergie de clan.",
    ],
    tips: [
      "Commence toujours par activer au moins une synergie de clan — même à 2 héros",
      "Adapte ton clan principal à la région d'Histoire pour cumuler synergie + affinité",
      "La synergie Ombre (+30% coffres) est la plus rentable pour la Chasse au Trésor",
      "La synergie Forge (-20% dégâts) est essentielle pour les boss de haut niveau",
      "La compétence clanBond amplifie ton bonus de clan — priorité sur les héros de ta synergie principale",
    ],
  },
];
