import { GameMap, Hero, Bomb } from './types';

export function getExplosionTiles(
  map: GameMap,
  position: { x: number; y: number },
  range: number
): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = [{ ...position }];
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  for (const [dx, dy] of dirs) {
    for (let i = 1; i <= range; i++) {
      const nx = position.x + dx * i;
      const ny = position.y + dy * i;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) break;
      if (map.tiles[ny][nx] === 'wall') break;
      tiles.push({ x: nx, y: ny });
      if (map.tiles[ny][nx] === 'block') break;
    }
  }

  return tiles;
}

export function buildDangerSet(bombs: Bomb[], map: GameMap): Set<string> {
  const danger = new Set<string>();
  for (const bomb of bombs) {
    for (const t of getExplosionTiles(map, bomb.position, bomb.range)) {
      danger.add(`${t.x},${t.y}`);
    }
  }
  return danger;
}

export function isInDangerZone(
  pos: { x: number; y: number },
  bombs: Bomb[],
  map: GameMap,
  precomputedDanger?: Set<string>
): boolean {
  if (precomputedDanger) {
    return precomputedDanger.has(`${pos.x},${pos.y}`);
  }
  for (const bomb of bombs) {
    const explosionTiles = getExplosionTiles(map, bomb.position, bomb.range);
    if (explosionTiles.some(t => t.x === pos.x && t.y === pos.y)) {
      return true;
    }
  }
  return false;
}

export function findSafeSpot(
  map: GameMap,
  hero: Hero,
  bombs: Bomb[],
  dangerSet?: Set<string>
): { x: number; y: number } | null {
  const startX = Math.round(hero.position.x);
  const startY = Math.round(hero.position.y);
  const visited = new Set<string>();
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
  visited.add(`${startX},${startY}`);
  const bombSet = new Set(bombs.map(b => `${b.position.x},${b.position.y}`));
  const danger = dangerSet ?? buildDangerSet(bombs, map);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (!danger.has(`${current.x},${current.y}`) && (current.x !== startX || current.y !== startY)) {
      return current;
    }

    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;
      if (!visited.has(key) && nx >= 0 && ny >= 0 && nx < map.width && ny < map.height) {
        if (map.tiles[ny][nx] === 'floor' && !bombSet.has(`${nx},${ny}`)) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  return null;
}
