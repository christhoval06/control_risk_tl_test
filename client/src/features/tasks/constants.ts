import type { TaskStatus } from './types';

export const taskStatuses: TaskStatus[] = ['Pending', 'In Progress', 'Done'];

export const taskStatusMeta: Record<TaskStatus, { label: string; accent: string; description: string }> = {
  Pending: {
    label: 'Pending',
    accent: 'bg-amber-500',
    description: 'Work queued for triage',
  },
  'In Progress': {
    label: 'In Progress',
    accent: 'bg-blue-600',
    description: 'Active work in motion',
  },
  Done: {
    label: 'Done',
    accent: 'bg-emerald-600',
    description: 'Completed and closed',
  },
};
