import { describe, it, expect } from 'vitest';
import { getActiveClanSkills, getClanAffinityMultiplier } from '@/game/clanSystem';
import { Hero } from '@/game/types';

// Usine minimale de héros pour les tests
function makeHero(overrides: Partial<Hero> = {}): Hero {
  return {
    id: 'hero-test',
    name: 'Test Hero',
    rarity: 'common',
    level: 1,
    xp: 0,
    stars: 1,
    stats: { pwr: 5, spd: 5, rng: 2, bnb: 1, sta: 100, lck: 5 },
    skills: [],
    currentStamina: 100,
    maxStamina: 100,
    isActive: true,
    houseLevel: 1,
    position: { x: 0, y: 0 },
    targetPosition: null,
    path: null,
    state: 'idle',
    bombCooldown: 0,
    stuckTimer: 0,
    icon: 'blaze',
    progressionStats: {
      chestsOpened: 0,
      totalDamageDealt: 0,
      battlesPlayed: 0,
      victories: 0,
      obtainedAt: 0,
    },
    ...overrides,
  };
}

describe('getActiveClanSkills', () => {
  it('retourne un tableau vide pour un tableau de héros vide', () => {
    const result = getActiveClanSkills([]);
    expect(result).toEqual([]);
  });

  it('retourne un tableau vide pour un seul héros (minHeroes = 2)', () => {
    const hero = makeHero({ family: 'forge-guard', icon: 'flint' });
    const result = getActiveClanSkills([hero]);
    expect(result).toEqual([]);
  });

  it('active le skill de clan pour 2 héros du même clan (forge-guard)', () => {
    const hero1 = makeHero({ id: 'h1', family: 'forge-guard', icon: 'flint' });
    const hero2 = makeHero({ id: 'h2', family: 'forge-guard', icon: 'rex' });
    const result = getActiveClanSkills([hero1, hero2]);

    expect(result).toHaveLength(1);
    expect(result[0].clanId).toBe('forge-guard');
    expect(result[0].id).toBe('forge-iron-skin');
    expect(result[0].effect.type).toBe('stamina_shield');
    expect(result[0].effect.value).toBe(0.20);
  });

  it('active le skill de clan pour 2 héros ember-clan', () => {
    const hero1 = makeHero({ id: 'h1', family: 'ember-clan', icon: 'blaze' });
    const hero2 = makeHero({ id: 'h2', family: 'ember-clan', icon: 'ember' });
    const result = getActiveClanSkills([hero1, hero2]);

    expect(result).toHaveLength(1);
    expect(result[0].clanId).toBe('ember-clan');
    expect(result[0].effect.type).toBe('bomb_range');
  });

  it('active le skill pour 3 héros du même clan', () => {
    const heroes = [
      makeHero({ id: 'h1', family: 'storm-riders', icon: 'zap' }),
      makeHero({ id: 'h2', family: 'storm-riders', icon: 'zap' }),
      makeHero({ id: 'h3', family: 'storm-riders', icon: 'zap' }),
    ];
    const result = getActiveClanSkills(heroes);
    expect(result).toHaveLength(1);
    expect(result[0].clanId).toBe('storm-riders');
  });

  it('ne retourne pas de skill si les héros sont de familles différentes', () => {
    const hero1 = makeHero({ id: 'h1', family: 'ember-clan', icon: 'blaze' });
    const hero2 = makeHero({ id: 'h2', family: 'forge-guard', icon: 'flint' });
    const result = getActiveClanSkills([hero1, hero2]);
    expect(result).toEqual([]);
  });

  it('active plusieurs skills si plusieurs clans ont 2+ héros', () => {
    const heroes = [
      makeHero({ id: 'h1', family: 'ember-clan', icon: 'blaze' }),
      makeHero({ id: 'h2', family: 'ember-clan', icon: 'ember' }),
      makeHero({ id: 'h3', family: 'forge-guard', icon: 'flint' }),
      makeHero({ id: 'h4', family: 'forge-guard', icon: 'rex' }),
    ];
    const result = getActiveClanSkills(heroes);
    expect(result).toHaveLength(2);
    const clanIds = result.map(s => s.clanId);
    expect(clanIds).toContain('ember-clan');
    expect(clanIds).toContain('forge-guard');
  });

  it('utilise le fallback HERO_VISUALS si family n\'est pas défini sur le héros', () => {
    // 'blaze' mappe vers 'ember-clan' dans HERO_VISUALS
    const hero1 = makeHero({ id: 'h1', family: undefined, icon: 'blaze' });
    const hero2 = makeHero({ id: 'h2', family: undefined, icon: 'ember' });
    const result = getActiveClanSkills([hero1, hero2]);
    expect(result).toHaveLength(1);
    expect(result[0].clanId).toBe('ember-clan');
  });

  it('ignore les héros sans famille et sans icône connue', () => {
    const hero1 = makeHero({ id: 'h1', family: undefined, icon: 'unknown-icon' });
    const hero2 = makeHero({ id: 'h2', family: undefined, icon: 'unknown-icon-2' });
    const result = getActiveClanSkills([hero1, hero2]);
    expect(result).toEqual([]);
  });
});

describe('CLAN_ENEMY_AFFINITY (via getClanAffinityMultiplier)', () => {
  it('a une entrée pour ember-clan', () => {
    const multiplier = getClanAffinityMultiplier('ember-clan', 'demon');
    expect(multiplier).toBeGreaterThan(1.0);
  });

  it('a une entrée pour storm-riders', () => {
    const multiplier = getClanAffinityMultiplier('storm-riders', 'skeleton');
    expect(multiplier).toBeGreaterThan(1.0);
  });

  it('a une entrée pour forge-guard', () => {
    const multiplier = getClanAffinityMultiplier('forge-guard', 'orc');
    expect(multiplier).toBeGreaterThan(1.0);
  });

  it('a une entrée pour shadow-core', () => {
    const multiplier = getClanAffinityMultiplier('shadow-core', 'goblin');
    expect(multiplier).toBeGreaterThan(1.0);
  });

  it('a une entrée pour arcane-circuit', () => {
    const multiplier = getClanAffinityMultiplier('arcane-circuit', 'slime');
    expect(multiplier).toBeGreaterThan(1.0);
  });

  it('a une entrée pour wild-pack', () => {
    const multiplier = getClanAffinityMultiplier('wild-pack', 'goblin');
    expect(multiplier).toBeGreaterThan(1.0);
  });

  it('retourne 1.0 si la famille est undefined', () => {
    const multiplier = getClanAffinityMultiplier(undefined, 'demon');
    expect(multiplier).toBe(1.0);
  });

  it('retourne 1.0 si pas d\'affinité spécifique définie', () => {
    // ember-clan n'a pas d'affinité contre skeleton
    const multiplier = getClanAffinityMultiplier('ember-clan', 'skeleton');
    expect(multiplier).toBe(1.0);
  });
});
