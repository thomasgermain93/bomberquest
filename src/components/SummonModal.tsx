import React, { useState } from 'react';
import PixelIcon from '@/components/PixelIcon';
import PixelLoader from '@/components/PixelLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Hero, RARITY_CONFIG } from '@/game/types';
import { Sparkles, Star } from 'lucide-react';
import { rarityGlows, SummonParticles, SummonExplosion, HeroRevealCard } from '@/components/summon/SummonAnimations';

interface SummonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSummon: (type: 'single' | 'x10' | 'x100') => void;
  coins: number;
  lastSummoned: Hero | null;
  summonedBatch: Hero[];
  pityCounters: { rare: number; superRare: number; epic: number; legend: number };
}

const SummonModal: React.FC<SummonModalProps> = ({ isOpen, onClose, onSummon, coins, lastSummoned, summonedBatch, pityCounters }) => {
  const [showResult, setShowResult] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [currentRarity, setCurrentRarity] = useState<string>('common');

  const handleSummon = (type: 'single' | 'x10' | 'x100') => {
    setAnimating(true);
    setShowResult(false);
    setShowExplosion(false);
    setTimeout(() => {
      onSummon(type);
      const tempBatch = type === 'single' ? [lastSummoned].filter(Boolean) : type === 'x10' ? Array(10).fill(null) : Array(100).fill(null);
      const rarities = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];
      const randomRarity = rarities[Math.floor(Math.random() * 3)];
      setCurrentRarity(randomRarity);
      setAnimating(false);
      setShowExplosion(true);
      setTimeout(() => {
        setShowResult(true);
        setShowExplosion(false);
      }, 300);
    }, type === 'x100' ? 300 : 400);
  };

  const displayBatch = summonedBatch.length > 0 ? summonedBatch : lastSummoned ? [lastSummoned] : [];

  // Sort by rarity (best first) for display
  const sortedBatch = [...displayBatch].sort((a, b) => {
    const order: Record<string, number> = { 'super-legend': 0, legend: 1, epic: 2, 'super-rare': 3, rare: 4, common: 5 };
    return (order[a.rarity] ?? 6) - (order[b.rarity] ?? 6);
  });

  const bestRarity = sortedBatch.length > 0 ? sortedBatch[0].rarity : 'common';

  return (
    <AnimatePresence>
      {isOpen && (
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
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="pixel-border bg-card p-3 sm:p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="font-pixel text-sm text-center text-foreground mb-1 flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-primary" /> INVOCATION
          </h2>
          <div className="mb-3 flex items-center justify-center gap-1.5 rounded bg-primary/10 border border-primary/30 px-2.5 py-1.5">
            <PixelIcon icon="coins" size={11} />
            <span className="font-pixel text-[8px] text-primary">BC disponibles : {coins}</span>
          </div>

          {/* Result / Animation Area */}
          <div className="min-h-[200px] flex items-center justify-center mb-4 relative overflow-hidden rounded-lg bg-muted/50 p-4">
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
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ 
                        transformOrigin: 'center',
                        marginTop: -8 
                      }}
                    >
                      <Star 
                        size={12} 
                        className="text-yellow-400" 
                        style={{ 
                          position: 'absolute',
                          top: -30,
                          transform: `rotate(${i * 120}deg)`
                        }} 
                        fill="currentColor"
                      />
                    </motion.div>
                  ))}
                </div>
                <PixelLoader size="md" label="Invocation en cours..." color="primary" />
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1, 0] }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        delay: i * 0.04
                      }}
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: i % 2 === 0 ? '#FF8800' : '#4488FF'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {showResult && sortedBatch.length > 0 && (
              <div className="w-full">
                {/* Flash effect on reveal */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-white pointer-events-none z-20"
                />
                
                {/* Particle burst on reveal */}
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: '50%', 
                      y: '50%', 
                      scale: 0,
                      opacity: 1
                    }}
                    animate={{ 
                      x: `${50 + (Math.random() - 0.5) * 120}%`,
                      y: `${50 + (Math.random() - 0.5) * 120}%`,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0]
                    }}
                    transition={{ duration: 0.8, ease: "easeIn" }}
                    className="absolute pointer-events-none z-10"
                  >
                    <Star 
                      size={6} 
                      fill={rarityGlows[bestRarity].replace(/[\d.]+\)$/, '1)')} 
                      color={bestRarity === 'legend' || bestRarity === 'super-legend' ? '#FF4444' : bestRarity === 'epic' ? '#FF8800' : '#4488FF'} 
                    />
                  </motion.div>
                ))}

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
              disabled={coins < 1000 || animating}
              className="pixel-btn flex-1 text-center disabled:opacity-40"
            >
              <div className="font-pixel text-[8px]">×1</div>
              <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1">
                <PixelIcon icon="coins" size={10} /> 1000
              </div>
            </button>
            <button
              onClick={() => handleSummon('x10')}
              disabled={coins < 9000 || animating}
              className="pixel-btn pixel-btn-gold flex-1 text-center disabled:opacity-40"
            >
              <div className="font-pixel text-[8px]">×10</div>
              <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1">
                <PixelIcon icon="coins" size={10} /> 9000
              </div>
            </button>
            <button
              onClick={() => handleSummon('x100')}
              disabled={coins < 80000 || animating}
              className="pixel-btn flex-1 text-center disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, hsl(var(--game-rarity-epic)), hsl(var(--game-rarity-legend)))' }}
            >
              <div className="font-pixel text-[8px] text-white">×100</div>
              <div className="font-pixel text-[9px] mt-0.5 flex items-center justify-center gap-1 text-white">
                <PixelIcon icon="coins" size={10} /> 80000
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
      )}
    </AnimatePresence>
  );
};

export default SummonModal;
