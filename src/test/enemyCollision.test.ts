import { describe, it, expect } from "vitest";
import { GameMap } from '../game/types';

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

const createTestMap = (): GameMap => ({
  width: 5,
  height: 5,
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall'],
  ],
  chests: [],
});

describe("canMoveToPosition", () => {
  const map = createTestMap();

  it("should allow movement within same tile row", () => {
    expect(canMoveToPosition(map, 1, 1, 1.2, 1)).toBe(true);
  });

  it("should allow movement between adjacent floor tiles", () => {
    expect(canMoveToPosition(map, 1, 1, 2, 1)).toBe(true);
    expect(canMoveToPosition(map, 1, 1, 1, 2)).toBe(true);
  });

  it("should block movement through wall", () => {
    expect(canMoveToPosition(map, 1, 1, 2, 2)).toBe(false);
  });

  it("should block movement to wall tile", () => {
    expect(canMoveToPosition(map, 1, 1, 2, 0)).toBe(false);
  });

  it("should handle boundary positions", () => {
    expect(canMoveToPosition(map, 1.9, 1, 2.1, 1)).toBe(true);
    expect(canMoveToPosition(map, 1.9, 1, 2.1, 2)).toBe(false);
  });

  it("should handle diagonal movement crossing corners", () => {
    expect(canMoveToPosition(map, 1.5, 1.5, 2.5, 2.5)).toBe(false);
    expect(canMoveToPosition(map, 1.5, 1.5, 2.4, 2.4)).toBe(false);
  });
});
