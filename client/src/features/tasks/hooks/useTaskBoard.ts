import { useCallback, useMemo } from 'react';
import { useAuth } from '@features/auth/providers/AuthProvider';
import { taskStatuses } from '@features/tasks/constants';
import { useTaskStatusStream } from '@features/tasks/hooks/useTaskStatusStream';
import { useTasks } from '@features/tasks/hooks/useTasks';
import type { TaskStatus } from '@features/tasks/types';
import { useTaskStore } from '@stores/taskStore';

export function useTaskBoard() {
  const { token } = useAuth();
  const board = useTasks(token);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);
  const applyStatusEvent = useCallback(
    (event: { id: string; status: Parameters<typeof updateTaskStatus>[1] }) => {
      updateTaskStatus(event.id, event.status);
    },
    [updateTaskStatus],
  );

  useTaskStatusStream(token, applyStatusEvent);

  const tasksByStatus = useMemo(
    () =>
      Object.fromEntries(
        taskStatuses.map((status) => [status, board.tasks.filter((task) => task.status === status)]),
      ) as Record<TaskStatus, typeof board.tasks>,
    [board.tasks],
  );
  const taskById = useMemo(() => new Map(board.tasks.map((task) => [task.id, task])), [board.tasks]);

  return useMemo(
    () => ({
      ...board,
      taskById,
      tasksByStatus,
    }),
    [board, taskById, tasksByStatus],
  );
}
