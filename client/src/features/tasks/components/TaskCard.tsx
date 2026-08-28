import { Button, Skeleton } from '@components/ui';
import { taskStatuses } from '@features/tasks/constants';
import type { TaskItem, TaskStatus } from '@features/tasks/types';
import { memo, type DragEvent } from 'react';
import { TaskStatusBadge } from './TaskStatusBadge';

interface TaskCardProps {
  task: TaskItem;
  onDelete: (task: TaskItem) => Promise<void>;
  onStatusChange: (task: TaskItem, status: TaskStatus) => Promise<void>;
}

function TaskCardComponent({ task, onDelete, onStatusChange }: TaskCardProps) {
  const statusIndex = taskStatuses.indexOf(task.status);
  const previousStatus = taskStatuses[statusIndex - 1];
  const nextStatus = taskStatuses[statusIndex + 1];

  function startDrag(event: DragEvent<HTMLElement>) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
  }

  return (
    <article
      className="cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md active:cursor-grabbing"
      draggable
      onDragStart={startDrag}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-5 text-slate-950">{task.title}</h3>
        <TaskStatusBadge status={task.status} />
      </div>
      {task.description && <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">{task.description}</p>}
      <dl className="mt-3 grid gap-1.5 text-xs text-slate-500">
        <div className="flex justify-between gap-3">
          <dt className="font-semibold text-slate-700">Owner</dt>
          <dd className="truncate">{task.assignedTo || 'Unassigned'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="font-semibold text-slate-700">Due</dt>
          <dd>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Unscheduled'}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
        {previousStatus && (
          <Button size="sm" variant="ghost" onClick={() => void onStatusChange(task, previousStatus)}>
            Move back
          </Button>
        )}
        {nextStatus && (
          <Button size="sm" variant="secondary" onClick={() => void onStatusChange(task, nextStatus)}
            aria-label={`Move ${task.title} to ${nextStatus}`}>
            Move to {nextStatus}
          </Button>
        )}
        <Button className="ml-auto text-red-700 hover:bg-red-50" size="sm" variant="ghost" onClick={() => void onDelete(task)}>Delete</Button>
      </div>
    </article>
  );
}

export const TaskCard = memo(TaskCardComponent);

export function TaskCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
      data-testid="task-card-skeleton"
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-3 grid gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex justify-between gap-3">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="mt-3 flex justify-between gap-2 border-t border-slate-100 pt-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </article>
  );
}
