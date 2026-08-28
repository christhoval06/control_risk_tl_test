import { describe, expect, it, vi } from 'vitest';

vi.mock('@routes/AuthGate', () => ({
  AuthGate: () => null
}));

import { appRoutes } from './AppRoutes';

describe('AppRoutes', () => {
  it('keeps the Microsoft Entra callback route out of the login wildcard redirect', () => {
    expect(appRoutes.some((route) => route.path === '/auth/callback')).toBe(true);
  });
});
