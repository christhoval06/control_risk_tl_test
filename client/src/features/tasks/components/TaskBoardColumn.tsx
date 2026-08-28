import { taskStatusMeta } from '@features/tasks/constants';
import type { TaskItem, TaskStatus } from '@features/tasks/types';
import { cn } from '@utils/cn';
import { memo, useCallback, useState, type DragEvent } from 'react';
import { TaskCard, TaskCardSkeleton } from './TaskCard';

const skeletonCards = [0, 1];

interface TaskBoardColumnProps {
  status: TaskStatus;
  tasks: TaskItem[];
  isLoading: boolean;
  onDelete: (task: TaskItem) => Promise<void>;
  onTaskDrop: (taskId: string, status: TaskStatus) => void;
  onStatusChange: (task: TaskItem, status: TaskStatus) => Promise<void>;
}

function TaskBoardColumnComponent({
  status,
  tasks,
  isLoading,
  onDelete,
  onTaskDrop,
  onStatusChange,
}: TaskBoardColumnProps) {
  const meta = taskStatusMeta[status];
  const [isDragOver, setIsDragOver] = useState(false);

  const leaveLane = useCallback(() => setIsDragOver(false), []);
  const dragOverLane = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);
  const dropTask = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      const taskId = event.dataTransfer.getData('text/plain');
      if (taskId) onTaskDrop(taskId, status);
    },
    [onTaskDrop, status],
  );

  return (
    <section
      aria-label={`${meta.label} tasks`}
      className={cn(
        'kanban-swimlane grid min-h-130 content-start gap-3 rounded-md border border-slate-200 p-3 shadow-sm transition dark:border-slate-800',
        isDragOver && 'border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-400/10',
      )}
      onDragLeave={leaveLane}
      onDragOver={dragOverLane}
      onDrop={dropTask}
      role="region"
    >
      <header className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', meta.accent)} />
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              {meta.label}
            </h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{meta.description}</p>
        </div>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {tasks.length}
        </span>
      </header>
      <div className="grid gap-3 pb-1">
        {isLoading ? (
          skeletonCards.map((index) => <TaskCardSkeleton key={`${status}-${index}`} />)
        ) : tasks.length === 0 ? (
          <div className="flex min-h-40 flex-1 flex-col items-center rounded-md border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
            No tasks in this row.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </section>
  );
}

export const TaskBoardColumn = memo(TaskBoardColumnComponent);
