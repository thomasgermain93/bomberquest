# Issue #74 - Rollback des invocations lors du retour de la page Profil

## Problème
Quand l'utilisateur allait sur la page Profil puis faisait retour, l'état semblait rollback et il perdait ses dernières invocations (héros invoqués).

## Cause racine identifiée
Le useEffect de chargement cloud (`[user?.id]`) se déclenchait à chaque remontée du composant Index.tsx lors de la navigation. Comme les données cloud n'étaient pas encore synchronisées (délai réseau ou debounce), les données locales plus récentes étaient écrasées par les données cloud plus anciennes.

## Solution implémentée

### 1. Protection contre le rechargement cloud répété
```typescript
const cloudLoadedRef = useRef(false);
// ...
if (cloudLoadedRef.current) {
  console.log('CLOUD_LOAD_SKIP', { reason: 'already_loaded', heroCount: player.heroes.length });
  return;
}
```

### 2. Détection de rollback potentiel
```typescript
const isPotentialRollback = localHeroCount > cloudHeroCount && localHeroCount > 1;
if (isPotentialRollback) {
  console.warn('CLOUD_ROLLBACK_DETECTED', {
    localHeroCount,
    cloudHeroCount,
    localHeroIds: player.heroes.map(h => h.id).slice(-5),
    action: 'keeping_local_data'
  });
  // Keep local data - it's more recent
  setCloudValidated(true);
  cloudLoadedRef.current = true;
  return;
}
```

### 3. Sauvegarde locale backup pour utilisateurs cloud
Ajout d'un useEffect qui sauvegarde également dans localStorage comme backup pour les utilisateurs cloud, permettant une récupération en cas de rollback détecté.

### 4. Logs de diagnostic
- `CLOUD_LOAD_SKIP` - quand le chargement cloud est ignoré
- `CLOUD_ROLLBACK_DETECTED` - quand un rollback potentiel est détecté
- `CLOUD_LOAD_SUCCESS` - inclut maintenant un timestamp

## Fichiers modifiés
- `src/pages/Index.tsx`

## Vérifications
- [x] Build réussi
- [x] Pas de régression fonctionnelle
