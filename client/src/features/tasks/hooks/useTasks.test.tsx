import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTaskStore } from '@stores/taskStore';
import { useTasks } from './useTasks';
import type { TaskItem } from '@features/tasks/types';

const generated = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
  remove: vi.fn(),
  refetch: vi.fn(),
  toast: vi.fn()
}));

vi.mock('@api/hooks/default/useListTasks', () => ({
  listTasksQueryKey: ({ query }: { query?: unknown } = {}) => [{ url: '/tasks' }, ...(query ? [query] : [])],
  useListTasks: generated.list
}));

vi.mock('@api/hooks/default/useCreateTask', () => ({
  useCreateTask: generated.create
}));

vi.mock('@api/hooks/default/useUpdateTaskStatus', () => ({
  useUpdateTaskStatus: generated.updateStatus
}));

vi.mock('@api/hooks/default/useDeleteTask', () => ({
  useDeleteTask: generated.remove
}));

vi.mock('@hooks/useToast', () => ({
  useToast: () => ({ toast: generated.toast })
}));

const task: TaskItem = {
  id: 'task-1',
  title: 'Review risk report',
  description: 'Check exposure',
  status: 'Pending',
  dueDate: '2026-08-22T12:00:00Z',
  createdBy: 'owner-1',
  assignedTo: 'Ana',
  createdAt: '2026-08-21T12:00:00Z',
  updatedAt: '2026-08-21T12:00:00Z'
};

describe('useTasks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    useTaskStore.getState().reset();
    generated.toast.mockClear();
    generated.refetch.mockResolvedValue({
      data: { data: { items: [task], page: 1, pageSize: 20 }, code: 'TASKS_LISTED', status: 'ok', message: 'Tasks listed successfully.' }
    });
    generated.list.mockReturnValue({
      data: { data: { items: [task], page: 1, pageSize: 20 }, code: 'TASKS_LISTED', status: 'ok', message: 'Tasks listed successfully.' },
      isFetching: false,
      isError: false,
      refetch: generated.refetch
    });
    generated.create.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(task), isPending: false, isError: false });
    generated.updateStatus.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ ...task, status: 'Done' }), isError: false });
    generated.remove.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(undefined), isError: false });
  });

  it('uses generated query and mutation hooks for task operations', async () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useTasks('access-token'), { wrapper });
    const input = { title: task.title, description: task.description };

    expect(result.current.tasks).toEqual([task]);
    expect(generated.list).toHaveBeenCalledWith(
      { query: expect.objectContaining({ sortBy: 'dueDate' }) },
      expect.objectContaining({ client: expect.objectContaining({ auth: 'access-token' }) })
    );

    await act(async () => {
      await result.current.submitTask(input);
      await result.current.changeStatus(task, 'Done');
      await result.current.removeTask(task);
    });

    expect(generated.create().mutateAsync).toHaveBeenCalledWith({ body: input });
    expect(generated.updateStatus().mutateAsync).toHaveBeenCalledWith({ path: { id: task.id }, body: { status: 'Done' } });
    expect(generated.remove().mutateAsync).toHaveBeenCalledWith({ path: { id: task.id } });
    expect(generated.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Task created', variant: 'success' }));
    expect(generated.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Task moved', variant: 'success' }));
    expect(generated.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Task deleted', variant: 'success' }));
  });

  it('notifies the user when a task operation fails', async () => {
    const create = { mutateAsync: vi.fn().mockRejectedValue(new Error('failed')), isPending: false, isError: false };
    generated.create.mockReturnValue(create);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useTasks('access-token'), { wrapper });

    await act(async () => {
      await result.current.submitTask({ title: task.title });
    });

    expect(generated.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Unable to save task',
      variant: 'error'
    }));
  });
});
