-- Migration: bumper tous les héros existants à leur niveau maximum selon leur rareté
-- Cela rend les compétences progressives effectives pour les héros déjà invoqués

UPDATE player_heroes SET level = 20  WHERE rarity = 'common'       AND level < 20;
UPDATE player_heroes SET level = 40  WHERE rarity = 'rare'         AND level < 40;
UPDATE player_heroes SET level = 60  WHERE rarity = 'super-rare'   AND level < 60;
UPDATE player_heroes SET level = 80  WHERE rarity = 'epic'         AND level < 80;
UPDATE player_heroes SET level = 100 WHERE rarity = 'legend'       AND level < 100;
UPDATE player_heroes SET level = 120 WHERE rarity = 'super-legend' AND level < 120;
