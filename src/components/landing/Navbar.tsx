import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PixelIcon from '@/components/PixelIcon';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const closeMenuAndNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur border-b border-border px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PixelIcon icon="bomb" size={18} color="hsl(var(--primary))" />
          <span className="font-pixel text-[9px] text-foreground">BOMBERQUEST</span>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <button onClick={() => scrollTo('features')} className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">
            FEATURES
          </button>
          <button onClick={() => scrollTo('faq')} className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </button>
          <Link to="/wiki" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">WIKI</Link>
          <Link to="/guides" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">GUIDES</Link>
          <Link to="/changelog" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">CHANGELOG</Link>
          <button
            onClick={() => navigate(user ? '/game' : '/auth')}
            className="pixel-btn pixel-btn-gold font-pixel text-[7px] px-3 py-1.5 min-h-[44px]"
          >
            JOUER
          </button>
        </div>

        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="md:hidden pixel-btn pixel-btn-secondary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Ouvrir le menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 pt-2 border-t border-border flex flex-col gap-1.5">
          <button onClick={() => scrollTo('features')} className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 min-h-[44px] flex items-center text-left">
            FEATURES
          </button>
          <button onClick={() => scrollTo('faq')} className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 min-h-[44px] flex items-center text-left">
            FAQ
          </button>
          <Link onClick={() => setMobileMenuOpen(false)} to="/wiki" className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 min-h-[44px] flex items-center">WIKI</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/guides" className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 min-h-[44px] flex items-center">GUIDES</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/changelog" className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 min-h-[44px] flex items-center">CHANGELOG</Link>
          <button
            onClick={() => closeMenuAndNavigate(user ? '/game' : '/auth')}
            className="pixel-btn pixel-btn-gold font-pixel text-[8px] px-3 py-2.5 min-h-[44px] mt-1"
          >
            JOUER
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
