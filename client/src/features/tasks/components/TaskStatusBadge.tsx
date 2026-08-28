import type { TaskStatus } from '@features/tasks/types';

const badgeClass: Record<TaskStatus, string> = {
  Pending: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200',
  Done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass[status]}`}>
      {status}
    </span>
  );
}
