import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { WIKI_ARTICLES } from '@/data/wiki';
import { ArrowLeft, BookOpen, ChevronRight, Library, Search } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';

const CATEGORIES = ['Tous', 'Économie', 'Héros', 'Cartes', 'Combat', 'Gacha', 'Progression'];

const WikiIndex: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  const filtered = WIKI_ARTICLES.filter((a) => {
    const matchesCategory = activeCategory === 'Tous' || a.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

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
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red flex items-center justify-center gap-2">
              <Library size={22} /> WIKI
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Référence complète sur les ressources, les héros, les cartes et les modes de jeu.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Link
              to="/wiki/glossaire"
              className="pixel-border bg-card px-4 py-2 flex items-center gap-2 hover:bg-muted hover:glow-blue transition-all group"
            >
              <BookOpen size={14} className="text-primary" />
              <span className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">GLOSSAIRE</span>
              <ChevronRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link
              to="/wiki/bestiaire"
              className="pixel-border bg-card px-4 py-2 flex items-center gap-2 hover:bg-muted hover:glow-blue transition-all group"
            >
              <BookOpen size={14} className="text-primary" />
              <span className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">BESTIAIRE</span>
              <ChevronRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link
              to="/guides"
              className="pixel-border bg-card px-4 py-2 flex items-center gap-2 hover:bg-muted hover:glow-blue transition-all group"
            >
              <BookOpen size={14} className="text-primary" />
              <span className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">GUIDES & ASTUCES</span>
              <ChevronRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded px-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-pixel text-[6px] px-3 py-1.5 rounded border transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Articles list */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">Aucun article trouvé.</p>
            )}
            {filtered.map((article, i) => (
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={`/wiki/${article.slug}`}
                  className="pixel-border bg-card p-5 flex items-center gap-4 hover:bg-muted hover:glow-blue transition-all group block"
                >
                  <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <PixelIcon icon={article.icon} size={22} color="hsl(var(--primary))" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-pixel text-[6px] px-2 py-0.5 rounded bg-primary/15 text-primary mb-1 inline-block">{article.category}</span>
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

export default WikiIndex;
