import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight, PawPrint } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';
import { BESTIARY_BY_FAMILY, BESTIARY_STATUS_LABELS, AssetStatus } from '@/data/bestiary';
import { RARITY_CONFIG } from '@/game/types';

const statusClasses: Record<AssetStatus, string> = {
  missing: 'bg-red-500/10 text-red-400 border-red-500/30',
  wip: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ready: 'bg-green-500/10 text-green-400 border-green-500/30',
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

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red flex items-center justify-center gap-2">
            <PawPrint size={20} /> BESTIAIRE
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Source de vérité des familles et bombers pour la production skins/sprites.
          </p>
        </div>

        <section className="pixel-border bg-card p-5 mb-8">
          <h2 className="font-pixel text-[8px] text-foreground mb-3">Comment ajouter un bomber</h2>
          <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
            <li>Ajouter la famille dans <code>src/data/bestiary.ts</code> si elle n&apos;existe pas.</li>
            <li>Ajouter l&apos;entrée bomber (id unique, name, familyId, rarity, assetStatus, assets).</li>
            <li>Mettre à jour <code>assets.spriteSheet</code> / <code>assets.portrait</code> dès que les fichiers existent.</li>
            <li>Conserver les IDs en kebab-case pour faciliter les refs d&apos;issues art.</li>
          </ol>
        </section>

        <div className="space-y-6">
          {BESTIARY_BY_FAMILY.map(({ family, bombers }) => (
            <section key={family.id} className="pixel-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-pixel text-[9px] text-foreground">{family.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{family.description}</p>
                </div>
                <span className="font-pixel text-[7px] px-2 py-1 rounded bg-primary/15 text-primary">
                  {bombers.length} BOMBERS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Nom</th>
                      <th className="py-2 pr-3">Rareté</th>
                      <th className="py-2 pr-3">Statut assets</th>
                      <th className="py-2 pr-3">SpriteSheet</th>
                      <th className="py-2">Portrait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bombers.map((bomber) => (
                      <tr key={bomber.id} className="border-b border-border/40">
                        <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{bomber.id}</td>
                        <td className="py-2 pr-3 text-foreground">{bomber.name}</td>
                        <td className="py-2 pr-3">
                          {bomber.rarity ? (
                            <span className="font-medium" style={{ color: `hsl(var(--${RARITY_CONFIG[bomber.rarity].color}))` }}>
                              {RARITY_CONFIG[bomber.rarity].label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`inline-flex px-2 py-0.5 border rounded ${statusClasses[bomber.assetStatus]}`}>
                            {BESTIARY_STATUS_LABELS[bomber.assetStatus]}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground font-mono text-[11px]">
                          {bomber.assets.spriteSheet ?? '—'}
                        </td>
                        <td className="py-2 text-muted-foreground font-mono text-[11px]">{bomber.assets.portrait ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
