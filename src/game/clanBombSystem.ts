import { HeroFamilyId } from './types';

export interface ClanBombStyle {
  bodyColor: string;      // Couleur principale de la bombe
  highlightColor: string; // Reflet/highlight
  fuseColor: string;      // Couleur de la mèche
  flameColor: string;     // Couleur de la flamme
  glowColor: string;      // Couleur du halo (rgba)
  shadowColor: string;    // Couleur de l'ombre
}

export const CLAN_BOMB_STYLES: Record<HeroFamilyId, ClanBombStyle> = {
  'ember-clan': {
    bodyColor: '#8B1A1A',        // Rouge foncé braise
    highlightColor: 'rgba(255,100,50,0.3)',
    fuseColor: '#FF4500',        // Orange-rouge
    flameColor: '#FF6B1A',
    glowColor: 'rgba(255,80,0,0.25)',
    shadowColor: 'rgba(139,26,26,0.5)',
  },
  'storm-riders': {
    bodyColor: '#1A2B5E',        // Bleu électrique foncé
    highlightColor: 'rgba(100,180,255,0.3)',
    fuseColor: '#00BFFF',        // Cyan électrique
    flameColor: '#7DF9FF',
    glowColor: 'rgba(0,191,255,0.25)',
    shadowColor: 'rgba(26,43,94,0.5)',
  },
  'forge-guard': {
    bodyColor: '#3D2B1A',        // Marron métal foncé
    highlightColor: 'rgba(200,140,60,0.3)',
    fuseColor: '#CD7F32',        // Bronze
    flameColor: '#FFD700',
    glowColor: 'rgba(205,127,50,0.25)',
    shadowColor: 'rgba(61,43,26,0.5)',
  },
  'shadow-core': {
    bodyColor: '#1A0A2E',        // Violet sombre
    highlightColor: 'rgba(180,100,255,0.3)',
    fuseColor: '#8A2BE2',        // Violet
    flameColor: '#DA70D6',
    glowColor: 'rgba(138,43,226,0.25)',
    shadowColor: 'rgba(26,10,46,0.5)',
  },
  'arcane-circuit': {
    bodyColor: '#0A2E2E',        // Teal sombre
    highlightColor: 'rgba(0,255,200,0.3)',
    fuseColor: '#00CED1',        // Turquoise
    flameColor: '#40E0D0',
    glowColor: 'rgba(0,206,209,0.25)',
    shadowColor: 'rgba(10,46,46,0.5)',
  },
  'wild-pack': {
    bodyColor: '#1A3A0A',        // Vert forêt
    highlightColor: 'rgba(100,200,50,0.3)',
    fuseColor: '#6B8E23',        // Vert olive
    flameColor: '#ADFF2F',
    glowColor: 'rgba(107,142,35,0.25)',
    shadowColor: 'rgba(26,58,10,0.5)',
  },
};

// Style par défaut si pas de clan
export const DEFAULT_BOMB_STYLE: ClanBombStyle = {
  bodyColor: '#222222',
  highlightColor: 'rgba(255,255,255,0.15)',
  fuseColor: '#ff8c00',
  flameColor: '#FFD700',
  glowColor: 'rgba(255,140,0,0)',
  shadowColor: 'rgba(0,0,0,0.4)',
};

export function getBombStyle(family?: HeroFamilyId): ClanBombStyle {
  if (!family) return DEFAULT_BOMB_STYLE;
  return CLAN_BOMB_STYLES[family] || DEFAULT_BOMB_STYLE;
}

// ─── Effets élémentaires d'explosion ───────────────────────────────────────

export interface ClanExplosionEffect {
  type: 'burn' | 'chain_arc' | 'shockwave' | 'void_drain' | 'mana_pulse' | 'vine_snare' | 'none';
  color: string;       // Couleur principale des particules d'effet
  description: string; // Description pour tooltip
  duration: number;    // Durée de l'effet visuel (ms)
}

export const CLAN_EXPLOSION_EFFECTS: Record<HeroFamilyId, ClanExplosionEffect> = {
  'ember-clan': {
    type: 'burn',
    color: '#FF4500',
    description: 'Brûlure : les ennemis dans la zone subissent des dégâts continus',
    duration: 800,
  },
  'storm-riders': {
    type: 'chain_arc',
    color: '#00BFFF',
    description: 'Arc électrique : se propage à un ennemi adjacent',
    duration: 600,
  },
  'forge-guard': {
    type: 'shockwave',
    color: '#CD7F32',
    description: 'Onde de choc : repousse légèrement les ennemis proches',
    duration: 500,
  },
  'shadow-core': {
    type: 'void_drain',
    color: '#8A2BE2',
    description: "Vol de vie : récupère un peu de stamina par ennemi touché",
    duration: 700,
  },
  'arcane-circuit': {
    type: 'mana_pulse',
    color: '#00CED1',
    description: 'Pulse arcanique : réduit le cooldown de bombe',
    duration: 600,
  },
  'wild-pack': {
    type: 'vine_snare',
    color: '#6B8E23',
    description: 'Entrave : ralentit les ennemis dans la zone',
    duration: 900,
  },
};

export function getExplosionEffect(family?: HeroFamilyId): ClanExplosionEffect | null {
  if (!family) return null;
  return CLAN_EXPLOSION_EFFECTS[family] || null;
}
