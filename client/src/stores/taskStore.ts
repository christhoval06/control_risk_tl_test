import { create } from 'zustand';
import type { TaskItem, TaskQuery } from '@features/tasks/types';

const initialQuery: TaskQuery = { sortBy: 'dueDate', sortDirection: 'asc', page: 1, pageSize: 20 };

interface TaskState {
  tasks: TaskItem[];
  query: TaskQuery;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  setTasks: (tasks: TaskItem[]) => void;
  upsertTask: (task: TaskItem) => void;
  updateTaskStatus: (id: string, status: TaskItem['status']) => void;
  removeTaskById: (id: string) => void;
  setQuery: (query: TaskQuery) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  query: initialQuery,
  isLoading: false,
  isSaving: false,
  error: null,
  setTasks: (tasks) => set({ tasks }),
  upsertTask: (task) =>
    set((state) => ({
      tasks: state.tasks.some((item) => item.id === task.id)
        ? state.tasks.map((item) => (item.id === task.id ? task : item))
        : [task, ...state.tasks],
    })),
  updateTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, status } : task)),
    })),
  removeTaskById: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  setQuery: (query) => set((state) => ({ query: { ...state.query, ...query } })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
  reset: () => set({ tasks: [], query: initialQuery, isLoading: false, isSaving: false, error: null }),
}));
