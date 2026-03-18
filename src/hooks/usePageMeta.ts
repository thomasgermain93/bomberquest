import { useEffect } from 'react';

interface PageMeta {
  title?: string;
  description?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'BomberQuest — Idle RPG Pixel Art';
const DEFAULT_DESC = 'Collecte des héros, explore des cartes en pixel art, domine le mode Histoire. Jeu idle RPG gacha gratuit.';

export function usePageMeta({ title, description, noIndex = false }: PageMeta = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — BomberQuest` : DEFAULT_TITLE;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, prop = false) => {
      const selector = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (prop) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) setMeta('description', description);
    if (noIndex) setMeta('robots', 'noindex, nofollow');
    setMeta('og:title', fullTitle, true);
    if (description) setMeta('og:description', description, true);
  }, [title, description, noIndex]);
}
