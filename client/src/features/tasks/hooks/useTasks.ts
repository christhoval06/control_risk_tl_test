import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTask } from '@api/hooks/default/useCreateTask';
import { useDeleteTask } from '@api/hooks/default/useDeleteTask';
import { listTasksQueryKey, useListTasks } from '@api/hooks/default/useListTasks';
import { useUpdateTaskStatus } from '@api/hooks/default/useUpdateTaskStatus';
import { apiBaseUrl } from '@configs/api';
import { useTaskStore } from '@stores/taskStore';
import { normalizeTaskQuery } from '@features/tasks/utils/query';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { useToast } from '@hooks/useToast';
import type { CreateTaskInput, TaskItem, TaskStatus } from '@features/tasks/types';

export function useTasks(token: string) {
  const queryClient = useQueryClient();
  const query = useTaskStore((state) => state.query);
  const storeTasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setQuery = useTaskStore((state) => state.setQuery);
  const { toast } = useToast();
  const handleError = useErrorHandler();
  const [actionError, setActionError] = useState<string | null>(null);
  const normalizedQuery = useMemo(() => normalizeTaskQuery(query), [query]);
  const clientConfig = useMemo(() => ({ baseURL: apiBaseUrl, auth: token }), [token]);

  const listQuery = useListTasks(
    { query: normalizedQuery },
    {
      client: clientConfig,
      query: { enabled: Boolean(token) },
    },
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
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'Unable to load tasks.',
        title: 'Unable to load tasks',
        setError: setActionError,
      });
    }
  }, [handleError, refreshTasks, token]);

  const submitTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!token) return;
      setActionError(null);
      try {
        await createMutation.mutateAsync({ body: input });
        await refreshTasks();
        toast({
          title: 'Task created',
          description: 'The task was added to the board.',
          variant: 'success',
        });
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'Unable to save task.',
          title: 'Unable to save task',
          setError: setActionError,
        });
      }
    },
    [createMutation.mutateAsync, handleError, refreshTasks, toast, token],
  );

  const changeStatus = useCallback(
    async (task: TaskItem, status: TaskStatus) => {
      if (!token) return;
      setActionError(null);
      try {
        await updateStatusMutation.mutateAsync({ path: { id: task.id }, body: { status } });
        await refreshTasks();
        toast({
          title: 'Task moved',
          description: `${task.title} moved to ${status}.`,
          variant: 'success',
        });
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'Unable to update task status.',
          title: 'Unable to move task',
          setError: setActionError,
        });
      }
    },
    [handleError, refreshTasks, toast, token, updateStatusMutation.mutateAsync],
  );

  const removeTask = useCallback(
    async (task: TaskItem) => {
      if (!token) return;
      setActionError(null);
      try {
        await deleteMutation.mutateAsync({ path: { id: task.id } });
        await refreshTasks();
        toast({
          title: 'Task deleted',
          description: `${task.title} was removed.`,
          variant: 'success',
        });
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'Unable to delete task.',
          title: 'Unable to delete task',
          setError: setActionError,
        });
      }
    },
    [deleteMutation.mutateAsync, handleError, refreshTasks, toast, token],
  );

  return useMemo(
    () => ({
      tasks: storeTasks,
      query,
      setQuery,
      isLoading: listQuery.isFetching,
      isSaving: createMutation.isPending,
      error: actionError ?? (listQuery.isError ? 'Unable to load tasks.' : null),
      loadTasks,
      submitTask,
      changeStatus,
      removeTask,
    }),
    [
      actionError,
      changeStatus,
      createMutation.isPending,
      listQuery.isError,
      listQuery.isFetching,
      loadTasks,
      query,
      removeTask,
      setQuery,
      storeTasks,
      submitTask,
    ],
  );
}
