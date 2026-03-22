import { describe, it, expect } from 'vitest';
import { upgradeSkillWithDuplicate, canUpgradeSkill } from '../game/upgradeSystem';
import { Hero, Rarity, Skill } from '../game/types';

// Helper pour créer un héros de test
function makeHero(id: string, name: string, rarity: Rarity, skills: Skill[] = []): Hero {
  return {
    id,
    templateId: name, // même templateId pour les doublons d'un même héros
    name: `${name} #${id}`,
    rarity,
    level: 1,
    xp: 0,
    stars: 0,
    stats: { pwr: 10, spd: 10, rng: 1, bnb: 1, sta: 100, lck: 5 },
    skills,
    currentStamina: 100,
    maxStamina: 100,
    isActive: true,
    houseLevel: 1,
    position: { x: 0, y: 0 },
    targetPosition: null,
    path: [],
    state: 'idle',
    bombCooldown: 0,
    stuckTimer: 0,
    icon: 'test',
    progressionStats: {
      chestsOpened: 0,
      totalDamageDealt: 0,
      battlesPlayed: 0,
      victories: 0,
      obtainedAt: Date.now(),
    },
  };
}

const baseSkill: Skill = {
  name: 'Flamme',
  description: 'Inflige des dégâts de feu',
  trigger: 'on_hit',
  effect: 'damage',
  skillLevel: 1,
};

describe('canUpgradeSkill', () => {
  it('échoue si le héros n\'a pas de skills', () => {
    const hero = makeHero('1', 'Blaze', 'rare');
    const result = canUpgradeSkill(hero, 0, []);
    expect(result.canUpgrade).toBe(false);
    expect(result.reason).toContain('compétences');
  });

  it('échoue si le skill est introuvable', () => {
    const hero = makeHero('1', 'Blaze', 'rare', [baseSkill]);
    const result = canUpgradeSkill(hero, 5, []);
    expect(result.canUpgrade).toBe(false);
    expect(result.reason).toBe('Compétence introuvable');
  });

  it('échoue si le niveau max est atteint (Rare = 2)', () => {
    const skill: Skill = { ...baseSkill, skillLevel: 2 };
    const hero = makeHero('1', 'Blaze', 'rare', [skill]);
    const result = canUpgradeSkill(hero, 0, []);
    expect(result.canUpgrade).toBe(false);
    expect(result.reason).toBe('Niveau maximum atteint');
  });

  it('échoue si pas assez de doublons (besoin de 1, aucun dispo)', () => {
    const hero = makeHero('1', 'Blaze', 'rare', [baseSkill]);
    const result = canUpgradeSkill(hero, 0, [hero]);
    expect(result.canUpgrade).toBe(false);
    expect(result.duplicatesNeeded).toBe(1);
  });

  it('réussit si assez de doublons', () => {
    const hero = makeHero('1', 'Blaze', 'rare', [baseSkill]);
    const duplicate = makeHero('2', 'Blaze', 'rare');
    const result = canUpgradeSkill(hero, 0, [hero, duplicate]);
    expect(result.canUpgrade).toBe(true);
    expect(result.duplicatesNeeded).toBe(1);
  });
});

describe('upgradeSkillWithDuplicate', () => {
  it('échoue si le héros est introuvable', () => {
    const result = upgradeSkillWithDuplicate([], 'nonexistent', 0);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Héros introuvable');
  });

  it('échoue si le héros n\'a pas de skills', () => {
    const hero = makeHero('1', 'Blaze', 'rare');
    const result = upgradeSkillWithDuplicate([hero], '1', 0);
    expect(result.success).toBe(false);
  });

  it('échoue si pas assez de doublons', () => {
    const hero = makeHero('1', 'Blaze', 'rare', [baseSkill]);
    const result = upgradeSkillWithDuplicate([hero], '1', 0);
    expect(result.success).toBe(false);
    expect(result.message).toContain('doublon');
  });

  it('améliore le skill au niveau 2 et consomme le doublon', () => {
    const hero = makeHero('1', 'Blaze', 'rare', [baseSkill]);
    const duplicate = makeHero('2', 'Blaze', 'rare');
    const result = upgradeSkillWithDuplicate([hero, duplicate], '1', 0);

    expect(result.success).toBe(true);
    expect(result.removedIds).toContain('2');
    expect(result.updatedHeroes).toHaveLength(1);

    const upgraded = result.updatedHeroes.find(h => h.id === '1');
    expect(upgraded?.skills[0].skillLevel).toBe(2);
  });

  it('consomme le bon nombre de doublons pour passer au niveau 3', () => {
    const skill: Skill = { ...baseSkill, skillLevel: 2 };
    // Super-rare peut aller jusqu'à 3, besoin de 2 doublons pour passer de 2→3
    const hero = makeHero('1', 'Blaze', 'super-rare', [skill]);
    const dup1 = makeHero('2', 'Blaze', 'super-rare');
    const dup2 = makeHero('3', 'Blaze', 'super-rare');
    const result = upgradeSkillWithDuplicate([hero, dup1, dup2], '1', 0);

    expect(result.success).toBe(true);
    expect(result.removedIds).toHaveLength(2);

    const upgraded = result.updatedHeroes.find(h => h.id === '1');
    expect(upgraded?.skills[0].skillLevel).toBe(3);
  });

  it('ne consomme pas les doublons verrouillés', () => {
    const hero = makeHero('1', 'Blaze', 'rare', [baseSkill]);
    const lockedDup = { ...makeHero('2', 'Blaze', 'rare'), isLocked: true };
    const result = upgradeSkillWithDuplicate([hero, lockedDup], '1', 0);

    // Le doublon est verrouillé donc on manque de doublons
    expect(result.success).toBe(false);
  });

  it('ne modifie pas les autres skills du héros', () => {
    const skill2: Skill = { name: 'Glace', description: 'Gèle', trigger: 'on_hit', effect: 'freeze', skillLevel: 1 };
    const hero = makeHero('1', 'Blaze', 'super-rare', [baseSkill, skill2]);
    const duplicate = makeHero('2', 'Blaze', 'super-rare');
    const result = upgradeSkillWithDuplicate([hero, duplicate], '1', 0);

    expect(result.success).toBe(true);
    const upgraded = result.updatedHeroes.find(h => h.id === '1');
    expect(upgraded?.skills[0].skillLevel).toBe(2); // amélioré
    expect(upgraded?.skills[1].skillLevel).toBe(1); // inchangé
  });
});
