/**
 * gameModes.ts — Types, constantes et feature flags pour les nouveaux modes de jeu.
 *
 * Mode Ascension : runs escalade avec modificateurs croissants (prototype, feature flag off).
 * Mode World Boss : event communautaire asynchrone (prototype, feature flag off).
 *
 * Issue #165
 */

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

export const GAME_MODE_FLAGS = {
  ascension: false, // prototype — désactivé en prod
  worldBoss: false, // prototype — désactivé en prod
} as const;

// ---------------------------------------------------------------------------
// Mode Ascension — types
// ---------------------------------------------------------------------------

export type AscensionModifierId =
  | 'double_explosion'
  | 'random_chests'
  | 'regen_enemies'
  | 'short_fuse'
  | 'darkness'
  | 'bombing_enemies'
  | 'trapped_chests'
  | 'double_wave'
  | 'chaos';

export interface AscensionModifier {
  id: AscensionModifierId;
  name: string;
  description: string;
}

export interface AscensionFloor {
  /** Numéro de l'étage (1–10) */
  floor: number;
  /** Nom de l'étage */
  name: string;
  /** Multiplicateur de HP des ennemis par rapport à la base */
  hpMultiplier: number;
  /** Multiplicateur de vitesse des ennemis par rapport à la base */
  speedMultiplier: number;
  /** Modificateur introduit à cet étage (null pour l'étage 1) */
  modifierId: AscensionModifierId | null;
  /** Récompense en Universal Shards pour avoir atteint cet étage */
  shardReward: number;
}

export interface AscensionRunState {
  currentFloor: number;
  activeModifiers: AscensionModifierId[];
  bestFloor: number;
}

// ---------------------------------------------------------------------------
// Mode Ascension — constantes
// ---------------------------------------------------------------------------

export const ASCENSION_MODIFIERS: AscensionModifier[] = [
  {
    id: 'double_explosion',
    name: 'Bombes double explosion',
    description: 'Chaque bombe déclenche 2 explosions successives (+0.5s entre les deux).',
  },
  {
    id: 'random_chests',
    name: 'Coffres aléatoires',
    description: 'Des coffres apparaissent à des positions aléatoires pendant le combat.',
  },
  {
    id: 'regen_enemies',
    name: 'Ennemis régénèrent',
    description: 'Les ennemis récupèrent 2% de leurs HP max par seconde.',
  },
  {
    id: 'short_fuse',
    name: 'Mèche courte',
    description: 'Le timer des bombes est réduit de 40%.',
  },
  {
    id: 'darkness',
    name: 'Obscurité partielle',
    description: 'La visibilité autour de chaque héros est limitée à 3 tuiles.',
  },
  {
    id: 'bombing_enemies',
    name: 'Ennemis poseurs',
    description: 'Les ennemis posent des bombes toutes les 5 secondes.',
  },
  {
    id: 'trapped_chests',
    name: 'Coffres piégés',
    description: "50% des coffres déclenchent une explosion à l'ouverture.",
  },
  {
    id: 'double_wave',
    name: 'Double vague',
    description: "Deux vagues d'ennemis arrivent simultanément.",
  },
  {
    id: 'chaos',
    name: 'Chaos total',
    description: 'Tous les modificateurs précédents sont actifs en même temps.',
  },
];

/**
 * 10 étages de l'Ascension.
 * HP : ×1.15^(floor-1) — Vitesse : ×1.10^(floor-1)
 */
export const ASCENSION_FLOORS: AscensionFloor[] = [
  { floor: 1,  name: 'Entrée de la Tour',   hpMultiplier: 1.00, speedMultiplier: 1.00, modifierId: null,              shardReward: 5   },
  { floor: 2,  name: 'Première Salle',      hpMultiplier: 1.15, speedMultiplier: 1.10, modifierId: 'double_explosion', shardReward: 12  },
  { floor: 3,  name: 'Couloir des Coffres', hpMultiplier: 1.32, speedMultiplier: 1.21, modifierId: 'random_chests',    shardReward: 22  },
  { floor: 4,  name: 'Sanctuaire Maudit',   hpMultiplier: 1.52, speedMultiplier: 1.33, modifierId: 'regen_enemies',    shardReward: 35  },
  { floor: 5,  name: 'Chambre de Feu',      hpMultiplier: 1.75, speedMultiplier: 1.46, modifierId: 'short_fuse',       shardReward: 55  },
  { floor: 6,  name: 'Salle des Ombres',    hpMultiplier: 2.01, speedMultiplier: 1.61, modifierId: 'darkness',         shardReward: 80  },
  { floor: 7,  name: 'Arène des Poseurs',   hpMultiplier: 2.31, speedMultiplier: 1.77, modifierId: 'bombing_enemies',  shardReward: 110 },
  { floor: 8,  name: 'Crypte des Pièges',   hpMultiplier: 2.66, speedMultiplier: 1.95, modifierId: 'trapped_chests',   shardReward: 150 },
  { floor: 9,  name: "Salle de l'Armée",    hpMultiplier: 3.06, speedMultiplier: 2.14, modifierId: 'double_wave',      shardReward: 200 },
  { floor: 10, name: 'Sommet — Le Chaos',   hpMultiplier: 3.52, speedMultiplier: 2.36, modifierId: 'chaos',            shardReward: 300 },
];

/** Retourne le modificateur correspondant à un id, ou undefined. */
export function getAscensionModifier(id: AscensionModifierId): AscensionModifier | undefined {
  return ASCENSION_MODIFIERS.find(m => m.id === id);
}

/** Retourne l'étage correspondant à un numéro (1-indexed), ou undefined. */
export function getAscensionFloor(floor: number): AscensionFloor | undefined {
  return ASCENSION_FLOORS.find(f => f.floor === floor);
}

/** Calcule la récompense totale accumulée jusqu'à un étage donné. */
export function getTotalShardRewardForFloor(floor: number): number {
  return ASCENSION_FLOORS
    .filter(f => f.floor <= floor)
    .reduce((acc, f) => acc + f.shardReward, 0);
}
