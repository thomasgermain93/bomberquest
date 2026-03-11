# BomberQuest — Idle Bomber RPG

Un jeu RPG idle en pixel art où tu collectes des héros, poses des bombes, explores des donjons et affrontes des boss épiques.

## Stack technique

- **React 18** + **TypeScript**
- **Vite** (bundler, SWC)
- **Tailwind CSS** + **shadcn/ui** (Radix UI)
- **Supabase** — authentification & persistance des données
- **TanStack Query** — gestion des données serveur
- **Framer Motion** — animations
- **React Router DOM** — navigation
- **Vitest** + **Testing Library** — tests

## Prérequis

- Node.js ≥ 18
- npm ou bun

## Installation & lancement

```sh
# Cloner le dépôt
git clone <YOUR_GIT_URL>
cd bomberquest

# Installer les dépendances
npm install

# Lancer le serveur de développement (port 8080)
npm run dev
```

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement avec HMR |
| `npm run build` | Build de production |
| `npm run build:dev` | Build en mode développement |
| `npm run preview` | Prévisualiser le build de production |
| `npm run lint` | Linter ESLint |
| `npm run test` | Lancer les tests (Vitest) |
| `npm run test:watch` | Tests en mode watch |

## Variables d'environnement

Crée un fichier `.env.local` à la racine avec les clés Supabase :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Structure du projet

```
src/
├── pages/          # Pages principales (Landing, Auth, Game, Guides…)
├── components/     # Composants UI réutilisables
├── game/           # Moteur de jeu (engine, IA, rendu, systèmes)
├── contexts/       # Contextes React (AuthContext)
├── hooks/          # Hooks personnalisés
├── integrations/   # Clients externes (Supabase)
├── data/           # Données statiques (guides, cartes…)
└── lib/            # Utilitaires
```

## Routes

| Route | Description |
|---|---|
| `/` | Page d'accueil |
| `/auth` | Connexion / Inscription (email + Google OAuth) |
| `/game` | Jeu principal |
| `/guides` | Liste des guides |
| `/guides/:slug` | Article de guide |
| `/wiki` | Index de la wiki |
| `/wiki/glossaire` | Glossaire |
| `/wiki/bestiaire` | Bestiaire familles + bombers (source de vérité art) |
| `/reset-password` | Réinitialisation du mot de passe |

## Gameplay

### Héros & raretés
Invoque des héros via le système de gacha. Chaque héros a des statistiques (puissance, vitesse, portée, bombes, endurance, chance) et des compétences uniques selon sa rareté :

| Rareté | Taux |
|---|---|
| Common | 60 % |
| Rare | 25 % |
| Super Rare | 10 % |
| Epic | 4 % |
| Legend | 0.9 % |
| Super Legend | 0.1 % |

### Cartes
Six cartes de difficulté croissante à débloquer en progressant :
Prairie → Forêt → Mines → Château → Volcan → Citadelle

### Mode Histoire
5 régions avec 5 étapes chacune (25 étapes au total), dont un boss de fin de région :
Forêt Enchantée → Cavernes Maudites → Ruines Anciennes → Forteresse Orc → Enfer Ardent

### Coffres
Cinq niveaux de coffres à détruire : Bois, Argent, Or, Cristal, Légendaire.

## Bestiaire (MVP issue #42)

- Dataset centralisé : `src/data/bestiary.ts`
- UI minimale : `/wiki/bestiaire`
- Objectif : référencer familles + bombers + statut des assets pour le suivi art.

### Ajouter un nouveau bomber

1. Ajouter/valider la famille dans `BOMBER_FAMILIES`.
2. Ajouter le bomber dans `BESTIARY_BOMBERS` avec:
   - `id` (kebab-case)
   - `name`
   - `familyId`
   - `rarity` (optionnelle)
   - `assetStatus` (`missing` | `wip` | `ready`)
   - `assets.spriteSheet` / `assets.portrait` (si disponible)
3. Mettre à jour les refs assets quand les fichiers sont livrés.

> TODO: brancher automatiquement ce dataset aux assets réels lors de l’intégration pipeline art.

## Authentification

L'authentification est gérée par Supabase avec support de :
- Email + mot de passe
- Google OAuth
- Réinitialisation de mot de passe par email

## Déploiement

Le projet est configuré pour Cloudflare Pages (fichier `public/_redirects` inclus pour le routage SPA).

```sh
npm run build
# Déployer le dossier dist/
```
