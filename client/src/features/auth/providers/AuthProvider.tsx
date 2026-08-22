import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AccountInfo, PublicClientApplication } from '@azure/msal-browser';
import ReactAuthProvider from 'react-auth-kit/AuthProvider';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import createAuthStore from 'react-auth-kit/store/createAuthStore';
import { authScope, createMsalClient, isMsalConfigured } from '@features/auth/config/authClient';

interface AuthUserState {
  username?: string;
  account?: AccountInfo | null;
}

interface AuthContextValue {
  token: string;
  account: AuthUserState | null;
  isMsalReady: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const authStore = createAuthStore<AuthUserState>('localstorage', { authName: 'task-token' });

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ReactAuthProvider store={authStore}>
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </ReactAuthProvider>
  );
}

function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [msalClient] = useState<PublicClientApplication | null>(() => createMsalClient());
  const authHeader = useAuthHeader();
  const authUser = useAuthUser<AuthUserState | null>();
  const signIn = useSignIn<AuthUserState | null>();
  const signOut = useSignOut();
  const token = normalizeBearerToken(authHeader);
  const account = authUser ?? null;

  const value = useMemo<AuthContextValue>(() => ({
    token,
    account,
    isMsalReady: Boolean(msalClient && isMsalConfigured()),
    setToken: (nextToken) => {
      if (!nextToken) {
        signOut();
        return;
      }
      signIn({ auth: { token: nextToken, type: 'Bearer' }, userState: null });
    },
    clearToken: () => {
      signOut();
    },
    login: async () => {
      if (!msalClient) return;
      await msalClient.initialize();
      const loginResult = await msalClient.loginPopup({ scopes: [authScope] });
      const tokenResult = await msalClient.acquireTokenSilent({
        account: loginResult.account,
        scopes: [authScope]
      });
      signIn({
        auth: { token: tokenResult.accessToken, type: 'Bearer' },
        userState: {
          username: loginResult.account.username,
          account: loginResult.account
        }
      });
    },
    logout: async () => {
      signOut();
      await msalClient?.logoutPopup();
    }
  }), [account, msalClient, signIn, signOut, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}

function normalizeBearerToken(authHeader: string | null | undefined) {
  if (!authHeader) return '';
  return authHeader.replace(/^Bearer\s+/i, '');
}
