import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('delete_user_account RPC', () => {
  it('calls supabase.rpc delete_user_account, not auth.admin', () => {
    // Vérifie que le bon pattern est utilisé dans Profile.tsx
    // Ce test documente la régression à éviter
    const profileCode = `supabase.rpc('delete_user_account')`;
    const forbiddenCode = `supabase.auth.admin.deleteUser`;

    const code = readFileSync(resolve(__dirname, '../pages/Profile.tsx'), 'utf8');

    expect(code).toContain(profileCode);
    expect(code).not.toContain(forbiddenCode);
  });
});
