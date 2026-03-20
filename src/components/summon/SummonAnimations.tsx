import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Hero, RARITY_CONFIG } from '@/game/types';
import HeroAvatar from '@/components/HeroAvatar';
import PixelIcon from '@/components/PixelIcon';

export const rarityGlows: Record<string, string> = {
  common: 'rgba(150,150,150,0.3)',
  rare: 'rgba(68,136,255,0.5)',
  'super-rare': 'rgba(170,68,255,0.5)',
  epic: 'rgba(255,136,0,0.5)',
  legend: 'rgba(255,68,68,0.6)',
  'super-legend': 'rgba(255,68,255,0.7)',
};

export const SummonParticles: React.FC<{ rarity: string }> = ({ rarity }) => {
  const colors: Record<string, string> = {
    common: '#888888',
    rare: '#4488FF',
    'super-rare': '#AA44FF',
    epic: '#FF8800',
    legend: '#FF4444',
    'super-legend': '#FF44FF',
  };
  const color = colors[rarity] || colors.common;

  const particles = Array.from({ length: 12 });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: Math.cos((i * 30 * Math.PI) / 180) * 80,
            y: Math.sin((i * 30 * Math.PI) / 180) * 80,
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeOut',
          }}
          className="absolute"
        >
          <Star size={8} fill={color} color={color} />
        </motion.div>
      ))}
    </div>
  );
};

export const SummonExplosion: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
          animate={{
            x: Math.cos((i * 45 * Math.PI) / 180) * 100,
            y: Math.sin((i * 45 * Math.PI) / 180) * 100,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute"
        >
          <Star size={12} fill="white" color="white" />
        </motion.div>
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute w-16 h-16 rounded-full bg-white"
      />
    </div>
  );
};

interface HeroRevealCardProps {
  hero: Hero;
  index: number;
  total: number;
  /** 'modal' utilise HeroAvatar (SummonModal), 'page' utilise PixelIcon (page Summon). Défaut: 'modal' */
  variant?: 'modal' | 'page';
}

export const HeroRevealCard: React.FC<HeroRevealCardProps> = ({ hero, index, total, variant = 'modal' }) => {
  const config = RARITY_CONFIG[hero.rarity];
  const avatarSize = total > 1 ? 32 : 56;

  return (
    <motion.div
      initial={{ scale: 0, rotateY: 180, opacity: 0 }}
      animate={{ scale: 1, rotateY: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: total > 1 ? Math.min(index * 0.04, 0.4) : 0 }}
      className="flex flex-col items-center"
    >
      {variant === 'modal' ? (
        <div
          className="rounded-lg p-2 mb-1 bg-card pixel-border flex items-center justify-center"
          style={{ boxShadow: `0 0 25px ${rarityGlows[hero.rarity]}`, width: avatarSize + 16, height: avatarSize + 16 }}
        >
          <HeroAvatar heroId={hero.id} heroName={hero.name} rarity={hero.rarity} size={avatarSize} />
        </div>
      ) : (
        <div
          className="rounded-lg p-3 mb-1 bg-card pixel-border"
          style={{ boxShadow: `0 0 25px ${rarityGlows[hero.rarity]}` }}
        >
          <PixelIcon icon={hero.icon} size={avatarSize} rarity={hero.rarity} />
        </div>
      )}
      <p className="font-pixel text-[8px] text-foreground truncate max-w-[70px] text-center">{hero.name}</p>
      <p
        className="font-pixel text-[7px]"
        style={{ color: `hsl(var(--game-rarity-${hero.rarity}))` }}
      >
        {config.label}
      </p>
    </motion.div>
  );
};
