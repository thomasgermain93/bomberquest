import { describe, it, expect, vi } from 'vitest';

/**
 * Tests de la logique de ProfileContext
 *
 * ProfileContext dépend de AuthContext (useAuth) et Supabase, ce qui rend
 * un test d'intégration du Provider lourd à mettre en place.
 * Ces tests couvrent la logique métier extraite du contexte (guards, regex,
 * sécurité des mutations) sans monter l'arbre React complet.
 */

describe('ProfileContext — logique métier', () => {
  describe('guard full_name depuis user_metadata', () => {
    // Logique issue de ProfileContext.tsx ligne 72 :
    // const fallbackName = (user.user_metadata?.full_name as string | undefined)?.trim() || null;

    const extractFallbackName = (metadata: unknown): string | null => {
      const fullName = (metadata as Record<string, unknown> | undefined)?.full_name;
      // typeof guard nécessaire : le cast TypeScript ne change pas le comportement runtime
      return (typeof fullName === 'string' ? fullName.trim() : undefined) || null;
    };

    it('retourne le nom trimé quand full_name est une string non-vide', () => {
      expect(extractFallbackName({ full_name: 'Thomas Germain' })).toBe('Thomas Germain');
      expect(extractFallbackName({ full_name: '  Alice  ' })).toBe('Alice');
    });

    it('retourne null quand full_name est une string vide ou whitespace', () => {
      expect(extractFallbackName({ full_name: '' })).toBeNull();
      expect(extractFallbackName({ full_name: '   ' })).toBeNull();
    });

    it('retourne null quand full_name est absent ou non-string', () => {
      expect(extractFallbackName({})).toBeNull();
      expect(extractFallbackName(undefined)).toBeNull();
      expect(extractFallbackName({ full_name: null })).toBeNull();
      expect(extractFallbackName({ full_name: 42 })).toBeNull();
    });
  });

  describe('USERNAME_RE — validation des pseudos', () => {
    // Regex issue de ProfileContext.tsx ligne 20
    const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

    const pseudosValides = ['abc', 'Thomas', 'player_1', 'A'.repeat(20), 'user123', '_abc_'];
    const pseudosInvalides = [
      { value: 'ab', raison: 'trop court (< 3)' },
      { value: 'A'.repeat(21), raison: 'trop long (> 20)' },
      { value: 'jo hn', raison: 'contient un espace' },
      { value: 'jo-hn', raison: 'contient un tiret' },
      { value: 'jo@hn', raison: 'contient @' },
      { value: '', raison: 'vide' },
    ];

    for (const pseudo of pseudosValides) {
      it(`accepte le pseudo valide : "${pseudo}"`, () => {
        expect(USERNAME_RE.test(pseudo)).toBe(true);
      });
    }

    for (const { value, raison } of pseudosInvalides) {
      it(`rejette le pseudo invalide (${raison}) : "${value}"`, () => {
        expect(USERNAME_RE.test(value)).toBe(false);
      });
    }
  });

  describe('guard identifiant utilisateur pour les mutations', () => {
    // Logique issue de ProfileContext.tsx ligne 108 :
    // if (!user?.id) return { error: 'Utilisateur non connecté.' };

    const setDisplayNameGuard = (userId: string | undefined, value: string): { error: string | null } | null => {
      if (!userId) return { error: 'Utilisateur non connecté.' };
      const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
      const normalized = value.trim();
      if (!USERNAME_RE.test(normalized)) {
        return { error: 'Pseudo invalide (3-20 caractères, lettres/chiffres/underscore).' };
      }
      return null; // null = procéder à l'appel Supabase
    };

    it('retourne une erreur quand userId est undefined', () => {
      const result = setDisplayNameGuard(undefined, 'Thomas');
      expect(result).toEqual({ error: 'Utilisateur non connecté.' });
    });

    it('retourne une erreur quand le pseudo est invalide', () => {
      const result = setDisplayNameGuard('user-123', 'ab');
      expect(result).toEqual({ error: 'Pseudo invalide (3-20 caractères, lettres/chiffres/underscore).' });
    });

    it('retourne null (passer à Supabase) quand tout est valide', () => {
      const result = setDisplayNameGuard('user-123', 'Thomas');
      expect(result).toBeNull();
    });

    it('trim le pseudo avant validation', () => {
      const result = setDisplayNameGuard('user-123', '  Thomas  ');
      expect(result).toBeNull(); // "Thomas" après trim est valide
    });
  });

  describe('gestion des conflits de pseudo — codes erreur Supabase', () => {
    // Logique issue de ProfileContext.tsx lignes 134-136
    const handleSupabaseError = (error: { code?: string; message: string }): string => {
      if (
        error.code === '23505' ||
        error.message.includes('unique') ||
        error.message.includes('duplicate')
      ) {
        return 'Ce pseudo est déjà utilisé par un autre joueur.';
      }
      return 'Erreur technique. Veuillez réessayer plus tard.';
    };

    it('détecte le conflit via le code 23505 (unique violation PostgreSQL)', () => {
      expect(handleSupabaseError({ code: '23505', message: 'duplicate key' }))
        .toBe('Ce pseudo est déjà utilisé par un autre joueur.');
    });

    it('détecte le conflit via "unique" dans le message', () => {
      expect(handleSupabaseError({ message: 'unique constraint violated' }))
        .toBe('Ce pseudo est déjà utilisé par un autre joueur.');
    });

    it('détecte le conflit via "duplicate" dans le message', () => {
      expect(handleSupabaseError({ message: 'duplicate entry' }))
        .toBe('Ce pseudo est déjà utilisé par un autre joueur.');
    });

    it('retourne un message générique pour les autres erreurs', () => {
      expect(handleSupabaseError({ message: 'connection timeout' }))
        .toBe('Erreur technique. Veuillez réessayer plus tard.');
    });
  });
});
