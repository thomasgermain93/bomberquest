import { GameMap, Bomb, HeroFamilyId } from './types';
import { Enemy, Boss, ENEMY_CONFIG, BOSS_CONFIG, BossType, EnemyType } from './storyTypes';
import { getExplosionTiles, findPath } from './engine';
import { getClanAffinityMultiplier } from './clanSystem';

let enemyIdCounter = 1000;
const genEnemyId = () => `enemy_${enemyIdCounter++}`;

const ENEMY_MOVE_TIMER_MIN = 1;   // secondes minimum entre deux déplacements
const ENEMY_MOVE_TIMER_RANGE = 2; // variation aléatoire du timer de déplacement
const SNAP_TO_GRID_THRESHOLD = 0.02; // distance en tiles sous laquelle on snape à la grille
const STUN_DURATION = 0.5;        // secondes de stun par hit

export function spawnEnemy(type: EnemyType, pos: { x: number; y: number }): Enemy {
  const cfg = ENEMY_CONFIG[type];
  return {
    id: genEnemyId(),
    type,
    position: { ...pos },
    hp: cfg.hp,
    maxHp: cfg.hp,
    speed: cfg.speed,
    damage: cfg.damage,
    direction: { x: 0, y: 0 },
    moveTimer: Math.random() * 2,
    stunTimer: 0,
  };
}

export function spawnBoss(type: BossType, pos: { x: number; y: number }): Boss {
  const cfg = BOSS_CONFIG[type];
  return {
    id: genEnemyId(),
    type,
    name: cfg.name,
    position: { ...pos },
    hp: cfg.hp,
    maxHp: cfg.hp,
    speed: cfg.speed,
    damage: cfg.damage,
    direction: { x: 0, y: 0 },
    moveTimer: 0,
    stunTimer: 0,
    invincible: false,
    patterns: cfg.patterns,
    currentPattern: -1,
    patternTimer: 0,
    patternCooldownTimer: 3, // initial delay
    phase: 1,
    minions: [],
  };
}

const DIRS = [
  { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
];

function canWalk(map: GameMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  return map.tiles[y][x] === 'floor';
}

function canMoveToPosition(map: GameMap, fromX: number, fromY: number, toX: number, toY: number): boolean {
  const minX = Math.floor(Math.min(fromX, toX));
  const maxX = Math.ceil(Math.max(fromX, toX));
  const minY = Math.floor(Math.min(fromY, toY));
  const maxY = Math.ceil(Math.max(fromY, toY));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!canWalk(map, x, y)) return false;
    }
  }
  return true;
}

function clampPosition(pos: { x: number; y: number }, map: GameMap): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(map.width - 1, pos.x)),
    y: Math.max(0, Math.min(map.height - 1, pos.y)),
  };
}

function findNearestFloorTile(
  position: { x: number; y: number },
  map: GameMap
): { x: number; y: number } | null {
  const floorTiles: { x: number; y: number }[] = [];
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      if (map.tiles[y][x] === 'floor') {
        floorTiles.push({ x, y });
      }
    }
  }
  if (floorTiles.length === 0) return null;
  return floorTiles.reduce((a, b) => {
    const da = Math.abs(a.x - position.x) + Math.abs(a.y - position.y);
    const db = Math.abs(b.x - position.x) + Math.abs(b.y - position.y);
    return da < db ? a : b;
  });
}

export function tickEnemies(
  enemies: Enemy[],
  map: GameMap,
  dt: number,
  heroPositions: { x: number; y: number }[]
): Enemy[] {
  return enemies.filter(e => e.hp > 0).map(enemy => {
    const e = { ...enemy, position: { ...enemy.position } };

    // Clamp position to valid bounds to prevent drifting outside grid
    e.position = clampPosition(e.position, map);

    // Verify current tile is walkable, otherwise respawn on nearest floor
    const ex = Math.round(e.position.x);
    const ey = Math.round(e.position.y);
    if (!canWalk(map, ex, ey)) {
      const nearest = findNearestFloorTile(e.position, map);
      if (nearest) e.position = nearest;
    }

    if (e.stunTimer > 0) {
      e.stunTimer = Math.max(0, e.stunTimer - dt);
      return e;
    }

    e.moveTimer -= dt;
    if (e.moveTimer <= 0) {
      // Random patrol: pick a new random direction
      const pex = Math.round(e.position.x);
      const pey = Math.round(e.position.y);
      
      const validDirs = DIRS.filter(d => canWalk(map, pex + d.x, pey + d.y));
      if (validDirs.length > 0) {
        const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
        e.direction = chosen;
      }
      e.moveTimer = ENEMY_MOVE_TIMER_MIN + Math.random() * ENEMY_MOVE_TIMER_RANGE;
    }

    // Move
    if (e.direction.x !== 0 || e.direction.y !== 0) {
      const nx = e.position.x + e.direction.x * e.speed * dt;
      const ny = e.position.y + e.direction.y * e.speed * dt;

      if (canMoveToPosition(map, e.position.x, e.position.y, nx, ny)) {
        e.position.x = nx;
        e.position.y = ny;
        if (Math.abs(e.position.x - Math.round(e.position.x)) < SNAP_TO_GRID_THRESHOLD &&
            Math.abs(e.position.y - Math.round(e.position.y)) < SNAP_TO_GRID_THRESHOLD) {
          e.position.x = Math.round(e.position.x);
          e.position.y = Math.round(e.position.y);
        }
      } else {
        e.direction = { x: 0, y: 0 };
        e.moveTimer = 0;
      }
    }

    // Final clamp after movement
    e.position = clampPosition(e.position, map);

    return e;
  });
}

export function tickBoss(
  boss: Boss,
  map: GameMap,
  dt: number,
  heroPositions: { x: number; y: number }[],
  spawnBombs: (positions: { x: number; y: number }[]) => void
): { boss: Boss; newMinions: Enemy[] } {
  const b = {
    ...boss,
    position: { ...boss.position },
    minions: boss.minions.map(m => ({ ...m, position: { ...m.position } })),
  };
  const newMinions: Enemy[] = [];

  if (b.hp <= 0) return { boss: b, newMinions };

  // Clamp boss position to valid bounds
  b.position = clampPosition(b.position, map);

  // Verify current tile is walkable
  const bx = Math.round(b.position.x);
  const by = Math.round(b.position.y);
  if (!canWalk(map, bx, by)) {
    const nearest = findNearestFloorTile(b.position, map);
    if (nearest) b.position = nearest;
  }

  // Phase transitions
  const hpPct = b.hp / b.maxHp;
  if (hpPct <= 0.3) b.phase = 3;
  else if (hpPct <= 0.6) b.phase = 2;

  if (b.stunTimer > 0) {
    b.stunTimer = Math.max(0, b.stunTimer - dt);
    return { boss: b, newMinions };
  }

  // Pattern execution
  if (b.currentPattern >= 0) {
    const pattern = b.patterns[b.currentPattern];
    b.patternTimer -= dt;

    if (pattern.type === 'charge' && heroPositions.length > 0) {
      // Charge toward nearest hero
      const nearest = heroPositions.reduce((a, c) => {
        const da = Math.abs(a.x - b.position.x) + Math.abs(a.y - b.position.y);
        const dc = Math.abs(c.x - b.position.x) + Math.abs(c.y - b.position.y);
        return dc < da ? c : a;
      });
      const dx = nearest.x - b.position.x;
      const dy = nearest.y - b.position.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 0.5) {
        const speed = b.speed * 2.5;
        const mx = (dx / dist) * speed * dt;
        const my = (dy / dist) * speed * dt;
        const nx = b.position.x + mx;
        const ny = b.position.y + my;
        if (canMoveToPosition(map, b.position.x, b.position.y, nx, ny)) {
          b.position.x = nx;
          b.position.y = ny;
        }
      }
    } else if (pattern.type === 'invincible') {
      b.invincible = true;
    } else if (pattern.type === 'summon' && b.patternTimer <= 0) {
      // Spawn minions around boss
      const bx = Math.round(b.position.x);
      const by = Math.round(b.position.y);
      const minionTypes: EnemyType[] = ['slime', 'goblin', 'skeleton'];
      for (const d of DIRS) {
        const sx = bx + d.x * 2;
        const sy = by + d.y * 2;
        if (canWalk(map, sx, sy)) {
          const type = minionTypes[Math.floor(Math.random() * minionTypes.length)];
          newMinions.push(spawnEnemy(type, { x: sx, y: sy }));
        }
      }
    } else if (pattern.type === 'bomb-rain') {
      // Drop bombs on random floor tiles
      if (Math.random() < 0.3 * dt * 5) {
        const targets: { x: number; y: number }[] = [];
        for (let i = 0; i < 2 + b.phase; i++) {
          const rx = 1 + Math.floor(Math.random() * (map.width - 2));
          const ry = 1 + Math.floor(Math.random() * (map.height - 2));
          if (map.tiles[ry][rx] === 'floor') targets.push({ x: rx, y: ry });
        }
        if (targets.length > 0) spawnBombs(targets);
      }
    }

    if (b.patternTimer <= 0) {
      b.currentPattern = -1;
      b.invincible = false;
      b.patternCooldownTimer = b.patterns[b.currentPattern === -1 ? 0 : b.currentPattern]?.cooldown ?? 4;
    }

    return { boss: b, newMinions };
  }

  // Cooldown between patterns
  b.patternCooldownTimer -= dt;
  if (b.patternCooldownTimer <= 0) {
    // Pick next pattern (cycle through, more aggressive in later phases)
    const nextIdx = (boss.currentPattern + 1) % b.patterns.length;
    b.currentPattern = nextIdx;
    b.patternTimer = b.patterns[nextIdx].duration * (b.phase >= 3 ? 1.5 : 1);
    return { boss: b, newMinions };
  }

  // Idle patrol when no pattern active
  b.moveTimer -= dt;
  if (b.moveTimer <= 0) {
    const bx = Math.round(b.position.x);
    const by = Math.round(b.position.y);
    const validDirs = DIRS.filter(d => canWalk(map, bx + d.x, by + d.y));
    if (validDirs.length > 0) {
      b.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
    }
    b.moveTimer = 1.5 + Math.random();
  }

  if (b.direction.x !== 0 || b.direction.y !== 0) {
    const nx = b.position.x + b.direction.x * b.speed * dt;
    const ny = b.position.y + b.direction.y * b.speed * dt;
    if (canMoveToPosition(map, b.position.x, b.position.y, nx, ny)) {
      b.position.x = nx;
      b.position.y = ny;
    } else {
      b.direction = { x: 0, y: 0 };
      b.moveTimer = 0;
    }
  }

  return { boss: b, newMinions };
}

export function damageEnemiesFromExplosion(
  enemies: Enemy[],
  explosionTiles: { x: number; y: number }[],
  power: number,
  heroId?: string,
  heroFamily?: HeroFamilyId
): { enemies: Enemy[]; kills: number; totalDamage: number } {
  let kills = 0;
  let totalDamage = 0;
  const updated = enemies.map(e => {
    const ex = Math.round(e.position.x);
    const ey = Math.round(e.position.y);
    if (explosionTiles.some(t => t.x === ex && t.y === ey)) {
      const affinityMult = getClanAffinityMultiplier(heroFamily, e.type);
      const effectivePower = Math.round(power * affinityMult);
      const damage = Math.min(e.hp, effectivePower);
      totalDamage += damage;
      const ne = { ...e, hp: e.hp - effectivePower, stunTimer: STUN_DURATION };
      if (ne.hp <= 0) kills++;
      return ne;
    }
    return e;
  });
  return { enemies: updated, kills, totalDamage };
}

export function damageBossFromExplosion(
  boss: Boss,
  explosionTiles: { x: number; y: number }[],
  power: number
): { boss: Boss; damageDealt: number } {
  if (boss.hp <= 0) return { boss, damageDealt: 0 };
  const bx = Math.round(boss.position.x);
  const by = Math.round(boss.position.y);
  if (explosionTiles.some(t => t.x === bx && t.y === by)) {
    if (boss.invincible) {
      return { boss: { ...boss, stunTimer: 0.2 }, damageDealt: 0 }; // visual feedback only
    }
    const damageDealt = Math.min(boss.hp, power);
    return { boss: { ...boss, hp: Math.max(0, boss.hp - power), stunTimer: 0.8 }, damageDealt };
  }
  return { boss, damageDealt: 0 };
}

export function checkEnemyHeroCollision(
  enemies: Enemy[],
  heroPos: { x: number; y: number }
): Enemy | null {
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const dist = Math.abs(e.position.x - heroPos.x) + Math.abs(e.position.y - heroPos.y);
    if (dist < 0.7) return e;
  }
  return null;
}

export function checkBossHeroCollision(
  boss: Boss | null,
  heroPos: { x: number; y: number }
): boolean {
  if (!boss || boss.hp <= 0) return false;
  const dist = Math.abs(boss.position.x - heroPos.x) + Math.abs(boss.position.y - heroPos.y);
  return dist < 0.8;
}
