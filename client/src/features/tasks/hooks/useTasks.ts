import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTask } from '@api/hooks/default/useCreateTask';
import { useDeleteTask } from '@api/hooks/default/useDeleteTask';
import { listTasksQueryKey, useListTasks } from '@api/hooks/default/useListTasks';
import { useUpdateTaskStatus } from '@api/hooks/default/useUpdateTaskStatus';
import { apiBaseUrl } from '@configs/api';
import { useTaskStore } from '@stores/taskStore';
import { normalizeTaskQuery } from '@features/tasks/utils/query';
import type { CreateTaskInput, TaskItem, TaskStatus } from '@features/tasks/types';

export function useTasks(token: string) {
  const queryClient = useQueryClient();
  const query = useTaskStore((state) => state.query);
  const setQuery = useTaskStore((state) => state.setQuery);
  const [actionError, setActionError] = useState<string | null>(null);
  const normalizedQuery = useMemo(() => normalizeTaskQuery(query), [query]);
  const clientConfig = useMemo(() => ({ baseURL: apiBaseUrl, auth: token }), [token]);

  const listQuery = useListTasks(
    { query: normalizedQuery },
    {
      client: clientConfig,
      query: { enabled: Boolean(token) }
    }
  );

  const createMutation = useCreateTask({ client: clientConfig });
  const updateStatusMutation = useUpdateTaskStatus({ client: clientConfig });
  const deleteMutation = useDeleteTask({ client: clientConfig });

  const refreshTasks = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: listTasksQueryKey({ query: normalizedQuery }) });
    await listQuery.refetch();
  }, [listQuery, normalizedQuery, queryClient]);

  const loadTasks = useCallback(async () => {
    if (!token) return;
    setActionError(null);
    try {
      await refreshTasks();
    } catch {
      setActionError('Unable to load tasks.');
    }
  }, [refreshTasks, token]);

  const submitTask = useCallback(async (input: CreateTaskInput) => {
    if (!token) return;
    setActionError(null);
    try {
      await createMutation.mutateAsync({ body: input });
      await refreshTasks();
    } catch {
      setActionError('Unable to save task.');
    }
  }, [createMutation, refreshTasks, token]);

  const changeStatus = useCallback(async (task: TaskItem, status: TaskStatus) => {
    if (!token) return;
    await updateStatusMutation.mutateAsync({ path: { id: task.id }, body: { status } });
    await refreshTasks();
  }, [refreshTasks, token, updateStatusMutation]);

  const removeTask = useCallback(async (task: TaskItem) => {
    if (!token) return;
    await deleteMutation.mutateAsync({ path: { id: task.id } });
    await refreshTasks();
  }, [deleteMutation, refreshTasks, token]);

  return useMemo(() => ({
    tasks: listQuery.data?.items ?? [],
    query,
    setQuery,
    isLoading: listQuery.isFetching,
    isSaving: createMutation.isPending,
    error: actionError ?? (listQuery.isError ? 'Unable to load tasks.' : null),
    loadTasks,
    submitTask,
    changeStatus,
    removeTask
  }), [actionError, changeStatus, createMutation.isPending, listQuery.data?.items, listQuery.isError, listQuery.isFetching, loadTasks, query, removeTask, setQuery, submitTask]);
}
