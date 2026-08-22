import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthProvider';

const authKit = vi.hoisted(() => ({
  authHeader: vi.fn(),
  authUser: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn()
}));

vi.mock('react-auth-kit/hooks/useAuthHeader', () => ({
  default: () => authKit.authHeader()
}));

vi.mock('react-auth-kit/hooks/useAuthUser', () => ({
  default: () => authKit.authUser()
}));

vi.mock('react-auth-kit/hooks/useSignIn', () => ({
  default: () => authKit.signIn
}));

vi.mock('react-auth-kit/hooks/useSignOut', () => ({
  default: () => authKit.signOut
}));

vi.mock('react-auth-kit/store/createAuthStore', () => ({
  default: () => ({})
}));

vi.mock('react-auth-kit/AuthProvider', () => ({
  default: ({ children }: PropsWithChildren) => <>{children}</>
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    authKit.authHeader.mockReturnValue('Bearer access-token');
    authKit.authUser.mockReturnValue({ username: 'ana@example.com' });
    authKit.signIn.mockReturnValue(true);
    authKit.signOut.mockReturnValue(undefined);
  });

  it('uses react-auth-kit as the auth state store', () => {
    const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe('access-token');

    result.current.setToken('manual-token');
    result.current.clearToken();

    expect(authKit.signIn).toHaveBeenCalledWith({
      auth: { token: 'manual-token', type: 'Bearer' },
      userState: null
    });
    expect(authKit.signOut).toHaveBeenCalled();
  });
});
