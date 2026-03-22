import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { motion, AnimatePresence } from 'framer-motion';
import { pixelFade } from '@/lib/animations';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useSummonLogic } from '@/hooks/useSummonLogic';
import { useFusionLogic, MERGE_RECIPES } from '@/hooks/useFusionLogic';
import GameGrid from '@/components/GameGrid';
import CombatHeroPanel from '@/components/CombatHeroPanel';
import HeroCard from '@/components/HeroCard';
import HeroCollectionStats from '@/components/HeroCollectionStats';
import SummonModal from '@/components/SummonModal';
import HeroUpgradeModal from '@/components/HeroUpgradeModal';
import HeroDetailInline from '@/components/HeroDetailInline';
import HeroPickerModal from '@/components/HeroPickerModal';
import HeroPickerBottomSheet from '@/components/HeroPickerBottomSheet';
import StoryMode from '@/components/StoryMode';
import { GameState, Hero, MAP_CONFIGS, PlayerData, RARITY_CONFIG, RARITY_ORDER, sortByRarity, Rarity, HERO_NAMES, HERO_FAMILIES, HERO_FAMILY_MAP, HeroFamilyId, MAX_LEVEL_BY_RARITY } from '@/game/types';
import { generateMap, tickGame } from '@/game/engine';
// summonHero and generateHero are now used inside useSummonLogic / useFusionLogic
import { loadPlayerData, savePlayerData, getDefaultPlayerData, saveStoryProgress, loadStoryProgress } from '@/game/saveSystem';
import { getUpgradeCost, upgradeHero, ascendHero, getAscensionCost, countDuplicates, upgradeSkillWithDuplicate } from '@/game/upgradeSystem';
import { trackCombatVictory, trackLevelUp, trackChestsOpened, trackBossDefeated, claimAchievementReward, AchievementDefinition, ACHIEVEMENTS } from '@/game/achievements';
import { DailyQuestData, loadDailyQuests, saveDailyQuests, generateDailyQuests, updateQuestProgress, ALL_CLAIMED_BONUS, ALL_CLAIMED_XP_BONUS } from '@/game/questSystem';
import { Boss, StoryProgress, StoryStage, BOSS_LEVEL_BY_TYPE, BossType } from '@/game/storyTypes';
import { getHeroFamily, getActiveClanSkills } from '@/game/clanSystem';
import { spawnEnemy, spawnBoss, tickEnemies, tickBoss, damageEnemiesFromExplosion, damageBossFromExplosion, checkEnemyHeroCollision, checkBossHeroCollision } from '@/game/enemyAI';
import { STORY_REGIONS } from '@/game/storyData';
import { getExplosionTiles } from '@/game/engine';
import { generateShardRewards, applyShardRewards, ShardReward, generateUniversalShardReward } from '@/game/shardRewardSystem';
import { recycleHeroes } from '@/game/recycleSystem';
import RecyclePanel from '@/components/RecyclePanel';
import MarketplacePage from '@/components/marketplace/MarketplacePage';
import SummonPage from '@/pages/game/SummonPage';
import HeroesPage from '@/pages/game/HeroesPage';
import ProgressionPage from '@/pages/game/ProgressionPage';
import ForgePage from '@/pages/game/ForgePage';
import DailyQuests from '@/components/DailyQuests';
import Achievements from '@/components/Achievements';
import PlayerStats from '@/components/PlayerStats';
import XpBar from '@/components/XpBar';
import PixelIcon from '@/components/PixelIcon';
import HeroAvatar from '@/components/HeroAvatar';
import SlimHeader from '@/components/SlimHeader';
import MainNav from '@/components/MainNav';
import TeamPresets, { TeamPreset } from '@/components/TeamPresets';
import PixelLoader from '@/components/PixelLoader';
import EmptyState from '@/components/EmptyState';
import { Users, Sparkles, Swords, Map as MapIcon, Trophy, Coins, Play, Pause, DoorOpen, Check, Scroll, FastForward, BookOpen, Shield, Skull, Lock as LockIcon, Hammer, ArrowDown, Gem, Filter, ChevronDown, Zap, Volume2, VolumeX, X } from 'lucide-react';
import PityTracker from '@/components/PityTracker';
import VictoryOverlay from '@/components/VictoryOverlay';
import DefeatOverlay from '@/components/DefeatOverlay';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import DailyResetTimer from '@/components/DailyResetTimer';
import { SFX, isMuted, setMuted } from '@/game/sfx';
import { toast } from 'sonner';

type Screen = 'hub' | 'treasure-hunt' | 'heroes' | 'codex' | 'fusion' | 'summon' | 'story' | 'story-battle' | 'achievements' | 'combat' | 'recycle' | 'marketplace';



type HeroLevelFilter = 'all' | '1-20' | '21-40' | '41-60' | '61+';
type HeroSortBy = 'rarity' | 'level';

type HeroFilters = {
  rarity: 'all' | Rarity;
  level: HeroLevelFilter;
  sortBy: HeroSortBy;
  showDuplicatesOnly?: boolean;
  showLockedOnly?: boolean;
};

const HERO_FILTERS_SESSION_KEY = 'bq_heroes_filters_v1';

const DEFAULT_HERO_FILTERS: HeroFilters = {
  rarity: 'all',
  level: 'all',
  sortBy: 'rarity',
  showDuplicatesOnly: false,
  showLockedOnly: false,
};

// MERGE_RECIPES is now imported from useFusionLogic

const Index = () => {
  usePageMeta({ title: 'Jeu', noIndex: true });
  const { user, session, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('hub');
  const [page, setPage] = useState(2); // page Combat par défaut
  const [heroesTab, setHeroesTab] = useState<'collection' | 'codex' | 'equipes'>('collection');
  const [combatTab, setCombatTab] = useState<'treasure' | 'story'>('treasure');
  const [forgeTab, setForgeTab] = useState<'fusion' | 'recycle'>('fusion');
  const [fusionPickerOpen, setFusionPickerOpen] = useState(false);
  const [fusionPickerSlot, setFusionPickerSlot] = useState<number>(0);
  const [fusionPickerHeroes, setFusionPickerHeroes] = useState<Hero[]>([]);
  const [teamPresets, setTeamPresets] = useState<TeamPreset[]>([
    { id: 'team-1', name: 'Équipe 1', heroIds: [] },
    { id: 'team-2', name: 'Équipe 2', heroIds: [] },
    { id: 'team-3', name: 'Équipe 3', heroIds: [] },
  ]);
  const [player, setPlayer] = useState<PlayerData>(() =>
    user ? getDefaultPlayerData() : loadPlayerData()
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [summonOpen, setSummonOpen] = useState(false);
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
  const [autoFarm, setAutoFarm] = useState(false);
  const [farmStats, setFarmStats] = useState({ runs: 0, totalCoins: 0 });
  const [lastShardRewards, setLastShardRewards] = useState<ShardReward[]>([]);
  const [storyRegionIdx, setStoryRegionIdx] = useState(0);
  
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [heroFilters, setHeroFilters] = useState<HeroFilters>(DEFAULT_HERO_FILTERS);
  const [codexClanFilter, setCodexClanFilter] = useState<'all' | HeroFamilyId>('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlotIdx, setPickerSlotIdx] = useState<number | null>(null);
  const [presetSaveOpen, setPresetSaveOpen] = useState(false);
  const [presetSaveName, setPresetSaveName] = useState('');

  // Tutorial — check for restart flag from Profile page
  useEffect(() => {
    const restart = localStorage.getItem('bq_restart_tutorial');
    if (restart === '1') {
      localStorage.removeItem('bq_restart_tutorial');
      setPlayer(prev => ({ ...prev, tutorialStep: 0 }));
    }
  }, []);

  const handleTutorialAdvance = useCallback((nextStep: number | undefined) => {
    setPlayer(prev => ({ ...prev, tutorialStep: nextStep }));
  }, []);

  const { isActive: tutorialActive, currentStep: tutorialCurrentStep, advance: advanceTutorial, skip: skipTutorial } = useTutorial({
    tutorialStep: player.tutorialStep,
    onAdvance: handleTutorialAdvance,
  });

  const huntSpeedRef = useRef(1);
  const gameLoopRef = useRef<number>();
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // For guests: restore speed from localStorage. For auth users: cloud load handles it.
    if (!user) {
      const saved = Number(localStorage.getItem('hunt-speed') || '1');
      huntSpeedRef.current = saved === 2 || saved === 3 ? saved : 1;
    }
  }, []);
  const lastTickRef = useRef<number>(Date.now());
  const processedExplosionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(HERO_FILTERS_SESSION_KEY, JSON.stringify(heroFilters));
  }, [heroFilters]);

  const filteredHeroes = useMemo(() => {
    // Précalcul des noms de base pour le filtre doublons
    const nameCounts = new Map<string, number>();
    player.heroes.forEach(h => {
      const baseName = h.name.split(' #')[0];
      nameCounts.set(baseName, (nameCounts.get(baseName) || 0) + 1);
    });

    return [...player.heroes]
      .filter((hero) => {
        if (heroFilters.rarity !== 'all' && hero.rarity !== heroFilters.rarity) return false;

        if (heroFilters.level !== 'all') {
          if (heroFilters.level === '1-20' && !(hero.level >= 1 && hero.level <= 20)) return false;
          if (heroFilters.level === '21-40' && !(hero.level >= 21 && hero.level <= 40)) return false;
          if (heroFilters.level === '41-60' && !(hero.level >= 41 && hero.level <= 60)) return false;
          if (heroFilters.level === '61+' && hero.level < 61) return false;
        }

        if (heroFilters.showDuplicatesOnly) {
          const baseName = hero.name.split(' #')[0];
          if ((nameCounts.get(baseName) || 0) <= 1) return false;
        }

        if (heroFilters.showLockedOnly && !hero.isLocked) return false;

        return true;
      })
      .sort((a, b) => {
        if (heroFilters.sortBy === 'level') return b.level - a.level;
        const order = ['super-legend', 'legend', 'epic', 'super-rare', 'rare', 'common'];
        return order.indexOf(a.rarity) - order.indexOf(b.rarity);
      });
  }, [player.heroes, heroFilters]);

  // Cloud sync hook — handles session readiness, initial load, and provides save helpers
  const {
    canWriteCloud,
    isCloudLoading,
    loadFromCloud,
    saveHeroesToCloud,
    removeHeroesFromCloud,
    saveStatsToCloud,
    syncHeroesSnapshotToCloud,
  } = useCloudSync(
    { userId: user?.id, sessionAccessToken: session?.access_token, authLoading },
    setPlayer,
    setStoryProgress,
    setDailyQuests,
    huntSpeedRef,
  );

  // Summon logic hook
  const {
    lastSummoned,
    summonedBatch,
    showSummonFlash,
    summonTab,
    setSummonTab,
    selectedShardRarity,
    setSelectedShardRarity,
    handleSummon,
    handleSummonShards,
    SHARD_COSTS,
  } = useSummonLogic({
    player,
    setPlayer,
    setDailyQuests,
    canWriteCloud,
    saveHeroesToCloud,
    removeHeroesFromCloud,
  });

  // Fusion logic hook
  const {
    selectedRecipeIdx,
    setSelectedRecipeIdx,
    fusionSlots,
    lastFusedHero,
    setLastFusedHero,
    isMerging,
    getAvailableForMerge,
    handleMerge,
    executeFusionFromSlots,
    handleSlotClick,
    handleHeroSelect,
    handleSlotClear,
    mergeAll,
  } = useFusionLogic({
    player,
    setPlayer,
    canWriteCloud,
    saveHeroesToCloud,
    removeHeroesFromCloud,
  });

  const toggleMute = () => {
    const newVal = !muted;
    setMutedState(newVal);
    setMuted(newVal);
  };

  // Save to localStorage when player data changes (offline mode + authenticated safety backup)
  // Invités uniquement — les users authentifiés passent par le cloud
  useEffect(() => {
    if (user) return;
    if (isCloudLoading) return;
    if (!isInitialMountRef.current) {
      savePlayerData(player);
      saveDailyQuests(dailyQuests);
      saveStoryProgress(storyProgress);
    }
  }, [player, dailyQuests, storyProgress, user, isCloudLoading]);

  // Track initial mount completion
  useEffect(() => {
    isInitialMountRef.current = false;
  }, []);

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

  // Retourne { currentXp, xpNeeded } pour le niveau actuel
  const getXpInCurrentLevel = (xp: number): { currentXp: number; xpNeeded: number } => {
    let level = 1;
    let xpNeeded = 100;
    let totalXp = xp;
    while (totalXp >= xpNeeded) {
      totalXp -= xpNeeded;
      level++;
      xpNeeded = level * 100;
    }
    return { currentXp: totalXp, xpNeeded };
  };

  // Update account level when XP changes
  // Note: player.achievements retiré des deps pour éviter une boucle (setPlayer met à jour achievements)
  // On lit prev.achievements dans le updater fonctionnel pour éviter la dépendance stale.
  const pendingLevelUpToastsRef = useRef<AchievementDefinition[]>([]);
  useEffect(() => {
    const newLevel = getAccountLevel(player.xp);
    if (newLevel !== player.accountLevel) {
      setPlayer(prev => {
        const { newState, unlocked } = trackLevelUp(prev.achievements, newLevel);
        pendingLevelUpToastsRef.current = unlocked;
        return {
          ...prev,
          accountLevel: getAccountLevel(prev.xp),
          achievements: newState,
        };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.xp, player.accountLevel]);

  useEffect(() => {
    const toasts = pendingLevelUpToastsRef.current;
    if (toasts.length > 0) {
      pendingLevelUpToastsRef.current = [];
      for (const achievement of toasts) {
        toast('🏆 Succès débloqué!', { description: achievement.title });
      }
    }
  }, [player.accountLevel]);


  // Save periodically + passive stamina regen
  // On stocke le callback dans une ref pour ne pas recréer le setInterval à chaque changement d'état (#273)
  const periodicCallbackRef = useRef<() => void>(() => {});
  useEffect(() => {
    periodicCallbackRef.current = () => {
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
    };
  }, [user, canWriteCloud, player, dailyQuests, storyProgress, gameState?.isRunning, saveStatsToCloud, syncHeroesSnapshotToCloud]);

  useEffect(() => {
    const interval = setInterval(() => periodicCallbackRef.current(), 5000);
    return () => clearInterval(interval);
  }, []);

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
        // heroes doit être déclaré ici pour être accessible dans la boucle d'explosions
        let heroes = state.heroes.map(h => ({ ...h }));

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
              // Trouver le héros ayant posé la bombe pour appliquer son affinité clan par ennemi individuel (#154, #366)
              const bombHero = exp.heroId ? state.heroes.find(h => h.id === exp.heroId) : undefined;
              const heroFamily = bombHero ? getHeroFamily(bombHero) : undefined;
              const basePower = Math.max(...state.heroes.map(h => h.stats.pwr), 1);
              const { enemies: updatedEnemies, kills, totalDamage } = damageEnemiesFromExplosion(enemies, exp.tiles, basePower, exp.heroId, heroFamily);
              enemies = updatedEnemies;
              enemiesKilled += kills;
              if (kills > 0) {
                SFX.enemyKill();
                eventLog.push(`💥 ${kills} ennemi(s) éliminé(s)!`);
                coinsEarned += kills * 10;
              }
              if (totalDamage > 0 && exp.heroId) {
                const heroIdx = heroes.findIndex(h => h.id === exp.heroId);
                if (heroIdx >= 0) {
                  heroes[heroIdx] = {
                    ...heroes[heroIdx],
                    progressionStats: {
                      ...heroes[heroIdx].progressionStats,
                      totalDamageDealt: heroes[heroIdx].progressionStats.totalDamageDealt + totalDamage,
                    },
                  };
                }
              }

              if (boss && boss.hp > 0) {
                const prevHp = boss.hp;
                const bossResult = damageBossFromExplosion(boss, exp.tiles, basePower + 1);
                boss = bossResult.boss;
                if (boss.hp < prevHp) {
                  SFX.bossHit();
                  const bossDamage = bossResult.damageDealt;
                  eventLog.push(`💥 Boss touché! (${boss.hp}/${boss.maxHp} HP)`);
                  if (bossDamage > 0 && exp.heroId) {
                    const heroIdx = heroes.findIndex(h => h.id === exp.heroId);
                    if (heroIdx >= 0) {
                      heroes[heroIdx] = {
                        ...heroes[heroIdx],
                        progressionStats: {
                          ...heroes[heroIdx].progressionStats,
                          totalDamageDealt: heroes[heroIdx].progressionStats.totalDamageDealt + bossDamage,
                        },
                      };
                    }
                  }
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

        heroes = heroes.map(h => {
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
    const map = generateMap(mapConfig.width, mapConfig.height, mapConfig.blockDensity, mapConfig.chests, selectedMap);

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

    setLastShardRewards([]);
    setGameState({
      map,
      heroes: deployedHeroes,
      bombs: [],
      explosions: [],
      bomberCoins: player.bomberCoins,
      coinsEarned: 0,
      bombsPlaced: 0,
      chestsOpened: 0,
      blocksDestroyed: 0,
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
      const baseHero = completed
        ? { ...h, ...deployed, currentStamina: deployed.maxStamina }
        : { ...h, ...deployed };
      return {
        ...baseHero,
        progressionStats: {
          ...baseHero.progressionStats,
          battlesPlayed: baseHero.progressionStats.battlesPlayed + 1,
          victories: baseHero.progressionStats.victories + (completed ? 1 : 0),
        },
      };
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

    let universalShardsGained = 0;
    if (completed && !gameState.isStoryMode) {
      universalShardsGained = generateUniversalShardReward(selectedMap);
      setLastShardRewards([{ rarity: 'common', quantity: universalShardsGained }]);
    }

    setPlayer(prev => ({
      ...prev,
      bomberCoins: prev.bomberCoins + earned,
      mapsCompleted: newMapsCompleted,
      xp: prev.xp + earned,
      heroes: updatedHeroes,
      achievements: newAchievements,
      universalShards: prev.universalShards + universalShardsGained,
    }));
    
    for (const achievement of newAchievementUnlocks) {
      toast('🏆 Succès débloqué!', { description: achievement.title });
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
      if ((gameState.blocksDestroyed ?? 0) > 0) q = updateQuestProgress(q, 'destroy_blocks', gameState.blocksDestroyed ?? 0);
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
  }, [gameState, selectedMap]);

  const endTreasureHunt = () => collectAndContinue(false);

  // Auto-farm: auto-continue when map completes
  useEffect(() => {
    if (autoFarm && gameState?.mapCompleted && !gameState?.isStoryMode) {
      const timer = setTimeout(() => collectAndContinue(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [autoFarm, gameState?.mapCompleted, gameState?.isStoryMode, collectAndContinue]);

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
    let boss: Boss | null = null;
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
      blocksDestroyed: 0,
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
      // Shards pour boss first clear
      let bossFirstClearShards = 0;

      if (stateSnapshot.mapCompleted && stageSnapshot.boss) {
        const bossLevel = BOSS_LEVEL_BY_TYPE[stageSnapshot.boss as BossType];
        if (bossLevel && !storyProgress.bossFirstClearRewards.includes(bossLevel)) {
          // Plus de héros direct — donner des shards à la place
          const bossShards = [0, 10, 15, 20, 25, 30][bossLevel] || 10;
          bossFirstClearShards = bossShards;
        }
      }

      const storyUpdatedHeroes = player.heroes.map(h => {
        const deployed = stateSnapshot.heroes.find(dh => dh.id === h.id);
        if (!deployed) return h;
        const baseHero = stateSnapshot.mapCompleted
          ? { ...h, ...deployed, currentStamina: deployed.maxStamina }
          : { ...h, ...deployed };
        return {
          ...baseHero,
          progressionStats: {
            ...baseHero.progressionStats,
            battlesPlayed: baseHero.progressionStats.battlesPlayed + 1,
            victories: baseHero.progressionStats.victories + (stateSnapshot.mapCompleted ? 1 : 0),
          },
        };
      });

      if (bossFirstClearShards > 0) {
        toast('🎉 Boss vaincu!', {
          description: `Première victoire! Tu reçois ${bossFirstClearShards} Shards Universels!`,
          duration: 6000,
        });
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
        universalShards: (prev.universalShards || 0) + bossFirstClearShards + (stateSnapshot.mapCompleted ? (stageSnapshot.shardReward || 0) : 0),
      }));

      for (const achievement of newAchievementUnlocks) {
        toast('🏆 Succès débloqué!', { description: achievement.title });
      }

      if (canWriteCloud) {
        saveHeroesToCloud(storyUpdatedHeroes.filter(h => stateSnapshot.heroes.some(dh => dh.id === h.id)));
      }

      if (stateSnapshot.mapCompleted) {
        if (stageSnapshot.boss) {
          const stageSnapshotBoss = stageSnapshot.boss; // narrow type for closure
          const bossLevel = BOSS_LEVEL_BY_TYPE[stageSnapshotBoss as BossType];

          setStoryProgress(prev => ({
            ...prev,
            completedStages: prev.completedStages.includes(stageSnapshot.id)
              ? prev.completedStages
              : [...prev.completedStages, stageSnapshot.id],
            bossesDefeated: !prev.bossesDefeated.includes(stageSnapshotBoss)
              ? [...prev.bossesDefeated, stageSnapshotBoss]
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
        if ((stateSnapshot.blocksDestroyed ?? 0) > 0) q = updateQuestProgress(q, 'destroy_blocks', stateSnapshot.blocksDestroyed ?? 0);
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

  const handlePickerSelect = (hero: Hero) => {
    if (pickerSlotIdx === null) return;
    const currentIds = Array.from(selectedHeroes);
    if (currentIds[pickerSlotIdx]) {
      setSelectedHeroes(prev => { const s = new Set(prev); s.delete(currentIds[pickerSlotIdx]); return s; });
    }
    setSelectedHeroes(prev => { const s = new Set(prev); s.add(hero.id); return s; });
    setPickerOpen(false);
    setPickerSlotIdx(null);
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
    if (canWriteCloud) {
      saveHeroesToCloud([upgraded]);
    }
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
    if (canWriteCloud) {
      removeHeroesFromCloud(removedIds);
      saveHeroesToCloud([ascended]);
    }
  };

  const handleSkillUpgrade = (heroId: string, skillIndex: number) => {
    const result = upgradeSkillWithDuplicate(player.heroes, heroId, skillIndex);
    if (!result.success) {
      toast.error('Impossible', { description: result.message });
      return;
    }
    setPlayer(prev => ({
      ...prev,
      heroes: result.updatedHeroes,
    }));
    if (canWriteCloud) {
      saveHeroesToCloud(result.updatedHeroes.filter(h => h.id === heroId));
      if (result.removedIds.length > 0) {
        removeHeroesFromCloud(result.removedIds);
      }
    }
    toast('⚡ Compétence améliorée!', { description: result.message });
  };

  const handleRecycle = (ids: string[], shardsGained: number) => {
    const { remainingHeroes } = recycleHeroes(player.heroes, ids);
    const updatedPlayer = { ...player, heroes: remainingHeroes, universalShards: player.universalShards + shardsGained };
    setPlayer(updatedPlayer);
    if (canWriteCloud) {
      saveHeroesToCloud(remainingHeroes);
      removeHeroesFromCloud(ids);
      saveStatsToCloud(updatedPlayer, storyProgress, dailyQuests);
    }
    toast(`♻️ Recyclage!`, { description: `${ids.length} héros recyclés → +${shardsGained} 💎` });
  };

  const handleToggleLock = (heroId: string) => {
    setPlayer(prev => ({
      ...prev,
      heroes: prev.heroes.map(h => h.id === heroId ? { ...h, isLocked: !h.isLocked } : h),
    }));
  };

  const upgradeHeroData = upgradeHeroId ? player.heroes.find(h => h.id === upgradeHeroId) ?? null : null;

  const activeClanSkills = useMemo(() => {
    const activeHeroes = player.heroes.filter(h => selectedHeroes.has(h.id));
    return getActiveClanSkills(activeHeroes);
  }, [player.heroes, selectedHeroes]);

  // Codex rarity grouping constants
  const CODEX_RARITY_ORDER: Rarity[] = ['super-legend', 'legend', 'epic', 'super-rare', 'rare', 'common'];
  const CODEX_RARITY_LABEL: Record<Rarity, string> = {
    'super-legend': 'Super Légende',
    'legend': 'Légende',
    'epic': 'Épique',
    'super-rare': 'Super Rare',
    'rare': 'Rare',
    'common': 'Commun',
  };
  const CODEX_RARITY_COLOR: Record<Rarity, string> = {
    'super-legend': 'text-purple-400',
    'legend': 'text-yellow-400',
    'epic': 'text-orange-400',
    'super-rare': 'text-blue-400',
    'rare': 'text-green-400',
    'common': 'text-muted-foreground',
  };

  const heroRarityOrder: Rarity[] = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];
  const codexByName = HERO_NAMES.map((heroName) => {
    const normalized = heroName.toLowerCase();
    const ownedVariants = player.heroes.filter((hero) => hero.name.split(' ')[0].toLowerCase() === normalized);
    const unlocked = ownedVariants.length > 0;
    const highestOwned = ownedVariants.sort(
      (a, b) => heroRarityOrder.indexOf(b.rarity) - heroRarityOrder.indexOf(a.rarity)
    )[0];

    return {
      key: normalized,
      displayName: heroName,
      unlocked,
      ownedCount: ownedVariants.length,
      rarity: highestOwned?.rarity ?? 'common',
      heroPreviewId: normalized,
    };
  });

  const codexUnlockedCount = codexByName.filter((entry) => entry.unlocked).length;
  const codexTotalCount = codexByName.length;

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

  const PAGE_TITLES = ['Invoquer', 'Héros', 'Combat', 'Social', 'Forge', 'Marché'];

  // Touch swipe handlers
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
      if (deltaX < 0) setPage(p => Math.min(5, p + 1));
      if (deltaX > 0) setPage(p => Math.max(0, p - 1));
    }
  }, []);

  // Auto-navigate to Combat page when a battle starts
  useEffect(() => {
    if (screen === 'treasure-hunt' || screen === 'story-battle' || screen === 'story') {
      setPage(2);
    }
  }, [screen]);

  if (isCloudLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <PixelLoader size="lg" label="Synchronisation du cloud" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <SlimHeader
        bomberCoins={player.bomberCoins + (gameState?.coinsEarned || 0)}
        universalShards={player.universalShards}
        accountLevel={player.accountLevel}
        accountXp={getXpInCurrentLevel(player.xp).currentXp}
        xpToNextLevel={getXpInCurrentLevel(player.xp).xpNeeded}
        title={PAGE_TITLES[page]}
        onProfileClick={user ? () => navigate("/profile") : undefined}
        muted={muted}
        onToggleMute={toggleMute}
      />

      {/* Container swipeable 6 pages */}
      <motion.div
        className="flex flex-1 min-h-0 pt-12"
        style={{ width: '600%' }}
        animate={{ x: `${-page * (100 / 6)}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* PAGE 0 — Invoquer */}
        <SummonPage
          player={player}
          summonTab={summonTab}
          setSummonTab={setSummonTab}
          selectedShardRarity={selectedShardRarity}
          setSelectedShardRarity={setSelectedShardRarity}
          handleSummon={handleSummon}
          handleSummonShards={handleSummonShards}
          lastSummoned={lastSummoned}
          summonedBatch={summonedBatch}
          showSummonFlash={showSummonFlash}
          SHARD_COSTS={SHARD_COSTS}
        />


        {/* PAGE 1 — Héros */}
        <HeroesPage
          player={player}
          heroesTab={heroesTab}
          setHeroesTab={setHeroesTab}
          heroFilters={heroFilters}
          setHeroFilters={setHeroFilters}
          filteredHeroes={filteredHeroes}
          filtersExpanded={filtersExpanded}
          setFiltersExpanded={setFiltersExpanded}
          codexClanFilter={codexClanFilter}
          setCodexClanFilter={setCodexClanFilter}
          upgradeHeroId={upgradeHeroId}
          setUpgradeHeroId={setUpgradeHeroId}
          upgradeHeroData={upgradeHeroData}
          teamPresets={teamPresets}
          setTeamPresets={setTeamPresets}
          selectedHeroes={selectedHeroes}
          setSelectedHeroes={setSelectedHeroes}
          handleUpgrade={handleUpgrade}
          handleAscend={handleAscend}
        />

        {/* PAGE 2 — Combat */}
        <div className={`w-1/6 h-full overflow-y-auto pb-nav ${isInBattle ? '' : 'md:pl-16'}`}>
          <div className="p-4 max-w-6xl mx-auto">
            {/* Tabs Chasse au Trésor / Mode Histoire */}
            {!isInBattle && (
              <div className="flex gap-1 mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                {(['treasure', 'story'] as const).map(tab => (
                  <button key={tab} onClick={() => setCombatTab(tab)}
                    className={`flex-1 font-pixel text-[8px] py-2 rounded transition-colors ${
                      combatTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}>
                    {tab === 'treasure' ? '⚔ CHASSE AU TRÉSOR' : '📖 MODE HISTOIRE'}
                  </button>
                ))}
              </div>
            )}

            {/* Mode Histoire */}
            {!isInBattle && combatTab === 'story' && (
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

            {/* Sélecteur carte + équipe (hors bataille, onglet chasse au trésor) */}
            {!isInBattle && combatTab === 'treasure' && (
              <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-6">

                {/* Treasure Hunt Launcher */}
                <div className="pixel-border bg-card p-4">
                  <h3 className="font-pixel text-xs text-foreground mb-1 flex items-center gap-2">
                    <MapIcon size={16} /> CHASSE AU TRÉSOR
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

                  {/* Mon Équipe */}
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

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                      {Array.from({ length: 6 }).map((_, slotIdx) => {
                        const heroId = Array.from(selectedHeroes)[slotIdx];
                        const hero = heroId ? player.heroes.find(h => h.id === heroId) : null;
                        return hero ? (
                          <div
                            key={slotIdx}
                            className={`pixel-border p-2 flex flex-col items-center justify-center min-h-[72px] transition-all cursor-pointer bg-card rarity-${hero.rarity}`}
                            onClick={() => { setPickerSlotIdx(slotIdx); setPickerOpen(true); }}
                          >
                            <HeroAvatar heroId={hero.id} heroName={hero.name} rarity={hero.rarity} size={32} />
                            <p className="font-pixel text-[7px] text-foreground mt-1 truncate max-w-[60px]">{hero.name.split(' ')[0]}</p>
                            <p className="text-[7px] mt-0.5" style={{ color: `hsl(var(--game-rarity-${hero.rarity}))` }}>
                              {RARITY_CONFIG[hero.rarity].label}
                            </p>
                            <button
                              onClick={e => { e.stopPropagation(); toggleHeroSelection(hero.id); }}
                              className="text-[7px] text-destructive hover:text-destructive/80 mt-0.5 min-w-[32px] min-h-[32px] flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            key={slotIdx}
                            onClick={() => { setPickerSlotIdx(slotIdx); setPickerOpen(true); }}
                            className="pixel-border p-2 flex flex-col items-center justify-center min-h-[72px] transition-all cursor-pointer border-dashed bg-muted/30 hover:bg-muted/50"
                          >
                            <span className="font-pixel text-[18px] text-muted-foreground leading-none">+</span>
                            <p className="font-pixel text-[7px] text-muted-foreground mt-1">Slot {slotIdx + 1}</p>
                          </button>
                        );
                      })}
                    </div>

                    {activeClanSkills.length > 0 && (
                      <div className="mt-2 space-y-1 mb-3">
                        <p className="font-pixel text-[7px] text-primary">✨ SYNERGIES</p>
                        {activeClanSkills.map((s, i) => (
                          <p key={i} className="text-[8px] text-foreground flex items-center gap-1">
                            <span className="text-primary">▸</span> {s.name} — {s.description}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {teamPresets.filter(p => p.heroIds.length > 0).map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => { setSelectedHeroes(new Set(preset.heroIds)); toast(`${preset.name} chargée !`); }}
                          className="font-pixel text-[7px] px-2 py-1 rounded bg-muted/50 border border-border hover:bg-muted transition-colors flex items-center gap-1"
                        >
                          <Play size={9} /> {preset.name}
                        </button>
                      ))}
                      {selectedHeroes.size > 0 && !presetSaveOpen && (
                        <button
                          onClick={() => setPresetSaveOpen(true)}
                          className="font-pixel text-[7px] px-2 py-1 rounded bg-muted/50 border border-border hover:bg-muted transition-colors"
                        >
                          💾 Sauvegarder
                        </button>
                      )}
                      {presetSaveOpen && (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={presetSaveName}
                            onChange={e => setPresetSaveName(e.target.value)}
                            placeholder="Nom de l'équipe"
                            maxLength={24}
                            className="font-pixel text-[7px] px-2 py-1 rounded bg-muted border border-border text-foreground outline-none w-32"
                          />
                          <button
                            onClick={() => {
                              if (!presetSaveName.trim()) return;
                              const name = presetSaveName.trim();
                              setTeamPresets(prev => {
                                const emptySlot = prev.find(p => p.heroIds.length === 0);
                                if (emptySlot) {
                                  return prev.map(p => p.id === emptySlot.id ? { ...p, name, heroIds: Array.from(selectedHeroes) } : p);
                                }
                                if (prev.length < 6) {
                                  return [...prev, { id: `team-${Date.now()}`, name, heroIds: Array.from(selectedHeroes) }];
                                }
                                return prev.map((p, i) => i === prev.length - 1 ? { ...p, name, heroIds: Array.from(selectedHeroes) } : p);
                              });
                              toast(`"${name}" sauvegardée !`);
                              setPresetSaveOpen(false);
                              setPresetSaveName('');
                            }}
                            className="font-pixel text-[7px] px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => { setPresetSaveOpen(false); setPresetSaveName(''); }}
                            className="font-pixel text-[7px] px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <HeroPickerModal
                      open={pickerOpen}
                      heroes={player.heroes}
                      selectedIds={selectedHeroes}
                      onSelect={handlePickerSelect}
                      onClose={() => { setPickerOpen(false); setPickerSlotIdx(null); }}
                    />
                  </div>

                  <button onClick={startTreasureHunt} className="pixel-btn pixel-btn-gold w-full font-pixel text-xs flex items-center justify-center gap-2">
                    <Swords size={16} /> LANCER LA CHASSE !
                  </button>
                </div>
              </motion.div>
            )}

            {/* BATTLE SCREENS (treasure hunt & story) */}
            {isInBattle && gameState && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Game HUD */}
                <div className="pixel-border bg-card p-2.5 space-y-2">
                  {/* Stats + Controls — grille 3 cols mobile / 6 cols desktop */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {/* Stat 1 — Coins */}
                    <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded bg-muted border border-border/50">
                      <Coins size={14} className="text-game-gold" />
                      <span className="font-pixel text-[8px] text-game-gold tabular-nums leading-none">+{gameState.coinsEarned}</span>
                    </div>

                    {/* Stat 2 — Bombes */}
                    <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded bg-muted border border-border/50">
                      <span className="text-[14px] leading-none">💣</span>
                      <span className="font-pixel text-[8px] text-muted-foreground tabular-nums leading-none">{gameState.bombsPlaced}</span>
                    </div>

                    {/* Stat 3 — Coffres (Trésor) ou Ennemis (Histoire) */}
                    {!gameState.isStoryMode ? (
                      <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded bg-primary/15 border border-primary/30">
                        <span className="text-[14px] leading-none">📦</span>
                        <span className="font-pixel text-[8px] text-primary tabular-nums leading-none">
                          {gameState.chestsOpened}/{gameState.map.chests.length}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded bg-destructive/15 border border-destructive/30">
                        <Skull size={14} className="text-destructive" />
                        <span className="font-pixel text-[8px] text-destructive tabular-nums leading-none whitespace-nowrap">
                          {gameState.enemies?.filter(e => e.hp > 0).length || 0} rest.
                        </span>
                      </div>
                    )}

                    {/* Contrôle 1 — Vitesse */}
                    <button
                      onClick={() => {
                        const nextSpeed = gameState.speed === 1 ? 2 : gameState.speed === 2 ? 3 : 1;
                        huntSpeedRef.current = nextSpeed;
                        if (user) {
                          setPlayer(prev => ({ ...prev, huntSpeed: nextSpeed }));
                        } else {
                          localStorage.setItem('hunt-speed', String(nextSpeed));
                        }
                        setGameState(prev => (prev ? { ...prev, speed: nextSpeed } : prev));
                      }}
                      className="pixel-btn pixel-btn-secondary font-pixel text-[9px] flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-h-0 tabular-nums"
                      title="Vitesse de jeu"
                    >
                      <span className="text-[14px] leading-none">⚡</span>
                      <span className="leading-none">x{gameState.speed}</span>
                    </button>

                    {/* Contrôle 2 — Pause */}
                    <button
                      onClick={() => setGameState(prev => (prev ? { ...prev, isPaused: !prev.isPaused } : prev))}
                      className="pixel-btn pixel-btn-secondary font-pixel text-[9px] flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-h-0"
                    >
                      {gameState.isPaused
                        ? <><Play size={14} className="shrink-0" /><span className="leading-none">Reprise</span></>
                        : <><Pause size={14} className="shrink-0" /><span className="leading-none">Pause</span></>}
                    </button>

                    {/* Contrôle 3 — Quitter / Récupérer */}
                    <button
                      onClick={gameState.isStoryMode ? endStoryBattle : endTreasureHunt}
                      className={`pixel-btn font-pixel text-[9px] flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-h-0 ${
                        gameState.mapCompleted
                          ? 'pixel-btn-gold animate-pulse'
                          : 'bg-destructive/80 text-destructive-foreground border-destructive/80 hover:bg-destructive'
                      }`}
                    >
                      {gameState.mapCompleted
                        ? <><Check size={14} className="shrink-0" /><span className="leading-none">Récup!</span></>
                        : <><DoorOpen size={14} className="shrink-0" /><span className="leading-none">Quitter</span></>}
                    </button>
                  </div>

                </div>

                {/* Boss HP bar */}
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
                    <div className="w-full h-3 bg-muted overflow-hidden">
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
                  <div className="pixel-border bg-primary/10 p-2.5">
                    <span className="font-pixel text-[8px] text-primary flex items-center gap-1.5">
                      <FastForward size={12} /> AUTO-FARM ACTIF
                      <span className="text-muted-foreground tabular-nums">• Run #{farmStats.runs + 1} • {farmStats.totalCoins} BC</span>
                    </span>
                  </div>
                )}

                {/* Victory banner */}
                <AnimatePresence>
                {gameState.mapCompleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="pixel-border bg-card p-5 text-center glow-gold"
                  >
                    <p className="font-pixel text-sm sm:text-base text-game-gold flex items-center justify-center gap-2 text-glow-gold">
                      <Trophy size={22} /> {gameState.isStoryMode ? '⚔️ VICTOIRE!' : '🗺️ CARTE COMPLÉTÉE!'}
                    </p>
                    <p className="font-pixel text-lg sm:text-xl text-game-gold mt-2 flex items-center justify-center gap-2">
                      <Coins size={20} /> +{gameState.coinsEarned + (currentStoryStage?.reward || 0)} BC
                    </p>
                    {!gameState.isStoryMode && lastShardRewards.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 justify-center">
                        {lastShardRewards.map((reward, idx) => (
                          <div
                            key={idx}
                            className={`font-pixel text-xs px-2 py-1 rounded flex items-center gap-1 ${
                              reward.rarity === 'common' ? 'bg-gray-600 text-gray-200' :
                              reward.rarity === 'rare' ? 'bg-blue-600 text-blue-200' :
                              reward.rarity === 'epic' ? 'bg-purple-600 text-purple-200' :
                              'bg-orange-600 text-orange-200'
                            }`}
                          >
                            <Sparkles size={12} /> +{reward.quantity} {RARITY_CONFIG[reward.rarity].label}
                          </div>
                        ))}
                      </div>
                    )}
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
                </AnimatePresence>

                {/* Grid */}
                <div className="flex justify-center flex-col items-center">
                  <GameGrid gameState={gameState} />
                  {gameState && (
                    <CombatHeroPanel
                      deployedHeroes={gameState.heroes}
                    />
                  )}
                </div>

                {/* Event log */}
                <details className="pixel-border bg-card p-3">
                  <summary className="font-pixel text-[8px] text-muted-foreground cursor-pointer flex items-center gap-1">
                    <Scroll size={10} /> Journal ({gameState.eventLog.length})
                  </summary>
                  <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                    {gameState.eventLog.slice().reverse().map((log, i) => (
                      <p key={`${log}-${i}`} className="text-[10px] text-muted-foreground">{log}</p>
                    ))}
                  </div>
                </details>
              </motion.div>
            )}

          </div>
        </div>
        {/* PAGE 3 — Progression */}
        <ProgressionPage
          player={player}
          setPlayer={setPlayer}
          dailyQuests={dailyQuests}
          setDailyQuests={setDailyQuests}
          storyProgress={storyProgress}
          handleClaimQuest={handleClaimQuest}
          handleClaimDailyBonus={handleClaimDailyBonus}
        />

        {/* PAGE 4 — Forge */}
        <ForgePage
          player={player}
          forgeTab={forgeTab}
          setForgeTab={setForgeTab}
          selectedRecipeIdx={selectedRecipeIdx}
          setSelectedRecipeIdx={setSelectedRecipeIdx}
          fusionSlots={fusionSlots}
          lastFusedHero={lastFusedHero}
          setLastFusedHero={setLastFusedHero}
          isMerging={isMerging}
          getAvailableForMerge={getAvailableForMerge}
          executeFusionFromSlots={executeFusionFromSlots}
          handleSlotClick={handleSlotClick}
          handleHeroSelect={handleHeroSelect}
          handleSlotClear={handleSlotClear}
          mergeAll={mergeAll}
          fusionPickerOpen={fusionPickerOpen}
          setFusionPickerOpen={setFusionPickerOpen}
          fusionPickerSlot={fusionPickerSlot}
          setFusionPickerSlot={setFusionPickerSlot}
          fusionPickerHeroes={fusionPickerHeroes}
          setFusionPickerHeroes={setFusionPickerHeroes}
          handleRecycle={handleRecycle}
          handleToggleLock={handleToggleLock}
        />
        {/* PAGE 5 — Marché */}
        <div className="w-1/6 h-full overflow-y-auto pb-nav md:pl-16">
          <MarketplacePage
            player={player}
            user={user}
            onTransactionComplete={async () => {
              if (user && loadFromCloud) {
                const data = await loadFromCloud();
                if (data) {
                  setPlayer(data.playerData);
                  setStoryProgress(data.storyProgress);
                  setDailyQuests(data.dailyQuests);
                }
              }
            }}
          />
        </div>

      </motion.div>

      {/* Victory & Defeat overlays — placés hors du motion.div pour éviter le clipping par transform */}
      {gameState && (
        <VictoryOverlay
          show={gameState.mapCompleted && !autoFarm}
          coinsEarned={gameState.coinsEarned + (currentStoryStage?.reward || 0)}
          shardsEarned={lastShardRewards.reduce((sum, r) => sum + r.quantity, 0)}
          chestsOpened={gameState.chestsOpened}
          heroesActive={selectedHeroes.size}
          onContinue={gameState.isStoryMode ? endStoryBattle : endTreasureHunt}
          onAutoFarm={!gameState?.isStoryMode ? () => { setAutoFarm(true); collectAndContinue(true); } : undefined}
        />
      )}
      {gameState && (
        <DefeatOverlay
          show={(gameState.isStoryMode ?? false) && (gameState.storyFailed ?? false)}
          heroesKO={gameState.heroes.filter(h => h.currentStamina === 0)}
          onRetry={() => {
            if (currentStoryStage) startStoryStage(currentStoryStage);
          }}
          onQuit={endStoryBattle}
        />
      )}

      {!isInBattle && <MainNav page={page} onNavigate={setPage} />}


      {/* HeroUpgradeModal désactivé — détail héros rendu inline dans la Page 1 */}

      <SummonModal
        isOpen={summonOpen}
        onClose={() => setSummonOpen(false)}
        onSummon={handleSummon}
        coins={player.bomberCoins}
        lastSummoned={lastSummoned}
        summonedBatch={summonedBatch}
        pityCounters={player.pityCounters}
      />


      <TutorialOverlay
        step={tutorialCurrentStep}
        onAdvance={advanceTutorial}
        onSkip={skipTutorial}
      />
    </div>
  );
};

export default Index;
