import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WIKI_ARTICLES } from '@/data/wiki';
import { ArrowLeft, ChevronRight, Library, List } from 'lucide-react';
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

  // TOC: sections with headings
  const headings = article.content
    .map((s, i) => (s.heading ? { heading: s.heading, index: i } : null))
    .filter(Boolean) as { heading: string; index: number }[];
  const showToc = headings.length >= 3;

  // Related articles
  const relatedArticles = (article.relatedSlugs || [])
    .map((s) => WIKI_ARTICLES.find((a) => a.slug === s))
    .filter(Boolean);

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
          <div className="font-pixel text-[7px] text-muted-foreground mb-5 flex items-center gap-1.5 flex-wrap">
            <Link to="/wiki" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Library size={11} /> Wiki
            </Link>
            <ChevronRight size={9} />
            <span>{article.category}</span>
            <ChevronRight size={9} />
            <span className="text-foreground">{article.title}</span>
          </div>

          {/* Category badge + difficulty */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="font-pixel text-[7px] px-2.5 py-1 rounded bg-primary/20 text-primary inline-block">
              {article.category}
            </span>
            {article.difficulty && (
              <span className={`font-pixel text-[6px] px-2 py-0.5 rounded inline-block ${
                article.difficulty === 'débutant'
                  ? 'bg-green-500/20 text-green-400'
                  : article.difficulty === 'intermédiaire'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {article.difficulty.toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red mb-2">{article.title}</h1>
          <p className="text-sm text-muted-foreground mb-8">{article.subtitle}</p>

          {/* Table des matières */}
          {showToc && (
            <aside className="pixel-border bg-muted p-3 mb-8">
              <p className="font-pixel text-[8px] text-foreground mb-2 flex items-center gap-1.5">
                <List size={12} /> SOMMAIRE
              </p>
              <ul className="space-y-1">
                {headings.map((h) => (
                  <li key={h.index}>
                    <a
                      href={`#section-${h.index}`}
                      className="font-pixel text-[7px] text-muted-foreground hover:text-primary transition-colors block py-0.5"
                    >
                      ▸ {h.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* Sections */}
          <div className="space-y-8">
            {article.content.map((section, i) => (
              <div key={i} id={section.heading ? `section-${i}` : undefined}>
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

          {/* Voir aussi */}
          {relatedArticles.length > 0 && (
            <div className="mt-10">
              <h3 className="font-pixel text-[9px] text-foreground mb-3 border-b border-border pb-1.5">VOIR AUSSI</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    to={`/wiki/${related.slug}`}
                    className="pixel-border bg-card p-3 hover:bg-muted hover:glow-blue transition-all group flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <PixelIcon icon={related.icon} size={16} color="hsl(var(--primary))" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">{related.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{related.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-10 gap-4">
            {prev ? (
              <Link to={`/wiki/${prev.slug}`} className="pixel-border bg-card p-3 flex-1 hover:bg-muted transition-colors group">
                <p className="text-[10px] text-muted-foreground mb-1">&larr; Pr&eacute;c&eacute;dent</p>
                <p className="font-pixel text-[7px] text-foreground group-hover:text-primary transition-colors">{prev.title}</p>
              </Link>
            ) : <div className="flex-1" />}
            {next ? (
              <Link to={`/wiki/${next.slug}`} className="pixel-border bg-card p-3 flex-1 text-right hover:bg-muted transition-colors group">
                <p className="text-[10px] text-muted-foreground mb-1">Suivant &rarr;</p>
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
        <p className="text-[10px] text-muted-foreground">&copy; 2026 BomberQuest</p>
      </footer>
    </div>
  );
};

export default WikiPage;
