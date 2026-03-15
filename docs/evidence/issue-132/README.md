# Issue #132 — UI baseline snapshots

Baseline screenshots desktop/mobile pour les vues critiques demandées:

- Index (`/`)
- Bestiary (`/bestiary`)
- Summon (`/summon`)
- Fusion (écran Index → `Forge de Fusion`)
- Modal pertinent (Index → `INVOQUER UN HÉROS`)

## Génération

```bash
npm run ui:baseline:capture
```

Sortie:

- `docs/evidence/issue-132/baseline/desktop/*.png`
- `docs/evidence/issue-132/baseline/mobile/*.png`

## Fichiers attendus

- `desktop/index.png`
- `desktop/bestiary.png`
- `desktop/summon.png`
- `desktop/fusion.png`
- `desktop/index-summon-modal.png`
- `mobile/index.png`
- `mobile/bestiary.png`
- `mobile/summon.png`
- `mobile/fusion.png`
- `mobile/index-summon-modal.png`
