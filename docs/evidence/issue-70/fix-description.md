# Issue #70 - Cloud Fallback Safety Fix

## Problème identifié

Après le merge de la PR #72, le flux de fallback cloud présentait une régression critique:

### Symptômes
- Toast "Cloud indisponible" affiché aux utilisateurs
- Perte apparente des données de compte

### Cause racine (lignes 126-127 du code original)
```typescript
} else {
  // PROBLÈME: Écriture agressive sur cloud lors du fallback
  saveStatsToCloud(localData, localStory, localQuests);
  saveHeroesToCloud(localData.heroes);
}
```

Quando le chargement cloud échoue (timeout, erreur réseau, etc.), le code tentait d'écraser les données cloud avec les données locales **sans validation préalable** de la connectivité. Cela pouvait:
1. Écraser des données cloud valides si le load n'avait fait que timeout
2. Provoquer des pertes de données si l'utilisateur avait des données cloud plus récentes

## Solution implémentée

### 1. Ajout d'un état `cloudValidated`
```typescript
const [cloudValidated, setCloudValidated] = useState(false);
```
- `false` par défaut = mode dégradé sûr
- `true` seulement après un chargement cloud réussi

### 2. Suppression de l'écriture agressive sur fallback
Quand le cloud échoue, les données locales sont utilisées en **lecture seule**:
- Pas de tentative d'écriture cloud
- Toast mis à jour: "Mode lecture seule"

### 3. Garde-fou sur toutes les écritures cloud
Toutes les fonctions de sauvegarde cloud sont maintenant conditionnées:
```typescript
if (cloudValidated) {
  saveHeroesToCloud(...);
  saveStatsToCloud(...);
  // etc.
}
```

Fonctions protégées:
- `saveStatsToCloud` (intervalle 5s)
- `saveHeroesToCloud` (après héros mis à jour)
- `removeHeroesFromCloud` (après fusion/ascension)

### 4. Logs techniques améliorés
- `CLOUD_LOAD_SUCCESS` avec détails (nb héros, progression)
- `CLOUD_LOAD_FAILED` avec code d'erreur et contexte
- `CLOUD_LOAD_UNEXPECTED_ERROR` pour erreurs inattendues

## Comportement attendu

| Scénario | Avant | Après |
|----------|-------|-------|
| Cloud load succès | Données cloud chargées | ✓ Données cloud + `cloudValidated = true` |
| Cloud load timeout | Écriture agressive (dangereux) | ✓ Lecture seule locale, pas d'écriture |
| Cloud load erreur réseau | Écriture agressive (dangereux) | ✓ Lecture seule locale, pas d'écriture |
| Sauvegarde périodique | Toujours vers cloud | ✓ Uniquement si `cloudValidated` |
| Actions joueur (upgrade, etc.) | Toujours vers cloud | ✓ Uniquement si `cloudValidated` |

## Fichiers modifiés

- `src/pages/Index.tsx`: +35 lignes, -18 lignes
  - Ajout état `cloudValidated`
  - Suppression écriture agressive sur fallback
  - Guards sur toutes les écritures cloud
  - Logs techniques améliorés

## Vérification

1. ✅ Build réussi (`npm run build`)
2. ✅ Aucune régression de lint (erreurs pré-existantes)
3. ✅ UI ne boucle plus en loading (via `isCloudLoading` + `cloudValidated`)
4. ✅ Données locales préservées en cas d'indisponibilité cloud
