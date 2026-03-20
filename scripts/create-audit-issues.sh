#!/usr/bin/env bash
# =============================================================================
# Script de création des milestones et issues GitHub pour l'audit BomberQuest
# Usage : GITHUB_TOKEN=ghp_xxx ./scripts/create-audit-issues.sh
#    ou : gh auth login  puis  ./scripts/create-audit-issues.sh
# =============================================================================
set -euo pipefail

REPO="thomasgermain93/bomberquest"

# --- Auth check ---
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  USE_GH=true
  echo "✓ Authentifié via gh CLI"
elif [ -n "${GITHUB_TOKEN:-}" ]; then
  USE_GH=false
  echo "✓ Authentifié via GITHUB_TOKEN"
else
  echo "❌ Pas d'authentification GitHub trouvée."
  echo "   Option 1 : gh auth login"
  echo "   Option 2 : export GITHUB_TOKEN=ghp_..."
  exit 1
fi

api() {
  local method="$1" endpoint="$2"
  shift 2
  if [ "$USE_GH" = true ]; then
    gh api -X "$method" "$endpoint" "$@"
  else
    curl -sf -X "$method" \
      -H "Authorization: Bearer $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com$endpoint" "$@"
  fi
}

create_milestone() {
  local title="$1" description="$2"
  echo "  ➕ Milestone: $title"
  local id
  id=$(api POST "/repos/$REPO/milestones" \
    -f title="$title" \
    -f description="$description" \
    --jq '.number' 2>/dev/null || true)
  if [ -z "$id" ]; then
    # Milestone might already exist
    id=$(api GET "/repos/$REPO/milestones?state=open&per_page=100" \
      --jq ".[] | select(.title == \"$title\") | .number" 2>/dev/null || true)
  fi
  echo "$id"
}

create_issue() {
  local title="$1" body="$2" milestone="$3" labels="$4"
  echo "  📝 Issue: $title"
  api POST "/repos/$REPO/issues" \
    -f title="$title" \
    -f body="$body" \
    -f milestone="$milestone" \
    -f "labels[]=$labels" \
    --jq '.number' 2>/dev/null || echo "(erreur)"
}

# --- Labels ---
echo ""
echo "=== Création des labels ==="
for label_info in "bug:d73a4a" "type-safety:1d76db" "dead-code:e4e669" "performance:f9d0c4" "code-quality:c5def5" "tests:0e8a16" "critical:b60205"; do
  name="${label_info%%:*}"
  color="${label_info##*:}"
  echo "  🏷️  Label: $name"
  api POST "/repos/$REPO/labels" \
    -f name="$name" -f color="$color" --silent 2>/dev/null || true
done

# ===========================================================================
# MILESTONE 1 : Bugs critiques
# ===========================================================================
echo ""
echo "=== Milestone 1 : Bugs critiques & correctifs urgents ==="
M1=$(create_milestone \
  "M1 — Bugs critiques & correctifs urgents" \
  "Corriger les bugs critiques identifiés lors de l'audit : pathfinding, race conditions, algorithmes biaisés.")

create_issue \
  "Bug: Pathfinding A* avec sort() O(n log n) par itération" \
  "## Problème
\`openSet.sort()\` dans \`findPath()\` (engine.ts) est appelé à chaque itération → O(n log n) au lieu de O(log n) avec un min-heap.
\`openSet.find()\` fait une recherche linéaire O(n) au lieu d'un lookup O(1).

## Fichier
\`src/game/engine.ts\`

## Correction proposée
- Implémenter une priority queue (min-heap)
- Utiliser un \`Map<string, number>\` pour les lookups de coûts

## Impact
Performance dégradée sur les grandes maps, potentiels freezes/lag." \
  "$M1" "bug"

create_issue \
  "Bug: Race condition dans le chargement cloud (Index.tsx)" \
  "## Problème
Le \`useEffect\` de chargement cloud n'a pas de mécanisme d'annulation. Si \`cloudSessionReady\` change rapidement, plusieurs appels \`loadWithRetry()\` peuvent s'exécuter en parallèle et une ancienne réponse peut écraser des données plus récentes.

## Fichier
\`src/pages/Index.tsx\` (lignes ~264-324)

## Correction proposée
Ajouter un \`AbortController\` ou un flag \`isCancelled\` dans le cleanup du useEffect.

## Impact
Données de sauvegarde potentiellement corrompues ou écrasées." \
  "$M1" "critical"

create_issue \
  "Bug: Stale closure avec Set dans useCallback (Index.tsx)" \
  "## Problème
\`collectAndContinue\` dépend de \`selectedHeroes\` (un \`Set\`). Comme un \`Set\` est recréé à chaque render, la référence change constamment → re-renders infinis ou mises à jour manquées.

## Fichier
\`src/pages/Index.tsx\` (ligne ~773)

## Correction proposée
Convertir en tableau trié pour la dépendance, ou utiliser \`useRef\` pour stocker le Set." \
  "$M1" "bug"

create_issue \
  "Bug: Algorithme de shuffle biaisé (summoning.ts, questSystem.ts)" \
  "## Problème
\`.sort(() => Math.random() - 0.5)\` produit un shuffle non-uniforme (biais statistique). Critique pour le système de gacha.

## Fichiers
- \`src/game/summoning.ts\`
- \`src/game/questSystem.ts\`

## Correction proposée
Remplacer par Fisher-Yates shuffle :
\`\`\`typescript
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
\`\`\`" \
  "$M1" "bug"

create_issue \
  "Bug: Race condition use-toast.ts — listeners dupliqués" \
  "## Problème
Le \`useEffect\` dépend de \`[state]\` au lieu de \`[]\`. À chaque changement de state, un nouveau listener est ajouté. \`indexOf\` peut échouer car \`setState\` change d'identité → accumulation de listeners, re-renders exponentiels.

## Fichier
\`src/hooks/use-toast.ts\` (ligne ~177)

## Correction proposée
Changer la dépendance du \`useEffect\` de \`[state]\` à \`[]\`." \
  "$M1" "bug"

create_issue \
  "Bug: Dépendance manquante useEffect auto-farm (Index.tsx)" \
  "## Problème
Le useEffect d'auto-farm vérifie \`gameState?.isStoryMode\` mais ne l'inclut pas dans le tableau de dépendances.

## Fichier
\`src/pages/Index.tsx\` (ligne ~779)

## Correction proposée
Ajouter \`gameState?.isStoryMode\` au tableau de dépendances." \
  "$M1" "bug"

# ===========================================================================
# MILESTONE 2 : Type Safety
# ===========================================================================
echo ""
echo "=== Milestone 2 : Sécurité des types ==="
M2=$(create_milestone \
  "M2 — Sécurité des types (Type Safety)" \
  "Éliminer les casts \`as any\` et renforcer le typage TypeScript dans tout le codebase.")

create_issue \
  "Type: Remplacer les casts \`as any\` pour boss dans engine.ts" \
  "## Problème
Plusieurs \`(state.boss as any).hp\` dans engine.ts (lignes ~665, 693, 702).

## Correction proposée
- Importer \`Boss\` depuis \`storyTypes.ts\`
- Typer correctement \`boss\` dans \`GameState\`
- Créer un type guard \`isBossAlive(boss: Boss | null): boss is Boss\`" \
  "$M2" "type-safety"

create_issue \
  "Type: Remplacer les types \`any\` dans GameState (types.ts)" \
  "## Problème
\`enemies?: any[]\` et \`boss?: any | null\` dans \`GameState\` contournent TypeScript.

## Fichier
\`src/game/types.ts\` (lignes ~120-121)

## Correction proposée
\`\`\`typescript
import { StoryEnemy, Boss } from './storyTypes';
// ...
enemies?: StoryEnemy[];
boss?: Boss | null;
\`\`\`" \
  "$M2" "type-safety"

create_issue \
  "Type: Éliminer les casts \`as any\` dans useCloudSave.ts" \
  "## Problème
- \`hero.stats as any\` / \`hero.skills as any\` dans \`heroToRow()\`
- \`(row as any).progression_stats\` dans \`rowToHero()\`
- \`as unknown as StoryProgress\` double cast

## Correction proposée
Créer des interfaces TypeScript pour \`PlayerHeroRow\` et \`PlayerSaveRow\` et mapper explicitement les champs." \
  "$M2" "type-safety"

create_issue \
  "Type: Cast \`as any\` du client Supabase dans useLeaderboard.ts" \
  "## Problème
\`(supabase as any).rpc(...)\` contourne le typage du SDK.

## Correction proposée
Utiliser le typage natif du SDK Supabase ou étendre les types générés." \
  "$M2" "type-safety"

create_issue \
  "Type: Cast unsafe de full_name dans ProfileContext.tsx" \
  "## Problème
\`user.user_metadata?.full_name as string | undefined\` — si ce n'est pas une string, \`.trim()\` crashera.

## Correction proposée
\`\`\`typescript
const fallbackName = typeof user.user_metadata?.full_name === 'string'
  ? user.user_metadata.full_name.trim()
  : null;
\`\`\`" \
  "$M2" "type-safety"

# ===========================================================================
# MILESTONE 3 : Code mort
# ===========================================================================
echo ""
echo "=== Milestone 3 : Code mort & nettoyage ==="
M3=$(create_milestone \
  "M3 — Code mort & nettoyage" \
  "Supprimer le code mort, les exports inutilisés, les variables CSS orphelines et les références obsolètes.")

create_issue \
  "Cleanup: Supprimer le hook usePixelMotion inutilisé" \
  "## Problème
\`usePixelMotion()\` dans \`src/lib/animations.ts\` est exporté mais jamais importé.

## Correction proposée
Supprimer le hook ou l'intégrer là où \`prefers-reduced-motion\` doit être respecté." \
  "$M3" "dead-code"

create_issue \
  "Cleanup: Supprimer les variables CSS non utilisées (index.css)" \
  "## Problème
Variables CSS non référencées : \`--game-energy-low\`, \`--game-xp-blue\`, variables \`--sidebar-*\`.

## Correction proposée
Auditer chaque variable et supprimer celles sans référence." \
  "$M3" "dead-code"

create_issue \
  "Cleanup: Corriger la référence use-mobile.ts dans CLAUDE.md" \
  "## Problème
CLAUDE.md référence \`use-mobile.ts\` qui n'existe pas et n'est importé nulle part.

## Correction proposée
Supprimer la référence de CLAUDE.md." \
  "$M3" "dead-code"

create_issue \
  "Cleanup: Supprimer ou afficher farmStats (Index.tsx)" \
  "## Problème
Le state \`farmStats\` est mis à jour mais n'apparaît jamais dans l'UI.

## Correction proposée
Soit afficher les stats de farm, soit supprimer le state inutile." \
  "$M3" "dead-code"

# ===========================================================================
# MILESTONE 4 : Performance
# ===========================================================================
echo ""
echo "=== Milestone 4 : Performance ==="
M4=$(create_milestone \
  "M4 — Performance" \
  "Optimiser les chemins critiques : pathfinding, rendu, calculs de filtrage.")

create_issue \
  "Perf: Refactorer findNearestTarget (137 lignes, logique dupliquée)" \
  "## Problème
\`findNearestTarget\` dans engine.ts fait 137 lignes avec de la logique dupliquée pour la priorisation des ennemis.

## Correction proposée
Extraire en fonctions helper : \`prioritizeEnemyTargets\`, \`findNearestChest\`, etc." \
  "$M4" "performance"

create_issue \
  "Perf: Double filtrage dans HeroPickerModal" \
  "## Problème
\`getEligibility(h)\` est appelée 2x par héros (eligible + ineligible). Manque \`useMemo\`.

## Correction proposée
Calculer une seule fois et partitionner le résultat avec \`useMemo\`." \
  "$M4" "performance"

create_issue \
  "Perf: Logique de bonus clan dupliquée 3x dans engine.ts" \
  "## Problème
Calcul du bonus de pièces des clan skills copié 3 fois (lignes ~427, ~582, ~604).

## Correction proposée
Extraire en fonction \`getClanCoinBonus(family, clanSkills)\`." \
  "$M4" "performance"

create_issue \
  "Perf: Itérations achievements potentiellement à chaque frame" \
  "## Problème
\`getInProgressAchievements\` et \`getLockedAchievements\` itèrent tout le tableau ACHIEVEMENTS à chaque appel.

## Correction proposée
Cacher avec \`useMemo\` côté composant ou ajouter un mécanisme de cache avec invalidation." \
  "$M4" "performance"

# ===========================================================================
# MILESTONE 5 : Qualité
# ===========================================================================
echo ""
echo "=== Milestone 5 : Qualité & maintenabilité ==="
M5=$(create_milestone \
  "M5 — Qualité & maintenabilité du code" \
  "Améliorer la lisibilité, réduire la duplication, extraire des constantes nommées.")

create_issue \
  "Quality: Extraire les nombres magiques en constantes nommées" \
  "## Problème
Nombres magiques éparpillés dans le code game :
- \`0.5\` seuil stamina (engine.ts)
- \`1 + Math.random() * 2\` timer ennemi (enemyAI.ts)
- \`0.02\` seuil snap-to-grid (enemyAI.ts)
- \`0.9\` / \`0.2\` variance stats (summoning.ts)

## Correction proposée
Créer des constantes nommées en haut de chaque fichier." \
  "$M5" "code-quality"

create_issue \
  "Quality: Refactorer le rendu ennemi/héros (fonctions monolithiques)" \
  "## Problème
- heroRenderer.ts : 60+ lignes de rendu casque avec 5 formes dans un bloc
- enemyRenderer.ts : 140+ lignes avec 5 types d'ennemis
- Couleur \`#FF0\` codée en dur 3 fois dans enemyRenderer

## Correction proposée
Une fonction de rendu par type. Constantes de couleur centralisées." \
  "$M5" "code-quality"

create_issue \
  "Quality: Extraire la logique de respawn dupliquée (enemyAI.ts)" \
  "## Problème
Logique de respawn vers la case floor la plus proche dupliquée (lignes ~102-109 et ~180-196).

## Correction proposée
Extraire en \`findNearestFloorTile(position, map)\`." \
  "$M5" "code-quality"

create_issue \
  "Quality: Traduire NotFound.tsx en français" \
  "## Problème
\"Oops! Page not found\" et \"Return to Home\" en anglais, incohérent avec l'UI française.

## Correction proposée
Traduire en \"Oups ! Page non trouvée\" et \"Retour à l'accueil\"." \
  "$M5" "code-quality"

create_issue \
  "Quality: Corriger les typos dans les titres d'achievements" \
  "## Problème
- \"InvocateurEXPERT\" → \"Invocateur EXPERT\" (espace)
- \"CollectionneurEXPERT\" → \"Collectionneur EXPERT\" (espace)
- \"ExplorateurLvL\" → casse incohérente

## Correction proposée
Ajouter les espaces et uniformiser la casse." \
  "$M5" "code-quality"

# ===========================================================================
# MILESTONE 6 : Tests
# ===========================================================================
echo ""
echo "=== Milestone 6 : Tests & couverture ==="
M6=$(create_milestone \
  "M6 — Tests & couverture" \
  "Augmenter la couverture de tests sur les modules critiques : hooks, gacha, IA, persistance.")

create_issue \
  "Test: Ajouter des tests pour les hooks critiques" \
  "## Hooks sans tests
- \`useCloudSave.ts\` : sync, cleanup, recovery
- \`useKpis.ts\` : timeout, retry, fallback
- \`AuthContext.tsx\` : transitions d'état
- \`ProfileContext.tsx\` : mises à jour concurrentes, validation display name

## Priorité
HAUTE — ces hooks gèrent la persistance et l'authentification." \
  "$M6" "tests"

create_issue \
  "Test: Compléter les tests existants (saveSystem, mocks Supabase)" \
  "## Problème
- \`example.test.ts\` : placeholder trivial
- \`saveSystem.test.ts\` : ne teste pas la persistance réelle
- Pas de mock Supabase

## Correction proposée
Compléter les tests et ajouter des mocks Supabase via \`vi.mock()\`." \
  "$M6" "tests"

create_issue \
  "Test: Ajouter des tests pour le système de gacha (summoning.ts)" \
  "## Cas à tester
- Distribution des raretés
- Pity triggers à 10/30/50/200
- Reset des compteurs après tirage garanti
- Persistance des pity counters" \
  "$M6" "tests"

create_issue \
  "Test: Ajouter des tests pour l'IA ennemie (enemyAI.ts)" \
  "## Cas à tester
- Patterns de boss (charge, summon, invincibility, bomb-rain)
- Comportement de base des ennemis (déplacement, respawn)
- Edge cases (ennemi bloqué, boss pattern -1)" \
  "$M6" "tests"

echo ""
echo "=== ✅ Terminé ! ==="
echo "6 milestones et 28 issues créés sur $REPO"
