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
import { generateMap, tickGame, XP_REWARDS } from '@/game/engine';
import { summonHero, generateHero } from '@/game/summoning';
import { loadPlayerData, savePlayerData, getDefaultPlayerData, saveStoryProgress, loadStoryProgress } from '@/game/saveSystem';
import { getUpgradeCost, upgradeHero, ascendHero, getAscensionCost, countDuplicates, isHeroMaxLevel, getMaxLevel, addXp } from '@/game/upgradeSystem';
import { trackSummon, trackCombatVictory, trackLevelUp, trackRarityUnlock, trackChestsOpened, trackBossDefeated, trackHeroCount, claimAchievementReward, AchievementDefinition } from '@/game/achievements';
import { DailyQuestData, loadDailyQuests, saveDailyQuests, generateDailyQuests, updateQuestProgress, ALL_CLAIMED_BONUS, ALL_CLAIMED_XP_BONUS } from '@/game/questSystem';
import { StoryProgress, StoryStage, BOSS_LEVEL_BY_TYPE, BOSS_RARITY_REWARD, BossType } from '@/game/storyTypes';
import { spawnEnemy, spawnBoss, tickEnemies, tickBoss, damageEnemiesFromExplosion, damageBossFromExplosion, checkEnemyHeroCollision, checkBossHeroCollision } from '@/game/enemyAI';
import { STORY_REGIONS } from '@/game/storyData';
import { getExplosionTiles } from '@/game/engine';
import DailyQuests from '@/components/DailyQuests';
import Achievements from '@/components/Achievements';
import PixelIcon from '@/components/PixelIcon';
import { Home, Users, Sparkles, Swords, Map, Trophy, Coins, Star, ChevronLeft, Play, Pause, DoorOpen, Check, Scroll, FastForward, BookOpen, Shield, Skull, Bomb, Lock as LockIcon, Volume2, VolumeX, User } from 'lucide-react';
import { SFX, isMuted, setMuted } from '@/game/sfx';
import { toast } from '@/hooks/use-toast';

type Screen = 'hub' | 'treasure-hunt' | 'heroes' | 'summon' | 'story' | 'story-battle' | 'achievements';


const LOCAL_SAVE_TS_KEY = 'bq_last_local_save_ts';
const LOCAL_HERO_MUTATION_TS_KEY = 'bq_last_hero_mutation_ts';

const markLocalSave = () => {
  localStorage.setItem(LOCAL_SAVE_TS_KEY, String(Date.now()));
};

const markHeroMutation = () => {
  const now = Date.now();
  localStorage.setItem(LOCAL_HERO_MUTATION_TS_KEY, String(now));
  localStorage.setItem(LOCAL_SAVE_TS_KEY, String(now));
};

const Index = () => {
  const { user, session, loading: authLoading, signOut } = useAuth();
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
      ? { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] }
      : loadStoryProgress()
  );
  const [currentStoryStage, setCurrentStoryStage] = useState<StoryStage | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [isCloudLoading, setIsCloudLoading] = useState(!!user);
  const [cloudValidated, setCloudValidated] = useState(false);
  const [autoFarm, setAutoFarm] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [farmStats, setFarmStats] = useState({ runs: 0, totalCoins: 0 });
  const [storyRegionIdx, setStoryRegionIdx] = useState(0);
  const huntSpeedRef = useRef(1);
  const gameLoopRef = useRef<number>();
  const cloudLoadedRef = useRef(false);
  const lastLocalSaveRef = useRef<number>(Date.now());
  const isInitialMountRef = useRef(true);
  const localHeroCountRef = useRef(0);

  useEffect(() => {
    // For guests: restore speed from localStorage. For auth users: cloud load handles it.
    if (!user) {
      const saved = Number(localStorage.getItem('hunt-speed') || '1');
      huntSpeedRef.current = saved === 2 || saved === 3 ? saved : 1;
    }
  }, []);
  const lastTickRef = useRef<number>(Date.now());
  const processedExplosionsRef = useRef<Set<string>>(new Set());

  const cloudSessionReady = Boolean(user?.id && session?.access_token && !authLoading);
  const canWriteCloud = cloudSessionReady && cloudValidated;
  const { loadFromCloud, saveHeroesToCloud, removeHeroesFromCloud, saveStatsToCloud, syncHeroesSnapshotToCloud } = useCloudSave(user?.id, canWriteCloud);

  const toggleMute = () => {
    const newVal = !muted;
    setMutedState(newVal);
    setMuted(newVal);
  };

  useEffect(() => {
    cloudLoadedRef.current = false;
    setCloudValidated(false);

    if (!user) {
      setIsCloudLoading(false);
      return;
    }

    setIsCloudLoading(true);
    console.log('CLOUD_LOAD_ARMED', {
      userId: user.id,
      authLoading,
      hasAccessToken: !!session?.access_token,
    });
  }, [user?.id]);

  // Save to localStorage when player data changes (offline mode + authenticated safety backup)
  useEffect(() => {
    if (isCloudLoading) return;
    if (!isInitialMountRef.current) {
      savePlayerData(player);
      saveDailyQuests(dailyQuests);
      saveStoryProgress(storyProgress);
      markLocalSave();
      lastLocalSaveRef.current = Date.now();
    }
  }, [player, dailyQuests, storyProgress, user, isCloudLoading]);

  // Track initial mount completion
  useEffect(() => {
    isInitialMountRef.current = false;
  }, []);

  // Load from cloud on mount (connected users only) - prevents rollback on navigation
  useEffect(() => {
    if (!user) return;
    if (!cloudSessionReady) return;
    if (cloudLoadedRef.current) {
      console.log('CLOUD_LOAD_SKIP', { reason: 'already_loaded', heroCount: player.heroes.length });
      return;
    }

    setIsCloudLoading(true);

    const CLOUD_LOAD_TIMEOUT = 3500;
    const RETRY_DELAY_MS = 400;
    const MAX_RETRIES = 0;

    const loadWithRetry = async (retryCount = 0): Promise<any> => {
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), CLOUD_LOAD_TIMEOUT);
      });

      try {
        const data = await Promise.race([loadFromCloud(), timeoutPromise]);
        return data;
      } catch (err) {
        const error = err as Error & { code?: string };
        console.error('CLOUD_LOAD_ERROR', { code: error.code || 'UNKNOWN', message: error.message, retryCount });
        
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return loadWithRetry(retryCount + 1);
        }
        return null;
      }
    };

    loadWithRetry().then(data => {
      if (data) {
        const cloudHeroes = data.playerData?.heroes || [];
        const cloudHeroCount = cloudHeroes.length;
        const localBackupData = loadPlayerData();
        const localBackupHeroes = localBackupData.heroes || [];
        const localBackupHeroCount = localBackupHeroes.length;
        const runtimeLocalHeroCount = localHeroCountRef.current;
        const trustedLocalHeroCount = Math.max(localBackupHeroCount, runtimeLocalHeroCount);

        const cloudHeroIds = new Set(cloudHeroes.map(h => h.id));
        const localHeroIds = new Set(localBackupHeroes.map(h => h.id));
        const heroesDiverged = cloudHeroCount !== localBackupHeroCount
          || localBackupHeroes.some(h => !cloudHeroIds.has(h.id))
          || cloudHeroes.some(h => !localHeroIds.has(h.id));

        const lastHeroMutationTs = Number(localStorage.getItem(LOCAL_HERO_MUTATION_TS_KEY) || '0');
        const lastLocalSaveTs = Number(localStorage.getItem(LOCAL_SAVE_TS_KEY) || '0');
        const freshestLocalTs = Math.max(lastHeroMutationTs, lastLocalSaveTs, lastLocalSaveRef.current || 0);
        const LOCAL_FRESH_WINDOW_MS = 10 * 60 * 1000; // 10 min
        const hasFreshLocalState = freshestLocalTs > 0 && (Date.now() - freshestLocalTs) <= LOCAL_FRESH_WINDOW_MS;

        // Detect potential rollback both directions:
        // - cloud has fewer heroes than trusted local
        // - OR cloud/local hero sets diverge right after a recent local hero mutation (typical profile round-trip race)
        const isPotentialRollback =
          (trustedLocalHeroCount > cloudHeroCount && trustedLocalHeroCount > 1)
          || (hasFreshLocalState && heroesDiverged && localBackupHeroCount > 1);

        if (isPotentialRollback) {
          console.warn('CLOUD_ROLLBACK_GUARD', {
            trustedLocalHeroCount,
            localBackupHeroCount,
            runtimeLocalHeroCount,
            cloudHeroCount,
            heroesDiverged,
            hasFreshLocalState,
            freshestLocalTs,
            action: 'keep_local_read_only',
          });
          setPlayer(localBackupData);
          setStoryProgress(loadStoryProgress());
          const localQuests = loadDailyQuests();
          const today = new Date().toISOString().split('T')[0];
          setDailyQuests(localQuests?.date === today ? localQuests : generateDailyQuests());
          // Keep local state (newer than cloud) and allow a write-back to heal cloud drift.
          // Blocking writes here caused users to stay in permanent "Sync cloud en attente" mode.
          setCloudValidated(true);
          cloudLoadedRef.current = true;
          toast({ title: 'Sync cloud en cours', description: 'Sauvegarde locale conservée. Mise à jour cloud en arrière-plan.', duration: 4500 });
          return;
        }

        setPlayer(data.playerData);
        setStoryProgress(data.storyProgress ?? { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0 });
        const today = new Date().toISOString().split('T')[0];
        setDailyQuests(data.dailyQuests?.date === today ? data.dailyQuests : generateDailyQuests());
        const cloudSpeed = data.playerData.huntSpeed;
        if (cloudSpeed === 2 || cloudSpeed === 3) {
          huntSpeedRef.current = cloudSpeed;
        }
        setCloudValidated(true);
        cloudLoadedRef.current = true;
        console.log('CLOUD_LOAD_SUCCESS', {
          hasPlayerData: !!data.playerData,
          heroCount: data.playerData?.heroes?.length || 0,
          hasStoryProgress: !!data.storyProgress,
          timestamp: Date.now()
        });
      } else {
        const localData = loadPlayerData();
        const localStory = loadStoryProgress();
        const localQuests = loadDailyQuests();
        setPlayer(localData);
        setStoryProgress(localStory);
        const today = new Date().toISOString().split('T')[0];
        setDailyQuests(localQuests?.date === today ? localQuests : generateDailyQuests());
        const localSpeed = Number(localStorage.getItem('hunt-speed') || '1');
        if (localSpeed === 2 || localSpeed === 3) {
          huntSpeedRef.current = localSpeed;
          setPlayer(prev => ({ ...prev, huntSpeed: localSpeed }));
        }
        setCloudValidated(false);
        console.warn('CLOUD_LOAD_FAILED', {
          code: 'CLOUD_UNAVAILABLE',
          message: 'Cloud load failed, using local data in read-only mode',
          localHeroCount: localData.heroes?.length || 0
        });
        cloudLoadedRef.current = true;
        toast({ title: 'Cloud indisponible', description: 'Données locales chargées. Mode lecture seule.', duration: 4000 });
      }
    }).catch((err) => {
      const error = err as Error & { code?: string };
      console.error('CLOUD_LOAD_UNEXPECTED_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
      setCloudValidated(false);
      const localData = loadPlayerData();
      const localStory = loadStoryProgress();
      const localQuests = loadDailyQuests();
      setPlayer(localData);
      setStoryProgress(localStory);
      const today = new Date().toISOString().split('T')[0];
      setDailyQuests(localQuests?.date === today ? localQuests : generateDailyQuests());
      cloudLoadedRef.current = true;
      toast({ title: 'Cloud indisponible', description: 'Données locales chargées. Mode lecture seule.', duration: 4000 });
    }).finally(() => {
      setIsCloudLoading(false);
    });
  }, [user?.id, cloudSessionReady, loadFromCloud]);

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
      const { newState, unlocked } = trackLevelUp(player.achievements, newLevel);
      setPlayer(prev => ({ 
        ...prev, 
        accountLevel: getAccountLevel(prev.xp),
        achievements: newState,
      }));
      for (const achievement of unlocked) {
        toast({
          title: '🏆 Succès débloqué!',
          description: achievement.title,
        });
      }
    }
  }, [player.xp, player.accountLevel, player.achievements]);

  // Track local hero count for rollback detection
  useEffect(() => {
    localHeroCountRef.current = player.heroes.length;
  }, [player.heroes]);

  // Save periodically + passive stamina regen
  useEffect(() => {
    const interval = setInterval(() => {
      if (canWriteCloud) {
        saveStatsToCloud(player, storyProgress, dailyQuests);
        syncHeroesSnapshotToCloud(player.heroes);
      } else if (!user) {
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
  }, [user, canWriteCloud, player, dailyQuests, storyProgress, gameState?.isRunning, saveStatsToCloud, syncHeroesSnapshotToCloud]);

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
                // Give XP to hero who placed the bomb
                if (exp.heroId) {
                  const heroIdx = heroes.findIndex(h => h.id === exp.heroId);
                  if (heroIdx >= 0) {
                    const xpReward = kills * XP_REWARDS.enemyKilled;
                    heroes[heroIdx] = addXp(heroes[heroIdx], xpReward);
                    eventLog.push(`✨ ${heroes[heroIdx].name} gagne ${xpReward} XP!`);
                  }
                }
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

              // Friendly fire en mode histoire: bombes alliées blessent les autres héros
              if (state.isStoryMode) {
                for (const h of state.heroes) {
                  // Ne pas blesser le héros qui a posé la bombe
                  if (h.id === exp.heroId) continue;
                  if (h.state === 'resting') continue;
                  const hx = Math.round(h.position.x);
                  const hy = Math.round(h.position.y);
                  if (exp.tiles.some(t => t.x === hx && t.y === hy)) {
                    const damage = Math.floor(h.maxStamina * 0.15);
                    h.currentStamina = Math.max(0, h.currentStamina - damage);
                    eventLog.push(`💥 ${h.name} blessé par bombe alliée! -${damage} ST`);
                  }
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

        // Check story defeat: all heroes KO (stamina = 0 AND isActive = false)
        const allHeroesKO = heroes.every(h => h.currentStamina <= 0 && !h.isActive);
        const storyFailed = allHeroesKO && !storyComplete && !state.mapCompleted;

        if (storyComplete && !state.mapCompleted) {
          SFX.victory();
          eventLog.push(`🎉 Victoire! Tous les ennemis vaincus!`);
          if (boss && state.boss && state.boss.hp > 0) {
            eventLog.push(`👑 BOSS VAINCU: ${boss.name}!`);
          }
        }

        if (storyFailed) {
          eventLog.push(`💀 DÉFAITE! Tous les héros sont KO!`);
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
          storyFailed,
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
      if (!deployed) return h;
      return completed
        ? { ...h, ...deployed, currentStamina: deployed.maxStamina }
        : { ...h, ...deployed };
    });
    
    const newMapsCompleted = player.mapsCompleted + (completed ? 1 : 0);
    const newAchievements = { ...player.achievements };
    const newAchievementUnlocks: AchievementDefinition[] = [];
    
    if (completed) {
      const { newState, unlocked } = trackCombatVictory(player.achievements, newMapsCompleted);
      Object.assign(newAchievements, newState);
      newAchievementUnlocks.push(...unlocked);
    }

    const totalChestsOpened = player.mapsCompleted + (gameState.chestsOpened || 0);
    const { newState: chestState, unlocked: chestUnlocks } = trackChestsOpened(player.achievements, totalChestsOpened);
    Object.assign(newAchievements, chestState);
    newAchievementUnlocks.push(...chestUnlocks);
    
    setPlayer(prev => ({
      ...prev,
      bomberCoins: prev.bomberCoins + earned,
      mapsCompleted: newMapsCompleted,
      xp: prev.xp + earned,
      heroes: updatedHeroes,
      achievements: newAchievements,
    }));
    
    for (const achievement of newAchievementUnlocks) {
      toast({
        title: '🏆 Succès débloqué!',
        description: achievement.title,
      });
    }
    if (canWriteCloud) {
      saveHeroesToCloud(updatedHeroes.filter(h => gameState.heroes.some(dh => dh.id === h.id)));
    }

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

  // Merge system - heroes must be at max level to be merged
  const MERGE_RECIPES: { from: Rarity; to: Rarity; count: number }[] = [
    { from: 'common', to: 'rare', count: 2 },
    { from: 'rare', to: 'super-rare', count: 3 },
    { from: 'super-rare', to: 'epic', count: 4 },
    { from: 'epic', to: 'legend', count: 5 },
    { from: 'legend', to: 'super-legend', count: 6 },
  ];

  const handleMerge = (from: Rarity, to: Rarity, count: number) => {
    const available = player.heroes.filter(h => h.rarity === from && isHeroMaxLevel(h));
    if (available.length < count) {
      const totalOfRarity = player.heroes.filter(h => h.rarity === from).length;
      const maxedOfRarity = available.length;
      toast({
        title: "Fusion impossible",
        description: `Il faut des héros ${RARITY_CONFIG[from].label} niveau max. Vous avez ${maxedOfRarity}/${count} héros maxed.`,
      });
      return;
    }
    
    const toRemove = new Set(available.slice(0, count).map(h => h.id));
    const removedIds = Array.from(toRemove);
    const newHero = generateHero(to);
    const mergedHeroes = [...player.heroes.filter(h => !toRemove.has(h.id)), newHero];
    
    setPlayer(prev => ({
      ...prev,
      heroes: mergedHeroes,
      totalHeroesOwned: mergedHeroes.length,
    }));
    markHeroMutation();

    if (canWriteCloud) {
      saveHeroesToCloud([newHero]);
      removeHeroesFromCloud(removedIds);
    }
    
    toast({
      title: "Fusion réussie",
      description: `Héros ${RARITY_CONFIG[to].label} créé!`,
    });
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
        const available = currentHeroes.filter(h => h.rarity === recipe.from && isHeroMaxLevel(h));
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
      setPlayer(prev => ({ ...prev, heroes: currentHeroes, totalHeroesOwned: currentHeroes.length }));
      markHeroMutation();

      if (canWriteCloud) {
        const addedHeroes = currentHeroes.filter(h => !player.heroes.some(existing => existing.id === h.id));
        const removedHeroIds = player.heroes
          .filter(h => !currentHeroes.some(ch => ch.id === h.id))
          .map(h => h.id);

        if (addedHeroes.length > 0) saveHeroesToCloud(addedHeroes);
        if (removedHeroIds.length > 0) removeHeroesFromCloud(removedHeroIds);
      }

      toast({
        title: "Fusion terminée",
        description: `${mergeCount} fusion(s) effectuée(s)`,
      });
    } else {
      toast({
        title: "Aucune fusion possible",
        description: "Vous n'avez pas assez de héros niveau max pour fusionner",
      });
    }
    
    setIsMerging(false);
  }, [player.heroes, isMerging, canWriteCloud, saveHeroesToCloud, removeHeroesFromCloud]);

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
        currentStamina: h.maxStamina,
        position: { ...spawnPoints[i % spawnPoints.length] },
        targetPosition: null,
        path: null,
        state: 'idle' as const,
        isActive: true,
        stuckTimer: 0,
      }));

    if (deployedHeroes.length === 0) {
      const firstHero = { ...player.heroes[0] };
      firstHero.currentStamina = firstHero.maxStamina;
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

  const getNextStoryStage = (stage: StoryStage): StoryStage | null => {
    const region = STORY_REGIONS.find(r => r.id === stage.regionId);
    if (!region) return null;
    const idx = region.stages.findIndex(s => s.id === stage.id);
    if (idx < 0 || idx + 1 >= region.stages.length) return null;
    return region.stages[idx + 1];
  };

  const finalizeStoryBattle = (goToNextStage: boolean = false) => {
    if (!currentStoryStage) {
      setGameState(null);
      setScreen('story');
      return;
    }

    const stageSnapshot = currentStoryStage;
    const stateSnapshot = gameState;

    if (stateSnapshot) {
      let newHero: Hero | null = null;
      let rewardedRarity: Rarity | null = null;

      if (stateSnapshot.mapCompleted && stageSnapshot.boss) {
        const bossLevel = BOSS_LEVEL_BY_TYPE[stageSnapshot.boss as BossType];
        const rarity = BOSS_RARITY_REWARD[bossLevel];
        
        if (bossLevel && rarity && !storyProgress.bossFirstClearRewards.includes(bossLevel)) {
          newHero = generateHero(rarity);
          rewardedRarity = rarity;
        }
      }

      const storyUpdatedHeroes = player.heroes.map(h => {
        const deployed = stateSnapshot.heroes.find(dh => dh.id === h.id);
        if (!deployed) return h;
        return stateSnapshot.mapCompleted
          ? { ...h, ...deployed, currentStamina: deployed.maxStamina }
          : { ...h, ...deployed };
      });

      if (newHero && rewardedRarity) {
        const rarityLabel = RARITY_CONFIG[rewardedRarity].label;
        toast({
          title: "🎉 Héros garanti!",
          description: `Vous avez reçu un héros ${rarityLabel} pour votre première victoire contre ce boss!`,
          duration: 6000,
        });
        storyUpdatedHeroes.push(newHero);
      }

      const newAchievements = { ...player.achievements };
      const newAchievementUnlocks: AchievementDefinition[] = [];

      const totalChestsOpened = player.mapsCompleted + stateSnapshot.chestsOpened;
      const { newState: chestState, unlocked: chestUnlocks } = trackChestsOpened(player.achievements, totalChestsOpened);
      Object.assign(newAchievements, chestState);
      newAchievementUnlocks.push(...chestUnlocks);

      if (stateSnapshot.mapCompleted) {
        const totalWins = player.mapsCompleted + 1;
        const { newState: combatState, unlocked: combatUnlocks } = trackCombatVictory(player.achievements, totalWins);
        Object.assign(newAchievements, combatState);
        newAchievementUnlocks.push(...combatUnlocks);

        if (stageSnapshot.boss) {
          const currentBosses = storyProgress.bossesDefeated.length;
          const { newState: bossState, unlocked: bossUnlocks } = trackBossDefeated(player.achievements, currentBosses + 1);
          Object.assign(newAchievements, bossState);
          newAchievementUnlocks.push(...bossUnlocks);
        }
      }

      setPlayer(prev => ({
        ...prev,
        bomberCoins: prev.bomberCoins + stateSnapshot.coinsEarned + (stateSnapshot.mapCompleted ? stageSnapshot.reward : 0),
        xp: prev.xp + (stateSnapshot.mapCompleted ? stageSnapshot.xpReward : 0),
        heroes: storyUpdatedHeroes,
        achievements: newAchievements,
        totalHeroesOwned: prev.totalHeroesOwned + (newHero ? 1 : 0),
      }));

      for (const achievement of newAchievementUnlocks) {
        toast({
          title: '🏆 Succès débloqué!',
          description: achievement.title,
        });
      }

      if (canWriteCloud) {
        saveHeroesToCloud(storyUpdatedHeroes.filter(h => stateSnapshot.heroes.some(dh => dh.id === h.id)));
      }

      if (stateSnapshot.mapCompleted) {
        if (stageSnapshot.boss) {
          const bossLevel = BOSS_LEVEL_BY_TYPE[stageSnapshot.boss as BossType];
          
          setStoryProgress(prev => ({
            ...prev,
            completedStages: prev.completedStages.includes(stageSnapshot.id)
              ? prev.completedStages
              : [...prev.completedStages, stageSnapshot.id],
            bossesDefeated: !prev.bossesDefeated.includes(stageSnapshot.boss)
              ? [...prev.bossesDefeated, stageSnapshot.boss]
              : prev.bossesDefeated,
            highestStage: Math.max(prev.highestStage, stageSnapshot.stageNumber),
            bossFirstClearRewards: !prev.bossFirstClearRewards.includes(bossLevel)
              ? [...prev.bossFirstClearRewards, bossLevel]
              : prev.bossFirstClearRewards,
          }));
        } else {
          setStoryProgress(prev => ({
            ...prev,
            completedStages: prev.completedStages.includes(stageSnapshot.id)
              ? prev.completedStages
              : [...prev.completedStages, stageSnapshot.id],
            highestStage: Math.max(prev.highestStage, stageSnapshot.stageNumber),
          }));
        }
      }

      setDailyQuests(prev => {
        let q = prev;
        if (stateSnapshot.mapCompleted) q = updateQuestProgress(q, 'complete_maps', 1);
        if (stateSnapshot.coinsEarned > 0) q = updateQuestProgress(q, 'earn_coins', stateSnapshot.coinsEarned);
        if (stateSnapshot.bombsPlaced > 0) q = updateQuestProgress(q, 'place_bombs', stateSnapshot.bombsPlaced);
        if (stateSnapshot.chestsOpened > 0) q = updateQuestProgress(q, 'open_chests', stateSnapshot.chestsOpened);
        return q;
      });
    }

    const nextStage = goToNextStage && stateSnapshot?.mapCompleted && !stageSnapshot.boss
      ? getNextStoryStage(stageSnapshot)
      : null;

    setGameState(null);
    setCurrentStoryStage(null);

    if (nextStage) {
      setTimeout(() => startStoryStage(nextStage), 100);
      return;
    }

    const regionIdx = STORY_REGIONS.findIndex(r => r.id === stageSnapshot.regionId);
    if (regionIdx >= 0) setStoryRegionIdx(regionIdx);
    setScreen('story');
  };

  const endStoryBattle = () => finalizeStoryBattle(false);

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

    const mergedHeroes = newHeroes;

    setLastSummoned(batch[batch.length - 1]);
    setSummonedBatch(batch);
    
    const newTotalSummons = player.totalHeroesOwned + count;
    const newAchievements = { ...player.achievements };
    const newAchievementUnlocks: AchievementDefinition[] = [];
    
    const { newState: summonState, unlocked: summonUnlocks } = trackSummon(player.achievements, newTotalSummons);
    Object.assign(newAchievements, summonState);
    newAchievementUnlocks.push(...summonUnlocks);
    
    const hasLegend = batch.some(h => h.rarity === 'legend');
    const hasSuperLegend = batch.some(h => h.rarity === 'super-legend');
    const hasEpic = batch.some(h => h.rarity === 'epic');
    if (hasSuperLegend) {
      const { newState, unlocked } = trackRarityUnlock(player.achievements, 'super-legend');
      Object.assign(newAchievements, newState);
      newAchievementUnlocks.push(...unlocked);
    } else if (hasLegend) {
      const { newState, unlocked } = trackRarityUnlock(player.achievements, 'legend');
      Object.assign(newAchievements, newState);
      newAchievementUnlocks.push(...unlocked);
    } else if (hasEpic) {
      const { newState, unlocked } = trackRarityUnlock(player.achievements, 'epic');
      Object.assign(newAchievements, newState);
      newAchievementUnlocks.push(...unlocked);
    }

    const { newState: heroCountState, unlocked: heroCountUnlocks } = trackHeroCount(player.achievements, mergedHeroes.length);
    Object.assign(newAchievements, heroCountState);
    newAchievementUnlocks.push(...heroCountUnlocks);
    
    setPlayer(prev => ({
      ...prev,
      bomberCoins: newCoins,
      heroes: mergedHeroes,
      pityCounters: currentPity,
      totalHeroesOwned: mergedHeroes.length,
      achievements: newAchievements,
    }));
    
    for (const achievement of newAchievementUnlocks) {
      toast({
        title: '🏆 Succès débloqué!',
        description: achievement.title,
      });
    }
    
    markHeroMutation();
    if (canWriteCloud) {
      const addedHeroes = mergedHeroes.filter(h => !player.heroes.some(existing => existing.id === h.id));
      const removedExistingHeroIds = player.heroes
        .filter(h => !mergedHeroes.some(m => m.id === h.id))
        .map(h => h.id);

      if (addedHeroes.length > 0) saveHeroesToCloud(addedHeroes);
      if (removedExistingHeroIds.length > 0) removeHeroesFromCloud(removedExistingHeroIds);
    }
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
    // Level-up is now automatic via XP gained in combat
    // This function is kept for UI compatibility but does nothing
    return;
  };

  const handleAscend = (heroId: string) => {
    const hero = player.heroes.find(h => h.id === heroId);
    const maxLevel = getMaxLevel(hero?.rarity);
    if (!hero || hero.level < maxLevel || hero.stars >= 3) return;
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
    if (canWriteCloud) {
      removeHeroesFromCloud(removedIds);
      saveHeroesToCloud([ascended]);
    }
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
          <h1 className="font-pixel text-[8px] sm:text-xs text-foreground tracking-wider hidden sm:block">BOMBERQUEST</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <button
            onClick={toggleMute}
            className="p-2 sm:p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-w-[44px] sm:min-w-[auto] min-h-[36px] sm:min-h-[auto] flex items-center justify-center"
            title={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="flex items-center gap-1.5 pixel-border px-2 sm:px-3 py-1.5 bg-muted min-w-[70px] sm:min-w-[auto]">
            <Coins size={14} className="text-game-gold shrink-0" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-game-gold tabular-nums">
              {(player.bomberCoins + (gameState?.coinsEarned || 0)).toLocaleString()}
              {gameState?.coinsEarned ? <span className="text-[8px] opacity-70 ml-1">(+{gameState.coinsEarned})</span> : null}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Star size={12} /> Lv.{player.accountLevel}
            <span className="text-border">|</span>
            <Users size={12} /> {player.heroes.length}
          </div>
          <div className="flex sm:hidden items-center gap-1 text-[9px] text-muted-foreground tabular-nums">
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
            { id: 'achievements' as Screen, label: 'Succès', icon: <Trophy size={14} /> },
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
              <p className="text-xs text-muted-foreground">Idle Bomber • Collecter & Améliorer</p>
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
                  <p className="font-pixel text-[10px] text-foreground mt-1 tabular-nums">{stat.value}</p>
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
                            <p className="font-pixel text-[7px] text-foreground mt-1 truncate max-w-[60px]">{hero.name.split(' ')[0]}</p>
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
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted min-w-[60px]">
                    <Coins size={12} className="text-game-gold" />
                    <span className="font-pixel text-[9px] text-game-gold tabular-nums">+{gameState.coinsEarned}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted min-w-[40px]">
                    <span className="text-[10px]">💣</span>
                    <span className="font-pixel text-[9px] text-muted-foreground tabular-nums">{gameState.bombsPlaced}</span>
                  </div>
                  {!gameState.isStoryMode && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/15 min-w-[50px]">
                      <span className="text-[10px]">📦</span>
                      <span className="font-pixel text-[9px] text-primary tabular-nums">
                        {gameState.chestsOpened}/{gameState.map.chests.length}
                      </span>
                    </div>
                  )}
                  {gameState.isStoryMode && (
                    <>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/15 min-w-[70px]">
                        <Skull size={12} className="text-destructive shrink-0" />
                        <span className="font-pixel text-[9px] text-destructive tabular-nums whitespace-nowrap">
                          {gameState.enemies?.filter(e => e.hp > 0).length || 0} restants
                        </span>
                      </div>
                      {(gameState.enemiesKilled || 0) > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/15 min-w-[50px]">
                          <Swords size={12} className="text-primary shrink-0" />
                          <span className="font-pixel text-[9px] text-primary tabular-nums">{gameState.enemiesKilled} tué(s)</span>
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
                    className="font-pixel text-[8px] sm:text-[7px] px-3 py-2.5 sm:py-1.5 rounded transition-all bg-primary text-primary-foreground shadow-md min-w-[44px] sm:min-w-[38px] min-h-[44px] sm:min-h-[auto] tabular-nums"
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
                    <span className="hidden sm:inline">{gameState.isPaused ? 'Reprendre' : 'Pause'}</span>
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
                      <span className="font-pixel text-[7px] text-foreground truncate max-w-[50px] sm:max-w-[60px]">{hero.name}</span>
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
                    <Skull size={12} /> <span className="truncate max-w-[80px] sm:max-w-[auto]">{gameState.boss.name}</span>
                  </span>
                  <span className="font-pixel text-[8px] text-muted-foreground tabular-nums whitespace-nowrap">
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
              <div className="pixel-border bg-primary/10 p-2.5 flex items-center justify-between gap-2">
                <span className="font-pixel text-[8px] text-primary flex items-center gap-1.5 whitespace-nowrap">
                  <FastForward size={12} /> AUTO-FARM ACTIF
                  <span className="text-muted-foreground tabular-nums">• Run #{farmStats.runs + 1} • Total: {farmStats.totalCoins} BC</span>
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
                    {gameState.isStoryMode && currentStoryStage && !currentStoryStage.boss && (
                      <button
                        onClick={() => finalizeStoryBattle(true)}
                        className="pixel-btn font-pixel text-xs flex items-center gap-2"
                      >
                        <Play size={14} /> Étape suivante
                      </button>
                    )}
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

            {/* Defeat banner for Story Mode */}
            {gameState.isStoryMode && gameState.storyFailed && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="pixel-border bg-card p-5 text-center border-destructive/50"
              >
                <p className="font-pixel text-sm sm:text-base text-destructive flex items-center justify-center gap-2">
                  <Skull size={22} /> 💀 DÉFAITE!
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Tous vos héros sont KO
                </p>
                <div className="flex gap-2 mt-4 justify-center">
                  <button
                    onClick={() => {
                      if (currentStoryStage) startStoryStage(currentStoryStage);
                    }}
                    className="pixel-btn font-pixel text-xs flex items-center gap-2"
                  >
                    <Play size={14} /> Réessayer
                  </button>
                  <button
                    onClick={endStoryBattle}
                    className="pixel-btn pixel-btn-secondary font-pixel text-xs flex items-center gap-2"
                  >
                    <DoorOpen size={14} /> Quitter
                  </button>
                </div>
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
                  const available = player.heroes.filter(h => h.rarity === from && isHeroMaxLevel(h)).length;
                  const totalOfRarity = player.heroes.filter(h => h.rarity === from).length;
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
                          {count}× {RARITY_CONFIG[from].label} max
                        </span>
                        <span className="text-[8px] text-muted-foreground">→</span>
                        <span className="font-pixel text-[8px]" style={{ color: `hsl(var(--game-rarity-${to}))` }}>
                          1× {RARITY_CONFIG[to].label}
                        </span>
                      </div>
                      <p className="text-[7px] text-muted-foreground">
                        {available >= count ? 'Prêt' : `${available}/${count} maxed`} ({totalOfRarity} total)
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

        {/* ACHIEVEMENTS SCREEN */}
        {screen === 'achievements' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
                <Trophy size={16} /> SUCCÈS
              </h2>
              <button onClick={() => setScreen('hub')} className="pixel-btn pixel-btn-secondary font-pixel text-[8px] flex items-center gap-1">
                <ChevronLeft size={12} /> Retour
              </button>
            </div>
            <Achievements 
              achievements={player.achievements} 
              onClaimReward={(achievementId: string) => {
                const { newState, claimed, reward } = claimAchievementReward(player.achievements, achievementId);
                if (claimed && reward) {
                  setPlayer(prev => ({
                    ...prev,
                    bomberCoins: prev.bomberCoins + (reward.type === 'coins' ? reward.amount : 0),
                    shards: {
                      ...prev.shards,
                      [reward.rarity as keyof typeof prev.shards]: (prev.shards[reward.rarity as keyof typeof prev.shards] || 0) + (reward.type === 'shards' ? reward.amount : 0),
                    },
                    achievements: newState,
                  }));
                  toast({
                    title: '🎁 Récompense réclamée!',
                    description: `${reward.amount} ${reward.type === 'coins' ? 'pièces' : 'shards'} ${reward.rarity || ''}`,
                  });
                }
              }}
            />
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
