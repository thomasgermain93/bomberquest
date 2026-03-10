import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GLOSSARY_ENTRIES } from '@/data/wiki';
import { ArrowLeft, BookOpen, Search, ChevronRight, Library } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const CATEGORIES = ['Tous', 'Ressources', 'Stats', 'Héros', 'Gacha', 'Gameplay', 'Combat', 'Technique'];

const Glossary: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [activeLetter, setActiveLetter] = useState('');

  const filtered = useMemo(() => {
    return GLOSSARY_ENTRIES.filter((e) => {
      const matchesCat = activeCategory === 'Tous' || e.category === activeCategory;
      const matchesLetter = !activeLetter || e.term.toUpperCase().startsWith(activeLetter);
      const q = search.toLowerCase();
      const matchesSearch = !q || e.term.toLowerCase().includes(q) || (e.abbr ?? '').toLowerCase().includes(q) || e.definition.toLowerCase().includes(q);
      return matchesCat && matchesLetter && matchesSearch;
    }).sort((a, b) => a.term.localeCompare(b.term, 'fr'));
  }, [search, activeCategory, activeLetter]);

  // Group by first letter
  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((e) => {
      const letter = e.term[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(e);
    });
    return map;
  }, [filtered]);

  const usedLetters = new Set(GLOSSARY_ENTRIES.map((e) => e.term[0].toUpperCase()));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      <main className="max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-6">
            <Link to="/wiki" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Library size={11} /> Wiki
            </Link>
            <ChevronRight size={11} />
            <span className="text-foreground">Glossaire</span>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red flex items-center justify-center gap-2">
              <BookOpen size={22} /> GLOSSAIRE
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Définitions de tous les termes, abréviations et mécaniques du jeu.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un terme..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveLetter(''); }}
              className="w-full bg-card border border-border rounded px-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-4">
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

          {/* Alphabet navigator */}
          <div className="flex flex-wrap gap-1 mb-8">
            <button
              onClick={() => setActiveLetter('')}
              className={`font-pixel text-[6px] w-7 h-7 rounded border transition-colors ${
                !activeLetter ? 'bg-primary/20 text-primary border-primary/40' : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              TOUT
            </button>
            {ALPHABET.map((letter) => {
              const available = usedLetters.has(letter);
              return (
                <button
                  key={letter}
                  disabled={!available}
                  onClick={() => setActiveLetter(activeLetter === letter ? '' : letter)}
                  className={`font-pixel text-[7px] w-7 h-7 rounded border transition-colors ${
                    !available
                      ? 'opacity-25 cursor-not-allowed bg-card text-muted-foreground border-border'
                      : activeLetter === letter
                      ? 'bg-primary/20 text-primary border-primary/40'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Entries */}
          {Object.keys(grouped).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">Aucun terme trouvé.</p>
          )}
          <div className="space-y-8">
            {Object.keys(grouped).sort().map((letter) => (
              <motion.div key={letter} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-pixel text-sm text-primary">{letter}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3">
                  {grouped[letter].map((entry) => (
                    <div key={entry.term} className="pixel-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-pixel text-[9px] text-foreground">{entry.term}</span>
                          {entry.abbr && (
                            <span className="text-[10px] text-muted-foreground">({entry.abbr})</span>
                          )}
                        </div>
                        <span className="font-pixel text-[6px] px-2 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">{entry.category}</span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{entry.definition}</p>
                    </div>
                  ))}
                </div>
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

export default Glossary;
