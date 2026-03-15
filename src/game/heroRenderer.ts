// Pixel-art hero sprite renderer for canvas
// Each hero gets a unique look based on rarity with proper body parts

import { HeroFamilyId } from './types';
import { CLAN_VISUAL_PROFILES, HeroSkinVariant, resolveHeroVisualIdentity } from './heroVisualSystem';

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

const FAMILY_SPRITES: Record<HeroFamilyId, Partial<HeroSpriteConfig>> = {
  'ember-clan': {
    helmetColor: CLAN_VISUAL_PROFILES['ember-clan'].primary,
    visorColor: CLAN_VISUAL_PROFILES['ember-clan'].visor,
    bodyColor: CLAN_VISUAL_PROFILES['ember-clan'].secondary,
  },
  'storm-riders': {
    helmetColor: CLAN_VISUAL_PROFILES['storm-riders'].primary,
    visorColor: CLAN_VISUAL_PROFILES['storm-riders'].visor,
    bodyColor: CLAN_VISUAL_PROFILES['storm-riders'].secondary,
  },
  'forge-guard': {
    helmetColor: CLAN_VISUAL_PROFILES['forge-guard'].primary,
    visorColor: CLAN_VISUAL_PROFILES['forge-guard'].visor,
    bodyColor: CLAN_VISUAL_PROFILES['forge-guard'].secondary,
  },
  'shadow-core': {
    helmetColor: CLAN_VISUAL_PROFILES['shadow-core'].primary,
    visorColor: CLAN_VISUAL_PROFILES['shadow-core'].visor,
    bodyColor: CLAN_VISUAL_PROFILES['shadow-core'].secondary,
  },
  'arcane-circuit': {
    helmetColor: CLAN_VISUAL_PROFILES['arcane-circuit'].primary,
    visorColor: CLAN_VISUAL_PROFILES['arcane-circuit'].visor,
    bodyColor: CLAN_VISUAL_PROFILES['arcane-circuit'].secondary,
  },
  'wild-pack': {
    helmetColor: CLAN_VISUAL_PROFILES['wild-pack'].primary,
    visorColor: CLAN_VISUAL_PROFILES['wild-pack'].visor,
    bodyColor: CLAN_VISUAL_PROFILES['wild-pack'].secondary,
  },
};

interface ResolvedHeroRenderConfig {
  config: HeroSpriteConfig;
  family: HeroFamilyId;
  skin: HeroSkinVariant;
}

function getHeroSpriteConfig(rarity: string, heroId?: string, heroName?: string): ResolvedHeroRenderConfig {
  const baseConfig = RARITY_SPRITES[rarity] || RARITY_SPRITES.common;
  const identity = resolveHeroVisualIdentity(heroId, heroName);
  const familyConfig = FAMILY_SPRITES[identity.family] || {};

  let aura: string | undefined;
  if (identity.traits.aura || rarity === 'epic' || rarity === 'legend' || rarity === 'super-legend') {
    const auraColors: Record<HeroFamilyId, string> = {
      'ember-clan': 'rgba(255,100,0,0.15)',
      'storm-riders': 'rgba(50,150,255,0.15)',
      'forge-guard': 'rgba(150,150,150,0.15)',
      'shadow-core': 'rgba(100,0,150,0.15)',
      'arcane-circuit': 'rgba(0,200,150,0.15)',
      'wild-pack': 'rgba(100,200,0,0.15)',
    };
    aura = auraColors[identity.family] || baseConfig.aura;
  }

  const skinAccentByVariant: Record<HeroSkinVariant, string> = {
    classic: identity.traits.accentColor,
    scarred: shadeColor(identity.traits.accentColor, -10),
    elite: shadeColor(identity.traits.accentColor, 8),
    arcane: shadeColor(identity.traits.accentColor, 14),
  };
  const skinAccent = skinAccentByVariant[identity.skin] || identity.traits.accentColor;

  return {
    family: identity.family,
    skin: identity.skin,
    config: {
      ...baseConfig,
      ...familyConfig,
      aura,
      hasHorns: identity.traits.helmetStyle === 'horned' || baseConfig.hasHorns,
      hasCrown: identity.traits.helmetStyle === 'crowned' || baseConfig.hasCrown,
      hasWings: identity.traits.wings || baseConfig.hasWings,
      helmetColor: skinAccent || familyConfig.helmetColor || baseConfig.helmetColor,
      bodyColor: skinAccent ? shadeColor(skinAccent, -20) : familyConfig.bodyColor || baseConfig.bodyColor,
      visorColor: skinAccent ? shadeColor(skinAccent, -60) : familyConfig.visorColor || baseConfig.visorColor,
    },
  };
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function drawSkinPattern(
  ctx: CanvasRenderingContext2D,
  skin: HeroSkinVariant,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: string,
) {
  switch (skin) {
    case 'scarred':
      ctx.fillStyle = shadeColor(accent, -35);
      ctx.fillRect(x + 1, y + 2, 2, 1);
      ctx.fillRect(x + width - 4, y + height - 4, 2, 1);
      break;
    case 'elite':
      ctx.fillStyle = shadeColor(accent, 25);
      ctx.fillRect(x + 1, y + 1, width - 2, 1);
      break;
    case 'arcane':
      ctx.fillStyle = '#C8F7FF';
      ctx.fillRect(x + width / 2 - 1, y + 1, 2, height - 2);
      break;
    default:
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 1, y + 1, width - 2, 1);
  }
}

const CLAN_PORTRAIT_STYLES: Record<string, {
  helmetShape: 'rounded' | 'angular' | 'tech' | 'mask' | 'spiked';
  visorPattern: 'single' | 'dual' | 'visor' | 'none';
  shoulderPads: boolean;
  emblemPattern: 'none' | 'flame' | 'lightning' | 'shield' | 'eye' | 'circuit' | 'paw';
  accentShape: 'none' | 'stripe' | 'gem' | 'wing';
}> = {
  'ember-clan': { helmetShape: 'angular', visorPattern: 'dual', shoulderPads: true, emblemPattern: 'flame', accentShape: 'stripe' },
  'storm-riders': { helmetShape: 'angular', visorPattern: 'visor', shoulderPads: false, emblemPattern: 'lightning', accentShape: 'wing' },
  'forge-guard': { helmetShape: 'rounded', visorPattern: 'visor', shoulderPads: true, emblemPattern: 'shield', accentShape: 'gem' },
  'shadow-core': { helmetShape: 'mask', visorPattern: 'visor', shoulderPads: false, emblemPattern: 'eye', accentShape: 'none' },
  'arcane-circuit': { helmetShape: 'tech', visorPattern: 'visor', shoulderPads: false, emblemPattern: 'circuit', accentShape: 'none' },
  'wild-pack': { helmetShape: 'spiked', visorPattern: 'dual', shoulderPads: true, emblemPattern: 'paw', accentShape: 'stripe' },
};

function getClanStyle(family: HeroFamilyId) {
  return CLAN_PORTRAIT_STYLES[family] || CLAN_PORTRAIT_STYLES['ember-clan'];
}

export function drawHeroPortrait(ctx: CanvasRenderingContext2D, rarity: string, time: number = 0, heroId?: string, heroName?: string) {
  const { config, family, skin } = getHeroSpriteConfig(rarity, heroId, heroName);
  const clanStyle = getClanStyle(family);
  const shouldBlink = Math.sin(time / 2000) > 0.93;
  const cx = 20;
  const cy = 20;

  ctx.imageSmoothingEnabled = false;

  // Clan-colored aura for epic+
  if (config.aura) {
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 20);
    grad.addColorStop(0, config.aura);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 40, 40);
  }

  // Shoulder pads (forge-guard, ember-clan, wild-pack)
  if (clanStyle.shoulderPads) {
    ctx.fillStyle = config.outlineColor;
    ctx.fillRect(cx - 14, cy + 2, 5, 8);
    ctx.fillRect(cx + 9, cy + 2, 5, 8);
    ctx.fillStyle = config.helmetColor;
    ctx.fillRect(cx - 13, cy + 3, 3, 6);
    ctx.fillRect(cx + 10, cy + 3, 3, 6);
  }

  // Helmet base - different shapes per clan
  ctx.fillStyle = config.outlineColor;
  switch (clanStyle.helmetShape) {
    case 'angular':
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 2);
      ctx.lineTo(cx + 10, cy - 2);
      ctx.lineTo(cx + 8, cy + 10);
      ctx.lineTo(cx - 8, cy + 10);
      ctx.closePath();
      ctx.fill();
      break;
    case 'tech':
      ctx.fillRect(cx - 10, cy - 4, 20, 14);
      ctx.fillRect(cx - 12, cy - 2, 2, 8);
      ctx.fillRect(cx + 10, cy - 2, 2, 8);
      break;
    case 'mask':
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 11, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'spiked':
      ctx.fillRect(cx - 10, cy - 3, 20, 12);
      ctx.fillRect(cx - 12, cy - 6, 3, 5);
      ctx.fillRect(cx + 9, cy - 6, 3, 5);
      break;
    default: // rounded
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 10, 0, Math.PI * 2);
      ctx.fill();
  }

  // Helmet inner
  ctx.fillStyle = config.helmetColor;
  switch (clanStyle.helmetShape) {
    case 'angular':
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy);
      ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx + 6, cy + 8);
      ctx.lineTo(cx - 6, cy + 8);
      ctx.closePath();
      ctx.fill();
      break;
    case 'tech':
      ctx.fillRect(cx - 8, cy - 2, 16, 10);
      break;
    case 'mask':
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'spiked':
      ctx.fillRect(cx - 8, cy - 1, 16, 10);
      break;
    default:
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 8, 0, Math.PI * 2);
      ctx.fill();
  }

  drawSkinPattern(ctx, skin, cx - 8, cy - 2, 16, 10, config.helmetColor);

  // Clan emblem on helmet
  if (clanStyle.emblemPattern !== 'none') {
    ctx.fillStyle = config.beltColor;
    switch (clanStyle.emblemPattern) {
      case 'flame':
        ctx.beginPath();
        ctx.moveTo(cx, cy - 2);
        ctx.lineTo(cx - 3, cy + 2);
        ctx.lineTo(cx - 1, cy + 2);
        ctx.lineTo(cx - 2, cy + 5);
        ctx.lineTo(cx + 2, cy + 2);
        ctx.lineTo(cx + 1, cy + 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'lightning':
        ctx.beginPath();
        ctx.moveTo(cx + 2, cy - 3);
        ctx.lineTo(cx - 3, cy + 1);
        ctx.lineTo(cx, cy + 1);
        ctx.lineTo(cx - 2, cy + 5);
        ctx.lineTo(cx + 3, cy);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
        break;
      case 'shield':
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 2);
        ctx.lineTo(cx + 4, cy - 2);
        ctx.lineTo(cx + 4, cy + 3);
        ctx.lineTo(cx, cy + 5);
        ctx.lineTo(cx - 4, cy + 3);
        ctx.closePath();
        ctx.fill();
        break;
      case 'eye':
        ctx.beginPath();
        ctx.arc(cx, cy + 1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = config.visorColor;
        ctx.beginPath();
        ctx.arc(cx, cy + 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00FFCC';
        ctx.fillRect(cx - 1, cy, 2, 2);
        break;
      case 'circuit':
        ctx.fillRect(cx - 4, cy, 2, 2);
        ctx.fillRect(cx + 2, cy, 2, 2);
        ctx.fillRect(cx - 1, cy - 2, 2, 4);
        break;
      case 'paw':
        ctx.beginPath();
        ctx.arc(cx, cy + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 3, cy + 3, 2, 2);
        ctx.fillRect(cx + 1, cy + 3, 2, 2);
        break;
    }
  }

  // Visor/face - different patterns per clan
  ctx.fillStyle = config.visorColor;
  switch (clanStyle.visorPattern) {
    case 'dual':
      ctx.fillRect(cx - 6, cy + 2, 5, 5);
      ctx.fillRect(cx + 1, cy + 2, 5, 5);
      break;
    case 'visor':
      ctx.fillRect(cx - 7, cy + 2, 14, 5);
      break;
    case 'single':
      ctx.fillRect(cx - 4, cy + 2, 8, 5);
      break;
  }

  // Eyes
  if (!shouldBlink && clanStyle.visorPattern !== 'none') {
    ctx.fillStyle = '#FFFFFF';
    if (clanStyle.visorPattern === 'dual') {
      ctx.fillRect(cx - 5, cy + 3, 3, 3);
      ctx.fillRect(cx + 2, cy + 3, 3, 3);
    } else {
      ctx.fillRect(cx - 4, cy + 3, 3, 3);
      ctx.fillRect(cx + 1, cy + 3, 3, 3);
    }

    // Pupils - color based on rarity
    ctx.fillStyle = '#00FFCC';
    if (rarity === 'legend' || rarity === 'super-legend') {
      ctx.fillStyle = '#FF4444';
    } else if (rarity === 'epic') {
      ctx.fillStyle = '#FFAA00';
    }
    if (clanStyle.visorPattern === 'dual') {
      ctx.fillRect(cx - 4, cy + 4, 2, 2);
      ctx.fillRect(cx + 3, cy + 4, 2, 2);
    } else {
      ctx.fillRect(cx - 3, cy + 4, 2, 2);
      ctx.fillRect(cx + 1, cy + 4, 2, 2);
    }
  } else if (clanStyle.visorPattern !== 'none') {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    if (clanStyle.visorPattern === 'dual') {
      ctx.fillRect(cx - 5, cy + 4, 3, 1);
      ctx.fillRect(cx + 2, cy + 4, 3, 1);
    } else {
      ctx.fillRect(cx - 4, cy + 4, 3, 1);
      ctx.fillRect(cx + 1, cy + 4, 3, 1);
    }
  }

  // Horns for super-rare+
  if (config.hasHorns) {
    ctx.fillStyle = config.beltColor;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 2);
    ctx.lineTo(cx - 12, cy - 10);
    ctx.lineTo(cx - 4, cy - 3);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 2);
    ctx.lineTo(cx + 12, cy - 10);
    ctx.lineTo(cx + 4, cy - 3);
    ctx.fill();
  }

  // Crown for legend+
  if (config.hasCrown) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(cx - 8, cy - 6, 16, 3);
    ctx.fillRect(cx - 8, cy - 9, 3, 3);
    ctx.fillRect(cx - 1, cy - 10, 3, 4);
    ctx.fillRect(cx + 5, cy - 9, 3, 3);
  }

  // Clan accent shape
  if (clanStyle.accentShape === 'gem' && (config.hasCrown || config.hasHorns)) {
    ctx.fillStyle = rarity === 'legend' || rarity === 'super-legend' ? '#FF0044' : '#00CCFF';
    ctx.fillRect(cx - 1, cy - 8, 2, 2);
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
  heroName?: string,
) {
  const px = x * TILE;
  const py = y * TILE;
  const cx = px + TILE / 2;
  const { config, family, skin } = getHeroSpriteConfig(rarity, heroId, heroName);
  const clanStyle = getClanStyle(family);

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
  drawSkinPattern(ctx, skin, cx - 8, by + 13, 16, 14, config.helmetColor);
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
