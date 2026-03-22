import { GameState, Hero, Bomb } from './types';
import { addXp, getMaxLevel } from './upgradeSystem';
import { getActiveClanSkills, ClanSkillEffect } from './clanSystem';
import { Boss } from './storyTypes';
import { findPath, isAdjacentToTarget, findNearestTarget } from './pathfinding';
import { getExplosionTiles, buildDangerSet, isInDangerZone, findSafeSpot } from './explosionSystem';

// Re-exports pour compatibilite avec les fichiers qui importent depuis engine.ts
export { generateMap } from './mapGenerator';
export { findPath, isAdjacentToTarget, findNearestTarget } from './pathfinding';
export { getExplosionTiles, buildDangerSet, isInDangerZone, findSafeSpot } from './explosionSystem';

let nextId = 1;
export const genId = () => `id_${nextId++}`;

const LOW_STAMINA_THRESHOLD = 0.5;  // % de stamina max en-dessous duquel la vitesse est reduite
const BOMB_COOLDOWN = 0.5;          // secondes entre deux bombes

// --- Helpers locaux (non exportes) ---

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

export function tickGame(state: GameState, deltaMs: number): GameState {
  if (!state.isRunning || state.isPaused || state.mapCompleted) return state;

  const dt = (deltaMs / 1000) * state.speed;
  let newState = { ...state };
  let map = { ...newState.map, tiles: newState.map.tiles.map(row => [...row]), chests: [...newState.map.chests] };
  let heroes = newState.heroes.map(h => ({ ...h, position: { ...h.position } }));
  // Pre-calculer les clan skills une seule fois par tick (#271)
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
    const baseChainChance = 0.80;
    const chainChanceBonus = getClanBonus('chain_chance', heroes, activeClanSkills);
    const chainChance = Math.min(1.0, baseChainChance + chainChanceBonus);
    for (const cb of chainedBombs) {
      if (Math.random() >= chainChance) continue;
      bombs = bombs.filter(b => b.id !== cb.id);
      const cbTiles = getExplosionTiles(map, cb.position, cb.range);
      explosions.push({ id: genId(), tiles: cbTiles, timer: 0.4, team: cb.team, heroId: cb.heroId, family: cb.family });
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

  // Pre-calculer les tuiles de danger (bombes) une seule fois par tick (#272)
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
    eventLog.push(`Carte completee! +${coinsEarned} BC au total!`);
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
