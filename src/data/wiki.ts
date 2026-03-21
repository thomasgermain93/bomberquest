export interface WikiArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
  content: WikiSection[];
  relatedSlugs?: string[];
  tags?: string[];
  difficulty?: 'débutant' | 'intermédiaire' | 'avancé';
}

export interface WikiSection {
  heading?: string;
  body?: string;
  table?: { headers: string[]; rows: string[][] };
  list?: string[];
}

export interface GlossaryEntry {
  term: string;
  abbr?: string;
  definition: string;
  category: string;
}

// ─── Wiki Articles ────────────────────────────────────────────────────────────

export const WIKI_ARTICLES: WikiArticle[] = [
  // ─── Ressources ──────────────────────────────────────────────────────────
  {
    slug: 'ressources',
    title: 'Ressources',
    subtitle: 'BomberCoins, Fragments et XP — tout sur la progression économique du jeu',
    category: 'Économie',
    icon: 'gem',
    tags: ['bombercoins', 'bc', 'shards', 'xp', 'expérience', 'monnaie', 'fragments', 'économie'],
    difficulty: 'débutant',
    relatedSlugs: ['recyclage', 'invocation-gacha', 'quetes-journalieres'],
    content: [
      {
        heading: 'BomberCoins (BC)',
        body: 'Les BomberCoins sont la monnaie principale du jeu. Ils permettent d\'invoquer de nouveaux héros (100 BC / invocation simple, 900 BC / x10) et d\'améliorer le niveau des héros existants.',
      },
      {
        heading: 'Comment gagner des BC ?',
        list: [
          'Compléter des cartes en mode Chasse au Trésor (récompenses variables selon la carte)',
          'Ouvrir des coffres sur les cartes',
          'Progresser en mode Histoire (étapes et boss)',
          'Compléter les quêtes journalières (jusqu\'à 700 BC/jour)',
          'Bonus de complétion 3/3 quêtes : +500 BC',
        ],
      },
      {
        heading: 'Fragments (Shards)',
        body: 'Les fragments sont des ressources secondaires obtenues lors des invocations et de certains événements. Chaque rareté possède son propre type de shard. Ils sont réservés pour une future fonctionnalité d\'artisanat permettant de forger des héros ou des équipements spéciaux.',
      },
      {
        heading: 'XP (Expérience)',
        body: 'L\'XP fait progresser le niveau de compte du joueur. Un compte de niveau plus élevé débloque de nouvelles cartes de Chasse au Trésor et améliore les récompenses globales. L\'XP est gagnée via les quêtes journalières (jusqu\'à 200 XP/jour) et les victoires en mode Histoire.',
      },
      {
        heading: 'Tableau récapitulatif des récompenses',
        table: {
          headers: ['Source', 'BC gagnés', 'XP gagnée'],
          rows: [
            ['Quête journalière (x1)', '50 – 150', '30 – 70'],
            ['Bonus 3/3 quêtes', '+500', '+200'],
            ['Chasse au Trésor — Prairie', '~350', '—'],
            ['Chasse au Trésor — Citadelle', '~11 000', '—'],
            ['Victoire Histoire (étape)', '100 – 500', '—'],
          ],
        },
      },
    ],
  },

  // ─── Héros ───────────────────────────────────────────────────────────────
  {
    slug: 'heros',
    title: 'Héros',
    subtitle: 'Tout sur les héros : stats, raretés, compétences, amélioration et ascension',
    category: 'Héros',
    icon: 'crown',
    tags: ['héros', 'stats', 'rareté', 'compétences', 'ascension', 'étoiles', 'leveling', 'amélioration'],
    difficulty: 'débutant',
    relatedSlugs: ['families-heros', 'invocation-gacha', 'fusion-heros', 'recyclage'],
    content: [
      {
        heading: 'Présentation',
        body: 'Les héros sont les unités contrôlées par le joueur. Chaque héros possède une rareté, six statistiques, un nombre de compétences dépendant de sa rareté, et un niveau d\'étoile lié à l\'ascension.',
      },
      {
        heading: 'Les 6 raretés',
        table: {
          headers: ['Rareté', 'Taux', 'Stats mult.', 'Compétences', 'Pity'],
          rows: [
            ['Common', '60 %', '×1,0', '0', '—'],
            ['Rare', '25 %', '×1,4', '1', '20 invoc.'],
            ['Super Rare', '10 %', '×2,0', '2', '50 invoc.'],
            ['Epic', '4 %', '×3,0', '3', '100 invoc.'],
            ['Legend', '0,9 %', '×5,0', '4', '200 invoc.'],
            ['Super Legend', '0,1 %', '×8,0', '5', '—'],
          ],
        },
      },
      {
        heading: 'Les 6 statistiques',
        table: {
          headers: ['Stat', 'Nom complet', 'Rôle'],
          rows: [
            ['PWR', 'Puissance', 'Dégâts infligés par les bombes'],
            ['SPD', 'Vitesse', 'Vitesse de déplacement sur la grille'],
            ['RNG', 'Portée', 'Rayon de l\'explosion des bombes'],
            ['BNB', 'Bombes', 'Nombre de bombes posables simultanément'],
            ['STA', 'Stamina', 'Points de vie / endurance du héros'],
            ['LCK', 'Chance', 'Probabilité d\'ouvrir des coffres de rareté élevée'],
          ],
        },
      },
      {
        heading: 'Amélioration (Leveling)',
        body: 'Dépensez des BC pour faire monter le niveau d\'un héros. Chaque niveau augmente toutes ses stats proportionnellement. Le coût en BC par niveau augmente avec le niveau actuel du héros.',
      },
      {
        heading: 'Ascension (Étoiles)',
        body: 'Lorsque vous possédez des doublons d\'un héros, vous pouvez les sacrifier pour faire monter ses étoiles de 1 à 5. Chaque étoile supplémentaire apporte un bonus significatif à toutes les statistiques.',
      },
      {
        heading: 'États du héros',
        list: [
          'idle — Le héros attend une cible',
          'moving — Le héros se déplace vers une cible',
          'bombing — Le héros est en train de poser une bombe',
          'retreating — Le héros recule après avoir posé une bombe',
          'resting — Le héros récupère sa stamina',
        ],
      },
    ],
  },

  // ─── Familles de Héros ────────────────────────────────────────────────────
  {
    slug: 'families-heros',
    title: 'Familles de Héros',
    subtitle: 'Les 6 familles de héros : Clan Braise, Cavaliers de l\'Orage, Garde de Forge, Noyau d\'Ombre, Circuit Arcanique, Meute Sauvage',
    category: 'Héros',
    icon: 'users',
    tags: ['clan', 'famille', 'braise', 'orage', 'forge', 'ombre', 'arcanique', 'sauvage', 'synergie', 'skin'],
    difficulty: 'intermédiaire',
    relatedSlugs: ['heros', 'mode-histoire', 'synergies-clan'],
    content: [
      {
        heading: 'Présentation',
        body: 'Chaque héros appartient à une famille qui définit son archetype et son style de jeu. Les familles influencent l\'apparence visuelle (couleurs du skin), les compétences passives de clan et les affinités contre certains types d\'ennemis.',
      },
      {
        heading: 'Les 6 Familles',
        table: {
          headers: ['Famille', 'Description', 'Héros (6)'],
          rows: [
            ['Clan Braise', 'Héros orientés feu et explosion', 'Blaze, Ember, Pyro, Fuse, Blast, Sol'],
            ["Cavaliers de l'Orage", 'Héros rapides avec affinité électrique', 'Spark, Volt, Storm, Zap, Vega, Dash'],
            ['Garde de Forge', 'Héros robustes axés tank et défense', 'Flint, Rex, Atlas, Duke, Max, Brick'],
            ["Noyau d'Ombre", "Héros d'infiltration et de contrôle", 'Ash, Nova, Echo, Crash, Luna, Shade'],
            ['Circuit Arcanique', 'Héros techno-magiques et utilitaires', 'Pixel, Chip, Byte, Orion, Glitch, Rune'],
            ['Meute Sauvage', 'Héros agiles orientés rush et chasse', 'Boom, Nitro, Rush, Flash, Jet, Ace'],
          ],
        },
      },
      {
        heading: 'Compétences de Clan',
        body: 'Placer 2 héros ou plus du même clan dans votre équipe active déclenche automatiquement la compétence passive du clan. Cette compétence s\'applique à toute l\'équipe.',
        table: {
          headers: ['Clan', 'Compétence', 'Effet (2+ héros)'],
          rows: [
            ['Clan Braise', 'Feu Perpétuel', '+1 portée pour toutes les bombes'],
            ["Cavaliers de l'Orage", 'Tempo Électrique', 'Bombes explosent 0,3 s plus tôt'],
            ['Garde de Forge', 'Peau de Fer', 'Dégâts reçus réduits de 20 %'],
            ["Noyau d'Ombre", 'Voile Doré', '+30 % pièces des coffres'],
            ['Circuit Arcanique', 'Résonance Arcanique', '20 % de chance de réaction en chaîne'],
            ['Meute Sauvage', 'Instinct Sauvage', 'Vitesse de déplacement +20 %'],
          ],
        },
      },
      {
        heading: 'Affinités vs Ennemis',
        body: 'Chaque clan dispose de multiplicateurs de dégâts face à certains types d\'ennemis en mode Histoire. Un multiplicateur supérieur à 1,0 indique un avantage.',
        table: {
          headers: ['Clan', 'Avantage (×1,25)', 'Bonus (×1,10)', 'Désavantage (×0,85)'],
          rows: [
            ['Clan Braise', 'Démons', '—', 'Slimes'],
            ["Cavaliers de l'Orage", 'Squelettes', 'Orcs', '—'],
            ['Garde de Forge', 'Orcs', 'Gobelins', '—'],
            ["Noyau d'Ombre", 'Gobelins', 'Squelettes', '—'],
            ['Circuit Arcanique', 'Slimes', 'Démons', '—'],
            ['Meute Sauvage', 'Gobelins', 'Slimes', '—'],
          ],
        },
      },
      {
        heading: 'Skins par Famille',
        body: 'Chaque famille possède un skin unique qui s\'applique à tous les héros de cette famille. Le skin combine les couleurs de la famille avec les éléments visuels de la rareté du héros (casque, cape, cornes, couronne, ailes).',
      },
      {
        heading: 'Tableau des skins par famille',
        table: {
          headers: ['Famille', 'Couleur casque', 'Couleur corps'],
          rows: [
            ['Clan Braise', '#FF6B35 (Orange)', '#E85D04'],
            ["Cavaliers de l'Orage", '#4CC9F0 (Cyan)', '#4361EE'],
            ['Garde de Forge', '#A8A8A8 (Gris)', '#6C757D'],
            ["Noyau d'Ombre", '#7B2CBF (Violet)', '#5A189A'],
            ['Circuit Arcanique', '#06D6A0 (Vert)', '#2EC4B6'],
            ['Meute Sauvage', '#70E000 (Vert Lime)', '#9EF01A'],
          ],
        },
      },
      {
        heading: 'Visualisation',
        body: 'Consultez le Bestiaire (/wiki/bestiaire) pour voir tous les héros avec leur sprite et portrait générés automatiquement selon leur famille et leur rareté.',
      },
      {
        heading: 'Système de Visuels Centralisé',
        body: 'Depuis la version avec issue #114, les visuels héros sont gérés de manière centralisée. Le système HERO_VISUALS dans types.ts définit pour chaque héros : sa famille, son style de casque (standard/cornu/couronné/tech/masque), sa cape, ses ailes et son aura. Ces traits sont utilisés par le renderer canvas pour générer les sprites et portraits.',
      },
    ],
  },

  // ─── Cartes ───────────────────────────────────────────────────────────────
  {
    slug: 'cartes',
    title: 'Cartes de Chasse au Trésor',
    subtitle: 'Description des 6 cartes disponibles, leurs conditions de déblocage et récompenses',
    category: 'Cartes',
    icon: 'target',
    tags: ['carte', 'chasse', 'trésor', 'coffres', 'prairie', 'forêt', 'mines', 'château', 'volcan', 'citadelle'],
    difficulty: 'débutant',
    relatedSlugs: ['ressources', 'heros', 'quetes-journalieres'],
    content: [
      {
        heading: 'Présentation',
        body: 'La Chasse au Trésor propose 6 cartes procédurales de difficulté croissante. Chaque carte possède une taille, une densité de blocs et un nombre de coffres différents. Des héros y posent des bombes automatiquement pour ouvrir des coffres et collecter des BC.',
      },
      {
        heading: 'Les 6 cartes',
        table: {
          headers: ['Carte', 'Taille', 'Coffres', 'Densité blocs', 'Récompense max', 'Niveau requis', 'Cartes requises'],
          rows: [
            ['Prairie', '13×9', '12', '40 %', '350 BC', '1', '0'],
            ['Forêt', '15×11', '22', '45 %', '750 BC', '5', '3'],
            ['Mines', '17×11', '32', '50 %', '1 500 BC', '10', '8'],
            ['Château', '19×13', '45', '55 %', '3 000 BC', '20', '15'],
            ['Volcan', '21×13', '55', '60 %', '6 000 BC', '35', '25'],
            ['Citadelle', '23×15', '75', '65 %', '11 000 BC', '50', '40'],
          ],
        },
      },
      {
        heading: 'Mécanique de génération',
        body: 'Chaque carte est générée procéduralement à chaque partie. La densité de blocs représente le pourcentage de cases couvertes par des blocs destructibles. Les coffres sont placés aléatoirement derrière des blocs. Les héros démarrent toujours depuis les coins de la carte.',
      },
      {
        heading: 'Les 5 types de coffres',
        table: {
          headers: ['Coffre', 'PV', 'Récompense', 'Chance rare'],
          rows: [
            ['Bois', '2', '5 – 10 BC', '5 %'],
            ['Argent', '5', '20 – 40 BC', '10 %'],
            ['Or', '10', '80 – 150 BC', '20 %'],
            ['Cristal', '20', '300 – 500 BC', '40 %'],
            ['Légendaire', '40', '1 000 – 2 000 BC', '75 %'],
          ],
        },
      },
    ],
  },

  // ─── Mode Histoire ────────────────────────────────────────────────────────
  {
    slug: 'mode-histoire',
    title: 'Mode Histoire',
    subtitle: '5 régions, 25 étapes et des boss uniques — guide complet du mode Histoire',
    category: 'Combat',
    icon: 'sword',
    tags: ['histoire', 'donjon', 'boss', 'région', 'ennemis', 'combat', 'slime', 'gobelin', 'squelette', 'orc', 'démon'],
    difficulty: 'intermédiaire',
    relatedSlugs: ['heros', 'families-heros', 'quetes-journalieres'],
    content: [
      {
        heading: 'Structure',
        body: 'Le mode Histoire est divisé en 5 régions, chacune comportant 5 étapes normales plus une étape boss. Les étapes doivent être complétées dans l\'ordre. Chaque victoire soigne vos héros à 100 % de leur stamina.',
      },
      {
        heading: 'Les 5 régions',
        table: {
          headers: ['Région', 'Niveau conseillé', 'Ennemis', 'Boss'],
          rows: [
            ['Forêt Enchantée', '1 – 3', 'Slimes', 'Roi Slime (40 PV)'],
            ['Cavernes Maudites', '5 – 9', 'Gobelins, Squelettes', 'Chef Gobelin'],
            ['Ruines Anciennes', '12 – 18', 'Squelettes', 'Liche Noire'],
            ['Forteresse Orc', '22 – 30', 'Orcs', 'Seigneur Orc (150 PV)'],
            ['Enfer Ardent', '35 – 45', 'Démons', 'Seigneur Démon (250 PV)'],
          ],
        },
      },
      {
        heading: 'Types d\'ennemis',
        table: {
          headers: ['Ennemi', 'Comportement'],
          rows: [
            ['Slime', 'Lent, faibles PV — idéal pour débuter'],
            ['Gobelin', 'Rapide, attaques fréquentes'],
            ['Squelette', 'PV élevés, résistant aux dégâts'],
            ['Orc', 'Très fort, charges dévastatrices'],
            ['Démon', 'Rapide et puissant — ennemi le plus dangereux'],
          ],
        },
      },
      {
        heading: 'Patterns des boss',
        list: [
          'Charge — Le boss fonce vers les héros ; posez des bombes sur son chemin.',
          'Invocation — Des minions apparaissent ; éliminez-les avant de vous concentrer sur le boss.',
          'Invincibilité — Le boss est temporairement immunisé ; esquivez et attendez.',
          'Pluie de bombes — Des bombes tombent aléatoirement ; restez mobiles.',
        ],
      },
      {
        heading: 'Conseils',
        list: [
          'Amenez vos 6 meilleurs héros pour les combats de boss.',
          'La stamina est restaurée à 100 % après chaque victoire.',
          'Les boss changent de pattern lorsque leurs PV passent sous certains seuils.',
          'Les étapes normales (sans boss) offrent moins de récompenses mais sont sûres pour farmer de l\'XP.',
        ],
      },
    ],
  },

  // ─── Système de Gacha ─────────────────────────────────────────────────────
  {
    slug: 'invocation-gacha',
    title: 'Invocation & Gacha',
    subtitle: 'Fonctionnement du système d\'invocation, des taux et du pity',
    category: 'Gacha',
    icon: 'sparkle',
    tags: ['invocation', 'gacha', 'pity', 'taux', 'drop', 'doublon', 'ascension', 'tirage'],
    difficulty: 'débutant',
    relatedSlugs: ['heros', 'ressources', 'recyclage'],
    content: [
      {
        heading: 'Comment invoquer ?',
        body: 'Depuis l\'onglet Invocation, dépensez des BC pour obtenir de nouveaux héros. Une invocation simple coûte 100 BC ; un pack de 10 coûte 900 BC (économie de 100 BC). Les héros obtenus sont ajoutés directement à votre roster.',
      },
      {
        heading: 'Taux de drop',
        table: {
          headers: ['Rareté', 'Probabilité'],
          rows: [
            ['Common', '60 %'],
            ['Rare', '25 %'],
            ['Super Rare', '10 %'],
            ['Epic', '4 %'],
            ['Legend', '0,9 %'],
            ['Super Legend', '0,1 %'],
          ],
        },
      },
      {
        heading: 'Système de Pity',
        body: 'Le pity est un compteur qui garantit l\'obtention d\'une rareté minimale après un certain nombre d\'invocations sans l\'avoir obtenue. Les compteurs ne se réinitialisent jamais, même entre les sessions de jeu.',
        table: {
          headers: ['Rareté garantie', 'Invocations sans drop'],
          rows: [
            ['Rare', '20'],
            ['Super Rare', '50'],
            ['Epic', '100'],
            ['Legend', '200'],
          ],
        },
      },
      {
        heading: 'Doublons & Ascension',
        body: 'Si vous obtenez un héros que vous possédez déjà, il devient un doublon. Les doublons servent à faire monter les étoiles du héros via l\'ascension — ne les ignorez pas !',
      },
    ],
  },

  // ─── Quêtes Journalières ──────────────────────────────────────────────────
  {
    slug: 'quetes-journalieres',
    title: 'Quêtes Journalières',
    subtitle: 'Présentation des quêtes quotidiennes et stratégie optimale',
    category: 'Progression',
    icon: 'target',
    tags: ['quêtes', 'journalières', 'quotidien', 'bonus', 'récompenses', 'reset', 'xp'],
    difficulty: 'débutant',
    relatedSlugs: ['ressources', 'cartes', 'mode-histoire'],
    content: [
      {
        heading: 'Fonctionnement',
        body: 'Chaque jour, 3 quêtes aléatoires sont générées. Compléter les 3 déclenche un bonus de 500 BC et 200 XP. Les quêtes se réinitialisent à minuit ; les progrès non complétés sont perdus.',
      },
      {
        heading: 'Types de quêtes',
        table: {
          headers: ['Type', 'Objectif', 'Récompense'],
          rows: [
            ['Bombardier', 'Poser 100 – 300 bombes', 'BC + XP'],
            ['Entraîneur', 'Améliorer 1 – 3 héros', 'BC + XP'],
            ['Explorateur', 'Compléter 3 – 5 cartes', 'BC + XP'],
            ['Chasseur de trésors', 'Ouvrir 10 – 25 coffres', 'BC + XP'],
            ['Combattant', 'Éliminer des ennemis en Histoire', 'BC + XP'],
            ['Collectionneur', 'Invoquer 3 – 5 héros', 'BC + XP'],
          ],
        },
      },
      {
        heading: 'Stratégie',
        list: [
          'Commencez par les quêtes les plus rapides (Entraîneur, Collectionneur).',
          'La Chasse au Trésor compte à la fois pour les quêtes "bombes" et "coffres".',
          'Jouez au moins une session par jour pour ne pas manquer le bonus 3/3.',
          'Le bonus de complétion totale (500 BC + 200 XP) représente plus de la moitié de la récompense journalière.',
        ],
      },
    ],
  },
  // ─── Recyclage ────────────────────────────────────────────────────────────
  {
    slug: 'recyclage',
    title: 'Recyclage & Universal Shards',
    subtitle: 'Convertissez vos héros en excès en Universal Shards pour progresser',
    category: 'Économie',
    icon: 'gem',
    tags: ['recyclage', 'shards', 'universal', 'conversion', 'doublon', 'ressources'],
    difficulty: 'intermédiaire',
    relatedSlugs: ['ressources', 'heros', 'invocation-gacha', 'fusion-heros'],
    content: [
      {
        heading: 'Présentation',
        body: 'Le recyclage permet de convertir des héros inutilisés en Universal Shards, la ressource secondaire du jeu. C\'est le principal moyen de valoriser les doublons et les héros de faible rareté accumulés via l\'invocation.',
      },
      {
        heading: 'Valeurs de recyclage par rareté',
        table: {
          headers: ['Rareté', 'Shards obtenus', 'Bonus niveaux'],
          rows: [
            ['Common', '1', '+1 / 10 niveaux'],
            ['Rare', '3', '+1 / 10 niveaux'],
            ['Super Rare', '8', '+1 / 10 niveaux'],
            ['Epic', '20', '+1 / 10 niveaux'],
            ['Legend', '50', '+1 / 10 niveaux'],
            ['Super Legend', '150', '+1 / 10 niveaux'],
          ],
        },
      },
      {
        heading: 'Utilisation des Universal Shards',
        list: [
          'Invocation ciblée — Choisissez la rareté exacte du héros invoqué (Common=10, Rare=50, Super-Rare=150, Epic=400, Legend=1000, Super-Legend=2500 shards)',
          'Amélioration de compétences — Sacrifiez des doublons pour monter les skills de vos héros clés',
        ],
      },
      {
        heading: 'Stratégie de recyclage',
        list: [
          'Verrouillez toujours vos héros principaux pour éviter un recyclage accidentel.',
          'Améliorez les compétences avec les doublons AVANT de recycler les surplus.',
          'Montez les héros Common/Rare au niveau 10+ avant de les recycler pour le bonus de shards.',
          'Gardez au moins 2 héros par clan pour les synergies — ne recyclez pas tout.',
        ],
      },
    ],
  },

  // ─── Fusion de Héros ───────────────────────────────────────────────────────
  {
    slug: 'fusion-heros',
    title: 'Fusion & Ascension de Héros',
    subtitle: 'Sacrifiez des doublons pour faire monter les étoiles et les compétences de vos héros',
    category: 'Héros',
    icon: 'crown',
    tags: ['fusion', 'ascension', 'étoiles', 'doublons', 'compétences', 'skill', 'upgrade', 'rareté', 'nourrir'],
    difficulty: 'intermédiaire',
    relatedSlugs: ['heros', 'recyclage', 'invocation-gacha'],
    content: [
      {
        heading: 'Fusion de Rareté (Nourrir)',
        body: 'La fusion de rareté permet de faire monter la rareté d\'un héros en le "nourrissant" avec d\'autres héros de la même rareté. Le héros principal conserve son identité complète (nom, clan, icône, étoiles), seule sa rareté — et donc ses stats de base, son niveau maximum et ses compétences — est augmentée. Les héros utilisés comme nourriture sont définitivement sacrifiés.',
      },
      {
        heading: 'Recettes de fusion de rareté',
        table: {
          headers: ['Rareté départ', 'Rareté cible', 'Héros requis (niveau max)'],
          rows: [
            ['Common', 'Rare', '2 héros Common au niveau max'],
            ['Rare', 'Super Rare', '3 héros Rare au niveau max'],
            ['Super Rare', 'Epic', '4 héros Super Rare au niveau max'],
            ['Epic', 'Legend', '5 héros Epic au niveau max'],
            ['Legend', 'Super Legend', '6 héros Legend au niveau max'],
          ],
        },
      },
      {
        heading: 'Ce qui est conservé lors d\'une fusion',
        list: [
          'Identité du héros : nom, clan, icône — le héros reste le même personnage.',
          'Étoiles d\'ascension — elles sont préservées.',
          'Le héros garde son slot principal et n\'est pas supprimé.',
        ],
      },
      {
        heading: 'Ce qui change après la fusion',
        list: [
          'La rareté monte d\'un palier (ex : Common → Rare).',
          'Le niveau maximum augmente selon la nouvelle rareté.',
          'Les stats de base sont recalculées pour la nouvelle rareté.',
          'Le nombre de compétences disponibles augmente (Common = 0, jusqu\'à 5 pour Super Legend).',
        ],
      },
      {
        heading: 'Condition requise',
        body: 'Les héros utilisés comme nourriture doivent avoir atteint le niveau maximum de leur rareté actuelle. Vérifiez le niveau maximum dans le tableau des raretés (article Héros) avant de fusionner.',
      },
      {
        heading: 'Ascension (Étoiles)',
        body: 'L\'ascension consomme des doublons d\'un même héros pour augmenter ses étoiles de 1 à 5. Chaque étoile confère un bonus significatif à toutes les statistiques. Un héros 5 étoiles atteint son plein potentiel.',
      },
      {
        heading: 'Coût d\'ascension',
        table: {
          headers: ['Étoile visée', 'Doublons requis', 'Bonus stats cumulé'],
          rows: [
            ['★★', '1 doublon', '+10 %'],
            ['★★★', '2 doublons', '+25 %'],
            ['★★★★', '3 doublons', '+45 %'],
            ['★★★★★', '5 doublons', '+75 %'],
          ],
        },
      },
      {
        heading: 'Amélioration de compétences',
        body: 'Chaque héros possède un nombre de compétences déterminé par sa rareté (0 pour Common, jusqu\'à 5 pour Super Legend). Les doublons peuvent être sacrifiés pour monter le niveau d\'une compétence spécifique, augmentant son efficacité.',
      },
      {
        heading: 'Priorité : Ascension ou Compétences ?',
        list: [
          'Priorisez les compétences si le héros est déjà dans votre équipe active — l\'impact en combat est immédiat.',
          'Priorisez l\'ascension si vous avez beaucoup de doublons — le bonus de stats est global.',
          'Pour les héros Common (0 compétences), l\'ascension est la seule option.',
          'Un héros Legend avec des compétences maximisées surpasse un Super Legend de base.',
        ],
      },
    ],
  },

  // ─── Compétences ────────────────────────────────────────────────────────────
  {
    slug: 'competences',
    title: 'Compétences des Héros',
    subtitle: 'Les 21 compétences disponibles, leurs effets et comment les débloquer',
    category: 'Héros',
    icon: 'sparkle',
    tags: ['compétences', 'skills', 'passif', 'actif', 'bombstorm', 'ironwill', 'clanbond'],
    difficulty: 'avancé',
    relatedSlugs: ['heros', 'fusion-heros', 'families-heros'],
    content: [
      {
        heading: 'Présentation',
        body: 'Les compétences sont des capacités passives ou conditionnelles attachées aux héros. Le nombre de compétences dépend de la rareté : Common = 0, Rare = 1, Super Rare = 2, Epic = 3, Legend = 4, Super Legend = 5.',
      },
      {
        heading: 'Compétences clés',
        table: {
          headers: ['Compétence', 'Effet', 'Type'],
          rows: [
            ['bombStorm', 'Pose plusieurs bombes en une action', 'Offensif'],
            ['blastRadius', 'Augmente la portée des explosions', 'Offensif'],
            ['ironWill', 'Réduit les dégâts reçus', 'Défensif'],
            ['lastStand', 'Boost de stats quand la stamina est basse', 'Survie'],
            ['clanBond', 'Renforce le bonus de synergie de clan', 'Support'],
            ['speedBurst', 'Boost temporaire de vitesse', 'Mobilité'],
            ['luckyCharm', 'Augmente la chance de coffres rares', 'Utilitaire'],
          ],
        },
      },
      {
        heading: 'Montée en niveau',
        body: 'Les compétences montent en niveau via le sacrifice de doublons du même héros. Chaque niveau augmente l\'efficacité de la compétence (ex : +10 % de portée par niveau pour blastRadius). Le niveau maximum dépend de la rareté du héros.',
      },
      {
        heading: 'Conseils d\'optimisation',
        list: [
          'bombStorm et blastRadius sont les meilleurs skills pour la Chasse au Trésor (farm rapide).',
          'ironWill et lastStand sont essentiels pour les boss de haut niveau en mode Histoire.',
          'clanBond est particulièrement puissant si vous jouez une équipe mono-clan.',
          'Montez les compétences de vos héros Legend/Epic en priorité — l\'investissement en doublons y est le plus rentable.',
        ],
      },
    ],
  },

  // ─── Synergies de Clan ──────────────────────────────────────────────────────
  {
    slug: 'synergies-clan',
    title: 'Synergies de Clan',
    subtitle: 'Activez des bonus passifs puissants en alignant des héros du même clan',
    category: 'Combat',
    icon: 'shield',
    tags: ['synergie', 'clan', 'bonus', 'équipe', 'composition', 'affinité', 'passif'],
    difficulty: 'avancé',
    relatedSlugs: ['families-heros', 'heros', 'mode-histoire', 'competences'],
    content: [
      {
        heading: 'Fonctionnement',
        body: 'Placer 2 héros ou plus du même clan dans votre équipe active déclenche un bonus de synergie passif. Ce bonus s\'applique à TOUS les héros de l\'équipe, pas seulement ceux du clan concerné.',
      },
      {
        heading: 'Bonus par clan',
        table: {
          headers: ['Clan', 'Bonus synergie (2+ héros)', 'Affinité Histoire'],
          rows: [
            ['Clan Braise', '+1 portée pour toutes les bombes', '×1.25 vs Démons'],
            ['Cavaliers de l\'Orage', 'Bombes explosent 0.3s plus tôt', '×1.25 vs Squelettes'],
            ['Garde de Forge', 'Dégâts reçus −20 %', '×1.25 vs Orcs'],
            ['Noyau d\'Ombre', '+30 % pièces des coffres', '×1.25 vs Gobelins'],
            ['Circuit Arcanique', '+20 % chance de réaction en chaîne', '×1.25 vs Slimes'],
            ['Meute Sauvage', 'Déplacement +20 %', '×1.25 vs Gobelins'],
          ],
        },
      },
      {
        heading: 'Compositions recommandées',
        list: [
          'Farm coffres : 2+ Noyau d\'Ombre pour +30 % pièces — la synergie la plus rentable en Chasse au Trésor.',
          'Speed run : 2+ Meute Sauvage pour +20 % vitesse — idéal pour compléter des cartes rapidement.',
          'Boss tanky : 2+ Garde de Forge pour −20 % dégâts reçus — indispensable en Enfer Ardent.',
          'Chaînes : 2+ Circuit Arcanique pour +20 % réactions en chaîne — puissant sur les cartes denses.',
          'Régions Histoire : alignez le clan avec l\'affinité de la région pour cumuler synergie + bonus dégâts.',
        ],
      },
    ],
  },
];

// ─── Glossaire ────────────────────────────────────────────────────────────────

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  // Abréviations de stats
  { term: 'BC', abbr: 'BomberCoins', definition: 'Monnaie principale du jeu utilisée pour invoquer des héros et les améliorer.', category: 'Ressources' },
  { term: 'PWR', abbr: 'Puissance', definition: 'Statistique déterminant les dégâts infligés par les bombes d\'un héros.', category: 'Stats' },
  { term: 'SPD', abbr: 'Vitesse', definition: 'Statistique déterminant la vitesse de déplacement du héros sur la grille.', category: 'Stats' },
  { term: 'RNG', abbr: 'Portée', definition: 'Statistique déterminant le rayon de l\'explosion des bombes posées par le héros.', category: 'Stats' },
  { term: 'BNB', abbr: 'Bombes', definition: 'Statistique indiquant le nombre de bombes que le héros peut poser simultanément.', category: 'Stats' },
  { term: 'STA', abbr: 'Stamina', definition: 'Points de vie et d\'endurance du héros. Tombe à zéro quand le héros est épuisé.', category: 'Stats' },
  { term: 'LCK', abbr: 'Chance', definition: 'Statistique influençant la probabilité de trouver des coffres de rareté élevée.', category: 'Stats' },
  // Mécaniques
  { term: 'Pity', definition: 'Système de garantie : après un certain nombre d\'invocations sans obtenir une rareté donnée, elle est garantie.', category: 'Gacha' },
  { term: 'Pity counter', definition: 'Compteur interne qui suit le nombre d\'invocations depuis le dernier drop d\'une rareté. Ne se réinitialise jamais.', category: 'Gacha' },
  { term: 'Shard', definition: 'Fragment de héros obtenu lors d\'invocations. Réservé pour une future fonctionnalité d\'artisanat.', category: 'Ressources' },
  { term: 'Ascension', definition: 'Processus consistant à sacrifier des doublons d\'un héros pour augmenter ses étoiles et améliorer ses stats.', category: 'Héros' },
  { term: 'Doublon', definition: 'Héros obtenu en invocation alors qu\'il est déjà présent dans le roster. Utilisé pour l\'ascension.', category: 'Héros' },
  { term: 'Roster', definition: 'L\'ensemble des héros possédés par le joueur.', category: 'Héros' },
  { term: 'Idle', definition: 'Style de jeu où les actions se déroulent automatiquement. Ici, les héros posent des bombes sans intervention directe.', category: 'Gameplay' },
  { term: 'A*', definition: 'Algorithme de recherche de chemin utilisé par les héros pour naviguer sur la grille et atteindre leurs cibles.', category: 'Technique' },
  { term: 'Proc', definition: 'Déclenchement d\'une compétence conditionnelle (ex : une compétence qui s\'active "à chaque pose de bombe").', category: 'Gameplay' },
  { term: 'Pattern', definition: 'Séquence d\'actions que les boss exécutent de manière cyclique (charge, invocation, invincibilité, pluie de bombes).', category: 'Combat' },
  { term: 'Minion', definition: 'Ennemi invoqué par un boss en cours de combat. À éliminer en priorité.', category: 'Combat' },
  { term: 'Chain reaction', definition: 'Effet en chaîne où l\'explosion d\'une bombe déclenche l\'explosion d\'autres bombes voisines.', category: 'Gameplay' },
  { term: 'RAF', definition: 'requestAnimationFrame — mécanisme JavaScript utilisé pour la boucle de jeu principale.', category: 'Technique' },
  { term: 'Gacha', definition: 'Système de tirage aléatoire (invocation) inspiré des jeux japonais, avec des taux de rareté variables.', category: 'Gacha' },
  { term: 'Buff', definition: 'Amélioration temporaire ou permanente appliquée aux stats d\'un héros.', category: 'Combat' },
  { term: 'Rarity', definition: 'Niveau de rareté d\'un héros : Common, Rare, Super Rare, Epic, Legend, Super Legend.', category: 'Héros' },
  { term: 'Drop rate', definition: 'Probabilité d\'obtenir une rareté donnée lors d\'une invocation.', category: 'Gacha' },
  { term: 'Tick', definition: 'Une itération de la boucle de jeu. Chaque tick met à jour les bombes, les explosions et les déplacements.', category: 'Technique' },
];
