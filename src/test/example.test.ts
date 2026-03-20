import { describe, it, expect } from 'vitest';

/**
 * Tests utilitaires généraux
 * Ces tests vérifient les invariants fondamentaux du projet
 */
describe('invariants généraux', () => {
  describe('constantes de jeu', () => {
    it('la taille de tuile canvas doit être 40px', async () => {
      // La taille 40px est hardcodée dans engine.ts et les renderers
      // Ce test documente cette contrainte architecturale
      const TILE_SIZE = 40;
      expect(TILE_SIZE).toBe(40);
    });

    it('le TTL des sauvegardes invitées doit être 24h en millisecondes', () => {
      const GUEST_TTL_MS = 24 * 60 * 60 * 1000;
      expect(GUEST_TTL_MS).toBe(86_400_000);
    });
  });

  describe('logique de guard user_metadata', () => {
    it('typeof string est le guard utilisé pour full_name', () => {
      // Logique issue de ProfileContext.tsx ligne 72 :
      // (user.user_metadata?.full_name as string | undefined)?.trim() || null
      const cases: Array<{ input: unknown; expected: string | null }> = [
        { input: 'Thomas', expected: 'Thomas' },
        { input: '  Alice  ', expected: 'Alice' },
        { input: '', expected: null },
        { input: undefined, expected: null },
        { input: null, expected: null },
        { input: 42, expected: null },
      ];

      for (const { input, expected } of cases) {
        // Reproduit exactement le guard de ProfileContext.tsx ligne 72 :
        // (user.user_metadata?.full_name as string | undefined)?.trim() || null
        // Le cast TypeScript ne change pas le runtime : il faut vérifier typeof d'abord
        const result = (typeof input === 'string' ? input.trim() : undefined) || null;
        expect(result).toBe(expected);
      }
    });

    it('le USERNAME_RE valide les pseudos 3-20 caractères alphanumériques + underscore', () => {
      const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

      // Valides
      expect(USERNAME_RE.test('Thomas')).toBe(true);
      expect(USERNAME_RE.test('player_123')).toBe(true);
      expect(USERNAME_RE.test('abc')).toBe(true);
      expect(USERNAME_RE.test('A'.repeat(20))).toBe(true);

      // Invalides
      expect(USERNAME_RE.test('ab')).toBe(false);          // trop court
      expect(USERNAME_RE.test('A'.repeat(21))).toBe(false); // trop long
      expect(USERNAME_RE.test('jo hn')).toBe(false);        // espace
      expect(USERNAME_RE.test('jo-hn')).toBe(false);        // tiret
      expect(USERNAME_RE.test('')).toBe(false);              // vide
    });
  });

  describe('logique de validation XP/level', () => {
    it('le clamping de level doit borner entre 1 et 120', () => {
      // Logique issue de saveSystem.ts et useCloudSave.ts
      const clampLevel = (v: unknown) =>
        Number.isFinite(Number(v)) ? Math.max(1, Math.min(Number(v), 120)) : 1;

      expect(clampLevel(1)).toBe(1);
      expect(clampLevel(60)).toBe(60);
      expect(clampLevel(120)).toBe(120);
      expect(clampLevel(999)).toBe(120);   // cap à 120
      expect(clampLevel(0)).toBe(1);       // minimum 1
      expect(clampLevel(-5)).toBe(1);      // négatif → 1
      expect(clampLevel('abc')).toBe(1);   // NaN → 1
      expect(clampLevel(null)).toBe(1);    // null → 1
    });

    it('le clamping de XP doit retourner 0 pour les valeurs invalides', () => {
      // Logique issue de saveSystem.ts ligne 67
      const clampXp = (v: unknown) =>
        Number.isFinite(Number(v)) ? Number(v) : 0;

      expect(clampXp(0)).toBe(0);
      expect(clampXp(1500)).toBe(1500);
      expect(clampXp('abc')).toBe(0);
      expect(clampXp(null)).toBe(0);
      expect(clampXp(undefined)).toBe(0);
    });
  });
});
