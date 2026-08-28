import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
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
  login: () => Promise<string>;
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
  const loginPromiseRef = useRef<Promise<string> | null>(null);
  const authHeader = useAuthHeader();
  const authUser = useAuthUser<AuthUserState | null>();
  const signIn = useSignIn<AuthUserState | null>();
  const signOut = useSignOut();
  const [sessionToken, setSessionToken] = useState(() => normalizeBearerToken(authHeader));
  const [sessionAccount, setSessionAccount] = useState<AuthUserState | null>(() => authUser ?? null);
  const token = sessionToken || normalizeBearerToken(authHeader);
  const account = sessionAccount ?? authUser ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      account,
      isMsalReady: Boolean(msalClient && isMsalConfigured()),
      login: async () => {
        if (!msalClient) return '';
        if (loginPromiseRef.current) {
          return loginPromiseRef.current;
        }

        loginPromiseRef.current = (async () => {
          await msalClient.initialize();
          const loginResult = await msalClient.loginPopup({
            scopes: [authScope],
            overrideInteractionInProgress: true,
          });
          const tokenResult = await msalClient.acquireTokenSilent({
            account: loginResult.account,
            scopes: [authScope],
          });
          const nextAccount = {
            username: loginResult.account.username,
            account: loginResult.account,
          };
          const didSignIn = signIn({
            auth: { token: tokenResult.accessToken, type: 'Bearer' },
            userState: nextAccount,
          });
          if (!didSignIn) {
            throw new Error('Unable to store Microsoft Entra session.');
          }

          setSessionToken(tokenResult.accessToken);
          setSessionAccount(nextAccount);
          return tokenResult.accessToken;
        })().finally(() => {
          loginPromiseRef.current = null;
        });

        return loginPromiseRef.current;
      },
      logout: async () => {
        signOut();
        setSessionToken('');
        setSessionAccount(null);
        await msalClient?.logoutPopup();
      },
    }),
    [account, authHeader, msalClient, sessionToken, signIn, signOut, token],
  );

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
