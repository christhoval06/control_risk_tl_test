import { TokenPanel } from '@features/auth/components/TokenPanel';
import { useAuth } from '@features/auth/providers/AuthProvider';
import { TaskFilters } from '@features/tasks/components/TaskFilters';
import { TaskForm } from '@features/tasks/components/TaskForm';
import { TaskList } from '@features/tasks/components/TaskList';
import { useTasks } from '@features/tasks/hooks/useTasks';

function TaskManagementPage() {
  const { token } = useAuth();
  const tasks = useTasks(token);

  return (
    <main className="mx-auto min-h-screen w-[min(1180px,calc(100%-32px))] py-8">
      <section className="mb-6 grid gap-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-bold uppercase text-mint">Azure task workspace</p>
          <h1 className="text-4xl font-black leading-none text-slate-950 sm:text-6xl">Task Management</h1>
        </div>
        <button className="rounded-md border border-slate-950 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          onClick={() => void tasks.loadTasks()} disabled={!token || tasks.isLoading}>
          Refresh
        </button>
      </section>

      <div className="grid gap-4">
        <TokenPanel />
        {tasks.error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700" role="alert">{tasks.error}</div>}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4">
            <TaskFilters query={tasks.query} onChange={tasks.setQuery} />
            <TaskList tasks={tasks.tasks} isLoading={tasks.isLoading}
              onStatusChange={tasks.changeStatus} onDelete={tasks.removeTask} />
          </div>
          <TaskForm isSaving={tasks.isSaving} onSubmit={tasks.submitTask} />
        </div>
      </div>
    </main>
  );
}

export const Component = TaskManagementPage;
