import React from 'react';
import { Link } from 'react-router-dom';
import PixelIcon from '@/components/PixelIcon';

const Footer: React.FC = () => (
  <footer className="py-10 px-4 border-t border-border">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start justify-between gap-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <PixelIcon icon="bomb" size={16} color="hsl(var(--primary))" />
          <span className="font-pixel text-[8px] text-foreground">BOMBERQUEST</span>
        </div>
        <p className="text-xs text-muted-foreground">RPG Idle Bomber — pixel art</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link to="/wiki" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Wiki</Link>
        <Link to="/wiki/glossaire" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Glossaire</Link>
        <Link to="/guides" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Guides</Link>
        <Link to="/changelog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Changelog</Link>
        <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Connexion</Link>
      </div>
    </div>

    <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-border/50">
      <p className="text-[10px] text-muted-foreground">© 2026 BomberQuest — RPG Idle Bomber</p>
    </div>
  </footer>
);

export default Footer;
