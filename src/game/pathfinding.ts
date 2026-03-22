import { GameMap, Hero, Bomb, Chest } from './types';

type AStarNode = { x: number; y: number; g: number; f: number; parent: AStarNode | null };

function heapPush(heap: AStarNode[], node: AStarNode): void {
  heap.push(node);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p].f <= heap[i].f) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function heapPop(heap: AStarNode[]): AStarNode {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    while (true) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < heap.length && heap[l].f < heap[s].f) s = l;
      if (r < heap.length && heap[r].f < heap[s].f) s = r;
      if (s === i) break;
      [heap[i], heap[s]] = [heap[s], heap[i]];
      i = s;
    }
  }
  return top;
}

export function findPath(
  map: GameMap,
  from: { x: number; y: number },
  to: { x: number; y: number },
  bombs: Bomb[]
): { x: number; y: number }[] | null {
  const { width, height, tiles } = map;
  const bombSet = new Set(bombs.map(b => `${b.position.x},${b.position.y}`));

  const isWalkable = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    if (tiles[y][x] === 'wall' || tiles[y][x] === 'block') return false;
    if (bombSet.has(`${x},${y}`)) return false;
    return true;
  };

  if (!isWalkable(to.x, to.y) && !(to.x === from.x && to.y === from.y)) return null;

  const heap: AStarNode[] = [];
  const closedSet = new Set<string>();
  const gScore = new Map<string, number>();
  const h = (a: { x: number; y: number }) => Math.abs(a.x - to.x) + Math.abs(a.y - to.y);

  const startKey = `${from.x},${from.y}`;
  gScore.set(startKey, 0);
  heapPush(heap, { x: from.x, y: from.y, g: 0, f: h(from), parent: null });

  while (heap.length > 0) {
    const current = heapPop(heap);
    const key = `${current.x},${current.y}`;

    if (closedSet.has(key)) continue;
    closedSet.add(key);

    if (current.x === to.x && current.y === to.y) {
      const path: { x: number; y: number }[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const nKey = `${nx},${ny}`;

      if (!isWalkable(nx, ny) || closedSet.has(nKey)) continue;

      const g = current.g + 1;
      if (g < (gScore.get(nKey) ?? Infinity)) {
        gScore.set(nKey, g);
        heapPush(heap, { x: nx, y: ny, g, f: g + h({ x: nx, y: ny }), parent: current });
      }
    }
  }

  return null;
}

export function isAdjacentToTarget(hero: Hero, map: GameMap, enemies?: { position: { x: number; y: number }; hp: number }[]): boolean {
  const hx = Math.round(hero.position.x);
  const hy = Math.round(hero.position.y);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const nx = hx + dx;
    const ny = hy + dy;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
    if (map.tiles[ny][nx] === 'block') return true;
    if (map.chests.some(c => c.hp > 0 && c.position.x === nx && c.position.y === ny)) return true;
    if (enemies?.some(e => e.hp > 0 && Math.round(e.position.x) === nx && Math.round(e.position.y) === ny)) return true;
  }
  return false;
}

export function findNearestTarget(
  map: GameMap,
  hero: Hero,
  bombs: Bomb[],
  chests: Chest[],
  enemies?: { position: { x: number; y: number }; hp: number; isBoss?: boolean }[],
  isStoryMode?: boolean
): { x: number; y: number } | null {
  const hx = Math.round(hero.position.x);
  const hy = Math.round(hero.position.y);

  const candidates: { x: number; y: number; priority: number; dist: number }[] = [];

  // In story mode, enemies are the PRIMARY objective
  if (enemies && enemies.length > 0) {
    const aliveEnemies = enemies.filter(e => e.hp > 0);

    if (aliveEnemies.length > 0) {
      // Sort enemies by distance to hero - chase the closest one
      const sortedEnemies = aliveEnemies
        .map(e => ({
          enemy: e,
          dist: Math.abs(Math.round(e.position.x) - hx) + Math.abs(Math.round(e.position.y) - hy)
        }))
        .sort((a, b) => a.dist - b.dist);

      // For each enemy (prioritize closest), find all adjacent bombing spots
      for (let ei = 0; ei < sortedEnemies.length; ei++) {
        const { enemy, dist: enemyDist } = sortedEnemies[ei];
        const ex = Math.round(enemy.position.x);
        const ey = Math.round(enemy.position.y);

        // Priorite maximale au boss pour eviter les blocages de niveau.
        // Puis ennemi le plus proche, puis les autres.
        const priority = enemy.isBoss ? -3 : (ei === 0 ? -2 : -1);

        for (const [ox, oy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const tx = ex + ox;
          const ty = ey + oy;
          if (tx >= 0 && ty >= 0 && tx < map.width && ty < map.height && map.tiles[ty][tx] === 'floor') {
            const dist = Math.abs(tx - hx) + Math.abs(ty - hy);
            candidates.push({ x: tx, y: ty, priority, dist });
          }
        }

        // Also consider tiles in bomb range (not just adjacent) for ranged heroes
        if (hero.stats.rng > 1) {
          for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
            for (let r = 2; r <= hero.stats.rng; r++) {
              const tx = ex + dx * r;
              const ty = ey + dy * r;
              if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) break;
              if (map.tiles[ty][tx] === 'wall') break;
              if (map.tiles[ty][tx] === 'block') break;
              if (map.tiles[ty][tx] === 'floor') {
                const dist = Math.abs(tx - hx) + Math.abs(ty - hy);
                candidates.push({ x: tx, y: ty, priority: priority + 1, dist });
              }
            }
          }
        }
      }

      // In story mode with alive enemies, skip blocks/chests - focus on killing
      if (isStoryMode) {
        candidates.sort((a, b) => a.priority - b.priority || a.dist - b.dist);
        for (const candidate of candidates.slice(0, 20)) {
          const path = findPath(map, { x: hx, y: hy }, { x: candidate.x, y: candidate.y }, bombs);
          if (path && path.length > 1) {
            return { x: candidate.x, y: candidate.y };
          }
        }
        // If can't reach any enemy-adjacent tile, fall through to blocks/chests
      }
    }
  }

  // Priority 0: adjacent to alive chests
  for (const chest of chests) {
    if (chest.hp <= 0) continue;
    for (const [ox, oy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const tx = chest.position.x + ox;
      const ty = chest.position.y + oy;
      if (tx >= 0 && ty >= 0 && tx < map.width && ty < map.height && map.tiles[ty][tx] === 'floor') {
        const dist = Math.abs(tx - hx) + Math.abs(ty - hy);
        candidates.push({ x: tx, y: ty, priority: 0, dist });
      }
    }
  }

  // Priority 1: adjacent to blocks
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      if (map.tiles[y][x] === 'block') {
        for (const [ox, oy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const ax = x + ox;
          const ay = y + oy;
          if (ax >= 0 && ay >= 0 && ax < map.width && ay < map.height && map.tiles[ay][ax] === 'floor') {
            const dist = Math.abs(ax - hx) + Math.abs(ay - hy);
            candidates.push({ x: ax, y: ay, priority: 1, dist });
          }
        }
      }
    }
  }

  // Sort by priority first, then distance
  candidates.sort((a, b) => a.priority - b.priority || a.dist - b.dist);

  // Try pathfinding to the best candidates
  for (const candidate of candidates.slice(0, 20)) {
    const path = findPath(map, { x: hx, y: hy }, { x: candidate.x, y: candidate.y }, bombs);
    if (path && path.length > 1) {
      return { x: candidate.x, y: candidate.y };
    }
  }

  // Fallback: random walkable tile
  const floorTiles: { x: number; y: number }[] = [];
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      if (map.tiles[y][x] === 'floor' && (x !== hx || y !== hy)) {
        floorTiles.push({ x, y });
      }
    }
  }
  if (floorTiles.length > 0) {
    // Try a few random ones
    for (let i = 0; i < 5; i++) {
      const t = floorTiles[Math.floor(Math.random() * floorTiles.length)];
      const path = findPath(map, { x: hx, y: hy }, t, bombs);
      if (path && path.length > 1) return t;
    }
  }

  return null;
}
