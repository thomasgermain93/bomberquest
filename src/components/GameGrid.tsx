import React, { useRef, useEffect, useCallback } from 'react';
import { GameState } from '@/game/types';
import { drawHeroSprite } from '@/game/heroRenderer';
import { drawEnemy, drawBoss } from '@/game/enemyRenderer';

interface GameGridProps {
  gameState: GameState;
}

const TILE_SIZE = 40;

const GameGrid: React.FC<GameGridProps> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { map, heroes, bombs, explosions } = gameState;

    const w = map.width * TILE_SIZE;
    const h = map.height * TILE_SIZE;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);
    const time = Date.now();

    // Draw tiles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const tile = map.tiles[y][x];

        if (tile === 'wall') {
          ctx.fillStyle = '#2a2a4a';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#3d3d6b';
          ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 8);
          ctx.fillStyle = '#4a4a7a';
          ctx.fillRect(px + 4, py + 3, TILE_SIZE - 8, TILE_SIZE - 12);
          ctx.fillStyle = '#1a1a3a';
          ctx.fillRect(px, py + TILE_SIZE - 3, TILE_SIZE, 3);
        } else if (tile === 'block') {
          ctx.fillStyle = '#7a4a20';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#9b6230';
          ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.strokeStyle = '#5a3210';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 2, py + TILE_SIZE / 2);
          ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE / 2);
          ctx.moveTo(px + TILE_SIZE / 2, py + 2);
          ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE / 2);
          ctx.moveTo(px + TILE_SIZE / 4, py + TILE_SIZE / 2);
          ctx.lineTo(px + TILE_SIZE / 4, py + TILE_SIZE - 2);
          ctx.moveTo(px + TILE_SIZE * 3 / 4, py + TILE_SIZE / 2);
          ctx.lineTo(px + TILE_SIZE * 3 / 4, py + TILE_SIZE - 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, 3);
        } else {
          const isDark = (x + y) % 2 === 0;
          ctx.fillStyle = isDark ? '#141428' : '#181832';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = 'rgba(255,255,255,0.015)';
          ctx.fillRect(px + TILE_SIZE / 2 - 1, py + 4, 2, TILE_SIZE - 8);
          ctx.fillRect(px + 4, py + TILE_SIZE / 2 - 1, TILE_SIZE - 8, 2);
        }
      }
    }

    // Draw chests
    for (const chest of map.chests) {
      if (chest.hp <= 0) continue;
      const px = chest.position.x * TILE_SIZE;
      const py = chest.position.y * TILE_SIZE;

      const colors: Record<string, { body: string; lid: string; lock: string }> = {
        wood: { body: '#8B6914', lid: '#A07828', lock: '#C8A832' },
        silver: { body: '#888', lid: '#AAA', lock: '#DDD' },
        gold: { body: '#D4A017', lid: '#FFD700', lock: '#FFF8DC' },
        crystal: { body: '#00868B', lid: '#00CED1', lock: '#E0FFFF' },
        legendary: { body: '#6B1FAF', lid: '#9B30FF', lock: '#E6C3FF' },
      };
      const c = colors[chest.tier] || colors.wood;

      ctx.fillStyle = c.body;
      ctx.fillRect(px + 6, py + 12, TILE_SIZE - 12, TILE_SIZE - 16);
      ctx.fillStyle = c.lid;
      ctx.fillRect(px + 5, py + 8, TILE_SIZE - 10, 8);
      ctx.fillStyle = c.lock;
      ctx.fillRect(px + TILE_SIZE / 2 - 3, py + 14, 6, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(px + 7, py + 9, 6, 3);

      // HP bar
      const hpPct = chest.hp / chest.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(px + 6, py + 2, TILE_SIZE - 12, 4);
      ctx.fillStyle = hpPct > 0.5 ? '#00ee77' : '#ff8800';
      ctx.fillRect(px + 6, py + 2, (TILE_SIZE - 12) * hpPct, 4);
    }

    // Draw explosions
    for (const exp of explosions) {
      const alpha = Math.min(1, exp.timer * 3);
      for (const tile of exp.tiles) {
        const px = tile.x * TILE_SIZE;
        const py = tile.y * TILE_SIZE;
        const grad = ctx.createRadialGradient(
          px + TILE_SIZE / 2, py + TILE_SIZE / 2, 0,
          px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.6
        );
        grad.addColorStop(0, `rgba(255, 255, 220, ${alpha})`);
        grad.addColorStop(0.3, `rgba(255, 180, 0, ${alpha * 0.9})`);
        grad.addColorStop(0.7, `rgba(255, 80, 0, ${alpha * 0.6})`);
        grad.addColorStop(1, `rgba(200, 30, 0, ${alpha * 0.2})`);
        ctx.fillStyle = grad;
        ctx.fillRect(px - 2, py - 2, TILE_SIZE + 4, TILE_SIZE + 4);
      }
    }

    // Draw bombs
    for (const bomb of bombs) {
      const px = bomb.position.x * TILE_SIZE;
      const py = bomb.position.y * TILE_SIZE;
      const pulse = 1 + Math.sin(time / 120) * 0.12;
      const r = (TILE_SIZE * 0.32) * pulse;
      const cx = px + TILE_SIZE / 2;
      const cy = py + TILE_SIZE / 2 + 2;

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.7, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx + 5, cy - r - 6, cx + 3, cy - r - 10);
      ctx.stroke();

      if (Math.sin(time / 80) > -0.3) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cx + 3, cy - r - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx + 3, cy - r - 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw heroes with full pixel-art sprites
    for (const hero of heroes) {
      if (hero.state === 'resting') continue;
      drawHeroSprite(
        ctx,
        hero.position.x,
        hero.position.y,
        hero.rarity,
        hero.state,
        time,
        hero.id,
        hero.currentStamina,
        hero.maxStamina,
      );
    }

    // Draw enemies (story mode)
    if (gameState.enemies) {
      for (const enemy of gameState.enemies) {
        if (enemy.hp > 0) drawEnemy(ctx, enemy, time);
      }
    }

    // Draw boss (story mode)
    if (gameState.boss && gameState.boss.hp > 0) {
      drawBoss(ctx, gameState.boss, time);
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [gameState]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-full overflow-hidden rounded-lg"
      style={{ 
        backgroundColor: 'hsl(var(--game-bg-deep))',
        border: '3px solid hsl(230, 20%, 22%)',
        boxShadow: '0 0 30px rgba(0,0,0,0.5),inset 0 0 20px rgba(0,0,0,0.3)',
        aspectRatio: gameState ? `${gameState.map.width} / ${gameState.map.height}` : '13/9'
      }}
    >
      {/* Background pattern for empty space */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(335deg, rgba(60,60,100,0.3) 23px, transparent 23px),
          linear-gradient(155deg, rgba(80,80,120,0.3) 23px, transparent 23px),
          linear-gradient(335deg, rgba(60,60,100,0.3) 23px, transparent 23px),
          linear-gradient(155deg, rgba(80,80,120,0.3) 23px, transparent 23px)
        `,
        backgroundSize: '58px 58px',
        backgroundPosition: '0 0, 4px 29px, 29px 4px, 33px 33px'
      }} />
      
      {/* Canvas container with responsive scaling */}
      <div className="absolute inset-0 flex items-center justify-center p-1.5">
        <canvas
          ref={canvasRef}
          style={{ 
            imageRendering: 'pixelated',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto'
          }}
          className="block rounded"
        />
      </div>
    </div>
  );
};

export default GameGrid;
