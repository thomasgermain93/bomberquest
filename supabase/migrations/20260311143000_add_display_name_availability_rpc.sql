-- Check username availability while bypassing RLS safely
CREATE OR REPLACE FUNCTION public.is_display_name_taken(
  p_display_name TEXT,
  p_current_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE display_name IS NOT NULL
      AND lower(display_name) = lower(trim(p_display_name))
      AND user_id <> p_current_user_id
    LIMIT 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_display_name_taken(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_display_name_taken(TEXT, UUID) TO authenticated;
