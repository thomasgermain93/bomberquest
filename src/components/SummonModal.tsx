import React, { useState } from 'react';
import PixelIcon from '@/components/PixelIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { Hero, RARITY_CONFIG } from '@/game/types';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface SummonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSummon: (type: 'single' | 'x10' | 'x100') => void;
  coins: number;
  lastSummoned: Hero | null;
  summonedBatch: Hero[];
  pityCounters: { rare: number; superRare: number; epic: number; legend: number };
}

const rarityGlows: Record<string, string> = {
  common: 'rgba(150,150,150,0.3)',
  rare: 'rgba(68,136,255,0.5)',
  'super-rare': 'rgba(170,68,255,0.5)',
  epic: 'rgba(255,136,0,0.5)',
  legend: 'rgba(255,68,68,0.6)',
  'super-legend': 'rgba(255,68,255,0.7)',
};

const HeroRevealCard: React.FC<{ hero: Hero; index: number; total: number }> = ({ hero, index, total }) => {
  const config = RARITY_CONFIG[hero.rarity];
  return (
    <motion.div
      initial={{ scale: 0, rotateY: 180, opacity: 0 }}
      animate={{ scale: 1, rotateY: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: total > 1 ? index * 0.08 : 0 }}
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

const SummonModal: React.FC<SummonModalProps> = ({ isOpen, onClose, onSummon, coins, lastSummoned, summonedBatch, pityCounters }) => {
  const [showResult, setShowResult] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleSummon = (type: 'single' | 'x10' | 'x100') => {
    setAnimating(true);
    setShowResult(false);
    setTimeout(() => {
      onSummon(type);
      setAnimating(false);
      setShowResult(true);
    }, type === 'x100' ? 500 : 1500);
  };

  const displayBatch = summonedBatch.length > 0 ? summonedBatch : lastSummoned ? [lastSummoned] : [];

  // Sort by rarity (best first) for display
  const sortedBatch = [...displayBatch].sort((a, b) => {
    const order: Record<string, number> = { 'super-legend': 0, legend: 1, epic: 2, 'super-rare': 3, rare: 4, common: 5 };
    return (order[a.rarity] ?? 6) - (order[b.rarity] ?? 6);
  });

  const bestRarity = sortedBatch.length > 0 ? sortedBatch[0].rarity : 'common';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          className="pixel-border bg-card p-3 sm:p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="font-pixel text-sm text-center text-foreground mb-3 flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-primary" /> INVOCATION
          </h2>

          {/* Result / Animation Area */}
          <div className="min-h-[200px] flex items-center justify-center mb-4 relative overflow-hidden rounded-lg bg-muted/50 p-4">
            {animating && (
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex flex-col items-center gap-2"
              >
                <Sparkles size={48} className="text-primary" />
                <p className="font-pixel text-[8px] text-muted-foreground animate-pulse">Invocation en cours...</p>
              </motion.div>
            )}

            {showResult && sortedBatch.length > 0 && (
              <div className="w-full">
                {/* Highlight glow for best rarity */}
                {(bestRarity !== 'common' && bestRarity !== 'rare') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${rarityGlows[bestRarity]}, transparent 70%)` }}
                  />
                )}

                {sortedBatch.length === 1 ? (
                  /* Single summon: large centered display */
                  <div className="flex flex-col items-center">
                    <HeroRevealCard hero={sortedBatch[0]} index={0} total={1} />
                    <div className="grid grid-cols-3 gap-1 mt-3 text-[9px]">
                      <span className="bg-muted px-2 py-1 rounded text-foreground text-center">PWR {sortedBatch[0].stats.pwr}</span>
                      <span className="bg-muted px-2 py-1 rounded text-foreground text-center">SPD {sortedBatch[0].stats.spd}</span>
                      <span className="bg-muted px-2 py-1 rounded text-foreground text-center">RNG {sortedBatch[0].stats.rng}</span>
                    </div>
                  </div>
                ) : (
                  /* Multi summon: grid display */
                  <div className="grid grid-cols-5 gap-2 justify-items-center relative z-10">
                    {sortedBatch.map((hero, i) => (
                      <HeroRevealCard key={hero.id} hero={hero} index={i} total={sortedBatch.length} />
                    ))}
                  </div>
                )}

                {/* Summary for multi */}
                {sortedBatch.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-3 text-center text-[8px] font-pixel text-muted-foreground flex flex-wrap justify-center gap-2"
                  >
                    {Object.entries(
                      sortedBatch.reduce((acc, h) => {
                        acc[h.rarity] = (acc[h.rarity] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([rarity, count]) => (
                      <span key={rarity} style={{ color: `hsl(var(--game-rarity-${rarity}))` }}>
                        {count}× {RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG]?.label}
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {!animating && !showResult && (
              <div className="text-center">
                <Sparkles size={48} className="text-muted-foreground mx-auto mb-2" />
                <p className="font-pixel text-[8px] text-muted-foreground">Cliquez pour invoquer</p>
              </div>
            )}
          </div>

          {/* Pity counters */}
          <div className="flex gap-1 sm:gap-2 justify-center mb-3 text-[7px] sm:text-[8px] font-pixel flex-wrap">
            <span style={{ color: 'hsl(var(--game-rarity-rare))' }}>Rare: {pityCounters.rare}/10</span>
            <span style={{ color: 'hsl(var(--game-rarity-epic))' }} className="hidden sm:inline">Epic: {pityCounters.epic}/50</span>
            <span style={{ color: 'hsl(var(--game-rarity-legend))' }} className="hidden sm:inline">Legend: {pityCounters.legend}/200</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSummon('single')}
              disabled={coins < 100 || animating}
              className="pixel-btn flex-1 text-center disabled:opacity-40"
            >
              <div className="font-pixel text-[8px]">×1</div>
              <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1">
                <PixelIcon icon="coins" size={10} /> 100
              </div>
            </button>
            <button
              onClick={() => handleSummon('x10')}
              disabled={coins < 900 || animating}
              className="pixel-btn pixel-btn-gold flex-1 text-center disabled:opacity-40"
            >
              <div className="font-pixel text-[8px]">×10</div>
              <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1">
                <PixelIcon icon="coins" size={10} /> 900
              </div>
            </button>
            <button
              onClick={() => handleSummon('x100')}
              disabled={coins < 8000 || animating}
              className="pixel-btn flex-1 text-center disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, hsl(var(--game-rarity-epic)), hsl(var(--game-rarity-legend)))' }}
            >
              <div className="font-pixel text-[8px] text-white">×100</div>
              <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1 text-white">
                <PixelIcon icon="coins" size={10} /> 8000
              </div>
            </button>
          </div>

          <button
            onClick={() => { setShowResult(false); onClose(); }}
            className="pixel-btn pixel-btn-secondary w-full mt-3 text-center font-pixel text-[8px]"
          >
            Fermer
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SummonModal;
