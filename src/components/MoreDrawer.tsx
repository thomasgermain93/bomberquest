import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Zap, Trophy, RefreshCw, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Drawer depuis la droite */}
          <motion.aside
            key="more-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50',
              'w-64 bg-card border-l border-border',
              'flex flex-col',
            )}
          >
            {/* Header du drawer */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <span className="font-semibold text-foreground">Plus</span>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Liste des items */}
            <nav className="flex-1 overflow-y-auto py-2">
              {DRAWER_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = currentScreen === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNavigate(id)}
                    className={cn(
                      'flex items-center gap-3 w-full px-6 py-4',
                      'hover:bg-accent cursor-pointer transition-colors duration-150',
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-foreground',
                    )}
                  >
                    <Icon size={18} className={cn(isActive ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm">{label}</span>
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
