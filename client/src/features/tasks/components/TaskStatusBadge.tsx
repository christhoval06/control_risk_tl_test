import type { TaskStatus } from '@features/tasks/types';

const badgeClass: Record<TaskStatus, string> = {
  Pending: 'bg-slate-200 text-slate-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Done: 'bg-emerald-100 text-emerald-700'
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass[status]}`}>{status}</span>;
}
