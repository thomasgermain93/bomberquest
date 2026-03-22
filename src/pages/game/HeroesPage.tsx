import React from 'react';
import { motion } from 'framer-motion';
import { pixelFade } from '@/lib/animations';
import { Users, Filter, ChevronDown, Trophy, Lock as LockIcon } from 'lucide-react';
import { PlayerData, RARITY_CONFIG, Rarity, HERO_NAMES, HERO_FAMILIES, HERO_FAMILY_MAP, HeroFamilyId } from '@/game/types';
import { Hero } from '@/game/types';
import HeroCard from '@/components/HeroCard';
import HeroCollectionStats from '@/components/HeroCollectionStats';
import HeroDetailInline from '@/components/HeroDetailInline';
import HeroAvatar from '@/components/HeroAvatar';
import EmptyState from '@/components/EmptyState';
import TeamPresets, { TeamPreset } from '@/components/TeamPresets';
import { toast } from 'sonner';

type HeroesTab = 'collection' | 'codex' | 'equipes';
type HeroLevelFilter = 'all' | '1-20' | '21-40' | '41-60' | '61+';
type HeroSortBy = 'rarity' | 'level';

type HeroFilters = {
  rarity: 'all' | Rarity;
  level: HeroLevelFilter;
  sortBy: HeroSortBy;
  showDuplicatesOnly?: boolean;
  showLockedOnly?: boolean;
};

const DEFAULT_HERO_FILTERS: HeroFilters = {
  rarity: 'all',
  level: 'all',
  sortBy: 'rarity',
  showDuplicatesOnly: false,
  showLockedOnly: false,
};

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

interface HeroesPageProps {
  player: PlayerData;
  heroesTab: HeroesTab;
  setHeroesTab: (tab: HeroesTab) => void;
  heroFilters: HeroFilters;
  setHeroFilters: React.Dispatch<React.SetStateAction<HeroFilters>>;
  filteredHeroes: Hero[];
  filtersExpanded: boolean;
  setFiltersExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  codexClanFilter: 'all' | HeroFamilyId;
  setCodexClanFilter: React.Dispatch<React.SetStateAction<'all' | HeroFamilyId>>;
  upgradeHeroId: string | null;
  setUpgradeHeroId: (id: string | null) => void;
  upgradeHeroData: Hero | null;
  teamPresets: TeamPreset[];
  setTeamPresets: React.Dispatch<React.SetStateAction<TeamPreset[]>>;
  selectedHeroes: Set<string>;
  setSelectedHeroes: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleUpgrade: (heroId: string) => void;
  handleAscend: (heroId: string) => void;
}

const heroRarityOrder: Rarity[] = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];

const HeroesPage: React.FC<HeroesPageProps> = ({
  player,
  heroesTab,
  setHeroesTab,
  heroFilters,
  setHeroFilters,
  filteredHeroes,
  filtersExpanded,
  setFiltersExpanded,
  codexClanFilter,
  setCodexClanFilter,
  upgradeHeroId,
  setUpgradeHeroId,
  upgradeHeroData,
  teamPresets,
  setTeamPresets,
  selectedHeroes,
  setSelectedHeroes,
  handleUpgrade,
  handleAscend,
}) => {
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
      rarity: highestOwned?.rarity ?? 'common' as Rarity,
      heroPreviewId: normalized,
    };
  });

  const codexUnlockedCount = codexByName.filter((entry) => entry.unlocked).length;
  const codexTotalCount = codexByName.length;

  return (
    <div className="w-1/6 h-full overflow-y-auto pb-nav md:pl-16">
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
                          Lockés
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

                {/* Filtre clan Codex */}
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
                        <p className={`font-pixel text-[8px] ${CODEX_RARITY_COLOR[rarity]}`}>
                          {CODEX_RARITY_LABEL[rarity]} ({unlockedCount}/{totalCount})
                        </p>
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
                  toast('Équipe chargée !', { description: 'Prête pour le combat.' });
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HeroesPage;
