import { BESTIARY_BOMBERS } from '@/data/bestiary';
import { Hero, Rarity, RARITY_CONFIG, HERO_NAMES, HERO_ICON_KEYS, Skill, HERO_VISUALS, HeroFamilyId } from './types';

let heroIdCounter = Date.now();

const STAT_VARIANCE_MIN = 0.9;   // facteur minimum de variance des stats (−10%)
const STAT_VARIANCE_RANGE = 0.2; // amplitude de la variance (±10%)

const ALL_SKILLS: Record<string, Skill> = {
  doubleBlast: { name: 'Double Blast', description: '20% chance bombe double', trigger: 'bomb', effect: 'double_explosion' },
  treasureSense: { name: 'Treasure Sense', description: 'Détecte les coffres +2 tuiles', trigger: 'passive', effect: 'detect_range_up' },
  chainReaction: { name: 'Chain Reaction', description: '+50% coins en chaîne', trigger: 'chain', effect: 'chain_coins_bonus' },
  energyDrain: { name: 'Energy Drain', description: '+5 énergie par ennemi touché', trigger: 'explosion', effect: 'energy_regen' },
  goldRush: { name: 'Gold Rush', description: '10% chance x2 coins coffre', trigger: 'chest_open', effect: 'double_chest_coins' },
  ghostWalk: { name: 'Ghost Walk', description: 'Traverse les blocs', trigger: 'passive', effect: 'walk_through_blocks' },
  auraPower: { name: 'Aura of Power', description: '+1 PWR alliés proches', trigger: 'passive', effect: 'aura_pwr' },
  megaBomb: { name: 'Mega Bomb', description: 'Super bombe toutes les 10 bombes', trigger: 'every_10_bombs', effect: 'mega_bomb' },
  timeWarp: { name: 'Time Warp', description: 'Bombes explosent en 1s', trigger: 'passive', effect: 'fast_bombs' },
  goldenTouch: { name: 'Golden Touch', description: '+100% récompenses coffres', trigger: 'passive', effect: 'chest_reward_double' },
  // DPS
  bombStorm: { name: 'Tempête de Bombes', description: '5% chance poser 2 bombes simultanément', trigger: 'bomb', effect: 'dual_bomb' },
  blastRadius: { name: 'Zone de Blast', description: '+1 portée permanente', trigger: 'passive', effect: 'perm_range_up' },
  piercing: { name: 'Perforant', description: 'Les explosions traversent 1 bloc destructible', trigger: 'explosion', effect: 'pierce_blocks' },
  // Tank/Survie
  ironWill: { name: 'Volonté de Fer', description: 'Régénère 5% stamina/coffre ouvert', trigger: 'chest_open', effect: 'stamina_on_chest' },
  lastStand: { name: 'Dernier Souffle', description: 'Immunité dégâts quand stamina < 15%', trigger: 'passive', effect: 'last_stand_immunity' },
  fortitude: { name: 'Forteresse', description: '+25% stamina max', trigger: 'passive', effect: 'max_stamina_bonus' },
  // Support/Utilitaire
  mapSense: { name: 'Sens de la Carte', description: 'Révèle les coffres proches au départ', trigger: 'on_start', effect: 'reveal_chests' },
  bombRush: { name: 'Ruée de Bombes', description: 'Cooldown bombe -20%', trigger: 'passive', effect: 'faster_cooldown' },
  treasureHunter: { name: 'Chasseur de Trésors', description: '+1 coffre possible par carte', trigger: 'passive', effect: 'extra_chest_chance' },
  // Contrôle/Clan
  clanBond: { name: 'Lien de Clan', description: '+5% dégâts par allié du même clan', trigger: 'passive', effect: 'clan_damage_bonus' },
  explosiveAura: { name: 'Aura Explosive', description: "Zone d'explosion +0.5 tuile au centre", trigger: 'explosion', effect: 'aura_explosion' },
};

const SKILL_POOL_BY_RARITY: Record<Rarity, string[]> = {
  common: [],
  rare: ['doubleBlast', 'treasureSense', 'ironWill', 'bombRush'],
  'super-rare': [
    'doubleBlast', 'treasureSense', 'chainReaction', 'energyDrain',
    'ironWill', 'blastRadius', 'bombRush', 'mapSense',
  ],
  epic: [
    'doubleBlast', 'treasureSense', 'chainReaction', 'energyDrain',
    'goldRush', 'ghostWalk', 'bombStorm', 'fortitude', 'treasureHunter',
    'lastStand', 'clanBond',
  ],
  legend: [
    'chainReaction', 'energyDrain', 'goldRush', 'ghostWalk',
    'auraPower', 'megaBomb', 'bombStorm', 'blastRadius', 'piercing',
    'fortitude', 'lastStand', 'clanBond', 'explosiveAura',
  ],
  'super-legend': [
    'goldRush', 'ghostWalk', 'auraPower', 'megaBomb', 'timeWarp', 'goldenTouch',
    'bombStorm', 'piercing', 'lastStand', 'clanBond', 'explosiveAura',
    'treasureHunter', 'mapSense',
  ],
};

const CANONICAL_HERO_POOL_BY_RARITY: Record<Rarity, { id: string; name: string; iconKey: string }[]> = {
  common: [],
  rare: [],
  'super-rare': [],
  epic: [],
  legend: [],
  'super-legend': [],
};

for (const bomber of BESTIARY_BOMBERS) {
  if (!bomber.rarity) continue;
  CANONICAL_HERO_POOL_BY_RARITY[bomber.rarity].push({
    id: bomber.id,
    name: bomber.name,
    iconKey: bomber.assets.iconKey ?? HERO_ICON_KEYS[HERO_NAMES.indexOf(bomber.name) % HERO_ICON_KEYS.length] ?? HERO_ICON_KEYS[0],
  });
}

export function rollRarity(pityCounters: { rare: number; superRare: number; epic: number; legend: number }): Rarity {
  // Check pity
  if (pityCounters.legend >= 200) return 'legend';
  if (pityCounters.epic >= 50) return 'epic';
  if (pityCounters.superRare >= 30) return 'super-rare';
  if (pityCounters.rare >= 10) return 'rare';

  const roll = Math.random();
  let cumulative = 0;

  const rarities: Rarity[] = ['super-legend', 'legend', 'epic', 'super-rare', 'rare', 'common'];
  for (const r of rarities) {
    cumulative += RARITY_CONFIG[r].rate;
    if (roll < cumulative) return r;
  }
  return 'common';
}

function fisherYates<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateHero(rarity: Rarity): Hero {
  const config = RARITY_CONFIG[rarity];
  const canonicalPool = CANONICAL_HERO_POOL_BY_RARITY[rarity];
  const pickedCanonicalHero = canonicalPool.length > 0
    ? canonicalPool[Math.floor(Math.random() * canonicalPool.length)]
    : null;

  const name = pickedCanonicalHero?.name ?? HERO_NAMES[Math.floor(Math.random() * HERO_NAMES.length)];
  const icon = pickedCanonicalHero?.iconKey ?? HERO_ICON_KEYS[Math.floor(Math.random() * HERO_ICON_KEYS.length)];
  const family = (HERO_VISUALS[name.toLowerCase()]?.family || undefined) as HeroFamilyId | undefined;

  // Random variance ±10%
  const vary = (base: number) => Math.max(1, Math.round(base * (STAT_VARIANCE_MIN + Math.random() * STAT_VARIANCE_RANGE)));

  const stats = {
    pwr: vary(config.baseStats.pwr),
    spd: vary(config.baseStats.spd),
    rng: vary(config.baseStats.rng),
    bnb: vary(config.baseStats.bnb),
    sta: vary(config.baseStats.sta),
    lck: vary(config.baseStats.lck),
  };

  // Pick skills
  const skillPool = SKILL_POOL_BY_RARITY[rarity];
  const numSkills = config.skills;
  const shuffled = fisherYates([...skillPool]);
  const skills = shuffled.slice(0, numSkills).map(k => ALL_SKILLS[k]);

  const id = `hero_${heroIdCounter++}`;

  return {
    id,
    name: `${name} #${id.split('_')[1]}`,
    rarity,
    level: 1,
    xp: 0,
    stars: 0,
    stats,
    skills,
    currentStamina: stats.sta,
    maxStamina: stats.sta,
    isActive: true,
    houseLevel: 1,
    position: { x: 1, y: 1 },
    targetPosition: null,
    path: null,
    state: 'idle',
    bombCooldown: 0,
    stuckTimer: 0,
    icon,
    family,
    progressionStats: {
      chestsOpened: 0,
      totalDamageDealt: 0,
      battlesPlayed: 0,
      victories: 0,
      obtainedAt: Date.now(),
    },
  };
}

export function summonHero(pityCounters: { rare: number; superRare: number; epic: number; legend: number }): {
  hero: Hero;
  updatedPity: typeof pityCounters;
} {
  const rarity = rollRarity(pityCounters);
  const hero = generateHero(rarity);

  const updatedPity = { ...pityCounters };
  // Increment all counters
  updatedPity.rare += 1;
  updatedPity.superRare += 1;
  updatedPity.epic += 1;
  updatedPity.legend += 1;

  // Reset relevant counters
  if (rarity === 'rare' || rarity === 'super-rare' || rarity === 'epic' || rarity === 'legend' || rarity === 'super-legend') {
    updatedPity.rare = 0;
  }
  if (rarity === 'super-rare' || rarity === 'epic' || rarity === 'legend' || rarity === 'super-legend') {
    updatedPity.superRare = 0;
  }
  if (rarity === 'epic' || rarity === 'legend' || rarity === 'super-legend') {
    updatedPity.epic = 0;
  }
  if (rarity === 'legend' || rarity === 'super-legend') {
    updatedPity.legend = 0;
  }

  return { hero, updatedPity };
}
