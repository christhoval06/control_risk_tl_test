import { TaskStatusBadge } from './TaskStatusBadge';
import type { TaskItem, TaskStatus } from '@features/tasks/types';

interface Props {
  tasks: TaskItem[];
  isLoading: boolean;
  onStatusChange: (task: TaskItem, status: TaskStatus) => Promise<void>;
  onDelete: (task: TaskItem) => Promise<void>;
}

const statuses: TaskStatus[] = ['Pending', 'In Progress', 'Done'];

export function TaskList({ tasks, isLoading, onStatusChange, onDelete }: Props) {
  if (isLoading) return <div className="task-panel text-slate-500">Loading tasks...</div>;
  if (tasks.length === 0) return <div className="task-panel text-slate-500">No tasks match the current filters.</div>;

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <article className="task-panel grid gap-4 md:grid-cols-[minmax(0,1fr)_170px]" key={task.id}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-950">{task.title}</h3>
              <TaskStatusBadge status={task.status} />
            </div>
            {task.description && <p className="mt-2 text-sm text-slate-500">{task.description}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'Unscheduled'}</span>
              <span>Assigned: {task.assignedTo || 'Unassigned'}</span>
            </div>
          </div>
          <div className="grid content-start gap-2">
            <select className="form-field py-1 text-sm" value={task.status}
              onChange={(event) => void onStatusChange(task, event.target.value as TaskStatus)}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
              onClick={() => void onDelete(task)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
