import { motion } from 'framer-motion';
import { Sparkles, Users, Swords, Trophy, Flame, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainNavProps {
  page: number; // 0-5
  onNavigate: (page: number) => void;
}

const PAGES = [
  { icon: Sparkles, label: 'Invoquer', testId: 'tab-summon' },
  { icon: Users, label: 'Héros', testId: 'tab-heroes' },
  { icon: Swords, label: 'Combat', testId: 'tab-combat' },
  { icon: Trophy, label: 'Progression', testId: 'tab-progression' },
  { icon: Flame, label: 'Forge', testId: 'tab-fusion' },
  { icon: Store, label: 'Marché', testId: 'tab-marketplace' },
];

export function MainNav({ page, onNavigate }: MainNavProps) {
  return (
    <>
      {/* Mobile : barre fixée en bas */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'md:hidden',
          'h-16 bg-card/95 backdrop-blur border-t border-border',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="flex items-stretch h-full">
          {PAGES.map(({ icon: Icon, label, testId }, index) => {
            const isActive = page === index;
            return (
              <button
                key={index}
                onClick={() => onNavigate(index)}
                data-testid={testId}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1',
                  'transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon size={20} />
                <span className="font-pixel text-[7px] leading-none truncate max-w-[56px]">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="page-indicator"
                    className="absolute bottom-0 h-0.5 w-8 bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
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
          'w-16 flex-col items-center py-6 gap-2',
          'bg-card/95 backdrop-blur border-r border-border',
        )}
      >
        {PAGES.map(({ icon: Icon, label, testId }, index) => {
          const isActive = page === index;
          return (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              data-testid={testId}
              title={label}
              className={cn(
                'relative flex items-center justify-center',
                'w-12 h-12 transition-colors duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="page-indicator-desktop"
                  className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={20} />
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default MainNav;
