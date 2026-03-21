import { HeroFamilyId, HERO_VISUALS, Hero } from './types';
import { EnemyType } from './storyTypes';

// ============================================================
// CLAN SKILLS — Compétences passives de clan
// Activées quand 2+ héros du même clan sont dans l'équipe
// ============================================================

export interface ClanSkill {
  id: string;
  clanId: HeroFamilyId;
  name: string;
  description: string;
  minHeroes: number; // Nb minimum de héros du clan requis (toujours 2)
  effect: ClanSkillEffect;
}

export interface ClanSkillEffect {
  type: 'bomb_range' | 'bomb_timer' | 'stamina_shield' | 'coin_bonus' | 'chain_chance' | 'move_speed';
  value: number; // Valeur du bonus (absolu ou multiplicateur selon le type)
}

const CLAN_SKILLS: ClanSkill[] = [
  {
    id: 'ember-perpetual-fire',
    clanId: 'ember-clan',
    name: 'Feu Perpétuel',
    description: '2+ Clan Braise → +1 portée pour toutes les bombes',
    minHeroes: 2,
    effect: { type: 'bomb_range', value: 1 },
  },
  {
    id: 'storm-lightning-pace',
    clanId: 'storm-riders',
    name: 'Tempo Électrique',
    description: '2+ Cavaliers → bombes explosent 0.3s plus tôt',
    minHeroes: 2,
    effect: { type: 'bomb_timer', value: -0.3 },
  },
  {
    id: 'forge-iron-skin',
    clanId: 'forge-guard',
    name: 'Peau de Fer',
    description: '2+ Garde de Forge → dégâts reçus réduits de 20%',
    minHeroes: 2,
    effect: { type: 'stamina_shield', value: 0.20 },
  },
  {
    id: 'shadow-gold-veil',
    clanId: 'shadow-core',
    name: 'Voile Doré',
    description: "2+ Noyau d'Ombre → +30% pièces des coffres",
    minHeroes: 2,
    effect: { type: 'coin_bonus', value: 0.30 },
  },
  {
    id: 'arcane-resonance',
    clanId: 'arcane-circuit',
    name: 'Résonance Arcanique',
    description: '2+ Circuit → 20% chance de réaction en chaîne',
    minHeroes: 2,
    effect: { type: 'chain_chance', value: 0.20 },
  },
  {
    id: 'wild-pack-instinct',
    clanId: 'wild-pack',
    name: 'Instinct Sauvage',
    description: '2+ Meute → vitesse de déplacement +20%',
    minHeroes: 2,
    effect: { type: 'move_speed', value: 0.20 },
  },
];

// Obtenir la famille d'un héros — priorité au champ family du héros, fallback sur l'icône
export function getHeroFamily(hero: Hero): HeroFamilyId | undefined {
  return (hero.family ?? HERO_VISUALS[hero.icon]?.family) as HeroFamilyId | undefined;
}

// Calculer les compétences de clan actives pour une équipe de héros
export function getActiveClanSkills(heroes: Hero[]): ClanSkill[] {
  // Compter les héros par famille
  const familyCounts = new Map<HeroFamilyId, number>();
  for (const hero of heroes) {
    const family = getHeroFamily(hero);
    if (family) {
      familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
    }
  }

  // Retourner les skills dont la condition est remplie
  return CLAN_SKILLS.filter(skill =>
    (familyCounts.get(skill.clanId) || 0) >= skill.minHeroes
  );
}

// ============================================================
// CLAN AFFINITIES — Bonus selon clan du héros vs type d'ennemi
// ============================================================

// Multiplicateur de dégâts : > 1.0 = avantage, < 1.0 = désavantage
const CLAN_ENEMY_AFFINITY: Partial<Record<HeroFamilyId, Partial<Record<EnemyType, number>>>> = {
  'ember-clan': {
    demon: 1.25,  // Le feu contre les démons
    slime: 0.85,  // Le feu sèche les slimes... mais pas si efficace
  },
  'storm-riders': {
    skeleton: 1.25, // La foudre contre les squelettes (électrocution)
    orc: 1.10,
  },
  'forge-guard': {
    orc: 1.25,    // Métal contre force brute
    goblin: 1.10,
  },
  'shadow-core': {
    goblin: 1.25, // Ombre contre les rapides
    skeleton: 1.10,
  },
  'arcane-circuit': {
    slime: 1.25,  // Magie contre l'organique primitif
    demon: 1.10,
  },
  'wild-pack': {
    goblin: 1.25, // Nature contre le chaos
    slime: 1.10,
  },
};

// Obtenir le multiplicateur d'affinité clan vs ennemi
export function getClanAffinityMultiplier(heroFamily: HeroFamilyId | undefined, enemyType: EnemyType): number {
  if (!heroFamily) return 1.0;
  return CLAN_ENEMY_AFFINITY[heroFamily]?.[enemyType] ?? 1.0;
}

