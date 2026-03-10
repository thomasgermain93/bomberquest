import { Enemy, Boss, ENEMY_CONFIG } from './storyTypes';

const TILE = 40;

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  if (enemy.hp <= 0) return;
  const cfg = ENEMY_CONFIG[enemy.type];
  const px = enemy.position.x * TILE;
  const py = enemy.position.y * TILE;
  const cx = px + TILE / 2;
  const cy = py + TILE / 2;
  const bob = Math.sin(time / 200 + enemy.position.x * 50) * 2;

  // Stun flash
  if (enemy.stunTimer > 0 && Math.sin(time / 50) > 0) return;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, py + TILE - 3, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (enemy.type === 'slime') {
    // Bouncy slime body
    const squish = 1 + Math.sin(time / 200) * 0.15;
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4 + bob, 12 * squish, 10 / squish, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cfg.bodyColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6 + bob, 10 * squish, 7 / squish, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(cx - 5, cy + bob, 4, 4);
    ctx.fillRect(cx + 1, cy + bob, 4, 4);
    ctx.fillStyle = '#111';
    ctx.fillRect(cx - 4, cy + 1 + bob, 2, 2);
    ctx.fillRect(cx + 2, cy + 1 + bob, 2, 2);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(cx - 6, cy - 3 + bob, 3, 3);
  } else if (enemy.type === 'goblin') {
    const by = py + bob;
    // Body
    ctx.fillStyle = cfg.color;
    ctx.fillRect(cx - 7, by + 14, 14, 14);
    ctx.fillStyle = cfg.bodyColor;
    ctx.fillRect(cx - 6, by + 15, 12, 12);
    // Head
    ctx.fillStyle = cfg.color;
    ctx.fillRect(cx - 6, by + 6, 12, 10);
    // Ears
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.moveTo(cx - 6, by + 8);
    ctx.lineTo(cx - 12, by + 4);
    ctx.lineTo(cx - 5, by + 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 6, by + 8);
    ctx.lineTo(cx + 12, by + 4);
    ctx.lineTo(cx + 5, by + 12);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#FF0';
    ctx.fillRect(cx - 4, by + 9, 3, 3);
    ctx.fillRect(cx + 1, by + 9, 3, 3);
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - 3, by + 10, 2, 2);
    ctx.fillRect(cx + 2, by + 10, 2, 2);
    // Legs
    ctx.fillStyle = cfg.bodyColor;
    ctx.fillRect(cx - 5, by + 28, 4, 5);
    ctx.fillRect(cx + 1, by + 28, 4, 5);
  } else if (enemy.type === 'skeleton') {
    const by = py + bob;
    // Skull
    ctx.fillStyle = cfg.color;
    ctx.fillRect(cx - 6, by + 5, 12, 11);
    ctx.fillRect(cx - 4, by + 16, 8, 3);
    // Eye sockets
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 5, by + 8, 4, 4);
    ctx.fillRect(cx + 1, by + 8, 4, 4);
    // Red eyes
    ctx.fillStyle = '#F44';
    ctx.fillRect(cx - 4, by + 9, 2, 2);
    ctx.fillRect(cx + 2, by + 9, 2, 2);
    // Ribcage
    ctx.fillStyle = cfg.color;
    ctx.fillRect(cx - 5, by + 19, 10, 2);
    ctx.fillRect(cx - 5, by + 22, 10, 2);
    ctx.fillRect(cx - 5, by + 25, 10, 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 3, by + 19, 2, 2);
    ctx.fillRect(cx + 1, by + 19, 2, 2);
    // Legs
    ctx.fillStyle = cfg.bodyColor;
    ctx.fillRect(cx - 4, by + 28, 3, 6);
    ctx.fillRect(cx + 1, by + 28, 3, 6);
  } else if (enemy.type === 'orc') {
    const by = py + bob;
    // Big body
    ctx.fillStyle = cfg.color;
    ctx.fillRect(cx - 9, by + 12, 18, 16);
    ctx.fillStyle = cfg.bodyColor;
    ctx.fillRect(cx - 8, by + 13, 16, 14);
    // Head
    ctx.fillStyle = cfg.color;
    ctx.fillRect(cx - 7, by + 4, 14, 10);
    // Tusks
    ctx.fillStyle = '#FFF';
    ctx.fillRect(cx - 4, by + 13, 2, 3);
    ctx.fillRect(cx + 2, by + 13, 2, 3);
    // Eyes
    ctx.fillStyle = '#F80';
    ctx.fillRect(cx - 5, by + 7, 3, 3);
    ctx.fillRect(cx + 2, by + 7, 3, 3);
    // Legs
    ctx.fillStyle = cfg.bodyColor;
    ctx.fillRect(cx - 6, by + 28, 5, 6);
    ctx.fillRect(cx + 1, by + 28, 5, 6);
  } else if (enemy.type === 'demon') {
    const by = py + bob;
    // Aura
    const auraSize = 18 + Math.sin(time / 200) * 3;
    const grad = ctx.createRadialGradient(cx, cy + bob, 4, cx, cy + bob, auraSize);
    grad.addColorStop(0, 'rgba(255,50,50,0.2)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, auraSize, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = cfg.color;
    ctx.fillRect(cx - 8, by + 12, 16, 16);
    ctx.fillStyle = cfg.bodyColor;
    ctx.fillRect(cx - 7, by + 13, 14, 14);
    // Head
    ctx.fillStyle = cfg.color;
    ctx.fillRect(cx - 6, by + 5, 12, 9);
    // Horns
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(cx - 6, by + 6);
    ctx.lineTo(cx - 10, by - 2);
    ctx.lineTo(cx - 4, by + 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 6, by + 6);
    ctx.lineTo(cx + 10, by - 2);
    ctx.lineTo(cx + 4, by + 6);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#FF0';
    ctx.fillRect(cx - 4, by + 8, 3, 3);
    ctx.fillRect(cx + 1, by + 8, 3, 3);
    // Legs
    ctx.fillStyle = cfg.bodyColor;
    ctx.fillRect(cx - 5, by + 28, 4, 6);
    ctx.fillRect(cx + 1, by + 28, 4, 6);
  }

  // HP bar
  if (enemy.hp < enemy.maxHp) {
    const barW = TILE - 8;
    const hpPct = enemy.hp / enemy.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(px + 4, py - 4, barW, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#ff4444' : '#ff0000';
    ctx.fillRect(px + 5, py - 3, (barW - 2) * hpPct, 2);
  }
}

export function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, time: number) {
  if (boss.hp <= 0) return;
  const px = boss.position.x * TILE;
  const py = boss.position.y * TILE;
  const cx = px + TILE / 2;
  const cy = py + TILE / 2;
  const bob = Math.sin(time / 250) * 3;

  // Stun flash
  if (boss.stunTimer > 0 && Math.sin(time / 40) > 0) return;

  // Big aura
  const auraSize = 28 + Math.sin(time / 200) * 5;
  const cfg = { color: '#FF4444' };
  const grad = ctx.createRadialGradient(cx, cy + bob, 6, cx, cy + bob, auraSize);
  grad.addColorStop(0, boss.invincible ? 'rgba(100,200,255,0.4)' : 'rgba(255,50,50,0.3)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy + bob, auraSize, 0, Math.PI * 2);
  ctx.fill();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, py + TILE - 2, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const by = py + bob;

  // Invincibility shield
  if (boss.invincible) {
    ctx.strokeStyle = 'rgba(100,200,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, 20, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Large body (bigger than normal enemies)
  ctx.fillStyle = '#881111';
  ctx.fillRect(cx - 12, by + 8, 24, 22);
  ctx.fillStyle = '#AA2222';
  ctx.fillRect(cx - 11, by + 9, 22, 20);

  // Head
  ctx.fillStyle = '#CC3333';
  ctx.fillRect(cx - 9, by + 1, 18, 12);
  ctx.fillStyle = '#AA2222';
  ctx.fillRect(cx - 8, by + 2, 16, 10);

  // Crown
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(cx - 8, by - 2, 16, 4);
  ctx.fillRect(cx - 8, by - 5, 3, 3);
  ctx.fillRect(cx - 1, by - 6, 3, 4);
  ctx.fillRect(cx + 5, by - 5, 3, 3);
  ctx.fillStyle = '#FF0044';
  ctx.fillRect(cx - 7, by - 1, 2, 2);
  ctx.fillStyle = '#00CCFF';
  ctx.fillRect(cx + 5, by - 1, 2, 2);

  // Eyes
  ctx.fillStyle = '#FFF';
  ctx.fillRect(cx - 6, by + 5, 5, 4);
  ctx.fillRect(cx + 1, by + 5, 5, 4);
  ctx.fillStyle = boss.phase >= 3 ? '#FF0' : '#F44';
  ctx.fillRect(cx - 5, by + 6, 3, 2);
  ctx.fillRect(cx + 2, by + 6, 3, 2);

  // Arms
  const armSwing = Math.sin(time / 120) * 4;
  ctx.fillStyle = '#AA2222';
  ctx.fillRect(cx - 16, by + 10 + armSwing, 5, 14);
  ctx.fillRect(cx + 11, by + 10 - armSwing, 5, 14);

  // Legs
  ctx.fillStyle = '#771111';
  ctx.fillRect(cx - 8, by + 30, 6, 6);
  ctx.fillRect(cx + 2, by + 30, 6, 6);

  // HP bar (bigger)
  const barW = TILE + 16;
  const hpPct = boss.hp / boss.maxHp;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(px - 8, py - 10, barW, 6);
  const hpColor = hpPct > 0.6 ? '#ff3333' : hpPct > 0.3 ? '#ff8800' : '#ff0000';
  ctx.fillStyle = hpColor;
  ctx.fillRect(px - 7, py - 9, (barW - 2) * hpPct, 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px - 8, py - 10, barW, 6);

  // Boss name
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(boss.name, cx, py - 14);
  ctx.textAlign = 'start';

  // Phase indicator
  if (boss.phase >= 2) {
    ctx.fillStyle = boss.phase >= 3 ? '#FF0000' : '#FF8800';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Phase ${boss.phase}`, cx, py - 22);
    ctx.textAlign = 'start';
  }
}
