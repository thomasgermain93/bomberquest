# Mode Ascension — Design Document

**Version :** 0.1 (prototype)
**Statut :** Feature flag `ascension: false` — non livré en prod
**Issue :** #165

---

## Concept

Le Mode Ascension est un mode de jeu roguelite dans lequel le joueur gravit une tour de 10 étages, chaque palier ajoutant un nouveau modificateur et renforçant les ennemis. L'objectif est de monter le plus haut possible en une seule run, sans pouvoir recommencer depuis le milieu.

- Sessions courtes : 5 à 15 minutes
- Replayability élevée grâce à la combinaison aléatoire de modificateurs
- Récompenses en Universal Shards proportionnelles à l'étage atteint
- Record personnel affiché pour encourager l'amélioration

---

## Mécaniques

### Structure d'une run

1. Le joueur sélectionne son équipe (mêmes héros que Story Mode).
2. L'étage 1 démarre avec des ennemis de difficulté standard.
3. Chaque étage vaincu débloque l'étage suivant et applique **un nouveau modificateur**.
4. La run se termine si l'équipe est éliminée ou si le joueur abandonne.
5. Les récompenses sont attribuées selon l'étage **le plus haut atteint**.

### Scaling des ennemis par étage

| Etage | HP ennemis | Vitesse ennemis | Modificateur |
|-------|-----------|-----------------|--------------|
| 1     | x1.00     | x1.00           | Aucun        |
| 2     | x1.15     | x1.10           | Bombes double explosion   |
| 3     | x1.32     | x1.21           | Coffres aléatoires        |
| 4     | x1.52     | x1.33           | Ennemis régénèrent        |
| 5     | x1.75     | x1.46           | Bombes à timer court      |
| 6     | x2.01     | x1.61           | Obscurité partielle       |
| 7     | x2.31     | x1.77           | Ennemis posent des bombes |
| 8     | x2.66     | x1.95           | Coffres piégés            |
| 9     | x3.06     | x2.14           | Double vague d'ennemis    |
| 10    | x3.52     | x2.36           | Chaos total (tous mods)   |

Formule : HP_multiplicateur = 1.15^(étage - 1), Vitesse_multiplicateur = 1.10^(étage - 1)

---

## Modificateurs

Chaque étage (sauf le 1) ajoute un modificateur permanent pour le reste de la run.

| Id | Nom | Description |
|----|-----|-------------|
| `double_explosion` | Bombes double explosion | Chaque bombe déclenche 2 explosions successives (+0.5s entre les deux) |
| `random_chests` | Coffres aléatoires | Des coffres apparaissent à des positions aléatoires pendant le combat |
| `regen_enemies` | Ennemis régénèrent | Les ennemis récupèrent 2% de leurs HP max par seconde |
| `short_fuse` | Mèche courte | Le timer des bombes est réduit de 40% |
| `darkness` | Obscurité partielle | La visibilité autour de chaque héros est limitée à 3 tuiles |
| `bombing_enemies` | Ennemis poseurs | Les ennemis posent des bombes toutes les 5 secondes |
| `trapped_chests` | Coffres piégés | 50% des coffres déclenchent une explosion à l'ouverture |
| `double_wave` | Double vague | Deux vagues d'ennemis arrivent simultanément |
| `chaos` | Chaos total | Tous les modificateurs précédents sont actifs en même temps |

---

## Récompenses

Les Universal Shards sont attribuées selon l'étage le plus haut atteint. Les récompenses ne sont données qu'**une seule fois par run** (pas de farming par abandon).

| Etage atteint | Universal Shards |
|---------------|-----------------|
| 1             | 5               |
| 2             | 12              |
| 3             | 22              |
| 4             | 35              |
| 5             | 55              |
| 6             | 80              |
| 7             | 110             |
| 8             | 150             |
| 9             | 200             |
| 10            | 300             |

### Record personnel

- Le record de l'étage le plus haut atteint est affiché dans l'UI.
- Un badge "Conquérant Niveau X" est attribué selon le record.
- Le record est sauvegardé en localStorage + Supabase (colonne à ajouter : `ascension_best_floor`).

---

## KPIs cibles

| Indicateur | Cible |
|------------|-------|
| Durée session moyenne | 5 – 15 min |
| Taux de relance (run suivante) | > 60% |
| Etage moyen atteint (joueurs actifs) | 4 – 6 |
| Diversité builds utilisés | > 3 combinaisons héros fréquentes |

---

## Notes d'implémentation

- Les modificateurs s'appuient sur le système d'état existant dans `engine.ts` — prévoir un champ `ascensionModifiers: AscensionModifierId[]` dans `GameState`.
- Le scaling HP/vitesse se fait avant `spawnEnemy()` en multipliant les valeurs de base.
- La progression (étage courant, modificateurs actifs) est stockée localement pendant la run, pas en base de données (run non sauvegardable en cours).
- Feature flag : `GAME_MODE_FLAGS.ascension` doit être `true` pour activer le mode.
