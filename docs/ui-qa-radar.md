# UI QA Radar (Issue #130)

Radar UI automatique MVP pour détecter des problèmes UI/UX sur les écrans clés.

## Couverture actuelle

Scénarios scannés automatiquement:
- Landing (`/`)
- Game Hub (`/game`)
- Game Fusion tab (`/game` + clic `Fusion`)
- Game Heroes tab (`/game` + clic `Héros`)
- Bestiary (`/wiki/bestiaire`)
- Summon (`/summon`)
- Summon Fusion tab (`/summon` + clic `Fusion`)

## Règles heuristiques

Le script signale des anomalies potentielles:
- overflow/clipping
- texte tronqué
- éléments hors viewport
- contrastes douteux
- chevauchements/spacing incohérent

Priorisation:
- **P0**: élément interactif hors viewport
- **P1**: overflow, hors viewport non interactif, contraste critique, chevauchement fort
- **P2**: troncature texte et alertes mineures

## Utilisation

```bash
npm install
npm run ui:radar:install
npm run ui:radar
```

## Sorties

Le radar génère:
- `reports/ui-radar/ui-radar-report.json` (machine-readable)
- `reports/ui-radar/ui-radar-report.md` (résumé humain)
- `reports/ui-radar/screenshots/*.png` (preuves)

## Usage CI (exemple)

```bash
npm ci
npm run ui:radar:install
npm run ui:radar
# optionnel: parser reports/ui-radar/ui-radar-report.json et fail si P0 > 0
```

## Limites connues

- Heuristiques volontairement simples (MVP), donc faux positifs possibles.
- Pas encore de scénario authentifié profond (ex: état HUD en combat complexe dépendant de progression).
- Le score contraste est approximatif (fond calculé via parent le plus proche non transparent).
