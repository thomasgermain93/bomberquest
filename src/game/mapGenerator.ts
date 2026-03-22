import { GameMap, TileType, Chest, ChestTier, CHEST_CONFIG } from './types';

let nextId = 1;
const genId = () => `id_${nextId++}`;

export function generateMap(width: number, height: number, blockDensity: number, numChests: number, mapIndex?: number): GameMap {
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
  let tiers: ChestTier[];
  if (mapIndex === undefined || mapIndex <= 1) {
    tiers = ['wood', 'wood', 'wood', 'silver', 'silver', 'gold'];
  } else if (mapIndex <= 3) {
    tiers = ['wood', 'silver', 'silver', 'gold', 'gold'];
  } else if (mapIndex === 4) {
    tiers = ['silver', 'gold', 'gold', 'crystal'];
  } else {
    tiers = ['gold', 'crystal', 'crystal', 'legendary'];
  }

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
