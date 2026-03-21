import React from 'react';
import { motion } from 'framer-motion';
import { Lock, TrendingUp, Star, Zap } from 'lucide-react';
import {
  GAME_MODE_FLAGS,
  ASCENSION_FLOORS,
  ASCENSION_MODIFIERS,
  getAscensionModifier,
  AscensionFloor,
} from '@/game/gameModes';

interface AscensionModeProps {
  bestFloor?: number;
  onStart?: () => void;
}

const FLOOR_BADGE_COLORS: Record<number, string> = {
  1:  'bg-gray-700 text-gray-200',
  2:  'bg-gray-700 text-gray-200',
  3:  'bg-green-900 text-green-300',
  4:  'bg-green-900 text-green-300',
  5:  'bg-blue-900 text-blue-300',
  6:  'bg-blue-900 text-blue-300',
  7:  'bg-purple-900 text-purple-300',
  8:  'bg-purple-900 text-purple-300',
  9:  'bg-orange-900 text-orange-300',
  10: 'bg-red-900 text-red-300',
};

const FloorCard: React.FC<{ floor: AscensionFloor; isBestFloor: boolean }> = ({ floor, isBestFloor }) => {
  const modifier = floor.modifierId ? getAscensionModifier(floor.modifierId) : null;
  const badgeColor = FLOOR_BADGE_COLORS[floor.floor] ?? 'bg-gray-700 text-gray-200';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: floor.floor * 0.04 }}
      className={`pixel-border p-3 flex items-center gap-3 ${isBestFloor ? 'ring-2 ring-yellow-400' : ''}`}
    >
      <div className={`font-pixel text-[9px] px-2 py-1 rounded ${badgeColor} min-w-[40px] text-center`}>
        {floor.floor < 10 ? `0${floor.floor}` : floor.floor}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] text-foreground truncate">{floor.name}</span>
          {isBestFloor && (
            <span className="font-pixel text-[7px] text-yellow-400 flex items-center gap-1">
              <Star size={8} className="fill-yellow-400" /> Record
            </span>
          )}
        </div>
        {modifier ? (
          <p className="font-pixel text-[7px] text-muted-foreground mt-0.5 truncate">
            <Zap size={8} className="inline mr-1 text-yellow-400" />
            {modifier.name}
          </p>
        ) : (
          <p className="font-pixel text-[7px] text-muted-foreground mt-0.5">Pas de modificateur</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <div className="font-pixel text-[7px] text-red-400">HP x{floor.hpMultiplier.toFixed(2)}</div>
        <div className="font-pixel text-[7px] text-blue-400">SPD x{floor.speedMultiplier.toFixed(2)}</div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-pixel text-[8px] text-yellow-400">{floor.shardReward}</div>
        <div className="font-pixel text-[6px] text-muted-foreground">Shards</div>
      </div>
    </motion.div>
  );
};

const AscensionMode: React.FC<AscensionModeProps> = ({ bestFloor = 0, onStart }) => {
  const isEnabled = GAME_MODE_FLAGS.ascension;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center py-4">
        <h2 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red mb-1 flex items-center justify-center gap-2">
          <TrendingUp size={20} /> MODE ASCENSION
        </h2>
        <p className="font-pixel text-[7px] text-muted-foreground">
          Gravis la tour — 10 étages, 10 modificateurs, 1 seule chance
        </p>
      </div>

      {bestFloor > 0 && (
        <div className="pixel-border p-3 flex items-center justify-between">
          <span className="font-pixel text-[8px] text-muted-foreground">Meilleur étage</span>
          <span className="font-pixel text-[10px] text-yellow-400 flex items-center gap-1">
            <Star size={12} className="fill-yellow-400" />
            Étage {bestFloor} / 10
          </span>
        </div>
      )}

      {!isEnabled ? (
        <div className="pixel-border p-6 text-center space-y-3 bg-muted/30">
          <Lock size={32} className="mx-auto text-muted-foreground" />
          <p className="font-pixel text-[9px] text-muted-foreground">COMING SOON</p>
          <p className="font-pixel text-[7px] text-muted-foreground">
            Le Mode Ascension est en cours de développement.
          </p>
          <button
            disabled
            className="pixel-btn pixel-btn-secondary font-pixel text-[8px] w-full opacity-40 cursor-not-allowed"
          >
            Commencer la montée
          </button>
        </div>
      ) : (
        <button
          onClick={onStart}
          className="pixel-btn font-pixel text-[9px] w-full py-3"
        >
          <TrendingUp size={14} className="inline mr-2" />
          Commencer la montée
        </button>
      )}

      <div className="space-y-2">
        <h3 className="font-pixel text-[8px] text-muted-foreground px-1">Les 10 étages</h3>
        {ASCENSION_FLOORS.map(floor => (
          <FloorCard
            key={floor.floor}
            floor={floor}
            isBestFloor={floor.floor === bestFloor}
          />
        ))}
      </div>

      <div className="pixel-border p-4 space-y-2">
        <h3 className="font-pixel text-[8px] text-foreground mb-3 flex items-center gap-2">
          <Zap size={12} className="text-yellow-400" /> Modificateurs
        </h3>
        {ASCENSION_MODIFIERS.map(mod => (
          <div key={mod.id} className="flex gap-2">
            <span className="font-pixel text-[7px] text-yellow-400 shrink-0">{mod.name}</span>
            <span className="font-pixel text-[6px] text-muted-foreground">{mod.description}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AscensionMode;
