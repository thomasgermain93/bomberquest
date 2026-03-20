import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profile: ProfileData | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  setDisplayName: (value: string) => Promise<{ error: string | null }>;
}

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const RETRY_DELAY_MS = 500;
const MAX_RETRIES = 1;

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const ensureProfile = useCallback(async (retryCount = 0) => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const { data: existing, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('PROFILE_FETCH_ERROR', { code: error.code || 'UNKNOWN', message: error.message, userId: user.id });
        
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          loadingRef.current = false;
          return ensureProfile(retryCount + 1);
        }
        setProfile(null);
        return;
      }

      if (existing) {
        setProfile(existing as ProfileData);
        return;
      }

      const fallbackName = typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name.trim()
        : null;

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, display_name: fallbackName })
        .select('*')
        .single();

      if (insertError) {
        console.error('PROFILE_INSERT_ERROR', { code: insertError.code || 'UNKNOWN', message: insertError.message, userId: user.id });
        
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          loadingRef.current = false;
          return ensureProfile(retryCount + 1);
        }
        setProfile(null);
        return;
      }

      setProfile((inserted as ProfileData) ?? null);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    ensureProfile();
  }, [ensureProfile]);

  const refreshProfile = useCallback(async () => {
    await ensureProfile();
  }, [ensureProfile]);

  const setDisplayName = useCallback(async (value: string) => {
    if (!user?.id) return { error: 'Utilisateur non connecté.' };

    const normalized = value.trim();
    if (!USERNAME_RE.test(normalized)) {
      return { error: 'Pseudo invalide (3-20 caractères, lettres/chiffres/underscore).' };
    }

    try {
      const { data: conflictExists, error: conflictError } = await supabase.rpc('is_display_name_taken', {
        p_display_name: normalized,
        p_current_user_id: user.id,
      });

      if (conflictError) {
        console.error('PROFILE_CHECK_CONFLICT_ERROR', { code: conflictError.code || 'UNKNOWN', message: conflictError.message });
      } else if (conflictExists) {
        return { error: 'Ce pseudo est déjà utilisé.' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, display_name: normalized }, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
          return { error: 'Ce pseudo est déjà utilisé par un autre joueur.' };
        }
        console.error('PROFILE_UPDATE_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
        return { error: 'Erreur technique. Veuillez réessayer plus tard.' };
      }

      setProfile(data as ProfileData);
      return { error: null };
    } catch (err) {
      const error = err as Error & { code?: string };
      console.error('PROFILE_SET_NAME_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
      return { error: 'Erreur technique. Veuillez réessayer plus tard.' };
    }
  }, [user?.id]);

  const value = useMemo(() => ({
    profile,
    loading,
    refreshProfile,
    setDisplayName,
  }), [profile, loading, refreshProfile, setDisplayName]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
