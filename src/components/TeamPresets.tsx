import React, { useState } from 'react';
import { Hero } from '@/game/types';
import HeroAvatar from '@/components/HeroAvatar';
import { getActiveClanSkills } from '@/game/clanSystem';
import { toast } from '@/hooks/use-toast';
import { Save, Play, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TeamPreset {
  id: string;
  name: string;
  heroIds: string[]; // max 6
}

interface TeamPresetsProps {
  heroes: Hero[];
  presets: TeamPreset[];
  onSave: (presets: TeamPreset[]) => void;
  onLoadTeam: (heroIds: string[]) => void;
}

const DEFAULT_PRESETS: TeamPreset[] = [
  { id: 'team-1', name: 'Équipe 1', heroIds: [] },
  { id: 'team-2', name: 'Équipe 2', heroIds: [] },
  { id: 'team-3', name: 'Équipe 3', heroIds: [] },
];

const MAX_HEROES_PER_TEAM = 6;

const TeamPresets: React.FC<TeamPresetsProps> = ({
  heroes,
  presets,
  onSave,
  onLoadTeam,
}) => {
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [localPresets, setLocalPresets] = useState<TeamPreset[]>(
    presets && presets.length > 0 ? presets : DEFAULT_PRESETS,
  );

  const handleLoadTeam = (preset: TeamPreset) => {
    onLoadTeam(preset.heroIds);
    toast({ title: 'Équipe chargée !', description: preset.name });
  };

  const handleEditToggle = (slotIndex: number) => {
    setEditingSlot(editingSlot === slotIndex ? null : slotIndex);
  };

  const handleNameChange = (slotIndex: number, newName: string) => {
    const updated = localPresets.map((p, i) =>
      i === slotIndex ? { ...p, name: newName } : p,
    );
    setLocalPresets(updated);
  };

  const handleToggleHero = (slotIndex: number, heroId: string) => {
    const preset = localPresets[slotIndex];
    let newHeroIds: string[];

    if (preset.heroIds.includes(heroId)) {
      newHeroIds = preset.heroIds.filter((id) => id !== heroId);
    } else {
      if (preset.heroIds.length >= MAX_HEROES_PER_TEAM) return;
      newHeroIds = [...preset.heroIds, heroId];
    }

    const updated = localPresets.map((p, i) =>
      i === slotIndex ? { ...p, heroIds: newHeroIds } : p,
    );
    setLocalPresets(updated);
  };

  const handleSaveSlot = (slotIndex: number) => {
    onSave(localPresets);
    setEditingSlot(null);
    toast({ title: 'Équipe sauvegardée !' });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {localPresets.map((preset, slotIndex) => {
          const isEmpty = preset.heroIds.length === 0;
          const isEditing = editingSlot === slotIndex;
          const presetHeroes = preset.heroIds.map(id => heroes.find(h => h.id === id)).filter(Boolean) as Hero[];
          const synergies = !isEmpty ? getActiveClanSkills(presetHeroes) : [];

          return (
            <div
              key={preset.id}
              className={cn(
                'rounded-lg border bg-card p-3 flex flex-col gap-2 transition-colors',
                isEditing ? 'border-yellow-500/60' : 'border-border',
              )}
            >
              {/* Nom du slot */}
              <input
                type="text"
                value={preset.name}
                onChange={(e) => handleNameChange(slotIndex, e.target.value)}
                className="font-pixel text-[9px] uppercase bg-transparent border-b border-border text-foreground outline-none focus:border-yellow-400/60 pb-0.5 w-full"
                maxLength={24}
                readOnly={!isEditing}
              />

              {/* Mini-avatars */}
              {isEmpty ? (
                <div className="flex items-center justify-center h-16 text-muted-foreground font-pixel text-[8px]">
                  Équipe vide
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-1">
                  {Array.from({ length: MAX_HEROES_PER_TEAM }).map((_, i) => {
                    const heroId = preset.heroIds[i];
                    const hero = heroId
                      ? heroes.find((h) => h.id === heroId)
                      : null;

                    return (
                      <div
                        key={i}
                        className={cn(
                          'rounded overflow-hidden border',
                          hero
                            ? 'border-border'
                            : 'border-border/30 bg-accent/50',
                        )}
                        style={{ width: 28, height: 28 }}
                      >
                        {hero ? (
                          <HeroAvatar
                            heroId={hero.id}
                            heroName={hero.name}
                            rarity={hero.rarity}
                            size={28}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Synergies actives */}
              {synergies.length > 0 && !isEditing && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {synergies.map((skill, i) => (
                    <span key={i} className="font-pixel text-[6px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded px-1 py-0.5">
                      ✨ {skill.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1 mt-1">
                {isEmpty ? (
                  <button
                    onClick={() => handleEditToggle(slotIndex)}
                    className="flex-1 flex items-center justify-center gap-1 font-pixel text-[7px] py-1 rounded bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 transition-colors"
                  >
                    <Edit2 size={10} />
                    Créer
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleLoadTeam(preset)}
                      className="flex-1 flex items-center justify-center gap-1 font-pixel text-[7px] py-1 rounded bg-green-600/20 hover:bg-green-600/40 text-green-300 transition-colors"
                    >
                      <Play size={10} />
                      Charger
                    </button>
                    <button
                      onClick={() => handleEditToggle(slotIndex)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1 font-pixel text-[7px] py-1 rounded transition-colors',
                        isEditing
                          ? 'bg-red-600/20 hover:bg-red-600/40 text-red-300'
                          : 'bg-accent hover:bg-accent/80 text-foreground/70',
                      )}
                    >
                      {isEditing ? (
                        <>
                          <X size={10} />
                          Annuler
                        </>
                      ) : (
                        <>
                          <Edit2 size={10} />
                          Modifier
                        </>
                      )}
                    </button>
                  </>
                )}

                {isEditing && (
                  <button
                    onClick={() => handleSaveSlot(slotIndex)}
                    className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-200 font-pixel text-[7px] transition-colors"
                  >
                    <Save size={10} />
                  </button>
                )}
              </div>

              {/* Mode édition : liste des héros */}
              {isEditing && (
                <div className="mt-2 border-t border-border pt-2">
                  <p className="font-pixel text-[8px] text-muted-foreground mb-2">
                    {preset.heroIds.length}/{MAX_HEROES_PER_TEAM} héros sélectionnés
                  </p>
                  <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                    {heroes.map((hero) => {
                      const selected = preset.heroIds.includes(hero.id);
                      const disabled =
                        !selected &&
                        preset.heroIds.length >= MAX_HEROES_PER_TEAM;

                      return (
                        <button
                          key={hero.id}
                          onClick={() =>
                            !disabled && handleToggleHero(slotIndex, hero.id)
                          }
                          disabled={disabled}
                          className={cn(
                            'flex flex-col items-center gap-0.5 p-1 rounded border text-xs transition-colors',
                            selected
                              ? 'border-yellow-400/60 bg-yellow-500/10 text-yellow-200'
                              : disabled
                              ? 'border-border/30 bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                              : 'border-border bg-accent/50 hover:bg-accent text-muted-foreground',
                          )}
                        >
                          <HeroAvatar
                            heroId={hero.id}
                            heroName={hero.name}
                            rarity={hero.rarity}
                            size={24}
                          />
                          <span className="font-pixel text-[8px] truncate w-full text-center">
                            {hero.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamPresets;
