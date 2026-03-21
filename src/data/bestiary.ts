/**
 * ART PIPELINE — BomberQuest Hero Assets
 * =======================================
 *
 * Chaque héros possède un set visuel complet via le système PROCÉDURAL :
 * - heroRenderer.ts : drawHeroSprite() pour le jeu, drawHeroPortrait() pour l'UI
 * - heroVisualSystem.ts : mapping heroId → clan + skin variant + traits visuels
 * - types.ts HERO_VISUALS : 36 entrées avec accentColor, helmetStyle, etc.
 *
 * Pour ajouter des sprites PNG externes (quand un artiste fournit les assets) :
 * 1. Placer le sprite dans src/assets/sprites/heroes/{heroId}.png  (80×80, 2× scale)
 * 2. Placer le portrait dans src/assets/portraits/{heroId}.png      (40×40)
 * 3. Mettre à jour l'entrée BESTIARY_BOMBERS :
 *    assets: { spriteSheet: 'src/assets/sprites/heroes/{heroId}.png', portrait: '...', visualSource: 'sprite' }
 * 4. Le composant AssetPreview priorise automatiquement le PNG sur le procédural.
 *
 * Cascade de fallback (Bestiary.tsx AssetPreview) :
 *   PNG externe → Sprite procédural → Message d'erreur
 *
 * Statuts :
 *   'ready'   = visuel complet (procédural OU sprite PNG validé)
 *   'wip'     = sprite PNG en cours de création par l'artiste
 *   'missing' = héros sans entrée dans HERO_VISUALS (ne doit jamais arriver)
 */
import { HERO_FAMILIES, Rarity, HERO_VISUALS, HeroFamilyId, getHeroVisualTraits } from '@/game/types';
import { HERO_POOL } from '@/game/heroPool';

export type AssetStatus = 'missing' | 'wip' | 'ready';

export type BestiaryFamily = typeof HERO_FAMILIES[number] & {
  description: string;
  color: string;
  notes?: string;
};

export const CLAN_COLORS: Record<string, string> = {
  'ember-clan': '#FF6B35',
  'storm-riders': '#4CC9F0',
  'forge-guard': '#A8A8A8',
  'shadow-core': '#7B2CBF',
  'arcane-circuit': '#06D6A0',
  'wild-pack': '#70E000',
};

export const BOMBER_FAMILIES: BestiaryFamily[] = [
  { id: 'ember-clan', name: 'Clan Braise', description: 'Héros orientés feu et explosion. Synergie : Feu Perpétuel (+1 portée bombes).', color: CLAN_COLORS['ember-clan'] },
  { id: 'storm-riders', name: "Cavaliers de l'Orage", description: 'Héros rapides avec affinité électrique. Synergie : Tempo Électrique (bombes −0,3 s).', color: CLAN_COLORS['storm-riders'] },
  { id: 'forge-guard', name: 'Garde de Forge', description: 'Héros robustes axés tank et défense. Synergie : Peau de Fer (dégâts reçus −20 %).', color: CLAN_COLORS['forge-guard'] },
  { id: 'shadow-core', name: "Noyau d'Ombre", description: "Héros d'infiltration et de contrôle. Synergie : Voile Doré (+30 % pièces coffres).", color: CLAN_COLORS['shadow-core'] },
  { id: 'arcane-circuit', name: 'Circuit Arcanique', description: 'Héros techno-magiques et utilitaires. Synergie : Résonance Arcanique (20 % chaîne).', color: CLAN_COLORS['arcane-circuit'] },
  { id: 'wild-pack', name: 'Meute Sauvage', description: 'Héros agiles orientés rush et chasse. Synergie : Instinct Sauvage (vitesse +20 %).', color: CLAN_COLORS['wild-pack'] },
];

export interface BomberAssetRefs {
  iconKey?: string;
  spriteSheet?: string;
  portrait?: string;
  visualSource?: 'procedural' | 'sprite';
  visualTraits?: ReturnType<typeof getHeroVisualTraits>;
}

export interface BestiaryBomber {
  id: string;
  name: string;
  familyId: BestiaryFamily['id'];
  rarity?: Rarity;
  assetStatus: AssetStatus;
  assets: BomberAssetRefs;
  lore?: string;
  availableRarities?: Rarity[];
}

const HERO_ICON_BY_TEMPLATE = Object.fromEntries(
  HERO_POOL.map(t => [t.name.toLowerCase(), t.icon]),
);

const ALL_RARITIES: Rarity[] = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];

export const BESTIARY_BOMBERS: BestiaryBomber[] = [
  // ─── Clan Braise ──────────────────────────────────────────────────────────
  { id: 'blaze', name: 'Blaze', familyId: 'ember-clan', rarity: 'rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Guerrier de flammes, son ardeur embrase le champ de bataille.', availableRarities: ALL_RARITIES },
  { id: 'ember', name: 'Ember', familyId: 'ember-clan', rarity: 'common', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Première étincelle du clan, sa flamme grandit à chaque victoire.', availableRarities: ALL_RARITIES },
  { id: 'pyro', name: 'Pyro', familyId: 'ember-clan', rarity: 'epic', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Maître du feu contrôlé, il transforme chaque bombe en brasier.', availableRarities: ALL_RARITIES },
  { id: 'fuse', name: 'Fuse', familyId: 'ember-clan', rarity: 'super-rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: "Artificier impétueux, sa mèche ne s'éteint jamais.", availableRarities: ALL_RARITIES },
  { id: 'blast', name: 'Blast', familyId: 'ember-clan', rarity: 'legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: "L'onde de choc qu'il déclenche laisse tout derrière lui en cendres.", availableRarities: ALL_RARITIES },
  { id: 'sol', name: 'Sol', familyId: 'ember-clan', rarity: 'super-legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: "Incarnation du soleil ardent, son pouvoir brûle au-delà du visible.", availableRarities: ALL_RARITIES },
  // ─── Cavaliers de l'Orage ─────────────────────────────────────────────────
  { id: 'spark', name: 'Spark', familyId: 'storm-riders', rarity: 'common', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Éclaireur fulgurant, il frappe avant que l\'ennemi réagisse.', availableRarities: ALL_RARITIES },
  { id: 'volt', name: 'Volt', familyId: 'storm-riders', rarity: 'rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Ses bombes chargées d\'électricité paralysent autant qu\'elles détruisent.', availableRarities: ALL_RARITIES },
  { id: 'storm', name: 'Storm', familyId: 'storm-riders', rarity: 'epic', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Là où il passe, la foudre suit. Là où il frappe, rien ne résiste.', availableRarities: ALL_RARITIES },
  { id: 'zap', name: 'Zap', familyId: 'storm-riders', rarity: 'super-legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Vitesse absolue — il est déjà loin quand l\'explosion retentit.', availableRarities: ALL_RARITIES },
  { id: 'vega', name: 'Vega', familyId: 'storm-riders', rarity: 'legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Navigateur céleste, il lit les courants d\'énergie comme une carte.', availableRarities: ALL_RARITIES },
  { id: 'dash', name: 'Dash', familyId: 'storm-riders', rarity: 'common', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Toujours en mouvement, sa présence sur la carte déroute les ennemis.', availableRarities: ALL_RARITIES },
  // ─── Garde de Forge ───────────────────────────────────────────────────────
  { id: 'flint', name: 'Flint', familyId: 'forge-guard', rarity: 'common', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Forgeron endurci, sa peau d\'acier repousse les coups les plus durs.', availableRarities: ALL_RARITIES },
  { id: 'rex', name: 'Rex', familyId: 'forge-guard', rarity: 'rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Guerrier de fer, il absorbe les chocs que les autres fuient.', availableRarities: ALL_RARITIES },
  { id: 'atlas', name: 'Atlas', familyId: 'forge-guard', rarity: 'legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Il porte le poids du combat sur ses épaules sans jamais plier.', availableRarities: ALL_RARITIES },
  { id: 'duke', name: 'Duke', familyId: 'forge-guard', rarity: 'super-rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Noble des tranchées, il commande le champ de bataille par sa seule présence.', availableRarities: ALL_RARITIES },
  { id: 'max', name: 'Max', familyId: 'forge-guard', rarity: 'common', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Recrue robuste de la Forge, déjà plus résistant que la plupart.', availableRarities: ALL_RARITIES },
  { id: 'brick', name: 'Brick', familyId: 'forge-guard', rarity: 'super-legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Mur vivant — ses ennemis s\'épuisent avant de réussir à l\'ébranler.', availableRarities: ALL_RARITIES },
  // ─── Noyau d'Ombre ────────────────────────────────────────────────────────
  { id: 'ash', name: 'Ash', familyId: 'shadow-core', rarity: 'rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Spectre des ombres, il se fond dans les ténèbres sans laisser de traces.', availableRarities: ALL_RARITIES },
  { id: 'nova', name: 'Nova', familyId: 'shadow-core', rarity: 'legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Éclat obscur — son explosion de lumière noire aveugle et détruit.', availableRarities: ALL_RARITIES },
  { id: 'echo', name: 'Echo', familyId: 'shadow-core', rarity: 'super-rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Il répond à chaque attaque par un contre que l\'ennemi n\'a pas vu venir.', availableRarities: ALL_RARITIES },
  { id: 'crash', name: 'Crash', familyId: 'shadow-core', rarity: 'epic', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'L\'ombre la plus chaotique — ses bombes explosent là où on l\'attend le moins.', availableRarities: ALL_RARITIES },
  { id: 'luna', name: 'Luna', familyId: 'shadow-core', rarity: 'epic', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Enfant de la nuit, son pouvoir croît à chaque passage dans l\'obscurité.', availableRarities: ALL_RARITIES },
  { id: 'shade', name: 'Shade', familyId: 'shadow-core', rarity: 'common', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Silhouette furtive, il disparaît avant que l\'on ait pu le repérer.', availableRarities: ALL_RARITIES },
  // ─── Circuit Arcanique ────────────────────────────────────────────────────
  { id: 'pixel', name: 'Pixel', familyId: 'arcane-circuit', rarity: 'rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Techno-mage du Circuit, il recode la réalité à sa guise.', availableRarities: ALL_RARITIES },
  { id: 'chip', name: 'Chip', familyId: 'arcane-circuit', rarity: 'common', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Petit processeur, grande énergie — il optimise chaque milliseconde.', availableRarities: ALL_RARITIES },
  { id: 'byte', name: 'Byte', familyId: 'arcane-circuit', rarity: 'super-rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Maître des données, il analyse l\'ennemi avant même de poser sa première bombe.', availableRarities: ALL_RARITIES },
  { id: 'orion', name: 'Orion', familyId: 'arcane-circuit', rarity: 'legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Architecte du Circuit, ses bombes suivent des trajectoires calculées à la perfection.', availableRarities: ALL_RARITIES },
  { id: 'glitch', name: 'Glitch', familyId: 'arcane-circuit', rarity: 'epic', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Erreur devenue force — son instabilité est son arme la plus redoutable.', availableRarities: ALL_RARITIES },
  { id: 'rune', name: 'Rune', familyId: 'arcane-circuit', rarity: 'super-legend', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: "Graveur d'arcanes numériques, ses runes transcendent le code et la magie.", availableRarities: ALL_RARITIES },
  // ─── Meute Sauvage ────────────────────────────────────────────────────────
  { id: 'boom', name: 'Boom', familyId: 'wild-pack', rarity: 'common', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Toujours premier dans la mêlée, sa seule stratégie : foncer.', availableRarities: ALL_RARITIES },
  { id: 'nitro', name: 'Nitro', familyId: 'wild-pack', rarity: 'super-rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Carburant pur dans les veines — il accélère quand les autres ralentissent.', availableRarities: ALL_RARITIES },
  { id: 'rush', name: 'Rush', familyId: 'wild-pack', rarity: 'rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'La Meute compte sur lui pour ouvrir le passage en premier.', availableRarities: ALL_RARITIES },
  { id: 'flash', name: 'Flash', familyId: 'wild-pack', rarity: 'epic', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Un éclair de fourrure et d\'explosions — il traverse les lignes ennemies.', availableRarities: ALL_RARITIES },
  { id: 'jet', name: 'Jet', familyId: 'wild-pack', rarity: 'rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'Libre comme le vent, il choisit ses cibles avec instinct et sans hésitation.', availableRarities: ALL_RARITIES },
  { id: 'ace', name: 'Ace', familyId: 'wild-pack', rarity: 'super-rare', assetStatus: 'ready', assets: { visualSource: 'procedural' }, lore: 'L\'as de la Meute — il ne rate jamais son coup quand ça compte vraiment.', availableRarities: ALL_RARITIES },
].map((bomber) => ({
  ...bomber,
  assets: {
    ...bomber.assets,
    iconKey: bomber.assets.iconKey ?? HERO_ICON_BY_TEMPLATE[bomber.name.toLowerCase()] ?? 'bomb',
    visualTraits: getHeroVisualTraits(bomber.id),
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
