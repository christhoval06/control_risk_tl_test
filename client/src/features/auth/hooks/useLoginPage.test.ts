import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoginPage } from './useLoginPage';

const auth = vi.hoisted(() => ({
  login: vi.fn(),
  useAuth: vi.fn()
}));

const generated = vi.hoisted(() => ({
  completeLogin: vi.fn(),
  hookLogin: vi.fn()
}));

const router = vi.hoisted(() => ({
  navigate: vi.fn()
}));

vi.mock('@features/auth/providers/AuthProvider', () => ({
  useAuth: auth.useAuth
}));

vi.mock('@api/client/default/login', () => ({
  login: generated.completeLogin
}));

vi.mock('@api/hooks/default/useLogin', () => ({
  useLogin: generated.hookLogin
}));

vi.mock('react-router', () => ({
  useNavigate: () => router.navigate
}));

describe('useLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.login.mockResolvedValue('entra-token');
    auth.useAuth.mockReturnValue({
      token: 'existing-token',
      isMsalReady: true,
      login: auth.login
    });
    generated.completeLogin.mockResolvedValue({ data: { status: 'ok' } });
    generated.hookLogin.mockReturnValue({
      mutateAsync: generated.completeLogin,
      isPending: false,
      isSuccess: false
    });
  });

  it('does not complete API login as a render side effect', async () => {
    renderHook(() => useLoginPage());

    await act(async () => {
      await Promise.resolve();
    });

    expect(generated.completeLogin).not.toHaveBeenCalled();
  });

  it('completes API login once after Microsoft Entra login succeeds', async () => {
    const { result } = renderHook(() => useLoginPage());

    await act(async () => {
      await result.current.startLogin();
    });

    expect(generated.completeLogin).toHaveBeenCalledTimes(1);
    expect(generated.completeLogin).toHaveBeenCalledWith({
      baseURL: 'http://localhost:7071/api',
      auth: 'entra-token',
      throwOnError: true
    });
    expect(router.navigate).toHaveBeenCalledWith('/tasks');
  });
});
