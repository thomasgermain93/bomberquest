import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getProfile, createProfileIfNotExists, updateProfileDisplayName, Profile } from '@/lib/profileService';
import { RETRY_DELAY_MS } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  username: string | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateUsername: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const MAX_RETRIES = 1;

async function fetchProfileWithRetry(userId: string, retryCount = 0): Promise<Profile | null> {
  try {
    const profileData = await getProfile(userId);
    return profileData;
  } catch (err) {
    const error = err as Error & { code?: string };
    console.error('AUTH_PROFILE_FETCH_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
    
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return fetchProfileWithRetry(userId, retryCount + 1);
    }
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const profileData = await fetchProfileWithRetry(userId);
    if (profileData) {
      setProfile(profileData);
    }
  }, []);

  const initializeProfile = useCallback(async (userId: string, displayName?: string) => {
    try {
      const profileData = await createProfileIfNotExists(userId, displayName);
      setProfile(profileData);
    } catch (err) {
      const error = err as Error & { code?: string };
      console.error('AUTH_PROFILE_INIT_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
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
        console.error('AUTH_SESSION_GET_ERROR', { code: 'SESSION_GET_FAILED', message: err.message });
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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

  const updateUsername = async (displayName: string) => {
    if (!user) return;
    const updated = await updateProfileDisplayName(user.id, displayName);
    setProfile(updated);
  };

  const username = profile?.display_name ?? null;

  return (
    <AuthContext.Provider value={{ user, session, profile, username, loading, signUp, signIn, signInWithGoogle, signOut, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
