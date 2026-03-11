import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, Loader2, AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, setDisplayName, refreshProfile } = useProfile();
  const navigate = useNavigate();
  
  const [displayName, setDisplayNameState] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);
  
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayNameState(profile.display_name);
    }
  }, [profile?.display_name]);
  
  const handleSaveUsername = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setLocalError('Le pseudo est requis.');
      return;
    }
    if (!USERNAME_RE.test(trimmed)) {
      setLocalError('Pseudo invalide (3-20 caractères, lettres/chiffres/underscore).');
      return;
    }
    
    setLocalError(null);
    setSaving(true);
    const { error } = await setDisplayName(displayName);
    setSaving(false);
    
    if (error) {
      toast({ title: 'Erreur', description: error, variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Pseudo enregistré', description: 'Ton pseudo a été mis à jour.' });
  };
  
  const handleDeleteAccount = async () => {
    if (!user || !profile?.display_name) return;
    if (confirmUsername !== profile.display_name) {
      toast({ 
        title: 'Confirmation incorrecte', 
        description: 'Le pseudo doit correspondre exactement pour supprimer le compte.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setDeleting(true);
    
    try {
      const userId = user.id;
      
      await supabase.from('player_saves').delete().eq('user_id', userId);
      await supabase.from('player_heroes').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('user_id', userId);
      
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError);
        toast({ 
          title: 'Erreur', 
          description: 'Impossible de supprimer le compte. Veuillez réessayer.', 
          variant: 'destructive' 
        });
        setDeleting(false);
        return;
      }
      
      await signOut();
      toast({ title: 'Compte supprimé', description: 'Ton compte a été supprimé avec succès.' });
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      toast({ 
        title: 'Erreur', 
        description: 'Une erreur est survenue lors de la suppression du compte.', 
        variant: 'destructive' 
      });
      setDeleting(false);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center py-4">
            <h1 className="font-pixel text-xl text-foreground">Profil</h1>
            <p className="text-sm text-muted-foreground">Gère ton compte</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations du profil
              </CardTitle>
              <CardDescription>
                Ton pseudo est visible en jeu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pseudo</label>
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => {
                      setDisplayNameState(e.target.value);
                      setLocalError(null);
                    }}
                    placeholder="Ton pseudo"
                    maxLength={20}
                    disabled={saving}
                  />
                  <Button onClick={handleSaveUsername} disabled={saving || !displayName.trim()}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                  </Button>
                </div>
                {localError && (
                  <p className="text-xs text-destructive">{localError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3-20 caractères, lettres, chiffres et underscore uniquement
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={user.email || ''} disabled />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Déconnexion
              </CardTitle>
              <CardDescription>
                Te déconnecter de ton compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Zone dangereuse
              </CardTitle>
              <CardDescription>
                La suppression du compte est irréversible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  Cette action supprimera définitivement ton compte, tous tes héros et ta progression. Cette action est irréversible.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tape "{profile?.display_name || 'ton pseudo'}" pour confirmer
                </label>
                <Input
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value)}
                  placeholder="Confirme ton pseudo"
                  disabled={deleting}
                />
              </div>
              
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={deleting || confirmUsername !== profile?.display_name}
                className="w-full"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suppression en cours...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer mon compte
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
