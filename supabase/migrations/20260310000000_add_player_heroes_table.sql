CREATE TABLE public.player_heroes (
  id              TEXT      NOT NULL,
  user_id         UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT      NOT NULL,
  rarity          TEXT      NOT NULL,
  level           INTEGER   NOT NULL DEFAULT 1,
  stars           INTEGER   NOT NULL DEFAULT 0,
  stats           JSONB     NOT NULL DEFAULT '{}'::jsonb,
  skills          JSONB     NOT NULL DEFAULT '[]'::jsonb,
  current_stamina NUMERIC   NOT NULL DEFAULT 30,
  max_stamina     NUMERIC   NOT NULL DEFAULT 30,
  is_active       BOOLEAN   NOT NULL DEFAULT false,
  house_level     INTEGER   NOT NULL DEFAULT 1,
  icon            TEXT      NOT NULL DEFAULT 'bomb',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.player_heroes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own" ON public.player_heroes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own" ON public.player_heroes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own" ON public.player_heroes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own" ON public.player_heroes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_player_heroes_updated_at
  BEFORE UPDATE ON public.player_heroes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_player_heroes_user_id ON public.player_heroes(user_id);
CREATE INDEX idx_player_heroes_rarity  ON public.player_heroes(rarity);
