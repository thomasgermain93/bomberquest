import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Swords, Users, Sparkles, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

type BottomNavScreen = 'hub' | 'combat' | 'heroes' | 'summon' | 'more';

interface BottomNavProps {
  screen: BottomNavScreen | string; // string pour les sous-écrans mappés (codex → more, etc.)
  onNavigate: (screen: BottomNavScreen) => void;
}

const NAV_ITEMS = [
  { id: 'hub', label: 'Hub', icon: Home },
  { id: 'combat', label: 'Combat', icon: Swords },
  { id: 'heroes', label: 'Héros', icon: Users },
  { id: 'summon', label: 'Invoquer', icon: Sparkles },
  { id: 'more', label: 'Plus', icon: MoreHorizontal },
] as const;

export function BottomNav({ screen, onNavigate }: BottomNavProps) {
  return (
    <>
      {/* Mobile : barre sticky en bas */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'md:hidden',
          'h-16 bg-card/95 backdrop-blur border-t border-border',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="flex items-center justify-around h-full px-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = screen === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'flex-1 h-full px-1 transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-10 rounded-full bg-primary/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={20} className="relative z-10" />
                <span className="relative z-10 text-[10px] font-medium leading-none">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop md+ : sidebar gauche verticale */}
      <nav
        className={cn(
          'hidden md:flex',
          'fixed left-0 top-0 bottom-0 z-40',
          'w-16 flex-col items-center py-4 gap-1',
          'bg-card/95 backdrop-blur border-r border-border',
        )}
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = screen === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1',
                'w-12 h-12 rounded-lg transition-colors duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-indicator-desktop"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={20} className="relative z-10" />
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default BottomNav;
