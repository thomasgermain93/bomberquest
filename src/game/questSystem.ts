export interface Quest {
  id: string;
  type: QuestType;
  label: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  emoji: string;
}

export type QuestType =
  | 'complete_maps'
  | 'open_chests'
  | 'earn_coins'
  | 'summon_heroes'
  | 'upgrade_hero'
  | 'destroy_blocks'
  | 'place_bombs';

export interface DailyQuestData {
  quests: Quest[];
  date: string; // YYYY-MM-DD
  allClaimedBonus: boolean;
}

const QUEST_TEMPLATES: {
  type: QuestType;
  label: string;
  emoji: string;
  variants: { description: string; target: number; reward: number; xp: number }[];
}[] = [
  {
    type: 'complete_maps', label: 'Explorateur', emoji: '🗺️',
    variants: [
      { description: 'Complète 1 carte Chasse au Trésor', target: 1, reward: 100, xp: 50 },
      { description: 'Complète 3 cartes Chasse au Trésor', target: 3, reward: 250, xp: 120 },
      { description: 'Complète 5 cartes Chasse au Trésor', target: 5, reward: 400, xp: 200 },
    ],
  },
  {
    type: 'open_chests', label: 'Chasseur de coffres', emoji: '📦',
    variants: [
      { description: 'Ouvre 10 coffres', target: 10, reward: 80, xp: 40 },
      { description: 'Ouvre 25 coffres', target: 25, reward: 150, xp: 80 },
      { description: 'Ouvre 50 coffres', target: 50, reward: 300, xp: 150 },
    ],
  },
  {
    type: 'earn_coins', label: 'Collecteur', emoji: '💰',
    variants: [
      { description: 'Gagne 500 BomberCoins', target: 500, reward: 100, xp: 50 },
      { description: 'Gagne 1500 BomberCoins', target: 1500, reward: 200, xp: 100 },
      { description: 'Gagne 3000 BomberCoins', target: 3000, reward: 350, xp: 160 },
    ],
  },
  {
    type: 'summon_heroes', label: 'Invocateur', emoji: '✨',
    variants: [
      { description: 'Invoque 1 héros', target: 1, reward: 120, xp: 60 },
      { description: 'Invoque 3 héros', target: 3, reward: 250, xp: 130 },
    ],
  },
  {
    type: 'upgrade_hero', label: 'Entraîneur', emoji: '⬆️',
    variants: [
      { description: 'Améliore 1 héros', target: 1, reward: 150, xp: 70 },
      { description: 'Améliore 2 héros', target: 2, reward: 280, xp: 130 },
    ],
  },
  {
    type: 'place_bombs', label: 'Bombardier', emoji: '💣',
    variants: [
      { description: 'Pose 50 bombes', target: 50, reward: 80, xp: 40 },
      { description: 'Pose 100 bombes', target: 100, reward: 150, xp: 80 },
      { description: 'Pose 200 bombes', target: 200, reward: 250, xp: 120 },
    ],
  },
];

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateDailyQuests(): DailyQuestData {
  const today = getTodayString();
  const rng = seededRandom(dateToSeed(today));

  // Pick 3 unique quest types
  const shuffled = [...QUEST_TEMPLATES].sort(() => rng() - 0.5);
  const picked = shuffled.slice(0, 3);

  const quests: Quest[] = picked.map((template, i) => {
    const variant = template.variants[Math.floor(rng() * template.variants.length)];
    return {
      id: `daily_${today}_${i}`,
      type: template.type,
      label: template.label,
      description: variant.description,
      target: variant.target,
      progress: 0,
      reward: variant.reward,
      xpReward: variant.xp,
      completed: false,
      claimed: false,
      emoji: template.emoji,
    };
  });

  return { quests, date: today, allClaimedBonus: false };
}

const QUEST_SAVE_KEY = 'bomberquest_daily_quests';

export function loadDailyQuests(): DailyQuestData {
  try {
    const saved = localStorage.getItem(QUEST_SAVE_KEY);
    if (saved) {
      const data: DailyQuestData = JSON.parse(saved);
      if (data.date === getTodayString()) return data;
    }
  } catch {}
  return generateDailyQuests();
}

export function saveDailyQuests(data: DailyQuestData): void {
  try {
    localStorage.setItem(QUEST_SAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function updateQuestProgress(
  quests: DailyQuestData,
  type: QuestType,
  amount: number = 1
): DailyQuestData {
  return {
    ...quests,
    quests: quests.quests.map(q => {
      if (q.type !== type || q.claimed) return q;
      const newProgress = Math.min(q.progress + amount, q.target);
      return { ...q, progress: newProgress, completed: newProgress >= q.target };
    }),
  };
}

export const ALL_CLAIMED_BONUS = 500;
export const ALL_CLAIMED_XP_BONUS = 200;
