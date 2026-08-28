import { useCallback, useState } from 'react';
import { Button } from '@components/ui';
import { taskStatuses } from '@features/tasks/constants';
import { useTaskBoard } from '@features/tasks/hooks/useTaskBoard';
import type { TaskStatus } from '@features/tasks/types';
import { TaskBoardColumn } from './TaskBoardColumn';
import { TaskCreateModal } from './TaskCreateModal';
import { TaskFilters } from './TaskFilters';

export function TaskBoard() {
  const board = useTaskBoard();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const dropTaskIntoStatus = useCallback((taskId: string, status: TaskStatus) => {
    const task = board.taskById.get(taskId);
    if (!task || task.status === status) return;
    void board.changeStatus(task, status);
  }, [board.changeStatus, board.taskById]);

  return (
    <section className="grid gap-4">
      <div className="task-panel grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Board</h2>
            <p className="text-sm text-slate-500">{board.tasks.length} issues across 3 statuses</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setIsCreateOpen(true)}>Create task</Button>
            <Button disabled={board.isLoading} onClick={() => void board.loadTasks()} variant="outline">Refresh</Button>
          </div>
        </div>
        <TaskFilters query={board.query} onChange={board.setQuery} />
        {board.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{board.error}</div>}
        <div className="grid gap-3 rounded-lg bg-slate-200/70 p-3 lg:grid-cols-3" data-testid="task-board">
          {taskStatuses.map((status) => (
            <TaskBoardColumn
              key={status}
              status={status}
              tasks={board.tasksByStatus[status]}
              isLoading={board.isLoading}
              onDelete={board.removeTask}
              onTaskDrop={dropTaskIntoStatus}
              onStatusChange={board.changeStatus}
            />
          ))}
        </div>
      </div>
      <TaskCreateModal isOpen={isCreateOpen} isSaving={board.isSaving}
        onClose={() => setIsCreateOpen(false)} onSubmit={board.submitTask} />
    </section>
  );
}
