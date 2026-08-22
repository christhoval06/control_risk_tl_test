import { useState } from 'react';
import { useAuth } from '@features/auth/providers/AuthProvider';

export function TokenPanel() {
  const { token, setToken, clearToken, isMsalReady, login, logout, account } = useAuth();
  const [draft, setDraft] = useState(token);

  return (
    <section className="task-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Authentication</h2>
          <p className="text-sm text-slate-500">{account?.username ?? 'Use Microsoft login or paste a local bearer token.'}</p>
        </div>
        {token && <button className="rounded-md border px-3 py-1 text-sm text-slate-600" onClick={clearToken}>Clear</button>}
      </div>
      {isMsalReady && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => void login()}>Microsoft login</button>
          <button className="rounded-md border px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => void logout()}>Logout</button>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="form-field" type="password" value={draft}
          onChange={(event) => setDraft(event.target.value)} placeholder="eyJ..." aria-label="Bearer token" />
        <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => setToken(draft.trim())}>Use token</button>
      </div>
    </section>
  );
}
