import { HeroFamilyId } from './types';

export interface HeroTemplate {
  templateId: string;
  name: string;
  icon: string;   // clé valide de ICON_MAP (bomb|zap|sparkle|star|target|rocket|gamepad|bot|shield|sword|axe|flame|crown|skull|gem|bird)
  family: HeroFamilyId;
}

// 6 clans × 6 personnages = 36 templates
export const HERO_POOL: HeroTemplate[] = [
  // ember-clan (feu)
  { templateId: 'blaze', name: 'Blaze', icon: 'flame',  family: 'ember-clan' },
  { templateId: 'ember', name: 'Ember', icon: 'flame',  family: 'ember-clan' },
  { templateId: 'pyro',  name: 'Pyro',  icon: 'flame',  family: 'ember-clan' },
  { templateId: 'fuse',  name: 'Fuse',  icon: 'bomb',   family: 'ember-clan' },
  { templateId: 'blast', name: 'Blast', icon: 'rocket', family: 'ember-clan' },
  { templateId: 'sol',   name: 'Sol',   icon: 'star',   family: 'ember-clan' },
  // storm-riders (électrique)
  { templateId: 'spark', name: 'Spark', icon: 'zap',     family: 'storm-riders' },
  { templateId: 'volt',  name: 'Volt',  icon: 'zap',     family: 'storm-riders' },
  { templateId: 'storm', name: 'Storm', icon: 'sparkle', family: 'storm-riders' },
  { templateId: 'zap',   name: 'Zap',   icon: 'zap',     family: 'storm-riders' },
  { templateId: 'vega',  name: 'Vega',  icon: 'star',    family: 'storm-riders' },
  { templateId: 'dash',  name: 'Dash',  icon: 'rocket',  family: 'storm-riders' },
  // forge-guard (défense)
  { templateId: 'flint', name: 'Flint', icon: 'shield', family: 'forge-guard' },
  { templateId: 'rex',   name: 'Rex',   icon: 'sword',  family: 'forge-guard' },
  { templateId: 'atlas', name: 'Atlas', icon: 'shield', family: 'forge-guard' },
  { templateId: 'duke',  name: 'Duke',  icon: 'crown',  family: 'forge-guard' },
  { templateId: 'max',   name: 'Max',   icon: 'axe',    family: 'forge-guard' },
  { templateId: 'brick', name: 'Brick', icon: 'shield', family: 'forge-guard' },
  // shadow-core (ombre)
  { templateId: 'ash',   name: 'Ash',   icon: 'skull',   family: 'shadow-core' },
  { templateId: 'nova',  name: 'Nova',  icon: 'sparkle', family: 'shadow-core' },
  { templateId: 'echo',  name: 'Echo',  icon: 'target',  family: 'shadow-core' },
  { templateId: 'crash', name: 'Crash', icon: 'skull',   family: 'shadow-core' },
  { templateId: 'luna',  name: 'Luna',  icon: 'star',    family: 'shadow-core' },
  { templateId: 'shade', name: 'Shade', icon: 'skull',   family: 'shadow-core' },
  // arcane-circuit (tech)
  { templateId: 'pixel',  name: 'Pixel',  icon: 'gamepad', family: 'arcane-circuit' },
  { templateId: 'chip',   name: 'Chip',   icon: 'bot',     family: 'arcane-circuit' },
  { templateId: 'byte',   name: 'Byte',   icon: 'bot',     family: 'arcane-circuit' },
  { templateId: 'orion',  name: 'Orion',  icon: 'gem',     family: 'arcane-circuit' },
  { templateId: 'glitch', name: 'Glitch', icon: 'gamepad', family: 'arcane-circuit' },
  { templateId: 'rune',   name: 'Rune',   icon: 'gem',     family: 'arcane-circuit' },
  // wild-pack (rush)
  { templateId: 'boom',  name: 'Boom',  icon: 'bomb',   family: 'wild-pack' },
  { templateId: 'nitro', name: 'Nitro', icon: 'rocket', family: 'wild-pack' },
  { templateId: 'rush',  name: 'Rush',  icon: 'rocket', family: 'wild-pack' },
  { templateId: 'flash', name: 'Flash', icon: 'zap',    family: 'wild-pack' },
  { templateId: 'jet',   name: 'Jet',   icon: 'bird',   family: 'wild-pack' },
  { templateId: 'ace',   name: 'Ace',   icon: 'crown',  family: 'wild-pack' },
];
