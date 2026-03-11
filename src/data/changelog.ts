export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: {
    type: 'feature' | 'fix' | 'balance' | 'ui';
    description: string;
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'Unreleased',
    date: '2026-03-10',
    title: 'Mises à jour récentes',
    changes: [
      { type: 'feature', description: 'feat: bestiaire familles + bombers (MVP) (#47)' },
      { type: 'feature', description: 'Landing: section Chiffres clés + contraste bouton invité (#40)' },
      { type: 'feature', description: 'feat: brancher profiles Supabase côté runtime (issue #37) (#38)' },
      { type: 'feature', description: 'fix: simplifier la sélection de héros en mode story (issue #28) (#36)' },
      { type: 'feature', description: 'fix: rendre le menu de landing responsive sur mobile (issue #24) (#33)' },
      { type: 'feature', description: 'fix: afficher les BC disponibles dans la popup d\'invocation (issue #32) (#35)' },
      { type: 'feature', description: 'fix: supprimer la barre de progression coffre superposée (issue #27) (#34)' },
      { type: 'feature', description: 'Fusion de Bombers (#25)' },
      { type: 'ui', description: 'Amélioration de l\'UI pour mobile (#10)' },
      { type: 'feature', description: 'fix: bouton vitesse unique cyclique x1/x2/x3 (#23)' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-03-10',
    title: 'Mise à jour Wiki & Documentation',
    changes: [
      { type: 'feature', description: 'Ajout d\'une page Wiki complète avec référence des héros, cartes et ressources.' },
      { type: 'feature', description: 'Ajout d\'un glossaire interactif pour tous les termes du jeu.' },
      { type: 'feature', description: 'Ajout d\'une page Changelog pour suivre l\'évolution du jeu.' },
      { type: 'ui', description: 'Refonte de la navigation avec accès rapide au Wiki et aux Guides.' },
    ],
  },
  {
    version: '1.4.2',
    date: '2026-02-20',
    title: 'Corrections & Équilibrage',
    changes: [
      { type: 'fix', description: 'Correction d\'un bug où les bombes posées par les héros disparaissaient lors d\'un changement de carte.' },
      { type: 'fix', description: 'Correction du compteur de pity qui se réinitialisait incorrectement après une invocation épique.' },
      { type: 'balance', description: 'Réduction du coût en stamina de la compétence passive des héros de rareté Super Rare.' },
      { type: 'fix', description: 'Correction de l\'affichage des statistiques dans l\'écran de récapitulatif post-combat.' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-05',
    title: 'Mode Histoire — Région 5 : Enfer Ardent',
    changes: [
      { type: 'feature', description: 'Ajout de la 5ème région "Enfer Ardent" avec 5 nouvelles étapes et un boss inédit.' },
      { type: 'feature', description: 'Nouveau boss : Démogorgon — avec 4 phases d\'attaque incluant une pluie de bombes volcanique.' },
      { type: 'feature', description: 'Ajout du type d\'ennemi "Démon" avec des capacités de téléportation.' },
      { type: 'balance', description: 'Augmentation des récompenses en cristaux pour les régions 3 et 4.' },
      { type: 'ui', description: 'Nouvel écran de victoire animé pour la complétion de région.' },
    ],
  },
  {
    version: '1.3.1',
    date: '2026-01-18',
    title: 'Correctifs Gacha',
    changes: [
      { type: 'fix', description: 'Correction d\'un bug critique où le compteur de pity Legend pouvait dépasser 200 sans déclencher la garantie.' },
      { type: 'fix', description: 'Correction de l\'affichage du taux de rareté dans l\'interface d\'invocation.' },
      { type: 'balance', description: 'Légère augmentation du taux de base des héros Epic (0.8% → 1.0%).' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-01-10',
    title: 'Système de Quêtes Journalières',
    changes: [
      { type: 'feature', description: 'Ajout de 3 quêtes journalières renouvelées chaque jour à minuit (UTC+1).' },
      { type: 'feature', description: 'Les quêtes récompensent en gemmes, stamina et potions d\'EXP.' },
      { type: 'feature', description: 'Nouveau panneau de quêtes accessible depuis le hub principal.' },
      { type: 'ui', description: 'Indicateur de notification pour les quêtes disponibles sur l\'icône du menu.' },
    ],
  },
  {
    version: '1.2.0',
    date: '2025-12-20',
    title: 'Système d\'Ascension des Héros',
    changes: [
      { type: 'feature', description: 'Les héros peuvent désormais être ascensionnés après avoir atteint le niveau maximum.' },
      { type: 'feature', description: 'L\'ascension débloque de nouvelles capacités passives et augmente les statistiques de base.' },
      { type: 'feature', description: 'Ajout de matériaux d\'ascension obtenables dans le Mode Histoire.' },
      { type: 'balance', description: 'Révision des seuils de niveau maximum par rareté.' },
      { type: 'ui', description: 'Nouvelle interface de fiche héros avec prévisualisation des statistiques après ascension.' },
    ],
  },
  {
    version: '1.1.0',
    date: '2025-12-01',
    title: 'Sauvegardes Cloud & Authentification',
    changes: [
      { type: 'feature', description: 'Ajout de la sauvegarde cloud via Supabase — tes données sont synchronisées sur tous tes appareils.' },
      { type: 'feature', description: 'Connexion par email/mot de passe et via Google OAuth.' },
      { type: 'feature', description: 'Système de sauvegarde hybride : localStorage pour le jeu hors connexion, Supabase pour la synchro.' },
      { type: 'fix', description: 'Correction d\'une perte de données lors d\'un rechargement rapide de la page.' },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-11-15',
    title: 'Lancement de BomberQuest !',
    changes: [
      { type: 'feature', description: 'Sortie officielle de BomberQuest — Idle Bomber RPG pixel art !' },
      { type: 'feature', description: 'Mode Chasse au Trésor : cartes procédurales avec 4 niveaux de difficulté.' },
      { type: 'feature', description: 'Mode Histoire : 4 régions initiales avec 20 étapes et 4 boss.' },
      { type: 'feature', description: 'Système de gacha avec 6 raretés et compteurs de pity garantis.' },
      { type: 'feature', description: 'Rendu canvas pixel art avec des sprites générés de façon procédurale.' },
      { type: 'feature', description: 'Effets sonores chiptune via Web Audio API.' },
    ],
  },
];
