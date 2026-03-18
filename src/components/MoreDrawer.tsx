import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Zap, Trophy, RefreshCw, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { overlayBackdrop, pixelSlide } from '@/lib/animations';

interface MoreDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  currentScreen: string;
}

const DRAWER_ITEMS = [
  { id: 'story', label: 'Mode Histoire', icon: BookOpen },
  { id: 'codex', label: 'Codex des héros', icon: Book },
  { id: 'fusion', label: 'Fusion', icon: Zap },
  { id: 'achievements', label: 'Succès', icon: Trophy },
  { id: 'recycle', label: 'Recyclage', icon: RefreshCw },
];

export function MoreDrawer({
  open,
  onClose,
  onNavigate,
  currentScreen,
}: MoreDrawerProps) {
  const handleNavigate = (screen: string) => {
    onNavigate(screen);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay semi-transparent */}
          <motion.div
            key="more-drawer-overlay"
            variants={overlayBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Drawer depuis la droite */}
          <motion.aside
            key="more-drawer-panel"
            variants={pixelSlide('right')}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50',
              'w-64 bg-card border-l border-border',
              'flex flex-col',
            )}
          >
            {/* Header du drawer */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-pixel text-[9px] text-foreground">MENU</span>
              <button
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Liste des items */}
            <nav className="flex-1 overflow-y-auto py-1">
              {DRAWER_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = currentScreen === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNavigate(id)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3',
                      'cursor-pointer transition-colors duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                        : 'text-foreground hover:bg-accent border-l-2 border-transparent',
                    )}
                  >
                    <Icon size={16} className={cn(isActive ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="font-pixel text-[8px]">{label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default MoreDrawer;
