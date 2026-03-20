import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';
import { toast } from 'sonner';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setHasRecoveryToken(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasRecoveryToken(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success('Mot de passe mis à jour !');
      setTimeout(() => navigate('/game'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm z-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
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
            <p className="font-pixel text-[8px] text-muted-foreground mt-2">NOUVEAU MOT DE PASSE</p>
          </div>

          {success ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto text-game-green mb-4" />
              <p className="font-pixel text-[9px] text-foreground mb-2">MOT DE PASSE MIS À JOUR !</p>
              <p className="text-xs text-muted-foreground">Redirection vers le jeu...</p>
            </div>
          ) : !hasRecoveryToken ? (
            <div className="text-center py-6">
              <Lock size={32} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Ce lien n'est pas valide ou a expiré. Demande un nouveau lien de réinitialisation.
              </p>
              <button onClick={() => navigate('/auth?mode=login')} className="pixel-btn pixel-btn-secondary font-pixel text-[8px]">
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-pixel text-[7px] text-muted-foreground mb-1 block">NOUVEAU MOT DE PASSE</label>
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
              <div>
                <label className="font-pixel text-[7px] text-muted-foreground mb-1 block">CONFIRMER</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pixel-border bg-muted pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="••••••"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="pixel-btn pixel-btn-gold w-full font-pixel text-[9px] flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                CHANGER LE MOT DE PASSE
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
