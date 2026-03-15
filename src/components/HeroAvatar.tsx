import React, { useRef, useEffect } from 'react';
import { drawHeroPortrait } from '@/game/heroRenderer';
import { Rarity } from '@/game/types';

interface HeroAvatarProps {
  heroId?: string;
  heroName?: string;
  rarity: Rarity;
  size?: number;
  className?: string;
  animated?: boolean;
}

const HeroAvatar: React.FC<HeroAvatarProps> = ({ 
  heroId,
  heroName,
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

    const PORTRAIT_BASE_SIZE = 40;
    const offscreen = document.createElement('canvas');
    offscreen.width = PORTRAIT_BASE_SIZE;
    offscreen.height = PORTRAIT_BASE_SIZE;
    const offscreenCtx = offscreen.getContext('2d');
    if (!offscreenCtx) return;

    const draw = (time: number) => {
      offscreenCtx.clearRect(0, 0, PORTRAIT_BASE_SIZE, PORTRAIT_BASE_SIZE);
      offscreenCtx.imageSmoothingEnabled = false;
      drawHeroPortrait(offscreenCtx, rarity, time, heroId, heroName);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        offscreen,
        0,
        0,
        PORTRAIT_BASE_SIZE,
        PORTRAIT_BASE_SIZE,
        0,
        0,
        canvas.width,
        canvas.height,
      );
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
  }, [heroId, heroName, rarity, animated]);

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
