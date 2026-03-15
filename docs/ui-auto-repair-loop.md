# UI Auto-Repair Loop (issue #131)

MVP pragmatique pour transformer un rapport **UI radar** (JSON) en plan de correction priorisé, puis appliquer des fixes **sûrs et limités**.

## Principe

1. `plan-from-radar` lit le rapport radar (+ baseline optionnelle) et produit un plan priorisé P0/P1/P2.
2. `run-loop` applique uniquement les fixes auto-éligibles (`replace_text`) avec garde-fous.
3. Le script génère un résumé avant/après exploitable en PR.

## Contrat d'entrée radar (MVP)

```json
{
  "generatedAt": "2026-03-15T22:00:00Z",
  "issues": [
    {
      "id": 201,
      "title": "CTA mobile tronqué",
      "severity": "P1",
      "type": "overflow",
      "fix": {
        "kind": "replace_text",
        "file": "src/pages/Landing.tsx",
        "find": "className=\"pixel-btn\"",
        "replace": "className=\"pixel-btn break-words\""
      }
    }
  ]
}
```

> Le loop n'applique **pas** de patch libre: uniquement `replace_text` dans `src/**/*.ts(x)|css`.

## Scripts npm

- `npm run ui:repair:plan -- --radar <file> [--baseline <file>] [--out <file>]`
- `npm run ui:repair:run -- --plan <file> [--summary <file>] [--max-files 4] [--max-diff-lines 200]`
- `npm run ui:repair:dry -- --plan <file>`

## Exécution locale

```bash
npm run ui:repair:plan -- \
  --radar artifacts/ui-radar/report.json \
  --baseline artifacts/ui-baseline/baseline.json \
  --out artifacts/ui-auto-repair/repair-plan.json

npm run ui:repair:run -- \
  --plan artifacts/ui-auto-repair/repair-plan.json \
  --summary artifacts/ui-auto-repair/repair-summary.json \
  --max-files 4 \
  --max-diff-lines 200
```

## Garde-fous implémentés

- Scope limité à `src/**/*.tsx|ts|css`
- Type de patch limité (`replace_text`)
- Stop si nombre max de fichiers touchés dépassé
- Stop + rollback si diff trop large
- Stop + rollback si build KO
- Résumé JSON avant/après pour audit PR

## Intégration CI (suggestion)

En CI, brancher les artefacts de #130/#132:

- input radar: `artifacts/ui-radar/report.json`
- input baseline: `artifacts/ui-baseline/baseline.json`
- outputs:
  - `artifacts/ui-auto-repair/repair-plan.json`
  - `artifacts/ui-auto-repair/repair-summary.json`

Puis uploader les 2 artefacts et demander validation humaine avant PR.

## Limites connues (MVP)

- Aucun “raisonnement visuel” autonome: le script applique seulement les correctifs proposés par le radar.
- Pas d'auto-merge, pas de push automatique.
- Pas de relance screenshot native dans ce ticket (consomme artefacts #130/#132 existants).
