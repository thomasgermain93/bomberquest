import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import PixelIcon from '@/components/PixelIcon';
import { Hero, PlayerData, RARITY_CONFIG, Rarity } from '@/game/types';
import { summonHero, generateHero } from '@/game/summoning';
import { loadPlayerData, savePlayerData, loadStoryProgress } from '@/game/saveSystem';
import { trackSummon, trackRarityUnlock, trackHeroCount } from '@/game/achievements';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Sparkles, Star, Coins, Gem, ArrowRight } from 'lucide-react';

const UNIVERSAL_SHARD_COSTS: Record<Rarity, number> = {
  common: 10,
  rare: 50,
  'super-rare': 150,
  epic: 400,
  legend: 1000,
  'super-legend': 2500,
};

const BC_COSTS = {
  single: 100,
  x10: 900,
  x100: 8000,
};

const rarityGlows: Record<string, string> = {
  common: 'rgba(150,150,150,0.3)',
  rare: 'rgba(68,136,255,0.5)',
  'super-rare': 'rgba(170,68,255,0.5)',
  epic: 'rgba(255,136,0,0.5)',
  legend: 'rgba(255,68,68,0.6)',
  'super-legend': 'rgba(255,68,255,0.7)',
};

const SummonParticles: React.FC<{ rarity: string }> = ({ rarity }) => {
  const colors: Record<string, string> = {
    common: '#888888',
    rare: '#4488FF',
    'super-rare': '#AA44FF',
    epic: '#FF8800',
    legend: '#FF4444',
    'super-legend': '#FF44FF',
  };
  const color = colors[rarity] || colors.common;
  
  const particles = Array.from({ length: 12 });
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 0 
          }}
          animate={{ 
            x: Math.cos((i * 30 * Math.PI) / 180) * 80,
            y: Math.sin((i * 30 * Math.PI) / 180) * 80,
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            delay: i * 0.05,
            ease: "easeOut"
          }}
          className="absolute"
        >
          <Star size={8} fill={color} color={color} />
        </motion.div>
      ))}
    </div>
  );
};

const SummonExplosion: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
          animate={{ 
            x: Math.cos((i * 45 * Math.PI) / 180) * 100,
            y: Math.sin((i * 45 * Math.PI) / 180) * 100,
            scale: 0,
            opacity: 0
          }}
          transition={{ duration: 0.5, ease: "easeIn" }}
          className="absolute"
        >
          <Star size={12} fill="white" color="white" />
        </motion.div>
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute w-16 h-16 rounded-full bg-white"
      />
    </div>
  );
};

const HeroRevealCard: React.FC<{ hero: Hero; index: number; total: number }> = ({ hero, index, total }) => {
  const config = RARITY_CONFIG[hero.rarity];
  return (
    <motion.div
      initial={{ scale: 0, rotateY: 180, opacity: 0 }}
      animate={{ scale: 1, rotateY: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: total > 1 ? Math.min(index * 0.04, 0.4) : 0 }}
      className="flex flex-col items-center"
    >
      <div
        className="rounded-lg p-3 mb-1 bg-card pixel-border"
        style={{ boxShadow: `0 0 25px ${rarityGlows[hero.rarity]}` }}
      >
        <PixelIcon icon={hero.icon} size={total > 1 ? 32 : 56} rarity={hero.rarity} />
      </div>
      <p className="font-pixel text-[8px] text-foreground truncate max-w-[70px] text-center">{hero.name}</p>
      <p
        className="font-pixel text-[7px]"
        style={{ color: `hsl(var(--game-rarity-${hero.rarity}))` }}
      >
        {config.label}
      </p>
    </motion.div>
  );
};

const Summon: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadFromCloud, saveHeroesToCloud, saveStatsToCloud } = useCloudSave(user?.id, Boolean(user));

  const [player, setPlayer] = useState<PlayerData>(loadPlayerData);

  // Sync depuis le cloud au montage pour avoir les vraies ressources (shards, BC)
  useEffect(() => {
    if (!user) return;
    loadFromCloud().then(result => {
      if (result?.playerData) {
        setPlayer(result.playerData);
        savePlayerData(result.playerData);
      }
    });
  }, [user?.id]);
  const [activeTab, setActiveTab] = useState<'coins' | 'shards'>('coins');
  const [selectedShardRarity, setSelectedShardRarity] = useState<Rarity>('rare');
  
  const [showResult, setShowResult] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [currentRarity, setCurrentRarity] = useState<string>('common');
  const [lastSummoned, setLastSummoned] = useState<Hero | null>(null);
  const [summonedBatch, setSummonedBatch] = useState<Hero[]>([]);

  const canWriteCloud = Boolean(user);

  const handleSummonBC = (type: 'single' | 'x10' | 'x100') => {
    const cost = BC_COSTS[type];
    if (player.bomberCoins < cost) {
      toast({ title: 'BC insuffisants', description: `Il te faut ${cost} BC pour cette invocation.` });
      return;
    }

    setAnimating(true);
    setShowResult(false);
    setShowExplosion(false);

    const count = type === 'single' ? 1 : type === 'x10' ? 10 : 100;
    let currentPity = { ...player.pityCounters };
    const newCoins = player.bomberCoins - cost;
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
    const newAchievementUnlocks: any[] = [];
    
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

    const rarities: Rarity[] = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];
    const universalShardsBonus = batch.reduce((acc, hero) => acc + (rarities.indexOf(hero.rarity) + 1), 0);

    setPlayer(prev => ({
      ...prev,
      bomberCoins: newCoins,
      heroes: mergedHeroes,
      pityCounters: currentPity,
      totalHeroesOwned: mergedHeroes.length,
      achievements: newAchievements,
      universalShards: prev.universalShards + universalShardsBonus,
    }));

    for (const achievement of newAchievementUnlocks) {
      toast({
        title: 'Succès débloqué!',
        description: achievement.title,
      });
    }

    const raritiesAnim = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];
    const randomRarity = raritiesAnim[Math.floor(Math.random() * 3)];
    setCurrentRarity(randomRarity);
    setAnimating(false);
    setShowExplosion(true);
    setTimeout(() => {
      setShowResult(true);
      setShowExplosion(false);
    }, 300);

    const updatedData = {
      ...player,
      bomberCoins: newCoins,
      heroes: mergedHeroes,
      pityCounters: currentPity,
      totalHeroesOwned: mergedHeroes.length,
      achievements: newAchievements,
      universalShards: player.universalShards + universalShardsBonus,
    };
    savePlayerData(updatedData);
    if (canWriteCloud) {
      const addedHeroes = mergedHeroes.filter(h => !player.heroes.some(existing => existing.id === h.id));
      if (addedHeroes.length > 0) saveHeroesToCloud(addedHeroes);
      saveStatsToCloud(updatedData, loadStoryProgress(), null as any);
    }
  };

  const handleSummonShards = () => {
    const cost = UNIVERSAL_SHARD_COSTS[selectedShardRarity];

    if (player.universalShards < cost) {
      toast({
        title: 'Fragments insuffisants',
        description: `Il te faut ${cost} Shards Universels pour cette invocation.`,
      });
      return;
    }

    setAnimating(true);
    setShowResult(false);
    setShowExplosion(false);

    const newHero = generateHero(selectedShardRarity);
    const newHeroes = [...player.heroes, newHero];

    setLastSummoned(newHero);
    setSummonedBatch([newHero]);

    const newTotalSummons = player.totalHeroesOwned + 1;
    const newAchievements = { ...player.achievements };
    const newAchievementUnlocks: any[] = [];

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
      toast({
        title: 'Succès débloqué!',
        description: achievement.title,
      });
    }

    setCurrentRarity(selectedShardRarity);
    setAnimating(false);
    setShowExplosion(true);
    setTimeout(() => {
      setShowResult(true);
      setShowExplosion(false);
    }, 300);

    const updatedData = {
      ...player,
      heroes: newHeroes,
      totalHeroesOwned: newHeroes.length,
      achievements: newAchievements,
      universalShards: player.universalShards - cost,
    };
    savePlayerData(updatedData);
    if (canWriteCloud) {
      saveHeroesToCloud([newHero]);
      saveStatsToCloud(updatedData, loadStoryProgress(), null as any);
    }
  };

  const displayBatch = summonedBatch.length > 0 ? summonedBatch : lastSummoned ? [lastSummoned] : [];
  const sortedBatch = [...displayBatch].sort((a, b) => {
    const order: Record<string, number> = { 'super-legend': 0, legend: 1, epic: 2, 'super-rare': 3, rare: 4, common: 5 };
    return (order[a.rarity] ?? 6) - (order[b.rarity] ?? 6);
  });
  const bestRarity = sortedBatch.length > 0 ? sortedBatch[0].rarity : 'common';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/game')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Retour au jeu</span>
        </button>
        <div className="flex items-center gap-2">
          <PixelIcon icon="bomb" size={18} color="hsl(var(--primary))" />
          <span className="font-pixel text-[9px] text-foreground">BOMBERQUEST</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red flex items-center justify-center gap-2">
              <Sparkles size={22} /> INVOCATION
            </h1>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('coins')}
              className={`flex-1 pixel-btn text-center ${activeTab === 'coins' ? 'pixel-btn-gold' : 'pixel-btn-secondary'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Coins size={14} />
                <span className="font-pixel text-[8px]">BomberCoins</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('shards')}
              className={`flex-1 pixel-btn text-center ${activeTab === 'shards' ? 'pixel-btn-gold' : 'pixel-btn-secondary'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Gem size={14} />
                <span className="font-pixel text-[8px]">Fragments</span>
              </div>
            </button>
          </div>

          <div className="pixel-border bg-card p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-primary" />
                <span className="font-pixel text-[8px] text-primary">BC: {player.bomberCoins.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem size={16} className="text-secondary" />
                <span className="font-pixel text-[8px] text-muted-foreground">
                  💎 {player.universalShards} Shards Universels
                </span>
              </div>
            </div>

            {activeTab === 'shards' && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-3 p-2 rounded bg-secondary/10 border border-secondary/30">
                  <Gem size={14} className="text-secondary" />
                  <span className="font-pixel text-[8px] text-secondary">💎 {player.universalShards} Shards Universels</span>
                </div>
                <p className="font-pixel text-[7px] text-muted-foreground mb-2">Sélectionne la rareté:</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['rare', 'super-rare', 'epic', 'legend', 'super-legend'] as Rarity[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedShardRarity(r)}
                      className={`p-2 rounded pixel-border transition-all ${
                        selectedShardRarity === r 
                          ? 'bg-primary/20 border-primary' 
                          : 'bg-muted/50 border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-center">
                        <PixelIcon icon="gem" size={16} rarity={r} className="mx-auto mb-1" />
                        <span 
                          className="font-pixel text-[6px]" 
                          style={{ color: `hsl(var(--game-rarity-${r}))` }}
                        >
                          {RARITY_CONFIG[r].label}
                        </span>
                        <span className="font-pixel text-[5px] text-muted-foreground block mt-0.5">
                          {UNIVERSAL_SHARD_COSTS[r]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'coins' ? (
                  <div>
                    <div className="min-h-[180px] flex items-center justify-center mb-4 relative overflow-hidden rounded-lg bg-muted/50 p-4">
                      {showExplosion && <SummonExplosion onComplete={() => {}} />}
                      
                      {animating && (
                        <div className="flex flex-col items-center gap-2 relative z-10">
                          <div className="relative">
                            <SummonParticles rarity={currentRarity} />
                            <motion.div
                              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Sparkles size={48} className="text-primary" />
                            </motion.div>
                          </div>
                          <motion.p 
                            className="font-pixel text-[8px] text-primary"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            Invocation en cours...
                          </motion.p>
                        </div>
                      )}

                      {showResult && sortedBatch.length > 0 && (
                        <div className="w-full">
                          <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 bg-white pointer-events-none z-20"
                          />
                          {sortedBatch.length === 1 ? (
                            <div className="flex flex-col items-center">
                              <HeroRevealCard hero={sortedBatch[0]} index={0} total={1} />
                              <div className="grid grid-cols-3 gap-1 mt-3 text-[9px]">
                                <span className="bg-muted px-2 py-1 rounded text-foreground text-center">PWR {sortedBatch[0].stats.pwr}</span>
                                <span className="bg-muted px-2 py-1 rounded text-foreground text-center">SPD {sortedBatch[0].stats.spd}</span>
                                <span className="bg-muted px-2 py-1 rounded text-foreground text-center">RNG {sortedBatch[0].stats.rng}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-5 gap-2 justify-items-center">
                              {sortedBatch.map((hero, i) => (
                                <HeroRevealCard key={hero.id} hero={hero} index={i} total={sortedBatch.length} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!animating && !showResult && (
                        <div className="text-center">
                          <Sparkles size={48} className="text-muted-foreground mx-auto mb-2" />
                          <p className="font-pixel text-[8px] text-muted-foreground">Choisis ton invocation</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSummonBC('single')}
                        disabled={player.bomberCoins < 100 || animating}
                        className="pixel-btn flex-1 text-center disabled:opacity-40"
                      >
                        <div className="font-pixel text-[8px]">×1</div>
                        <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1">
                          <PixelIcon icon="coins" size={10} /> 100
                        </div>
                      </button>
                      <button
                        onClick={() => handleSummonBC('x10')}
                        disabled={player.bomberCoins < 900 || animating}
                        className="pixel-btn pixel-btn-gold flex-1 text-center disabled:opacity-40"
                      >
                        <div className="font-pixel text-[8px]">×10</div>
                        <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1">
                          <PixelIcon icon="coins" size={10} /> 900
                        </div>
                      </button>
                      <button
                        onClick={() => handleSummonBC('x100')}
                        disabled={player.bomberCoins < 8000 || animating}
                        className="pixel-btn flex-1 text-center disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--game-rarity-epic)), hsl(var(--game-rarity-legend)))' }}
                      >
                        <div className="font-pixel text-[8px] text-white">×100</div>
                        <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1 text-white">
                          <PixelIcon icon="coins" size={10} /> 8000
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="min-h-[180px] flex items-center justify-center mb-4 relative overflow-hidden rounded-lg bg-muted/50 p-4">
                      {showExplosion && <SummonExplosion onComplete={() => {}} />}
                      
                      {animating && (
                        <div className="flex flex-col items-center gap-2 relative z-10">
                          <div className="relative">
                            <SummonParticles rarity={selectedShardRarity} />
                            <motion.div
                              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Sparkles size={48} className="text-secondary" />
                            </motion.div>
                          </div>
                          <motion.p 
                            className="font-pixel text-[8px] text-secondary"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            Invocation en cours...
                          </motion.p>
                        </div>
                      )}

                      {showResult && sortedBatch.length > 0 && (
                        <div className="w-full">
                          <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 bg-white pointer-events-none z-20"
                          />
                          <div className="flex flex-col items-center">
                            <HeroRevealCard hero={sortedBatch[0]} index={0} total={1} />
                            <div className="grid grid-cols-3 gap-1 mt-3 text-[9px]">
                              <span className="bg-muted px-2 py-1 rounded text-foreground text-center">PWR {sortedBatch[0].stats.pwr}</span>
                              <span className="bg-muted px-2 py-1 rounded text-foreground text-center">SPD {sortedBatch[0].stats.spd}</span>
                              <span className="bg-muted px-2 py-1 rounded text-foreground text-center">RNG {sortedBatch[0].stats.rng}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {!animating && !showResult && (
                        <div className="text-center">
                          <Gem size={48} className="text-muted-foreground mx-auto mb-2" />
                          <p className="font-pixel text-[8px] text-muted-foreground">Invoque un héros {selectedShardRarity}</p>
                          <p className="font-pixel text-[7px] text-muted-foreground mt-1">
                            Garantie {RARITY_CONFIG[selectedShardRarity].label}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSummonShards}
                      disabled={animating || player.universalShards < UNIVERSAL_SHARD_COSTS[selectedShardRarity]}
                      className="pixel-btn w-full text-center disabled:opacity-40"
                      style={{ background: `linear-gradient(135deg, hsl(var(--game-rarity-${selectedShardRarity})), hsl(var(--game-rarity-${selectedShardRarity}) / 0.7))` }}
                    >
                      <div className="font-pixel text-[9px] text-white flex items-center justify-center gap-2">
                        <Gem size={14} />
                        Invoquer {RARITY_CONFIG[selectedShardRarity].label}
                        <ArrowRight size={14} />
                      </div>
                      <div className="font-pixel text-[8px] text-white/80 mt-0.5">
                        Coût: {UNIVERSAL_SHARD_COSTS[selectedShardRarity]} Shards Universels
                      </div>
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pixel-border bg-card p-4 rounded-lg">
            <h3 className="font-pixel text-[8px] text-foreground mb-3 flex items-center gap-2">
              <Star size={12} className="text-primary" /> COMPTEURS DE PITY
            </h3>
            <div className="flex gap-2 justify-center text-[7px] font-pixel flex-wrap">
              <span style={{ color: 'hsl(var(--game-rarity-rare))' }}>Rare: {player.pityCounters.rare}/10</span>
              <span style={{ color: 'hsl(var(--game-rarity-super-rare))' }}>SSR: {player.pityCounters.superRare}/30</span>
              <span style={{ color: 'hsl(var(--game-rarity-epic))' }}>Epic: {player.pityCounters.epic}/50</span>
              <span style={{ color: 'hsl(var(--game-rarity-legend))' }}>Legend: {player.pityCounters.legend}/200</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/game')}
              className="pixel-btn pixel-btn-secondary inline-flex items-center gap-2"
            >
              <ArrowLeft size={12} />
              <span className="font-pixel text-[8px]">Retour au jeu</span>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Summon;
