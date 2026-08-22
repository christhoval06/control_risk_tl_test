import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useRegister } from '@api/hooks/default/useRegister';
import { apiBaseUrl } from '@configs/api';
import { useAuth } from '@features/auth/providers/AuthProvider';

function RegisterPage() {
  const navigate = useNavigate();
  const { token, account } = useAuth();
  const [displayName, setDisplayName] = useState(account?.username ?? '');
  const [email, setEmail] = useState(account?.username ?? '');
  const [error, setError] = useState<string | null>(null);
  const registerMutation = useRegister({ client: { baseURL: apiBaseUrl, auth: token } });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await registerMutation.mutateAsync({
        body: {
          displayName: displayName.trim(),
          email: email.trim() || undefined
        }
      });
      navigate('/tasks');
    } catch {
      setError('Unable to register the local profile.');
    }
  };

  return (
    <main className="mx-auto grid min-h-screen w-[min(720px,calc(100%-32px))] content-center py-8">
      <form className="task-panel" onSubmit={(event) => void submit(event)}>
        <p className="mb-1 text-sm font-bold uppercase text-mint">Application profile</p>
        <h1 className="text-4xl font-black text-slate-950">Register</h1>
        <p className="mt-3 text-sm text-slate-600">
          Your Microsoft, Google, or GitHub account owns identity. This profile stores app-specific user data.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <label className="form-label" htmlFor="display-name">Display name</label>
            <input
              id="display-name"
              className="form-field"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={registerMutation.isPending}
            type="submit"
          >
            Save profile
          </button>
          <Link className="text-sm font-semibold text-slate-600" to="/tasks">Skip for now</Link>
        </div>
      </form>
    </main>
  );
}

export const Component = RegisterPage;
