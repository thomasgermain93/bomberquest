export type EnemyType = 'slime' | 'goblin' | 'skeleton' | 'orc' | 'demon' | 'zombie' | 'mage';
export type BossType = 'king-slime' | 'goblin-chief' | 'lich' | 'orc-warlord' | 'demon-lord' | 'swamp-queen' | 'archmage';

import { Rarity } from './types';

export const BOSS_LEVEL_BY_TYPE: Record<BossType, number> = {
  'king-slime': 1,
  'goblin-chief': 2,
  'lich': 3,
  'orc-warlord': 4,
  'demon-lord': 5,
  'swamp-queen': 6,
  'archmage': 7,
};

const BOSS_RARITY_REWARD: Record<number, Rarity> = {
  1: 'rare',
  2: 'super-rare',
  3: 'epic',
  4: 'legend',
  5: 'super-legend',
};

export interface Enemy {
  id: string;
  type: EnemyType;
  position: { x: number; y: number };
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  direction: { x: number; y: number };
  moveTimer: number;
  stunTimer: number;
}

interface BossPattern {
  type: 'charge' | 'summon' | 'invincible' | 'bomb-rain';
  duration: number;
  cooldown: number;
}

export interface Boss {
  id: string;
  type: BossType;
  name: string;
  position: { x: number; y: number };
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  direction: { x: number; y: number };
  moveTimer: number;
  stunTimer: number;
  invincible: boolean;
  patterns: BossPattern[];
  currentPattern: number;
  patternTimer: number;
  patternCooldownTimer: number;
  phase: number;
  minions: Enemy[];
}

export interface StoryStage {
  id: string;
  name: string;
  regionId: string;
  stageNumber: number;
  isBoss: boolean;
  width: number;
  height: number;
  blockDensity: number;
  enemies: { type: EnemyType; count: number }[];
  boss?: BossType;
  reward: number;
  xpReward: number;
  unlockLevel: number;
  icon: string;
  shardReward?: number; // Universal Shards donnés à la complétion (en plus de la récompense en coins)
}

export interface StoryRegion {
  id: string;
  name: string;
  icon: string;
  description: string;
  stages: StoryStage[];
  unlockLevel: number;
  bgColor: string;
}

export interface StoryProgress {
  completedStages: string[];
  currentRegion: string;
  bossesDefeated: string[];
  highestStage: number;
  bossFirstClearRewards: number[];
}

export const ENEMY_CONFIG: Record<EnemyType, {
  hp: number;
  speed: number;
  damage: number;
  color: string;
  bodyColor: string;
}> = {
  slime: { hp: 3, speed: 0.8, damage: 5, color: '#44CC44', bodyColor: '#33AA33' },
  goblin: { hp: 5, speed: 1.2, damage: 8, color: '#88AA33', bodyColor: '#667722' },
  skeleton: { hp: 8, speed: 1.0, damage: 12, color: '#CCCCAA', bodyColor: '#AAAA88' },
  orc: { hp: 12, speed: 0.7, damage: 18, color: '#558833', bodyColor: '#446622' },
  demon: { hp: 18, speed: 1.3, damage: 25, color: '#CC3333', bodyColor: '#AA2222' },
  zombie: { hp: 14, speed: 0.6, damage: 16, color: '#66AA44', bodyColor: '#448833' },
  mage: { hp: 16, speed: 1.1, damage: 22, color: '#8844CC', bodyColor: '#6622AA' },
};

export const BOSS_CONFIG: Record<BossType, {
  name: string;
  hp: number;
  speed: number;
  damage: number;
  color: string;
  patterns: BossPattern[];
}> = {
  'king-slime': {
    name: 'Roi Slime',
    hp: 40, speed: 0.5, damage: 10, color: '#44FF44',
    patterns: [
      { type: 'charge', duration: 2, cooldown: 5 },
      { type: 'summon', duration: 1, cooldown: 8 },
    ],
  },
  'goblin-chief': {
    name: 'Chef Gobelin',
    hp: 70, speed: 1.0, damage: 15, color: '#AACC33',
    patterns: [
      { type: 'charge', duration: 1.5, cooldown: 4 },
      { type: 'summon', duration: 1, cooldown: 6 },
      { type: 'bomb-rain', duration: 2, cooldown: 10 },
    ],
  },
  'lich': {
    name: 'Liche Noire',
    hp: 100, speed: 0.6, damage: 20, color: '#9944CC',
    patterns: [
      { type: 'invincible', duration: 3, cooldown: 8 },
      { type: 'summon', duration: 1, cooldown: 5 },
      { type: 'bomb-rain', duration: 3, cooldown: 7 },
    ],
  },
  'orc-warlord': {
    name: 'Seigneur Orc',
    hp: 150, speed: 0.9, damage: 25, color: '#558833',
    patterns: [
      { type: 'charge', duration: 2.5, cooldown: 3 },
      { type: 'invincible', duration: 2, cooldown: 10 },
      { type: 'summon', duration: 1, cooldown: 7 },
    ],
  },
  'demon-lord': {
    name: 'Seigneur Démon',
    hp: 250, speed: 1.1, damage: 35, color: '#FF2222',
    patterns: [
      { type: 'charge', duration: 2, cooldown: 3 },
      { type: 'invincible', duration: 3, cooldown: 6 },
      { type: 'summon', duration: 1, cooldown: 5 },
      { type: 'bomb-rain', duration: 3, cooldown: 8 },
    ],
  },
  'swamp-queen': {
    name: 'Reine des Marais',
    hp: 320, speed: 0.8, damage: 40, color: '#44AA22',
    patterns: [
      { type: 'summon', duration: 2, cooldown: 5 },
      { type: 'invincible', duration: 3, cooldown: 9 },
      { type: 'bomb-rain', duration: 2.5, cooldown: 7 },
      { type: 'charge', duration: 1.5, cooldown: 4 },
    ],
  },
  'archmage': {
    name: 'Archimage Corrompu',
    hp: 420, speed: 1.2, damage: 50, color: '#AA44FF',
    patterns: [
      { type: 'bomb-rain', duration: 3, cooldown: 5 },
      { type: 'invincible', duration: 4, cooldown: 8 },
      { type: 'summon', duration: 2, cooldown: 6 },
      { type: 'charge', duration: 1, cooldown: 4 },
    ],
  },
};
