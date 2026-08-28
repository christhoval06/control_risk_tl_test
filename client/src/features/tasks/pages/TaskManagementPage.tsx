import { useAuth } from '@features/auth/providers/AuthProvider';
import { useLogout } from '@api/hooks/default/useLogout';
import { Button } from '@components/ui';
import { apiBaseUrl } from '@configs/api';
import { TaskBoard } from '@features/tasks/components/TaskBoard';
import { Link, useNavigate } from 'react-router';

function TaskManagementPage() {
  const navigate = useNavigate();
  const { token, account, logout } = useAuth();
  const logoutMutation = useLogout({ client: { baseURL: apiBaseUrl, auth: token } });

  const closeSession = async () => {
    try {
      await logoutMutation.mutateAsync(undefined);
    } finally {
      await logout();
      navigate('/login');
    }
  };

  return (
    <main className="mx-auto min-h-screen w-[min(1440px,calc(100%-32px))] py-8">
      <section className="task-panel mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-3xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Task operations</p>
          <h1 className="text-4xl font-black leading-none text-slate-950 sm:text-5xl">Task Management</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Track ownership, due dates, and delivery status across the team in a compact Kanban workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Link className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" to="/register">
            Profile
          </Link>
          <Button variant="outline"
            onClick={() => void closeSession()}>
            Logout
          </Button>
        </div>
      </section>

      <div className="grid gap-4">
        <section className="task-panel flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Workspace session</h2>
            <p className="text-sm text-slate-500">{account?.username ?? 'Authenticated with external identity provider.'}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">Connected</span>
        </section>
        <TaskBoard />
      </div>
    </main>
  );
}

export const Component = TaskManagementPage;
