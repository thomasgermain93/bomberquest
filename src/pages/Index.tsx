import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import GameGrid from '@/components/GameGrid';
import HeroCard from '@/components/HeroCard';
import SummonModal from '@/components/SummonModal';
import HeroUpgradeModal from '@/components/HeroUpgradeModal';
import StoryMode from '@/components/StoryMode';
import { GameState, Hero, MAP_CONFIGS, PlayerData, RARITY_CONFIG, Rarity } from '@/game/types';
import { generateMap, tickGame } from '@/game/engine';
import { summonHero, generateHero } from '@/game/summoning';
import { loadPlayerData, savePlayerData, getDefaultPlayerData, saveStoryProgress, loadStoryProgress } from '@/game/saveSystem';
import { getUpgradeCost, upgradeHero, ascendHero, getAscensionCost, countDuplicates } from '@/game/upgradeSystem';
import { DailyQuestData, loadDailyQuests, saveDailyQuests, generateDailyQuests, updateQuestProgress, ALL_CLAIMED_BONUS, ALL_CLAIMED_XP_BONUS } from '@/game/questSystem';
import { StoryProgress, StoryStage } from '@/game/storyTypes';
import { spawnEnemy, spawnBoss, tickEnemies, tickBoss, damageEnemiesFromExplosion, damageBossFromExplosion, checkEnemyHeroCollision, checkBossHeroCollision } from '@/game/enemyAI';
import { STORY_REGIONS } from '@/game/storyData';
import { getExplosionTiles } from '@/game/engine';
import DailyQuests from '@/components/DailyQuests';
import PixelIcon from '@/components/PixelIcon';
import { Home, Users, Sparkles, Swords, Map, Trophy, Coins, Star, ChevronLeft, Play, Pause, DoorOpen, Check, Scroll, FastForward, BookOpen, Shield, Skull, Bomb, Lock as LockIcon, Volume2, VolumeX, User } from 'lucide-react';
import { SFX, isMuted, setMuted } from '@/game/sfx';
import { toast } from '@/hooks/use-toast';

type Screen = 'hub' | 'treasure-hunt' | 'heroes' | 'summon' | 'story' | 'story-battle';


const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('hub');
  const [player, setPlayer] = useState<PlayerData>(() =>
    user ? getDefaultPlayerData() : loadPlayerData()
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [summonOpen, setSummonOpen] = useState(false);
  const [lastSummoned, setLastSummoned] = useState<Hero | null>(null);
  const [selectedMap, setSelectedMap] = useState(0);
  const [selectedHeroes, setSelectedHeroes] = useState<Set<string>>(new Set());
  const [upgradeHeroId, setUpgradeHeroId] = useState<string | null>(null);
  const [dailyQuests, setDailyQuests] = useState<DailyQuestData>(() =>
    user ? generateDailyQuests() : loadDailyQuests()
  );
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(() =>
    user
      ? { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0 }
      : loadStoryProgress()
  );
  const [currentStoryStage, setCurrentStoryStage] = useState<StoryStage | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [isCloudLoading, setIsCloudLoading] = useState(!!user);
  const [autoFarm, setAutoFarm] = useState(false);
  const [autoMerge, setAutoMerge] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [farmStats, setFarmStats] = useState({ runs: 0, totalCoins: 0 });
  const [storyRegionIdx, setStoryRegionIdx] = useState(0);
  const huntSpeedRef = useRef(1);
  const gameLoopRef = useRef<number>();

  useEffect(() => {
    // For guests: restore speed from localStorage. For auth users: cloud load handles it.
    if (!user) {
      const saved = Number(localStorage.getItem('hunt-speed') || '1');
      huntSpeedRef.current = saved === 2 || saved === 3 ? saved : 1;
    }
  }, []);
  const lastTickRef = useRef<number>(Date.now());
  const processedExplosionsRef = useRef<Set<string>>(new Set());

  const { loadFromCloud, saveHeroesToCloud, removeHeroesFromCloud, saveStatsToCloud } = useCloudSave(user?.id);

  const toggleMute = () => {
    const newVal = !muted;
    setMutedState(newVal);
    setMuted(newVal);
  };

  // Load from cloud on mount (connected users only)
  useEffect(() => {
    if (!user) return;

    const CLOUD_LOAD_TIMEOUT = 10000;

    const loadWithTimeout = async () => {
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), CLOUD_LOAD_TIMEOUT);
      });

      try {
        const data = await Promise.race([loadFromCloud(), timeoutPromise]);
        return data;
      } catch {
        return null;
      }
    };

    loadWithTimeout().then(data => {
      if (data) {
        setPlayer(data.playerData);
        setStoryProgress(data.storyProgress ?? { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0 });
        const today = new Date().toISOString().split('T')[0];
        setDailyQuests(data.dailyQuests?.date === today ? data.dailyQuests : generateDailyQuests());
        const cloudSpeed = data.playerData.huntSpeed;
        if (cloudSpeed === 2 || cloudSpeed === 3) {
          huntSpeedRef.current = cloudSpeed;
        }
      } else {
        const localData = loadPlayerData();
        const localStory = loadStoryProgress();
        const localQuests = loadDailyQuests();
        setPlayer(localData);
        setStoryProgress(localStory);
        const today = new Date().toISOString().split('T')[0];
        setDailyQuests(localQuests?.date === today ? localQuests : generateDailyQuests());
        saveStatsToCloud(localData, localStory, localQuests?.date === today ? localQuests : generateDailyQuests());
        saveHeroesToCloud(localData.heroes);
        const localSpeed = Number(localStorage.getItem('hunt-speed') || '1');
        if (localSpeed === 2 || localSpeed === 3) {
          huntSpeedRef.current = localSpeed;
          setPlayer(prev => ({ ...prev, huntSpeed: localSpeed }));
        }
        if (!data) {
          toast({ title: 'Cloud indisponible', description: 'Données chargées depuis le stockage local.', duration: 4000 });
        }
      }
      setIsCloudLoading(false);
    }).catch(() => {
      const localData = loadPlayerData();
      const localStory = loadStoryProgress();
      const localQuests = loadDailyQuests();
      setPlayer(localData);
      setStoryProgress(localStory);
      const today = new Date().toISOString().split('T')[0];
      setDailyQuests(localQuests?.date === today ? localQuests : generateDailyQuests());
      toast({ title: 'Cloud indisponible', description: 'Données chargées depuis le stockage local.', duration: 4000 });
      setIsCloudLoading(false);
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate account level from XP
  const getAccountLevel = (xp: number) => {
    // Each level requires more XP: level N needs N*100 XP
    let level = 1;
    let xpNeeded = 100;
    let totalXp = xp;
    while (totalXp >= xpNeeded) {
      totalXp -= xpNeeded;
      level++;
      xpNeeded = level * 100;
    }
    return level;
  };

  // Update account level when XP changes
  useEffect(() => {
    const newLevel = getAccountLevel(player.xp);
    if (newLevel !== player.accountLevel) {
      setPlayer(prev => ({ ...prev, accountLevel: getAccountLevel(prev.xp) }));
    }
  }, [player.xp, player.accountLevel]);

  // Save periodically + passive stamina regen
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        saveStatsToCloud(player, storyProgress, dailyQuests);
      } else {
        savePlayerData(player);
        saveDailyQuests(dailyQuests);
        saveStoryProgress(storyProgress);
      }

      // Passive stamina regen when not in battle
      if (!gameState?.isRunning) {
        setPlayer(prev => {
          const needsRegen = prev.heroes.some(h => h.currentStamina < h.maxStamina);
          if (!needsRegen) return prev;
          return {
            ...prev,
            heroes: prev.heroes.map(h => ({
              ...h,
              currentStamina: Math.min(h.maxStamina, h.currentStamina + h.maxStamina * 0.05),
            })),
          };
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, player, dailyQuests, storyProgress, gameState?.isRunning]);

  useEffect(() => {
    if (user) return;
    const save = () => { savePlayerData(player); saveStoryProgress(storyProgress); };
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
  }, [user, player, storyProgress]);

  // Game loop
  const gameLoop = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;

    setGameState(prev => {
      if (!prev) return prev;
      const prevBombCount = prev.bombs.length;
      const prevMapCompleted = prev.mapCompleted;
      let state = tickGame(prev, Math.min(delta, 100));

      // SFX: new bombs placed
      if (state.bombs.length > prevBombCount) SFX.bombPlace();
      // SFX: explosions in treasure hunt
      if (!state.isStoryMode && state.explosions.length > prev.explosions.length) SFX.explosion();
      // SFX: treasure hunt map completed
      if (!state.isStoryMode && state.mapCompleted && !prevMapCompleted) SFX.victory();

      // Story mode: tick enemies & boss
      if (state.isStoryMode && state.isRunning && !state.isPaused) {
        const dt = (Math.min(delta, 100) / 1000) * state.speed;
        const heroPositions = state.heroes
          .filter(h => h.state !== 'resting')
          .map(h => ({ x: Math.round(h.position.x), y: Math.round(h.position.y) }));

        // Tick enemies
        let enemies = state.enemies ? tickEnemies(state.enemies, state.map, dt, heroPositions) : [];
        let boss = state.boss ? { ...state.boss } : null;
        let newBombs = [...state.bombs];
        let eventLog = [...state.eventLog];
        let enemiesKilled = state.enemiesKilled || 0;
        let coinsEarned = state.coinsEarned;

        // Tick boss
        let newMinions: any[] = [];
        if (boss && boss.hp > 0) {
          const result = tickBoss(boss, state.map, dt, heroPositions, (positions) => {
            for (const pos of positions) {
              newBombs.push({
                id: `boss_bomb_${Date.now()}_${Math.random()}`,
                heroId: 'boss',
                position: pos,
                range: 2,
                timer: 1.5,
                power: Math.ceil(boss!.damage / 3),
                team: 'enemies',
              });
            }
          });
          boss = result.boss;
          newMinions = result.newMinions;
        }

        if (newMinions.length > 0) {
          enemies = [...enemies, ...newMinions];
          eventLog.push(`⚠️ Le boss invoque ${newMinions.length} minions!`);
        }

        // Process explosion damage to enemies/boss directly in game loop
        for (const exp of state.explosions) {
          if (!processedExplosionsRef.current.has(exp.id)) {
            processedExplosionsRef.current.add(exp.id);
            SFX.explosion();
            if (exp.team === 'heroes') {
              const heroPower = Math.max(...state.heroes.map(h => h.stats.pwr), 1);
              const { enemies: updatedEnemies, kills } = damageEnemiesFromExplosion(enemies, exp.tiles, heroPower);
              enemies = updatedEnemies;
              enemiesKilled += kills;
              if (kills > 0) {
                SFX.enemyKill();
                eventLog.push(`💥 ${kills} ennemi(s) éliminé(s)!`);
                coinsEarned += kills * 10;
              }

              if (boss && boss.hp > 0) {
                const prevHp = boss.hp;
                boss = damageBossFromExplosion(boss, exp.tiles, heroPower + 1);
                if (boss.hp < prevHp) {
                  SFX.bossHit();
                  eventLog.push(`💥 Boss touché! (${boss.hp}/${boss.maxHp} HP)`);
                }
                if (boss.hp <= 0 && prevHp > 0) {
                  eventLog.push(`👑 BOSS VAINCU!`);
                  coinsEarned += 500;
                }
              }
            }
          }
        }

        // Clean up processed explosion IDs for expired explosions
        const activeIds = new Set(state.explosions.map(e => e.id));
        processedExplosionsRef.current.forEach(id => {
          if (!activeIds.has(id)) processedExplosionsRef.current.delete(id);
        });

        let heroes = state.heroes.map(h => {
          if (h.state === 'resting') return h;
          const hx = Math.round(h.position.x);
          const hy = Math.round(h.position.y);

          const hitEnemy = checkEnemyHeroCollision(enemies, { x: hx, y: hy });
          if (hitEnemy) {
            return { ...h, currentStamina: Math.max(0, h.currentStamina - hitEnemy.damage * dt) };
          }

          if (boss && checkBossHeroCollision(boss, { x: hx, y: hy })) {
            return { ...h, currentStamina: Math.max(0, h.currentStamina - boss.damage * dt) };
          }

          return h;
        });

        // Check story completion
        const allEnemiesDead = enemies.every(e => e.hp <= 0);
        const bossDefeated = !boss || boss.hp <= 0;
        const storyComplete = allEnemiesDead && bossDefeated;

        if (storyComplete && !state.mapCompleted) {
          SFX.victory();
          eventLog.push(`🎉 Victoire! Tous les ennemis vaincus!`);
          if (boss && state.boss && state.boss.hp > 0) {
            eventLog.push(`👑 BOSS VAINCU: ${boss.name}!`);
          }
        }

        state = {
          ...state,
          enemies,
          boss,
          heroes,
          bombs: newBombs,
          eventLog: eventLog.slice(-20),
          coinsEarned,
          enemiesKilled,
          bossDefeated: bossDefeated && !!boss,
          mapCompleted: storyComplete,
        };
      }

      return state;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    if (gameState?.isRunning) {
      lastTickRef.current = Date.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState?.isRunning, gameLoop]);


  const startTreasureHunt = () => {
    const mapConfig = MAP_CONFIGS[selectedMap];
    const map = generateMap(mapConfig.width, mapConfig.height, mapConfig.blockDensity, mapConfig.chests);

    const spawnPoints = [
      { x: 1, y: 1 }, { x: map.width - 2, y: 1 },
      { x: 1, y: map.height - 2 }, { x: map.width - 2, y: map.height - 2 },
      { x: 3, y: 1 }, { x: 1, y: 3 },
    ];

    const heroIds = Array.from(selectedHeroes);
    const deployedHeroes: Hero[] = player.heroes
      .filter(h => heroIds.includes(h.id))
      .map((h, i) => ({
        ...h,
        position: { ...spawnPoints[i % spawnPoints.length] },
        targetPosition: null,
        path: null,
        state: 'idle' as const,
        isActive: true,
        stuckTimer: 0,
      }));

    if (deployedHeroes.length === 0) {
      const firstHero = { ...player.heroes[0] };
      firstHero.position = { x: 1, y: 1 };
      firstHero.state = 'idle';
      firstHero.targetPosition = null;
      firstHero.path = null;
      firstHero.isActive = true;
      firstHero.stuckTimer = 0;
      deployedHeroes.push(firstHero);
    }

    setGameState({
      map,
      heroes: deployedHeroes,
      bombs: [],
      explosions: [],
      bomberCoins: player.bomberCoins,
      coinsEarned: 0,
      bombsPlaced: 0,
      chestsOpened: 0,
      isRunning: true,
      isPaused: false,
      speed: huntSpeedRef.current,
      mapCompleted: false,
      eventLog: ['🎮 Chasse au Trésor lancée!'],
    });
    setScreen('treasure-hunt');
  };

  const collectAndContinue = useCallback((shouldContinue: boolean) => {
    if (!gameState) return;
    
    const earned = gameState.coinsEarned;
    const completed = gameState.mapCompleted;
    
    const updatedHeroes = player.heroes.map(h => {
      const deployed = gameState.heroes.find(dh => dh.id === h.id);
      return deployed ? { ...h, currentStamina: deployed.currentStamina } : h;
    });
    setPlayer(prev => ({
      ...prev,
      bomberCoins: prev.bomberCoins + earned,
      mapsCompleted: prev.mapsCompleted + (completed ? 1 : 0),
      xp: prev.xp + earned,
      heroes: updatedHeroes,
    }));
    saveHeroesToCloud(updatedHeroes.filter(h => gameState.heroes.some(dh => dh.id === h.id)));

    setDailyQuests(prev => {
      let q = prev;
      if (completed) q = updateQuestProgress(q, 'complete_maps', 1);
      if (earned > 0) q = updateQuestProgress(q, 'earn_coins', earned);
      if (gameState.bombsPlaced > 0) q = updateQuestProgress(q, 'place_bombs', gameState.bombsPlaced);
      if (gameState.chestsOpened > 0) q = updateQuestProgress(q, 'open_chests', gameState.chestsOpened);
      return q;
    });

    if (shouldContinue) {
      setFarmStats(prev => ({ runs: prev.runs + 1, totalCoins: prev.totalCoins + earned }));
      // Relaunch with same settings
      setGameState(null);
      setTimeout(() => startTreasureHunt(), 100);
    } else {
      setAutoFarm(false);
      setFarmStats({ runs: 0, totalCoins: 0 });
      setGameState(null);
      setScreen('hub');
    }
  }, [gameState, selectedMap, selectedHeroes]);

  const endTreasureHunt = () => collectAndContinue(false);

  // Auto-farm: auto-continue when map completes
  useEffect(() => {
    if (autoFarm && gameState?.mapCompleted && !gameState?.isStoryMode) {
      const timer = setTimeout(() => collectAndContinue(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [autoFarm, gameState?.mapCompleted, collectAndContinue]);

  // Merge system
  const MERGE_RECIPES: { from: Rarity; to: Rarity; count: number }[] = [
    { from: 'common', to: 'rare', count: 12 },
    { from: 'rare', to: 'super-rare', count: 6 },
    { from: 'super-rare', to: 'epic', count: 3 },
  ];

  const handleMerge = (from: Rarity, to: Rarity, count: number) => {
    const available = player.heroes.filter(h => h.rarity === from);
    if (available.length < count) return;
    
    const toRemove = new Set(available.slice(0, count).map(h => h.id));
    const newHero = generateHero(to);
    
    setPlayer(prev => ({
      ...prev,
      heroes: [...prev.heroes.filter(h => !toRemove.has(h.id)), newHero],
    }));
  };

  const mergeAll = useCallback(() => {
    if (isMerging) return;
    setIsMerging(true);
    
    let mergeCount = 0;
    let currentHeroes = [...player.heroes];
    let madeProgress = true;
    
    while (madeProgress) {
      madeProgress = false;
      for (const recipe of MERGE_RECIPES) {
        const available = currentHeroes.filter(h => h.rarity === recipe.from);
        if (available.length >= recipe.count) {
          const toRemove = new Set(available.slice(0, recipe.count).map(h => h.id));
          const newHero = generateHero(recipe.to);
          currentHeroes = [...currentHeroes.filter(h => !toRemove.has(h.id)), newHero];
          mergeCount++;
          madeProgress = true;
          break;
        }
      }
    }
    
    if (mergeCount > 0) {
      setPlayer(prev => ({ ...prev, heroes: currentHeroes }));
      toast({
        title: "Fusion terminée",
        description: `${mergeCount} fusion(s) effectuée(s)`,
      });
    } else {
      toast({
        title: "Aucune fusion possible",
        description: "Vous n'avez pas assez de héros pour fusionner",
      });
    }
    
    setIsMerging(false);
  }, [player.heroes, isMerging]);

  const startStoryStage = (stage: StoryStage) => {
    const map = generateMap(stage.width, stage.height, stage.blockDensity, 0); // no chests in story

    const spawnPoints = [
      { x: 1, y: 1 }, { x: map.width - 2, y: 1 },
      { x: 1, y: map.height - 2 }, { x: map.width - 2, y: map.height - 2 },
    ];

    const heroIds = Array.from(selectedHeroes);
    const deployedHeroes: Hero[] = player.heroes
      .filter(h => heroIds.includes(h.id))
      .map((h, i) => ({
        ...h,
        position: { ...spawnPoints[i % spawnPoints.length] },
        targetPosition: null,
        path: null,
        state: 'idle' as const,
        isActive: true,
        stuckTimer: 0,
      }));

    if (deployedHeroes.length === 0) {
      const firstHero = { ...player.heroes[0] };
      firstHero.position = { x: 1, y: 1 };
      firstHero.state = 'idle';
      firstHero.targetPosition = null;
      firstHero.path = null;
      firstHero.isActive = true;
      firstHero.stuckTimer = 0;
      deployedHeroes.push(firstHero);
    }

    // Spawn enemies on floor tiles away from heroes
    const floorTiles: { x: number; y: number }[] = [];
    for (let y = 2; y < map.height - 2; y++) {
      for (let x = 2; x < map.width - 2; x++) {
        if (map.tiles[y][x] === 'floor') {
          const nearSpawn = spawnPoints.some(sp => Math.abs(sp.x - x) + Math.abs(sp.y - y) < 4);
          if (!nearSpawn) floorTiles.push({ x, y });
        }
      }
    }

    // Shuffle floor tiles
    for (let i = floorTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [floorTiles[i], floorTiles[j]] = [floorTiles[j], floorTiles[i]];
    }

    const enemies: any[] = [];
    let tileIdx = 0;
    for (const enemyCfg of stage.enemies) {
      for (let i = 0; i < enemyCfg.count && tileIdx < floorTiles.length; i++) {
        enemies.push(spawnEnemy(enemyCfg.type, floorTiles[tileIdx++]));
      }
    }

    // Spawn boss in center
    let boss = null;
    if (stage.boss) {
      const centerX = Math.floor(map.width / 2);
      const centerY = Math.floor(map.height / 2);
      // Find nearest floor to center
      let bossPos = { x: centerX, y: centerY };
      if (map.tiles[centerY]?.[centerX] !== 'floor') {
        for (const ft of floorTiles) {
          if (Math.abs(ft.x - centerX) + Math.abs(ft.y - centerY) < 5) {
            bossPos = ft;
            break;
          }
        }
      }
      boss = spawnBoss(stage.boss, bossPos);
    }

    setCurrentStoryStage(stage);
    setGameState({
      map,
      heroes: deployedHeroes,
      bombs: [],
      explosions: [],
      bomberCoins: player.bomberCoins,
      coinsEarned: 0,
      bombsPlaced: 0,
      chestsOpened: 0,
      isRunning: true,
      isPaused: false,
      speed: huntSpeedRef.current,
      mapCompleted: false,
      eventLog: [`⚔️ ${stage.name} - Combat lancé!`],
      isStoryMode: true,
      storyStageId: stage.id,
      enemies,
      boss,
      enemiesKilled: 0,
      bossDefeated: false,
    });
    setScreen('story-battle');
  };

  const endStoryBattle = () => {
    if (gameState && currentStoryStage) {
      const storyUpdatedHeroes = player.heroes.map(h => {
        const deployed = gameState.heroes.find(dh => dh.id === h.id);
        if (!deployed) return h;
        return gameState.mapCompleted
          ? { ...h, currentStamina: h.maxStamina }
          : { ...h, currentStamina: deployed.currentStamina };
      });
      setPlayer(prev => ({
        ...prev,
        bomberCoins: prev.bomberCoins + gameState.coinsEarned + (gameState.mapCompleted ? currentStoryStage.reward : 0),
        xp: prev.xp + (gameState.mapCompleted ? currentStoryStage.xpReward : 0),
        heroes: storyUpdatedHeroes,
      }));
      saveHeroesToCloud(storyUpdatedHeroes.filter(h => gameState.heroes.some(dh => dh.id === h.id)));

      if (gameState.mapCompleted) {
        setStoryProgress(prev => ({
          ...prev,
          completedStages: prev.completedStages.includes(currentStoryStage.id)
            ? prev.completedStages
            : [...prev.completedStages, currentStoryStage.id],
          bossesDefeated: currentStoryStage.boss && !prev.bossesDefeated.includes(currentStoryStage.boss)
            ? [...prev.bossesDefeated, currentStoryStage.boss]
            : prev.bossesDefeated,
          highestStage: Math.max(prev.highestStage, currentStoryStage.stageNumber),
        }));
      }

      setDailyQuests(prev => {
        let q = prev;
        if (gameState.mapCompleted) q = updateQuestProgress(q, 'complete_maps', 1);
        if (gameState.coinsEarned > 0) q = updateQuestProgress(q, 'earn_coins', gameState.coinsEarned);
        if (gameState.bombsPlaced > 0) q = updateQuestProgress(q, 'place_bombs', gameState.bombsPlaced);
        if (gameState.chestsOpened > 0) q = updateQuestProgress(q, 'open_chests', gameState.chestsOpened);
        return q;
      });
    }
    setGameState(null);
    setCurrentStoryStage(null);
    if (currentStoryStage) {
      const regionIdx = STORY_REGIONS.findIndex(r => r.id === currentStoryStage.regionId);
      if (regionIdx >= 0) setStoryRegionIdx(regionIdx);
    }
    setScreen('story');
  };

  const [summonedBatch, setSummonedBatch] = useState<Hero[]>([]);

  const handleSummon = (type: 'single' | 'x10' | 'x100') => {
    const cost = type === 'single' ? 100 : type === 'x10' ? 900 : 8000;
    if (player.bomberCoins < cost) return;

    const count = type === 'single' ? 1 : type === 'x10' ? 10 : 100;
    let currentPity = { ...player.pityCounters };
    let newCoins = player.bomberCoins - cost;
    const newHeroes = [...player.heroes];
    const batch: Hero[] = [];

    for (let i = 0; i < count; i++) {
      const { hero, updatedPity } = summonHero(currentPity);
      currentPity = updatedPity;
      newHeroes.push(hero);
      batch.push(hero);
    }

    let mergedHeroes = newHeroes;
    if (autoMerge && (type === 'x10' || type === 'x100')) {
      let mergeCount = 0;
      let madeProgress = true;
      while (madeProgress) {
        madeProgress = false;
        for (const recipe of MERGE_RECIPES) {
          const available = mergedHeroes.filter(h => h.rarity === recipe.from);
          if (available.length >= recipe.count) {
            const toRemove = new Set(available.slice(0, recipe.count).map(h => h.id));
            const newHero = generateHero(recipe.to);
            mergedHeroes = [...mergedHeroes.filter(h => !toRemove.has(h.id)), newHero];
            mergeCount++;
            madeProgress = true;
            break;
          }
        }
      }
      if (mergeCount > 0) {
        toast({
          title: "Fusion automatique",
          description: `${mergeCount} fusion(s) effectuée(s) après invocation`,
        });
      }
    }

    setLastSummoned(batch[batch.length - 1]);
    setSummonedBatch(batch);
    setPlayer(prev => ({
      ...prev,
      bomberCoins: newCoins,
      heroes: mergedHeroes,
      pityCounters: currentPity,
      totalHeroesOwned: mergedHeroes.length,
    }));
    // Save all new heroes; if autoMerge removed some, delete them from Supabase too
    saveHeroesToCloud(mergedHeroes.filter(h => !player.heroes.some(existing => existing.id === h.id)));
    const removedByMerge = newHeroes.filter(h => !mergedHeroes.some(m => m.id === h.id)).map(h => h.id);
    if (removedByMerge.length > 0) removeHeroesFromCloud(removedByMerge);
    setDailyQuests(prev => updateQuestProgress(prev, 'summon_heroes', count));
  };

  const toggleHeroSelection = (id: string) => {
    setSelectedHeroes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 6) next.add(id);
      return next;
    });
  };

  const autoSelectHeroes = () => {
    const sorted = [...player.heroes]
      .filter(h => h.currentStamina > 0)
      .sort((a, b) => {
        const rarityOrder = ['super-legend', 'legend', 'epic', 'super-rare', 'rare', 'common'];
        const rDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        if (rDiff !== 0) return rDiff;
        const totalA = a.stats.pwr + a.stats.spd + a.stats.rng + a.stats.bnb + a.stats.lck;
        const totalB = b.stats.pwr + b.stats.spd + b.stats.rng + b.stats.bnb + b.stats.lck;
        return totalB - totalA;
      });
    setSelectedHeroes(new Set(sorted.slice(0, 6).map(h => h.id)));
  };

  const handleUpgrade = (heroId: string) => {
    const hero = player.heroes.find(h => h.id === heroId);
    if (!hero || hero.level >= 10) return;
    const cost = getUpgradeCost(hero.level);
    if (player.bomberCoins < cost) return;
    const upgraded = upgradeHero(hero);
    setPlayer(prev => ({
      ...prev,
      bomberCoins: prev.bomberCoins - cost,
      heroes: prev.heroes.map(h => h.id === heroId ? upgraded : h),
    }));
    saveHeroesToCloud([upgraded]);
    setDailyQuests(prev => updateQuestProgress(prev, 'upgrade_hero', 1));
  };

  const handleAscend = (heroId: string) => {
    const hero = player.heroes.find(h => h.id === heroId);
    if (!hero || hero.level < 10 || hero.stars >= 3) return;
    const info = getAscensionCost(hero.stars);
    if (!info) return;
    const dupes = countDuplicates(player.heroes, heroId, hero.rarity);
    if (player.bomberCoins < info.cost || dupes < info.duplicates) return;

    let removedCount = 0;
    const removedIds: string[] = [];
    const remainingHeroes = player.heroes.filter(h => {
      if (h.id === heroId) return true;
      if (h.rarity === hero.rarity && h.id !== heroId && removedCount < info.duplicates) {
        removedCount++;
        removedIds.push(h.id);
        return false;
      }
      return true;
    });

    const ascended = ascendHero(hero);
    setPlayer(prev => ({
      ...prev,
      bomberCoins: prev.bomberCoins - info.cost,
      heroes: remainingHeroes.map(h => h.id === heroId ? ascended : h),
    }));
    removeHeroesFromCloud(removedIds);
    saveHeroesToCloud([ascended]);
  };

  const upgradeHeroData = upgradeHeroId ? player.heroes.find(h => h.id === upgradeHeroId) ?? null : null;

  const handleClaimQuest = (questId: string) => {
    const quest = dailyQuests.quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;
    setPlayer(prev => ({
      ...prev,
      bomberCoins: prev.bomberCoins + quest.reward,
      xp: prev.xp + quest.xpReward,
    }));
    setDailyQuests(prev => ({
      ...prev,
      quests: prev.quests.map(q => q.id === questId ? { ...q, claimed: true } : q),
    }));
  };

  const handleClaimDailyBonus = () => {
    if (dailyQuests.allClaimedBonus) return;
    if (!dailyQuests.quests.every(q => q.claimed)) return;
    setPlayer(prev => ({
      ...prev,
      bomberCoins: prev.bomberCoins + ALL_CLAIMED_BONUS,
      xp: prev.xp + ALL_CLAIMED_XP_BONUS,
    }));
    setDailyQuests(prev => ({ ...prev, allClaimedBonus: true }));
  };

  const isInBattle = screen === 'treasure-hunt' || screen === 'story-battle';

  if (isCloudLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="font-pixel text-primary text-xs animate-pulse tracking-widest">CHARGEMENT...</div>
        <div className="font-pixel text-muted-foreground text-[10px]">Synchronisation du cloud</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-2 sm:px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bomb size={18} className="text-primary shrink-0" />
          <h1 className="font-pixel text-[8px] sm:text-xs text-foreground tracking-wider hidden xs:block">BOMBERQUEST</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <button
            onClick={toggleMute}
            className="p-2 sm:p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-w-[44px] sm:min-w-[auto] min-h-[36px] sm:min-h-[auto] flex items-center justify-center"
            title={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="flex items-center gap-1.5 pixel-border px-2 sm:px-3 py-1.5 bg-muted">
            <Coins size={14} className="text-game-gold shrink-0" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-game-gold">
              {(player.bomberCoins + (gameState?.coinsEarned || 0)).toLocaleString()}
              {gameState?.coinsEarned ? <span className="text-[8px] opacity-70 ml-1">(+{gameState.coinsEarned})</span> : null}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Star size={12} /> Lv.{player.accountLevel}
            <span className="text-border">|</span>
            <Users size={12} /> {player.heroes.length}
          </div>
          <div className="flex sm:hidden items-center gap-1 text-[9px] text-muted-foreground">
            <Star size={10} /> {player.accountLevel}
            <Users size={10} /> {player.heroes.length}
          </div>
          {user && (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 sm:p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-w-[44px] sm:min-w-[auto] min-h-[36px] sm:min-h-[auto] flex items-center justify-center"
                title="Profil"
              >
                <User size={16} />
              </button>
              <button
                onClick={async () => { await signOut(); navigate('/'); }}
                className="p-2 sm:p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-w-[44px] sm:min-w-[auto] min-h-[36px] sm:min-h-[auto] flex items-center justify-center"
                title="Déconnexion"
              >
                <DoorOpen size={16} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Navigation */}
      {!isInBattle && (
        <nav className="sticky top-[49px] sm:top-[49px] z-30 bg-card/90 backdrop-blur border-b border-border px-1 sm:px-2 py-1.5 flex gap-1 overflow-x-auto">
          {[
            { id: 'hub' as Screen, label: 'Hub', icon: <Home size={14} /> },
            { id: 'story' as Screen, label: 'Histoire', icon: <BookOpen size={14} /> },
            { id: 'heroes' as Screen, label: 'Héros', icon: <Users size={14} /> },
            { id: 'summon' as Screen, label: 'Invoquer', icon: <Sparkles size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'summon') setSummonOpen(true);
                else setScreen(tab.id);
              }}
              className={`font-pixel text-[7px] sm:text-[8px] px-2.5 sm:px-3 py-2.5 sm:py-2 rounded flex items-center gap-1.5 transition-all whitespace-nowrap min-h-[44px] ${
                screen === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      <main className="p-4 max-w-6xl mx-auto">
        {/* HUB SCREEN */}
        {screen === 'hub' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Hero Banner - Compact */}
            <div className="text-center py-4">
              <h2 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red mb-1">
                💣 BOMBERQUEST
              </h2>
              <p className="text-xs text-muted-foreground">Idle Bomber • Collect & Upgrade</p>
            </div>

            {/* Quick Stats + XP Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'BomberCoins', value: player.bomberCoins.toLocaleString(), icon: <Coins size={20} className="text-game-gold" />, glow: 'glow-gold' },
                { label: 'Héros', value: `${player.heroes.length}`, icon: <Users size={20} className="text-primary" />, glow: '' },
                { label: 'Cartes', value: `${player.mapsCompleted}`, icon: <Map size={20} className="text-game-neon-blue" />, glow: '' },
                { label: 'Niveau', value: `${player.accountLevel}`, icon: <Trophy size={20} className="text-game-gold" />, glow: '' },
              ].map(stat => (
                <div key={stat.label} className={`pixel-border bg-card p-3 text-center ${stat.glow}`}>
                  <div className="flex justify-center mb-1">{stat.icon}</div>
                  <p className="font-pixel text-[10px] text-foreground mt-1">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* XP Progress Bar */}
            {(() => {
              let xpRemaining = player.xp;
              let lvl = 1;
              let xpForLevel = 100;
              while (xpRemaining >= xpForLevel) {
                xpRemaining -= xpForLevel;
                lvl++;
                xpForLevel = lvl * 100;
              }
              const nextLevelXp = (lvl) * 100;
              const pct = Math.round((xpRemaining / nextLevelXp) * 100);
              return (
                <div className="pixel-border bg-card p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-pixel text-[9px] text-foreground flex items-center gap-1">
                      <Star size={12} className="text-game-gold" /> Niveau {player.accountLevel}
                    </span>
                    <span className="font-pixel text-[8px] text-muted-foreground">
                      {xpRemaining} / {nextLevelXp} XP
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-game-gold rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Daily Quests */}
            <DailyQuests
              quests={dailyQuests}
              onClaim={handleClaimQuest}
              onClaimBonus={handleClaimDailyBonus}
            />

            {/* Story Mode CTA */}
            <button
              onClick={() => setScreen('story')}
              className="pixel-btn w-full font-pixel text-xs flex items-center justify-center gap-2 glow-red"
            >
              <BookOpen size={16} /> MODE HISTOIRE
              <span className="text-[8px] opacity-70">({storyProgress.completedStages.length} étapes)</span>
            </button>

            {/* Treasure Hunt Launcher */}
            <div className="pixel-border bg-card p-4">
              <h3 className="font-pixel text-xs text-foreground mb-1 flex items-center gap-2">
                <Map size={16} /> CHASSE AU TRÉSOR
              </h3>
              <p className="text-[8px] text-muted-foreground mb-3 flex items-center gap-1">
                <Trophy size={10} /> {player.mapsCompleted} cartes complétées
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {MAP_CONFIGS.map((mapCfg, i) => {
                  const unlocked = player.mapsCompleted >= mapCfg.unlockMaps && player.accountLevel >= mapCfg.unlockLevel;
                  return (
                    <button
                      key={i}
                      onClick={() => unlocked && setSelectedMap(i)}
                      disabled={!unlocked}
                      className={`pixel-border p-3 text-left transition-all relative ${
                        !unlocked
                          ? 'bg-muted/30 opacity-50 cursor-not-allowed'
                          : selectedMap === i
                            ? 'bg-primary/15 ring-2 ring-primary/50 scale-[1.02]'
                            : 'bg-muted hover:bg-muted/80 hover:scale-[1.01]'
                      }`}
                    >
                      {selectedMap === i && unlocked && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Check size={12} className="text-primary-foreground" />
                        </div>
                      )}
                      {!unlocked && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center shadow-md">
                          <LockIcon size={10} className="text-destructive-foreground" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <PixelIcon icon={mapCfg.icon} size={20} />
                        <p className="font-pixel text-[8px] text-foreground">{mapCfg.name}</p>
                      </div>
                      {unlocked ? (
                        <>
                          <p className="text-[9px] text-muted-foreground">{mapCfg.width}×{mapCfg.height} • {mapCfg.chests} coffres</p>
                          <p className="text-[9px] text-game-gold flex items-center gap-1 mt-0.5">
                            <Coins size={10} /> ~{mapCfg.reward} BC
                          </p>
                        </>
                      ) : (
                        <div className="text-[8px] text-destructive mt-1 space-y-0.5">
                          {player.mapsCompleted < mapCfg.unlockMaps && (
                            <p className="flex items-center gap-1"><LockIcon size={9} /> {mapCfg.unlockMaps} cartes ({player.mapsCompleted}/{mapCfg.unlockMaps})</p>
                          )}
                          {player.accountLevel < mapCfg.unlockLevel && (
                            <p className="flex items-center gap-1"><LockIcon size={9} /> Niveau {mapCfg.unlockLevel} (actuel: {player.accountLevel})</p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mon Équipe - Slot-based selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-pixel text-[8px] text-foreground flex items-center gap-1.5">
                    <Users size={12} /> MON ÉQUIPE ({selectedHeroes.size}/6)
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={autoSelectHeroes}
                      className="font-pixel text-[7px] px-2.5 py-1.5 rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={10} /> Auto-sélection
                    </button>
                    {selectedHeroes.size > 0 && (
                      <button
                        onClick={() => setSelectedHeroes(new Set())}
                        className="font-pixel text-[7px] px-2.5 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                </div>

                {/* 6 Slots */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  {Array.from({ length: 6 }).map((_, slotIdx) => {
                    const heroId = Array.from(selectedHeroes)[slotIdx];
                    const hero = heroId ? player.heroes.find(h => h.id === heroId) : null;
                    return (
                      <div
                        key={slotIdx}
                        className={`pixel-border p-2 flex flex-col items-center justify-center min-h-[72px] transition-all ${
                          hero ? `bg-card rarity-${hero.rarity}` : 'bg-muted/30 border-dashed'
                        }`}
                      >
                        {hero ? (
                          <>
                            <PixelIcon icon={hero.icon} size={22} rarity={hero.rarity} />
                            <p className="font-pixel text-[7px] text-foreground mt-1 truncate w-full text-center">{hero.name.split(' ')[0]}</p>
                            <p className="text-[7px] mt-0.5" style={{ color: `hsl(var(--game-rarity-${hero.rarity}))` }}>
                              {RARITY_CONFIG[hero.rarity].label}
                            </p>
                            <button
                              onClick={() => toggleHeroSelection(hero.id)}
                              className="text-[7px] text-destructive hover:text-destructive/80 mt-0.5 min-w-[24px] min-h-[24px] flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <p className="font-pixel text-[7px] text-muted-foreground">Slot {slotIdx + 1}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Expandable hero picker */}
                <details className="pixel-border bg-muted/20 rounded">
                  <summary className="font-pixel text-[8px] text-muted-foreground cursor-pointer px-3 py-2 flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Users size={10} /> Choisir manuellement ({player.heroes.length} héros disponibles)
                  </summary>
                  <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                    {player.heroes
                      .sort((a, b) => {
                        const rarityOrder = ['super-legend', 'legend', 'epic', 'super-rare', 'rare', 'common'];
                        return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
                      })
                      .map(hero => (
                        <HeroCard
                          key={hero.id}
                          hero={hero}
                          compact
                          selected={selectedHeroes.has(hero.id)}
                          onClick={() => toggleHeroSelection(hero.id)}
                        />
                      ))}
                  </div>
                </details>
              </div>

              <button onClick={startTreasureHunt} className="pixel-btn pixel-btn-gold w-full font-pixel text-xs flex items-center justify-center gap-2">
                <Swords size={16} /> LANCER LA CHASSE !
              </button>
            </div>

            {/* Quick link to all heroes */}
            <button onClick={() => setScreen('heroes')} className="pixel-btn pixel-btn-secondary w-full font-pixel text-[8px] flex items-center justify-center gap-2">
              <Users size={12} /> Gérer tous les héros ({player.heroes.length})
            </button>

            <button
              onClick={() => setSummonOpen(true)}
              className="pixel-btn pixel-btn-gold w-full font-pixel text-xs glow-gold flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> INVOQUER UN HÉROS (100 BC)
            </button>
          </motion.div>
        )}

        {/* STORY MODE SCREEN */}
        {screen === 'story' && (
          <StoryMode
            player={player}
            storyProgress={storyProgress}
            selectedHeroes={selectedHeroes}
            onToggleHero={toggleHeroSelection}
            onAutoSelectHeroes={autoSelectHeroes}
            onClearSelectedHeroes={() => setSelectedHeroes(new Set())}
            onStartStage={startStoryStage}
            selectedRegionIdx={storyRegionIdx}
            onRegionChange={setStoryRegionIdx}
          />
        )}

        {/* BATTLE SCREENS (treasure hunt & story) */}
        {isInBattle && gameState && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Game HUD */}
            <div className="pixel-border bg-card p-2.5 space-y-2">
              {/* Top row: stats + controls */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Stats */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted">
                    <Coins size={12} className="text-game-gold" />
                    <span className="font-pixel text-[9px] text-game-gold">+{gameState.coinsEarned}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted">
                    <span className="text-[10px]">💣</span>
                    <span className="font-pixel text-[9px] text-muted-foreground">{gameState.bombsPlaced}</span>
                  </div>
                  {!gameState.isStoryMode && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/15">
                      <span className="text-[10px]">📦</span>
                      <span className="font-pixel text-[9px] text-primary">
                        {gameState.chestsOpened}/{gameState.map.chests.length}
                      </span>
                    </div>
                  )}
                  {gameState.isStoryMode && (
                    <>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/15">
                        <Skull size={12} className="text-destructive" />
                        <span className="font-pixel text-[9px] text-destructive">
                          {gameState.enemies?.filter(e => e.hp > 0).length || 0} restants
                        </span>
                      </div>
                      {(gameState.enemiesKilled || 0) > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/15">
                          <Swords size={12} className="text-primary" />
                          <span className="font-pixel text-[9px] text-primary">{gameState.enemiesKilled} tués</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const nextSpeed = gameState.speed === 1 ? 2 : gameState.speed === 2 ? 3 : 1;
                      huntSpeedRef.current = nextSpeed;
                      if (user) {
                        // Persist speed preference in Supabase for authenticated users
                        setPlayer(prev => ({ ...prev, huntSpeed: nextSpeed }));
                      } else {
                        localStorage.setItem('hunt-speed', String(nextSpeed));
                      }
                      setGameState(prev => (prev ? { ...prev, speed: nextSpeed } : prev));
                    }}
                    className="font-pixel text-[8px] sm:text-[7px] px-3 py-2.5 sm:py-1.5 rounded transition-all bg-primary text-primary-foreground shadow-md min-w-[44px] sm:min-w-[38px] min-h-[44px] sm:min-h-[auto]"
                    title="Vitesse de chasse"
                  >
                    x{gameState.speed}
                  </button>
                  <div className="w-px h-5 bg-border mx-0.5 hidden sm:block" />
                  <button
                    onClick={() => setGameState(prev => prev ? { ...prev, isPaused: !prev.isPaused } : prev)}
                    className="font-pixel text-[8px] px-3 py-2.5 sm:py-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1 min-h-[44px] sm:min-h-[auto]"
                  >
                    {gameState.isPaused ? <Play size={14} className="sm:size-[10px]" /> : <Pause size={14} className="sm:size-[10px]" />}
                    <span className="hidden sm:inline">{gameState.isPaused ? 'Play' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={gameState.isStoryMode ? endStoryBattle : endTreasureHunt}
                    className={`font-pixel text-[8px] px-3 py-2.5 sm:py-1.5 rounded flex items-center gap-1 min-h-[44px] sm:min-h-[auto] ${
                      gameState.mapCompleted 
                        ? 'bg-game-gold text-background font-bold animate-pulse' 
                        : 'bg-destructive/80 text-destructive-foreground hover:bg-destructive'
                    }`}
                  >
                    {gameState.mapCompleted ? <><Check size={14} className="sm:size-[10px]" /> <span className="hidden sm:inline">Récupérer!</span></> : <><DoorOpen size={14} className="sm:size-[10px]" /> <span className="hidden sm:inline">Quitter</span></>}
                  </button>
                </div>
              </div>

              {/* Hero stamina bars - compact inline */}
              <div className="flex gap-2 flex-wrap">
                {gameState.heroes.map(hero => {
                  const staminaPct = Math.round((hero.currentStamina / hero.maxStamina) * 100);
                  const isLow = staminaPct < 30;
                  const isResting = hero.state === 'resting';
                  return (
                    <div key={hero.id} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] ${
                      isResting ? 'bg-muted/50 opacity-60' : 'bg-muted'
                    }`}>
                      <span className="font-pixel text-[7px] text-foreground truncate max-w-[60px]">{hero.name}</span>
                      <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isLow ? 'bg-game-energy-low' : 'bg-game-energy-green'
                          }`}
                          style={{ width: `${staminaPct}%` }}
                        />
                      </div>
                      <span className={`font-pixel text-[7px] ${isLow ? 'text-game-energy-low' : 'text-muted-foreground'}`}>
                        {isResting ? '💤' : `${staminaPct}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Boss HP bar (story mode) */}
            {gameState.isStoryMode && gameState.boss && gameState.boss.hp > 0 && (
              <div className="pixel-border bg-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-pixel text-[8px] text-destructive flex items-center gap-1">
                    <Skull size={12} /> {gameState.boss.name}
                  </span>
                  <span className="font-pixel text-[8px] text-muted-foreground">
                    {gameState.boss.hp}/{gameState.boss.maxHp} HP
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-destructive transition-all duration-300"
                    style={{ width: `${(gameState.boss.hp / gameState.boss.maxHp) * 100}%` }}
                  />
                </div>
                {gameState.boss.invincible && (
                  <p className="font-pixel text-[7px] text-game-neon-blue mt-1 animate-pulse flex items-center gap-1">
                    <Shield size={10} /> INVINCIBLE
                  </p>
                )}
              </div>
            )}

            {/* Auto-farm indicator */}
            {autoFarm && (
              <div className="pixel-border bg-primary/10 p-2.5 flex items-center justify-between">
                <span className="font-pixel text-[8px] text-primary flex items-center gap-1.5">
                  <FastForward size={12} /> AUTO-FARM ACTIF
                  <span className="text-muted-foreground">• Run #{farmStats.runs + 1} • Total: {farmStats.totalCoins} BC</span>
                </span>
                <button
                  onClick={() => { setAutoFarm(false); endTreasureHunt(); }}
                  className="font-pixel text-[7px] px-2 py-1 rounded bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                >
                  Arrêter
                </button>
              </div>
            )}

            {/* Victory banner */}
            {gameState.mapCompleted && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="pixel-border bg-card p-5 text-center glow-gold"
              >
                <p className="font-pixel text-sm sm:text-base text-game-gold flex items-center justify-center gap-2 text-glow-gold">
                  <Trophy size={22} /> {gameState.isStoryMode ? '⚔️ VICTOIRE!' : '🗺️ CARTE COMPLÉTÉE!'}
                </p>
                <p className="font-pixel text-lg sm:text-xl text-game-gold mt-2 flex items-center justify-center gap-2">
                  <Coins size={20} /> +{gameState.coinsEarned + (currentStoryStage?.reward || 0)} BC
                </p>
                {gameState.isStoryMode && (
                  <p className="text-xs text-muted-foreground mt-1">
                    +{currentStoryStage?.xpReward || 0} XP • {gameState.enemiesKilled || 0} ennemis éliminés
                  </p>
                )}
                {gameState.bossDefeated && (
                  <p className="font-pixel text-xs text-destructive mt-2 animate-pulse">👑 BOSS VAINCU!</p>
                )}
                
                {autoFarm ? (
                  <p className="font-pixel text-[8px] text-primary mt-3 animate-pulse">
                    ⏳ Prochaine chasse dans quelques secondes...
                  </p>
                ) : (
                  <div className="flex gap-2 mt-4 justify-center flex-wrap">
                    <button
                      onClick={gameState.isStoryMode ? endStoryBattle : endTreasureHunt}
                      className="pixel-btn pixel-btn-gold font-pixel text-xs flex items-center gap-2"
                    >
                      <Check size={14} /> Récupérer
                    </button>
                    {!gameState.isStoryMode && (
                      <>
                        <button
                          onClick={() => collectAndContinue(true)}
                          className="pixel-btn font-pixel text-xs flex items-center gap-2"
                        >
                          <Play size={14} /> Continuer
                        </button>
                        <button
                          onClick={() => { setAutoFarm(true); collectAndContinue(true); }}
                          className="pixel-btn pixel-btn-secondary font-pixel text-[8px] flex items-center gap-1.5"
                        >
                          <FastForward size={12} /> Auto-Farm
                        </button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Grid */}
            <div className="flex justify-center">
              <GameGrid gameState={gameState} />
            </div>

            {/* Event log - collapsible */}
            <details className="pixel-border bg-card p-3">
              <summary className="font-pixel text-[8px] text-muted-foreground cursor-pointer flex items-center gap-1">
                <Scroll size={10} /> Journal ({gameState.eventLog.length})
              </summary>
              <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                {gameState.eventLog.slice().reverse().map((log, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground">{log}</p>
                ))}
              </div>
            </details>
          </motion.div>
        )}

        {/* HEROES SCREEN */}
        {screen === 'heroes' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
                <Users size={16} /> TOUS LES HÉROS ({player.heroes.length})
              </h2>
              <button onClick={() => setScreen('hub')} className="pixel-btn pixel-btn-secondary font-pixel text-[8px] flex items-center gap-1">
                <ChevronLeft size={12} /> Retour
              </button>
            </div>

            {/* Merge Section */}
            <div className="pixel-border bg-card p-4">
              <h3 className="font-pixel text-[9px] text-foreground mb-3 flex items-center gap-2">
                <Sparkles size={14} /> FUSION DE BOMBERS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MERGE_RECIPES.map(({ from, to, count }) => {
                  const available = player.heroes.filter(h => h.rarity === from).length;
                  const canMerge = available >= count;
                  return (
                    <button
                      key={`${from}-${to}`}
                      onClick={() => canMerge && handleMerge(from, to, count)}
                      disabled={!canMerge}
                      className={`pixel-border p-3 text-center transition-all ${
                        canMerge
                          ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer hover:scale-[1.02]'
                          : 'bg-muted/30 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="font-pixel text-[8px]" style={{ color: `hsl(var(--game-rarity-${from}))` }}>
                          {count}× {RARITY_CONFIG[from].label}
                        </span>
                        <span className="text-[8px] text-muted-foreground">→</span>
                        <span className="font-pixel text-[8px]" style={{ color: `hsl(var(--game-rarity-${to}))` }}>
                          1× {RARITY_CONFIG[to].label}
                        </span>
                      </div>
                      <p className="text-[7px] text-muted-foreground">
                        Disponible: {available}/{count}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <button 
                onClick={mergeAll}
                disabled={isMerging}
                className={`pixel-btn pixel-btn-primary font-pixel text-[8px] flex items-center justify-center gap-2 min-h-[44px] ${isMerging ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Sparkles size={14} /> {isMerging ? 'Fusion en cours...' : 'Tout fusionner'}
              </button>
              
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px] px-3 pixel-border bg-muted/30 hover:bg-muted/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={autoMerge}
                  onChange={(e) => setAutoMerge(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground">
                  Fusion auto après invocation x10/x100
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {player.heroes
                .sort((a, b) => {
                  const order = ['super-legend', 'legend', 'epic', 'super-rare', 'rare', 'common'];
                  return order.indexOf(a.rarity) - order.indexOf(b.rarity);
                })
                .map(hero => (
                  <HeroCard key={hero.id} hero={hero} onClick={() => setUpgradeHeroId(hero.id)} />
                ))}
            </div>
          </motion.div>
        )}
      </main>

      <HeroUpgradeModal
        hero={upgradeHeroData}
        coins={player.bomberCoins}
        allHeroes={player.heroes}
        onClose={() => setUpgradeHeroId(null)}
        onUpgrade={handleUpgrade}
        onAscend={handleAscend}
      />

      <SummonModal
        isOpen={summonOpen}
        onClose={() => setSummonOpen(false)}
        onSummon={handleSummon}
        coins={player.bomberCoins}
        lastSummoned={lastSummoned}
        summonedBatch={summonedBatch}
        pityCounters={player.pityCounters}
      />
    </div>
  );
};

export default Index;
