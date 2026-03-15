# Issue #132 — Checklist états UI critiques

Statuts:
- [ ] à valider manuellement
- [x] validé sur baseline
- [~] partiellement couvert

## 1) État vide

- [~] **Index** sans contexte joueur riche (aucune action active) visible sur baseline (`index.png`).
- [ ] **Fusion** sans héros éligible affichant clairement les slots vides et l’impossibilité d’action.
- [ ] **Bestiary** fallback d’assets manquants (cartes avec placeholders « Asset manquant »).

## 2) État chargé / nominal

- [x] **Index** rendu nominal desktop + mobile.
- [x] **Bestiary** liste familles/héros rendue desktop + mobile.
- [x] **Summon** écran invocation nominal rendu desktop + mobile.
- [x] **Modal invocation** ouverte et lisible desktop + mobile.
- [x] **Fusion** écran forge rendu desktop + mobile.

## 3) Locked / unlocked

- [ ] Boutons invocation **désactivés** (BC insuffisants) + style disabled.
- [ ] Boutons invocation **activés** (BC suffisants).
- [ ] Fusion: cas **non éligible** vs **éligible** dans le HeroPicker.

## 4) Texte long / overflow

- [ ] Noms héros longs (troncature + lisibilité) sur cartes heroes/bestiary.
- [ ] Labels rares/états longs sans casse visuelle (mobile inclus).
- [ ] Toast/messages multi-lignes ne cassent pas la layout.

## 5) Petit viewport

- [x] Baseline mobile (iPhone 13) pour les 5 vues critiques.
- [ ] Vérifier breakpoint extra-petit (<=360px largeur) sur Index + Modal.
- [ ] Vérifier interactions tactiles (zones cliquables minimales) en modal et fusion.

## Notes d’exécution

- Commande: `npm run ui:baseline:capture`
- Baseline générée dans `docs/evidence/issue-132/baseline/`
