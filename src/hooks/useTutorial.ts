import { useCallback } from 'react';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  targetTab?: string;
  position: 'center' | 'top' | 'bottom';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: 'Bienvenue dans BomberQuest !',
    description: 'Tu as recu ton premier heros. Explore le jeu et deviens le meilleur Bomber !',
    position: 'center',
  },
  {
    id: 1,
    title: 'Lance une Chasse au Tresor',
    description: "Clique sur l'onglet Combat pour envoyer tes heros explorer des cartes et gagner des BomberCoins.",
    targetTab: 'combat',
    position: 'bottom',
  },
  {
    id: 2,
    title: 'Invoque de nouveaux heros',
    description: "Utilise tes BomberCoins dans l'onglet Invoquer pour obtenir de nouveaux heros avec des raretes variees.",
    targetTab: 'summon',
    position: 'bottom',
  },
  {
    id: 3,
    title: 'Ameliore tes heros',
    description: "Dans l'onglet Heros, clique sur un heros pour le faire monter de niveau et augmenter ses stats.",
    targetTab: 'heroes',
    position: 'bottom',
  },
  {
    id: 4,
    title: 'Quetes journalieres',
    description: "Complete tes quetes journalieres pour gagner des recompenses bonus chaque jour.",
    position: 'center',
  },
  {
    id: 5,
    title: 'Tu es pret !',
    description: "Tu connais les bases. Explore le mode Histoire, la Forge et bien plus encore. Bonne aventure !",
    position: 'center',
  },
];

interface UseTutorialProps {
  tutorialStep: number | undefined;
  onAdvance: (nextStep: number | undefined) => void;
}

export function useTutorial({ tutorialStep, onAdvance }: UseTutorialProps) {
  const isActive = tutorialStep !== undefined && tutorialStep < TUTORIAL_STEPS.length;
  const currentStep = isActive ? TUTORIAL_STEPS[tutorialStep] : null;

  const advance = useCallback(() => {
    if (tutorialStep === undefined) return;
    const nextStep = tutorialStep + 1;
    if (nextStep >= TUTORIAL_STEPS.length) {
      onAdvance(undefined); // tutoriel termine
    } else {
      onAdvance(nextStep);
    }
  }, [tutorialStep, onAdvance]);

  const skip = useCallback(() => {
    onAdvance(undefined);
  }, [onAdvance]);

  return { isActive, currentStep, advance, skip };
}
