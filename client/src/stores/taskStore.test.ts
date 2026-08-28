import { beforeEach, describe, expect, it } from 'vitest';
import { useTaskStore } from './taskStore';
import type { TaskItem } from '@features/tasks/types';

const task: TaskItem = {
  id: 'task-1',
  title: 'Pay invoice',
  status: 'Pending',
  createdBy: 'user-1',
  createdAt: '2026-08-22T00:00:00Z',
  updatedAt: '2026-08-22T00:00:00Z'
};

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.getState().reset();
  });

  it('stores tasks and merges query updates without losing paging defaults', () => {
    useTaskStore.getState().setTasks([task]);
    useTaskStore.getState().setQuery({ search: 'invoice' });

    expect(useTaskStore.getState().tasks).toEqual([task]);
    expect(useTaskStore.getState().query).toMatchObject({
      search: 'invoice',
      page: 1,
      pageSize: 20
    });
  });

  it('updates task status from stream events', () => {
    useTaskStore.getState().setTasks([task]);

    useTaskStore.getState().updateTaskStatus(task.id, 'In Progress');

    expect(useTaskStore.getState().tasks[0].status).toBe('In Progress');
  });
});
