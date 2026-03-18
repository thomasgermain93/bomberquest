import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GUIDE_ARTICLES } from '@/data/guides';
import { ArrowLeft, Clock, BookOpen, ChevronRight, Library } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';
import { usePageMeta } from '@/hooks/usePageMeta';

const GuidesIndex: React.FC = () => {
  const navigate = useNavigate();
  usePageMeta({ title: 'Guides', description: 'Guides et tutoriels BomberQuest.' });

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

      <main className="max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red flex items-center justify-center gap-2">
              <BookOpen size={22} /> GUIDES & ASTUCES
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Tout ce que tu dois savoir pour devenir un maître bombardier !
            </p>
          </div>

          {/* Link to Wiki */}
          <div className="flex justify-center mb-8">
            <Link
              to="/wiki"
              className="pixel-border bg-card px-5 py-3 flex items-center gap-3 hover:bg-muted hover:glow-blue transition-all group"
            >
              <Library size={16} className="text-primary" />
              <div>
                <p className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">WIKI — RÉFÉRENCE COMPLÈTE</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Héros, cartes, ressources, glossaire…</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>

          <div className="space-y-4">
            {GUIDE_ARTICLES.map((article, i) => (
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={`/guides/${article.slug}`}
                  className="pixel-border bg-card p-5 flex items-center gap-4 hover:bg-muted hover:glow-blue transition-all group block"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <PixelIcon icon={article.icon} size={24} color="hsl(var(--primary))" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-pixel text-[6px] px-2 py-0.5 rounded bg-primary/15 text-primary">{article.category}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} /> {article.readTime}
                      </span>
                    </div>
                    <h2 className="font-pixel text-[9px] text-foreground group-hover:text-primary transition-colors">{article.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{article.subtitle}</p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
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

export default GuidesIndex;
