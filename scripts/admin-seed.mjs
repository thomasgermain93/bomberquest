#!/usr/bin/env node
/**
 * BomberQuest — Admin Seed Tool
 * 
 * Génère des données de test et affiche les commandes pour les injecter dans localStorage.
 * 
 * Usage:
 *   node scripts/admin-seed.mjs [commande] [options]
 *
 * Commandes:
 *   heroes   --rarity <rarity> --count <n> --level <n>   Ajouter des héros
 *   coins    --amount <n>                                  Définir les BomberCoins
 *   level    --account <n>                                 Définir le niveau du compte
 *   reset                                                  Réinitialiser la save
 *   show                                                   Afficher la save actuelle
 *   full                                                   Profil complet (test toutes features)
 *
 * Exemples:
 *   node scripts/admin-seed.mjs heroes --rarity legend --count 3 --level 80
 *   node scripts/admin-seed.mjs coins --amount 999999
 *   node scripts/admin-seed.mjs full
 */

const SAVE_KEY = 'bomberquest_save';

const RARITY_CONFIG = {
  common:        { maxLevel: 20,  skills: 0, baseStats: { pwr:1, spd:1, rng:1, bnb:1, sta:28, lck:3 } },
  rare:          { maxLevel: 40,  skills: 1, baseStats: { pwr:2, spd:2, rng:1, bnb:1, sta:35, lck:4 } },
  'super-rare':  { maxLevel: 60,  skills: 2, baseStats: { pwr:3, spd:3, rng:2, bnb:2, sta:45, lck:5 } },
  epic:          { maxLevel: 80,  skills: 3, baseStats: { pwr:5, spd:4, rng:3, bnb:3, sta:60, lck:6 } },
  legend:        { maxLevel: 100, skills: 4, baseStats: { pwr:8, spd:6, rng:4, bnb:4, sta:80, lck:8 } },
  'super-legend':{ maxLevel: 120, skills: 5, baseStats: { pwr:12, spd:9, rng:5, bnb:5, sta:100, lck:10 } },
};

const ALL_SKILLS = {
  doubleBlast:     { name: 'Double Blast',       description: '20% chance bombe double',         trigger: 'bomb',         effect: 'double_explosion' },
  treasureSense:   { name: 'Treasure Sense',     description: 'Détecte les coffres +2 tuiles',   trigger: 'passive',      effect: 'detect_range_up' },
  chainReaction:   { name: 'Chain Reaction',      description: '+50% coins en chaîne',            trigger: 'chain',        effect: 'chain_coins_bonus' },
  energyDrain:     { name: 'Energy Drain',        description: '+5 énergie par ennemi touché',    trigger: 'explosion',    effect: 'energy_regen' },
  goldRush:        { name: 'Gold Rush',           description: '10% chance x2 coins coffre',     trigger: 'chest_open',   effect: 'double_chest_coins' },
  ghostWalk:       { name: 'Ghost Walk',          description: 'Traverse les blocs',              trigger: 'passive',      effect: 'walk_through_blocks' },
  auraPower:       { name: 'Aura of Power',       description: '+1 PWR alliés proches',           trigger: 'passive',      effect: 'aura_pwr' },
  megaBomb:        { name: 'Mega Bomb',           description: 'Super bombe toutes les 10 bombes',trigger: 'every_10_bombs', effect: 'mega_bomb' },
  timeWarp:        { name: 'Time Warp',           description: 'Bombes explosent en 1s',          trigger: 'passive',      effect: 'fast_bombs' },
  goldenTouch:     { name: 'Golden Touch',        description: '+100% récompenses coffres',       trigger: 'passive',      effect: 'chest_reward_double' },
  bombStorm:       { name: 'Tempête de Bombes',   description: '5% chance poser 2 bombes',        trigger: 'bomb',         effect: 'dual_bomb' },
  blastRadius:     { name: 'Zone de Blast',       description: '+1 portée permanente',            trigger: 'passive',      effect: 'perm_range_up' },
  piercing:        { name: 'Perforant',           description: 'Les explosions traversent 1 bloc',trigger: 'explosion',    effect: 'pierce_blocks' },
  ironWill:        { name: 'Volonté de Fer',      description: 'Régénère 5% stamina/coffre',      trigger: 'chest_open',   effect: 'stamina_on_chest' },
  lastStand:       { name: 'Dernier Souffle',     description: 'Immunité dégâts stamina < 15%',   trigger: 'passive',      effect: 'last_stand_immunity' },
  fortitude:       { name: 'Forteresse',          description: '+25% stamina max',                trigger: 'passive',      effect: 'max_stamina_bonus' },
  mapSense:        { name: 'Sens de la Carte',    description: 'Révèle les coffres au départ',    trigger: 'on_start',     effect: 'reveal_chests' },
  bombRush:        { name: 'Ruée de Bombes',      description: 'Cooldown bombe -20%',             trigger: 'passive',      effect: 'faster_cooldown' },
  treasureHunter:  { name: 'Chasseur de Trésors', description: '+1 coffre possible/carte',        trigger: 'passive',      effect: 'extra_chest_chance' },
  clanBond:        { name: 'Lien de Clan',        description: '+5% dégâts/allié du même clan',   trigger: 'passive',      effect: 'clan_damage_bonus' },
  explosiveAura:   { name: 'Aura Explosive',      description: "Zone d'explosion +0.5 tuile",     trigger: 'explosion',    effect: 'aura_explosion' },
};

const SKILL_POOL_BY_RARITY = {
  common: [],
  rare: ['doubleBlast', 'treasureSense', 'ironWill', 'bombRush'],
  'super-rare': ['doubleBlast', 'treasureSense', 'chainReaction', 'energyDrain', 'ironWill', 'blastRadius', 'bombRush', 'mapSense'],
  epic: ['doubleBlast', 'treasureSense', 'chainReaction', 'energyDrain', 'goldRush', 'ghostWalk', 'bombStorm', 'fortitude', 'treasureHunter', 'lastStand', 'clanBond'],
  legend: ['chainReaction', 'energyDrain', 'goldRush', 'ghostWalk', 'auraPower', 'megaBomb', 'bombStorm', 'blastRadius', 'piercing', 'fortitude', 'lastStand', 'clanBond', 'explosiveAura'],
  'super-legend': ['goldRush', 'ghostWalk', 'auraPower', 'megaBomb', 'timeWarp', 'goldenTouch', 'bombStorm', 'piercing', 'lastStand', 'clanBond', 'explosiveAura', 'treasureHunter', 'mapSense'],
};

const HERO_NAMES = ['Blaze', 'Nova', 'Zephyr', 'Ember', 'Frost', 'Thunder', 'Shadow', 'Luna', 'Axel', 'Pyro'];
let heroCounter = 1000;

function generateHero(rarity, level = 1) {
  const config = RARITY_CONFIG[rarity];
  const name = HERO_NAMES[Math.floor(Math.random() * HERO_NAMES.length)];
  const skillPool = SKILL_POOL_BY_RARITY[rarity];
  const shuffled = [...skillPool].sort(() => Math.random() - 0.5);
  const skills = shuffled.slice(0, config.skills).map(k => ALL_SKILLS[k]);
  const id = `hero_${++heroCounter}`;
  const sta = config.baseStats.sta;
  return {
    id,
    name: `${name} #${heroCounter}`,
    rarity,
    level,
    xp: 0,
    stars: 0,
    stats: { ...config.baseStats },
    skills,
    currentStamina: sta,
    maxStamina: sta,
    isActive: true,
    houseLevel: 1,
    position: { x: 1, y: 1 },
    targetPosition: null,
    path: null,
    state: 'idle',
    bombCooldown: 0,
    stuckTimer: 0,
    progressionStats: { chestsOpened: 0, totalDamageDealt: 0, battlesPlayed: 0, victories: 0, obtainedAt: Date.now() },
    isLocked: false,
    family: undefined,
    icon: 'bomb',
  };
}

function getDefaultSave() {
  const starter = generateHero('common', 1);
  starter.name = 'Blaze #1';
  return {
    bomberCoins: 2000,
    heroes: [starter],
    accountLevel: 1,
    xp: 0,
    pityCounters: { rare: 0, superRare: 0, epic: 0, legend: 0 },
    totalHeroesOwned: 1,
    mapsCompleted: 0,
    shards: { common: 0, rare: 0, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0 },
    universalShards: 0,
    huntSpeed: 1,
    achievements: {},
    tutorialStep: undefined,
  };
}

// Parse args
const args = process.argv.slice(2);
const cmd = args[0];

function getArg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}

function printSnippet(save) {
  const json = JSON.stringify(save);
  console.log('\n\x1b[32m✅ Copie et colle dans la console du navigateur (localhost) :\x1b[0m\n');
  console.log(`\x1b[36mlocalStorage.setItem('${SAVE_KEY}', ${JSON.stringify(json)}); location.reload();\x1b[0m\n`);
}

function printInfo(save) {
  console.log(`\n\x1b[33m📊 Save actuelle :\x1b[0m`);
  console.log(`  Niveau compte : ${save.accountLevel}`);
  console.log(`  BomberCoins   : ${save.bomberCoins}`);
  console.log(`  Héros (${save.heroes.length}) :`);
  for (const h of save.heroes) {
    const skills = h.skills?.map(s => s.name).join(', ') || 'aucune';
    console.log(`    - ${h.name} [${h.rarity}] Lv.${h.level} | Skills(${h.skills?.length ?? 0}): ${skills}`);
  }
  console.log('');
}

switch (cmd) {
  case 'heroes': {
    const rarity = getArg('rarity', 'rare');
    const count  = parseInt(getArg('count', '3'));
    const level  = parseInt(getArg('level', RARITY_CONFIG[rarity]?.maxLevel || 40));

    if (!RARITY_CONFIG[rarity]) {
      console.error(`❌ Rareté invalide: ${rarity}`);
      console.error(`   Valeurs valides: common, rare, super-rare, epic, legend, super-legend`);
      process.exit(1);
    }

    const save = getDefaultSave();
    save.tutorialStep = undefined;
    save.bomberCoins = 50000;
    save.accountLevel = 30;

    const newHeroes = Array.from({ length: count }, () => generateHero(rarity, level));
    save.heroes.push(...newHeroes);
    save.totalHeroesOwned = save.heroes.length;

    printInfo(save);
    printSnippet(save);
    break;
  }

  case 'coins': {
    const amount = parseInt(getArg('amount', '999999'));
    const save = getDefaultSave();
    save.bomberCoins = amount;
    save.tutorialStep = undefined;
    console.log(`\n💰 BomberCoins → ${amount}`);
    printSnippet(save);
    break;
  }

  case 'level': {
    const accountLevel = parseInt(getArg('account', '50'));
    const save = getDefaultSave();
    save.accountLevel = accountLevel;
    save.bomberCoins = 99999;
    save.tutorialStep = undefined;
    console.log(`\n📈 Niveau compte → ${accountLevel}`);
    printSnippet(save);
    break;
  }

  case 'reset': {
    console.log('\n\x1b[31m🗑️  Reset la save :\x1b[0m\n');
    console.log(`\x1b[36mlocalStorage.removeItem('${SAVE_KEY}'); localStorage.removeItem('${SAVE_KEY}_ts'); location.reload();\x1b[0m\n`);
    break;
  }

  case 'show': {
    console.log('\n\x1b[33m👁  Pour voir la save actuelle :\x1b[0m\n');
    console.log(`\x1b[36mJSON.parse(localStorage.getItem('${SAVE_KEY}'))\x1b[0m\n`);
    break;
  }

  case 'full':
  default: {
    // Profil complet pour tester toutes les features
    const save = getDefaultSave();
    save.bomberCoins = 99999;
    save.universalShards = 5000;
    save.accountLevel = 50;
    save.tutorialStep = undefined;
    save.mapsCompleted = 10;

    // Héros pour tester skills unlock à différents niveaux
    const heroSpecs = [
      { rarity: 'rare',          level: 1  },  // Rare lv1 → 0 skill dispo (unlock à lv20)
      { rarity: 'rare',          level: 20 },  // Rare lv20 → 1 skill dispo
      { rarity: 'rare',          level: 40 },  // Rare lv40 (max) → 1 skill dispo
      { rarity: 'super-rare',    level: 1  },  // Super Rare lv1 → 0 skill
      { rarity: 'super-rare',    level: 20 },  // Super Rare lv20 → 1 skill
      { rarity: 'super-rare',    level: 40 },  // Super Rare lv40 → 2 skills
      { rarity: 'epic',          level: 20 },  // Epic lv20 → 1 skill
      { rarity: 'epic',          level: 60 },  // Epic lv60 → 3 skills
      { rarity: 'legend',        level: 40 },  // Legend lv40 → 2 skills
      { rarity: 'legend',        level: 100},  // Legend lv100 (max) → 4+1 skills
      { rarity: 'super-legend',  level: 80 },  // Super Legend lv80 → 4 skills
    ];

    for (const spec of heroSpecs) {
      save.heroes.push(generateHero(spec.rarity, spec.level));
    }

    // 2× Common maxés pour tester fusion
    save.heroes.push(generateHero('common', 20));
    save.heroes.push(generateHero('common', 20));

    save.totalHeroesOwned = save.heroes.length;

    printInfo(save);
    printSnippet(save);
    break;
  }
}
