import { PublicClientApplication, type Configuration } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AUTH_CLIENT_ID;
const authority = normalizeAuthority(import.meta.env.VITE_AUTH_AUTHORITY);
const redirectUri = import.meta.env.VITE_AUTH_REDIRECT_URI ?? window.location.origin;

export const authScope = import.meta.env.VITE_AUTH_SCOPE ?? '';

export function isMsalConfigured() {
  return Boolean(clientId && authority && authScope);
}

export function createMsalClient() {
  if (!clientId || !authority) {
    return null;
  }

  const config: Configuration = {
    auth: {
      clientId,
      authority,
      redirectUri
    },
    cache: {
      cacheLocation: 'sessionStorage'
    }
  };

  return new PublicClientApplication(config);
}

function normalizeAuthority(value: string | undefined) {
  if (!value) return value;

  return value.replace(/\/+$/, '').replace(/\/v2\.0$/i, '');
}
