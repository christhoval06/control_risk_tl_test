import type {
  CreateTaskRequest,
  TaskListResponse as GeneratedTaskListResponse,
  TaskResponse,
  TaskStatusKey
} from '@api/types';

export type TaskStatus = TaskStatusKey;
export type TaskItem = TaskResponse;

export interface TaskQuery {
  status?: TaskStatus | '';
  assignedTo?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
}

export interface NormalizedTaskQuery {
  status?: TaskStatus;
  assignedTo?: string;
  search?: string;
  sortBy: 'dueDate' | 'status' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export type CreateTaskInput = CreateTaskRequest;
export type TaskListResponse = GeneratedTaskListResponse;
