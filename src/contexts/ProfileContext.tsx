import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

  const ensureProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    setLoading(true);
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      setLoading(false);
      return;
    }

    if (existing) {
      setProfile(existing as ProfileData);
      setLoading(false);
      return;
    }

    const fallbackName = (user.user_metadata?.full_name as string | undefined)?.trim() || null;

    const { data: inserted } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, display_name: fallbackName })
      .select('*')
      .single();

    setProfile((inserted as ProfileData) ?? null);
    setLoading(false);
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

    const { data: conflict, error: conflictError } = await supabase
      .from('profiles')
      .select('id,user_id')
      .ilike('display_name', normalized)
      .neq('user_id', user.id)
      .not('display_name', 'is', null)
      .limit(1);

    if (conflictError) {
      return { error: 'Erreur de connexion. Veuillez réessayer.' };
    }

    if (conflict && conflict.length > 0) {
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
      return { error: 'Erreur technique. Veuillez réessayer plus tard.' };
    }

    setProfile(data as ProfileData);
    return { error: null };
  }, [user?.id]);

  const value = useMemo(() => ({
    profile,
    loading,
    refreshProfile,
    setDisplayName,
  }), [profile, loading, refreshProfile, setDisplayName]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
