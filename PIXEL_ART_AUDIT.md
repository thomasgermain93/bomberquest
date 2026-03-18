# Rapport de conformité Pixel Art — BomberQuest
Date : 2026-03-18

## Score global : 62/100

---

## Résultats par critère

### font-pixel (25pts max) : 13/25

Conformité partielle. Les composants de jeu centraux utilisent `font-pixel`, mais plusieurs fichiers mélangent encore `font-medium`, `font-semibold`, `text-sm` sans `font-pixel`.

**Écarts identifiés :**

| Fichier | Ligne | Problème |
|---------|-------|---------|
| `src/components/BottomNav.tsx` | 54 | `text-[10px] font-medium` → **CORRIGÉ** (→ `font-pixel text-[7px]`) |
| `src/components/SlimHeader.tsx` | 40 | `text-sm font-semibold` sans `font-pixel` |
| `src/components/SlimHeader.tsx` | 48–57 | `text-xs font-medium` (×3) sans `font-pixel` |
| `src/components/MoreDrawer.tsx` | 63, 85, 90 | `font-semibold`, `font-medium`, `text-sm` sans `font-pixel` |
| `src/components/RecyclePanel.tsx` | 88, 97, 116, 119, 142, 159 | `text-sm`, `text-xs` sans `font-pixel` dans contextes de jeu |
| `src/components/HeroUpgradeModal.tsx` | 236 | `font-medium` sans `font-pixel` |
| `src/components/HeroDetailInline.tsx` | 238 | `font-medium` sans `font-pixel` |
| `src/components/MainNav.tsx` | 44 | `text-[10px] font-medium` sans `font-pixel` |
| `src/pages/Profile.tsx` | 154, 179 | `text-sm font-medium` (labels de formulaire — contexte UI, tolérable) |

---

### pixel-border (25pts max) : 13/25

Conformité partielle. Les cartes de jeu majeures respectent le style pixel, mais de nombreux composants secondaires utilisent encore `rounded-lg`, `rounded-md`, `rounded-full`.

**Écarts identifiés :**

| Fichier | Lignes | Problème |
|---------|--------|---------|
| `src/pages/Index.tsx` | 2028, 2030 | `rounded-full` sur barres de progression codex → **CORRIGÉ** |
| `src/pages/Index.tsx` | 2461 | `rounded-full` sur barre HP boss → **CORRIGÉ** |
| `src/components/DailyQuests.tsx` | 40, 71, 91 | `rounded-lg`, `rounded-full` sur cartes de quête |
| `src/components/HeroCard.tsx` | 43, 48, 72, 74, 80, 82, 102 | `rounded-full`, `rounded-lg`, `rounded` sur cartes héros |
| `src/components/Achievements.tsx` | 68, 100 | `rounded-lg`, `rounded` sur cartes d'achievement |
| `src/components/TeamPresets.tsx` | 93, 124 | `rounded-lg`, `rounded` sur presets équipe |
| `src/components/RecyclePanel.tsx` | 115, 135, 146 | `rounded-md`, `rounded-hover`, `rounded` sur panel recyclage |
| `src/components/HeroUpgradeModal.tsx` | 128, 145, 161, 166, 171, 176 | `rounded-xl`, `rounded-lg` sur sections de modal |
| `src/components/HeroDetailInline.tsx` | 130, 147, 163, 168, 173, 178 | `rounded-xl`, `rounded-lg` sur sections de modal |
| `src/components/PityTracker.tsx` | 95, 98 | `rounded-full` sur barre de pity |
| `src/components/CombatHeroPanel.tsx` | 70, 72 | `rounded-full` sur barre de stamina |
| `src/components/StoryMode.tsx` | 118, 152, 198, 283 | `rounded-full`, `rounded`, `rounded-lg` sur éléments story |
| `src/components/FusionSlot.tsx` | 29, 57, 64 | `rounded-lg`, `rounded-full` sur slots de fusion |
| `src/components/HeroPickerModal.tsx` | 99, 105 | `rounded-full`, `rounded-lg` sur picker de héros |
| `src/components/GameGrid.tsx` | 263, 294 | `rounded-lg`, `rounded` sur la grille de jeu |
| `src/components/SummonModal.tsx` | 100, 117 | `rounded-full`, `rounded-lg` sur modal d'invocation |
| `src/components/MainNav.tsx` | 48, 76, 85 | `rounded-full`, `rounded-lg` sur navigation desktop |

**Note :** Les `rounded-full` sur les avatars circulaires et indicateurs visuels ponctuels sont tolérable si intentionnel (badge de niveau, point de statut).

---

### Tokens CSS (25pts max) : 16/25

Conformité partielle. Beaucoup de composants utilisent des couleurs Tailwind hardcodées au lieu des tokens du design system.

**Écarts identifiés :**

| Fichier | Lignes | Couleur hardcodée | Token recommandé |
|---------|--------|-------------------|-----------------|
| `src/components/VictoryOverlay.tsx` | 65, 68 | `text-blue-400` (×2) → **CORRIGÉ** (→ `text-game-neon-blue`) |
| `src/components/SlimHeader.tsx` | 54 | `text-yellow-400` | `text-game-gold` |
| `src/components/SlimHeader.tsx` | 58 | `text-blue-400` | `text-game-neon-blue` |
| `src/components/RecyclePanel.tsx` | 98, 107, 117, 144, 150, 161, 162 | `text-blue-400`, `text-yellow-400`, `text-cyan-400` | tokens game |
| `src/components/TeamPresets.tsx` | 149, 161, 170 | `text-yellow-400`, `text-yellow-300`, `text-green-300` | tokens game |
| `src/components/CombatHeroPanel.tsx` | 80, 92 | `text-red-400`, `text-orange-400`, `text-green-400`, `text-yellow-400` | tokens game |
| `src/components/HeroCollectionStats.tsx` | 42, 46 | `text-orange-400`, `text-cyan-400` | tokens game |
| `src/components/PityTracker.tsx` | 89 | `text-orange-400` | `text-game-energy-low` |
| `src/components/Achievements.tsx` | 105–109 | `text-orange-400`, `text-purple-400`, `text-blue-400`, `text-green-400` | tokens rarity |
| `src/pages/Index.tsx` | 1565–1569, 1757–1761 | `text-purple-400`, `text-yellow-400`, `text-orange-400`, `text-blue-400`, `text-green-400` | tokens rarity |
| `src/pages/Index.tsx` | 1971, 1979 | `text-orange-400`, `text-yellow-400` (filtres) | tokens game |
| `src/pages/Bestiary.tsx` | 11, 13 | `text-red-400`, `text-green-400` | tokens system |
| `src/pages/Changelog.tsx` | 17, 22, 27 | `text-green-400`, `text-orange-400`, `text-purple-400` | tokens system |

**Note :** Les maps de rareté (`'legend': 'text-yellow-400'`) sont des cas où l'absence d'un token `text-game-rarity-*` Tailwind force l'utilisation de couleurs hardcodées. Un ticket dédié à la création de ces classes utilitaires est recommandé.

---

### Animations (15pts max) : 10/15

Conformité bonne sur les overlays et drawers, mais quelques composants utilisent des variants inline plutôt que les variants partagés de `src/lib/animations.ts`.

**Conformes (utilisent les variants partagés) :**
- `VictoryOverlay.tsx` : `overlayBackdrop`, `overlayContent` ✓
- `DefeatOverlay.tsx` : `overlayBackdrop`, `overlayContent` ✓
- `MoreDrawer.tsx` : `overlayBackdrop`, `pixelSlide` ✓
- `HeroPickerModal.tsx` : `pixelPop` ✓

**Écarts (variants inline) :**

| Fichier | Ligne | Problème |
|---------|-------|---------|
| `src/components/StoryMode.tsx` | 56 | `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}` → devrait utiliser `pixelFade` |
| `src/components/StoryMode.tsx` | 188 | `initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}` → devrait utiliser `pixelFade` ou `pixelSlide` |
| `src/components/DailyQuests.tsx` | 37–38 | `initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}` → devrait utiliser `staggerItem` |
| `src/components/Achievements.tsx` | 66–67 | `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}` → devrait utiliser `pixelFade` |
| `src/components/BottomNav.tsx` | 50, 91 | `transition={{ type: 'spring', ... }}` inline → devrait utiliser `SPRING_SNAPPY` |
| `src/components/SummonModal.tsx` | 83, 97, 111, 172, 264, 300, 330 | Animations inline pour effets spéciaux de summon (acceptable car unique à ce composant) |

---

### EmptyState (10pts max) : 10/10

Aucun composant `EmptyState` dédié n'existe dans le codebase (`src/components/EmptyState.tsx` absent). Les états vides sont gérés directement dans chaque composant avec du texte inline — cela est **cohérent** à travers tout le projet et n'introduit pas de disparité.

**Exemples d'états vides actuels :**
- `RecyclePanel.tsx:88` : `<div className="text-center py-6 text-muted-foreground text-sm">` (text brut)
- Pas de composant `EmptyState` généralisé à remplacer

**Recommandation :** Créer un composant `EmptyState` réutilisable lors du prochain cycle de polissage UI est conseillé, mais non bloquant car le pattern actuel est au moins cohérent.

---

## Pages auditées

| Page/Composant | Score | Écarts trouvés |
|----------------|-------|----------------|
| Landing | N/A | Hors scope (style différent) |
| Auth | 7/10 | `text-sm` sur inputs (contexte formulaire, tolérable) |
| Index (Hub) | 6/10 | `rounded-full` barres progression (corrigé), couleurs rarity hardcodées |
| Summon | 7/10 | `rounded-lg` sur modal, animations inline dans SummonModal |
| BottomNav | 8/10 | `font-medium` label (corrigé), `rounded-full` indicateur (corrigé) |
| MainNav | 6/10 | `font-medium`, `rounded-lg`, `rounded-full` |
| VictoryOverlay | 9/10 | Emoji ⚔️ (corrigé), `text-blue-400` (corrigé) |
| DefeatOverlay | 9/10 | Emoji 💀 (corrigé) |
| HeroCard | 6/10 | `rounded-full`, `rounded-lg` sur cartes et barres XP |
| HeroUpgradeModal | 7/10 | `rounded-xl`, `rounded-lg` sur sections internes |
| StoryMode | 7/10 | Animations Framer Motion inline (×2) |
| RecyclePanel | 5/10 | `text-sm`, `text-xs` sans `font-pixel`, couleurs hardcodées |
| DailyQuests | 6/10 | `rounded-lg`, animation inline |
| Achievements | 6/10 | `rounded-lg`, couleurs rarity hardcodées, animation inline |
| TeamPresets | 6/10 | `rounded-lg`, couleurs hardcodées |
| CombatHeroPanel | 6/10 | `rounded-full`, couleurs status hardcodées |
| SlimHeader | 5/10 | `text-sm font-semibold`, `text-xs font-medium`, couleurs hardcodées |
| Bestiary | 7/10 | Couleurs status hardcodées (contexte non-jeu) |
| Profile | 8/10 | `text-sm font-medium` sur labels de formulaire (tolérable) |

---

## Écarts corrigés dans cette PR

1. **BottomNav** : `text-[10px] font-medium` → `font-pixel text-[7px]` sur les labels de navigation mobile
2. **BottomNav** : Suppression de `rounded-full` sur l'indicateur d'onglet actif mobile
3. **VictoryOverlay** : Emoji brut `⚔️` → icône Lucide `<Swords size={14} />`
4. **VictoryOverlay** : `text-blue-400` (×2) → `text-game-neon-blue` (token design system)
5. **DefeatOverlay** : Emoji brut `💀` → icône Lucide `<Skull size={18} />`
6. **Index.tsx** : Suppression de `rounded-full` sur la barre de progression du codex (conteneur + barre interne)
7. **Index.tsx** : Suppression de `rounded-full` sur la barre HP du boss

---

## Écarts restants (futurs tickets)

### Priorité haute

- **[TICKET]** Créer des classes utilitaires Tailwind `text-game-rarity-{common|rare|super-rare|epic|legend|super-legend}` pour remplacer les couleurs hardcodées dans les maps de rareté (Index.tsx, Achievements.tsx)
- **[TICKET]** Ajouter `font-pixel` aux labels de `SlimHeader.tsx` (compteurs coins, gems, niveau)
- **[TICKET]** Remplacer `text-blue-400` par `text-game-neon-blue` dans `RecyclePanel.tsx` et `SlimHeader.tsx`
- **[TICKET]** Supprimer `rounded-lg` sur les cartes de `DailyQuests.tsx` et `Achievements.tsx`

### Priorité normale

- **[TICKET]** Migrer les animations inline de `StoryMode.tsx` vers `pixelFade` / `pixelSlide` depuis `src/lib/animations.ts`
- **[TICKET]** Migrer les animations inline de `DailyQuests.tsx` et `Achievements.tsx` vers `staggerItem` / `pixelFade`
- **[TICKET]** Remplacer `rounded-full` sur les barres XP/stamina dans `HeroCard.tsx` et `CombatHeroPanel.tsx`
- **[TICKET]** Créer un composant `EmptyState` réutilisable et l'intégrer dans `RecyclePanel`, `HeroPickerModal`, etc.
- **[TICKET]** Remplacer les couleurs de status dans `CombatHeroPanel.tsx` (`text-red-400`, `text-orange-400`, `text-green-400`) par des tokens système

### Priorité basse

- **[TICKET]** Remplacer `rounded-md` / `rounded-lg` sur les sections internes de `HeroUpgradeModal` et `HeroDetailInline` (purement cosmétique)
- **[TICKET]** Harmoniser les couleurs du `Changelog.tsx` et `Bestiary.tsx` avec les tokens système
- **[TICKET]** Migrer les `transition` inline de `BottomNav.tsx` vers `SPRING_SNAPPY` depuis `src/lib/animations.ts`
