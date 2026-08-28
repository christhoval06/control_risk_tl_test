import { beforeEach, describe, expect, it, vi } from 'vitest';

const msalBrowser = vi.hoisted(() => ({
  PublicClientApplication: vi.fn()
}));

vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: msalBrowser.PublicClientApplication
}));

describe('authClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    msalBrowser.PublicClientApplication.mockClear();
  });

  it('normalizes Microsoft Entra v2 metadata authority values for MSAL Browser', async () => {
    vi.stubEnv('VITE_AUTH_CLIENT_ID', 'spa-client-id');
    vi.stubEnv('VITE_AUTH_AUTHORITY', 'https://login.microsoftonline.com/tenant-id/v2.0');
    vi.stubEnv('VITE_AUTH_SCOPE', 'api://api-client-id/Tasks.Access');

    const { createMsalClient } = await import('./authClient');

    createMsalClient();

    expect(msalBrowser.PublicClientApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: expect.objectContaining({
          authority: 'https://login.microsoftonline.com/tenant-id'
        })
      })
    );
  });
});
