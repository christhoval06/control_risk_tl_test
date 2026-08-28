import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTask } from '@api/hooks/default/useCreateTask';
import { useDeleteTask } from '@api/hooks/default/useDeleteTask';
import { listTasksQueryKey, useListTasks } from '@api/hooks/default/useListTasks';
import { useUpdateTaskStatus } from '@api/hooks/default/useUpdateTaskStatus';
import { apiBaseUrl } from '@configs/api';
import { useTaskStore } from '@stores/taskStore';
import { normalizeTaskQuery } from '@features/tasks/utils/query';
import { useToast } from '@hooks/useToast';
import type { CreateTaskInput, TaskItem, TaskStatus } from '@features/tasks/types';

export function useTasks(token: string) {
  const queryClient = useQueryClient();
  const query = useTaskStore((state) => state.query);
  const storeTasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setQuery = useTaskStore((state) => state.setQuery);
  const { toast } = useToast();
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
  const listedTasks = listQuery.data?.data?.items;

  useEffect(() => {
    if (listedTasks) {
      setTasks(listedTasks);
    }
  }, [listedTasks, setTasks]);

  const refreshTasks = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: listTasksQueryKey({ query: normalizedQuery }) });
    await listQuery.refetch();
  }, [listQuery.refetch, normalizedQuery, queryClient]);

  const loadTasks = useCallback(async () => {
    if (!token) return;
    setActionError(null);
    try {
      await refreshTasks();
    } catch {
      setActionError('Unable to load tasks.');
      toast({
        title: 'Unable to load tasks',
        description: 'Please try again in a moment.',
        variant: 'error'
      });
    }
  }, [refreshTasks, toast, token]);

  const submitTask = useCallback(async (input: CreateTaskInput) => {
    if (!token) return;
    setActionError(null);
    try {
      await createMutation.mutateAsync({ body: input });
      await refreshTasks();
      toast({
        title: 'Task created',
        description: 'The task was added to the board.',
        variant: 'success'
      });
    } catch {
      setActionError('Unable to save task.');
      toast({
        title: 'Unable to save task',
        description: 'Please review the task details and try again.',
        variant: 'error'
      });
    }
  }, [createMutation.mutateAsync, refreshTasks, toast, token]);

  const changeStatus = useCallback(async (task: TaskItem, status: TaskStatus) => {
    if (!token) return;
    setActionError(null);
    try {
      await updateStatusMutation.mutateAsync({ path: { id: task.id }, body: { status } });
      await refreshTasks();
      toast({
        title: 'Task moved',
        description: `${task.title} moved to ${status}.`,
        variant: 'success'
      });
    } catch {
      setActionError('Unable to update task status.');
      toast({
        title: 'Unable to move task',
        description: 'The status change was not saved.',
        variant: 'error'
      });
    }
  }, [refreshTasks, toast, token, updateStatusMutation.mutateAsync]);

  const removeTask = useCallback(async (task: TaskItem) => {
    if (!token) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync({ path: { id: task.id } });
      await refreshTasks();
      toast({
        title: 'Task deleted',
        description: `${task.title} was removed.`,
        variant: 'success'
      });
    } catch {
      setActionError('Unable to delete task.');
      toast({
        title: 'Unable to delete task',
        description: 'The task could not be removed.',
        variant: 'error'
      });
    }
  }, [deleteMutation.mutateAsync, refreshTasks, toast, token]);

  return useMemo(() => ({
    tasks: storeTasks,
    query,
    setQuery,
    isLoading: listQuery.isFetching,
    isSaving: createMutation.isPending,
    error: actionError ?? (listQuery.isError ? 'Unable to load tasks.' : null),
    loadTasks,
    submitTask,
    changeStatus,
    removeTask
  }), [actionError, changeStatus, createMutation.isPending, listQuery.isError, listQuery.isFetching, loadTasks, query, removeTask, setQuery, storeTasks, submitTask]);
}
