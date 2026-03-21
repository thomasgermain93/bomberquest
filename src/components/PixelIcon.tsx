import React from 'react';
import {
  TreePine, Trees, Leaf, Sun, Circle, Crown, Pickaxe, Mountain, Hammer, 
  Skull, Landmark, Lock, Sword, Flame, Waves, Building, DoorOpen,
  Axe, SquareStack, HardHat, BookOpen, Lightbulb, Cross, Shield,
  Bomb, Zap, Sparkles, Star, Target, Rocket, Gamepad2, Bot,
  Cat, Bug, Bird, Dog, Gem, Coins, Package, Trophy,
  Sprout, Castle,
} from 'lucide-react';

// Map icon keys to Lucide components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  // Regions
  'forest': TreePine,
  'caves': Pickaxe,
  'ruins': Landmark,
  'fortress': Castle,
  'inferno': Flame,
  
  // Forest stages
  'leaf': Leaf,
  'sprout': Sprout,
  'sun': Sun,
  'cave': Mountain,
  'crown': Crown,
  
  // Cave stages
  'rock': Mountain,
  'hammer': Hammer,
  'coffin': Skull,
  'throne': Landmark,
  'sword': Sword,
  
  // Ruins stages
  'grave': Cross,
  'book': BookOpen,
  'skull': Skull,
  'candle': Lightbulb,
  'reaper': Skull,
  
  // Fortress stages
  'brick': SquareStack,
  'helmet': HardHat,
  'blade': Sword,
  'lock': Lock,
  'axe': Axe,
  
  // Inferno stages
  'door': DoorOpen,
  'waves': Waves,
  'tower': Building,
  'fire-crown': Crown,
  'demon': Flame,
  
  // Map configs
  'prairie': Sprout,
  'tree': TreePine,
  'mine': Pickaxe,
  'castle': Castle,
  'volcano': Flame,
  'citadel': Building,
  
  // Heroes
  'bomb': Bomb,
  'zap': Zap,
  'sparkle': Sparkles,
  'star': Star,
  'target': Target,
  'rocket': Rocket,
  'gamepad': Gamepad2,
  'bot': Bot,
  'cat': Cat,
  'bug': Bug,
  'bird': Bird,
  'dog': Dog,
  'flame': Flame,
  'crown': Crown,
  'skull': Skull,
  
  // Items
  'gem': Gem,
  'coins': Coins,
  'package': Package,
  'trophy': Trophy,
  'shield': Shield,
};

// Stage emoji → icon key mapping
export const STAGE_ICON_MAP: Record<string, string> = {
  '🌿': 'leaf', '🍃': 'sprout', '☀️': 'sun', '🕳️': 'cave', '👑': 'crown',
  '🪨': 'rock', '⚒️': 'hammer', '⚰️': 'coffin', '🏛️': 'throne', '⚔️': 'sword',
  '🪦': 'grave', '📚': 'book', '💀': 'skull', '🕯️': 'candle', '☠️': 'reaper',
  '🧱': 'brick', '🪖': 'helmet', '🗡️': 'blade', '🔒': 'lock', '🪓': 'axe',
  '🚪': 'door', '🌊': 'waves', '🗼': 'tower', '👿': 'demon',
  '🌲': 'forest', '⛏️': 'caves', '🏚️': 'ruins', '🏰': 'fortress', '🔥': 'inferno',
};

// Region id → icon key mapping
export const REGION_ICON_MAP: Record<string, string> = {
  'forest': 'forest',
  'caves': 'caves',
  'ruins': 'ruins',
  'fortress': 'fortress',
  'inferno': 'inferno',
};

// Rarity colors for hero icons
const RARITY_ICON_COLORS: Record<string, string> = {
  'common': 'hsl(var(--game-rarity-common))',
  'rare': 'hsl(var(--game-rarity-rare))',
  'super-rare': 'hsl(var(--game-rarity-super-rare))',
  'epic': 'hsl(var(--game-rarity-epic))',
  'legend': 'hsl(var(--game-rarity-legend))',
  'super-legend': 'hsl(var(--game-rarity-super-legend))',
};

interface PixelIconProps {
  icon: string;
  size?: number;
  className?: string;
  color?: string;
  rarity?: string;
}

const PixelIcon: React.FC<PixelIconProps> = ({ icon, size = 16, className = '', color, rarity }) => {
  const IconComponent = ICON_MAP[icon];
  if (!IconComponent) {
    return <Bomb size={size} className={className} />;
  }
  
  const iconColor = color || (rarity ? RARITY_ICON_COLORS[rarity] : 'currentColor');
  
  return (
    <IconComponent 
      size={size} 
      className={className}
      style={{ color: iconColor, filter: 'drop-shadow(0 0 2px currentColor)' }}
    />
  );
};

export default PixelIcon;
