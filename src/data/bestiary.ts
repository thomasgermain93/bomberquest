import { HERO_ICON_KEYS, HERO_NAMES, Rarity } from '@/game/types';

export type AssetStatus = 'missing' | 'wip' | 'ready';

export interface BestiaryFamily {
  id: string;
  name: string;
  description: string;
  notes?: string;
}

export interface BomberAssetRefs {
  iconKey?: string;
  spriteSheet?: string;
  portrait?: string;
}

export interface BestiaryBomber {
  id: string;
  name: string;
  familyId: BestiaryFamily['id'];
  rarity?: Rarity;
  assetStatus: AssetStatus;
  assets: BomberAssetRefs;
}

export const BOMBER_FAMILIES: BestiaryFamily[] = [
  { id: 'ember-clan', name: 'Clan Braise', description: 'Héros orientés feu et explosion.' },
  { id: 'storm-riders', name: "Cavaliers de l'Orage", description: 'Héros rapides avec affinité électrique.' },
  { id: 'forge-guard', name: 'Garde de Forge', description: 'Héros robustes axés tank et défense.' },
  { id: 'shadow-core', name: "Noyau d'Ombre", description: "Héros d'infiltration et de contrôle." },
  { id: 'arcane-circuit', name: 'Circuit Arcanique', description: 'Héros techno-magiques et utilitaires.' },
  { id: 'wild-pack', name: 'Meute Sauvage', description: 'Héros agiles orientés rush et chasse.' },
];

const HERO_ICON_BY_NAME = Object.fromEntries(
  HERO_NAMES.map((heroName, index) => [heroName.toLowerCase(), HERO_ICON_KEYS[index % HERO_ICON_KEYS.length]]),
);

export const BESTIARY_BOMBERS: BestiaryBomber[] = [
  { id: 'blaze', name: 'Blaze', familyId: 'ember-clan', rarity: 'rare', assetStatus: 'ready', assets: {} },
  { id: 'ember', name: 'Ember', familyId: 'ember-clan', rarity: 'common', assetStatus: 'wip', assets: {} },
  { id: 'pyro', name: 'Pyro', familyId: 'ember-clan', rarity: 'epic', assetStatus: 'missing', assets: {} },
  { id: 'fuse', name: 'Fuse', familyId: 'ember-clan', rarity: 'super-rare', assetStatus: 'missing', assets: {} },
  { id: 'spark', name: 'Spark', familyId: 'storm-riders', rarity: 'common', assetStatus: 'ready', assets: {} },
  { id: 'volt', name: 'Volt', familyId: 'storm-riders', rarity: 'rare', assetStatus: 'wip', assets: {} },
  { id: 'storm', name: 'Storm', familyId: 'storm-riders', rarity: 'epic', assetStatus: 'missing', assets: {} },
  { id: 'zap', name: 'Zap', familyId: 'storm-riders', rarity: 'super-legend', assetStatus: 'missing', assets: {} },
  { id: 'flint', name: 'Flint', familyId: 'forge-guard', rarity: 'common', assetStatus: 'wip', assets: { spriteSheet: 'src/assets/sprites/heroes/flint.png', portrait: 'src/assets/portraits/flint.png' } },
  { id: 'rex', name: 'Rex', familyId: 'forge-guard', rarity: 'rare', assetStatus: 'missing', assets: {} },
  { id: 'atlas', name: 'Atlas', familyId: 'forge-guard', rarity: 'legend', assetStatus: 'missing', assets: {} },
  { id: 'duke', name: 'Duke', familyId: 'forge-guard', rarity: 'super-rare', assetStatus: 'missing', assets: {} },
  { id: 'ash', name: 'Ash', familyId: 'shadow-core', rarity: 'rare', assetStatus: 'wip', assets: {} },
  { id: 'nova', name: 'Nova', familyId: 'shadow-core', rarity: 'legend', assetStatus: 'ready', assets: {} },
  { id: 'echo', name: 'Echo', familyId: 'shadow-core', rarity: 'super-rare', assetStatus: 'missing', assets: {} },
  { id: 'crash', name: 'Crash', familyId: 'shadow-core', rarity: 'epic', assetStatus: 'missing', assets: {} },
  { id: 'pixel', name: 'Pixel', familyId: 'arcane-circuit', rarity: 'rare', assetStatus: 'wip', assets: { spriteSheet: 'src/assets/sprites/heroes/pixel.png' } },
  { id: 'chip', name: 'Chip', familyId: 'arcane-circuit', rarity: 'common', assetStatus: 'missing', assets: {} },
  { id: 'byte', name: 'Byte', familyId: 'arcane-circuit', rarity: 'super-rare', assetStatus: 'missing', assets: {} },
  { id: 'orion', name: 'Orion', familyId: 'arcane-circuit', rarity: 'legend', assetStatus: 'missing', assets: {} },
  { id: 'boom', name: 'Boom', familyId: 'wild-pack', rarity: 'common', assetStatus: 'ready', assets: {} },
  { id: 'nitro', name: 'Nitro', familyId: 'wild-pack', rarity: 'super-rare', assetStatus: 'missing', assets: {} },
  { id: 'rush', name: 'Rush', familyId: 'wild-pack', rarity: 'rare', assetStatus: 'missing', assets: {} },
  { id: 'flash', name: 'Flash', familyId: 'wild-pack', rarity: 'epic', assetStatus: 'missing', assets: {} },
  { id: 'blast', name: 'Blast', familyId: 'ember-clan', rarity: 'legend', assetStatus: 'missing', assets: {} },
  { id: 'luna', name: 'Luna', familyId: 'shadow-core', rarity: 'epic', assetStatus: 'missing', assets: {} },
  { id: 'sol', name: 'Sol', familyId: 'ember-clan', rarity: 'super-legend', assetStatus: 'missing', assets: {} },
  { id: 'vega', name: 'Vega', familyId: 'storm-riders', rarity: 'legend', assetStatus: 'missing', assets: {} },
  { id: 'jet', name: 'Jet', familyId: 'wild-pack', rarity: 'rare', assetStatus: 'missing', assets: {} },
  { id: 'max', name: 'Max', familyId: 'forge-guard', rarity: 'common', assetStatus: 'missing', assets: {} },
  { id: 'ace', name: 'Ace', familyId: 'wild-pack', rarity: 'super-rare', assetStatus: 'missing', assets: {} },
  { id: 'dash', name: 'Dash', familyId: 'storm-riders', rarity: 'common', assetStatus: 'missing', assets: {} },
].map((bomber) => ({
  ...bomber,
  assets: {
    ...bomber.assets,
    iconKey: bomber.assets.iconKey ?? HERO_ICON_BY_NAME[bomber.name.toLowerCase()],
  },
}));

export const BESTIARY_BY_FAMILY = BOMBER_FAMILIES.map((family) => ({
  family,
  bombers: BESTIARY_BOMBERS.filter((bomber) => bomber.familyId === family.id),
}));

export const BESTIARY_STATUS_LABELS: Record<AssetStatus, string> = {
  missing: 'Manquant',
  wip: 'En cours',
  ready: 'Prêt',
};
