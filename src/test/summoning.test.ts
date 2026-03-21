import { describe, it, expect } from 'vitest';
import { rollRarity, generateHero, summonHero } from '../game/summoning';
import { RARITY_CONFIG } from '../game/types';
import type { Rarity } from '../game/types';
import { HERO_POOL } from '../game/heroPool';

// Fixture de base pour les compteurs de pity
const zeroPity = { rare: 0, superRare: 0, epic: 0, legend: 0 };

// ─── rollRarity ───────────────────────────────────────────────────────────────

describe('rollRarity', () => {
  it('retourne "rare" lorsque le compteur rare atteint 10 (pity garanti)', () => {
    const pity = { ...zeroPity, rare: 10 };
    // Le pity rare déclenche minimum "rare" — mais rare < super-rare < epic < legend
    // La vérification dans rollRarity teste legend > epic > super-rare > rare
    // Ici rare = 10, les autres = 0, donc la garantie rare s'applique
    const result = rollRarity(pity);
    expect(result).toBe('rare');
  });

  it('retourne "super-rare" lorsque le compteur superRare atteint 30', () => {
    const pity = { ...zeroPity, superRare: 30 };
    const result = rollRarity(pity);
    expect(result).toBe('super-rare');
  });

  it('retourne "epic" lorsque le compteur epic atteint 50', () => {
    const pity = { ...zeroPity, epic: 50 };
    const result = rollRarity(pity);
    expect(result).toBe('epic');
  });

  it('retourne "legend" lorsque le compteur legend atteint 200', () => {
    const pity = { ...zeroPity, legend: 200 };
    const result = rollRarity(pity);
    expect(result).toBe('legend');
  });

  it('le pity legend a priorité sur les autres compteurs', () => {
    // Tous les compteurs à max en même temps — legend a la priorité (testé en premier)
    const pity = { rare: 10, superRare: 30, epic: 50, legend: 200 };
    expect(rollRarity(pity)).toBe('legend');
  });

  it('retourne une rareté valide sur un tirage sans pity', () => {
    const validRarities: Rarity[] = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];
    const result = rollRarity(zeroPity);
    expect(validRarities).toContain(result);
  });

  it('distribution approximative sur 2000 tirages — common doit être majoritaire', () => {
    const counts: Record<Rarity, number> = {
      common: 0, rare: 0, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0,
    };
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const r = rollRarity(zeroPity);
      counts[r]++;
    }
    // common = 60% théorique → doit être > 40% empiriquement
    expect(counts.common / N).toBeGreaterThan(0.40);
    // rare = 25% → doit être > 10% empiriquement
    expect(counts.rare / N).toBeGreaterThan(0.10);
    // super-rare = 10% → au moins quelques-uns
    expect(counts['super-rare']).toBeGreaterThan(0);
  });

  it('distribution respecte les taux de RARITY_CONFIG sur 5000 tirages (±15%)', () => {
    const counts: Record<Rarity, number> = {
      common: 0, rare: 0, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0,
    };
    const N = 5000;
    for (let i = 0; i < N; i++) {
      counts[rollRarity(zeroPity)]++;
    }

    // Vérifie que common (~60%) et rare (~25%) sont dans une fourchette raisonnable
    const commonRate = counts.common / N;
    const rareRate = counts.rare / N;
    expect(commonRate).toBeGreaterThan(RARITY_CONFIG.common.rate - 0.15);
    expect(commonRate).toBeLessThan(RARITY_CONFIG.common.rate + 0.15);
    expect(rareRate).toBeGreaterThan(RARITY_CONFIG.rare.rate - 0.15);
    expect(rareRate).toBeLessThan(RARITY_CONFIG.rare.rate + 0.15);
  });
});

// ─── generateHero ─────────────────────────────────────────────────────────────

describe('generateHero', () => {
  it('retourne un héros avec les champs obligatoires', () => {
    const hero = generateHero('rare');
    expect(hero).toMatchObject({
      rarity: 'rare',
      level: 1,
      xp: 0,
      stars: 0,
      isActive: true,
    });
    expect(typeof hero.id).toBe('string');
    expect(typeof hero.name).toBe('string');
    expect(hero.id.startsWith('hero_')).toBe(true);
  });

  it('les stats sont dans une fourchette ±10% des baseStats de la rareté', () => {
    const rarity: Rarity = 'epic';
    const base = RARITY_CONFIG[rarity].baseStats;
    const hero = generateHero(rarity);

    for (const key of ['pwr', 'spd', 'rng', 'bnb', 'lck'] as const) {
      const stat = hero.stats[key];
      expect(stat).toBeGreaterThanOrEqual(Math.max(1, Math.round(base[key] * 0.9)));
      expect(stat).toBeLessThanOrEqual(Math.round(base[key] * 1.1) + 1);
    }
  });

  it('le nombre de skills correspond à la config de rareté', () => {
    const rarities: Rarity[] = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];
    for (const rarity of rarities) {
      const hero = generateHero(rarity);
      expect(hero.skills).toHaveLength(RARITY_CONFIG[rarity].skills);
    }
  });

  it('currentStamina et maxStamina sont égales à sta au départ', () => {
    const hero = generateHero('super-rare');
    expect(hero.currentStamina).toBe(hero.stats.sta);
    expect(hero.maxStamina).toBe(hero.stats.sta);
  });

  it('chaque héros a un id unique', () => {
    const h1 = generateHero('common');
    const h2 = generateHero('common');
    expect(h1.id).not.toBe(h2.id);
  });
});

// ─── generateHero — pool cohérent ─────────────────────────────────────────────

describe('generateHero — pool cohérent', () => {
  it('icône et family correspondent au template', () => {
    for (let i = 0; i < 20; i++) {
      const hero = generateHero('common');
      const baseName = hero.name.split(' #')[0];
      const template = HERO_POOL.find(t => t.name === baseName);
      expect(template).toBeDefined();
      expect(hero.icon).toBe(template!.icon);
      expect(hero.family).toBe(template!.family);
    }
  });

  it('templateId est défini et correspond au pool', () => {
    const hero = generateHero('rare');
    expect(typeof hero.templateId).toBe('string');
    const template = HERO_POOL.find(t => t.templateId === hero.templateId);
    expect(template).toBeDefined();
  });

  it('le nom de base est toujours dans le pool', () => {
    const poolNames = new Set(HERO_POOL.map(t => t.name));
    for (let i = 0; i < 10; i++) {
      const hero = generateHero('super-rare');
      const baseName = hero.name.split(' #')[0];
      expect(poolNames.has(baseName)).toBe(true);
    }
  });
});

// ─── summonHero ───────────────────────────────────────────────────────────────

describe('summonHero', () => {
  it('retourne un héros et des compteurs de pity mis à jour', () => {
    const { hero, updatedPity } = summonHero(zeroPity);
    expect(hero).toBeDefined();
    expect(updatedPity).toBeDefined();
  });

  it('le héros retourné a les bons champs structurels', () => {
    const { hero } = summonHero(zeroPity);
    expect(typeof hero.id).toBe('string');
    expect(typeof hero.name).toBe('string');
    expect(typeof hero.rarity).toBe('string');
    expect(hero.stats).toBeDefined();
    expect(hero.stats.pwr).toBeGreaterThan(0);
    expect(hero.stats.spd).toBeGreaterThan(0);
    expect(hero.stats.rng).toBeGreaterThan(0);
    expect(hero.stats.sta).toBeGreaterThan(0);
  });

  it('pity rare déclenché à 10 — le tirage avec rare=10 est garanti rare ou mieux', () => {
    // rollRarity vérifie les compteurs AVANT incrément dans summonHero.
    // Pour déclencher le pity rare, le compteur doit valoir 10 au moment du roll.
    const pity = { ...zeroPity, rare: 10 };

    const { hero, updatedPity } = summonHero(pity);
    const raritiesAboveCommon: Rarity[] = ['rare', 'super-rare', 'epic', 'legend', 'super-legend'];
    expect(raritiesAboveCommon).toContain(hero.rarity);
    // Après le tirage garanti, le compteur rare doit être remis à 0
    expect(updatedPity.rare).toBe(0);
  });

  it('reset du compteur rare à 0 après un tirage rare', () => {
    // Simuler un tirage qui tombe sur rare via pity (rare = 10)
    const pity = { ...zeroPity, rare: 10 };
    const { hero, updatedPity } = summonHero(pity);
    expect(hero.rarity).toBe('rare');
    expect(updatedPity.rare).toBe(0);
  });

  it('reset du compteur superRare à 0 après un tirage super-rare', () => {
    const pity = { ...zeroPity, superRare: 30 };
    const { hero, updatedPity } = summonHero(pity);
    expect(hero.rarity).toBe('super-rare');
    expect(updatedPity.superRare).toBe(0);
    // rare est aussi reset car super-rare >= rare
    expect(updatedPity.rare).toBe(0);
  });

  it('les compteurs de pity sont incrémentés de 1 pour un tirage common', () => {
    // Pour avoir un tirage common quasi-certain, on ne peut pas contrôler Math.random
    // On teste l'incrément brut : si le résultat est common, tous les compteurs augmentent
    // On répète jusqu'à obtenir un common (max 100 essais)
    let found = false;
    for (let i = 0; i < 100; i++) {
      const pity = { rare: 0, superRare: 0, epic: 0, legend: 0 };
      const { hero, updatedPity } = summonHero(pity);
      if (hero.rarity === 'common') {
        expect(updatedPity.rare).toBe(1);
        expect(updatedPity.superRare).toBe(1);
        expect(updatedPity.epic).toBe(1);
        expect(updatedPity.legend).toBe(1);
        found = true;
        break;
      }
    }
    // Si on n'a pas eu de common en 100 essais, le test passe quand même
    // (probabilité ~(0.4)^100 de ne jamais avoir de common ≈ 0)
    if (!found) {
      console.warn('Aucun tirage common obtenu en 100 essais — test ignoré statistiquement');
    }
  });

  it('tirage x10 : 10 héros retournés avec les bons champs', () => {
    const heroes: ReturnType<typeof summonHero>['hero'][] = [];
    let pity = { ...zeroPity };

    for (let i = 0; i < 10; i++) {
      const { hero, updatedPity } = summonHero(pity);
      heroes.push(hero);
      pity = updatedPity;
    }

    expect(heroes).toHaveLength(10);

    for (const hero of heroes) {
      expect(typeof hero.id).toBe('string');
      expect(typeof hero.name).toBe('string');
      expect(typeof hero.rarity).toBe('string');
      expect(hero.stats).toBeDefined();
      expect(typeof hero.stats.pwr).toBe('number');
      expect(typeof hero.stats.spd).toBe('number');
      expect(typeof hero.stats.rng).toBe('number');
      expect(typeof hero.stats.bnb).toBe('number');
      expect(typeof hero.stats.sta).toBe('number');
      expect(typeof hero.stats.lck).toBe('number');
      expect(hero.level).toBe(1);
      expect(Array.isArray(hero.skills)).toBe(true);
    }

    // Tous les ids doivent être uniques
    const ids = new Set(heroes.map(h => h.id));
    expect(ids.size).toBe(10);
  });

  it('tirage x10 : au moins 1 rare garanti (pity rare à 9 au départ)', () => {
    // Avec rare = 9, le premier tirage est garanti rare ou mieux
    let pity = { ...zeroPity, rare: 9 };
    const heroes: Rarity[] = [];

    for (let i = 0; i < 10; i++) {
      const { hero, updatedPity } = summonHero(pity);
      heroes.push(hero.rarity);
      pity = updatedPity;
    }

    const raritiesAboveCommon: Rarity[] = ['rare', 'super-rare', 'epic', 'legend', 'super-legend'];
    const hasRareOrBetter = heroes.some(r => raritiesAboveCommon.includes(r));
    expect(hasRareOrBetter).toBe(true);
  });
});
