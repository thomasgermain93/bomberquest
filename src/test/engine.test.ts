import { describe, it, expect } from 'vitest';
import { generateMap, findPath, getExplosionTiles, buildDangerSet } from '@/game/engine';
import { GameMap, Bomb } from '@/game/types';

// --- Helpers pour construire des maps de test ---

/**
 * Construit une GameMap à partir d'une grille de caractères.
 * 'W' = wall, '.' = floor, 'B' = block
 * Exemple (5×5) :
 *   WWWWW
 *   W...W
 *   W.B.W
 *   W...W
 *   WWWWW
 */
function buildMap(rows: string[]): GameMap {
  const height = rows.length;
  const width = rows[0].length;
  const tiles = rows.map(row =>
    row.split('').map(ch => {
      if (ch === 'W') return 'wall' as const;
      if (ch === 'B') return 'block' as const;
      return 'floor' as const;
    })
  );
  return { width, height, tiles, chests: [] };
}

function makeBomb(x: number, y: number, range = 2, id = 'b1'): Bomb {
  return {
    id,
    heroId: 'hero1',
    position: { x, y },
    range,
    timer: 3,
    power: 1,
    team: 'heroes',
  };
}

// ============================================================
// generateMap
// ============================================================
describe('generateMap', () => {
  it('retourne une carte avec les dimensions demandées', () => {
    const map = generateMap(13, 9, 0.4, 12);
    expect(map.width).toBe(13);
    expect(map.height).toBe(9);
    expect(map.tiles.length).toBe(9);
    expect(map.tiles[0].length).toBe(13);
  });

  it('les bords sont tous des murs', () => {
    const map = generateMap(13, 9, 0.4, 12);
    const { width, height, tiles } = map;

    // Ligne du haut et du bas
    for (let x = 0; x < width; x++) {
      expect(tiles[0][x]).toBe('wall');
      expect(tiles[height - 1][x]).toBe('wall');
    }

    // Colonnes gauche et droite
    for (let y = 0; y < height; y++) {
      expect(tiles[y][0]).toBe('wall');
      expect(tiles[y][width - 1]).toBe('wall');
    }
  });

  it('les coins spawn (1,1), (w-2,1), (1,h-2), (w-2,h-2) sont des floors', () => {
    const map = generateMap(13, 9, 0.5, 10);
    const { width, height, tiles } = map;

    expect(tiles[1][1]).toBe('floor');
    expect(tiles[1][width - 2]).toBe('floor');
    expect(tiles[height - 2][1]).toBe('floor');
    expect(tiles[height - 2][width - 2]).toBe('floor');
  });

  it('le nombre de coffres est ≤ numChests demandé', () => {
    const map = generateMap(13, 9, 0.4, 12);
    expect(map.chests.length).toBeLessThanOrEqual(12);
  });

  it('le nombre de coffres est ≥ 0', () => {
    const map = generateMap(13, 9, 1.0, 0);
    expect(map.chests.length).toBe(0);
  });

  it('la carte contient au moins quelques tuiles floor', () => {
    const map = generateMap(13, 9, 0.0, 0); // aucun block
    const floors = map.tiles.flat().filter(t => t === 'floor');
    expect(floors.length).toBeGreaterThan(0);
  });
});

// ============================================================
// findPath
// ============================================================
describe('findPath', () => {
  // Carte simple 7×5, chemin libre de (1,1) à (5,3)
  //   WWWWWWW
  //   W.....W
  //   W.....W
  //   W.....W
  //   WWWWWWW
  const openMap = buildMap([
    'WWWWWWW',
    'W.....W',
    'W.....W',
    'W.....W',
    'WWWWWWW',
  ]);

  it('trouve un chemin entre deux floors accessibles', () => {
    const path = findPath(openMap, { x: 1, y: 1 }, { x: 5, y: 3 }, []);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });

  it('le chemin commence bien par le nœud de départ', () => {
    const path = findPath(openMap, { x: 1, y: 1 }, { x: 5, y: 3 }, []);
    expect(path).not.toBeNull();
    expect(path![0]).toEqual({ x: 1, y: 1 });
  });

  it('le chemin se termine par la destination', () => {
    const path = findPath(openMap, { x: 1, y: 1 }, { x: 5, y: 3 }, []);
    expect(path).not.toBeNull();
    const last = path![path!.length - 1];
    expect(last).toEqual({ x: 5, y: 3 });
  });

  it('toutes les tuiles du chemin sont des floors', () => {
    const path = findPath(openMap, { x: 1, y: 1 }, { x: 5, y: 3 }, []);
    expect(path).not.toBeNull();
    for (const { x, y } of path!) {
      expect(openMap.tiles[y][x]).toBe('floor');
    }
  });

  it('retourne null si la destination est un mur', () => {
    const path = findPath(openMap, { x: 1, y: 1 }, { x: 0, y: 0 }, []);
    expect(path).toBeNull();
  });

  it('retourne null si la destination est bloquée par des blocks', () => {
    // Carte avec un couloir bloqué
    //   WWWWW
    //   W.B.W
    //   WWWWW
    const blockedMap = buildMap([
      'WWWWW',
      'W.B.W',
      'WWWWW',
    ]);
    const path = findPath(blockedMap, { x: 1, y: 1 }, { x: 3, y: 1 }, []);
    expect(path).toBeNull();
  });

  it('retourne null si une bombe bloque le seul passage', () => {
    //   WWWWW
    //   W...W
    //   WWbWW   ← passage bloqué par une bombe en (2,2)... mais ici test avec bombe sur le chemin
    //   W...W
    //   WWWWW
    const corridorMap = buildMap([
      'WWWWW',
      'WW.WW',
      'W...W',
      'WW.WW',
      'WWWWW',
    ]);
    // Seule route : passe par (2,2). On y place une bombe.
    const bomb = makeBomb(2, 2);
    const path = findPath(corridorMap, { x: 2, y: 1 }, { x: 2, y: 3 }, [bomb]);
    expect(path).toBeNull();
  });

  it('un chemin trivial start === end retourne uniquement la position', () => {
    const path = findPath(openMap, { x: 2, y: 2 }, { x: 2, y: 2 }, []);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(1);
    expect(path![0]).toEqual({ x: 2, y: 2 });
  });
});

// ============================================================
// getExplosionTiles
// ============================================================
describe('getExplosionTiles', () => {
  //   WWWWWWW
  //   W.....W
  //   W..B..W   ← block en (3,2)
  //   W.....W
  //   WWWWWWW
  const mapWithBlock = buildMap([
    'WWWWWWW',
    'W.....W',
    'W..B..W',
    'W.....W',
    'WWWWWWW',
  ]);

  it('inclut toujours la tuile centrale (position de la bombe)', () => {
    const tiles = getExplosionTiles(mapWithBlock, { x: 2, y: 2 }, 3);
    expect(tiles.some(t => t.x === 2 && t.y === 2)).toBe(true);
  });

  it('retourne exactement 1 tuile si portée = 0', () => {
    const tiles = getExplosionTiles(mapWithBlock, { x: 2, y: 2 }, 0);
    expect(tiles.length).toBe(1);
    expect(tiles[0]).toEqual({ x: 2, y: 2 });
  });

  it('la propagation est stoppée par un mur (wall bloque sans être inclus)', () => {
    // Bombe en (1,1), portée 5 → ne doit pas franchir les murs bords
    const tiles = getExplosionTiles(mapWithBlock, { x: 1, y: 1 }, 5);
    const hasWallTile = tiles.some(t => mapWithBlock.tiles[t.y][t.x] === 'wall');
    expect(hasWallTile).toBe(false);
  });

  it('la propagation inclut le block mais s\'arrête après lui', () => {
    // Bombe en (2,2), portée 3, block en (3,2) → (3,2) inclus mais (4,2) non
    const tiles = getExplosionTiles(mapWithBlock, { x: 2, y: 2 }, 3);
    expect(tiles.some(t => t.x === 3 && t.y === 2)).toBe(true);  // block inclus
    expect(tiles.some(t => t.x === 4 && t.y === 2)).toBe(false); // derrière le block = exclu
  });

  it('la portée limite bien le nombre de tuiles dans chaque direction', () => {
    const openMap7x5 = buildMap([
      'WWWWWWW',
      'W.....W',
      'W.....W',
      'W.....W',
      'WWWWWWW',
    ]);
    // Bombe en (3,2), portée 1 → max 5 tuiles (centre + 4 directions)
    const tiles = getExplosionTiles(openMap7x5, { x: 3, y: 2 }, 1);
    expect(tiles.length).toBeLessThanOrEqual(5);
    // Les tuiles à distance > 1 du centre ne doivent pas apparaître
    for (const t of tiles) {
      const dist = Math.abs(t.x - 3) + Math.abs(t.y - 2);
      expect(dist).toBeLessThanOrEqual(1);
    }
  });
});

// ============================================================
// buildDangerSet
// ============================================================
describe('buildDangerSet', () => {
  const openMap = buildMap([
    'WWWWWWW',
    'W.....W',
    'W.....W',
    'W.....W',
    'WWWWWWW',
  ]);

  it('retourne un Set vide si aucune bombe', () => {
    const danger = buildDangerSet([], openMap);
    expect(danger.size).toBe(0);
  });

  it('contient la position de la bombe elle-même', () => {
    const bomb = makeBomb(3, 2, 2);
    const danger = buildDangerSet([bomb], openMap);
    expect(danger.has('3,2')).toBe(true);
  });

  it('contient les tuiles dans la portée d\'explosion', () => {
    const bomb = makeBomb(3, 2, 2);
    const danger = buildDangerSet([bomb], openMap);
    // Portée 2 vers la droite → (4,2) et (5,2) doivent être en danger
    expect(danger.has('4,2')).toBe(true);
    expect(danger.has('5,2')).toBe(true);
  });

  it('fusionne les zones de danger de plusieurs bombes', () => {
    const bomb1 = makeBomb(1, 1, 1, 'b1');
    const bomb2 = makeBomb(5, 3, 1, 'b2');
    const danger = buildDangerSet([bomb1, bomb2], openMap);
    expect(danger.has('1,1')).toBe(true);
    expect(danger.has('5,3')).toBe(true);
    // Les deux zones doivent être présentes
    expect(danger.has('2,1')).toBe(true); // droite de bomb1
    expect(danger.has('4,3')).toBe(true); // gauche de bomb2
  });
});
