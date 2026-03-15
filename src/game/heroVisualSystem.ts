import { HERO_FAMILIES, HERO_FAMILY_MAP, HERO_VISUALS, HeroFamilyId, HeroVisualTraits, getHeroVisualTraits } from './types';

export type HeroSkinVariant = 'classic' | 'scarred' | 'elite' | 'arcane';

export interface ClanVisualProfile {
  primary: string;
  secondary: string;
  visor: string;
  motif: 'flame' | 'lightning' | 'shield' | 'eye' | 'circuit' | 'paw';
}

export const CLAN_VISUAL_PROFILES: Record<HeroFamilyId, ClanVisualProfile> = {
  'ember-clan': { primary: '#FF6B35', secondary: '#E85D04', visor: '#8B2500', motif: 'flame' },
  'storm-riders': { primary: '#4CC9F0', secondary: '#4361EE', visor: '#023E8A', motif: 'lightning' },
  'forge-guard': { primary: '#A8A8A8', secondary: '#6C757D', visor: '#404040', motif: 'shield' },
  'shadow-core': { primary: '#7B2CBF', secondary: '#5A189A', visor: '#240046', motif: 'eye' },
  'arcane-circuit': { primary: '#06D6A0', secondary: '#2EC4B6', visor: '#004B23', motif: 'circuit' },
  'wild-pack': { primary: '#70E000', secondary: '#9EF01A', visor: '#38B000', motif: 'paw' },
};

interface HeroVisualIdentity {
  family: HeroFamilyId;
  traits: HeroVisualTraits;
  skin: HeroSkinVariant;
}

function normalizeToken(value?: string): string | undefined {
  if (!value) return undefined;
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

function resolveHeroKey(heroId?: string, heroName?: string): string | undefined {
  const normalizedId = normalizeToken(heroId);
  if (normalizedId && HERO_VISUALS[normalizedId]) return normalizedId;

  const firstWord = heroName?.split(/\s+/)[0];
  const normalizedName = normalizeToken(firstWord);
  if (normalizedName && HERO_VISUALS[normalizedName]) return normalizedName;

  return normalizedId;
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

const SKIN_VARIANTS: HeroSkinVariant[] = ['classic', 'scarred', 'elite', 'arcane'];

export function resolveHeroVisualIdentity(heroId?: string, heroName?: string): HeroVisualIdentity {
  const heroKey = resolveHeroKey(heroId, heroName);

  const baseFamily = heroKey ? HERO_FAMILY_MAP[heroKey] : undefined;
  const seed = hashSeed(`${heroId ?? 'legacy'}::${heroName ?? heroKey ?? 'unknown'}`);
  const fallbackFamily = HERO_FAMILIES[seed % HERO_FAMILIES.length]?.id ?? 'ember-clan';
  const family = (baseFamily ?? fallbackFamily) as HeroFamilyId;

  const traits = heroKey ? getHeroVisualTraits(heroKey) : { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: CLAN_VISUAL_PROFILES[family].primary };
  const skin = SKIN_VARIANTS[seed % SKIN_VARIANTS.length] ?? 'classic';

  return { family, traits, skin };
}
