import React, { useState } from 'react';
import PixelIcon from '@/components/PixelIcon';
import { Hero, RARITY_CONFIG } from '@/game/types';
import { MAX_STARS, getMaxLevel } from '@/game/upgradeSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Shield, Star } from 'lucide-react';
import HeroDetailContent from '@/components/HeroDetailContent';

interface HeroUpgradeModalProps {
  hero: Hero | null;
  coins: number;
  allHeroes?: Hero[];
  onClose: () => void;
  onUpgrade: (heroId: string) => void;
  onAscend?: (heroId: string) => void;
}

const HeroUpgradeModal: React.FC<HeroUpgradeModalProps> = ({ hero, coins, allHeroes, onClose, onUpgrade, onAscend }) => {
  const [activeTab, setActiveTab] = useState<'upgrade' | 'identity'>('upgrade');

  if (!hero) return null;

  const config = RARITY_CONFIG[hero.rarity];
  const maxLevel = getMaxLevel(hero.rarity);

  return (
    <Dialog open={!!hero} onOpenChange={() => onClose()}>
      <DialogContent className="pixel-border bg-card border-border max-w-md p-0 overflow-hidden rounded-none max-h-[90vh] overflow-y-auto">
        <div
          className="p-5 pb-3 relative"
          style={{
            background: `linear-gradient(180deg, hsl(var(--game-rarity-${hero.rarity}) / 0.15) 0%, transparent 100%)`,
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm text-foreground flex items-center gap-2">
              <PixelIcon icon={hero.icon} size={24} rarity={hero.rarity} />
              {hero.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-1">
              <span
                className="font-pixel text-[10px] px-2 py-0.5"
                style={{
                  color: `hsl(var(--game-rarity-${hero.rarity}))`,
                  backgroundColor: `hsl(var(--game-rarity-${hero.rarity}) / 0.15)`,
                }}
              >
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Shield size={10} /> Niv. {hero.level}
              </span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: hero.stars }).map((_, i) => (
                  <Star key={i} size={12} className="text-game-gold fill-current" />
                ))}
                {Array.from({ length: MAX_STARS - hero.stars }).map((_, i) => (
                  <Star key={`e${i}`} size={12} className="text-muted-foreground" />
                ))}
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-3">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('upgrade')}
              className={`flex-1 py-2 text-[10px] font-pixel transition-colors active:scale-[0.97] ${
                activeTab === 'upgrade'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Améliorer
            </button>
            <button
              onClick={() => setActiveTab('identity')}
              className={`flex-1 py-2 text-[10px] font-pixel transition-colors active:scale-[0.97] ${
                activeTab === 'identity'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Carte d'identité
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <HeroDetailContent
            hero={hero}
            coins={coins}
            allHeroes={allHeroes}
            activeTab={activeTab}
            onUpgrade={onUpgrade}
            onAscend={onAscend}
            variant="modal"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeroUpgradeModal;
