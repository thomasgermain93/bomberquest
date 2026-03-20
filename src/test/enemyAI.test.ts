import { describe, it, expect } from 'vitest';
import { spawnEnemy, spawnBoss, tickEnemies, damageEnemiesFromExplosion } from '../game/enemyAI';
import { ENEMY_CONFIG } from '../game/storyTypes';
import type { GameMap } from '../game/types';
import type { Enemy } from '../game/storyTypes';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Crée une GameMap de test (5×5) entièrement composée de floors,
 * avec des murs sur le périmètre extérieur.
 */
function makeMap(width = 7, height = 7): GameMap {
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return 'wall' as const;
      return 'floor' as const;
    })
  );
  return { width, height, tiles, chests: [] };
}

// ─── spawnEnemy ───────────────────────────────────────────────────────────────

describe('spawnEnemy', () => {
  it('crée un ennemi avec le bon type', () => {
    const e = spawnEnemy('slime', { x: 2, y: 2 });
    expect(e.type).toBe('slime');
  });

  it('crée un ennemi avec la position demandée', () => {
    const e = spawnEnemy('goblin', { x: 3, y: 4 });
    expect(e.position).toEqual({ x: 3, y: 4 });
  });

  it('HP initial = hp de la config', () => {
    for (const type of ['slime', 'goblin', 'skeleton', 'orc', 'demon'] as const) {
      const e = spawnEnemy(type, { x: 1, y: 1 });
      expect(e.hp).toBe(ENEMY_CONFIG[type].hp);
      expect(e.maxHp).toBe(ENEMY_CONFIG[type].hp);
    }
  });

  it('stunTimer = 0 à la création', () => {
    const e = spawnEnemy('skeleton', { x: 1, y: 1 });
    expect(e.stunTimer).toBe(0);
  });

  it('direction = {x:0, y:0} à la création', () => {
    const e = spawnEnemy('orc', { x: 2, y: 2 });
    expect(e.direction).toEqual({ x: 0, y: 0 });
  });

  it('chaque ennemi a un id unique', () => {
    const e1 = spawnEnemy('slime', { x: 1, y: 1 });
    const e2 = spawnEnemy('slime', { x: 1, y: 1 });
    expect(e1.id).not.toBe(e2.id);
  });

  it('id commence par "enemy_"', () => {
    const e = spawnEnemy('demon', { x: 2, y: 2 });
    expect(e.id.startsWith('enemy_')).toBe(true);
  });
});

// ─── spawnBoss ────────────────────────────────────────────────────────────────

describe('spawnBoss', () => {
  it('crée un boss avec le bon type et nom', () => {
    const boss = spawnBoss('king-slime', { x: 3, y: 3 });
    expect(boss.type).toBe('king-slime');
    expect(boss.name).toBe('Roi Slime');
  });

  it('HP initial = maxHp', () => {
    const boss = spawnBoss('lich', { x: 3, y: 3 });
    expect(boss.hp).toBe(boss.maxHp);
    expect(boss.hp).toBeGreaterThan(0);
  });

  it('invincible = false et phase = 1 à la création', () => {
    const boss = spawnBoss('demon-lord', { x: 3, y: 3 });
    expect(boss.invincible).toBe(false);
    expect(boss.phase).toBe(1);
  });

  it('stunTimer = 0 à la création', () => {
    const boss = spawnBoss('goblin-chief', { x: 2, y: 2 });
    expect(boss.stunTimer).toBe(0);
  });

  it('patterns est un tableau non vide', () => {
    const boss = spawnBoss('orc-warlord', { x: 3, y: 3 });
    expect(Array.isArray(boss.patterns)).toBe(true);
    expect(boss.patterns.length).toBeGreaterThan(0);
  });
});

// ─── tickEnemies ──────────────────────────────────────────────────────────────

describe('tickEnemies', () => {
  it('un ennemi avec stunTimer > 0 ne se déplace pas', () => {
    const map = makeMap();
    const enemy: Enemy = {
      ...spawnEnemy('slime', { x: 3, y: 3 }),
      stunTimer: 2.0,
      direction: { x: 1, y: 0 },
      moveTimer: 0,
    };

    const initialPos = { ...enemy.position };
    const [updated] = tickEnemies([enemy], map, 0.016, []);

    expect(updated.position.x).toBe(initialPos.x);
    expect(updated.position.y).toBe(initialPos.y);
  });

  it('stunTimer diminue de dt à chaque tick', () => {
    const map = makeMap();
    const enemy: Enemy = {
      ...spawnEnemy('goblin', { x: 3, y: 3 }),
      stunTimer: 1.0,
    };

    const [updated] = tickEnemies([enemy], map, 0.1, []);
    expect(updated.stunTimer).toBeCloseTo(0.9, 5);
  });

  it('stunTimer ne descend pas en dessous de 0', () => {
    const map = makeMap();
    const enemy: Enemy = {
      ...spawnEnemy('slime', { x: 3, y: 3 }),
      stunTimer: 0.05,
    };

    const [updated] = tickEnemies([enemy], map, 0.5, []);
    expect(updated.stunTimer).toBe(0);
  });

  it('un ennemi mort (hp <= 0) est filtré hors du tableau', () => {
    const map = makeMap();
    const dead: Enemy = { ...spawnEnemy('slime', { x: 2, y: 2 }), hp: 0 };
    const alive: Enemy = spawnEnemy('goblin', { x: 3, y: 3 });

    const result = tickEnemies([dead, alive], map, 0.016, []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('goblin');
  });

  it('retourne un nouveau tableau (immutabilité)', () => {
    const map = makeMap();
    const enemy = spawnEnemy('slime', { x: 3, y: 3 });
    const original = [enemy];
    const result = tickEnemies(original, map, 0.016, []);
    // La référence du tableau est différente
    expect(result).not.toBe(original);
  });
});

// ─── damageEnemiesFromExplosion ───────────────────────────────────────────────

describe('damageEnemiesFromExplosion', () => {
  it('un ennemi dans la zone d\'explosion perd des HP', () => {
    const enemy = spawnEnemy('skeleton', { x: 2, y: 2 }); // hp = 8
    const explosionTiles = [{ x: 2, y: 2 }];

    const { enemies } = damageEnemiesFromExplosion([enemy], explosionTiles, 3);
    expect(enemies[0].hp).toBe(8 - 3);
  });

  it('un ennemi dans la zone d\'explosion reçoit un stunTimer > 0', () => {
    const enemy = spawnEnemy('slime', { x: 3, y: 3 });
    const explosionTiles = [{ x: 3, y: 3 }];

    const { enemies } = damageEnemiesFromExplosion([enemy], explosionTiles, 1);
    expect(enemies[0].stunTimer).toBeGreaterThan(0);
  });

  it('un ennemi HORS de la zone d\'explosion ne perd pas de HP', () => {
    const enemy = spawnEnemy('orc', { x: 5, y: 5 }); // hp = 12
    const explosionTiles = [{ x: 2, y: 2 }, { x: 3, y: 2 }];

    const { enemies } = damageEnemiesFromExplosion([enemy], explosionTiles, 10);
    expect(enemies[0].hp).toBe(ENEMY_CONFIG.orc.hp);
  });

  it('un ennemi hors zone garde son stunTimer à 0', () => {
    const enemy: Enemy = { ...spawnEnemy('goblin', { x: 4, y: 4 }), stunTimer: 0 };
    const explosionTiles = [{ x: 1, y: 1 }];

    const { enemies } = damageEnemiesFromExplosion([enemy], explosionTiles, 5);
    expect(enemies[0].stunTimer).toBe(0);
  });

  it('retourne le bon nombre de kills', () => {
    const e1 = spawnEnemy('slime', { x: 2, y: 2 }); // hp = 3, power = 5 → mort
    const e2 = spawnEnemy('orc', { x: 3, y: 3 });   // hp = 12, power = 5 → survit
    const explosionTiles = [{ x: 2, y: 2 }, { x: 3, y: 3 }];

    const { kills } = damageEnemiesFromExplosion([e1, e2], explosionTiles, 5);
    expect(kills).toBe(1);
  });

  it('retourne le totalDamage correct', () => {
    const e1 = spawnEnemy('slime', { x: 1, y: 1 }); // hp = 3, power = 10 → damage = 3 (capped à hp)
    const e2 = spawnEnemy('goblin', { x: 2, y: 2 }); // hp = 5, power = 10 → damage = 5 (capped à hp)
    const explosionTiles = [{ x: 1, y: 1 }, { x: 2, y: 2 }];

    const { totalDamage } = damageEnemiesFromExplosion([e1, e2], explosionTiles, 10);
    // Les deux sont tués, totalDamage = 3 + 5 = 8
    expect(totalDamage).toBe(8);
  });

  it('plusieurs ennemis dans la zone sont tous touchés', () => {
    const enemies = [
      spawnEnemy('slime', { x: 2, y: 2 }),
      spawnEnemy('goblin', { x: 3, y: 2 }),
      spawnEnemy('skeleton', { x: 4, y: 2 }),
    ];
    const explosionTiles = [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }];

    const { enemies: updated } = damageEnemiesFromExplosion(enemies, explosionTiles, 2);
    for (const e of updated) {
      const originalHp = ENEMY_CONFIG[e.type].hp;
      expect(e.hp).toBe(originalHp - 2);
      expect(e.stunTimer).toBeGreaterThan(0);
    }
  });

  it('un ennemi adjacent à la zone mais pas dedans n\'est pas touché', () => {
    const enemy = spawnEnemy('demon', { x: 3, y: 3 }); // hp = 18
    // Zone centrée sur (1,1) — ennemi en (3,3) n'est pas dans la liste
    const explosionTiles = [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 1 }];

    const { enemies } = damageEnemiesFromExplosion([enemy], explosionTiles, 999);
    expect(enemies[0].hp).toBe(ENEMY_CONFIG.demon.hp);
  });
});
