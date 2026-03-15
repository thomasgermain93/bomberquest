import React, { useRef, useEffect } from 'react';
import { drawHeroPortrait } from '@/game/heroRenderer';
import { Rarity } from '@/game/types';

interface HeroAvatarProps {
  heroId?: string;
  rarity: Rarity;
  size?: number;
  className?: string;
  animated?: boolean;
}

const HeroAvatar: React.FC<HeroAvatarProps> = ({ 
  heroId, 
  rarity, 
  size = 40, 
  className = '',
  animated = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      drawHeroPortrait(ctx, rarity, time, heroId);
    };

    if (animated) {
      const animate = (time: number) => {
        draw(time);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      draw(0);
    }
  }, [heroId, rarity, animated]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default HeroAvatar;
