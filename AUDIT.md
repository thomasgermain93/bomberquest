# Audit Complet — BomberQuest

> Date : 2026-03-20
> Scope : tout le code source (`src/`)

---

## Résumé

6 milestones identifiés, 28 issues au total, classées par priorité.

| # | Milestone | Issues | Priorité |
|---|-----------|--------|----------|
| 1 | Bugs critiques & correctifs urgents | 6 | CRITIQUE |
| 2 | Sécurité des types (Type Safety) | 5 | HAUTE |
| 3 | Code mort & nettoyage | 4 | MOYENNE |
| 4 | Performance | 4 | MOYENNE |
| 5 | Qualité & maintenabilité du code | 5 | MOYENNE |
| 6 | Tests & couverture | 4 | BASSE |

---

## Milestone 1 — Bugs critiques & correctifs urgents

### Issue 1.1 : Bug de pathfinding A* — performance O(n log n) par itération
**Fichier :** `src/game/engine.ts`
**Sévérité :** CRITIQUE

`openSet.sort()` est appelé à chaque itération de la boucle while dans `findPath()`. Avec une priority queue (min-heap), la complexité passe de O(n log n) à O(log n) par insertion/extraction. Pour les grandes maps, la différence est significative.

De plus, `openSet.find()` effectue une recherche linéaire O(n) à chaque voisin au lieu d'un lookup O(1) via un Set ou Map.

**Correction :** Implémenter une priority queue (min-heap) et utiliser un `Map<string, number>` pour les lookups de coûts.

---

### Issue 1.2 : Race condition dans le chargement cloud (Index.tsx)
**Fichier :** `src/pages/Index.tsx`
**Sévérité :** CRITIQUE

Le `useEffect` de chargement cloud (lignes ~264-324) n'a pas de mécanisme d'annulation. Si `cloudSessionReady` change rapidement, plusieurs appels `loadWithRetry()` peuvent s'exécuter en parallèle, et une ancienne réponse peut écraser des données plus récentes.

**Correction :** Ajouter un `AbortController` ou un flag `isCancelled` dans le cleanup du useEffect.

---

### Issue 1.3 : Stale closure avec Set dans useCallback (Index.tsx)
**Fichier :** `src/pages/Index.tsx`
**Sévérité :** HAUTE

`collectAndContinue` dépend de `selectedHeroes` (un `Set`). Comme un `Set` est recréé à chaque render, la référence change constamment, ce qui peut causer des re-renders infinis ou des mises à jour manquées.

**Correction :** Convertir le `Set` en tableau trié pour la dépendance, ou utiliser `useRef` pour stocker le Set.

---

### Issue 1.4 : Algorithme de shuffle biaisé (summoning.ts, questSystem.ts)
**Fichiers :** `src/game/summoning.ts`, `src/game/questSystem.ts`
**Sévérité :** HAUTE

`.sort(() => Math.random() - 0.5)` produit un shuffle non-uniforme (biais statistique). Pour un système de gacha, c'est particulièrement problématique car ça affecte l'équité des tirages.

**Correction :** Remplacer par un algorithme Fisher-Yates :
```typescript
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

---

### Issue 1.5 : Race condition dans use-toast.ts — listeners dupliqués
**Fichier :** `src/hooks/use-toast.ts`
**Sévérité :** HAUTE

Le `useEffect` dépend de `[state]` au lieu de `[]`. À chaque changement de state, un nouveau listener est ajouté puis l'ancien retiré. Mais comme `setState` change d'identité entre les renders, `indexOf` peut échouer, causant une accumulation de listeners et des re-renders exponentiels.

**Correction :** Changer la dépendance du useEffect de `[state]` à `[]`.

---

### Issue 1.6 : Dépendance manquante dans useEffect auto-farm (Index.tsx)
**Fichier :** `src/pages/Index.tsx`
**Sévérité :** MOYENNE

Le useEffect d'auto-farm vérifie `gameState?.isStoryMode` dans sa condition mais ne l'inclut pas dans le tableau de dépendances. Si le mode change pendant l'auto-farm, le timer ne sera pas nettoyé correctement.

**Correction :** Ajouter `gameState?.isStoryMode` au tableau de dépendances.

---

## Milestone 2 — Sécurité des types (Type Safety)

### Issue 2.1 : Casts `as any` dans engine.ts pour le mode Story
**Fichier :** `src/game/engine.ts`
**Sévérité :** HAUTE

Plusieurs `(state.boss as any).hp` aux lignes ~665, 693, 702. Le type `GameState` utilise `boss?: any | null` au lieu d'un type propre.

**Correction :** Importer `Boss` depuis `storyTypes.ts` et typer correctement `boss` dans `GameState`. Créer un type guard `isBossAlive(boss)`.

---

### Issue 2.2 : Types `any` dans les champs Story de GameState (types.ts)
**Fichier :** `src/game/types.ts`
**Sévérité :** HAUTE

`enemies?: any[]` et `boss?: any | null` (lignes ~120-121) contournent la vérification TypeScript. Les types existent dans `storyTypes.ts` mais ne sont pas utilisés.

**Correction :** Remplacer par les types importés de `storyTypes.ts` :
```typescript
enemies?: StoryEnemy[];
boss?: Boss | null;
```

---

### Issue 2.3 : Casts `as any` dans useCloudSave.ts
**Fichier :** `src/hooks/useCloudSave.ts`
**Sévérité :** HAUTE

- `hero.stats as any` et `hero.skills as any` dans `heroToRow()`
- `(row as any).progression_stats` dans `rowToHero()`
- `as unknown as StoryProgress` double cast

**Correction :** Créer des interfaces TypeScript pour les types de lignes de base de données (`PlayerHeroRow`, `PlayerSaveRow`) et mapper explicitement les champs.

---

### Issue 2.4 : Cast `as any` du client Supabase dans useLeaderboard.ts
**Fichier :** `src/hooks/useLeaderboard.ts`
**Sévérité :** MOYENNE

`(supabase as any).rpc(...)` contourne le typage du SDK Supabase.

**Correction :** Utiliser le typage natif du SDK Supabase pour les appels RPC, ou étendre les types générés.

---

### Issue 2.5 : Cast unsafe dans ProfileContext.tsx
**Fichier :** `src/contexts/ProfileContext.tsx`
**Sévérité :** MOYENNE

`user.user_metadata?.full_name as string | undefined` est un cast unsafe. Si `full_name` n'est pas une string, `.trim()` crashera.

**Correction :** Utiliser un type guard :
```typescript
const fallbackName = typeof user.user_metadata?.full_name === 'string'
  ? user.user_metadata.full_name.trim()
  : null;
```

---

## Milestone 3 — Code mort & nettoyage

### Issue 3.1 : Hook `usePixelMotion` exporté mais jamais utilisé
**Fichier :** `src/lib/animations.ts`
**Sévérité :** BASSE

`usePixelMotion()` est exporté mais aucun import trouvé dans le codebase.

**Correction :** Supprimer le hook ou l'intégrer là où des animations respectent `prefers-reduced-motion`.

---

### Issue 3.2 : Variables CSS non utilisées dans index.css
**Fichier :** `src/index.css`
**Sévérité :** BASSE

Plusieurs variables CSS définies mais jamais référencées : `--game-energy-low`, `--game-xp-blue`, variables `--sidebar-*`.

**Correction :** Auditer chaque variable et supprimer celles qui ne sont pas utilisées.

---

### Issue 3.3 : Hook `use-mobile.ts` référencé dans CLAUDE.md mais absent
**Fichier :** CLAUDE.md / `src/hooks/`
**Sévérité :** BASSE

CLAUDE.md référence un hook `use-mobile.ts` qui n'existe pas dans le codebase et n'est importé nulle part.

**Correction :** Supprimer la référence de CLAUDE.md ou créer le hook s'il est nécessaire.

---

### Issue 3.4 : `farmStats` calculé mais jamais affiché (Index.tsx)
**Fichier :** `src/pages/Index.tsx`
**Sévérité :** BASSE

Le state `farmStats` est mis à jour mais n'apparaît jamais dans le rendu UI.

**Correction :** Soit afficher les stats de farm dans l'UI, soit supprimer le state inutile.

---

## Milestone 4 — Performance

### Issue 4.1 : `findNearestTarget` trop complexe (137 lignes)
**Fichier :** `src/game/engine.ts`
**Sévérité :** MOYENNE

La fonction `findNearestTarget` fait 137 lignes avec de la logique dupliquée pour la priorisation des ennemis en mode Story (apparaît aussi aux lignes ~693-705).

**Correction :** Extraire en fonctions helper (`prioritizeEnemyTargets`, `findNearestChest`, etc.) et factoriser la logique dupliquée.

---

### Issue 4.2 : Double filtrage dans HeroPickerModal
**Fichier :** `src/components/HeroPickerModal.tsx`
**Sévérité :** MOYENNE

`getEligibility(h)` est appelée deux fois par héros (une fois pour `eligibleHeroes`, une fois pour `ineligibleHeroes`). Manque un `useMemo`.

**Correction :** Calculer l'éligibilité une seule fois par héros et partitionner le résultat :
```typescript
const { eligible, ineligible } = useMemo(() => {
  const eligible = [];
  const ineligible = [];
  for (const h of heroes) {
    (getEligibility(h).isEligible ? eligible : ineligible).push(h);
  }
  return { eligible, ineligible };
}, [heroes]);
```

---

### Issue 4.3 : Logique de bonus clan dupliquée dans engine.ts
**Fichier :** `src/game/engine.ts`
**Sévérité :** MOYENNE

La logique de calcul du bonus de pièces des clan skills apparaît trois fois (lignes ~427-432, ~582-586, ~604-610).

**Correction :** Extraire en une fonction `getClanCoinBonus(family, clanSkills)`.

---

### Issue 4.4 : Itérations achievement à chaque frame
**Fichiers :** `src/game/achievements.ts`
**Sévérité :** BASSE

`getInProgressAchievements` et `getLockedAchievements` itèrent l'intégralité du tableau ACHIEVEMENTS à chaque appel. Si appelés à chaque frame, c'est du O(n) inutile.

**Correction :** Mettre en cache les résultats avec `useMemo` côté composant, ou ajouter un flag dirty pour invalider le cache.

---

## Milestone 5 — Qualité & maintenabilité du code

### Issue 5.1 : Nombres magiques éparpillés dans tout le code
**Fichiers :** `src/game/engine.ts`, `src/game/enemyAI.ts`, `src/game/summoning.ts`, `src/game/upgradeSystem.ts`
**Sévérité :** MOYENNE

Exemples :
- `0.5` pour le seuil de stamina (engine.ts, apparaît plusieurs fois)
- `1 + Math.random() * 2` pour le timer de déplacement ennemi (enemyAI.ts)
- `0.02` pour le seuil de snap-to-grid (enemyAI.ts)
- `0.9` et `0.2` pour la variance de stats (summoning.ts)
- `2` pour la distance de spawn (enemyAI.ts)

**Correction :** Extraire en constantes nommées dans un bloc `const` en haut de chaque fichier.

---

### Issue 5.2 : Rendu ennemi/héros monolithique (140+ lignes par type)
**Fichiers :** `src/game/heroRenderer.ts`, `src/game/enemyRenderer.ts`
**Sévérité :** MOYENNE

- `heroRenderer.ts` : 60+ lignes de rendu de casque avec 5 formes différentes dans un seul bloc
- `enemyRenderer.ts` : 140+ lignes avec 5 types d'ennemis dans une seule fonction
- Couleur `#FF0` codée en dur à trois endroits dans enemyRenderer

**Correction :** Extraire une fonction de rendu par type d'ennemi/forme de casque. Centraliser les constantes de couleur.

---

### Issue 5.3 : Logique de respawn dupliquée dans enemyAI.ts
**Fichier :** `src/game/enemyAI.ts`
**Sévérité :** BASSE

La logique de respawn vers la case floor la plus proche apparaît deux fois (lignes ~102-109 et ~180-196) avec des variations mineures.

**Correction :** Extraire en une fonction `findNearestFloorTile(position, map)`.

---

### Issue 5.4 : Texte anglais dans une UI française (NotFound.tsx)
**Fichier :** `src/pages/NotFound.tsx`
**Sévérité :** BASSE

Le texte "Oops! Page not found" et "Return to Home" sont en anglais alors que toute l'app est en français.

**Correction :** Traduire : "Oups ! Page non trouvée" et "Retour à l'accueil".

---

### Issue 5.5 : Typos dans les titres d'achievements
**Fichier :** `src/game/achievements.ts`
**Sévérité :** BASSE

- "InvocateurEXPERT" → "Invocateur EXPERT" (espace manquant)
- "CollectionneurEXPERT" → "Collectionneur EXPERT" (espace manquant)
- "ExplorateurLvL" → casse incohérente

**Correction :** Ajouter les espaces manquants et uniformiser la casse.

---

## Milestone 6 — Tests & couverture

### Issue 6.1 : Aucun test pour les hooks critiques
**Fichiers concernés :** `src/hooks/useCloudSave.ts`, `src/hooks/useKpis.ts`, `src/contexts/AuthContext.tsx`, `src/contexts/ProfileContext.tsx`
**Sévérité :** HAUTE

Les hooks les plus critiques (sauvegarde cloud, KPIs, auth, profil) n'ont aucun test.

**Correction :** Ajouter des tests pour :
- Race conditions de cloud save
- Gestion de timeout/retry des KPIs
- Transitions d'état auth (login/logout/recovery)
- Validation et détection de conflits de display name

---

### Issue 6.2 : Tests existants incomplets
**Fichier :** `src/test/`
**Sévérité :** MOYENNE

- `example.test.ts` : test placeholder trivial
- `saveSystem.test.ts` : teste uniquement les données par défaut, pas la persistance
- Pas de mock Supabase dans les tests qui en ont besoin

**Correction :** Compléter les tests existants et ajouter des mocks Supabase via `vi.mock()`.

---

### Issue 6.3 : Aucun test pour le système de gacha (summoning.ts)
**Fichier :** `src/game/summoning.ts`
**Sévérité :** MOYENNE

Le système de gacha avec ses pity counters est critique pour l'équité du jeu mais n'a aucun test automatisé.

**Correction :** Ajouter des tests pour :
- Distribution des raretés
- Déclenchement des pity à 10/30/50/200
- Reset des compteurs après un tirage garanti
- Vérification que les pity counters sont bien persistés

---

### Issue 6.4 : Aucun test pour l'IA ennemie (enemyAI.ts)
**Fichier :** `src/game/enemyAI.ts`
**Sévérité :** BASSE

L'IA des ennemis et boss n'est pas testée. Les patterns de boss (charge, summon, invincibility, bomb-rain) pourraient régresser silencieusement.

**Correction :** Ajouter des tests unitaires pour chaque pattern de boss et le comportement de base des ennemis.

---

## Règles ESLint à renforcer

Le fichier `eslint.config.js` utilise `"warn"` pour toutes les règles. Les règles suivantes devraient être passées en `"error"` :
- `@typescript-eslint/no-unused-vars`
- `@typescript-eslint/no-explicit-any`
- `prefer-const`

---

## Erreurs de gestion manquantes

| Fichier | Ligne | Problème |
|---------|-------|----------|
| `saveSystem.ts` | ~42-43 | `catch` vide qui avale les erreurs |
| `saveSystem.ts` | ~107 | `catch` vide dans `loadStoryProgress` |
| `useCloudSave.ts` | ~169-189 | Pas de catch pour les erreurs Supabase dans le timer de save |
| `ProfileContext.tsx` | ~49-96 | Erreur finale de retry jamais loggée |
| `useKpis.ts` | ~50-52 | Pas de vérification NaN/Infinity dans le formatage |
