-- Permet à un utilisateur connecté de supprimer son propre compte
-- SECURITY DEFINER = s'exécute avec les droits du propriétaire (postgres)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Supprimer les données applicatives
  DELETE FROM player_heroes WHERE user_id = _uid;
  DELETE FROM player_saves WHERE user_id = _uid;
  DELETE FROM profiles WHERE user_id = _uid;

  -- Supprimer le compte auth (possible car SECURITY DEFINER avec accès auth schema)
  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

-- Accorder l'exécution aux utilisateurs authentifiés uniquement
REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
