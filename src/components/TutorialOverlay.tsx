import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { TutorialStep, TUTORIAL_STEPS } from '@/hooks/useTutorial';
import { overlayContent } from '@/lib/animations';

interface TutorialOverlayProps {
  step: TutorialStep | null;
  onAdvance: () => void;
  onSkip: () => void;
}

export default function TutorialOverlay({ step, onAdvance, onSkip }: TutorialOverlayProps) {
  if (!step) return null;

  const totalSteps = TUTORIAL_STEPS.length;
  const currentIdx = step.id;
  const progressPercent = ((currentIdx + 1) / totalSteps) * 100;
  const isLastStep = currentIdx === totalSteps - 1;

  const positionClasses =
    step.position === 'bottom'
      ? 'items-end pb-20'
      : 'items-center';

  return (
    <AnimatePresence mode="wait">
      <div
        key={step.id}
        className={`fixed inset-0 z-[60] pointer-events-none flex justify-center ${positionClasses}`}
      >
        <motion.div
          className="pointer-events-auto pixel-border bg-card p-6 max-w-sm w-full mx-4"
          variants={overlayContent}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Barre de progression pixel art */}
          <div className="w-full h-2 bg-muted mb-3 pixel-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Numero d'etape */}
          <p className="font-pixel text-[7px] text-muted-foreground mb-1">
            ETAPE {currentIdx + 1}/{totalSteps}
          </p>

          {/* Titre */}
          <h3 className="font-pixel text-[10px] text-foreground mb-2">
            {step.title}
          </h3>

          {/* Description */}
          <p className="font-pixel text-[8px] text-muted-foreground leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onSkip}
              className="pixel-btn pixel-btn-secondary font-pixel text-[7px] flex items-center gap-1 px-3 py-1.5"
            >
              <X size={10} />
              Passer
            </button>

            <button
              onClick={onAdvance}
              className="pixel-btn pixel-btn-gold font-pixel text-[7px] flex items-center gap-1 px-3 py-1.5"
            >
              {isLastStep ? 'Terminer' : 'Suivant'}
              <ChevronRight size={10} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
