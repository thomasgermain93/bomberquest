import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, ChevronRight, Image as ImageIcon, PawPrint } from 'lucide-react';
import HeroAvatar from '@/components/HeroAvatar';
import PixelIcon from '@/components/PixelIcon';
import { BESTIARY_BY_FAMILY, BESTIARY_STATUS_LABELS, CLAN_COLORS, AssetStatus, BestiaryBomber } from '@/data/bestiary';
import { drawHeroPortrait, drawHeroSprite } from '@/game/heroRenderer';
import { RARITY_CONFIG } from '@/game/types';

const statusClasses: Record<AssetStatus, string> = {
  missing: 'bg-red-500/10 text-red-400 border-red-500/30',
  wip: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ready: 'bg-green-500/10 text-green-400 border-green-500/30',
};

const AssetPreview: React.FC<{ label: string; src?: string; status: AssetStatus; rarity?: BestiaryBomber['rarity']; heroId?: string; mode?: 'sprite' | 'portrait' }> = ({ label, src, status, rarity, heroId, mode = 'sprite' }) => {
  const [hasLoadError, setHasLoadError] = useState(false);

  const generatedSprite = useMemo(() => {
    if (!rarity || typeof document === 'undefined') return undefined;

    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.scale(2, 2);
    if (mode === 'portrait') {
      drawHeroPortrait(ctx, rarity, 0, heroId);
    } else {
      drawHeroSprite(ctx, 0, 0, rarity, 'idle', 0, heroId ?? 'bestiary-preview', 100, 100);
    }
    ctx.restore();

    return canvas.toDataURL('image/png');
  }, [heroId, mode, rarity]);

  const resolvedSrc = !hasLoadError && src ? src : generatedSprite;

  return (
    <div className="rounded border border-border bg-background/70 p-2">
      <p className="font-pixel text-[6px] text-muted-foreground mb-1.5 uppercase">{label}</p>
      <div className="h-20 rounded bg-card border border-border/60 flex items-center justify-center overflow-hidden">
        {resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt={`Aperçu ${label.toLowerCase()}`}
            loading="lazy"
            onError={() => setHasLoadError(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center px-2">
            <ImageIcon size={14} className="mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground leading-tight">
              {src ? 'Asset introuvable' : 'Asset manquant'}
            </p>
            <p className="text-[9px] text-muted-foreground/80">Statut: {BESTIARY_STATUS_LABELS[status]}</p>
          </div>
        )}
      </div>
      {src && (
        <p className="mt-1 text-[9px] text-muted-foreground/80 truncate" title={src}>
          {src}
        </p>
      )}
      {!src && generatedSprite && (
        <p className="mt-1 text-[9px] text-muted-foreground/70">Preview générée depuis le skin en jeu</p>
      )}
    </div>
  );
};

const BomberCard: React.FC<{ bomber: BestiaryBomber }> = ({ bomber }) => {
  const clanColor = CLAN_COLORS[bomber.familyId] || '#888888';
  return (
    <article className="pixel-border bg-card p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
              {bomber.rarity ? (
                <HeroAvatar heroId={bomber.id} heroName={bomber.name} rarity={bomber.rarity} size={44} />
              ) : (
                <AlertTriangle size={14} className="text-muted-foreground" />
              )}
            </div>
            <div 
              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-card" 
              style={{ backgroundColor: clanColor, boxShadow: `0 0 4px ${clanColor}` }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-pixel text-[8px] text-foreground truncate">{bomber.name}</p>
            {bomber.lore && (
              <p className="text-[9px] text-muted-foreground/80 mt-0.5 italic leading-tight">{bomber.lore}</p>
            )}
            <p className="text-[10px] text-muted-foreground font-mono">#{bomber.id}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          {bomber.rarity ? (
            <p className="font-medium text-[11px]" style={{ color: `hsl(var(--${RARITY_CONFIG[bomber.rarity].color}))` }}>
              {RARITY_CONFIG[bomber.rarity].label}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">—</p>
          )}
          <span className={`inline-flex mt-1 px-2 py-0.5 border rounded text-[10px] ${statusClasses[bomber.assetStatus]}`}>
            {BESTIARY_STATUS_LABELS[bomber.assetStatus]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <AssetPreview label="Sprite" src={bomber.assets.spriteSheet} status={bomber.assetStatus} rarity={bomber.rarity} heroId={bomber.id} mode="sprite" />
        <AssetPreview label="Portrait" src={bomber.assets.portrait} status={bomber.assetStatus} rarity={bomber.rarity} heroId={bomber.id} mode="portrait" />
      </div>
    </article>
  );
};

const Bestiary: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/wiki')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Wiki</span>
        </button>
        <Link to="/" className="flex items-center gap-2">
          <PixelIcon icon="bomb" size={18} color="hsl(var(--primary))" />
          <span className="font-pixel text-[9px] text-foreground">BOMBERQUEST</span>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red flex items-center justify-center gap-2">
            <PawPrint size={20} /> BESTIAIRE
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Vue visuelle des assets héros (icône + sprite + portrait), avec fallback propre si un fichier manque.
          </p>
        </div>

        <div className="space-y-6">
          {BESTIARY_BY_FAMILY.map(({ family, bombers }) => (
            <section key={family.id} className="pixel-border bg-card p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: family.color || CLAN_COLORS[family.id], boxShadow: `0 0 8px ${family.color || CLAN_COLORS[family.id]}80` }}
                  />
                  <div>
                    <h2 className="font-pixel text-[9px] text-foreground">{family.name}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{family.description}</p>
                  </div>
                </div>
                <span className="font-pixel text-[7px] px-2 py-1 rounded bg-primary/15 text-primary w-fit">
                  {bombers.length} HÉROS
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {bombers.map((bomber) => (
                  <BomberCard key={bomber.id} bomber={bomber} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/wiki" className="pixel-border bg-card px-4 py-2 inline-flex items-center gap-2 hover:bg-muted transition-colors">
            <BookOpen size={14} className="text-primary" />
            <span className="font-pixel text-[7px]">Retour au Wiki</span>
            <ChevronRight size={12} className="text-muted-foreground" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Bestiary;
