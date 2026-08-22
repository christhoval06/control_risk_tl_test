import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLogin } from '@api/hooks/default/useLogin';
import { apiBaseUrl } from '@configs/api';
import { useAuth } from '@features/auth/providers/AuthProvider';

function LoginPage() {
  const navigate = useNavigate();
  const { token, isMsalReady, login, setToken } = useAuth();
  const [manualToken, setManualToken] = useState('');
  const [startedBrokerLogin, setStartedBrokerLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLogin({ client: { baseURL: apiBaseUrl, auth: token } });

  useEffect(() => {
    if (!token || loginMutation.isPending || loginMutation.isSuccess) return;

    loginMutation
      .mutateAsync(undefined)
      .then(() => navigate('/tasks'))
      .catch(() => setError('Unable to complete login with the API.'));
  }, [loginMutation, navigate, token]);

  const startLogin = async () => {
    setError(null);
    setStartedBrokerLogin(true);
    try {
      await login();
    } catch {
      setStartedBrokerLogin(false);
      setError('Unable to start external login.');
    }
  };

  const useManualToken = () => {
    setError(null);
    setToken(manualToken.trim());
  };

  return (
    <main className="mx-auto grid min-h-screen w-[min(760px,calc(100%-32px))] content-center py-8">
      <section className="task-panel">
        <p className="mb-1 text-sm font-bold uppercase text-mint">External identity</p>
        <h1 className="text-4xl font-black text-slate-950">Login</h1>
        <p className="mt-3 text-sm text-slate-600">
          Use the configured identity broker to sign in with Microsoft, Google, or GitHub. The API receives one validated bearer token.
        </p>

        <div className="mt-6 grid gap-3">
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!isMsalReady || startedBrokerLogin || loginMutation.isPending}
            onClick={() => void startLogin()}
          >
            Continue with identity provider
          </button>
          {!isMsalReady && (
            <p className="text-sm text-slate-500">
              Configure `VITE_AUTH_CLIENT_ID`, `VITE_AUTH_AUTHORITY`, and `VITE_AUTH_SCOPE` to enable broker login.
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-2">
          <label className="form-label" htmlFor="manual-token">Local bearer token</label>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              id="manual-token"
              className="form-field"
              type="password"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="eyJ..."
            />
            <button className="rounded-md border px-4 py-2 text-sm font-semibold text-slate-700" onClick={useManualToken}>
              Use token
            </button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <p className="mt-5 text-sm text-slate-600">
          Need a local profile? <Link className="font-semibold text-teal-700" to="/register">Register after login</Link>
        </p>
      </section>
    </main>
  );
}

export const Component = LoginPage;
