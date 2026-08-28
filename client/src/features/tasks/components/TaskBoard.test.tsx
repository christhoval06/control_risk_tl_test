import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskBoard } from './TaskBoard';
import type { TaskItem } from '@features/tasks/types';

const board = vi.hoisted(() => ({
  changeStatus: vi.fn(),
  removeTask: vi.fn(),
  state: {
    isLoading: false,
  },
}));

const tasks: TaskItem[] = [
  task({ id: '1', title: 'Review risk register', status: 'Pending' }),
  task({ id: '2', title: 'Assign control owner', status: 'In Progress' }),
  task({ id: '3', title: 'Archive evidence', status: 'Done' }),
];
const tasksByStatus = {
  Pending: tasks.filter((task) => task.status === 'Pending'),
  'In Progress': tasks.filter((task) => task.status === 'In Progress'),
  Done: tasks.filter((task) => task.status === 'Done'),
};
const taskById = new Map(tasks.map((task) => [task.id, task]));

vi.mock('@features/tasks/hooks/useTaskBoard', () => ({
  useTaskBoard: () => ({
    tasks,
    taskById,
    tasksByStatus,
    query: { sortBy: 'dueDate', sortDirection: 'asc' },
    setQuery: vi.fn(),
    isLoading: board.state.isLoading,
    isSaving: false,
    error: null,
    loadTasks: vi.fn(),
    submitTask: vi.fn(),
    changeStatus: board.changeStatus,
    removeTask: board.removeTask,
  }),
}));

describe('TaskBoard', () => {
  beforeEach(() => {
    board.state.isLoading = false;
    board.changeStatus.mockClear();
    board.removeTask.mockClear();
  });

  it('groups hook-managed tasks into three status columns', () => {
    render(<TaskBoard />);

    expect(screen.getByTestId('task-board')).toHaveClass('lg:grid-cols-3');
    expect(screen.getByRole('region', { name: /pending/i })).toHaveClass('kanban-swimlane');
    expect(screen.getByRole('region', { name: /pending/i })).toHaveTextContent('Review risk register');
    expect(screen.getByRole('region', { name: /in progress/i })).toHaveTextContent('Assign control owner');
    expect(screen.getByRole('region', { name: /done/i })).toHaveTextContent('Archive evidence');
  });

  it('keeps the kanban columns visible with animated task skeletons while loading', () => {
    board.state.isLoading = true;

    render(<TaskBoard />);

    expect(screen.getByTestId('task-board')).toHaveClass('lg:grid-cols-3');
    expect(screen.getAllByTestId('task-card-skeleton')).toHaveLength(6);
    expect(screen.queryByText('Loading task board...')).not.toBeInTheDocument();
  });

  it('moves a task to the next status from the card action', async () => {
    render(<TaskBoard />);

    await userEvent.click(screen.getByRole('button', { name: /move review risk register to in progress/i }));

    expect(board.changeStatus).toHaveBeenCalledWith(tasks[0], 'In Progress');
  });

  it('updates status when a task is dropped into another status column', () => {
    render(<TaskBoard />);
    const pendingTask = screen.getByText('Review risk register').closest('article')!;
    const doneColumn = screen.getByRole('region', { name: /done/i });

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(pendingTask, { dataTransfer });
    fireEvent.drop(doneColumn, { dataTransfer });

    expect(board.changeStatus).toHaveBeenCalledWith(tasks[0], 'Done');
  });

  it('does not update status when a task is dropped into the same column', () => {
    render(<TaskBoard />);
    const pendingTask = screen.getByText('Review risk register').closest('article')!;
    const pendingColumn = screen.getByRole('region', { name: /pending/i });

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(pendingTask, { dataTransfer });
    fireEvent.drop(pendingColumn, { dataTransfer });

    expect(board.changeStatus).not.toHaveBeenCalled();
  });
});

function createDataTransfer() {
  const data = new Map<string, string>();
  return {
    effectAllowed: '',
    dropEffect: '',
    getData: (type: string) => data.get(type) ?? '',
    setData: (type: string, value: string) => {
      data.set(type, value);
    },
  };
}

function task(overrides: Pick<TaskItem, 'id' | 'title' | 'status'>): TaskItem {
  return {
    description: '',
    dueDate: '',
    assignedTo: '',
    createdAt: '2026-08-22T12:00:00Z',
    createdBy: 'owner-1',
    updatedAt: '2026-08-22T12:00:00Z',
    ...overrides,
  };
}
