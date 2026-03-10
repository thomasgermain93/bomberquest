import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bomb, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') === 'login' ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/game');
  }, [user, navigate]);

  // Handle OAuth error redirects (e.g. Google OAuth not configured)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const errorDescription = params.get('error_description') || params.get('error') || 'Erreur de connexion';
      toast.error(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    const errorParam = searchParams.get('error_description') || searchParams.get('error');
    if (errorParam) {
      toast.error(decodeURIComponent(errorParam.replace(/\+/g, ' ')));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'signup' && password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setLoading(true);
    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, displayName || undefined);
    setLoading(false);
    if (error) {
      if (error.message === 'Email not confirmed') {
        toast.error('Email non confirmé. Vérifie ta boîte mail et clique sur le lien de confirmation.');
      } else if (error.message === 'Invalid login credentials') {
        toast.error('Email ou mot de passe incorrect.');
      } else {
        toast.error(error.message);
      }
    } else if (mode === 'signup') {
      toast.success('Compte créé ! Vérifie ton email pour confirmer. (Pense à regarder les spams)');
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Retour</span>
        </button>

        <div className="pixel-border bg-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <PixelIcon icon="bomb" size={28} color="hsl(var(--primary))" />
            </div>
            <h1 className="font-pixel text-sm text-foreground text-glow-red">
              BOMBER<span className="text-primary">QUEST</span>
            </h1>
            <p className="font-pixel text-[8px] text-muted-foreground mt-2">
              {mode === 'login' ? 'CONNEXION' : 'CRÉER UN COMPTE'}
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full pixel-border bg-muted hover:bg-muted/80 p-3 flex items-center justify-center gap-3 transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-pixel text-[8px] text-foreground">
              {mode === 'login' ? 'Connexion avec Google' : 'Inscription avec Google'}
            </span>
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="font-pixel text-[7px] text-muted-foreground">OU</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="font-pixel text-[7px] text-muted-foreground mb-1 block">NOM DE JOUEUR</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full pixel-border bg-muted pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Bomber42"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="font-pixel text-[7px] text-muted-foreground mb-1 block">EMAIL</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pixel-border bg-muted pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="ton@email.com"
                />
              </div>
            </div>
            <div>
              <label className="font-pixel text-[7px] text-muted-foreground mb-1 block">MOT DE PASSE</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pixel-border bg-muted pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="pixel-btn pixel-btn-gold w-full font-pixel text-[9px] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Bomb size={14} />}
              {mode === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center mt-4">
              <button
                onClick={async () => {
                  if (!email) { toast.error("Entre ton email d'abord"); return; }
                  setLoading(true);
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  setLoading(false);
                  if (error) toast.error(error.message);
                  else toast.success('Email de réinitialisation envoyé !');
                }}
                className="font-pixel text-[7px] text-muted-foreground hover:text-primary hover:underline transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </p>
          )}

          <p className="text-center mt-4">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="font-pixel text-[7px] text-primary hover:underline"
            >
              {mode === 'login' ? "Pas de compte ? Inscris-toi !" : "Déjà un compte ? Connecte-toi !"}
            </button>
          </p>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="font-pixel text-[7px] text-muted-foreground">OU</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={() => navigate('/game')}
            className="w-full font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            CONTINUER EN INVITÉ (sans sauvegarde cloud)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
