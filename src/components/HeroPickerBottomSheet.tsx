import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hero } from '@/game/types';
import HeroCard from '@/components/HeroCard';
import { X } from 'lucide-react';

interface HeroPickerBottomSheetProps {
  open: boolean;
  heroes: Hero[];
  selectedIds?: Set<string>;
  onSelect: (hero: Hero) => void;
  onClose: () => void;
  title?: string;
}

const HeroPickerBottomSheet: React.FC<HeroPickerBottomSheetProps> = ({
  open,
  heroes,
  selectedIds,
  onSelect,
  onClose,
  title,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-xl"
            style={{ maxHeight: '72vh' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="font-pixel text-[9px] text-foreground">{title || 'CHOISIR UN HÉROS'}</p>
              <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            {/* Content */}
            <div className="overflow-y-auto p-3" style={{ maxHeight: 'calc(72vh - 80px)' }}>
              {heroes.length === 0 ? (
                <p className="font-pixel text-[8px] text-muted-foreground text-center py-8">
                  Aucun héros disponible
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {heroes.map(hero => (
                    <div
                      key={hero.id}
                      className={selectedIds?.has(hero.id) ? 'opacity-40 pointer-events-none' : ''}
                    >
                      <HeroCard
                        hero={hero}
                        compact
                        onClick={() => onSelect(hero)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HeroPickerBottomSheet;
