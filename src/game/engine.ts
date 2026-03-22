import { GameState, GameMap, Hero, Bomb, Explosion, Chest, TileType, CHEST_CONFIG, ChestTier } from './types';
import { addXp, getMaxLevel } from './upgradeSystem';
import { getActiveClanSkills, ClanSkillEffect } from './clanSystem';
import { Boss } from './storyTypes';

let nextId = 1;
const genId = () => `id_${nextId++}`;

const LOW_STAMINA_THRESHOLD = 0.5;  // % de stamina max en-dessous duquel la vitesse est réduite
const BOMB_COOLDOWN = 0.5;          // secondes entre deux bombes

// --- Helpers locaux (non exportés) ---

function getClanBonus(effectType: ClanSkillEffect['type'], heroes: Hero[], precomputedSkills?: ReturnType<typeof getActiveClanSkills>): number {
  const skills = precomputedSkills ?? getActiveClanSkills(heroes);
  return skills
    .filter(s => s.effect.type === effectType)
    .reduce((acc, s) => acc + s.effect.value, 0);
}

function buildStoryTargets(
  state: Pick<GameState, 'enemies' | 'boss' | 'isStoryMode'>
): { position: { x: number; y: number }; hp: number; isBoss?: boolean }[] | undefined {
  if (!state.isStoryMode) return state.enemies;
  if (state.boss && (state.boss as any).hp > 0) {
    return [
      ...(state.enemies || []).map(e => ({ ...e, isBoss: false as const })),
      { ...(state.boss as any), isBoss: true as const },
    ];
  }
  return state.enemies;
}

const XP_REWARDS = {
  bombPlaced: 5,
  blockDestroyed: 10,
  chestOpened: 25,
  enemyKilled: 15,
};


export function generateMap(width: number, height: number, blockDensity: number, numChests: number): GameMap {
  const tiles: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        tiles[y][x] = 'wall';
      } else if (x % 2 === 0 && y % 2 === 0) {
        tiles[y][x] = 'wall';
      } else {
        tiles[y][x] = 'floor';
      }
    }
  }

  const clearZones = [
    { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 },
    { x: width - 2, y: 1 }, { x: width - 3, y: 1 }, { x: width - 2, y: 2 },
    { x: 1, y: height - 2 }, { x: 2, y: height - 2 }, { x: 1, y: height - 3 },
    { x: width - 2, y: height - 2 }, { x: width - 3, y: height - 2 }, { x: width - 2, y: height - 3 },
  ];

  const clearSet = new Set(clearZones.map(p => `${p.x},${p.y}`));

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (tiles[y][x] === 'floor' && !clearSet.has(`${x},${y}`) && Math.random() < blockDensity) {
        tiles[y][x] = 'block';
      }
    }
  }

  // Place chests on some block tiles (hidden inside blocks)
  const chests: Chest[] = [];
  const floorTiles: { x: number; y: number }[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (tiles[y][x] === 'floor' && !clearSet.has(`${x},${y}`)) {
        floorTiles.push({ x, y });
      }
    }
  }

  for (let i = floorTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [floorTiles[i], floorTiles[j]] = [floorTiles[j], floorTiles[i]];
  }

  const chestCount = Math.min(numChests, floorTiles.length);
  const tiers: ChestTier[] = ['wood', 'wood', 'wood', 'silver', 'silver', 'gold'];

  for (let i = 0; i < chestCount; i++) {
    const pos = floorTiles[i];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const cfg = CHEST_CONFIG[tier];
    chests.push({
      id: genId(),
      tier,
      position: pos,
      hp: cfg.hp,
      maxHp: cfg.hp,
      reward: cfg.rewardMin + Math.floor(Math.random() * (cfg.rewardMax - cfg.rewardMin)),
    });
  }

  return { width, height, tiles, chests };
}

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

function isAdjacentToTarget(hero: Hero, map: GameMap, enemies?: { position: { x: number; y: number }; hp: number }[]): boolean {
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

function findNearestTarget(
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
        
        // Priorité maximale au boss pour éviter les blocages de niveau.
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
      
      // In story mode with alive enemies, skip blocks/chests — focus on killing
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

export function buildDangerSet(bombs: Bomb[], map: GameMap): Set<string> {
  const danger = new Set<string>();
  for (const bomb of bombs) {
    for (const t of getExplosionTiles(map, bomb.position, bomb.range)) {
      danger.add(`${t.x},${t.y}`);
    }
  }
  return danger;
}

function isInDangerZone(
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

function findSafeSpot(
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

export function tickGame(state: GameState, deltaMs: number): GameState {
  if (!state.isRunning || state.isPaused || state.mapCompleted) return state;

  const dt = (deltaMs / 1000) * state.speed;
  const newState = { ...state };
  const map = { ...newState.map, tiles: newState.map.tiles.map(row => [...row]), chests: [...newState.map.chests] };
  const heroes = newState.heroes.map(h => ({ ...h, position: { ...h.position } }));
  // Pré-calculer les clan skills une seule fois par tick (#271)
  const activeClanSkills = getActiveClanSkills(heroes);
  let bombs = [...newState.bombs];
  let explosions = [...newState.explosions];
  let coinsEarned = newState.coinsEarned;
  let bombsPlaced = newState.bombsPlaced;
  let chestsOpened = newState.chestsOpened;
  let blocksDestroyed = newState.blocksDestroyed ?? 0;
  let eventLog = [...newState.eventLog];

  // Update bombs
  const newBombs: Bomb[] = [];
  const explodingBombs: Bomb[] = [];
  for (const bomb of bombs) {
    const updated = { ...bomb, timer: bomb.timer - dt };
    if (updated.timer <= 0) {
      explodingBombs.push(bomb);
    } else {
      newBombs.push(updated);
    }
  }
  bombs = newBombs;

  // Process explosions from bombs
  for (const bomb of explodingBombs) {
    const tiles = getExplosionTiles(map, bomb.position, bomb.range);
    explosions.push({ id: genId(), tiles, timer: 0.4, team: bomb.team, heroId: bomb.heroId, family: bomb.family });

    for (const tile of tiles) {
      if (map.tiles[tile.y][tile.x] === 'block') {
        map.tiles[tile.y][tile.x] = 'floor';
        blocksDestroyed++;
        if (Math.random() < 0.3) {
          const coins = 1 + Math.floor(Math.random() * 5);
          coinsEarned += coins;
        }
        if (bomb.heroId && bomb.team === 'heroes') {
          const heroIdx = heroes.findIndex(h => h.id === bomb.heroId);
          if (heroIdx >= 0 && heroes[heroIdx].level < getMaxLevel(heroes[heroIdx].rarity)) {
            heroes[heroIdx] = addXp(heroes[heroIdx], XP_REWARDS.blockDestroyed);
          }
        }
      }

      const chestIdx = map.chests.findIndex(c => c.position.x === tile.x && c.position.y === tile.y && c.hp > 0);
      if (chestIdx >= 0) {
        const chest = { ...map.chests[chestIdx] };
        chest.hp = Math.max(0, chest.hp - bomb.power);
        if (chest.hp <= 0) {
          // Bonus coin_bonus (shadow-core clan skill)
          const coinBonus = getClanBonus('coin_bonus', heroes);
          coinsEarned += Math.round(chest.reward * (1 + coinBonus));
          chestsOpened++;
          eventLog.push(`Coffre ${chest.tier} ouvert! +${chest.reward} BC`);
          if (bomb.heroId && bomb.team === 'heroes') {
            const heroIdx = heroes.findIndex(h => h.id === bomb.heroId);
            if (heroIdx >= 0) {
              if (heroes[heroIdx].level < getMaxLevel(heroes[heroIdx].rarity)) {
                heroes[heroIdx] = addXp(heroes[heroIdx], XP_REWARDS.chestOpened);
              }
              heroes[heroIdx] = {
                ...heroes[heroIdx],
                progressionStats: {
                  ...heroes[heroIdx].progressionStats,
                  chestsOpened: heroes[heroIdx].progressionStats.chestsOpened + 1,
                },
              };
            }
          }
        }
        map.chests[chestIdx] = chest;
      }
    }

    // Chain reaction
    const chainedBombs = bombs.filter(b =>
      tiles.some(t => t.x === b.position.x && t.y === b.position.y)
    );
    for (const cb of chainedBombs) {
      bombs = bombs.filter(b => b.id !== cb.id);
      const cbTiles = getExplosionTiles(map, cb.position, cb.range);
      explosions.push({ id: genId(), tiles: cbTiles, timer: 0.4, team: cb.team, heroId: cb.heroId, family: cb.family });
      // TODO #168 chain_chance arcane-circuit : augmenter la probabilité de réaction en chaîne si cb.family === 'arcane-circuit'
    }

    // Explosion damage to heroes: only enemy bombs can hurt heroes
    if (bomb.team === 'enemies') {
      for (const hero of heroes) {
        if (tiles.some(t => t.x === Math.round(hero.position.x) && t.y === Math.round(hero.position.y)) && hero.state !== 'resting') {
          hero.currentStamina = Math.max(0, hero.currentStamina - Math.floor(hero.maxStamina * 0.15));
        }
      }
    }
  }

  // Update explosion timers
  explosions = explosions
    .map(e => ({ ...e, timer: e.timer - dt }))
    .filter(e => e.timer > 0);

  // Pré-calculer les tuiles de danger (bombes) une seule fois par tick (#272)
  const dangerSet = buildDangerSet(bombs, map);

  // Update heroes
  for (let i = 0; i < heroes.length; i++) {
    const hero = heroes[i];

    // GUARD: Story mode - ensure any hero with 0 stamina stays KO
    if (state.isStoryMode && hero.currentStamina <= 0) {
      hero.currentStamina = 0;
      hero.state = 'resting';
      hero.isActive = false;
      hero.targetPosition = null;
      hero.path = null;
      continue;
    }

    if (hero.state === 'resting') {
      if (state.isStoryMode) {
        // Story mode: no respawn during a stage
        hero.currentStamina = 0;
        hero.isActive = false;
        hero.targetPosition = null;
        hero.path = null;
        continue;
      }

      const regenRates = [0.5, 0.67, 0.83, 1.25, 2.0];
      const regenRate = regenRates[Math.min(hero.houseLevel - 1, 4)];
      hero.currentStamina = Math.min(hero.maxStamina, hero.currentStamina + regenRate * dt);

      if (hero.currentStamina >= hero.maxStamina * 0.3) {
        hero.state = 'idle';
        hero.isActive = true;
        hero.stuckTimer = 0;
      }
      continue;
    }

    if (hero.currentStamina <= 0) {
      hero.currentStamina = 0;
      hero.state = 'resting';
      hero.isActive = false;
      hero.targetPosition = null;
      hero.path = null;
      // Story mode: explicitly prevent any respawn
      if (state.isStoryMode) {
        hero.isActive = false;
      }
      continue;
    }

    hero.bombCooldown = Math.max(0, hero.bombCooldown - dt);

    const hx = Math.round(hero.position.x);
    const hy = Math.round(hero.position.y);

    // Check if in danger - retreat immediately
    if (isInDangerZone({ x: hx, y: hy }, bombs, map, dangerSet) && hero.state !== 'retreating') {
      const safe = findSafeSpot(map, hero, bombs, dangerSet);
      if (safe) {
        const path = findPath(map, { x: hx, y: hy }, safe, []);  // ignore bombs for escape path
        if (path && path.length > 1) {
          hero.path = path;
          hero.targetPosition = path[path.length - 1];
          hero.state = 'retreating';
          hero.stuckTimer = 0;
        }
      }
    }

    // Follow path (for moving or retreating)
    if (hero.path && hero.path.length > 0 && (hero.state === 'moving' || hero.state === 'retreating')) {
      const nextStep = hero.path[0];
      const dx = nextStep.x - hero.position.x;
      const dy = nextStep.y - hero.position.y;

      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
        // Snap to grid position
        hero.position.x = nextStep.x;
        hero.position.y = nextStep.y;
        hero.path.shift();

        if (hero.path.length === 0) {
          // Reached destination
          hero.path = null;
          if (hero.state === 'retreating') {
            hero.state = 'idle';
            hero.stuckTimer = 0;
          } else {
            // Check if adjacent to a target - should bomb (include boss)
            const adjacentTargets = buildStoryTargets(state);
            if (isAdjacentToTarget(hero, map, adjacentTargets)) {
              hero.state = 'bombing';
            } else {
              hero.state = 'idle';
              hero.stuckTimer = 0;
            }
          }
        }
      } else {
        // Bonus move_speed (wild-pack clan skill)
        const speedBonus = getClanBonus('move_speed', heroes, activeClanSkills);
        const speed = hero.stats.spd * (hero.currentStamina < hero.maxStamina * LOW_STAMINA_THRESHOLD ? 0.75 : 1.0) * (1 + speedBonus);
        if (Math.abs(dx) > 0.05) {
          hero.position.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
        } else if (Math.abs(dy) > 0.05) {
          hero.position.y += Math.sign(dy) * Math.min(Math.abs(dy), speed * dt);
        }
      }
      continue;  // Don't process other states while following path
    }

    // Bombing - place bomb when adjacent to target
    if (hero.state === 'bombing' && hero.bombCooldown <= 0) {
      const heroActiveBombs = bombs.filter(b => b.heroId === hero.id).length;
      if (heroActiveBombs < hero.stats.bnb) {
        const bx = Math.round(hero.position.x);
        const by = Math.round(hero.position.y);
        if (!bombs.some(b => b.position.x === bx && b.position.y === by)) {
          // Calculer les bonus de clan skills actifs
          const rangBonus = getClanBonus('bomb_range', heroes, activeClanSkills);
          const timerBonus = getClanBonus('bomb_timer', heroes, activeClanSkills);
          bombs.push({
            id: genId(),
            heroId: hero.id,
            position: { x: bx, y: by },
            range: hero.stats.rng + rangBonus,
            timer: Math.max(0.8, 2.0 + timerBonus),
            power: hero.stats.pwr,
            team: 'heroes',
            family: hero.family,
          });
          hero.currentStamina = Math.max(0, hero.currentStamina - 1);
          hero.bombCooldown = BOMB_COOLDOWN;
          bombsPlaced++;
          const heroIdx = heroes.findIndex(h => h.id === hero.id);
          if (heroIdx >= 0) {
            heroes[heroIdx] = addXp(heroes[heroIdx], XP_REWARDS.bombPlaced);
          }

          // Retreat from own bomb
          const safe = findSafeSpot(map, hero, bombs);
          if (safe) {
            const path = findPath(map, { x: bx, y: by }, safe, []);
            if (path && path.length > 1) {
              hero.path = path.slice(1); // skip current position
              hero.targetPosition = safe;
              hero.state = 'retreating';
              hero.stuckTimer = 0;
            } else {
              hero.state = 'idle';
              hero.stuckTimer = 0;
            }
          } else {
            hero.state = 'idle';
            hero.stuckTimer = 0;
          }
        } else {
          hero.state = 'idle';
          hero.stuckTimer = 0;
        }
      } else {
        hero.state = 'idle';
        hero.stuckTimer = 0;
      }
    }

    // Idle - find new target
    if (hero.state === 'idle') {
      hero.stuckTimer += dt;
      
      // Re-snap position to grid to prevent floating point drift
      hero.position.x = Math.round(hero.position.x);
      hero.position.y = Math.round(hero.position.y);

      // In story mode with enemies alive, re-target faster (0.15s vs 0.3s)
      const hasAliveEnemies = state.enemies?.some(e => e.hp > 0) || (state.isStoryMode && state.boss && (state.boss as Boss).hp > 0);
      const retargetDelay = (state.isStoryMode && hasAliveEnemies) ? 0.15 : 0.3;
      const storyTargets = buildStoryTargets(state);

      if (hero.stuckTimer >= retargetDelay) {
        const target = findNearestTarget(map, hero, bombs, map.chests, storyTargets, state.isStoryMode);
        if (target) {
          const path = findPath(map, { x: hx, y: hy }, target, bombs);
          if (path && path.length > 1) {
            hero.path = path.slice(1);
            hero.targetPosition = target;
            hero.state = 'moving';
            hero.stuckTimer = 0;
          } else {
            hero.stuckTimer = Math.random() * 0.1;
          }
        } else {
          hero.stuckTimer = Math.random() * 0.1;
        }
      }
    }

    // In story mode, interrupt current movement to retarget enemies that moved
    const hasStoryTargets = state.isStoryMode && (state.enemies?.some(e => e.hp > 0) || (state.boss && (state.boss as Boss).hp > 0));
    if (hasStoryTargets && hero.state === 'moving') {
      hero.stuckTimer += dt;
      // Every 0.8s, re-evaluate if there's a closer enemy
      if (hero.stuckTimer >= 0.8) {
        hero.stuckTimer = 0;
        const retargets = buildStoryTargets(state);
        const betterTarget = findNearestTarget(map, hero, bombs, map.chests, retargets, true);
        if (betterTarget && hero.targetPosition) {
          const currentDist = Math.abs(hero.targetPosition.x - hx) + Math.abs(hero.targetPosition.y - hy);
          const newDist = Math.abs(betterTarget.x - hx) + Math.abs(betterTarget.y - hy);
          // Switch target if significantly closer
          if (newDist < currentDist - 2) {
            const path = findPath(map, { x: Math.round(hero.position.x), y: Math.round(hero.position.y) }, betterTarget, bombs);
            if (path && path.length > 1) {
              hero.path = path.slice(1);
              hero.targetPosition = betterTarget;
            }
          }
        }
      }
    }
  }

  // Check map completion: all chests opened (blocks don't need to be fully cleared)
  const hasChests = map.chests.some(c => c.hp > 0);
  const mapCompleted = !state.isStoryMode && !hasChests && map.chests.length > 0;

  if (mapCompleted && !state.mapCompleted) {
    eventLog.push(`🎉 Carte complétée! +${coinsEarned} BC au total!`);
  }

  return {
    ...newState,
    map,
    heroes,
    bombs,
    explosions,
    coinsEarned,
    bombsPlaced,
    chestsOpened,
    blocksDestroyed,
    mapCompleted,
    eventLog: eventLog.slice(-20),
  };
}
