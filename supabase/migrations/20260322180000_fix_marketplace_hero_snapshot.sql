-- Fix list_hero_for_sale : accepte un hero_snapshot en fallback
-- si le héros n'est pas encore dans player_heroes (sync cloud non effectué)
CREATE OR REPLACE FUNCTION list_hero_for_sale(
  p_seller_id     UUID,
  p_hero_id       TEXT,
  p_price         BIGINT,
  p_hero_snapshot JSONB DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_hero      player_heroes%ROWTYPE;
  v_snapshot  JSONB;
  v_rarity    TEXT;
  v_listing_id UUID;
BEGIN
  -- Chercher le héros dans player_heroes (version cloud-synced)
  SELECT * INTO v_hero
  FROM player_heroes
  WHERE id = p_hero_id AND user_id = p_seller_id
  FOR UPDATE;

  IF FOUND THEN
    -- Héros trouvé en DB : on utilise les données serveur (plus sûr)
    v_rarity   := v_hero.rarity;
    v_snapshot := jsonb_build_object(
      'name',           v_hero.name,
      'rarity',         v_hero.rarity,
      'level',          v_hero.level,
      'stars',          v_hero.stars,
      'xp',             v_hero.xp,
      'stats',          v_hero.stats,
      'skills',         v_hero.skills,
      'currentStamina', v_hero.current_stamina,
      'maxStamina',     v_hero.max_stamina,
      'houseLevel',     v_hero.house_level,
      'icon',           v_hero.icon,
      'family',         v_hero.family
    );
    IF COALESCE(v_hero.is_locked, false) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Ce héros est verrouillé.');
    END IF;
  ELSIF p_hero_snapshot IS NOT NULL THEN
    -- Fallback : héros pas encore synchronisé dans la DB, on utilise le snapshot client
    v_rarity   := p_hero_snapshot->>'rarity';
    v_snapshot := p_hero_snapshot;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Héros introuvable. Synchronisez votre compte et réessayez.');
  END IF;

  -- Validation rareté
  IF v_rarity NOT IN ('epic', 'legend', 'super-legend') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seuls les héros Épique, Légendaire et Super-Légendaire peuvent être vendus.');
  END IF;

  -- Validation prix
  IF p_price < 100 OR p_price > 999999999 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prix invalide (100 – 999 999 999 coins).');
  END IF;

  -- Déjà en vente ?
  IF EXISTS (
    SELECT 1 FROM marketplace_listings
    WHERE hero_id = p_hero_id AND seller_id = p_seller_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce héros est déjà en vente.');
  END IF;

  -- Créer l'annonce
  INSERT INTO marketplace_listings (seller_id, hero_id, hero_snapshot, price)
  VALUES (p_seller_id, p_hero_id, v_snapshot, p_price)
  RETURNING id INTO v_listing_id;

  -- Retirer le héros de player_heroes s'il y était
  DELETE FROM player_heroes WHERE id = p_hero_id AND user_id = p_seller_id;

  RETURN jsonb_build_object('success', true, 'listing_id', v_listing_id);
END;
$$;

GRANT EXECUTE ON FUNCTION list_hero_for_sale TO authenticated;
