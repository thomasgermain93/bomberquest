# Mode World Boss — Design Document

**Version :** 0.1 (prototype)
**Statut :** Feature flag `worldBoss: false` — non livré en prod
**Issue :** #165

---

## Concept

Le Mode World Boss est un event communautaire asynchrone : tous les joueurs actifs partagent un même boss géant à abattre collectivement dans une fenêtre de 72 heures. Chaque joueur contribue en infligeant des dégâts via des combats individuels, et la progression est partagée globalement.

Ce mode vise à :
- Créer un sentiment de communauté et d'effort collectif
- Générer un FOMO naturel (fenêtre limitée, récompenses exclusives)
- Encourager la connexion quotidienne (paliers de dégâts individuels)

---

## Mécanique

### Déroulement d'un event

1. Un World Boss apparaît toutes les **2 semaines** (ou déclenché manuellement côté admin).
2. La fenêtre de participation dure **72 heures**.
3. Chaque joueur peut attaquer le boss **3 fois par jour** (rechargement à minuit UTC).
4. Chaque attaque lance un combat Bomberman standard — les dégâts infligés s'accumulent.
5. Quand les HP collectifs du boss tombent à 0, l'event se termine et toutes les récompenses de palier sont distribuées.
6. Si le boss n'est pas vaincu en 72h, les paliers atteints sont quand même récompensés.

### Calcul des dégâts

- Dégâts par attaque = (Puissance moyenne de l'équipe) x (ennemis tués) x (multiplicateur de difficulté)
- Les dégâts sont envoyés à Supabase à la fin de chaque combat via une fonction RPC `add_boss_damage(player_id, damage_amount)`.
- Un leaderboard individuel affiche le top 10 des contributeurs.

### HP du boss

- HP total = 10 000 000 (base) x (nombre de joueurs actifs au lancement)
- Ajustement dynamique pour maintenir un défi raisonnable (~60% de chance de victoire collective).

---

## Progression partagée — Paliers

Les paliers sont débloqués quand la barre de vie collective du boss atteint certains seuils. Tous les joueurs ayant participé (au moins 1 attaque) reçoivent les récompenses des paliers atteints.

| Palier | HP boss restants | Récompense (tous participants) |
|--------|-----------------|-------------------------------|
| 1      | 75% vaincus     | 50 Universal Shards + badge "Blesseur" |
| 2      | 50% vaincus     | 120 Universal Shards + titre "Guerrier du Boss" |
| 3      | 75% vaincus     | 250 Universal Shards + skin exclusif event |
| 4      | 100% vaincus    | 500 Universal Shards + héros event exclusif (si dispo) |

### Récompenses individuelles (contribution personnelle)

| Contribution personnelle | Bonus |
|--------------------------|-------|
| Top 10% des dégâts       | +100 Universal Shards |
| Top 1% des dégâts        | +300 Universal Shards + badge exclusif |

---

## Interface joueur

### Pendant l'event

- Bannière persistante dans le hub principal avec countdown 72h.
- Barre HP globale du boss mise à jour toutes les 30 secondes (polling Supabase).
- Bouton "Attaquer" avec compteur d'attaques restantes aujourd'hui.
- Leaderboard des 10 meilleurs contributeurs.
- Historique des dégâts personnels pour la session.

### Après l'event

- Résumé de l'event : boss vaincu ou non, paliers atteints, contribution personnelle.
- Attribution automatique des récompenses dans l'inventaire.
- Archive des events passés (boss name, date, résultat).

---

## Architecture technique (ébauche)

### Tables Supabase à créer

```sql
-- Event actif
world_boss_events (
  id uuid PRIMARY KEY,
  boss_name text,
  boss_hp_total bigint,
  boss_hp_remaining bigint,
  started_at timestamptz,
  ends_at timestamptz,
  status text -- 'active' | 'completed' | 'failed'
)

-- Contributions individuelles
world_boss_contributions (
  id uuid PRIMARY KEY,
  event_id uuid REFERENCES world_boss_events(id),
  player_id uuid REFERENCES auth.users(id),
  total_damage bigint,
  attacks_today int,
  last_attack_at timestamptz
)
```

### RPC Supabase

- `get_active_world_boss()` — retourne l'event en cours (ou null)
- `add_boss_damage(event_id, damage)` — incrémente les dégâts joueur + boss
- `get_boss_leaderboard(event_id)` — top 10 contributeurs

---

## KPIs cibles

| Indicateur | Cible |
|------------|-------|
| Participation (% joueurs actifs) | > 70% pendant la fenêtre 72h |
| Attaques quotidiennes (DAU) | +40% vs moyenne hors event |
| Taux de victoire collective | ~60% des events |
| Retention J+1 pendant event | > 55% |
| FOMO mesuré (connexions J+3) | pic > 2x moyenne |

---

## Notes de design

- Le nombre d'attaques journalières (3) est volontairement limité pour étaler la participation et maximiser le FOMO.
- Les récompenses exclusives (skins, héros event) doivent être suffisamment désirables pour motiver les joueurs inactifs.
- Prévoir une notification push / email optionnelle à J-24h de la fin de l'event.
- Le boss doit avoir un design visuel distinct et mémorable (nom propre : ex. "Moloch l'Éternel", "La Reine des Abysses").
- Feature flag : `GAME_MODE_FLAGS.worldBoss` doit être `true` pour activer le mode.
