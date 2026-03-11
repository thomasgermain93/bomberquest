import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching profile:', error);
    throw error;
  }

  return data;
};

export const upsertProfile = async (
  userId: string,
  displayName: string | null
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    throw error;
  }

  return data;
};

export const updateProfileDisplayName = async (
  userId: string,
  displayName: string | null
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
};

export const createProfileIfNotExists = async (
  userId: string,
  displayName?: string
): Promise<Profile> => {
  const existing = await getProfile(userId);
  if (existing) return existing;

  return upsertProfile(userId, displayName || null);
};
