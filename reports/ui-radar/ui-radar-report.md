# UI QA Radar report

- Generated at: 2026-03-15T23:38:37.182Z
- Base URL: http://127.0.0.1:4173
- Scenarios scanned: 7
- Findings: 10 (P0=0, P1=10, P2=0)

## Scanned pages/states
- Landing / Index marketing (`/`) → reports/ui-radar/screenshots/landing.png
- Game: Hub (`/game`) → reports/ui-radar/screenshots/game-hub.png
- Game: Fusion tab (`/game`) → reports/ui-radar/screenshots/game-fusion.png
- Game: Heroes tab (`/game`) → reports/ui-radar/screenshots/game-heroes.png
- Wiki Bestiary (`/wiki/bestiaire`) → reports/ui-radar/screenshots/bestiary.png
- Summon / Fusion screen (`/summon`) → reports/ui-radar/screenshots/summon.png
- Summon: Fusion tab state (`/summon`) → reports/ui-radar/screenshots/summon-fusion-tab.png

## Top prioritized findings
1. [P1] État/UI attendu introuvable — Landing / Index marketing (/)
   - selector: /
   - preuve: reports/ui-radar/screenshots/landing.png
   - détail: {"expectedTexts":["BomberQuest"]}
2. [P1] État/UI attendu introuvable — Game: Hub (/game)
   - selector: /game
   - preuve: reports/ui-radar/screenshots/game-hub.png
   - détail: {"expectedTexts":["BOMBERQUEST","Hub"]}
3. [P1] État/UI attendu introuvable — Game: Fusion tab (/game)
   - selector: /game
   - preuve: reports/ui-radar/screenshots/game-fusion.png
   - détail: {"expectedTexts":["Fusion"]}
4. [P1] État/UI attendu introuvable — Game: Heroes tab (/game)
   - selector: /game
   - preuve: reports/ui-radar/screenshots/game-heroes.png
   - détail: {"expectedTexts":["Héros"]}
5. [P1] État/UI attendu introuvable — Wiki Bestiary (/wiki/bestiaire)
   - selector: /wiki/bestiaire
   - preuve: reports/ui-radar/screenshots/bestiary.png
   - détail: {"expectedTexts":["Bestiaire"]}
6. [P1] État/UI attendu introuvable — Summon / Fusion screen (/summon)
   - selector: /summon
   - preuve: reports/ui-radar/screenshots/summon.png
   - détail: {"expectedTexts":["Invocation","Invoquer"]}
7. [P1] État/UI attendu introuvable — Summon: Fusion tab state (/summon)
   - selector: /summon
   - preuve: reports/ui-radar/screenshots/summon-fusion-tab.png
   - détail: {"expectedTexts":["Fusion"]}
8. [P1] État UI non accessible automatiquement — Game: Fusion tab (/game)
   - selector: /game
   - preuve: reports/ui-radar/screenshots/game-fusion.png
   - détail: {"action":{"type":"clickText","text":"Fusion"},"reason":"text 'Fusion' not found"}
9. [P1] État UI non accessible automatiquement — Game: Heroes tab (/game)
   - selector: /game
   - preuve: reports/ui-radar/screenshots/game-heroes.png
   - détail: {"action":{"type":"clickText","text":"Héros"},"reason":"text 'Héros' not found"}
10. [P1] État UI non accessible automatiquement — Summon: Fusion tab state (/summon)
   - selector: /summon
   - preuve: reports/ui-radar/screenshots/summon-fusion-tab.png
   - détail: {"action":{"type":"clickText","text":"Fusion"},"reason":"text 'Fusion' not found"}

## Notes
- Heuristics-based MVP: peut inclure des faux positifs (troncature volontaire, overlays, etc.).
- Utiliser le JSON pour trier/filtrer automatiquement en CI.
