import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Sparkles, Swords, Palette, CheckCircle } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';
import { CHANGELOG } from '@/data/changelog';

const TYPE_CONFIG = {
  feature: {
    label: 'Nouveauté',
    icon: <Sparkles size={11} />,
    className: 'bg-primary/15 text-primary border border-primary/30',
  },
  fix: {
    label: 'Correction',
    icon: <Wrench size={11} />,
    className: 'bg-green-500/15 text-green-400 border border-green-500/30',
  },
  balance: {
    label: 'Équilibrage',
    icon: <Swords size={11} />,
    className: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  },
  ui: {
    label: 'Interface',
    icon: <Palette size={11} />,
    className: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const Changelog: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Accueil</span>
        </button>
        <Link to="/" className="flex items-center gap-2">
          <PixelIcon icon="bomb" size={18} color="hsl(var(--primary))" />
          <span className="font-pixel text-[9px] text-foreground">BOMBERQUEST</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red flex items-center justify-center gap-2">
              <CheckCircle size={22} /> CHANGELOG
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Toutes les mises à jour, corrections et nouvelles fonctionnalités du jeu.
            </p>
          </div>

          {/* Legend */}
          <div className="pixel-border bg-card p-4 mb-8 flex flex-wrap gap-3">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <span key={key} className={`inline-flex items-center gap-1.5 font-pixel text-[7px] px-2.5 py-1 rounded ${cfg.className}`}>
                {cfg.icon} {cfg.label}
              </span>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-8">
              {CHANGELOG.map((entry, i) => (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="relative pl-8"
                >
                  {/* Dot on timeline */}
                  <div className="absolute left-0 top-2 w-[23px] h-[23px] rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>

                  <div className="pixel-border bg-card p-5">
                    {/* Version header */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="font-pixel text-[10px] text-primary text-glow-red">v{entry.version}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(entry.date)}</span>
                    </div>
                    <h2 className="font-pixel text-[9px] text-foreground mb-4">{entry.title}</h2>

                    {/* Changes list */}
                    <ul className="space-y-2">
                      {entry.changes.map((change, j) => {
                        const cfg = TYPE_CONFIG[change.type];
                        return (
                          <li key={j} className="flex items-start gap-2.5">
                            <span className={`inline-flex items-center gap-1 font-pixel text-[6px] px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${cfg.className}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground leading-relaxed">{change.description}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-6 px-4 border-t border-border text-center">
        <Link to="/" className="flex items-center justify-center gap-2 mb-2">
          <PixelIcon icon="bomb" size={14} color="hsl(var(--primary))" />
          <span className="font-pixel text-[7px] text-foreground">BOMBERQUEST</span>
        </Link>
        <p className="text-[10px] text-muted-foreground">© 2026 BomberQuest</p>
      </footer>
    </div>
  );
};

export default Changelog;
