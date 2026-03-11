import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/hooks/use-toast';

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function UsernameRequiredDialog() {
  const { user } = useAuth();
  const { profile, loading, setDisplayName } = useProfile();
  const location = useLocation();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const open = useMemo(() => {
    if (!user || loading) return false;
    if (location.pathname === '/auth' || location.pathname === '/reset-password') return false;
    return !profile?.display_name;
  }, [user, loading, profile?.display_name, location.pathname]);

  useEffect(() => {
    if (open) {
      setValue('');
      setLocalError(null);
    }
  }, [open]);

  const validateLocal = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Le pseudo est requis.';
    if (!USERNAME_RE.test(trimmed)) {
      return 'Pseudo invalide (3-20 caractères, lettres/chiffres/underscore).';
    }
    return null;
  };

  const submit = async () => {
    const validationError = validateLocal(value);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    setSaving(true);
    const { error } = await setDisplayName(value);
    setSaving(false);

    if (error) {
      toast({ title: 'Erreur', description: error, variant: 'destructive' });
      return;
    }

    toast({ title: 'Pseudo enregistré', description: 'Ton profil est prêt ✅' });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisis ton pseudo</DialogTitle>
          <DialogDescription>
            Ce pseudo sera visible en jeu (3-20 caractères, lettres/chiffres/underscore).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setLocalError(null);
              }}
              placeholder="ex: bomber_king"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            {localError && (
              <p className="text-sm text-destructive">{localError}</p>
            )}
          </div>
          <Button className="w-full" onClick={submit} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer mon pseudo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
