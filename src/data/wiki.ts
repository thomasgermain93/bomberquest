export interface WikiArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
  content: WikiSection[];
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
    content: [
      {
        heading: 'Présentation',
        body: 'Chaque héros appartient à une famille qui définit son archetype et son style de jeu. Les familles influencent l\'apparence visuelle (couleurs du skin) et les compétences typiques du héros.',
      },
      {
        heading: 'Les 6 Familles',
        table: {
          headers: ['Famille', 'Description', 'Héros clés'],
          rows: [
            ['Clan Braise', 'Héros orientés feu et explosion', 'Blaze, Ember, Pyro, Fuse, Blast, Sol'],
            ["Cavaliers de l'Orage", 'Héros rapides avec affinité électrique', 'Spark, Volt, Storm, Zap, Vega, Dash'],
            ['Garde de Forge', 'Héros robustes axés tank et défense', 'Flint, Rex, Atlas, Duke, Max'],
            ["Noyau d'Ombre", "Héros d'infiltration et de contrôle", 'Ash, Nova, Echo, Crash, Luna'],
            ['Circuit Arcanique', 'Héros techno-magiques et utilitaires', 'Pixel, Chip, Byte, Orion'],
            ['Meute Sauvage', 'Héros agiles orientés rush et chasse', 'Boom, Nitro, Rush, Flash, Jet, Ace'],
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
