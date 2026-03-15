// Pixel-art hero sprite renderer for canvas
// Each hero gets a unique look based on rarity with proper body parts

import { HERO_FAMILY_MAP } from './types';

const TILE = 40;

interface HeroSpriteConfig {
  bodyColor: string;
  outlineColor: string;
  helmetColor: string;
  visorColor: string;
  beltColor: string;
  bootsColor: string;
  capeColor?: string;
  aura?: string;
  hasHorns?: boolean;
  hasCrown?: boolean;
  hasWings?: boolean;
}

const RARITY_SPRITES: Record<string, HeroSpriteConfig> = {
  common: {
    bodyColor: '#6B7B8D',
    outlineColor: '#3D4A56',
    helmetColor: '#8A9BAD',
    visorColor: '#2D3748',
    beltColor: '#5A4A3A',
    bootsColor: '#4A3A2A',
  },
  rare: {
    bodyColor: '#3B7DD8',
    outlineColor: '#1E4E8C',
    helmetColor: '#5599EE',
    visorColor: '#0D2B5C',
    beltColor: '#C8A832',
    bootsColor: '#2A4A7A',
    capeColor: '#2266BB',
  },
  'super-rare': {
    bodyColor: '#9944DD',
    outlineColor: '#5C2299',
    helmetColor: '#BB66FF',
    visorColor: '#2A0055',
    beltColor: '#FFD700',
    bootsColor: '#4A2288',
    capeColor: '#7733BB',
    hasHorns: true,
  },
  epic: {
    bodyColor: '#DD8822',
    outlineColor: '#995500',
    helmetColor: '#FFAA33',
    visorColor: '#552200',
    beltColor: '#FF4444',
    bootsColor: '#884400',
    capeColor: '#CC6600',
    hasHorns: true,
    aura: 'rgba(255,150,0,0.15)',
  },
  legend: {
    bodyColor: '#DD3333',
    outlineColor: '#881111',
    helmetColor: '#FF5555',
    visorColor: '#440000',
    beltColor: '#FFD700',
    bootsColor: '#661111',
    capeColor: '#AA1111',
    hasCrown: true,
    aura: 'rgba(255,50,50,0.2)',
  },
  'super-legend': {
    bodyColor: '#DD44DD',
    outlineColor: '#881188',
    helmetColor: '#FF66FF',
    visorColor: '#330033',
    beltColor: '#FFD700',
    bootsColor: '#662266',
    capeColor: '#BB22BB',
    hasCrown: true,
    hasWings: true,
    aura: 'rgba(255,100,255,0.25)',
  },
};

const FAMILY_SPRITES: Record<string, Partial<HeroSpriteConfig>> = {
  'ember-clan': {
    helmetColor: '#FF6B35',
    visorColor: '#8B2500',
    bodyColor: '#E85D04',
  },
  'storm-riders': {
    helmetColor: '#4CC9F0',
    visorColor: '#023E8A',
    bodyColor: '#4361EE',
  },
  'forge-guard': {
    helmetColor: '#A8A8A8',
    visorColor: '#404040',
    bodyColor: '#6C757D',
  },
  'shadow-core': {
    helmetColor: '#7B2CBF',
    visorColor: '#240046',
    bodyColor: '#5A189A',
  },
  'arcane-circuit': {
    helmetColor: '#06D6A0',
    visorColor: '#004B23',
    bodyColor: '#2EC4B6',
  },
  'wild-pack': {
    helmetColor: '#70E000',
    visorColor: '#38B000',
    bodyColor: '#9EF01A',
  },
};

const HERO_FAMILY_MAP: Record<string, string> = {
  blaze: 'ember-clan', ember: 'ember-clan', pyro: 'ember-clan', fuse: 'ember-clan', blast: 'ember-clan', sol: 'ember-clan',
  spark: 'storm-riders', volt: 'storm-riders', storm: 'storm-riders', zap: 'storm-riders', vega: 'storm-riders', dash: 'storm-riders',
  flint: 'forge-guard', rex: 'forge-guard', atlas: 'forge-guard', duke: 'forge-guard', max: 'forge-guard',
  ash: 'shadow-core', nova: 'shadow-core', echo: 'shadow-core', crash: 'shadow-core', luna: 'shadow-core',
  pixel: 'arcane-circuit', chip: 'arcane-circuit', byte: 'arcane-circuit', orion: 'arcane-circuit',
  boom: 'wild-pack', nitro: 'wild-pack', rush: 'wild-pack', flash: 'wild-pack', jet: 'wild-pack', ace: 'wild-pack',
};


function getHeroSpriteConfig(rarity: string, heroId?: string): HeroSpriteConfig {
  const baseConfig = RARITY_SPRITES[rarity] || RARITY_SPRITES.common;
  
  if (!heroId || heroId === 'bestiary-preview') {
    return baseConfig;
  }
  
  const family = HERO_FAMILY_MAP[heroId.toLowerCase()];
  const familyConfig = family ? FAMILY_SPRITES[family] : null;
  
  if (!familyConfig) {
    return baseConfig;
  }
  
  return {
    ...baseConfig,
    ...familyConfig,
  };
}

export function drawHeroPortrait(ctx: CanvasRenderingContext2D, rarity: string, time: number = 0, heroId?: string) {
  const config = getHeroSpriteConfig(rarity, heroId);
  const shouldBlink = Math.sin(time / 2000) > 0.93;

  ctx.imageSmoothingEnabled = false;

  // Aura légère pour les raretés élevées
  if (config.aura) {
    const grad = ctx.createRadialGradient(20, 20, 6, 20, 20, 18);
    grad.addColorStop(0, config.aura);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 40, 40);
  }

  // Casque
  ctx.fillStyle = config.outlineColor;
  ctx.fillRect(10, 8, 20, 16);
  ctx.fillStyle = config.helmetColor;
  ctx.fillRect(11, 9, 18, 14);

  // Crête du casque
  ctx.fillStyle = config.outlineColor;
  ctx.fillRect(19, 6, 2, 3);

  // Visière / visage
  ctx.fillStyle = config.visorColor;
  ctx.fillRect(13, 13, 14, 7);

  if (!shouldBlink) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(14, 14, 4, 4);
    ctx.fillRect(22, 14, 4, 4);

    ctx.fillStyle = '#00FFCC';
    if (rarity === 'legend' || rarity === 'super-legend') {
      ctx.fillStyle = '#FF4444';
    } else if (rarity === 'epic') {
      ctx.fillStyle = '#FFAA00';
    }
    ctx.fillRect(15, 15, 2, 2);
    ctx.fillRect(23, 15, 2, 2);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(14, 16, 4, 1);
    ctx.fillRect(22, 16, 4, 1);
  }

  // Cornes
  if (config.hasHorns) {
    ctx.fillStyle = config.beltColor;
    ctx.beginPath();
    ctx.moveTo(11, 10);
    ctx.lineTo(7, 3);
    ctx.lineTo(13, 10);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(29, 10);
    ctx.lineTo(33, 3);
    ctx.lineTo(27, 10);
    ctx.fill();
  }

  // Couronne
  if (config.hasCrown) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(12, 6, 16, 3);
    ctx.fillRect(12, 3, 2, 3);
    ctx.fillRect(19, 2, 2, 4);
    ctx.fillRect(26, 3, 2, 3);
  }
}

export function drawHeroSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rarity: string,
  state: string,
  time: number,
  heroId: string,
  stamina: number,
  maxStamina: number,
) {
  const px = x * TILE;
  const py = y * TILE;
  const cx = px + TILE / 2;
  const config = getHeroSpriteConfig(rarity);

  // Bob animation
  const isMoving = state === 'moving' || state === 'retreating';
  const bob = isMoving ? Math.sin(time / 80) * 2 : 0;
  const breathe = Math.sin(time / 600) * 0.5;

  // Aura for epic+
  if (config.aura) {
    const auraSize = 22 + Math.sin(time / 300) * 3;
    const grad = ctx.createRadialGradient(cx, py + 20 + bob, 4, cx, py + 20 + bob, auraSize);
    grad.addColorStop(0, config.aura);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, py + 20 + bob, auraSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, py + TILE - 3, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const by = py + bob; // base y with bob

  // Cape (behind body)
  if (config.capeColor) {
    ctx.fillStyle = config.capeColor;
    const capeWave = Math.sin(time / 200) * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, by + 14);
    ctx.lineTo(cx - 10 + capeWave, by + 32);
    ctx.lineTo(cx + 10 + capeWave, by + 32);
    ctx.lineTo(cx + 8, by + 14);
    ctx.fill();
    // Cape highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(cx - 6, by + 14);
    ctx.lineTo(cx - 4, by + 28);
    ctx.lineTo(cx, by + 28);
    ctx.lineTo(cx, by + 14);
    ctx.fill();
  }

  // Wings for super-legend
  if (config.hasWings) {
    const wingFlap = Math.sin(time / 150) * 4;
    ctx.fillStyle = 'rgba(255,200,255,0.4)';
    // Left wing
    ctx.beginPath();
    ctx.moveTo(cx - 8, by + 14);
    ctx.lineTo(cx - 22, by + 8 + wingFlap);
    ctx.lineTo(cx - 18, by + 22 + wingFlap);
    ctx.closePath();
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(cx + 8, by + 14);
    ctx.lineTo(cx + 22, by + 8 + wingFlap);
    ctx.lineTo(cx + 18, by + 22 + wingFlap);
    ctx.closePath();
    ctx.fill();
  }

  // Boots
  ctx.fillStyle = config.bootsColor;
  // Left boot
  ctx.fillRect(cx - 7, by + 30, 6, 5);
  ctx.fillRect(cx - 8, by + 33, 7, 2);
  // Right boot  
  ctx.fillRect(cx + 1, by + 30, 6, 5);
  ctx.fillRect(cx + 1, by + 33, 7, 2);
  // Boot highlight
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(cx - 6, by + 30, 2, 3);
  ctx.fillRect(cx + 2, by + 30, 2, 3);

  // Legs (step animation when moving)
  const legOffset = isMoving ? Math.sin(time / 100) * 2 : 0;
  ctx.fillStyle = config.outlineColor;
  ctx.fillRect(cx - 6, by + 26 - legOffset, 5, 5);
  ctx.fillRect(cx + 1, by + 26 + legOffset, 5, 5);

  // Body / armor
  ctx.fillStyle = config.outlineColor;
  ctx.fillRect(cx - 9, by + 12, 18, 16 + breathe);
  ctx.fillStyle = config.bodyColor;
  ctx.fillRect(cx - 8, by + 13, 16, 14 + breathe);
  // Chest plate highlight
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(cx - 6, by + 14, 5, 8);
  // Chest emblem
  ctx.fillStyle = config.beltColor;
  ctx.fillRect(cx - 2, by + 17, 4, 4);

  // Belt
  ctx.fillStyle = config.beltColor;
  ctx.fillRect(cx - 8, by + 25, 16, 3);
  // Belt buckle
  ctx.fillStyle = '#FFE880';
  ctx.fillRect(cx - 2, by + 25, 4, 3);

  // Arms
  const armSwing = isMoving ? Math.sin(time / 100) * 3 : 0;
  ctx.fillStyle = config.bodyColor;
  // Left arm
  ctx.fillRect(cx - 12, by + 14 + armSwing, 4, 12);
  // Right arm  
  ctx.fillRect(cx + 8, by + 14 - armSwing, 4, 12);
  // Gauntlets
  ctx.fillStyle = config.outlineColor;
  ctx.fillRect(cx - 12, by + 23 + armSwing, 4, 4);
  ctx.fillRect(cx + 8, by + 23 - armSwing, 4, 4);

  // Helmet
  ctx.fillStyle = config.outlineColor;
  ctx.fillRect(cx - 8, by + 3, 16, 12);
  ctx.fillStyle = config.helmetColor;
  ctx.fillRect(cx - 7, by + 4, 14, 10);
  // Helmet ridge
  ctx.fillStyle = config.outlineColor;
  ctx.fillRect(cx - 1, by + 2, 2, 3);

  // Visor / face
  ctx.fillStyle = config.visorColor;
  ctx.fillRect(cx - 5, by + 7, 10, 5);
  
  // Eyes in visor
  const shouldBlink = Math.sin(time / 2000 + x * 100) > 0.93;
  if (!shouldBlink) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 4, by + 8, 3, 3);
    ctx.fillRect(cx + 1, by + 8, 3, 3);
    // Pupils
    ctx.fillStyle = '#00FFCC';
    if (rarity === 'legend' || rarity === 'super-legend') {
      ctx.fillStyle = '#FF4444';
    } else if (rarity === 'epic') {
      ctx.fillStyle = '#FFAA00';
    }
    ctx.fillRect(cx - 3, by + 9, 2, 2);
    ctx.fillRect(cx + 2, by + 9, 2, 2);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(cx - 4, by + 9, 3, 1);
    ctx.fillRect(cx + 1, by + 9, 3, 1);
  }

  // Horns for super-rare+
  if (config.hasHorns) {
    ctx.fillStyle = config.beltColor;
    // Left horn
    ctx.beginPath();
    ctx.moveTo(cx - 7, by + 5);
    ctx.lineTo(cx - 11, by - 2);
    ctx.lineTo(cx - 5, by + 5);
    ctx.fill();
    // Right horn
    ctx.beginPath();
    ctx.moveTo(cx + 7, by + 5);
    ctx.lineTo(cx + 11, by - 2);
    ctx.lineTo(cx + 5, by + 5);
    ctx.fill();
  }

  // Crown for legend+
  if (config.hasCrown) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(cx - 6, by + 1, 12, 3);
    ctx.fillRect(cx - 6, by - 2, 2, 3);
    ctx.fillRect(cx - 1, by - 3, 2, 4);
    ctx.fillRect(cx + 4, by - 2, 2, 3);
    // Gems on crown
    ctx.fillStyle = '#FF0044';
    ctx.fillRect(cx - 5, by + 1, 2, 2);
    ctx.fillStyle = '#00CCFF';
    ctx.fillRect(cx + 3, by + 1, 2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 1, by - 1, 2, 2);
  }

  // Bombing state - show bomb in hand
  if (state === 'bombing') {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx + 12, by + 18, 4, 0, Math.PI * 2);
    ctx.fill();
    // Fuse spark
    if (Math.sin(time / 80) > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(cx + 13, by + 13, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Resting ZZZ
  if (state === 'resting') {
    const zzOff = Math.sin(time / 400) * 3;
    ctx.fillStyle = 'rgba(100,150,255,0.8)';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('Z', cx + 8, by + 2 + zzOff);
    ctx.font = 'bold 6px sans-serif';
    ctx.fillText('z', cx + 13, by - 2 + zzOff);
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('z', cx + 16, by - 5 + zzOff);
  }

  // Stamina bar
  const staPct = stamina / maxStamina;
  const barW = TILE - 8;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(px + 4, py - 6, barW, 5);
  const barColor = staPct > 0.5 ? '#00ee77' : staPct > 0.25 ? '#ffaa00' : '#ff3333';
  ctx.fillStyle = barColor;
  ctx.fillRect(px + 5, py - 5, (barW - 2) * staPct, 3);
  // Bar border
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px + 4, py - 6, barW, 5);
}
