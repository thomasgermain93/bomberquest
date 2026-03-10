import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WIKI_ARTICLES } from '@/data/wiki';
import { ArrowLeft, ChevronRight, Library } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';

const WikiPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = WIKI_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-pixel text-sm text-foreground mb-4">Article introuvable</p>
          <button onClick={() => navigate('/wiki')} className="pixel-btn pixel-btn-secondary font-pixel text-[8px]">
            Retour au wiki
          </button>
        </div>
      </div>
    );
  }

  const idx = WIKI_ARTICLES.findIndex((a) => a.slug === slug);
  const prev = idx > 0 ? WIKI_ARTICLES[idx - 1] : null;
  const next = idx < WIKI_ARTICLES.length - 1 ? WIKI_ARTICLES[idx + 1] : null;

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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-5">
            <Link to="/wiki" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Library size={11} /> Wiki
            </Link>
            <ChevronRight size={11} />
            <span className="text-foreground">{article.title}</span>
          </div>

          {/* Category badge */}
          <span className="font-pixel text-[7px] px-2.5 py-1 rounded bg-primary/20 text-primary inline-block mb-4">
            {article.category}
          </span>

          <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red mb-2">{article.title}</h1>
          <p className="text-sm text-muted-foreground mb-8">{article.subtitle}</p>

          {/* Sections */}
          <div className="space-y-8">
            {article.content.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2 className="font-pixel text-[9px] text-primary mb-3 border-b border-border pb-1.5">{section.heading}</h2>
                )}
                {section.body && (
                  <p className="text-sm text-foreground/90 leading-relaxed">{section.body}</p>
                )}
                {section.list && (
                  <ul className="mt-2 space-y-1.5">
                    {section.list.map((item, j) => (
                      <li key={j} className="text-sm text-foreground/85 flex items-start gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.table && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          {section.table.headers.map((h, j) => (
                            <th key={j} className="text-left px-3 py-2 font-pixel text-[6px] text-muted-foreground border border-border">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, j) => (
                          <tr key={j} className={j % 2 === 0 ? 'bg-background' : 'bg-card/50'}>
                            {row.map((cell, k) => (
                              <td key={k} className="px-3 py-2 text-foreground/85 border border-border">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-10 gap-4">
            {prev ? (
              <Link to={`/wiki/${prev.slug}`} className="pixel-border bg-card p-3 flex-1 hover:bg-muted transition-colors group">
                <p className="text-[10px] text-muted-foreground mb-1">← Précédent</p>
                <p className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">{prev.title}</p>
              </Link>
            ) : <div className="flex-1" />}
            {next ? (
              <Link to={`/wiki/${next.slug}`} className="pixel-border bg-card p-3 flex-1 text-right hover:bg-muted transition-colors group">
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

export default WikiPage;
