import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getProfile, createProfileIfNotExists, Profile } from '@/lib/profileService';
import { USERNAME_RE, RETRY_DELAY_MS } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  loading: boolean;
  // Profile state
  profile: Profile | null;
  username: string | null;
  profileLoading: boolean;
  // Auth methods
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  // Profile methods
  updateUsername: (displayName: string) => Promise<void>;
  setDisplayName: (value: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/**
 * Alias rétro-compatible pour les composants qui consomment l'ancien ProfileContext.
 * Retourne le même shape que l'ancien useProfile().
 */
export const useProfile = () => {
  const { profile, profileLoading: loading, setDisplayName, refreshProfile } = useAuth();
  return useMemo(
    () => ({ profile, loading, setDisplayName, refreshProfile }),
    [profile, loading, setDisplayName, refreshProfile]
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_RETRIES = 1;

async function fetchProfileWithRetry(userId: string, retryCount = 0): Promise<Profile | null> {
  try {
    return await getProfile(userId);
  } catch (err) {
    const error = err as Error & { code?: string };
    if (import.meta.env.DEV) console.error('AUTH_PROFILE_FETCH_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return fetchProfileWithRetry(userId, retryCount + 1);
    }
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const initializedRef = useRef(false);
  const profileLoadingRef = useRef(false);

  // Single profile fetch — avoids the double-fetch that existed when
  // AuthContext and ProfileContext each fetched independently on login.
  const fetchProfile = useCallback(async (userId: string) => {
    if (profileLoadingRef.current) return;
    profileLoadingRef.current = true;
    setProfileLoading(true);
    try {
      const profileData = await fetchProfileWithRetry(userId);
      setProfile(profileData ?? null);
    } finally {
      profileLoadingRef.current = false;
      setProfileLoading(false);
    }
  }, []);

  const initializeProfile = useCallback(async (userId: string, displayName?: string) => {
    try {
      const profileData = await createProfileIfNotExists(userId, displayName);
      setProfile(profileData);
    } catch (err) {
      const error = err as Error & { code?: string };
      if (import.meta.env.DEV) console.error('AUTH_PROFILE_INIT_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const currentUser = nextSession?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        void fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          void fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error('AUTH_SESSION_GET_ERROR', { code: 'SESSION_GET_FAILED', message: err.message });
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ─── Auth methods ──────────────────────────────────────────────────────────

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: displayName },
      },
    });

    if (!error && data.user) {
      await initializeProfile(data.user.id, displayName);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error };
  };

  const signOut = async () => {
    // Clear local save data so the next login always gets a fresh cloud load
    localStorage.removeItem('bomberquest_save');
    localStorage.removeItem('bomberquest_save_ts');
    localStorage.removeItem('bq_story');
    await supabase.auth.signOut();
    setProfile(null);
  };

  // ─── Profile methods ───────────────────────────────────────────────────────

  const updateUsername = async (displayName: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();
    if (!error && data) setProfile(data as Profile);
  };

  const setDisplayName = useCallback(async (value: string): Promise<{ error: string | null }> => {
    if (!user?.id) return { error: 'Utilisateur non connecté.' };

    const normalized = value.trim();
    if (!USERNAME_RE.test(normalized)) {
      return { error: 'Pseudo invalide (3-20 caractères, lettres/chiffres/underscore).' };
    }

    try {
      const { data: conflictExists, error: conflictError } = await supabase.rpc('is_display_name_taken', {
        display_name: normalized,
        current_user_id: user.id,
      });

      if (conflictError) {
        if (import.meta.env.DEV) console.error('PROFILE_CHECK_CONFLICT_ERROR', { code: conflictError.code || 'UNKNOWN', message: conflictError.message });
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
        if (import.meta.env.DEV) console.error('PROFILE_UPDATE_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
        return { error: 'Erreur technique. Veuillez réessayer plus tard.' };
      }

      setProfile(data as Profile);
      return { error: null };
    } catch (err) {
      const error = err as Error & { code?: string };
      if (import.meta.env.DEV) console.error('PROFILE_SET_NAME_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
      return { error: 'Erreur technique. Veuillez réessayer plus tard.' };
    }
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const username = profile?.display_name ?? null;

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      profile, username, profileLoading,
      signUp, signIn, signInWithGoogle, signOut,
      updateUsername, setDisplayName, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
