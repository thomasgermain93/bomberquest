import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { motion, AnimatePresence } from 'framer-motion';
import { pixelFade } from '@/lib/animations';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import GameGrid from '@/components/GameGrid';
import CombatHeroPanel from '@/components/CombatHeroPanel';
import HeroCard from '@/components/HeroCard';
import HeroCollectionStats from '@/components/HeroCollectionStats';
import SummonModal from '@/components/SummonModal';
import HeroUpgradeModal from '@/components/HeroUpgradeModal';
import HeroDetailInline from '@/components/HeroDetailInline';
import HeroPickerModal from '@/components/HeroPickerModal';
import FusionSlot from '@/components/FusionSlot';
import StoryMode from '@/components/StoryMode';
import { GameState, Hero, MAP_CONFIGS, PlayerData, RARITY_CONFIG, RARITY_ORDER, sortByRarity, Rarity, HERO_NAMES, HERO_FAMILIES, HERO_FAMILY_MAP, HeroFamilyId, MAX_LEVEL_BY_RARITY } from '@/game/types';
import { generateMap, tickGame } from '@/game/engine';
import { summonHero, generateHero } from '@/game/summoning';
import { loadPlayerData, savePlayerData, getDefaultPlayerData, saveStoryProgress, loadStoryProgress } from '@/game/saveSystem';
import { getUpgradeCost, upgradeHero, ascendHero, getAscensionCost, countDuplicates, upgradeSkillWithDuplicate } from '@/game/upgradeSystem';
import { trackSummon, trackCombatVictory, trackLevelUp, trackRarityUnlock, trackChestsOpened, trackBossDefeated, trackHeroCount, claimAchievementReward, AchievementDefinition, ACHIEVEMENTS } from '@/game/achievements';
import { DailyQuestData, loadDailyQuests, saveDailyQuests, generateDailyQuests, updateQuestProgress, ALL_CLAIMED_BONUS, ALL_CLAIMED_XP_BONUS } from '@/game/questSystem';
import { StoryProgress, StoryStage, BOSS_LEVEL_BY_TYPE, BossType, EnemyType } from '@/game/storyTypes';
import { getHeroFamily, getClanAffinityMultiplier, getActiveClanSkills } from '@/game/clanSystem';
import { spawnEnemy, spawnBoss, tickEnemies, tickBoss, damageEnemiesFromExplosion, damageBossFromExplosion, checkEnemyHeroCollision, checkBossHeroCollision } from '@/game/enemyAI';
import { STORY_REGIONS } from '@/game/storyData';
import { getExplosionTiles } from '@/game/engine';
import { generateShardRewards, applyShardRewards, ShardReward, generateUniversalShardReward } from '@/game/shardRewardSystem';
import { recycleHeroes } from '@/game/recycleSystem';
import RecyclePanel from '@/components/RecyclePanel';
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
import { Users, Sparkles, Swords, Map as MapIcon, Trophy, Coins, Play, Pause, DoorOpen, Check, Scroll, FastForward, BookOpen, Shield, Skull, Lock as LockIcon, Hammer, ArrowDown, Gem, Filter, ChevronDown, Zap, Volume2, VolumeX } from 'lucide-react';
import PityTracker from '@/components/PityTracker';
import VictoryOverlay from '@/components/VictoryOverlay';
import DefeatOverlay from '@/components/DefeatOverlay';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import DailyResetTimer from '@/components/DailyResetTimer';
import { SFX, isMuted, setMuted } from '@/game/sfx';
import { toast } from '@/hooks/use-toast';

type Screen = 'hub' | 'treasure-hunt' | 'heroes' | 'codex' | 'fusion' | 'summon' | 'story' | 'story-battle' | 'achievements' | 'combat' | 'recycle';



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

// Merge system - ratios from issue #93
// Declared at module level to avoid TDZ when used in useEffect before const declaration inside component
const MERGE_RECIPES: { from: Rarity; to: Rarity; count: number }[] = [
  { from: 'common', to: 'rare', count: 2 },
  { from: 'rare', to: 'super-rare', count: 3 },
  { from: 'super-rare', to: 'epic', count: 4 },
  { from: 'epic', to: 'legend', count: 5 },
  { from: 'legend', to: 'super-legend', count: 6 },
];

const Index = () => {
  usePageMeta({ title: 'Jeu', noIndex: true });
  const { user, session, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('hub');
  const [page, setPage] = useState(2); // page Combat par défaut
  const [heroesTab, setHeroesTab] = useState<'collection' | 'codex' | 'equipes'>('collection');
  const [combatTab, setCombatTab] = useState<'treasure' | 'story'>('treasure');
  const [forgeTab, setForgeTab] = useState<'fusion' | 'recycle'>('fusion');
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
  const [summonTab, setSummonTab] = useState<'coins' | 'shards'>('coins');
  const [selectedShardRarity, setSelectedShardRarity] = useState<Rarity>('rare');
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
  const [lastShardRewards, setLastShardRewards] = useState<ShardReward[]>([]);
  const [storyRegionIdx, setStoryRegionIdx] = useState(0);
  
  // Fusion UI state
  const [selectedRecipeIdx, setSelectedRecipeIdx] = useState<number>(0);
  const [fusionSlots, setFusionSlots] = useState<(Hero | null)[]>([null, null]);
  const [lastFusedHero, setLastFusedHero] = useState<Hero | null>(null);
  const [heroPickerOpen, setHeroPickerOpen] = useState(false);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [heroFilters, setHeroFilters] = useState<HeroFilters>(DEFAULT_HERO_FILTERS);
  const [codexClanFilter, setCodexClanFilter] = useState<'all' | HeroFamilyId>('all');

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

  // Reset fusion slots when recipe changes
  useEffect(() => {
    setFusionSlots(Array(MERGE_RECIPES[selectedRecipeIdx].count).fill(null));
  }, [selectedRecipeIdx]);
  const huntSpeedRef = useRef(1);
  const gameLoopRef = useRef<number>();
  const cloudLoadedRef = useRef(false);
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

    let cancelled = false;
    loadWithRetry().then(data => {
      if (cancelled) return;
      const today = new Date().toISOString().split('T')[0];
      if (data) {
        setPlayer(data.playerData);
        setStoryProgress(data.storyProgress ?? { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] });
        setDailyQuests(data.dailyQuests?.date === today ? data.dailyQuests : generateDailyQuests());
        const cloudSpeed = data.playerData.huntSpeed;
        if (cloudSpeed === 2 || cloudSpeed === 3) huntSpeedRef.current = cloudSpeed;
        setCloudValidated(true);
      } else {
        // Pas de save cloud → nouvel utilisateur
        setPlayer(getDefaultPlayerData());
        setStoryProgress({ completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] });
        setDailyQuests(generateDailyQuests());
        setCloudValidated(true);
      }
      cloudLoadedRef.current = true;
    }).catch((err) => {
      if (cancelled) return;
      const error = err as Error & { code?: string };
      console.error('CLOUD_LOAD_UNEXPECTED_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
      setCloudValidated(false);
      cloudLoadedRef.current = true;
      toast({ title: 'Cloud indisponible', description: 'Impossible de charger la sauvegarde. Réessaie.', duration: 4000 });
    }).finally(() => {
      if (!cancelled) setIsCloudLoading(false);
    });
    return () => { cancelled = true; };
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
              // Trouver le héros ayant posé la bombe pour appliquer son affinité clan (#154)
              // TODO #154 : affinité précise par ennemi individuel — nécessite refacto damageEnemiesFromExplosion
              const bombHero = exp.heroId ? state.heroes.find(h => h.id === exp.heroId) : undefined;
              const heroFamily = bombHero ? getHeroFamily(bombHero) : undefined;
              // Calculer un multiplicateur d'affinité moyen basé sur les types d'ennemis présents dans l'explosion
              const hitEnemies = enemies.filter(e => {
                const ex = Math.round(e.position.x);
                const ey = Math.round(e.position.y);
                return e.hp > 0 && exp.tiles.some(t => t.x === ex && t.y === ey);
              });
              const affinityMult = hitEnemies.length > 0
                ? hitEnemies.reduce((sum, e) => sum + getClanAffinityMultiplier(heroFamily, e.type as EnemyType), 0) / hitEnemies.length
                : 1.0;
              const basePower = Math.max(...state.heroes.map(h => h.stats.pwr), 1);
              const heroPower = Math.round(basePower * affinityMult);
              const { enemies: updatedEnemies, kills, totalDamage } = damageEnemiesFromExplosion(enemies, exp.tiles, heroPower, exp.heroId);
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
                const bossResult = damageBossFromExplosion(boss, exp.tiles, heroPower + 1);
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

  // MERGE_RECIPES is now declared at module level (above) to prevent TDZ crash

  const isHeroEligibleForMerge = (hero: Hero, rarity: Rarity, requiredCount: number): { eligible: boolean; reason: string } => {
    const maxLevel = RARITY_CONFIG[rarity].maxLevel;
    if (hero.rarity !== rarity) {
      return { eligible: false, reason: `Rareté ${RARITY_CONFIG[rarity].label} requise` };
    }
    if (hero.level < maxLevel) {
      return { eligible: false, reason: `Niveau ${maxLevel} requis (${hero.level}/${maxLevel})` };
    }
    return { eligible: true, reason: '' };
  };

  const getAvailableForMerge = (rarity: Rarity): { total: number; maxed: number } => {
    const heroesOfRarity = player.heroes.filter(h => h.rarity === rarity);
    const maxLevel = RARITY_CONFIG[rarity].maxLevel;
    const maxed = heroesOfRarity.filter(h => h.level >= maxLevel).length;
    return { total: heroesOfRarity.length, maxed };
  };

  const handleMerge = (from: Rarity, to: Rarity, count: number) => {
    const maxLevel = RARITY_CONFIG[from].maxLevel;
    const available = player.heroes.filter(h => h.rarity === from && h.level >= maxLevel);
    if (available.length < count) {
      toast({
        title: "Fusion impossible",
        description: `Vous avez besoin de ${count} héros ${RARITY_CONFIG[from].label} niveau ${maxLevel}`,
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

    if (canWriteCloud) {
      saveHeroesToCloud([newHero]);
      removeHeroesFromCloud(removedIds);
    }

    toast({
      title: "Fusion réussie!",
      description: `${RARITY_CONFIG[from].label} → ${RARITY_CONFIG[to].label}`,
    });
  };

  // Execute fusion from fusion slots UI
  const executeFusionFromSlots = () => {
    const recipe = MERGE_RECIPES[selectedRecipeIdx];
    const filledSlots = fusionSlots.filter(s => s !== null) as Hero[];
    
    if (filledSlots.length !== recipe.count) {
      toast({
        title: "Slots incomplets",
        description: `Vous devez remplir ${recipe.count} slots`,
      });
      return;
    }

    const toRemove = new Set(filledSlots.map(h => h.id));
    const removedIds = Array.from(toRemove);
    const newHero = generateHero(recipe.to);
    const mergedHeroes = [...player.heroes.filter(h => !toRemove.has(h.id)), newHero];
    
    setPlayer(prev => ({
      ...prev,
      heroes: mergedHeroes,
      totalHeroesOwned: mergedHeroes.length,
    }));

    if (canWriteCloud) {
      saveHeroesToCloud([newHero]);
      removeHeroesFromCloud(removedIds);
    }

    setLastFusedHero(newHero);

    toast({
      title: "Fusion réussie!",
      description: `${RARITY_CONFIG[recipe.from].label} → ${RARITY_CONFIG[recipe.to].label}`,
    });

    // Reset slots
    setFusionSlots(Array(recipe.count).fill(null));
  };

  const handleSlotClick = (index: number) => {
    setActiveSlotIdx(index);
    setHeroPickerOpen(true);
  };

  const handleHeroSelect = (hero: Hero) => {
    if (activeSlotIdx !== null) {
      const newSlots = [...fusionSlots];
      newSlots[activeSlotIdx] = hero;
      setFusionSlots(newSlots);
    }
    setHeroPickerOpen(false);
    setActiveSlotIdx(null);
  };

  const handleSlotClear = (index: number) => {
    const newSlots = [...fusionSlots];
    newSlots[index] = null;
    setFusionSlots(newSlots);
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
        const maxLevel = RARITY_CONFIG[recipe.from].maxLevel;
        const available = currentHeroes.filter(h => h.rarity === recipe.from && h.level >= maxLevel);
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
        description: "Vous n'avez pas assez de héros pour fusionner",
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
        toast({
          title: "🎉 Boss vaincu!",
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

  const [summonedBatch, setSummonedBatch] = useState<Hero[]>([]);
  const [showSummonFlash, setShowSummonFlash] = useState(false);
  const prevSummonedBatchRef = useRef<Hero[]>([]);

  useEffect(() => {
    if (summonedBatch.length > 0 && summonedBatch !== prevSummonedBatchRef.current) {
      prevSummonedBatchRef.current = summonedBatch;
      setShowSummonFlash(true);
      const t = setTimeout(() => setShowSummonFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [summonedBatch]);

  const handleSummon = (type: 'single' | 'x10' | 'x100') => {
    const cost = type === 'single' ? 1000 : type === 'x10' ? 9000 : 80000;
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

  const SHARD_COSTS: Record<Rarity, number> = {
    common: 10, rare: 50, 'super-rare': 150, epic: 400, legend: 1000, 'super-legend': 2500,
  };

  const handleSummonShards = () => {
    const cost = SHARD_COSTS[selectedShardRarity];
    if (player.universalShards < cost) {
      toast({ title: 'Fragments insuffisants', description: `Il te faut ${cost} Fragments pour cette invocation.` });
      return;
    }

    const newHero = generateHero(selectedShardRarity);
    const newHeroes = [...player.heroes, newHero];

    setLastSummoned(newHero);
    setSummonedBatch([newHero]);

    const newTotalSummons = player.totalHeroesOwned + 1;
    const newAchievements = { ...player.achievements };
    const newAchievementUnlocks: AchievementDefinition[] = [];

    const { newState: summonState, unlocked: summonUnlocks } = trackSummon(player.achievements, newTotalSummons);
    Object.assign(newAchievements, summonState);
    newAchievementUnlocks.push(...summonUnlocks);

    const { newState: heroCountState, unlocked: heroCountUnlocks } = trackHeroCount(player.achievements, newHeroes.length);
    Object.assign(newAchievements, heroCountState);
    newAchievementUnlocks.push(...heroCountUnlocks);

    setPlayer(prev => ({
      ...prev,
      heroes: newHeroes,
      totalHeroesOwned: newHeroes.length,
      achievements: newAchievements,
      universalShards: prev.universalShards - cost,
    }));

    for (const achievement of newAchievementUnlocks) {
      toast({ title: 'Succès débloqué!', description: achievement.title });
    }

    if (canWriteCloud) {
      saveHeroesToCloud([newHero]);
    }
    setDailyQuests(prev => updateQuestProgress(prev, 'summon_heroes', 1));
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
      toast({ title: 'Impossible', description: result.message, variant: 'destructive' });
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
    toast({ title: '⚡ Compétence améliorée!', description: result.message });
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
    toast({ title: `♻️ Recyclage!`, description: `${ids.length} héros recyclés → +${shardsGained} 💎` });
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

  const PAGE_TITLES = ['Invoquer', 'Héros', 'Combat', 'Social', 'Forge'];

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
      if (deltaX < 0) setPage(p => Math.min(4, p + 1));
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
      />

      {/* Container swipeable 5 pages */}
      <motion.div
        className="flex flex-1 min-h-0 pt-12"
        style={{ width: '500%' }}
        animate={{ x: `${-page * 20}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* PAGE 0 — Invoquer */}
        <div className="w-1/5 h-full overflow-y-auto pb-nav md:pl-16">
          <div className="p-4 max-w-2xl mx-auto space-y-4">
            {/* Tabs BC / Shards */}
            <div className="flex gap-2">
              <button onClick={() => setSummonTab('coins')} className={`flex-1 pixel-btn font-pixel text-[8px] flex items-center justify-center gap-2 ${summonTab === 'coins' ? 'pixel-btn-gold' : 'pixel-btn-secondary'}`}>
                <Coins size={12} /> BomberCoins
              </button>
              <button onClick={() => setSummonTab('shards')} className={`flex-1 pixel-btn font-pixel text-[8px] flex items-center justify-center gap-2 ${summonTab === 'shards' ? 'pixel-btn-gold' : 'pixel-btn-secondary'}`}>
                <Gem size={12} /> Fragments
              </button>
            </div>

            {/* BC Tab */}
            {summonTab === 'coins' && (
              <div className="pixel-border bg-card p-4 space-y-3">
                <h3 className="font-pixel text-[9px] text-foreground flex items-center gap-2"><Sparkles size={12} /> INVOCATION BC</h3>
                <div className="grid grid-cols-3 gap-2">
                  {([['single', '×1', 1000], ['x10', '×10', 9000], ['x100', '×100', 80000]] as const).map(([type, label, cost]) => (
                    <button key={type} onClick={() => handleSummon(type)} disabled={player.bomberCoins < cost}
                      className="pixel-btn pixel-btn-gold font-pixel text-[8px] flex flex-col items-center gap-1 disabled:opacity-40">
                      <span>{label}</span>
                      <span className="text-[7px]">{cost.toLocaleString('fr-FR')} BC</span>
                    </button>
                  ))}
                </div>
                <PityTracker pitiCounts={{
                  rare: player.pityCounters.rare,
                  superRare: player.pityCounters.superRare,
                  epic: player.pityCounters.epic,
                  legend: player.pityCounters.legend,
                }} />
              </div>
            )}

            {/* Shards Tab */}
            {summonTab === 'shards' && (
              <div className="pixel-border bg-card p-4 space-y-3">
                <h3 className="font-pixel text-[9px] text-foreground flex items-center gap-2"><Gem size={12} /> INVOCATION FRAGMENTS</h3>
                <div className="grid grid-cols-3 gap-1">
                  {(['rare', 'super-rare', 'epic', 'legend', 'super-legend'] as Rarity[]).map(r => {
                    const costs: Record<string, number> = { rare: 50, 'super-rare': 150, epic: 400, legend: 1000, 'super-legend': 2500 };
                    return (
                      <button key={r} onClick={() => setSelectedShardRarity(r)}
                        className={`pixel-border p-2 font-pixel text-[7px] text-center transition-all ${selectedShardRarity === r ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted/30'}`}
                        style={{ color: `hsl(var(--game-rarity-${r}))` }}>
                        {RARITY_CONFIG[r].label}<br />
                        <span className="text-muted-foreground">{costs[r]} 💎</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleSummonShards} disabled={player.universalShards < ({ rare: 50, 'super-rare': 150, epic: 400, legend: 1000, 'super-legend': 2500 }[selectedShardRarity] || 0)}
                  className="pixel-btn pixel-btn-gold w-full font-pixel text-[8px] flex items-center justify-center gap-2 disabled:opacity-40">
                  <Sparkles size={14} /> INVOQUER — {({ rare: 50, 'super-rare': 150, epic: 400, legend: 1000, 'super-legend': 2500 }[selectedShardRarity])} 💎
                </button>
              </div>
            )}

            {/* Dernière invocation */}
            {lastSummoned && (
              <div className="pixel-border bg-card p-4 relative overflow-hidden">
                {/* Flash de fond blanc au nouveau batch */}
                <AnimatePresence>
                  {showSummonFlash && (
                    <motion.div
                      key="summon-flash"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-white pointer-events-none z-10"
                    />
                  )}
                </AnimatePresence>
                <h3 className="font-pixel text-[9px] text-foreground mb-3">DERNIÈRE INVOCATION</h3>
                {(() => {
                  const RARITY_BADGE_COLORS: Record<string, string> = {
                    common: 'text-muted-foreground',
                    rare: 'text-green-400',
                    'super-rare': 'text-blue-400',
                    epic: 'text-orange-400',
                    legend: 'text-yellow-400',
                    'super-legend': 'text-purple-400',
                  };
                  const RARITY_GLOW_COLORS: Record<string, string> = {
                    'super-rare': 'rgba(100,160,255,0.5)',
                    epic: 'rgba(255,136,0,0.55)',
                    legend: 'rgba(255,200,0,0.6)',
                    'super-legend': 'rgba(200,80,255,0.65)',
                  };
                  const HIGH_RARITIES = ['epic', 'legend', 'super-legend'];
                  const GLOW_RARITIES = ['super-rare', 'epic', 'legend', 'super-legend'];

                  if (summonedBatch.length > 1) {
                    return (
                      <div className="grid grid-cols-5 gap-1">
                        <AnimatePresence>
                          {summonedBatch.slice(0, 10).map((h, i) => {
                            const isHigh = HIGH_RARITIES.includes(h.rarity);
                            const isGlow = GLOW_RARITIES.includes(h.rarity);
                            const glowColor = RARITY_GLOW_COLORS[h.rarity];
                            return (
                              <motion.div
                                key={h.id}
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={isGlow ? {
                                  opacity: 1, y: 0, scale: 1,
                                  boxShadow: [
                                    `0 0 6px ${glowColor}`,
                                    `0 0 14px ${glowColor}`,
                                    `0 0 6px ${glowColor}`,
                                  ],
                                } : { opacity: 1, y: 0, scale: 1 }}
                                transition={isGlow ? {
                                  opacity: { delay: i * 0.08, duration: 0.3 },
                                  y: { delay: i * 0.08, duration: 0.3 },
                                  scale: { delay: i * 0.08, duration: 0.3 },
                                  boxShadow: { delay: i * 0.08 + 0.3, duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                                } : { delay: i * 0.08, duration: 0.3 }}
                                className={`flex flex-col items-center gap-1 p-1 rounded-md ${isHigh ? 'ring-2 ring-game-gold/60' : ''}`}
                              >
                                <HeroAvatar heroId={h.id} heroName={h.name} rarity={h.rarity} size={36} />
                                <p className={`font-pixel text-[6px] truncate w-full text-center ${RARITY_BADGE_COLORS[h.rarity] || 'text-muted-foreground'}`}>
                                  {RARITY_CONFIG[h.rarity].label}
                                </p>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  const h = lastSummoned;
                  const isHigh = HIGH_RARITIES.includes(h.rarity);
                  const isGlow = GLOW_RARITIES.includes(h.rarity);
                  const glowColor = RARITY_GLOW_COLORS[h.rarity];
                  return (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={isGlow ? {
                        opacity: 1, y: 0, scale: 1,
                        boxShadow: [
                          `0 0 8px ${glowColor}`,
                          `0 0 20px ${glowColor}`,
                          `0 0 8px ${glowColor}`,
                        ],
                      } : { opacity: 1, y: 0, scale: 1 }}
                      transition={isGlow ? {
                        opacity: { duration: 0.3 },
                        y: { duration: 0.3 },
                        scale: { duration: 0.3 },
                        boxShadow: { delay: 0.3, duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
                      } : { duration: 0.3 }}
                      className={`flex flex-col items-center gap-2 p-2 rounded-md ${isHigh ? 'ring-2 ring-game-gold/60' : ''}`}
                    >
                      <HeroAvatar heroId={h.id} heroName={h.name} rarity={h.rarity} size={64} />
                      <p className="font-pixel text-[9px] text-foreground">{h.name}</p>
                      <p className={`font-pixel text-[8px] ${RARITY_BADGE_COLORS[h.rarity] || 'text-muted-foreground'}`}>
                        {RARITY_CONFIG[h.rarity].label}
                      </p>
                    </motion.div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* PAGE 1 — Héros */}
        <div className="w-1/5 h-full overflow-y-auto pb-nav md:pl-16">
          <div className="p-4 max-w-6xl mx-auto">
            {upgradeHeroId && upgradeHeroData ? (
              /* VUE DÉTAIL HÉROS — pleine page */
              <HeroDetailInline
                hero={upgradeHeroData}
                coins={player.bomberCoins}
                allHeroes={player.heroes}
                onBack={() => setUpgradeHeroId(null)}
                onUpgrade={handleUpgrade}
                onAscend={handleAscend}
              />
            ) : (
              <>
            {/* Sub-tabs */}
            <div className="flex gap-1 mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              {(['collection', 'codex', 'equipes'] as const).map(tab => (
                <button key={tab} onClick={() => setHeroesTab(tab)}
                  className={`flex-1 font-pixel text-[8px] py-2 rounded transition-colors ${
                    heroesTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                  {tab === 'collection' ? 'Collection' : tab === 'codex' ? 'Codex' : 'Équipes'}
                </button>
              ))}
            </div>

            {/* Tab Collection */}
            {heroesTab === 'collection' && (
              <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
                    <Users size={16} /> TOUS LES HÉROS ({player.heroes.length})
                  </h2>
                </div>

                <HeroCollectionStats heroes={player.heroes} />

                <div className="pixel-border bg-card">
                  <button
                    onClick={() => setFiltersExpanded(p => !p)}
                    className="flex items-center justify-between w-full p-3"
                  >
                    <span className="font-pixel text-[9px] text-foreground flex items-center gap-2">
                      <Filter size={12} /> TRIER / FILTRER
                      {(heroFilters.rarity !== 'all' || heroFilters.level !== 'all' || heroFilters.sortBy !== 'rarity' || heroFilters.showDuplicatesOnly || heroFilters.showLockedOnly) && (
                        <span className="text-[7px] text-primary">● actifs</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[7px] text-muted-foreground">{filteredHeroes.length}/{player.heroes.length}</span>
                      <ChevronDown size={14} className={`text-muted-foreground transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {filtersExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border">
                      {/* Tri */}
                      <div className="pt-2 space-y-1.5">
                        <p className="font-pixel text-[7px] text-muted-foreground uppercase">Trier par</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {([['rarity', 'Rareté'], ['level', 'Niveau']] as const).map(([val, label]) => (
                            <button
                              key={val}
                              onClick={() => setHeroFilters(f => ({ ...f, sortBy: val }))}
                              className={`font-pixel text-[7px] px-2.5 py-1 border transition-colors ${
                                heroFilters.sortBy === val
                                  ? 'border-primary text-primary bg-primary/15'
                                  : 'border-border text-muted-foreground bg-muted/30 hover:border-primary/50'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtre rareté */}
                      <div className="space-y-1.5">
                        <p className="font-pixel text-[7px] text-muted-foreground uppercase">Rareté</p>
                        <div className="flex gap-1 flex-wrap">
                          {(['all', ...Object.keys(RARITY_CONFIG)] as ('all' | Rarity)[]).map(r => (
                            <button
                              key={r}
                              onClick={() => setHeroFilters(f => ({ ...f, rarity: r }))}
                              className={`font-pixel text-[7px] px-2 py-0.5 border transition-colors ${
                                heroFilters.rarity === r
                                  ? 'border-primary text-primary bg-primary/15'
                                  : 'border-border text-muted-foreground bg-muted/30 hover:border-primary/50'
                              }`}
                            >
                              {r === 'all' ? 'Tous' : RARITY_CONFIG[r as Rarity].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtre niveau */}
                      <div className="space-y-1.5">
                        <p className="font-pixel text-[7px] text-muted-foreground uppercase">Niveau</p>
                        <div className="flex gap-1 flex-wrap">
                          {(['all', '1-20', '21-40', '41-60', '61+'] as HeroLevelFilter[]).map(l => (
                            <button
                              key={l}
                              onClick={() => setHeroFilters(f => ({ ...f, level: l }))}
                              className={`font-pixel text-[7px] px-2 py-0.5 border transition-colors ${
                                heroFilters.level === l
                                  ? 'border-primary text-primary bg-primary/15'
                                  : 'border-border text-muted-foreground bg-muted/30 hover:border-primary/50'
                              }`}
                            >
                              {l === 'all' ? 'Tous' : `Niv.${l}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggles + reset */}
                      <div className="flex gap-1.5 flex-wrap items-center pt-1 border-t border-border">
                        <button
                          onClick={() => setHeroFilters(f => ({ ...f, showDuplicatesOnly: !f.showDuplicatesOnly }))}
                          className={`font-pixel text-[7px] px-2 py-1 border transition-colors ${
                            heroFilters.showDuplicatesOnly ? 'border-orange-400 text-orange-400 bg-orange-400/15' : 'border-border text-muted-foreground bg-muted/30'
                          }`}
                        >
                          Doublons
                        </button>
                        <button
                          onClick={() => setHeroFilters(f => ({ ...f, showLockedOnly: !f.showLockedOnly }))}
                          className={`font-pixel text-[7px] px-2 py-1 border transition-colors ${
                            heroFilters.showLockedOnly ? 'border-yellow-400 text-yellow-400 bg-yellow-400/15' : 'border-border text-muted-foreground bg-muted/30'
                          }`}
                        >
                          🔒 Lockés
                        </button>
                        <button
                          onClick={() => setHeroFilters(DEFAULT_HERO_FILTERS)}
                          className="pixel-btn pixel-btn-secondary font-pixel text-[7px] px-2 py-1 min-h-0 ml-auto"
                        >
                          Réinitialiser
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {filteredHeroes.length === 0 ? (
                  <EmptyState
                    icon={Filter}
                    title="Aucun héros ne correspond"
                    description="Essayez d'élargir un critère ou réinitialisez les filtres."
                    action={{
                      label: 'Réinitialiser les filtres',
                      onClick: () => setHeroFilters(DEFAULT_HERO_FILTERS),
                      variant: 'secondary'
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredHeroes.map(hero => (
                      <HeroCard key={hero.id} hero={hero} onClick={() => setUpgradeHeroId(hero.id)} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab Codex */}
            {heroesTab === 'codex' && (
              <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-4">
                <div className="pixel-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-pixel text-[9px] text-foreground flex items-center gap-2">
                      <Trophy size={12} className="text-game-gold" /> Collection débloquée
                    </p>
                    <p className="font-pixel text-[10px] text-primary tabular-nums">
                      {codexUnlockedCount}/{codexTotalCount}
                    </p>
                  </div>
                  <div className="w-full h-2.5 bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-game-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, Math.round((codexUnlockedCount / codexTotalCount) * 100))}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground">
                    Les héros non débloqués restent masqués (silhouette) pour garder la surprise.
                  </p>
                </div>

                {/* Filtre clan Codex — boutons toggle pixel art */}
                <div className="pixel-border bg-card p-3 space-y-2">
                  <p className="font-pixel text-[7px] text-muted-foreground uppercase">Filtrer par clan</p>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setCodexClanFilter('all')}
                      className={`font-pixel text-[7px] px-2.5 py-1 border transition-colors ${
                        codexClanFilter === 'all'
                          ? 'border-primary text-primary bg-primary/15'
                          : 'border-border text-muted-foreground bg-muted/30 hover:border-primary/50'
                      }`}
                    >
                      Tous
                    </button>
                    {HERO_FAMILIES.map(family => (
                      <button
                        key={family.id}
                        onClick={() => setCodexClanFilter(codexClanFilter === family.id ? 'all' : family.id)}
                        className={`font-pixel text-[7px] px-2.5 py-1 border transition-colors ${
                          codexClanFilter === family.id
                            ? 'border-primary text-primary bg-primary/15'
                            : 'border-border text-muted-foreground bg-muted/30 hover:border-primary/50'
                        }`}
                      >
                        {family.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group codex entries by rarity */}
                <div className="space-y-6">
                  {CODEX_RARITY_ORDER.map((rarity) => {
                    const entriesForRarity = codexByName.filter(entry => {
                      if (entry.rarity !== rarity) return false;
                      if (codexClanFilter !== 'all') {
                        const heroFamily = HERO_FAMILY_MAP[entry.key];
                        if (heroFamily !== codexClanFilter) return false;
                      }
                      return true;
                    });
                    const unlockedCount = entriesForRarity.filter(e => e.unlocked).length;
                    const totalCount = entriesForRarity.length;

                    if (totalCount === 0) return null;

                    return (
                      <div key={rarity} className="space-y-2">
                        {/* Rarity header */}
                        <p className={`font-pixel text-[8px] ${CODEX_RARITY_COLOR[rarity]}`}>
                          {CODEX_RARITY_LABEL[rarity]} ({unlockedCount}/{totalCount})
                        </p>

                        {/* Grid for this rarity */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {entriesForRarity.map((entry) => (
                            <div
                              key={entry.key}
                              className={`pixel-border p-3 transition-all ${
                                entry.unlocked ? `bg-card rarity-${entry.rarity}` : 'bg-muted/30'
                              }`}
                            >
                              <div className="relative flex justify-center mb-2">
                                <div className={entry.unlocked ? '' : 'opacity-35 grayscale blur-[0.8px]'}>
                                  <HeroAvatar heroId={entry.heroPreviewId} rarity={entry.rarity} size={48} />
                                </div>
                                {!entry.unlocked && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="px-2 py-0.5 rounded bg-background/80 border border-border flex items-center gap-1">
                                      <LockIcon size={10} className="text-muted-foreground" />
                                      <span className="font-pixel text-[7px] text-muted-foreground">LOCKED</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="font-pixel text-[8px] text-center text-foreground truncate">
                                {entry.unlocked ? entry.displayName : '???'}
                              </p>
                              <p className="text-[8px] text-center mt-1" style={{ color: `hsl(var(--game-rarity-${entry.rarity}))` }}>
                                {entry.unlocked ? RARITY_CONFIG[entry.rarity].label : 'Inconnu'}
                              </p>
                              <p className="text-[8px] text-center text-muted-foreground mt-1 tabular-nums">
                                {entry.unlocked ? `Possédés: ${entry.ownedCount}` : 'À invoquer'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Tab Équipes */}
            {heroesTab === 'equipes' && (
              <TeamPresets
                heroes={player.heroes}
                presets={teamPresets}
                onSave={setTeamPresets}
                onLoadTeam={(heroIds) => {
                  setSelectedHeroes(new Set(heroIds));
                  toast({ title: 'Équipe chargée !', description: 'Prête pour le combat.' });
                }}
              />
            )}
              </>
            )}
          </div>
        </div>

        {/* PAGE 2 — Combat */}
        <div className={`w-1/5 h-full overflow-y-auto pb-nav ${isInBattle ? '' : 'md:pl-16'}`}>
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
                        return (
                          <div
                            key={slotIdx}
                            className={`pixel-border p-2 flex flex-col items-center justify-center min-h-[72px] transition-all ${
                              hero ? `bg-card rarity-${hero.rarity}` : 'bg-muted/30 border-dashed'
                            }`}
                          >
                            {hero ? (
                              <>
                                <HeroAvatar heroId={hero.id} heroName={hero.name} rarity={hero.rarity} size={32} />
                                <p className="font-pixel text-[7px] text-foreground mt-1 truncate max-w-[60px]">{hero.name.split(' ')[0]}</p>
                                <p className="text-[7px] mt-0.5" style={{ color: `hsl(var(--game-rarity-${hero.rarity}))` }}>
                                  {RARITY_CONFIG[hero.rarity].label}
                                </p>
                                <button
                                  onClick={() => toggleHeroSelection(hero.id)}
                                  className="text-[7px] text-destructive hover:text-destructive/80 mt-0.5 min-w-[32px] min-h-[32px] flex items-center justify-center"
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

                    {/* Charger un preset */}
                    <div className="pixel-border bg-muted/20 rounded p-3">
                      <p className="font-pixel text-[8px] text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Play size={10} /> Charger une équipe sauvegardée
                      </p>
                      {teamPresets.some(p => p.heroIds.length > 0) ? (
                        <div className="flex gap-2 flex-wrap">
                          {teamPresets.filter(p => p.heroIds.length > 0).map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setSelectedHeroes(new Set(preset.heroIds));
                                toast({ title: `${preset.name} chargée !` });
                              }}
                              className="pixel-btn pixel-btn-secondary font-pixel text-[7px] px-2 py-1 flex items-center gap-1"
                            >
                              <Play size={10} /> {preset.name} ({preset.heroIds.length})
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="font-pixel text-[8px] text-muted-foreground/60">Aucun preset — sauvegarde une équipe dans l'onglet Héros &gt; Équipes</p>
                      )}
                    </div>

                    <details className="pixel-border bg-muted/20 rounded">
                      <summary className="font-pixel text-[8px] text-muted-foreground cursor-pointer px-3 py-2 flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <Users size={10} /> Choisir manuellement ({player.heroes.length} héros disponibles)
                      </summary>
                      <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                        {player.heroes.sort(sortByRarity).map(hero => (
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

                  {/* Synergies actives */}
                  {activeClanSkills.length > 0 && (
                    <div className="pixel-border bg-primary/5 p-3 space-y-1 mb-3">
                      <p className="font-pixel text-[8px] text-primary mb-2">✨ SYNERGIES ACTIVES</p>
                      {activeClanSkills.map((skill, i) => (
                        <p key={i} className="text-[8px] text-foreground flex items-center gap-1.5">
                          <span className="text-primary">▸</span> {skill.name} — {skill.description}
                        </p>
                      ))}
                    </div>
                  )}

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

                    {/* Contrôle 3 — Son */}
                    <button
                      onClick={toggleMute}
                      className="pixel-btn pixel-btn-secondary font-pixel text-[9px] flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-h-0"
                      title={muted ? 'Activer le son' : 'Couper le son'}
                    >
                      {muted
                        ? <><VolumeX size={14} className="shrink-0" /><span className="leading-none">Son</span></>
                        : <><Volume2 size={14} className="shrink-0" /><span className="leading-none">Son</span></>}
                    </button>

                    {/* Contrôle 4 — Quitter / Récupérer */}
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

                {/* Defeat Overlay */}
                {gameState && (
                  <DefeatOverlay
                    show={gameState.isStoryMode && gameState.storyFailed}
                    heroesKO={gameState.heroes.filter(h => h.currentStamina === 0)}
                    onRetry={() => {
                      if (currentStoryStage) startStoryStage(currentStoryStage);
                    }}
                    onQuit={endStoryBattle}
                  />
                )}

                {/* Grid */}
                <div className="flex justify-center flex-col items-center">
                  <GameGrid gameState={gameState} />
                  {gameState && (
                    <CombatHeroPanel
                      deployedHeroes={gameState.heroes}
                      playerHeroes={player.heroes}
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

            {/* Victory Overlay */}
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
          </div>
        </div>

        {/* PAGE 3 — Social */}
        <div className="w-1/5 h-full overflow-y-auto pb-nav md:pl-16">
          <div className="p-4 max-w-2xl mx-auto space-y-6">
            {/* Player Stats */}
            <PlayerStats
              mapsCompleted={player.mapsCompleted}
              heroesTotal={player.heroes.length}
              achievementsUnlocked={ACHIEVEMENTS.filter(a => player.achievements[a.id]?.unlocked).length}
              achievementsTotal={ACHIEVEMENTS.length}
              storyHighestStage={storyProgress.highestStage}
              bossesDefeated={storyProgress.bossesDefeated?.length ?? 0}
              heroesAtMax={player.heroes.filter(h => h.level >= MAX_LEVEL_BY_RARITY[h.rarity]).length}
            />

            {/* Daily Quests */}
            <DailyQuests
              quests={dailyQuests}
              onClaim={handleClaimQuest}
              onClaimBonus={handleClaimDailyBonus}
            />

            {/* Achievements */}
            <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
                  <Trophy size={16} /> SUCCÈS
                </h2>
              </div>
              <Achievements
                achievements={player.achievements}
                onClaimReward={(achievementId: string) => {
                  const { newState, claimed, reward } = claimAchievementReward(player.achievements, achievementId);
                  if (claimed && reward) {
                    setPlayer(prev => ({
                      ...prev,
                      bomberCoins: reward.type === 'coins' ? prev.bomberCoins + reward.amount : prev.bomberCoins,
                      universalShards: reward.type === 'shards' && !reward.rarity
                        ? (prev.universalShards || 0) + reward.amount
                        : (prev.universalShards || 0),
                      shards: reward.type === 'shards' && reward.rarity
                        ? {
                            ...prev.shards,
                            [reward.rarity as keyof typeof prev.shards]: (prev.shards[reward.rarity as keyof typeof prev.shards] || 0) + reward.amount,
                          }
                        : prev.shards,
                      achievements: newState,
                    }));
                    toast({
                      title: 'Récompense réclamée!',
                      description: `${reward.amount} ${reward.type === 'coins' ? 'pièces' : reward.rarity ? `shards ${reward.rarity}` : 'shards universels'}`,
                    });
                  }
                }}
                onClaimAll={(ids: string[]) => {
                  let currentAchievements = player.achievements;
                  let totalCoins = 0;
                  let totalShards = 0;
                  for (const id of ids) {
                    const { newState, claimed, reward } = claimAchievementReward(currentAchievements, id);
                    if (claimed && reward) {
                      currentAchievements = newState;
                      if (reward.type === 'coins') totalCoins += reward.amount;
                      else totalShards += reward.amount;
                    }
                  }
                  setPlayer(prev => ({
                    ...prev,
                    bomberCoins: prev.bomberCoins + totalCoins,
                    universalShards: (prev.universalShards || 0) + totalShards,
                    achievements: currentAchievements,
                  }));
                  toast({
                    title: `${ids.length} succès récupérés !`,
                    description: [
                      totalCoins > 0 ? `${totalCoins} pièces` : '',
                      totalShards > 0 ? `${totalShards} shards` : '',
                    ].filter(Boolean).join(' · '),
                  });
                }}
              />
            </motion.div>

          </div>
        </div>

        {/* PAGE 4 — Forge */}
        <div className="w-1/5 h-full overflow-y-auto pb-nav md:pl-16">
          <div className="p-4 max-w-2xl mx-auto">
            {/* Sub-tabs Fusion | Recyclage */}
            <div className="flex gap-1 mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              {(['fusion', 'recycle'] as const).map(tab => (
                <button key={tab} onClick={() => setForgeTab(tab)}
                  className={`flex-1 font-pixel text-[8px] py-2 rounded transition-colors ${
                    forgeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  {tab === 'fusion' ? 'Fusion' : 'Recyclage'}
                </button>
              ))}
            </div>

            {/* Fusion */}
            {forgeTab === 'fusion' && (
              <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-4">
                {/* Recipe selector */}
                <div className="pixel-border bg-card p-4">
                  <h3 className="font-pixel text-[9px] text-foreground mb-3 flex items-center gap-2">
                    <Sparkles size={14} /> RECETTES DE FUSION
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {MERGE_RECIPES.map((recipe, idx) => {
                      const { total, maxed } = getAvailableForMerge(recipe.from);
                      const canMerge = maxed >= recipe.count;
                      const isSelected = selectedRecipeIdx === idx;
                      return (
                        <button
                          key={`${recipe.from}-${recipe.to}`}
                          onClick={() => setSelectedRecipeIdx(idx)}
                          className={`pixel-border p-2 text-center transition-all ${
                            isSelected
                              ? 'ring-2 ring-primary bg-primary/10'
                              : canMerge
                                ? 'bg-game-energy-green/10 hover:bg-game-energy-green/20 cursor-pointer'
                                : 'bg-muted/30 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="font-pixel text-[7px]" style={{ color: `hsl(var(--game-rarity-${recipe.from}))` }}>
                              {recipe.count}× {RARITY_CONFIG[recipe.from].label}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <ArrowDown size={8} className="text-muted-foreground" />
                            <span className="font-pixel text-[7px]" style={{ color: `hsl(var(--game-rarity-${recipe.to}))` }}>
                              1× {RARITY_CONFIG[recipe.to].label}
                            </span>
                          </div>
                          <p className="text-[7px] text-muted-foreground mt-1">
                            {maxed} prêts / {recipe.count} requis
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fusion Forge UI with Anvil */}
                <div className="pixel-border bg-card p-6">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                      <div
                        className="w-24 h-16 sm:w-32 sm:h-20 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
                          boxShadow: '0 8px 0 #1a1a1a, 0 12px 20px rgba(0,0,0,0.5)',
                        }}
                      >
                        <Hammer size={40} className="text-amber-600" />
                      </div>
                      <div className="absolute inset-0 rounded-lg animate-pulse bg-amber-500/20 blur-xl" />
                    </div>

                    <div className="text-center mb-4">
                      <p className="font-pixel text-[10px] text-foreground">
                        {MERGE_RECIPES[selectedRecipeIdx].count}× {RARITY_CONFIG[MERGE_RECIPES[selectedRecipeIdx].from].label} niv. {RARITY_CONFIG[MERGE_RECIPES[selectedRecipeIdx].from].maxLevel}
                      </p>
                      <p className="text-[8px] text-muted-foreground">→</p>
                      <p className="font-pixel text-[10px]" style={{ color: `hsl(var(--game-rarity-${MERGE_RECIPES[selectedRecipeIdx].to}))` }}>
                        1× {RARITY_CONFIG[MERGE_RECIPES[selectedRecipeIdx].to].label}
                      </p>
                    </div>

                    <div className="w-full max-w-md mb-6">
                      {lastFusedHero ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="pixel-border bg-card p-4 flex flex-col items-center gap-3 text-center"
                        >
                          <div className="font-pixel text-[8px] text-game-gold">✨ FUSION RÉUSSIE !</div>
                          <HeroAvatar heroId={lastFusedHero.id} heroName={lastFusedHero.name} rarity={lastFusedHero.rarity} size={48} />
                          <div className="font-pixel text-[9px] text-foreground">{lastFusedHero.name}</div>
                          <div className={`font-pixel text-[8px] ${CODEX_RARITY_COLOR[lastFusedHero.rarity]}`}>
                            {lastFusedHero.rarity.toUpperCase()} · Niv.{lastFusedHero.level}
                          </div>
                          <button onClick={() => setLastFusedHero(null)} className="pixel-btn pixel-btn-secondary font-pixel text-[8px] px-3 py-1 min-h-0">
                            Continuer
                          </button>
                        </motion.div>
                      ) : (
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                          {fusionSlots.map((hero, idx) => {
                            const recipe = MERGE_RECIPES[selectedRecipeIdx];
                            const eligibility = hero
                              ? isHeroEligibleForMerge(hero, recipe.from, recipe.count)
                              : { eligible: true, reason: '' };
                            return (
                              <FusionSlot
                                key={idx}
                                hero={hero}
                                index={idx}
                                onClick={() => handleSlotClick(idx)}
                                onClear={hero ? () => handleSlotClear(idx) : undefined}
                                isEligible={eligibility.eligible}
                                ineligibleReason={eligibility.reason}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      <button
                        onClick={executeFusionFromSlots}
                        disabled={fusionSlots.filter(s => s !== null).length !== MERGE_RECIPES[selectedRecipeIdx].count}
                        className={`pixel-btn pixel-btn-primary font-pixel text-[10px] flex items-center justify-center gap-2 min-h-[48px] w-full ${
                          fusionSlots.filter(s => s !== null).length !== MERGE_RECIPES[selectedRecipeIdx].count
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <Sparkles size={16} /> FUSIONNER
                      </button>

                      <button
                        onClick={mergeAll}
                        disabled={isMerging}
                        className="pixel-btn pixel-btn-secondary font-pixel text-[8px] flex items-center justify-center gap-2 w-full"
                      >
                        <Zap size={12} /> TOUT FUSIONNER
                      </button>
                    </div>

                    <p className="text-[8px] text-muted-foreground mt-3">
                      {fusionSlots.filter(s => s !== null).length}/{MERGE_RECIPES[selectedRecipeIdx].count} slots remplis
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recyclage */}
            {forgeTab === 'recycle' && (
              <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-4">
                <div className="pixel-border bg-card p-3 sm:p-4">
                  <RecyclePanel
                    heroes={player.heroes}
                    universalShards={player.universalShards}
                    onRecycle={handleRecycle}
                    onToggleLock={handleToggleLock}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

      </motion.div>

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

      <HeroPickerModal
        isOpen={heroPickerOpen}
        onClose={() => setHeroPickerOpen(false)}
        onSelect={handleHeroSelect}
        heroes={player.heroes}
        requiredRarity={MERGE_RECIPES[selectedRecipeIdx].from}
        requiredCount={MERGE_RECIPES[selectedRecipeIdx].count}
        alreadySelectedIds={fusionSlots.filter(s => s !== null).map(s => s!.id)}
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
