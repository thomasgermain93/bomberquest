/**
 * Tests de validation du roster 6×6 (issue #162)
 *
 * Vérifie que les 36 héros (6 clans × 6) sont cohérents
 * entre HERO_NAMES, HERO_FAMILY_MAP, HERO_VISUALS et BESTIARY_BOMBERS.
 */
import { describe, it, expect } from 'vitest';
import { HERO_NAMES, HERO_FAMILY_MAP, HERO_VISUALS, HERO_FAMILIES, HERO_ICON_KEYS } from '../game/types';
import { BESTIARY_BOMBERS } from '../data/bestiary';
import { HERO_POOL } from '../game/heroPool';

const TOTAL_HEROES = 36;
const HEROES_PER_CLAN = 6;
const TOTAL_CLANS = 6;

// ─── 1. HERO_NAMES ────────────────────────────────────────────────────────────

describe('HERO_NAMES', () => {
  it(`contient exactement ${TOTAL_HEROES} héros`, () => {
    expect(HERO_NAMES).toHaveLength(TOTAL_HEROES);
  });

  it('ne contient pas de doublons', () => {
    const unique = new Set(HERO_NAMES.map(n => n.toLowerCase()));
    expect(unique.size).toBe(HERO_NAMES.length);
  });

  it('chaque nom est une chaîne non vide', () => {
    for (const name of HERO_NAMES) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

// ─── 2. HERO_FAMILY_MAP ───────────────────────────────────────────────────────

describe('HERO_FAMILY_MAP', () => {
  it(`contient exactement ${TOTAL_HEROES} entrées`, () => {
    const keys = Object.keys(HERO_FAMILY_MAP);
    expect(keys).toHaveLength(TOTAL_HEROES);
  });

  it(`chaque clan a exactement ${HEROES_PER_CLAN} héros`, () => {
    const countByClan: Record<string, number> = {};
    for (const family of Object.values(HERO_FAMILY_MAP)) {
      countByClan[family] = (countByClan[family] ?? 0) + 1;
    }

    for (const clan of HERO_FAMILIES) {
      expect(countByClan[clan.id]).toBe(HEROES_PER_CLAN);
    }
  });

  it(`contient exactement ${TOTAL_CLANS} clans distincts`, () => {
    const clans = new Set(Object.values(HERO_FAMILY_MAP));
    expect(clans.size).toBe(TOTAL_CLANS);
  });

  it('chaque héros de HERO_NAMES a une entrée dans HERO_FAMILY_MAP', () => {
    for (const name of HERO_NAMES) {
      const key = name.toLowerCase();
      expect(HERO_FAMILY_MAP).toHaveProperty(key);
    }
  });

  it('les héros de la PR #340 (Brick, Shade, Glitch, Rune) sont présents', () => {
    expect(HERO_FAMILY_MAP.brick).toBe('forge-guard');
    expect(HERO_FAMILY_MAP.shade).toBe('shadow-core');
    expect(HERO_FAMILY_MAP.glitch).toBe('arcane-circuit');
    expect(HERO_FAMILY_MAP.rune).toBe('arcane-circuit');
  });
});

// ─── 3. HERO_VISUALS ──────────────────────────────────────────────────────────

describe('HERO_VISUALS', () => {
  it(`contient exactement ${TOTAL_HEROES} entrées`, () => {
    const keys = Object.keys(HERO_VISUALS);
    expect(keys).toHaveLength(TOTAL_HEROES);
  });

  it('chaque héros de HERO_NAMES a une entrée dans HERO_VISUALS', () => {
    for (const name of HERO_NAMES) {
      const key = name.toLowerCase();
      expect(HERO_VISUALS).toHaveProperty(key);
    }
  });

  it('la famille dans HERO_VISUALS est cohérente avec HERO_FAMILY_MAP', () => {
    for (const [heroKey, visual] of Object.entries(HERO_VISUALS)) {
      const familyFromMap = HERO_FAMILY_MAP[heroKey];
      expect(familyFromMap).toBeDefined();
      expect(visual.family).toBe(familyFromMap);
    }
  });

  it('chaque entrée a des traits visuels valides', () => {
    const validHelmetStyles = ['standard', 'horned', 'crowned', 'tech', 'mask'];
    for (const [, visual] of Object.entries(HERO_VISUALS)) {
      expect(validHelmetStyles).toContain(visual.traits.helmetStyle);
      expect(typeof visual.traits.cape).toBe('boolean');
      expect(typeof visual.traits.wings).toBe('boolean');
      expect(typeof visual.traits.aura).toBe('boolean');
      expect(visual.traits.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

// ─── 4. BESTIARY_BOMBERS ──────────────────────────────────────────────────────

describe('BESTIARY_BOMBERS', () => {
  it(`contient exactement ${TOTAL_HEROES} entrées`, () => {
    expect(BESTIARY_BOMBERS).toHaveLength(TOTAL_HEROES);
  });

  it("ne contient pas de doublons d'id", () => {
    const ids = BESTIARY_BOMBERS.map(b => b.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('chaque héros de HERO_NAMES est présent dans BESTIARY_BOMBERS', () => {
    const bestiaryIds = new Set(BESTIARY_BOMBERS.map(b => b.id));
    for (const name of HERO_NAMES) {
      expect(bestiaryIds.has(name.toLowerCase())).toBe(true);
    }
  });

  it('chaque bomber a une rareté définie', () => {
    for (const bomber of BESTIARY_BOMBERS) {
      expect(bomber.rarity).toBeDefined();
    }
  });

  it('la familyId de chaque bomber correspond à HERO_FAMILY_MAP', () => {
    for (const bomber of BESTIARY_BOMBERS) {
      const expectedFamily = HERO_FAMILY_MAP[bomber.id];
      expect(expectedFamily).toBeDefined();
      expect(bomber.familyId).toBe(expectedFamily);
    }
  });
});

// ─── 5. HERO_POOL ──────────────────────────────────────────────────────────────

describe('HERO_POOL', () => {
  it(`contient exactement ${TOTAL_HEROES} templates`, () => {
    expect(HERO_POOL).toHaveLength(TOTAL_HEROES);
  });

  it("ne contient pas de doublons de templateId", () => {
    const ids = HERO_POOL.map(t => t.templateId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('chaque template a un templateId, un name, une icône et une family valides', () => {
    const validIcons = new Set(HERO_ICON_KEYS);
    for (const template of HERO_POOL) {
      expect(typeof template.templateId).toBe('string');
      expect(template.templateId.length).toBeGreaterThan(0);
      expect(typeof template.name).toBe('string');
      expect(template.name.length).toBeGreaterThan(0);
      expect(validIcons.has(template.icon)).toBe(true);
      expect(typeof template.family).toBe('string');
      expect(template.family.length).toBeGreaterThan(0);
    }
  });

  it('chaque clan a exactement 6 templates', () => {
    const countPerFamily: Record<string, number> = {};
    for (const t of HERO_POOL) {
      countPerFamily[t.family] = (countPerFamily[t.family] ?? 0) + 1;
    }
    for (const count of Object.values(countPerFamily)) {
      expect(count).toBe(6);
    }
  });
});
