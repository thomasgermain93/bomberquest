import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gem, Sparkles } from 'lucide-react';
import { PlayerData, RARITY_CONFIG, Rarity } from '@/game/types';
import HeroAvatar from '@/components/HeroAvatar';
import PityTracker from '@/components/PityTracker';
import { Hero } from '@/game/types';

type SummonTab = 'coins' | 'shards';

interface SummonPageProps {
  player: PlayerData;
  summonTab: SummonTab;
  setSummonTab: (tab: SummonTab) => void;
  selectedShardRarity: Rarity;
  setSelectedShardRarity: (r: Rarity) => void;
  handleSummon: (type: 'single' | 'x10' | 'x100') => void;
  handleSummonShards: () => void;
  lastSummoned: Hero | null;
  summonedBatch: Hero[];
  showSummonFlash: boolean;
  SHARD_COSTS: Record<string, number>;
}

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

const SHARD_COST_MAP: Record<string, number> = {
  rare: 50,
  'super-rare': 150,
  epic: 400,
  legend: 1000,
  'super-legend': 2500,
};

const SummonPage: React.FC<SummonPageProps> = ({
  player,
  summonTab,
  setSummonTab,
  selectedShardRarity,
  setSelectedShardRarity,
  handleSummon,
  handleSummonShards,
  lastSummoned,
  summonedBatch,
  showSummonFlash,
}) => {
  return (
    <div className="w-1/6 h-full overflow-y-auto pb-nav md:pl-16">
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
            <button onClick={handleSummonShards} disabled={player.universalShards < (SHARD_COST_MAP[selectedShardRarity] || 0)}
              className="pixel-btn pixel-btn-gold w-full font-pixel text-[8px] flex items-center justify-center gap-2 disabled:opacity-40">
              <Sparkles size={14} /> INVOQUER — {SHARD_COST_MAP[selectedShardRarity]} 💎
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
  );
};

export default SummonPage;
