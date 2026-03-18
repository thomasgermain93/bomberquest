# BomberQuest — Roadmap

## Vue d'ensemble

**BomberQuest** est un idle RPG pixel art jouable dans le navigateur, inspiré des mécaniques Bomberman. Les joueurs collectent des héros via un système gacha, les envoient en Chasse au Trésor sur des cartes procédurales, et affrontent des ennemis/boss en Mode Histoire. Le jeu dispose de sauvegardes cloud via Supabase et est déployé sur Cloudflare Pages.

**Stack :** React 18 + TypeScript 5.8 + Vite 5 + Supabase + Cloudflare Pages

**Version actuelle du package.json :** 1.0.0 (le vrai numéro de version est tracké dans `src/data/changelog.ts`, dernière version stable : **1.7.0**, actuellement en cours : Unreleased)

---

## Phases livrées

### Phase 1 — Core Loop (v1.0.0 — 15 novembre 2025)

Lancement officiel de BomberQuest :

- Mode Chasse au Trésor : cartes procédurales avec 4 niveaux de difficulté
- Mode Histoire : 4 régions initiales avec 20 étapes et 4 boss
- Système gacha avec 6 raretés et compteurs de pity garantis
- Rendu canvas pixel art avec sprites procéduraux
- Effets sonores chiptune via Web Audio API

### Phase 2 — Progression & Cloud (v1.1.0 → v1.3.1 — décembre 2025 → janvier 2026)

**v1.1.0** — Sauvegardes Cloud & Authentification (1er décembre 2025)
- Sauvegarde cloud via Supabase (synchro multi-appareils)
- Connexion email/mot de passe + Google OAuth
- Système hybride localStorage + Supabase

**v1.2.0** — Système d'Ascension des Héros (20 décembre 2025)
- Ascension disponible après niveau maximum
- Nouvelles capacités passives + stats augmentées
- Matériaux d'ascension en Mode Histoire
- Nouvelle interface de fiche héros

**v1.3.0** — Quêtes Journalières (10 janvier 2026)
- 3 quêtes journalières renouvelées à minuit (UTC+1)
- Récompenses : gemmes, stamina, potions d'EXP
- Panneau de quêtes depuis le hub principal

**v1.3.1** — Correctifs Gacha (18 janvier 2026)
- Fix critique : compteur pity Legend ne dépassait plus 200 sans garantie
- Fix affichage taux de rareté
- Balance : taux Epic 0.8% → 1.0%

### Phase 3 — Contenu & Systèmes Avancés (v1.4.0 → v1.7.0 — février → mars 2026)

**v1.4.0** — Mode Histoire Région 5 : Enfer Ardent (5 février 2026)
- Région "Enfer Ardent" : 5 nouvelles étapes + boss inédit
- Nouveau boss : Démogorgon (4 phases, pluie de bombes volcanique)
- Type ennemi "Démon" avec téléportation

**v1.4.2** — Corrections & Équilibrage (20 février 2026)
- Fix bombes disparaissant lors d'un changement de carte
- Fix compteur pity se réinitialisant après invocation épique
- Balance SR : réduction coût stamina compétence passive

**v1.5.0** — Wiki & Documentation (10 mars 2026)
- Page Wiki complète (héros, cartes, ressources)
- Glossaire interactif
- Page Changelog
- Refonte navigation

**v1.6.0** — Features Gameplay, Forge & Progression (14 mars 2026)
- Page Invocation dédiée + invocations via shards
- Système de fusion avec page dédiée (enclume + 6 slots)
- XP progression + fusion niveau maximum
- Succès (achievements system)
- Bestiaire visuel (familles + bombers)
- Profil joueur + suppression de compte
- Drop garanti de héros au 1er clear de boss Story
- Chiffres clés landing (métriques réelles Supabase)
- i18n FR 100%

**v1.6.1** — Stabilité & Qualité de Vie (15 mars 2026)
- Fix NaN XP sur héros legacy
- Fix cloud save : rollback au retour Profil → Jeu
- Fix sauvegarde fusions en cloud
- Fix menu landing responsive mobile

**v1.7.0** — UI/UX & Infrastructure (18 mars 2026)
- Navigation mobile-first : BottomNav, SlimHeader, MoreDrawer
- Milestones A→H : harmonisation pixel art complète
- Framer Motion : transitions cohérentes partout
- Vrais visuels héros par clan + skins avec fallback
- Hero Codex (héros débloqués/non débloqués) + filtres
- CI : GitHub Actions workflow + TypeScript strict
- UI QA Radar + Auto-Repair Loop
- Architecture Clan Bomb System
- Système Universal Hero Shards + invocation ciblée
- Box management + recyclage héros

---

## En cours

### v1.3 — Contenu avancé (milestone GitHub)

Ces issues sont en phase design/proto, parallèles au développement v1.4 :

| Issue | Titre | État |
|-------|-------|------|
| #162 | Content Pack nouveaux clans | En cours |
| #163 | Art Pipeline skins | En cours |
| #164 | Story Mode nouveaux niveaux | En cours |
| #165 | Ascension & World Boss (design + proto) | En cours |

### v1.4 — Social, Web & Polish

**Objectif :** Améliorer la visibilité web, l'onboarding des joueurs et l'infrastructure sociale.

| Issue | Titre | Priorité | Effort | Risque |
|-------|-------|----------|--------|--------|
| #13 | Section stats landing | Quick win | Faible | Aucun |
| #158 | SEO + Favicon | Quick win | Faible | Aucun |
| #159 | Image OG 1200x630 | Quick win | Faible | Aucun |
| #8 | Leaderboard | Moyen | Moyen | Faible |
| #160 | Wiki rework | Important | Élevé | Moyen |
| #5 | Tutoriel joueurs | Important | Élevé | Moyen |
| #166 | Roadmap (ce doc) | Meta | Faible | Aucun |

**Dépendances :**
- #159 doit être fait avant/avec #158 (l'URL de l'image OG doit exister avant d'être référencée dans les balises meta)
- #160 et #5 sont indépendants mais représentent l'effort le plus important du milestone
- #13 peut être fait en parallèle de tout le reste

**Checklist QA v1.4 :**
- [ ] Build sans erreur : `npm run build`
- [ ] Tests passent : `npm run test`
- [ ] SEO : balises meta présentes sur toutes les pages publiques (`/`, `/auth`)
- [ ] OG : preview correct sur Telegram / Discord / X (utiliser opengraph.xyz pour tester)
- [ ] Favicon : affiché dans l'onglet navigateur + PWA manifest
- [ ] Stats landing : données KPI chargées depuis Supabase, skeleton → valeurs réelles
- [ ] Leaderboard : données correctes depuis Supabase, tri fonctionnel
- [ ] Wiki : navigation fonctionnelle, recherche opérationnelle, contenu à jour v1.7
- [ ] Tutoriel : non-intrusif pour les joueurs existants (vu une seule fois, dismissable)
- [ ] Mobile : responsive 375px–430px vérifié sur Chrome DevTools
- [ ] Déploiement Cloudflare Pages OK (build + routing SPA `_redirects`)

---

## Backlog futur

### v1.5+ — Social & Multijoueur

| Idée | Description | Complexité |
|------|-------------|------------|
| Guildes | Créer/rejoindre des guildes, chat interne | Très élevée |
| Events saisonniers | Contenu limité dans le temps (Halloween, Noël…) | Élevée |
| World Boss (#165) | Boss multijoueur asynchrone, récompenses partagées | Élevée |
| #11 Marketplace | Échange de héros entre joueurs | Très élevée |
| Notifications push | Rappel quêtes journalières via Web Push API | Moyenne |
| Replay combats | Rejouer/partager un run Story Mode | Élevée |
| Classements clans | Leaderboard par clan en plus du classement global | Moyenne |

### Dette technique identifiée

| Item | Description | Priorité |
|------|-------------|----------|
| `Index.tsx` > 2500 lignes | Fichier monolithique à découper en sous-composants | Post-v1.4 |
| TypeScript strict mode | `noImplicitAny: false` — audit nécessaire avant activation | Moyen terme |
| Tests coverage | Couverture unitaire faible sur `src/game/` | Continu |
| Canvas tile size 40px | Valeur hardcodée partout — à extraire en constante | Quand nécessaire |

---

## Risques identifiés

| Risque | Impact | Mitigation |
|--------|--------|------------|
| `Index.tsx` > 2500 lignes (dette technique) | Moyen — maintenabilité dégradée | Refactoring prévu post-v1.4, découpé en sous-composants |
| Supabase free tier limits (500 MB, 50k requêtes/mois) | Élevé si trafic en croissance | Surveiller métriques dashboard, migration plan à documenter avant saturation |
| SEO SPA sans SSR | Moyen — indexation dépend du crawler JS | GoogleBot exécute le JS (acceptable), ajouter SSG si besoin |
| Pity counters perdus en cas de bug cloud | Élevé — ressenti injuste pour les joueurs | Toujours persister les pity avec les hero saves (cf. CLAUDE.md pitfalls) |
| Skins/art pipeline non automatisé (#163) | Moyen — goulot d'étranglement pour le contenu | Définir un pipeline clair avant d'ajouter de nouveaux clans |

---

## Principes directeurs

- **Mobile first** : chaque feature testée à 375px avant tout autre breakpoint
- **Pixel art cohérent** : design system respecté à chaque PR (ref. `PIXEL_ART_AUDIT.md`)
- **Cloud save safe** : aucune migration de schéma sans backward-compat garantie
- **No over-engineering** : solution minimale qui fonctionne — éviter d'anticiper des besoins hypothétiques
- **French UI** : tous les textes joueurs sont en français, sans exception
- **CI verte** : aucun merge sans build + tests qui passent (GitHub Actions)
