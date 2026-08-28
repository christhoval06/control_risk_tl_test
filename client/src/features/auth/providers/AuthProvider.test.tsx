import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthProvider';

const authKit = vi.hoisted(() => ({
  authHeader: vi.fn(),
  authUser: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const authClient = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn(),
  createMsalClient: vi.fn(),
  initialize: vi.fn(),
  isMsalConfigured: vi.fn(),
  loginPopup: vi.fn(),
  logoutPopup: vi.fn(),
}));

vi.mock('@features/auth/config/authClient', () => ({
  authScope: 'api://task-api/Tasks.Access',
  createMsalClient: authClient.createMsalClient,
  isMsalConfigured: authClient.isMsalConfigured,
}));

vi.mock('react-auth-kit/hooks/useAuthHeader', () => ({
  default: () => authKit.authHeader(),
}));

vi.mock('react-auth-kit/hooks/useAuthUser', () => ({
  default: () => authKit.authUser(),
}));

vi.mock('react-auth-kit/hooks/useSignIn', () => ({
  default: () => authKit.signIn,
}));

vi.mock('react-auth-kit/hooks/useSignOut', () => ({
  default: () => authKit.signOut,
}));

vi.mock('react-auth-kit/store/createAuthStore', () => ({
  default: () => ({}),
}));

vi.mock('react-auth-kit/AuthProvider', () => ({
  default: ({ children }: PropsWithChildren) => <>{children}</>,
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authKit.authHeader.mockReturnValue('Bearer access-token');
    authKit.authUser.mockReturnValue({ username: 'ana@example.com' });
    authKit.signIn.mockReturnValue(true);
    authKit.signOut.mockReturnValue(undefined);
    authClient.initialize.mockResolvedValue(undefined);
    authClient.loginPopup.mockResolvedValue({
      account: {
        username: 'ana@example.com',
      },
    });
    authClient.acquireTokenSilent.mockResolvedValue({ accessToken: 'entra-token' });
    authClient.logoutPopup.mockResolvedValue(undefined);
    authClient.isMsalConfigured.mockReturnValue(true);
    authClient.createMsalClient.mockReturnValue({
      acquireTokenSilent: authClient.acquireTokenSilent,
      initialize: authClient.initialize,
      loginPopup: authClient.loginPopup,
      logoutPopup: authClient.logoutPopup,
    });
  });

  it('uses react-auth-kit as the auth session store', () => {
    const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe('access-token');
    expect(result.current.account?.username).toBe('ana@example.com');
  });

  it('reuses an in-flight Microsoft Entra login interaction', async () => {
    let completeLogin!: () => void;
    authClient.loginPopup.mockReturnValue(
      new Promise((resolve) => {
        completeLogin = () => resolve({ account: { username: 'ana@example.com' } });
      }),
    );
    const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    const firstLogin = result.current.login();
    const secondLogin = result.current.login();

    completeLogin();
    await Promise.all([firstLogin, secondLogin]);

    expect(authClient.loginPopup).toHaveBeenCalledTimes(1);
    expect(authKit.signIn).toHaveBeenCalledWith({
      auth: { token: 'entra-token', type: 'Bearer' },
      userState: {
        username: 'ana@example.com',
        account: { username: 'ana@example.com' },
      },
    });
  });

  it('allows a new popup login to recover from a stale MSAL interaction flag', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.login();

    expect(authClient.loginPopup).toHaveBeenCalledWith({
      scopes: ['api://task-api/Tasks.Access'],
      overrideInteractionInProgress: true,
    });
  });

  it('exposes the Microsoft Entra token immediately after react-auth-kit stores it', async () => {
    authKit.authHeader.mockReturnValue('');
    authKit.authUser.mockReturnValue(null);
    const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    let token = '';
    await act(async () => {
      token = await result.current.login();
    });

    expect(token).toBe('entra-token');
    expect(result.current.token).toBe('entra-token');
    expect(result.current.account?.username).toBe('ana@example.com');
  });
});
