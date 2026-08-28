import { Link } from 'react-router';

interface BrokerLoginPanelProps {
  isReady: boolean;
  isBusy: boolean;
  error: string | null;
  onLogin: () => void;
}

export function BrokerLoginPanel({ isReady, isBusy, error, onLogin }: BrokerLoginPanelProps) {
  return (
    <>
      <p className="mt-3 text-sm text-slate-600">
        Sign in through Microsoft Entra. Google, GitHub, and Microsoft are configured as identity providers in the
        broker.
      </p>
      <div className="mt-6 grid gap-3">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!isReady || isBusy}
          onClick={onLogin}
        >
          Continue with Microsoft Entra
        </button>
        {!isReady && (
          <p className="text-sm text-slate-500">
            Configure `VITE_AUTH_CLIENT_ID`, `VITE_AUTH_AUTHORITY`, and `VITE_AUTH_SCOPE`.
          </p>
        )}
      </div>
      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <p className="mt-5 text-sm text-slate-600">
        New to the app?{' '}
        <Link className="font-semibold text-teal-700" to="/register">
          Complete your profile
        </Link>
      </p>
    </>
  );
}
