-- Marketplace listings
CREATE TABLE public.marketplace_listings (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hero_id       TEXT        NOT NULL,
  hero_snapshot JSONB       NOT NULL,
  price         BIGINT      NOT NULL CHECK (price >= 100 AND price <= 999999999),
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  buyer_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sold_at       TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can view active listings"
  ON public.marketplace_listings FOR SELECT
  USING (auth.uid() IS NOT NULL AND (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid()));

CREATE POLICY "seller can insert own listings"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "seller can update own listings"
  ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = seller_id AND status = 'active');

CREATE INDEX idx_marketplace_status ON public.marketplace_listings(status) WHERE status = 'active';
CREATE INDEX idx_marketplace_seller ON public.marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_created ON public.marketplace_listings(created_at DESC) WHERE status = 'active';

-- RPC buy_hero : transaction atomique
CREATE OR REPLACE FUNCTION buy_hero(p_listing_id UUID, p_buyer_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_listing  marketplace_listings%ROWTYPE;
  v_price    BIGINT;
  v_hero     JSONB;
  v_buyer_coins BIGINT;
  v_new_hero_id TEXT;
BEGIN
  SELECT * INTO v_listing FROM marketplace_listings
  WHERE id = p_listing_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing introuvable ou déjà vendu.');
  END IF;
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous ne pouvez pas acheter votre propre héros.');
  END IF;
  v_price := v_listing.price;
  v_hero  := v_listing.hero_snapshot;
  SELECT (save_data->>'bomberCoins')::BIGINT INTO v_buyer_coins
  FROM player_saves WHERE user_id = p_buyer_id FOR UPDATE;
  IF v_buyer_coins IS NULL OR v_buyer_coins < v_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fonds insuffisants.');
  END IF;
  UPDATE player_saves
  SET save_data = jsonb_set(save_data, '{bomberCoins}', to_jsonb(v_buyer_coins - v_price))
  WHERE user_id = p_buyer_id;
  UPDATE player_saves
  SET save_data = jsonb_set(save_data, '{bomberCoins}', to_jsonb((save_data->>'bomberCoins')::BIGINT + (v_price * 95 / 100)))
  WHERE user_id = v_listing.seller_id;
  v_new_hero_id := 'hero_' || extract(epoch from now())::BIGINT::TEXT || '_' || floor(random()*10000)::TEXT;
  INSERT INTO player_heroes (id, user_id, name, rarity, level, stars, stats, skills,
    current_stamina, max_stamina, is_active, house_level, icon, xp, is_locked, family)
  VALUES (
    v_new_hero_id, p_buyer_id,
    v_hero->>'name', v_hero->>'rarity',
    (v_hero->>'level')::INTEGER, (v_hero->>'stars')::INTEGER,
    v_hero->'stats', v_hero->'skills',
    (v_hero->>'currentStamina')::NUMERIC, (v_hero->>'maxStamina')::NUMERIC,
    false, (v_hero->>'houseLevel')::INTEGER, v_hero->>'icon',
    COALESCE((v_hero->>'xp')::INTEGER, 0), false, v_hero->>'family'
  );
  DELETE FROM player_heroes WHERE id = v_listing.hero_id AND user_id = v_listing.seller_id;
  UPDATE marketplace_listings
  SET status = 'sold', buyer_id = p_buyer_id, sold_at = now()
  WHERE id = p_listing_id;
  RETURN jsonb_build_object('success', true, 'new_hero_id', v_new_hero_id, 'price_paid', v_price);
END;
$$;
GRANT EXECUTE ON FUNCTION buy_hero TO authenticated;

-- RPC list_hero_for_sale
CREATE OR REPLACE FUNCTION list_hero_for_sale(p_seller_id UUID, p_hero_id TEXT, p_price BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_hero    player_heroes%ROWTYPE;
  v_snapshot JSONB;
  v_listing_id UUID;
BEGIN
  SELECT * INTO v_hero FROM player_heroes WHERE id = p_hero_id AND user_id = p_seller_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Héros introuvable.');
  END IF;
  IF v_hero.rarity NOT IN ('epic', 'legend', 'super-legend') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seuls les héros Epic, Legend et Super-Legend peuvent être vendus.');
  END IF;
  IF COALESCE(v_hero.is_locked, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce héros est verrouillé.');
  END IF;
  IF EXISTS (SELECT 1 FROM marketplace_listings WHERE hero_id = p_hero_id AND seller_id = p_seller_id AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce héros est déjà en vente.');
  END IF;
  v_snapshot := jsonb_build_object(
    'name', v_hero.name, 'rarity', v_hero.rarity, 'level', v_hero.level,
    'stars', v_hero.stars, 'xp', v_hero.xp, 'stats', v_hero.stats,
    'skills', v_hero.skills, 'currentStamina', v_hero.current_stamina,
    'maxStamina', v_hero.max_stamina, 'houseLevel', v_hero.house_level,
    'icon', v_hero.icon, 'family', v_hero.family
  );
  INSERT INTO marketplace_listings (seller_id, hero_id, hero_snapshot, price)
  VALUES (p_seller_id, p_hero_id, v_snapshot, p_price) RETURNING id INTO v_listing_id;
  DELETE FROM player_heroes WHERE id = p_hero_id AND user_id = p_seller_id;
  RETURN jsonb_build_object('success', true, 'listing_id', v_listing_id);
END;
$$;
GRANT EXECUTE ON FUNCTION list_hero_for_sale TO authenticated;

-- RPC cancel_listing
CREATE OR REPLACE FUNCTION cancel_listing(p_listing_id UUID, p_seller_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
  v_hero    JSONB;
BEGIN
  SELECT * INTO v_listing FROM marketplace_listings
  WHERE id = p_listing_id AND seller_id = p_seller_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing introuvable.');
  END IF;
  v_hero := v_listing.hero_snapshot;
  INSERT INTO player_heroes (id, user_id, name, rarity, level, stars, stats, skills,
    current_stamina, max_stamina, is_active, house_level, icon, xp, is_locked, family)
  VALUES (
    v_listing.hero_id, p_seller_id,
    v_hero->>'name', v_hero->>'rarity',
    (v_hero->>'level')::INTEGER, (v_hero->>'stars')::INTEGER,
    v_hero->'stats', v_hero->'skills',
    (v_hero->>'currentStamina')::NUMERIC, (v_hero->>'maxStamina')::NUMERIC,
    false, (v_hero->>'houseLevel')::INTEGER, v_hero->>'icon',
    COALESCE((v_hero->>'xp')::INTEGER, 0), false, v_hero->>'family'
  );
  UPDATE marketplace_listings SET status = 'cancelled', cancelled_at = now() WHERE id = p_listing_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION cancel_listing TO authenticated;
