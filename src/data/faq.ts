export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Comment démarrer une partie ?',
    answer: 'Crée un compte gratuit ou joue directement en invité. Tes données seront sauvegardées si tu crées un compte — tu peux migrer une sauvegarde invité vers un compte à tout moment.',
  },
  {
    question: 'C\'est quoi le mode Idle ?',
    answer: 'Tes héros combattent automatiquement même quand tu n\'es pas connecté. Plus tes héros sont puissants, plus tu accumules des récompenses en ton absence.',
  },
  {
    question: 'Comment obtenir des héros rares ?',
    answer: 'Via le système d\'invocation (gacha) : utilise des gemmes pour tenter d\'obtenir des héros de haute rareté (Super Rare, Epic, Legend, Super Legend). Les taux d\'invocation sont affichés avant chaque tirage.',
  },
  {
    question: 'Les 5 régions, c\'est quoi ?',
    answer: 'Forêt Enchantée, Cavernes Maudites, Ruines Anciennes, Forteresse Orc et Enfer Ardent. Chaque région contient 5 étapes + un boss final avec des patterns uniques.',
  },
  {
    question: 'La progression est-elle sauvegardée ?',
    answer: 'Oui, la progression est sauvegardée en temps réel sur nos serveurs pour les comptes inscrits. Les invités ont une sauvegarde locale dans le navigateur.',
  },
  {
    question: 'Le jeu est-il gratuit ?',
    answer: 'Totalement. BomberQuest est free-to-play sans pay-to-win — toutes les fonctionnalités sont accessibles gratuitement.',
  },
];
