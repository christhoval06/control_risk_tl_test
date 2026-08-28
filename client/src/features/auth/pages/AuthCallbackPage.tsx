import { useEffect } from 'react';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

function AuthCallbackPage() {
  useEffect(() => {
    void broadcastResponseToMainFrame();
  }, []);

  return (
    <main aria-label="Completing sign in" className="grid min-h-screen place-items-center text-sm text-slate-500">
      <p role="status">Completing sign in...</p>
    </main>
  );
}

export const Component = AuthCallbackPage;
