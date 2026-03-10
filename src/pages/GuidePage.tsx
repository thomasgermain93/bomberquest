import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GUIDE_ARTICLES } from '@/data/guides';
import { ArrowLeft, Clock, Lightbulb, BookOpen, ChevronRight } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';

const GuidePage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = GUIDE_ARTICLES.find(a => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-pixel text-sm text-foreground mb-4">Article introuvable</p>
          <button onClick={() => navigate('/guides')} className="pixel-btn pixel-btn-secondary font-pixel text-[8px]">
            Retour aux guides
          </button>
        </div>
      </div>
    );
  }

  // Find adjacent articles
  const idx = GUIDE_ARTICLES.findIndex(a => a.slug === slug);
  const prev = idx > 0 ? GUIDE_ARTICLES[idx - 1] : null;
  const next = idx < GUIDE_ARTICLES.length - 1 ? GUIDE_ARTICLES[idx + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/guides')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Guides</span>
        </button>
        <Link to="/" className="flex items-center gap-2">
          <PixelIcon icon="bomb" size={18} color="hsl(var(--primary))" />
          <span className="font-pixel text-[9px] text-foreground">BOMBERQUEST</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Category & meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="font-pixel text-[7px] px-2.5 py-1 rounded bg-primary/20 text-primary">{article.category}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} /> {article.readTime}
            </span>
          </div>

          <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red mb-2">{article.title}</h1>
          <p className="text-sm text-muted-foreground mb-8">{article.subtitle}</p>

          {/* Content */}
          <div className="space-y-5">
            {article.content.map((paragraph, i) => (
              <div key={i} className="text-sm text-foreground/90 leading-relaxed">
                {paragraph.split('\n').map((line, j) => {
                  // Handle bold
                  const parts = line.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={j} className={j > 0 ? 'mt-1.5' : ''}>
                      {parts.map((part, k) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={k} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
                        }
                        return <span key={k}>{part}</span>;
                      })}
                    </p>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tips box */}
          <div className="pixel-border bg-game-gold/5 border-game-gold/30 p-5 mt-8">
            <h3 className="font-pixel text-[9px] text-game-gold mb-3 flex items-center gap-2">
              <Lightbulb size={14} /> CONSEILS
            </h3>
            <ul className="space-y-2">
              {article.tips.map((tip, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-game-gold mt-0.5">▸</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-10 gap-4">
            {prev ? (
              <Link to={`/guides/${prev.slug}`} className="pixel-border bg-card p-3 flex-1 hover:bg-muted transition-colors group">
                <p className="text-[10px] text-muted-foreground mb-1">← Précédent</p>
                <p className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">{prev.title}</p>
              </Link>
            ) : <div className="flex-1" />}
            {next ? (
              <Link to={`/guides/${next.slug}`} className="pixel-border bg-card p-3 flex-1 text-right hover:bg-muted transition-colors group">
                <p className="text-[10px] text-muted-foreground mb-1">Suivant →</p>
                <p className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">{next.title}</p>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </motion.article>
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

export default GuidePage;
